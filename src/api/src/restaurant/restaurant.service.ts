import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectClient } from 'nest-mongodb-driver';
import { Collection, Db, ObjectId } from 'mongodb';
import { OrderStatus } from '../constants';
import { CategoryDto, GetMenuItemDto, LocationDto, MenuSummaryDto, RestaurantDto } from './dto/restaurant.dto';
import { User } from 'src/models/users';
import { COLLECTIONS } from 'src/db/collections';
import { Menu, Restaurant } from 'src/db/models';
import { Location } from 'src/db/models/location.model';
import { DateTime } from 'luxon';
interface Station {
  id: string;
  name: string;
  stationtags: string[];
}

@Injectable()
export class RestaurantService {
  private readonly restaurantsCollection: any;
  private readonly ordersCollection: any;
  private readonly locationCollection: Collection<Location>;

  constructor(@InjectClient() private readonly db: Db) {
    this.restaurantsCollection = db.collection(COLLECTIONS.RESTAURANTS);
    this.ordersCollection = db.collection(COLLECTIONS.ORDERS);
    this.locationCollection = this.db.collection<Location>(COLLECTIONS.LOCATIONS);
  }

  async getOrder(orderId: string) {
    const query = { _id: new ObjectId(orderId) };
    const order = await this.ordersCollection.findOne(query);
    return order;
  }
  async getUserRestaurantIds(userId: string): Promise<string[]> {
    const user = await this.db.collection<User>(COLLECTIONS.USERS).findOne(
      { userId },
      {
        projection: {
          restaurants: 1,
          _id: 0,
        },
      }
    );
    if (!user || !user.restaurants) {
      throw new Error('No restaurants found for user');
    }

    return user.restaurants;
  }
  async getRestaurantById(restaurantId: string): Promise<RestaurantDto> {
    const result = await this.restaurantsCollection.findOne({
      _id: restaurantId,
    });
    if (!result) {
      throw new Error('Restaurant not found');
    }

    return result;
  }
  async getRestaurantDetailsByIds(restaurantIds: string[]): Promise<RestaurantDto[]> {
    const restaurantDetails = await this.db
      .collection<Restaurant>(COLLECTIONS.RESTAURANTS)
      .find(
        { _id: { $in: restaurantIds } },
        {
          projection: {
            _id: 1,
            name: 1,
            concept: 1,
            logo: 1,
          },
        }
      )
      .toArray();

    if (!restaurantDetails.length) {
      throw new Error('No restaurant details found');
    }

    return restaurantDetails;
  }

