export class JoinStationDto {
  restaurantId!: string;
  stationId!: string;
  stationTags!: string[];
}

export class JoinDisplayDto {
  restaurantId!: string;
  displayId!: string;
}

export class OrderSubmittedDto {
  restaurantId!: string;
  orderId!: string;
  locationId!: string;
  correlationId?: string;
}

export class DisplayIdDto {
  displayId!: string;
}

export class JoinStoreDto {
  restaurantId!: string;
  locationId!: string;
}
export class JoinOrderDto {
  restaurantId!: string;
  orderId!: string;
  displayIds!: string[];
}

export class OrderCompletedDto {
  restaurantId!: string;
  orderId!: string;
}

export class OrderItemCompletedDto {
  restaurantId!: string;
  orderId!: string;
  itemId!: string;
  locationId!: string;
  stationTags!: string[]; // Add this field
}

export class OrderItemStartedDto {
  restaurantId!: string;
  locationId!: string;
  orderId!: string;
  itemId!: string;
  stationTags!: string[]; // Add this field
}

export class OrderPickupDto {
  restaurantId!: string;
  orderId!: string;
}

export class OrderReceivedDto {
  restaurantId!: string;
  orderId!: string;
}

export class UpdateOrderWaitTimeDto {
  restaurantId!: string;
  orderId!: string;
  waitTime!: number;
}
