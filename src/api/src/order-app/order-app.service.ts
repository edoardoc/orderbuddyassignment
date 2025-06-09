import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { console } from 'inspector';
import { Db, ObjectId } from 'mongodb';
import { InjectClient } from 'nest-mongodb-driver';
import { COLLECTIONS } from 'src/db/collections';
import { Origin, Location } from 'src/db/models';
import { Menu } from 'src/db/models/menu.model';
import { Restaurant } from 'src/db/models/restaurant.model';
import {
  CartItemInput,
  CartSummaryDto,
  CheckoutFormDto,
  MenuDto,
  MenuSummaryDto,
  OrderConfirmationDto,
  OrderStatusDto,
} from './dtos/order-app.controller.dto';

@Injectable()
export class OrderAppService {
  //todo: @Inject('MONGO_DB') private readonly db: Db
  constructor(@InjectClient() private readonly db: Db) {}

  async getEntryInfo(restaurantId: string, locationId: string, originId: string) {    

    const restaurantPromise = this.db
      .collection<Restaurant>(COLLECTIONS.RESTAURANTS)
      .findOne({ _id: restaurantId }, { projection: { _id: 1, name: 1, concept: 1, logo: 1 } });

    const locationPromise = this.db.collection<Location>(COLLECTIONS.LOCATIONS).findOne(
      { _id: new ObjectId(locationId) },
      {
        projection: {
          _id: 1,
          locationSlug: 1,
          name: 1,
          isActive: 1,
        },
      }
    );

    const originPromise = this.db.collection<Origin>(COLLECTIONS.ORIGINS).findOne(
      { _id: new ObjectId(originId) },
      {
        projection: {
          _id: 1,
          label: 1,
        },
      }
    );

    const [restaurant, location, origin] = await Promise.all([restaurantPromise, locationPromise, originPromise]);

    if (!restaurant) throw new NotFoundException('INVALID_RESTAURANT');
    if (!location) throw new NotFoundException('INVALID_LOCATION');
    if (!origin) throw new NotFoundException('INVALID_ORIGIN');

    return {
      restaurant,
      location,
      origin,
    };
  }

  async getMenu(restaurantId: string, locationId: string, menuId: string): Promise<Menu> {
    const menu = await this.db.collection<Menu>(COLLECTIONS.MENUS).findOne({ _id: new ObjectId(menuId) });

    if (!menu) {
      throw new NotFoundException('Invalid menu');
    }

    return menu;
  }

  async getMenus(restaurantId: string, locationId: string): Promise<MenuSummaryDto[]> {
    //todo: add projection
    const menus = await this.db
      .collection<Menu>(COLLECTIONS.MENUS)
      .find(
        {
          restaurantId,
          locationId: new ObjectId(locationId),
        },
        {
          projection: {
            _id: 1,
            menuSlug: 1,
            name: 1,
            available: 1,
          },
        }
      )
      .toArray();
    return menus;
  }

  async previewCart(input: { originId: string; menuId: string; items: CartItemInput[] }): Promise<CartSummaryDto> {
    // This would normally include validation and pricing rules
    const items = input.items.map((i) => ({
      menuItemId: i.menuItemId,
      name: 'Sample Item', // fetched from menu_items in real app
      quantity: i.quantity,
      priceCents: 500,
      subtotalCents: i.quantity * 500,
    }));

    const total = items.reduce((sum, i) => sum + i.subtotalCents, 0);
    const taxes = Math.round(total * 0.1);

    return {
      items,
      totalCents: total,
      taxesCents: taxes,
      grandTotalCents: total + taxes,
    };
  }

  async checkout(dto: CheckoutFormDto): Promise<OrderConfirmationDto> {
    const orderId = new ObjectId();
    const createdAt = new Date().toISOString();

    // TODO: create `orders` collection & schema
    await this.db.collection('orders').insertOne({
      _id: orderId,
      originId: dto.originId,
      menuId: dto.menuId,
      items: dto.items,
      paymentMethod: dto.paymentMethod,
      customerInfo: dto.customerInfo,
      createdAt,
      status: 'pending',
    });

    return {
      orderId: orderId.toString(),
      createdAt,
      status: 'pending',
    };
  }

  async getOrderStatus(orderId: string): Promise<OrderStatusDto> {
    const order = await this.db.collection('orders').findOne({ _id: new ObjectId(orderId) });
    if (!order) throw new NotFoundException('Order not found');

    return {
      orderId,
      status: order.status,
      updatedAt: order.updatedAt || order.createdAt,
    };
  }
}
