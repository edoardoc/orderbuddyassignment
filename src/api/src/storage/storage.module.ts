import { Module } from '@nestjs/common';
import { AzureStorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  controllers: [StorageController],
  providers: [AzureStorageService],
})
export class StorageModule {}
