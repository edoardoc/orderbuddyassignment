import { IsString, IsBoolean, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class WorkingHourDto {
  @IsString()
  day: string;

  @IsBoolean()
  isOpen: boolean;

  @IsString()
  @IsOptional()
  startTime: string | null;

  @IsString()
  @IsOptional()
  endTime: string | null;
}

export class OrderTimingDto {
  @IsNumber()
  @IsOptional()
  acceptOrdersAfterMinutes: number;

  @IsNumber()
  @IsOptional()
  stopOrdersBeforeMinutes: number;
}

export class CreateLocationSettingDto {
  @IsString()
  restaurantId: string;

  @IsString()
  locationId: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  workingHours: WorkingHourDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => OrderTimingDto)
  orderTiming?: OrderTimingDto;
}
