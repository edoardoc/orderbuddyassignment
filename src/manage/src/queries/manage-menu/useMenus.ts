import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { ApiResponse } from '../api-response';
import { handleApiResponse } from '../apiHandle';
import { axiosInstance } from '../axiosInstance';

const menuNameSchema = z.object({
  en: z.string(),
  es: z.string().optional(),
  pt: z.string().optional(),
});

// Update schema to match API response structure
const menuSchema = z.object({
  _id: z.string(),
  menuSlug: z.string(),
  name: menuNameSchema,
  available: z.boolean(),
});

const menusResponseSchema = z.object({
  data: z.array(menuSchema),
});

export type MenuResponse = z.infer<typeof menuSchema>;
export type MenusResponse = z.infer<typeof menusResponseSchema>['data'];

export function useMenus(restaurantId: string, locationId: string) {
  return useQuery<MenusResponse>({
    queryKey: ['menus', restaurantId, locationId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<MenusResponse>>(
        `restaurant/restaurants/${restaurantId}/locations/${locationId}/menus`
      );
      const responseData = await handleApiResponse(response);
      console.debug('useMenus called with data:', responseData);

      try {
        // Parse the wrapped data object
        const validated = menusResponseSchema.parse(responseData);
        return validated.data;
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Menu data validation failed:', error.errors);
          throw new Error('Invalid menu data format');
        }
        throw error;
      }
    },
    enabled: !!restaurantId && !!locationId,
  });
}
