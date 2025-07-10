import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { GetOrderInfoDto, RestaurantResponseDto } from './dtos/menu.controller.dto';
import { MenuService } from './menu.service';

import _ from 'lodash';
import { GetRestaurantInfoDto } from '../restaurant/dto/restaurant.dto';
import { ApiResponse } from '../models/api-response';
import { CreateOrderDto } from 'src/payments/dtos/payments.controller.dto';
import { logger } from 'src/logger/pino.logger';

@Controller('menu-app/')
export class MenuController {
  private readonly logger: typeof logger;

  constructor(private readonly menuService: MenuService) {
    this.logger = logger.child({ context: 'MenuController' });
  }

  @Get('/:restauranId')
  async getRestaurantById(
    @Param() params: GetRestaurantInfoDto,
    @Res() res: Response,
  ): Promise<Response<ApiResponse<RestaurantResponseDto>>> {
    const restaurant = await this.menuService.getRestaurantById(params.restauranId);

    if (!restaurant) throw new NotFoundException();
    return res.status(HttpStatus.OK).json({ data: restaurant });
  }

  @Get('/order/:orderId')
  async getOrderStatus(@Param() params: GetOrderInfoDto, @Res() res: Response, @Req() req: Request) {
    const orderId = params.orderId;

    try {
      const orderStatus = await this.menuService.getStatus(orderId);

      return res.status(HttpStatus.OK).json(orderStatus);
    } catch (error) {
      throw error;
    }
  }

  @Post('/restaurant/order')
  async createOrder(@Body() body: CreateOrderDto, @Res() res: Response, @Req() req: Request) {
    const requestId = req['requestId'];
    this.logger.trace(
      {
        module: 'menu',
        event: 'create-order',
        restaurantId: body.restaurantId,
        correlationId: requestId,
      },
      'Creating order without payment',
    );
    const orderId = await this.menuService.createOrder(body, requestId);
    if (!orderId) throw new BadRequestException('Failed to create order');
    res.status(HttpStatus.CREATED).json(orderId);
  }
}
