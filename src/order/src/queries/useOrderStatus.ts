import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from './axiosInstance';
import moment from 'moment-timezone';
import { string, z } from 'zod';
import { logger } from '@/logger';

const modifierOptionSchema = z.object({
  name: z.string(),
});
export const orderVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
});
const modifierSchema = z.object({
  id: z.string(),
  name: z.string(),
  options: z.array(modifierOptionSchema),
});
export const orderItemSchema = z.object({
  id: z.string(),
  menuItemId: z.string(),
  name: z.string(),
  priceCents: z.number(),
  variants: z.array(orderVariantSchema).optional().default([]),
  modifiers: z.array(modifierSchema).optional().default([]),
  stationTags: z.array(z.string()),
  startedAt: z
    .string()
    .transform((str) => new Date(str))
    .nullable(),
  completedAt: z
    .string()
    .transform((str) => new Date(str))
    .nullable(),
});

export const orderStatusSchema = z.object({
  _id: z.string(),
  orderCode: z.string(),
  restaurantId: z.string(),
  locationId: z.string(),
  locationSlug: z.string(),
  customer: z.object({
    name: z.string(),
    phone: z.string().optional(),
  }),
  origin: z.object({
    id: z.string(),
    name: z.string(),
  }),
  items: z.array(orderItemSchema),
  status: z.string(),
  totalPriceCents: z.number(),
  startedAt: z
    .string()
    .transform((str) => moment(str).toDate())
    .nullable()
    .optional(),
  endedAt: z
    .string()
    .transform((str) => moment(str).toDate())
    .nullable()
    .optional(),
});

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export function useOrderStatus(orderId: string) {
  return useQuery<OrderStatus>({
    queryKey: ['orderStatus', orderId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`menu-app/order/${orderId}`);
      try {
        const parsedData = orderStatusSchema.parse(data);
        return parsedData;
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(
            `Order status validation failed: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
          );
        }

        throw error;
      }
    },
    enabled: !!orderId,
  });
}
