import { ObjectId } from 'mongodb';
import { QrCodeStyle } from 'src/origins/dto/update-origin.dtos';

export interface Location {
  _id: ObjectId;
  restaurantId: string;
  locationSlug: string;
  name: string;
  address: string;
  timezone: string;
  isActive: boolean;
  qrCodeStyle: QrCodeStyle;
  qrCodeImage: string;
  qrCodeId: string;
  createdAt: Date;
  updatedAt: Date;
}
