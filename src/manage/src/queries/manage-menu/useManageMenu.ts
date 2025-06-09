import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../axiosInstance';
import { CategoryFormData } from '../../pages/menu-page/components/modals/MenuCategoryModel';
import { z } from 'zod';

interface UseManageMenuProps {
  restaurantId: string;
  locationId: string;
  menuId: string;
}
const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  priceCents: z.number().min(0, 'Price must be positive'),
  default: z.boolean().optional(),
});
export const menuItemSchema = z.object({
  id: z.string().optional(),
  name: z.object({
    en: z.string().min(1, 'Name is required'),
    es: z.string().optional(),
    pt: z.string().optional(),
  }),
  description: z.object({
    en: z.string().min(1, 'Description is required'),
    es: z.string().optional(),
    pt: z.string().optional(),
  }),
  price: z.number().min(0, 'Price must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  stationTags: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),

  //   makingCostCents: z.number().min(0, 'Making cost must be positive'),
  //   isAvailable: z.boolean().default(true),
  //   imageUrls: z.array(z.string()).default([]),
  //   stationTags: z.array(z.string()).default([]),
});

export const menuItemSchemaPriceInCents = z.object({
  id: z.string().optional(),
  name: z.object({
    en: z.string().min(1, 'Name is required'),
    es: z.string().optional(),
    pt: z.string().optional(),
  }),
  description: z.object({
    en: z.string().min(1, 'Description is required'),
    es: z.string().optional(),
    pt: z.string().optional(),
  }),
  priceCents: z.number().min(0, 'Price must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  stationTags: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
  imageUrls: z.array(z.string()).optional(),

  //   makingCostCents: z.number().min(0, 'Making cost must be positive'),
  //   isAvailable: z.boolean().default(true),
  //   imageUrls: z.array(z.string()).default([]),
  //   stationTags: z.array(z.string()).default([]),
});
export type MenuItemFormData = z.infer<typeof menuItemSchema>;
export type menuItemSchemaPriceInCentsType = z.infer<typeof menuItemSchemaPriceInCents>;
export type menuItemSchema = z.infer<typeof menuItemSchema>;

export const useManageMenu = ({ restaurantId, locationId, menuId }: UseManageMenuProps) => {
  const queryClient = useQueryClient();

  const upsertCategory = useMutation({
    mutationFn: async (category: CategoryFormData) => {
      const { data } = await axiosInstance.post(
        `/restaurant/${restaurantId}/location/${locationId}/menu/${menuId}/category`,
        category
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['menu', restaurantId, locationId, menuId],
      });
    },
  });
  const upsertMenuItem = useMutation({
    mutationFn: async (item: MenuItemFormData) => {
      const { data } = await axiosInstance.post(
        `/restaurant/${restaurantId}/location/${locationId}/menu/${menuId}/item`,
        item
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['menu', restaurantId, locationId, menuId],
      });
    },
  });

  return {
    upsertCategory,
    upsertMenuItem,
  };
};
