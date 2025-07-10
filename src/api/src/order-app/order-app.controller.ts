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
} from './dtos/order-app.controller.dto';

@Controller('order-app')
export class OrderAppController {
  constructor(private readonly orderAppService: OrderAppService) {}

  // entry page -> entry info
  @Get('restaurants/:restaurantId/locations/:locationId/origins/:originId/entry-info')
  async getEntryInfo(
    @Param() params: GetEntryInfoDto,
    @Res() res: Response
  ): Promise<Response<ApiResponse<EntryInfoDto>>> {
    if (!ObjectId.isValid(params.locationId)) throw new BadRequestException('INVALID_LOCATION');
    if (!ObjectId.isValid(params.originId)) throw new BadRequestException('INVALID_ORIGIN');

    const entryInfo = await this.orderAppService.getEntryInfo(params.restaurantId, params.locationId, params.originId);
    return res.status(HttpStatus.OK).json({ data: entryInfo });
  }

  // entry page -> menus
  @Get('restaurants/:restaurantId/locations/:locationId/menus')
  async getMenus(
    @Param() params: GetMenusParamDto,

    @Res() res: Response
  ): Promise<Response<ApiResponse<MenuSummaryDto[]>>> {
    const menus = await this.orderAppService.getMenus(params.restaurantId, params.locationId);
    return res.status(HttpStatus.OK).json({ data: menus });
  }

  // menu page
  @Get('restaurants/:restaurantId/locations/:locationId/menus/:menuId')
  async getMenu(
    @Param() params: GetMenuParamDto,

    @Res() res: Response
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
