import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';
import { InjectClient } from 'nest-mongodb-driver';
import { Db, ObjectId } from 'mongodb';
import { COLLECTIONS } from 'src/db/collections';
import { Location } from 'src/db/models';

@Injectable()
export class PrintersService {
  constructor(@InjectClient() private readonly db: Db) {}

  async create(restaurantId: string, locationId: string, createPrinterDto: CreatePrinterDto) {
    const printer = {
      id: new ObjectId(),
      type: 'lan',
      ...createPrinterDto,
    };

    await this.db.collection<Location>(COLLECTIONS.LOCATIONS).updateOne(
      {
        restaurantId,
        _id: new ObjectId(locationId),
      },
      {
        $push: { printers: printer },
      }
    );

    return printer;
  }

  async findAll(restaurantId: string, locationId: string) {
    const location = await this.db.collection(COLLECTIONS.LOCATIONS).findOne({
      restaurantId,
      _id: new ObjectId(locationId),
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location.printers || [];
  }
}
