import { IsNotEmpty, IsOptional } from 'class-validator';

export interface PaymentRequestBody {
  amount: number;
  currency: string;
}

export class GetStoreInfoDto {
  @IsNotEmpty() restaurantId!: string;
}

export class CreateOrderDto {
  @IsNotEmpty() restaurantId!: string;
  @IsNotEmpty() locationId!: string;
  @IsOptional()
  paymentId?: string;
  @IsNotEmpty() station!: Station;
  @IsNotEmpty() customer!: Customer;
  @IsNotEmpty() items!: OrderItemDto[];
  @IsNotEmpty() getSms!: boolean;
  @IsOptional()
  transactionDetails?: any;
}

export interface Station {
  id: string;
  name: string;
}

export interface Customer {
  name: string;
  phone: string;
}

export interface OrderItemDto {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  startedAt: Date;
  completedAt: Date;
  modifiers?: any[];
  variants?: any[];
  stationTags?: string[];
}
