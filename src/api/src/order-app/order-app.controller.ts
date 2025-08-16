import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
  Inject,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ObjectId } from 'mongodb';
import { OrderAppService } from './order-app.service';
import { ApiResponse } from 'src/models/api-response';
import {
  CartItemInput,
  CartSummaryDto,
  CheckoutFormDto,
  EntryInfoDto,
  GetMenuParamDto,
  GetMenusParamDto,
  GetOrderStatusParamDto,
  GetEntryInfoDto,
  MenuDto,
  MenuSummaryDto,
  OrderConfirmationDto,
  OrderStatusDto,
  RestaurantDto,
  LocationDto,
  OriginDto,
  CampaignDto,
} from './dtos/order-app.controller.dto';

@Controller('order-app')
export class OrderAppController {
  constructor(private readonly orderAppService: OrderAppService) {}

  // Get restaurant info
  @Get('restaurants/:restaurantId')
  async getRestaurant(
    @Param('restaurantId') restaurantId: string,
    @Res() res: Response,
  ): Promise<Response<ApiResponse<RestaurantDto>>> {
    const restaurant = await this.orderAppService.getRestaurant(restaurantId);
    return res.status(HttpStatus.OK).json({ data: restaurant });
  }

  // Get location info
  @Get('restaurants/:restaurantId/locations/:locationId')
  async getLocation(
    @Param('restaurantId') restaurantId: string,
    @Param('locationId') locationId: string,
    @Res() res: Response,
  ): Promise<Response<ApiResponse<LocationDto>>> {
    const location = await this.orderAppService.getLocation(restaurantId, locationId);
    return res.status(HttpStatus.OK).json({ data: location });
  }

  // Get origin info
  @Get('restaurants/origins/:originId')
  async getOrigin(
    @Param('originId') originId: string,
    @Res() res: Response,
  ): Promise<Response<ApiResponse<OriginDto>>> {
    const origin = await this.orderAppService.getOrigin(originId);
    return res.status(HttpStatus.OK).json({ data: origin });
  }

  // Get campaign info
  @Get('restaurants/:restaurantId/locations/:locationId/origins/:originId/campaign')
  async getCampaign(
    @Param('restaurantId') restaurantId: string,
    @Param('locationId') locationId: string,
    @Param('originId') originId: string,
    @Res() res: Response,
  ): Promise<Response<ApiResponse<CampaignDto>>> {
    const campaign = await this.orderAppService.getCampaign(restaurantId, locationId, originId);
    return res.status(HttpStatus.OK).json({ data: campaign });
  }

  // entry page -> menus
  @Get('restaurants/:restaurantId/locations/:locationId/menus')
  async getMenus(
    @Param() params: GetMenusParamDto,

    @Res() res: Response,
  ): Promise<Response<ApiResponse<MenuSummaryDto[]>>> {
    const menus = await this.orderAppService.getMenus(params.restaurantId, params.locationId);
    return res.status(HttpStatus.OK).json({ data: menus });
  }

  // menu page
  @Get('restaurants/:restaurantId/locations/:locationId/menus/:menuId')
  async getMenu(
    @Param() params: GetMenuParamDto,

    @Res() res: Response,
  ): Promise<Response<ApiResponse<MenuDto>>> {
    const menu = await this.orderAppService.getMenu(params.restaurantId, params.locationId, params.menuId);
    return res.status(HttpStatus.OK).json({ data: menu });
  }

  // Cart Preview
  @Post('cart/preview')
  previewCart(@Body() body: { originId: string; menuId: string; items: CartItemInput[] }): Promise<CartSummaryDto> {
    return this.orderAppService.previewCart(body);
  }

  // Checkout
  @Post('checkout')
  checkout(@Body() dto: CheckoutFormDto): Promise<OrderConfirmationDto> {
    return this.orderAppService.checkout(dto);
  }

  // Order Status
  @Get('orders/:orderId/status')
  getOrderStatus(@Param() params: GetOrderStatusParamDto): Promise<OrderStatusDto> {
    return this.orderAppService.getOrderStatus(params.orderId);
  }
}
