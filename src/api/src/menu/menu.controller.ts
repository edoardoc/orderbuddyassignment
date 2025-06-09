import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { GetOrderInfoDto, RestaurantResponseDto } from './dtos/menu.controller.dto';
import { MenuService } from './menu.service';

import _ from 'lodash';
import { GetMenuInfoDto, GetRestaurantInfoDto } from '../restaurant/dto/restaurant.dto';
import { ApiResponse } from '../models/api-response';

@Controller('menu-app/')
export class MenuController {
  private readonly logger = new Logger(MenuController.name);

  constructor(private readonly menuService: MenuService) {}

  @Get('/:restauranId')
  async getRestaurantById(
    @Param() params: GetRestaurantInfoDto,
    @Res() res: Response
  ): Promise<Response<ApiResponse<RestaurantResponseDto>>> {
    const restaurant = await this.menuService.getRestaurantById(params.restauranId);

    if (!restaurant) throw new NotFoundException();
    return res.status(HttpStatus.OK).json({ data: restaurant });
  }

  @Get('/menu/:menuId')
  async getMenuByRestaurantId(@Param() params: GetMenuInfoDto, @Res() res: Response) {
    const menu = await this.menuService.getMenuByRestaurantId(params.menuId);

    if (!menu) throw new NotFoundException();
    res.status(HttpStatus.OK).json(menu);
  }
  // @Post('/store/order')
  // async createOrder(@Body() body: CreateOrderDto, @Res() res: Response) {
  //   const orderId = await this.menuService.createOrder(body)
  //   if (!orderId) throw new BadRequestException('Failed to create order')
  //   res.status(HttpStatus.CREATED).json(orderId)
  // }

  @Get('/order/:orderId')
  async getOrderStatus(@Param() params: GetOrderInfoDto, @Res() res: Response) {
    const orderId = params.orderId;
    const orderStatus = await this.menuService.getStatus(orderId);
    if (!orderStatus) return res.status(HttpStatus.NOT_FOUND).send('order not found');
    res.status(HttpStatus.OK).json(orderStatus);
  }
}
