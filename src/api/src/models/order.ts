import { ObjectId } from 'mongodb';

export class Order {
  paymentId!: string;
  restaurantId!: string;
  station!: Station;
  customer!: Customer;
  items!: OrderItem[];
  startedAt!: Date;
  endedAt?: Date;
  waitTimeInMinutes!: number;
  status!: string;
  totalPrice!: number;
  isTakeaway!: boolean;
  getSms!: boolean;
}

export class Customer {
  name!: string;
  phone!: string;
}

export class Station {
  id!: ObjectId | string;
  name!: string;
}
export class OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  public modifiers?: any[];
  public variants?: any[];
  public stationTags?: string[];
  public startedAt: Date;
  public completedAt: Date;

  constructor(
    id: string,
    menuItemId: string,
    name: string,
    price: number,
    startedAt: Date,
    completedAt: Date,
    modifiers?: any[],
    variants?: any[],
    stationTags?: string[]
  ) {
    this.id = id;
    this.menuItemId = menuItemId;
    this.name = name;
    this.price = price;
    this.modifiers = modifiers;
    this.variants = variants;
    this.stationTags = stationTags;
    this.startedAt = startedAt;
    this.completedAt = completedAt;
  }
}

export class OrderResponse {
  orderId!: ObjectId;
  orderTime!: Date;
  waitingTime!: number;
  status!: string;
}

export class StatusResponse {
  orderTime!: Date;
  waitingTime!: number;
  status!: string;
}
