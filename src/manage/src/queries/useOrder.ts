import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from './axiosInstance';
import { OrderStatus } from '../constants';

export interface Customer {
  name: string;
  phone: string;
}

export interface Origin {
  id: string;
  name: string;
}

export interface Variant {
  id: string;
  name: string;
}

export interface Modifier {
  id: string;
  name: string;
  options?: Array<{
    id: string;
    name: string;
    priceCents?: number;
  }>;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  priceCents: number;
  modifiers: Modifier[];
  variants: Variant[];
  stationTags: string[];
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface Order {
  _id: string;
  orderCode: string;
  paymentId: string;
  meta: {
    correlationId: string;
  };
  restaurant: string;
  customer: Customer;
  origin: Origin;
  items: OrderItem[];
  startedAt: Date;
  totalPriceCents: number;
  getSms: boolean;
  status: string;
  endedAt?: Date;
}

export function useTodayOrders(
  restaurantId: string,
  locationId: string,
  addItemToMap: (key: string, value: Order) => void,
  addCompletedOrderToMap: (key: string, value: Order) => void,
  correlationId?: string
) {
  if (!restaurantId || !locationId) {
    throw new Error('restaurantId and locationId required');
  }

  return useQuery<Order[]>({
    queryKey: ['todayOrders', restaurantId, locationId, correlationId],
    queryFn: async () => {
      const res = await axiosInstance.get<Order[]>(`restaurant/orders/today/${restaurantId}/${locationId}`, {
        headers: {
          'X-Request-Id': correlationId,
        },
      });
      if (!res.data) {
        throw new Error('No today orders found');
      }
      // Sort and process orders
      const orders = res.data.sort().reverse();

      let firstActiveOrder: Order | null = null;

      if (orders.length > 0) {
        orders.forEach((order) => {
          if (order.status === OrderStatus.Completed) {
            addCompletedOrderToMap(order._id, order);
          } else {
            addItemToMap(order._id, order);
            if (!firstActiveOrder) {
              firstActiveOrder = order;
            }
          }
        });
      }

      return orders;
    },
    enabled: Boolean(restaurantId && locationId),
  });
}
