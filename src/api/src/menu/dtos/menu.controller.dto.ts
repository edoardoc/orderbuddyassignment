import { Expose, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

// Basic DTOs without dependencies first
export class GetOrderInfoDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;
}

export class OrderStatusDto {
  @IsString()
  orderTime!: Date;

  @IsNumber()
  waitTime!: number;

  @IsString()
  status!: string;
}

export class CustomerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class StationDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class GetOriginDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  url!: string;
}
export class ModifierOptionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
export class OrderItemModifierDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ModifierOptionDto)
  options?: ModifierOptionDto[];
}

export class OrderItemVariantDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  menuItemId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderItemModifierDto)
  modifiers?: OrderItemModifierDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderItemVariantDto)
  variants?: OrderItemVariantDto[];

  @IsArray()
  @IsNotEmpty()
  stationTags?: string[];

  @IsString()
  startedAt: Date;
  @IsString()
  completedAt: Date;
}

export class ContactDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  email!: string;
}

export class GeoDto {
  @Expose()
  @IsNotEmpty()
  lat!: number;

  @Expose()
  @IsNotEmpty()
  lng!: number;
}

export class MenuDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Expose()
  schedule!: {
    type: string;
    rules: {
      start: string;
      end: string;
    };
  };
}

export class LocationDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  address!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  timezone!: string;

  @Expose()
  @ValidateNested()
  @Type(() => ContactDto)
  contact!: ContactDto;

  @Expose()
  @ValidateNested()
  @Type(() => GeoDto)
  geo!: GeoDto;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuDto)
  menus!: MenuDto[];

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GetOriginDto)
  origins!: GetOriginDto[];

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => getStationDto)
  stations!: getStationDto[];
}

export class getStationDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Expose()
  @IsArray()
  @IsOptional()
  stationtags?: string[];
}

export class PaymentDto {
  @Expose()
  @IsNotEmpty()
  acceptPayment!: boolean;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Expose()
  @IsNotEmpty()
  oid!: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  auth!: string;
}

export class RestaurantResponseDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  _id!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  concept!: string;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  locations!: LocationDto[];

  // @Expose()
  // @ValidateNested()
  // @Type(() => PaymentDto)
  // payment!: PaymentDto
}
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  restaurantId!: string;

  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @IsString()
  @IsOptional()
  paymentId?: string;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => StationDto)
  station!: StationDto;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  items!: OrderItemDto[];

  @IsBoolean()
  @IsNotEmpty()
  getSms!: boolean;

  @IsOptional()
  transactionDetails?: any;
}
export interface Customer {
  name: string;
  phone: string;
}

export interface Station {
  id: string;
  name: string;
}
