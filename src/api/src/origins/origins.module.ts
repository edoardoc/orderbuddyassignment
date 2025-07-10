import { Module } from '@nestjs/common';
import { OriginsService } from './origins.service';
import { OriginsController } from './origins.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [HttpModule, ConfigModule, StorageModule],
  controllers: [OriginsController],
  providers: [OriginsService, UsersService],
})
export class OriginsModule {}
