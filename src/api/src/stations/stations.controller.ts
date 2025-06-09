import { Controller, Get, Param, Res, HttpStatus, UseGuards, Body, Post, Query, ValidationPipe } from '@nestjs/common';
import { Response } from 'express';
import { StationsService } from './stations.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiResponse } from 'src/models/api-response';
import {
  CreateStationDto,
  GetStationOrderParamsDto,
  GetStationsParamsDto,
  StationDto,
  StationOrderResponseDto,
  UpdateOrderItemDto,
} from './dto/create-station.dto';

@UseGuards(AuthGuard)
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  async createStation(
    @Body() createStationDto: CreateStationDto,
    @Res() res: Response
  ): Promise<Response<ApiResponse<StationDto>>> {
    try {
      const station = await this.stationsService.createStation(createStationDto);
      return res.status(HttpStatus.CREATED).json({
        data: station,
      });
    } catch (error) {
      throw error;
    }
  }

  @Get(':restaurantId/:locationId')
  async getStations(
    @Param() params: GetStationsParamsDto,
    @Res() res: Response
  ): Promise<Response<ApiResponse<StationDto[]>>> {
    try {
      const stations = await this.stationsService.getStations(params.restaurantId, params.locationId);

      return res.status(HttpStatus.OK).json({
        data: stations,
      });
    } catch (error) {
      throw error;
    }
  }

  @Get(':restaurantId/:locationId/:stationId/orders')
  async getOrdersByStationId(
    @Param('restaurantId') restaurantId: string,
    @Param('locationId') locationId: string,
    @Param('stationId') stationId: string,
    @Res() res: Response
  ): Promise<Response<ApiResponse<any>>> {
    try {
      const result = await this.stationsService.getOrdersByStationId(restaurantId, locationId, stationId);

      return res.status(HttpStatus.OK).json({
        data: result,
      });
    } catch (error) {
      throw error;
    }
  }

  @Get(':restaurantId/:locationId/orders/:orderId')
  async getStationSingleOrder(
    @Param() params: GetStationOrderParamsDto,
    @Query('stationTags') stationTagsStr: string,

    @Res() res: Response
  ): Promise<Response<ApiResponse<StationOrderResponseDto>>> {
    try {
      const stationTags = stationTagsStr ? stationTagsStr.split(',') : [];

      const order = await this.stationsService.getStationSingleOrder(
        params.restaurantId,
        params.locationId,
        params.orderId,
        stationTags
      );

      return res.status(HttpStatus.OK).json({
        data: order,
      });
    } catch (error) {
      throw error;
    }
  }

  @Post('order-item')
  async updateOrderItem(
    @Body() updateOrderItemDto: UpdateOrderItemDto,
    @Res() res: Response
  ): Promise<Response<ApiResponse<boolean>>> {
    try {
      const result = await this.stationsService.updateOrderItem(updateOrderItemDto);
      return res.status(HttpStatus.OK).json({
        data: result,
        message: `Order item ${updateOrderItemDto.orderItemStatus.toLowerCase()} successfully`,
      });
    } catch (error) {
      throw error;
    }
  }
}
