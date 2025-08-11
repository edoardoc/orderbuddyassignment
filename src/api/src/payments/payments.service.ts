import { Injectable } from '@nestjs/common';
import { emergepaySdk, TransactionType } from 'emergepay-sdk';
import { InjectClient } from 'nest-mongodb-driver';
import { Db, ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import axios from 'axios';
import { CreateOrderDto, OrderItemDto } from './dtos/payments.controller.dto';
import { MenuService } from '../menu/menu.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { COLLECTIONS } from 'src/db/collections';
import { logger } from 'src/logger/pino.logger';
import { json } from 'stream/consumers';

@Injectable()
export class PaymentsService {
  private readonly locationCollection;
  private readonly logger: typeof logger;

  constructor(
    private readonly menuService: MenuService,
    private readonly configService: ConfigService,
    @InjectClient() private readonly db: Db,
  ) {
    this.locationCollection = db.collection(COLLECTIONS.LOCATIONS);
    this.logger = logger.child({ context: 'PaymentsService' });
  }

  async startTransaction(restaurantId: string) {
    let emergepay: any;
    const projection = { payment: 1 };
    const PaymentDetails = await this.locationCollection.findOne({ restaurantId: restaurantId }, { projection });
    const oid = PaymentDetails.payment.oid;
    const authToken = PaymentDetails.payment.auth;
    const environmentUrl = this.configService.get<string>('EMERGEPAY_ENVIRONMENT_URL');
    if (!oid || !authToken) {
      throw new Error('EmergePay credentials not found');
    }
    if (!environmentUrl) {
      throw new Error('EmergePay environment URL not found');
    }
    emergepay = new emergepaySdk({
      oid,
      authToken,
      environmentUrl,
    });

    const config = {
      transactionType: TransactionType.CreditSale,
      method: 'hostedFields',
      submissionType: 'manual',
    };

    try {
      const transactionToken = await emergepay.startTransaction(config);
      return { transactionToken };
    } catch (error) {
      throw error;
    }
  }

  async completeTranscation(body: CreateOrderDto, requestId: string) {
    let emergepay: any;
    const projection = { payment: 1 };
    const PaymentDetails = await this.locationCollection.findOne({ restaurantId: body.restaurantId }, { projection });
    const oid = PaymentDetails.payment.oid;
    const authToken = PaymentDetails.payment.auth;
    const environmentUrl = this.configService.get<string>('EMERGEPAY_ENVIRONMENT_URL');
    if (!environmentUrl) {
      throw new Error('EmergePay environment URL not found');
    }
    emergepay = new emergepaySdk({
      oid,
      authToken,
      environmentUrl,
    });

    const orderTotalPrice = body.items.reduce(
      (accumulator: number, currentValue: OrderItemDto) => accumulator + currentValue.price,
      0,
    );
    const orderTotalPriceInDollars = orderTotalPrice / 100;

    const taxRate = this.configService.get<number>('TAX_RATE');
    if (!taxRate) {
      throw new Error('taxRate not found');
    }
    const totalPriceWithTax = (orderTotalPriceInDollars + orderTotalPriceInDollars * taxRate).toFixed(2);
    if (!emergepay) {
      throw new Error('EmergePay SDK not properly initialized');
    }
    const response = await emergepay.checkoutTransaction({
      transactionToken: body.paymentId,
      transactionType: 'CreditSale',
      amount: totalPriceWithTax,
      externalTransactionId: emergepay.getExternalTransactionId(),
    });
    let orderId = '';
    if (response.data.resultStatus === 'true') {
      this.logger.trace(
        {
          module: 'payment',
          event: 'payment_successful',
          correlationId: requestId,
          restaurantId: body.restaurantId,
          amount: totalPriceWithTax,
          transactionId: body.paymentId,
        },
        'Payment completed',
      );

      orderId = await this.menuService.createOrder(body, requestId);
    } else {
      this.logger.trace(
        {
          module: 'payment',
          event: 'payment_failed',
          restaurantId: body.restaurantId,
          correlationId: requestId,
          error: response.data.resultMessage,
        },
        'Payment failed',
      );
    }
    return { transaction: response.data, orderId: orderId };
  }

  async completeTranscationUpi(body: CreateOrderDto, requestId: string) {
    const projection = { payment: 1 };
    const PaymentDetails = await this.locationCollection.findOne(
      { _id: new ObjectId(body.locationId), restaurantId: body.restaurantId },
      { projection },
    );
    const oid = PaymentDetails.payment.oid;
    const authToken = PaymentDetails.payment.auth;
    const environmentUrl = this.configService.get<string>('EMERGEPAY_ENVIRONMENT_URL');
    const url = `${environmentUrl}/orgs/${oid}/transactions/wallets`;

    if (!oid || !authToken) {
      throw new Error('EmergePay credentials not found');
    }
    if (!environmentUrl) {
      throw new Error('EmergePay environment URL not found');
    }

    const orderTotalPrice = body.items.reduce(
      (accumulator: number, currentValue: OrderItemDto) => accumulator + currentValue.price,
      0,
    );
    const orderTotalPriceInDollars = orderTotalPrice / 100;
    const taxRate = this.configService.get<number>('TAX_RATE');
    if (!taxRate) {
      throw new Error('taxRate not found');
    }
    const totalPriceWithTax = (orderTotalPriceInDollars + orderTotalPriceInDollars * taxRate).toFixed(2);
    const requestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    };

    const transactionData: any = {};

    transactionData.type = body.transactionDetails.type;
    transactionData.isSandbox = body.transactionDetails.isSandbox;
    transactionData.billing = body.transactionDetails.billing;
    transactionData.card = body.transactionDetails.card;
    transactionData.token = body.transactionDetails.token;
    transactionData.amount = totalPriceWithTax;
    transactionData.transactionType = 'CreditSale';
    transactionData.externalTransactionId = requestId;
    transactionData.transactionReference = requestId;

    try {
      const response = await axios.post(url, { transactionData }, requestConfig);
      
      let orderId = '';
      if (response.data && response.data.transactionResponse.resultMessage === 'Approved') {
        this.logger.trace(
          {
            module: 'payment',
            event: 'upi_payment_successful',
            correlationId: requestId,
            restaurantId: body.restaurantId,
            amount: totalPriceWithTax,
            transactionId: body.paymentId,
          },
          'UPI Payment completed',
        );

        orderId = await this.menuService.createOrder(body, requestId);
      } else {
        this.logger.trace(
          {
            module: 'payment',
            event: 'upi_payment_failed',
            restaurantId: body.restaurantId,
            correlationId: requestId,
            error: response.data,
          },
          'UPI Payment failed',
        );
      }

      return { transaction: response.data, orderId: orderId };
    } catch (error: any) {
      console.error('EmergePay API error:', error.response?.data || error.message);
      throw new Error('Failed to process payment');
    }
  }
}
