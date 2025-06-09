import { useMutation, useQuery } from '@tanstack/react-query';
import { axiosInstance } from './axiosInstance';
import { v4 as uuid } from 'uuid'; // Import uuid for generating unique request IDs
import { appStore } from '../../store';

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
}

interface Station {
  id: string;
  name: string;
}

interface CreateOrderRequest {
  restaurantId: string;
  paymentId: string;
  station: Station;
  customer: Customer;
  items: OrderItem[];
  getSms: boolean;
}
interface Customer {
  name: string;
  phone: string;
}
interface TransactionResponse {
  transaction: {
    resultMessage: string;
    resultStatus: string;
  };
  orderId: string;
}

interface TokenResponse {
  transactionToken: string;
}

export function useToken(restaurantId: string) {
  const setUuid = appStore((state) => state.setUuid);
  const currentUuid = appStore((state) => state.uuid);

  if (!restaurantId) {
    throw new Error('restaurantId is required');
  }

  return useQuery<TokenResponse>({
    queryKey: ['token', restaurantId],
    queryFn: async () => {
      const requestId = currentUuid || uuid();
      if (!currentUuid) {
        setUuid(requestId);
      }
      const response = await axiosInstance.post<TokenResponse>(
        `payments/start-transaction/${restaurantId}`,
        {},
        {
          headers: {
            'X-Request-Id': requestId,
          },
        }
      );
      return response.data;
    },
  });
}

export function useCompletePayment() {
  const currentUuid = appStore((state) => state.uuid);

  return useMutation<TransactionResponse, Error, CreateOrderRequest>({
    mutationFn: async (createOrder) => {
      const response = await axiosInstance.post<TransactionResponse>('payments/complete-transaction', createOrder, {
        headers: {
          'X-Request-Id': currentUuid, // Use the same requestId
        },
      });
      return response.data;
    },
  });
}
