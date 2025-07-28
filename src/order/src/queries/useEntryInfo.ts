import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { axiosInstance } from '@/queries/axiosInstance';
import { ApiResponse } from '@/queries/api-response';
import { handleApiResponse } from './apiHandle';
import { logApiError } from '@/utils/errorLogger';

const restaurantResponseSchema = z.object({
  restaurant: z.object({
    _id: z.string(),
    name: z.string(),
    concept: z.string(),
    logo: z.string().optional(),
  }),
  location: z.object({
    _id: z.string(),
    locationSlug: z.string(),
    name: z.string(),
    isActive: z.boolean(),
    acceptPayment: z.boolean(),
    isOpen: z.boolean(),
  }),
  origin: z.object({
    _id: z.string(),
    label: z.string(),
  }),
});

export type RestaurantResponse = z.infer<typeof restaurantResponseSchema>;

export function useEntryInfo(restaurantId: string, locationId: string, originId: string) {
  return useQuery<RestaurantResponse>({
    queryKey: ['restaurant', restaurantId, locationId, originId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<ApiResponse<RestaurantResponse>>(
          `order-app/restaurants/${restaurantId}/locations/${locationId}/origins/${originId}/entry-info`,
        );
        const data = handleApiResponse(response);
        const parsedData = restaurantResponseSchema.safeParse(data);
        if (!parsedData.success) {
          // Keep existing console.error
          console.error('useRestaurant response schema error: ', parsedData.error);

          // Add Application Insights logging
          logApiError(
            parsedData.error,
            `order-app/restaurants/${restaurantId}/locations/${locationId}/origins/${originId}/entry-info`,
            {
              operation: 'validateEntryInfo',
              restaurantId,
              locationId,
              originId,
              validationErrors: parsedData.error,
            },
          );
          throw new Error('Invalid response schema');
        }
        return restaurantResponseSchema.parse(data);
      } catch (error) {
        // Add Application Insights logging
        logApiError(
          error,
          `order-app/restaurants/${restaurantId}/locations/${locationId}/origins/${originId}/entry-info`,
          {
            operation: 'fetchEntryInfo',
            restaurantId,
            locationId,
            originId,
          },
        );
        throw error;
      }
    },
    enabled: !!restaurantId && !!locationId && !!originId,
    staleTime: 5 * 60 * 1000,
  });
}
