import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from './axiosInstance';

interface Customer {
  name: string;
  phone: string;
}

interface Station {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  name: string;
}

interface Modifier {
  id: string;
  name: string;
  options?: Array<{
    id: string;
    name: string;
    priceCents?: number;
  }>;
}

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  modifiers: Modifier[];
  variants: Variant[];
  stationTags: string[];
  startedAt: Date | null;
  completedAt: Date | null;
}
interface Order {
  _id: string;
  paymentId: string;
  restaurant: string;
  customer: Customer;
  station: Station;
  items: OrderItem[];
  startedAt: Date;
  totalPrice: number;
  getSms: boolean;
  status: string;
}
// ...existing code...

export function useActiveOrder(
  restaurantId: string,
  locationId: string,
  addItemToMap: (key: string, value: Order) => void,
  setSelectedOrder: (order: Order) => void,
  correlationId?: string
) {
  if (!restaurantId || !locationId) {
    throw new Error('restaurantId and locationId required');
  }

  return useQuery<Order[]>({
    queryKey: ['activeOrders', restaurantId, locationId, correlationId],
    queryFn: async () => {
      const res = await axiosInstance.get<Order[]>(`restaurant/active-orders/${restaurantId}/${locationId}`, {
        headers: {
          'X-Request-Id': correlationId,
        },
      });

      if (!res.data) {
        throw new Error('No active orders found');
      }

      // Sort and process orders
      const orders = res.data.sort().reverse();

      if (orders.length > 0) {
        orders.forEach((order) => {
          addItemToMap(order._id, order);
        });
        setSelectedOrder(orders[0]);
      }

      return orders;
    },
    enabled: Boolean(restaurantId && locationId),
  });
}
