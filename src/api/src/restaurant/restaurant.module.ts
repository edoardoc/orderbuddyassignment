import { Module } from '@nestjs/common'
import { RestaurantService } from './restaurant.service'
import { RestaurantController } from './restaurant.controller'
import { ConfigService } from '@nestjs/config'
import { UsersService } from '../users/users.service'

@Module({
  controllers: [RestaurantController],
  providers: [RestaurantService, ConfigService, UsersService],
  exports: [RestaurantService],
})
export class RestaurantModule {}
