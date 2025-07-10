import { useMutation, useQuery } from '@tanstack/react-query';
import { axiosInstance } from './axiosInstance';

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
}

interface Origin {
  id: string;
  name: string;
}

interface CreateOrderRequest {
  restaurantId: string;
  paymentId: string;
  origin: Origin;
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

export function useToken(restaurantId: string, requestUuid: string) {
  if (!restaurantId) {
    throw new Error('restaurantId is required');
  }

  return useQuery<TokenResponse>({
    queryKey: ['token', restaurantId, requestUuid],
    queryFn: async () => {
      const response = await axiosInstance.post<TokenResponse>(
        `payments/start-transaction/${restaurantId}`,
        {},
        {
          headers: {
            'X-Request-Id': requestUuid,
          },
        }
      );
      return response.data;
    },
    staleTime: Infinity,
  });
}

export function useCompletePayment() {
  return useMutation<TransactionResponse, Error, { order: CreateOrderRequest; requestUuid: string }>({
    mutationFn: async ({ order, requestUuid }) => {
      const response = await axiosInstance.post<TransactionResponse>('payments/complete-transaction', order, {
        headers: {
          'X-Request-Id': requestUuid,
        },
      });
      return response.data;
    },
  });
}
