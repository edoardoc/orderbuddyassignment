import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

//request

export class CreateOriginsParamsDto {
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @IsNotEmpty()
  @IsString()
  locationId: string;
}

export class OriginsParamsDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsEnum(['table', 'parking'])
  type: 'table' | 'parking';
}

// Response
export class LogoUploadParamsDto {
  @IsNotEmpty()
  @IsString()
  restaurantId: string;
  @IsNotEmpty()
  @IsString()
  locationId: string;
}
export class CreateOriginDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @IsNotEmpty()
  @IsString()
  qrCodeId: string;

  @IsEnum(['table', 'parking'])
  type: 'table' | 'parking';
}
