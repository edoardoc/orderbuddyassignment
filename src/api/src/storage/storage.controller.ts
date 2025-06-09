import { Controller, Post, Param } from '@nestjs/common';
import { AzureStorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: AzureStorageService) {}

  @Post('sas-token/:restaurantId')
  async getSasToken(@Param('restaurantId') restaurantId: string) {
    console.log(`Generating SAS token for restaurant: ${restaurantId}`);
    const sasToken = await this.storageService.generateSasToken(restaurantId);
    // return { sasToken };
    return {
      success: true,
      data: {
        sasToken,
      },
    };
  }
}
