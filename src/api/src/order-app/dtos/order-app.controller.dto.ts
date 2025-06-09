import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ValidateNested,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongodb';

// Request DTOs
export class GetEntryInfoDto {
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @IsNotEmpty()
  @IsString()
  locationId: string;

  @IsNotEmpty()
  @IsString()
  originId: string;
}

export class GetMenusParamDto {
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @IsNotEmpty()
  @IsString()
  locationId: string;
}

export class GetMenuParamDto extends GetMenusParamDto {
  @IsNotEmpty()
  @IsString()
  menuId: string;
}

export class GetOrderStatusParamDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;
}

// Response DTOs
export class MultilingualDto {
  @IsNotEmpty()
  @IsString()
  en: string;

  @IsNotEmpty()
  @IsString()
  es: string;

  @IsNotEmpty()
  @IsString()
  pt: string;
}
export class RestaurantDto {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  concept: string;

  @IsNotEmpty()
  @IsString()
  logo: string;
}

export class LocationDto {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @IsString()
  locationId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  isActive: string;
}

export class OriginInfoDto {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @IsString()
  originId: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}

export class EntryInfoDto {
  @ValidateNested()
  @Type(() => RestaurantDto)
  restaurant: RestaurantDto;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ValidateNested()
  @Type(() => OriginInfoDto)
  origin: OriginInfoDto;
}

export class MenuSummaryDto {
  @IsNotEmpty()
  @Type(() => ObjectId)
  _id: ObjectId;

  @IsNotEmpty()
  @IsString()
  menuSlug: string;

  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @IsNotEmpty()
  available: boolean;
}
export class VariantDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  priceCents: number;

  @IsOptional()
  @IsBoolean()
  default?: boolean;
}

export class ModifierOptionDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @IsNotEmpty()
  @IsNumber()
  priceCents: number;
}

export class ModifierDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @IsNotEmpty()
  @IsNumber()
  maxChoices: number;

  @IsNotEmpty()
  @IsNumber()
  freeChoices: number;

  @IsNotEmpty()
  @IsNumber()
  extraChoicePriceCents: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierOptionDto)
  options: ModifierOptionDto[];
}

export class MenuItemDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @ValidateNested()
  @Type(() => MultilingualDto)
  description: MultilingualDto;

  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];

  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsNotEmpty()
  @IsNumber()
  priceCents: number;

  @IsNotEmpty()
  @IsNumber()
  makingCostCents: number;

  @IsNotEmpty()
  @IsBoolean()
  isAvailable: boolean;

  @IsArray()
  @IsString({ each: true })
  stationTags: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants?: VariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierDto)
  modifiers?: ModifierDto[];
}

export class MenuDto {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @IsNotEmpty()
  @IsString()
  locationId: string;

  @IsNotEmpty()
  @IsString()
  menuId: string;

  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  categories: CategoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  items: MenuItemDto[];

  @IsNumber()
  salesTax: number;
}

export class CartItemInput {
  @IsNotEmpty()
  @IsString()
  menuItemId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  modifiers?: Record<string, any>;
}

export class CartItemDto {
  @IsNotEmpty()
  @IsString()
  menuItemId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  priceCents: number;

  @IsNotEmpty()
  @IsNumber()
  subtotalCents: number;
}

export class CartSummaryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsNotEmpty()
  @IsNumber()
  totalCents: number;

  @IsNotEmpty()
  @IsNumber()
  taxesCents: number;

  @IsNotEmpty()
  @IsNumber()
  grandTotalCents: number;
}

export class CustomerInfoDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CheckoutFormDto {
  @IsNotEmpty()
  @IsString()
  originId: string;

  @IsNotEmpty()
  @IsString()
  menuId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemInput)
  items: CartItemInput[];

  @IsNotEmpty()
  @IsEnum(['card', 'wallet'])
  paymentMethod: 'card' | 'wallet';

  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo: CustomerInfoDto;
}

export class OrderConfirmationDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsString()
  createdAt: string;

  @IsOptional()
  @IsString()
  estimatedReadyAt?: string;

  @IsNotEmpty()
  @IsEnum(['pending', 'accepted', 'ready'])
  status: 'pending' | 'accepted' | 'ready';
}

export class OrderStatusDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsEnum(['pending', 'accepted', 'ready', 'picked_up', 'cancelled'])
  status: 'pending' | 'accepted' | 'ready' | 'picked_up' | 'cancelled';

  @IsNotEmpty()
  @IsString()
  updatedAt: string;
}

export class CategoryDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => MultilingualDto)
  name: MultilingualDto;

  @ValidateNested()
  @Type(() => MultilingualDto)
  description: MultilingualDto;

  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @IsNotEmpty()
  @IsNumber()
  sortOrder: number;

  @IsOptional()
  @IsString()
  @MaxLength(4, { message: 'Only one emoji allowed' })
  emoji?: string;
}
