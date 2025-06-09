import { useMutation } from '@tanstack/react-query';
import { axiosInstance } from './axiosInstance';
import { client } from '../Client';

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
interface OrderStatusInfo {
  orderId: string;
  orderStatus: string;
}

interface UseOrderStatusProps {
  activeOrders: Map<string, Order>;
  setSelectedOrder: (order: Order | null) => void;
  notifyPickupOrder: (orderId: string) => void;
  notifyCompleteOrder: (orderId: string) => void;
  restaurantId: string;
  authToken: string;
}

export function useOrderStatus({
  activeOrders,
  setSelectedOrder,
  restaurantId,
  authToken,
  notifyPickupOrder,
  notifyCompleteOrder,
}: UseOrderStatusProps) {
  return useMutation({
    mutationFn: async ({ orderId, orderStatus }: OrderStatusInfo) => {
      const orderInfo = {
        orderId,
        orderStatus,
      };

      const response = await axiosInstance.post('restaurant/order-status/', orderInfo, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      return response.data;
    },
    onSuccess: (_, variables) => {
      const { orderId, orderStatus } = variables;

      if (activeOrders.has(orderId)) {
        const order = activeOrders.get(orderId)!;

        if (order.status === 'ORDER_PLACED') {
          order.status = 'READY_FOR_PICKUP';
          return activeOrders;
        }

        if (order.status === 'READY_FOR_PICKUP' && orderStatus === 'READY_FOR_PICKUP') {
          order.status = 'COMPLETED';
          return activeOrders;
        }

        // Handle order completion
        const completedOrder = activeOrders.get(orderId);
        if (completedOrder) {
          activeOrders.delete(orderId);
        }

        // Set next order as selected
        const nextOrder = activeOrders.entries().next().value;
        setSelectedOrder(nextOrder ? nextOrder[1] : null);
      }
    },
    onSettled: (_, __, variables) => {
      const { orderId, orderStatus } = variables;

      if (orderStatus === 'READY_FOR_PICKUP') {
        notifyPickupOrder(orderId);
      } else if (orderStatus === 'COMPLETED') {
        notifyCompleteOrder(orderId);
      }
    },
  });
}
