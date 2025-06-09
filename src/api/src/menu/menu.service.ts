import { Injectable, Logger } from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import { InjectClient } from 'nest-mongodb-driver';
import { CreateOrderDto, OrderItemDto, OrderStatusDto, RestaurantResponseDto } from './dtos/menu.controller.dto';
import { ConfigService } from '@nestjs/config';
import { Order, OrderItem } from '../models/order';
import { OrderStatus } from '../constants';
import { EventsGateway } from '../events/events.gateway';
import { WebPushService } from '../web-push/web-push.service';
import { plainToClass } from 'class-transformer';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class MenuService {
  // private readonly logger = new Logger(MenuService.name)

  private readonly ordersCollection;
  private readonly menusCollection: any;
  private readonly restaurantsCollection: any;

  menuService: any;
  private readonly subscriptionsCollection;

  constructor(
    @InjectClient() private readonly db: Db,
    private readonly eventsGateway: EventsGateway,
    private readonly webPushService: WebPushService,
    private readonly configService: ConfigService,
    @InjectPinoLogger(MenuService.name) private readonly logger: PinoLogger
  ) {
    this.ordersCollection = db.collection('orders');
    this.subscriptionsCollection = this.db.collection('subscriptions');
    this.restaurantsCollection = db.collection('restaurants');
    this.menusCollection = db.collection('menus');
    this.logger.setContext('MenuService');
  }

  async getRestaurantById(restaurantId: string): Promise<RestaurantResponseDto> {
    const result = await this.restaurantsCollection.findOne({
      _id: restaurantId,
    });
    if (!result) {
      throw new Error('Restaurant not found');
    }
    const transformedResult = plainToClass(RestaurantResponseDto, result, {
      excludeExtraneousValues: true,
    });
    return transformedResult;
  }
  async getMenuByRestaurantId(menuId: string) {
    const result = await this.menusCollection.findOne({
      '_id.menuId': menuId,
    });

    if (!result) {
      throw new Error('menu not found');
    }
    return result;
  }
  async createOrder(body: CreateOrderDto, correlationId: string) {
    this.logger.trace(
      {
        module: 'order',
        event: 'create_order_started',
        correlationId,
        restaurantId: body.restaurantId,
      },
      'Starting order creation'
    );

    const orderTotalPrice = body.items.reduce(
      (accumulator: number, currentValue: OrderItemDto) => accumulator + currentValue.price,
      0
    );
    const orderTotalPriceInDollars = orderTotalPrice / 100;
    const taxRate = this.configService.get<number>('TAX_RATE');
    if (!taxRate) throw new Error('TAX_RATE not configured');
    const totalPriceWithTax = Math.round(orderTotalPrice + orderTotalPrice * taxRate);
    const orderToCreate = {
      paymentId: body.paymentId,
      restaurantId: body.restaurantId,
      locationId: body.locationId,
      customer: body.customer,
      station: {
        id: body.station.id ? body.station.id : '',
        name: body.station.name,
      },
      items: body.items.map((item) => {
        return new OrderItem(
          item.id,
          item.menuItemId,
          item.name,
          item.price,
          item.startedAt,
          item.completedAt,
          item.modifiers,
          item.variants,
          item.stationTags
        );
      }),

      status: OrderStatus.OrderPlaced,
      startedAt: new Date(),
      totalPrice: totalPriceWithTax,
      getSms: body.getSms,
    };

    const result = await this.ordersCollection.insertOne(orderToCreate);

    const orderId = result.insertedId;

    this.logger.trace(
      {
        module: 'order',
        event: 'order_created',
        correlationId: correlationId,
        orderId: orderId.toString(),
        restaurantId: body.restaurantId,
        stationTags: [...new Set(body.items.flatMap((item) => item.stationTags))],
        totalPrice: totalPriceWithTax,
      },
      'Order created successfully'
    );
    const restaurantId = body.restaurantId;
    const locationId = body.locationId;
    const locationRoom = `${restaurantId}_${locationId}`;
    this.eventsGateway.server.to(locationRoom).emit('order_received', {
      orderId,
      restaurantId,
      locationId,
      correlationId,
    });
    const stationTags = [...new Set(body.items.flatMap((item) => item.stationTags))].filter(
      (tag): tag is string => tag !== undefined
    );
    const orderData = {
      orderId: orderId.toString(),
      restaurantId: body.restaurantId,
      locationId: body.locationId,
      stationTags,
      correlationId, // Add requestId here

      orderDetails: {
        status: OrderStatus.OrderPlaced,
        items: body.items.map((item) => ({
          name: item.name,
        })),
      },
    };
    await this.eventsGateway.handleOrderJoined(orderData); //event to all stations
    try {
      const notificationPayload = {
        title: 'New Order',
        body: `Order #${orderId.toString().slice(-4)} received!`,
        restaurantId: restaurantId,
        platform: 'all' as const, // Explicitly type as 'all'
      };

      const response = await this.webPushService.sendNotifications(
        {
          title: notificationPayload.title,
          body: notificationPayload.body,
        },
        notificationPayload
      );
      this.logger.trace(
        {
          module: 'order',
          event: 'notifications_sent',
          correlationId: correlationId,
          orderId: orderId.toString(),
          restaurantId: body.restaurantId,
        },
        'Push notifications sent successfully'
      );
      this.logger.info('Push notifications sent:', response);
    } catch (error) {
      // Log error but don't fail the order creation
      this.logger.error('Failed to send push notifications:', error);
      this.logger.error(
        {
          module: 'order',
          event: 'notifications_failed',
          correlationId: correlationId,
          orderId: orderId.toString(),
          error: error.message,
        },
        'Failed to send push notifications'
      );
    }

    if (body.getSms) {
    } else {
      this.logger.debug('SMS not sent');
    }
    return result.insertedId;
  }

  async getOrder(orderId: string): Promise<Order> {
    const query = { _id: new ObjectId(orderId) };
    const order = await this.ordersCollection.findOne(query);
    return order;
  }
  async getStatus(orderId: string) {
    const order = await this.getOrder(orderId);
    if (!order) return;

    const statusResponse: OrderStatusDto = {
      orderTime: order.startedAt,
      waitTime: order.waitTimeInMinutes,
      status: order.status,
    };
    return statusResponse;
  }
}
