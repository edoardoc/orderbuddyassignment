import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateOrderDto, GetStoreInfoDto } from './dtos/payments.controller.dto';
import { Response } from 'express';
import { ObjectId } from 'mongodb';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    @InjectPinoLogger(PaymentsController.name)
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext('PaymentsController');
  }

  @Post('start-transaction/:restaurantId')
  async getStore(@Param() params: GetStoreInfoDto, @Res() res: Response, @Req() req: Request) {
    const requestId = req['requestId'];

    try {
      this.logger.trace(
        {
          module: 'payment',
          event: 'start-transaction',
          restaurantId: params.restaurantId,
          correlationId: requestId,
        },
        'Payment transaction initiated'
      );
      const transactionToken = await this.paymentsService.startTransaction(params.restaurantId);
      this.logger.trace(
        {
          module: 'payment',
          event: 'transaction-token-generated',
          restaurantId: params.restaurantId,
          correlationId: requestId,
          tokenId: transactionToken.transactionToken,
        },
        'Transaction token generated successfully'
      );

      return res.status(HttpStatus.OK).json(transactionToken);
    } catch (error: any) {
      this.logger.error(
        {
          module: 'payment',
          event: 'start-transaction',
          restaurantId: params.restaurantId,
          correlationId: requestId,
          error: error.message,
          stack: error.stack,
        },
        'Transaction failed'
      );

      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('complete-transaction')
  async completeTransaction(@Body() body: CreateOrderDto, @Res() res: Response, @Req() req: Request) {
    const requestId = req['requestId'];

    try {
      this.logger.trace(
        {
          module: 'payment',
          event: 'complete-transaction',
          correlationId: requestId,
        },
        'Payment completion initiated'
      );

      const data = await this.paymentsService.completeTranscation(body, requestId);
      this.logger.trace(
        {
          module: 'payment',
          event: 'transaction-completed',
          correlationId: requestId,
        },
        'Transaction completed successfully'
      );

      return res.status(HttpStatus.OK).json(data);
    } catch (error: any) {
      this.logger.error(
        {
          module: 'payment',
          event: 'complete-transaction',
          correlationId: requestId,
          error: error.message,
          stack: error.stack,
        },
        'Transaction failed'
      );

      console.error('EmergePay transaction failed:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Transaction failed', error: error.message });
    }
  }

  @Post('complete-upi-transaction')
  async completeUpiTransaction(@Body() body: CreateOrderDto, @Res() res: Response) {
    try {
      const data = await this.paymentsService.completeTranscationUpi(body);
      return res.status(HttpStatus.OK).json(data);
    } catch (error: any) {
      console.error('EmergePay transaction upi failed:', error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Transaction upi failed', error: error.message });
    }
  }
}
