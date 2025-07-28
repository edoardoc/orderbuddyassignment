import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { ApiResponse } from './api-response';
import { handleApiResponse } from './apiHandle';
import { axiosInstance } from './axiosInstance';
import { logApiError } from '@/utils/errorLogger';
import { v4 as uuid } from 'uuid';

export function useCreateOrder() {
  const requestUuid = uuid();

  return useMutation<any, Error, any>({
    mutationFn: async (orderData: any) => {
      try {
        const response = await axiosInstance.post<ApiResponse<any>>('menu-app/restaurant/order', orderData, {
          headers: {
            'X-Request-Id': requestUuid,
          },
        });
     
        return response.data;
      } catch (error) {
        logApiError(error, 'menu-app/restaurant/order', {
          operation: 'createOrder',
          restaurantId: orderData.restaurantId,
          locationId: orderData.locationId,
          requestId: requestUuid,
          orderItems: orderData.items?.length
        });
        throw error;
      }
    },
    onError: (error) => {
      logApiError(error, 'menu-app/restaurant/order', { 
        operation: 'createOrderMutation',
        requestId: requestUuid
      });
    }
  });
}
