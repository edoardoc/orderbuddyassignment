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
  payment: {
    acceptPayment: boolean;
  };
  opening_hours: {
    from: string;
    to: string;
    timezone: string;
  };
  isMobile: boolean;
  printers: PrinterData[];
}

export interface PrinterData {
  id: ObjectId;
  name: string;
  ip: string;
  type?: string;
}
