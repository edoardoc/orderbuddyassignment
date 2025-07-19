import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../axiosInstance';
import { ApiResponse } from '../api-response';
import { useParams } from 'react-router-dom';
import { z } from 'zod';

const salesDaySchema = z.object({
  date: z.string(),
  grossSales: z.number(),
  tax: z.number(),
});

export type SalesDay = z.infer<typeof salesDaySchema>;

const salesSummaryResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(salesDaySchema),
});

export function useSalesReportSummary(restaurantId?: string, locationId?: string) {
  return useQuery<SalesDay[]>({
    queryKey: ['sales-summary', restaurantId, locationId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<ApiResponse<SalesDay[]>>(
          `report/sales_summary/${restaurantId}/${locationId}`,
        );

        const parsed = salesSummaryResponseSchema.safeParse(response.data);
        if (!parsed.success) {
          console.error('Invalid sales summary response:', parsed.error);
          throw new Error('Invalid response format');
        }

        return parsed.data.data;
      } catch (error) {
        console.error('Error fetching sales summary:', error);
        throw error;
      }
    },
    enabled: !!restaurantId && !!locationId,
  });
}
