import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { axiosInstance } from './axiosInstance';
import { ApiResponse } from './api-response';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Define the schema for location data
const locationSchema = z.object({
  _id: z.string().regex(objectIdRegex, 'Invalid MongoDB ObjectId format'),

  locationSlug: z.string(),
  name: z.string(),
});

// Response schema for API validation
const locationsResponseSchema = z.object({
  data: z.array(locationSchema),
});

// TypeScript type for Location
export type Location = z.infer<typeof locationSchema>;

export function useLocations(restaurantId: string) {
  return useQuery<Location[]>({
    queryKey: ['locations', restaurantId],
    queryFn: async () => {
      if (!restaurantId) {
        throw new Error('Restaurant ID is required');
      }

      const response = await axiosInstance.get<ApiResponse<Location[]>>(
        `/restaurant/restaurants/${restaurantId}/locations`
      );
      try {
        const validatedData = locationsResponseSchema.parse(response.data);
        return validatedData.data;
      } catch (error) {
        console.error('Location data validation failed:', error);
        throw new Error('Invalid location data format');
      }
    },
    enabled: Boolean(restaurantId),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}
