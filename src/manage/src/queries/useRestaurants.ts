import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { ApiResponse } from './api-response';
import { axiosInstance } from './axiosInstance';

export const restaurantSchema = z.object({
  _id: z.string(),
  name: z.string(),
  concept: z.string(),
  logo: z.string().url().optional(),
});

export const restaurantsResponseSchema = z.object({
  data: z.array(restaurantSchema),
});

export type Restaurant = z.infer<typeof restaurantSchema>;
export type RestaurantsResponse = z.infer<typeof restaurantsResponseSchema>;

export const useRestaurants = (userId: string | undefined) => {
  return useQuery<Restaurant[]>({
    queryKey: ['restaurants', userId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<Restaurant[]>>(`/restaurant/${userId}`);
      try {
        const validatedData = restaurantsResponseSchema.parse(response.data);
        return validatedData.data;
      } catch (error) {
        console.error('Restaurants data validation failed:', error);
        throw new Error('Invalid restaurants data format');
      }
    },
    enabled: !!userId, // Only run the query if jwt is available
  });
};
