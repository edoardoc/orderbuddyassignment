import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from './axiosInstance';
import moment from 'moment-timezone';

interface Station {
  id: string;
  name: string;
}

interface OrderStatus {
  _id: string;
  status: 'ORDER_PLACED' | 'READY_FOR_PICKUP' | 'COMPLETED';
  startedAt: string;
  waitTimeInMinutes: number;
  station: Station;
}

interface UseOrderStatusOptions {
  onStatusChange?: (status: OrderStatus) => void;
  onTimeUpdate?: (remainingMinutes: number) => void;
  onStationUpdate?: (station: Station) => void;
}

export function useOrderStatus(orderId: string, options: UseOrderStatusOptions = {}) {
  if (!orderId) {
    throw new Error('orderId required');
  }

  return useQuery<OrderStatus>({
    queryKey: ['orderStatus', orderId],
    queryFn: async () => {
      const res = await axiosInstance.get<OrderStatus>(`menu-app/order/${orderId}`);

      const orderStatus = res.data;

      // Calculate remaining time
      const utcTime = orderStatus.startedAt;
      const orderTime = moment.tz(utcTime, moment.tz.guess());
      const currentTime = moment();
      const timeDiffInMinutes = currentTime.diff(orderTime, 'minutes');
      const remainingTimeInMinutes = orderStatus.waitTimeInMinutes - timeDiffInMinutes;

      // Call the callbacks if provided
      if (options.onTimeUpdate) {
        options.onTimeUpdate(remainingTimeInMinutes);
      }

      if (options.onStationUpdate) {
        options.onStationUpdate(orderStatus.station.id ? orderStatus.station : { id: '', name: 'Web' });
      }

      if (options.onStatusChange) {
        options.onStatusChange(orderStatus);
      }

      return orderStatus;
    },
  });
}
