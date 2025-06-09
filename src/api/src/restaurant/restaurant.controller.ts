import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import {
  CategoryDto,
  getActiveOrdersDto,
  GetCategoryDtoBody,
  GetMenuItemDto,
  GetMenuParamDto,
  GetMenusParamDto,
  GetRestaurantLocationsParamDto,
  GetRestaurantsDto,
  LocationDto,
  MenuDto,
  MenuSummaryDto,
  RestaurantDto,
  UpdateCategorySortOrderDto,
} from './dto/restaurant.dto';
import { Response } from 'express';
import { UpdateOrderStatusDto } from './dto/create-restaurant.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ApiResponse } from 'src/models/api-response';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@UseGuards(AuthGuard)
@Controller('restaurant')
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    @InjectPinoLogger(RestaurantController.name) private readonly logger: PinoLogger
  ) {
    this.logger.setContext('RestaurantController');
  }

  // @Get('get-access-token')
  // async getToken(@Session() session: SessionContainer): Promise<{ token: any }> {
  //   const jwt = session.getAccessToken()
  //   return { token: jwt }
  // }

  @Get('/:userId')
  async getRestaruntByUserId(
    @Param() params: GetRestaurantsDto,

    @Res() res: Response
  ): Promise<Response<ApiResponse<RestaurantDto>>> {
    const restaurants = await this.restaurantService.getRestaurants(params.userId);
    return res.status(HttpStatus.OK).json({ data: restaurants });
  }
  @Get('/restaurants/:restaurantId/locations')
  async getRestaurantLocations(
    @Param() params: GetRestaurantLocationsParamDto,
    @Res() res: Response
  ): Promise<Response<ApiResponse<LocationDto[]>>> {
    try {
      const locations = await this.restaurantService.getRestaurantLocations(params.restaurantId);
      return res.status(HttpStatus.OK).json({
        data: locations,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('/active-orders/:restaurantId/:locationId')
  async getActiveOrders(
    @Param() params: getActiveOrdersDto,

    @Res() res: Response,
    @Req() req: Request
  ) {
    const requestId = req['requestId'];

    try {
      this.logger.trace(
        {
          module: 'restaurant',
          event: 'get_active_orders',
          correlationI: requestId,
          restaurantId: params.restaurantId,
          locationId: params.locationId,
        },
        'Getting active orders'
      );
      const orders = await this.restaurantService.getActiveOrders(params.restaurantId, params.locationId);
      return res.status(HttpStatus.OK).json(orders);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('order-status')
  async updateOrderStatus(@Body() updateOrderStatusDto: UpdateOrderStatusDto, @Res() res: Response) {
    const order = await this.restaurantService.getOrder(updateOrderStatusDto.orderId);
    if (!order) throw new NotFoundException();

    const storeAck = await this.restaurantService.updateOrderStatus(updateOrderStatusDto);
    // const store = await this.restaurantService.getStore(order.restaurant)
    // if (!store) throw new NotFoundException()

    // if (updateOrderStatusDto.orderStatus === OrderStatus.ReadyForPickup) {
    //   const orderNumber = updateOrderStatusDto.orderId.toString().slice(-4).toUpperCase()
    //   const message = `OrderBuddy-${store.name}: your order #${orderNumber} is ready for pickup` //order number
    //   if (order.customer.phone) {
    //     // await sendMessage(order.customer.phone, message)
    //   }
    // }
    res.status(HttpStatus.OK).json(storeAck);
  }

  @Get('restaurants/:restaurantId/locations/:locationId/menus')
  async getMenus(
    @Param() params: GetMenusParamDto,

    @Res() res: Response
  ): Promise<Response<ApiResponse<MenuSummaryDto[]>>> {
    const menus = await this.restaurantService.getMenus(params.restaurantId, params.locationId);
    return res.status(HttpStatus.OK).json({ data: menus });
  }

  @Get('restaurants/:restaurantId/locations/:locationId/menus/:menuId')
  async getMenu(
    @Param() params: GetMenuParamDto,

    @Res() res: Response
  ): Promise<Response<ApiResponse<MenuDto>>> {
    const menu = await this.restaurantService.getMenu(params.restaurantId, params.locationId, params.menuId);
    return res.status(HttpStatus.OK).json({ data: menu });
  }
  @Post(':restaurantId/location/:locationId/menu/:menuId/category')
  async upsertCategory(
    @Param() params: GetMenuParamDto,

    @Body() category: GetCategoryDtoBody,
    @Res() res: Response
  ): Promise<Response<ApiResponse<boolean>>> {
    const result = await this.restaurantService.upsertCategory(
      params.restaurantId,
      params.locationId,
      params.menuId,
      category
    );

    return res.status(HttpStatus.OK).json({
      data: result.acknowledged,
    });
  }
  @Post(':restaurantId/location/:locationId/menu/:menuId/item')
  async upsertMenuItem(
    @Param() params: GetMenuParamDto,
    @Body() item: GetMenuItemDto,
    @Res() res: Response
  ): Promise<Response<ApiResponse<boolean>>> {
    const result = await this.restaurantService.upsertMenuItem(
      params.restaurantId,
      params.locationId,
      params.menuId,
      item
    );

    return res.status(HttpStatus.OK).json({
      data: result.acknowledged,
    });
  }
  @Post(':restaurantId/location/:locationId/menu/:menuId/category/sort-order')
  async updateCategorySortOrder(
    @Param() params: GetMenuParamDto,
    @Body() updateData: UpdateCategorySortOrderDto,
    @Res() res: Response
  ): Promise<Response<ApiResponse<boolean>>> {
    const result = await this.restaurantService.updateCategorySortOrder(
      params.restaurantId,
      params.locationId,
      params.menuId,
      updateData.categoryId,
      updateData.sortOrder
    );

    return res.status(HttpStatus.OK).json({
      data: result.acknowledged,
    });
  }
}
