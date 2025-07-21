import { IsNotEmpty, IsString } from "class-validator";

export class OrderHistoryDto {
  @IsNotEmpty()
  @IsString()
  restaurantId: string;
  @IsNotEmpty()
  @IsString()
  locationId: string;

  @IsNotEmpty()
  @IsString()
  date: string;
}