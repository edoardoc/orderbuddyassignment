import { Injectable, NotFoundException } from '@nestjs/common';
import { Db, Collection, ObjectId } from 'mongodb';
import { InjectClient } from 'nest-mongodb-driver';
import { CreateOriginDto } from './dto/create-origin.dto';
import { COLLECTIONS } from '../db/collections';
import { Origin, Restaurant, Location } from 'src/db/models';
import { OriginDto } from './dto/get-origin.dtos';
import { UpdateQrStyleDto } from './dto/update-origin.dtos';
import { AzureStorageService } from 'src/storage/storage.service';

@Injectable()
export class OriginsService {
  private readonly originsCollection: Collection<Origin>;
  private readonly restaurantsCollection: Collection<Restaurant>;
  private readonly locationCollection: Collection<Location>;

  constructor(
    @InjectClient() private readonly db: Db,
    private readonly storageService: AzureStorageService
  ) {
    this.originsCollection = this.db.collection<Origin>(COLLECTIONS.ORIGINS);
    this.restaurantsCollection = this.db.collection(COLLECTIONS.RESTAURANTS);
    this.locationCollection = this.db.collection<Location>(COLLECTIONS.LOCATIONS);
  }
  async getRestaurantDetails(restaurantId: string) {
    const restaurantdata = this.db
      .collection<Restaurant>(COLLECTIONS.RESTAURANTS)
      .findOne({ _id: restaurantId }, { projection: { _id: 1, name: 1, concept: 1, logo: 1 } });
    if (!restaurantdata) {
      throw new NotFoundException(`Restaurant ${restaurantId} not found`);
    }

    return restaurantdata;
  }
  async getLocationDetails(restaurantId: string, locationId: string) {
    const location = await this.locationCollection.findOne(
      {
        restaurantId,
        _id: new ObjectId(locationId),
      },
      {
        projection: {
          locationSlug: 1,
          name: 1,
        },
      }
    );

    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found`);
    }

    return location;
  }
  async findAllOrigins(restaurantId: string, locationId: string): Promise<OriginDto[]> {
    const location = await this.locationCollection.findOne(
      { restaurantId, _id: new ObjectId(locationId) },
      { projection: { qrCodeStyle: 1, qrCodeImage: 1 } }
    );

    const query = {
      restaurantId,
      locationId: new ObjectId(locationId),
    };

    const projection = {
      _id: 1,
      restaurantId: 1,
      locationId: 1,
      label: 1,
      qrCodeId: 1,
      qrCode: 1,
      type: 1,
    };
    const origins = await this.originsCollection.find<Origin>(query, { projection }).toArray();

    if (!origins || origins.length === 0) {
      throw new NotFoundException(`No origins found for restaurant ${restaurantId} and location ${locationId}`);
    }

    return origins.map((origin) => ({
      ...origin,
      qrCodeStyle: location?.qrCodeStyle,
      qrCodeImage: location?.qrCodeImage,
    }));
  }

  async createOrigin(restaurantId: string, locationId: string, createOriginDto: CreateOriginDto): Promise<OriginDto> {
    const originId = new ObjectId();

    const origin = {
      _id: originId,
      restaurantId,
      locationId: new ObjectId(locationId),
      label: createOriginDto.name,
      qrCode: createOriginDto.qrCode,
      qrCodeId: createOriginDto.qrCodeId,
      type: (createOriginDto.type || 'table') as 'table' | 'parking' | 'kiosk',
    };

    const result = await this.originsCollection.insertOne(origin);

    if (!result.acknowledged) {
      throw new Error('Failed to create origin');
    }

    return origin;
  }

  async updateOrigin(originId: ObjectId, updateData: Partial<Origin>): Promise<OriginDto> {
    const result = await this.originsCollection.findOneAndUpdate(
      { _id: originId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new NotFoundException(`Origin ${originId} not found`);
    }

    return result;
  }

  async updateQrStyle(restaurantId: string, locationId: string, updateQrStyleDto: UpdateQrStyleDto): Promise<void> {
    const result = await this.locationCollection.updateOne(
      {
        restaurantId,
        _id: new ObjectId(locationId),
      },
      {
        $set: {
          qrCodeStyle: updateQrStyleDto.qrCodeStyle,
          qrCodeImage: updateQrStyleDto.qrCodeImage,
        },
      }
    );

    if (!result.matchedCount) {
      throw new NotFoundException(`Origin not found for restaurant ${restaurantId} and location ${locationId}`);
    }

    if (!result.modifiedCount) {
      throw new Error('Failed to update QR style');
    }
  }
  async uploadLogo(file: Express.Multer.File, restaurantId: string): Promise<string> {
    try {
      const imageUrl = await this.storageService.uploadLogoImage(file.buffer, file.originalname, restaurantId, 'logo');
      await this.restaurantsCollection.updateOne({ _id: restaurantId }, { $set: { logo: imageUrl } });
      return imageUrl;
    } catch (error) {
      throw new Error(`Failed to upload logo: ${error.message}`);
    }
  }
}
