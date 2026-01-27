import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { axiosInstance } from '@/queries/axiosInstance';
import { ApiResponse } from '@/queries/api-response';
import { handleApiResponse } from './apiHandle';
import { logApiError } from '@/utils/errorLogger';

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

const graphqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT as string | undefined;

async function fetchMenusViaGraphql(restaurantId: string, locationId: string) {
  const query = `
    query Menus($restaurantId: String!, $locationId: String!) {
      menus(restaurantId: $restaurantId, locationId: $locationId) {
        _id
        menuSlug
        name {
          en
          es
          pt
        }
        available
      }
    }
  `;

  const response = await fetch(graphqlEndpoint as string, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { restaurantId, locationId },
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || 'GraphQL error');
  }

  return payload.data?.menus;
}

export function useMenus(restaurantId: string, locationId: string) {
  return useQuery<MenusResponse>({
    queryKey: ['menus', restaurantId, locationId],
    queryFn: async () => {
      try {
        const data = graphqlEndpoint
          ? await fetchMenusViaGraphql(restaurantId, locationId)
          : handleApiResponse(
              await axiosInstance.get<ApiResponse<MenusResponse>>(
                `order-app/restaurants/${restaurantId}/locations/${locationId}/menus`
              )
            );
        try {
          const validatedData = menusResponseSchema.parse(data);
          return validatedData.map((menu) => ({
            ...menu,
          }));
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error('Menu data validation failed:', error.errors);
            logApiError(error, `order-app/restaurants/${restaurantId}/locations/${locationId}/menus`, {
              operation: 'validateMenuData',
              restaurantId,
              locationId,
              validationErrors: error.errors,
            });
            throw new Error('Invalid menu data format');
          }
          // Keep existing implicit console.error from the throw
          logApiError(error, `order-app/restaurants/${restaurantId}/locations/${locationId}/menus`, {
            operation: 'processMenuData',
            restaurantId,
            locationId,
          });
          throw error;
        }
      } catch (error) {
        // Add Application Insights logging
        logApiError(error, `order-app/restaurants/${restaurantId}/locations/${locationId}/menus`, {
          operation: graphqlEndpoint ? 'fetchMenusGraphql' : 'fetchMenus',
          restaurantId,
          locationId,
        });
        throw error;
      }
    },
    enabled: !!restaurantId && !!locationId,
    staleTime: 5 * 60 * 1000,
  });
}
