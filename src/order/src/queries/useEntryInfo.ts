import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { axiosInstance } from '@/queries/axiosInstance';
import { ApiResponse } from '@/queries/api-response';
import { handleApiResponse } from './apiHandle';
import { logger } from '@/logger';

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
  }),
  origin: z.object({
    _id: z.string(),
    label: z.string(),
  }),
});

export type RestaurantResponse = z.infer<typeof restaurantResponseSchema>;

export function useEntryInfo(restaurantId: string, locationId: string, originId: string) {
  logger.debug({ restaurantId, locationId, originId }, 'useRestaurant called');

  return useQuery<RestaurantResponse>({
    queryKey: ['restaurant', restaurantId, locationId, originId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<RestaurantResponse>>(
        `order-app/restaurants/${restaurantId}/locations/${locationId}/origins/${originId}/entry-info`
      );
      const data = handleApiResponse(response);
      const parsedData = restaurantResponseSchema.safeParse(data);
      if (!parsedData.success) {
        console.error('useRestaurant response schema error: ', parsedData.error);
        throw new Error('Invalid response schema');
      }
      logger.debug('useRestaurant returned');
      return restaurantResponseSchema.parse(data);
    },
    enabled: !!restaurantId && !!locationId && !!originId,
    staleTime: 5 * 60 * 1000,
  });
}