  async getRestaurants(userId: string) {
    try {
      const restaurantIds = await this.getUserRestaurantIds(userId);
      const restaurantDetails = await this.getRestaurantDetailsByIds(restaurantIds);

      return restaurantDetails;
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  }

  async getRestaurantLocations(restaurantId: string): Promise<LocationDto[]> {
    const locations = await this.db
      .collection<Location>(COLLECTIONS.LOCATIONS)
      .find(
        { restaurantId },
        {
          projection: {
            _id: 1,
            locationSlug: 1,
            name: 1,
            isMobile: 1,
          },
        }
      )
      .toArray();

    if (!locations?.length) {
      throw new Error('No locations found for restaurant');
    }

    return locations;
  }

  async getTodayOrders(restaurantId: string, locationId: string) {
    const location = await this.locationCollection.findOne(
      {
        _id: new ObjectId(locationId),
        restaurantId: restaurantId,
      },
      {
        projection: {
          'opening_hours.timezone': 1,
          name: 1,
          _id: 1,
        },
      }
    );

    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found for restaurant ${restaurantId}`);
    }

    if (!location.opening_hours?.timezone) {
      throw new Error('Store opening hours or timezone not configured');
    }

    const timeZone = location.opening_hours.timezone;
    const localToday = DateTime.now().setZone(timeZone).startOf('day');

    const startUTC = localToday.toUTC().toJSDate();
    const endUTC = localToday.endOf('day').toUTC().toJSDate();

    if (!localToday.isValid) {
      throw new Error(`Invalid localDate: ${localToday.invalidReason}`);
    }

    const orders = await this.ordersCollection
      .find({
        restaurantId,
        locationId: new ObjectId(locationId),
        startedAt: {
          $gte: startUTC,
          $lt: endUTC,
        },
      })
      .toArray();

    return orders;
  }

  async getSingleOrder(restaurantId: string, locationId: string, orderId: string) {
    const order = await this.ordersCollection.findOne({
      _id: new ObjectId(orderId),
      restaurantId,
      locationId: new ObjectId(locationId),
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }
  async updateOrderStatus({ orderId, orderStatus }: { orderId: string; orderStatus: string }) {
    let result;

    if (orderStatus === OrderStatus.ReadyForPickup.toString()) {
      result = await this.ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status: orderStatus.toString() } }
      );
    } else {
      const date = new Date();
      result = await this.ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status: orderStatus.toString(), endedAt: date } }
      );
    }
    return result.acknowledged;
  }

  async getMenu(restaurantId: string, locationId: string, menuId: string) {
    const menu = await this.db.collection<Menu>(COLLECTIONS.MENUS).findOne({
      _id: new ObjectId(menuId),
      restaurantId,
      locationId: new ObjectId(locationId),
    });

    if (!menu) {
      throw new NotFoundException(
        `Menu not found for restaurant: ${restaurantId}, location: ${locationId}, menu: ${menuId}`
      );
    }

    return menu;
  }

  async upsertCategory(restaurantId: string, locationId: string, menuId: string, categoryData: CategoryDto) {
    if (categoryData.id) {
      const result = await this.db.collection(COLLECTIONS.MENUS).updateOne(
        {
          _id: new ObjectId(menuId),
          restaurantId,
          locationId: new ObjectId(locationId),
          'categories.id': categoryData.id,
        },
        {
          $set: {
            'categories.$': categoryData,
          },
        }
      );

      if (!result.acknowledged) {
        throw new NotFoundException('Menu not found or category update failed');
      }

      return result;
    } else {
      const menu = await this.db.collection<Menu>(COLLECTIONS.MENUS).findOne({
        _id: new ObjectId(menuId),
        restaurantId,
        locationId: new ObjectId(locationId),
      });
      if (!menu) {
        throw new NotFoundException('Menu not found');
      }
      const nextSortOrder = menu.categories?.length ? menu.categories.length + 1 : 1;
      const newCategory = {
        ...categoryData,
        id: new ObjectId().toString(),
        sortOrder: nextSortOrder,
      } as CategoryDto;
      const result = await this.db.collection<Menu>(COLLECTIONS.MENUS).updateOne(
        {
          _id: new ObjectId(menuId),
          restaurantId,
          locationId: new ObjectId(locationId),
        },
        {
          $push: {
            categories: newCategory,
          },
        }
      );
      if (!result.acknowledged) {
        throw new NotFoundException('Menu not found or category creation failed');
      }

      return result;
    }
  }

  async upsertMenuItem(restaurantId: string, locationId: string, menuId: string, itemData: GetMenuItemDto) {
    const { price, ...itemDataWithoutPrice } = itemData;
    const processedVariants =
      itemDataWithoutPrice.variants?.map((variant) => ({
        ...variant,
        id: variant.id || new ObjectId().toString(),
        priceCents: Number(variant.priceCents),
        default: variant.default || false,
      })) || [];
    const processedModifiers =
      itemDataWithoutPrice.modifiers?.map((modifier) => ({
        ...modifier,
        id: modifier.id || new ObjectId().toString(),
        extraChoicePriceCents: Number(modifier.extraChoicePriceCents),
        maxChoices: Number(modifier.maxChoices),
        freeChoices: Number(modifier.freeChoices),
        required: modifier.required || false,
        options:
          modifier.options?.map((option) => ({
            ...option,
            id: option.id || new ObjectId().toString(),
            priceCents: Number(option.priceCents),
          })) || [],
      })) || [];
    const itemDataInCents = {
      ...itemDataWithoutPrice,
      isAvailable: itemData.isAvailable,
      variants: processedVariants,
      modifiers: processedModifiers,
      priceCents: Math.round(Number(price) * 100),
      makingCostCents: itemData.makingCostCents ? Math.round(Number(itemData.makingCostCents) * 100) : 0,
    };

    if (itemData.id) {
      const result = await this.db.collection(COLLECTIONS.MENUS).updateOne(
        {
          _id: new ObjectId(menuId),
          restaurantId,
          locationId: new ObjectId(locationId),
          'items.id': itemData.id,
        },
        {
          $set: {
            'items.$': itemDataInCents,
          },
        }
      );

      if (!result.acknowledged) {
        throw new NotFoundException('Menu not found or item update failed');
      }

      return result;
    } else {
      const newItem = {
        ...itemDataInCents,
        id: new ObjectId().toString(),
      };

      const result = await this.db.collection<Menu>(COLLECTIONS.MENUS).updateOne(
        {
          _id: new ObjectId(menuId),
          restaurantId,
          locationId: new ObjectId(locationId),
        },
        {
          $push: {
            items: newItem,
          },
        }
      );

      if (!result.acknowledged) {
        throw new NotFoundException('Menu not found or item creation failed');
      }

      return result;
    }
  }
  async updateCategorySortOrder(
    restaurantId: string,
    locationId: string,
    menuId: string,
    categoryId: string,
    sortOrder: number
  ) {
    const result = await this.db.collection(COLLECTIONS.MENUS).updateOne(
      {
        _id: new ObjectId(menuId),
        restaurantId,
        locationId: new ObjectId(locationId),
        'categories.id': categoryId,
      },
      {
        $set: {
          'categories.$.sortOrder': sortOrder,
        },
      }
    );

    if (!result.acknowledged) {
      throw new NotFoundException('Menu not found or category update failed');
    }

    return result;
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

  async updateItemAvailability(
    restaurantId: string,
    locationId: string,
    menuId: string,
    itemId: string,
    isAvailable: boolean
  ): Promise<boolean> {
    const result = await this.db.collection(COLLECTIONS.MENUS).updateOne(
      {
        _id: new ObjectId(menuId),
        restaurantId,
        locationId: new ObjectId(locationId),
        'items.id': itemId,
      },
      {
        $set: {
          'items.$.isAvailable': isAvailable,
        },
      }
    );

    if (!result.matchedCount) {
      throw new NotFoundException('Menu item not found');
    }

    return result.acknowledged;
  }
}
