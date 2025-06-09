import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { axiosInstance } from '@/queries/axiosInstance';
import { ApiResponse } from '@/queries/api-response';
import { handleApiResponse } from './apiHandle';
import { logger } from '@/logger';

const menuNameSchema = z.object({
  en: z.string(),
  es: z.string(),
  pt: z.string(),
});
const menusResponseSchema = z.array(
  z.object({
    _id: z.string(),
    menuSlug: z.string(),
    name: menuNameSchema,
    available: z.boolean(),
  })
);

export type MenusResponse = z.infer<typeof menusResponseSchema>;

export function useMenus(restaurantId: string, locationId: string) {
  logger.debug({ restaurantId, locationId }, 'useMenus called');

  return useQuery<MenusResponse>({
    queryKey: ['menus', restaurantId, locationId],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<MenusResponse>>(
        `order-app/restaurants/${restaurantId}/locations/${locationId}/menus`
      );
      const data = handleApiResponse(response);
      try {
        const validatedData = menusResponseSchema.parse(data);
        logger.debug('useMenus returned');
        return validatedData.map((menu) => ({
          ...menu,
        }));
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Menu data validation failed:', error.errors);
          throw new Error('Invalid menu data format');
        }
        throw error;
      } // return data;
    },
    enabled: !!restaurantId && !!locationId,
    staleTime: 5 * 60 * 1000,
  });
}
