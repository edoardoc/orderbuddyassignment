import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectClient } from 'nest-mongodb-driver';
import { Db, ObjectId } from 'mongodb';
import { UpdateLocationSettingDto } from './dto/update-location-setting.dto';
import { COLLECTIONS } from 'src/db/collections';
import { Location } from 'src/db/models';

@Injectable()
export class LocationSettingsService {
  constructor(@InjectClient() private readonly db: Db) {}

  private readonly locationSettingsProjection = {
    _id: 1,
    restaurantId: 1,
    name: 1,
    address: 1,
    timezone: 1,
    workingHours: 1,
    orderTiming: 1,
  };

  async findOne(locationId: string, restaurantId: string) {
    const location = await this.db.collection<Location>(COLLECTIONS.LOCATIONS).findOne(
      {
        restaurantId,
        _id: new ObjectId(locationId),
      },
      {
        projection: this.locationSettingsProjection,
      },
    );

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    return location;
  }

  async update(locationId: string, restaurantId: string, updateLocationSettingDto: UpdateLocationSettingDto) {
    const updateResult = await this.db.collection<Location>(COLLECTIONS.LOCATIONS).updateOne(
      {
        restaurantId,
        _id: new ObjectId(locationId),
      },
      {
        $set: updateLocationSettingDto,
      },
    );

    if (updateResult.matchedCount === 0) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    // Re-fetch the updated document with projection
    return this.findOne(locationId, restaurantId);
  }
}
