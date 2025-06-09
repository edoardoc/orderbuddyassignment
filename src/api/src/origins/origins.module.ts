import { Module } from '@nestjs/common';
import { OriginsService } from './origins.service';
import { OriginsController } from './origins.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [OriginsController],
  providers: [OriginsService, UsersService],
})
export class OriginsModule {}
