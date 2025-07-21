import { useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { ApiResponse } from '../api-response';
import { handleApiResponse } from '../apiHandle';
import { axiosInstance } from '../axiosInstance';

// Define schemas for working hours data
const workingHourSchema = z.object({
  day: z.string(),
  isOpen: z.boolean(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
});

// Define schema for order timing settings
const orderTimingSchema = z.object({
  acceptOrdersAfterMinutes: z.number().default(30),
  stopOrdersBeforeMinutes: z.number().default(30),
});

const locationSettingsSchema = z.object({
  _id: z.string(),
  restaurantId: z.string(),
  name: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  workingHours: z.array(workingHourSchema).nullable().default([]),
  orderTiming: orderTimingSchema.optional(),
});

export type WorkingHour = z.infer<typeof workingHourSchema>;
export type OrderTiming = z.infer<typeof orderTimingSchema>;
export type LocationSettings = z.infer<typeof locationSettingsSchema>;

// Get location settings
export function useLocationSettingsApi(restaurantId: string, locationId: string) {
  return useQuery<LocationSettings>({
    queryKey: ['locationSettings', restaurantId, locationId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<ApiResponse<LocationSettings>>(
          `location-settings/restaurant/${restaurantId}/location/${locationId}`,
        );

        const { data } = response;
        const validatedData = locationSettingsSchema.parse(data.data);
        return validatedData;
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('Location settings data validation failed:', error.errors);
          throw new Error('Invalid location settings data format');
        }
        throw error;
      }
    },
    enabled: Boolean(restaurantId && locationId),
  });
}

// Update location settings
export function useUpdateLocationSettings() {
  return useMutation({
    mutationFn: async ({
      restaurantId,
      locationId,
      workingHours,
      timezone,
      orderTiming,
    }: {
      restaurantId: string;
      locationId: string;
      workingHours: WorkingHour[];
      timezone?: string;
      orderTiming?: OrderTiming;
    }) => {
      try {
        const response = await axiosInstance.patch<ApiResponse<LocationSettings>>(
          `location-settings/restaurant/${restaurantId}/location/${locationId}`,
          { workingHours, timezone, orderTiming },
        );
        return handleApiResponse(response);
      } catch (error) {
        console.error('Failed to update location settings:', error);
        throw error;
      }
    },
  });
}

// Create location settings
export function useCreateLocationSettings() {
  return useMutation({
    mutationFn: async ({
      restaurantId,
      locationId,
      workingHours,
      timezone,
      orderTiming,
    }: {
      restaurantId: string;
      locationId: string;
      workingHours: WorkingHour[];
      timezone?: string;
      orderTiming?: OrderTiming;
    }) => {
      try {
        const response = await axiosInstance.post<ApiResponse<LocationSettings>>(`location-settings`, {
          restaurantId,
          locationId,
          workingHours,
          timezone,
          orderTiming,
        });
        return handleApiResponse(response);
      } catch (error) {
        console.error('Failed to create location settings:', error);
        throw error;
      }
    },
  });
}
