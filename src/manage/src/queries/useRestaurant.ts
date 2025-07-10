import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from './axiosInstance';
import { ApiResponse } from './api-response';
import { handleApiResponse } from './apiHandle';
import { S } from 'vite/dist/node/types.d-aGj9QkWt';
export type Restaurant = {
  _id: string;
  name: string;
  concept: string;
  locations: Location[];
};

export type Location = {
  id: string;
  name: string;
  address: string;
  timezone: string;
  contact: {
    phone: string;
    email: string;
  };
  geo: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
  menus: getMenu[];
  origins: Origins[];
  stations: Station[];
};
interface Station {
  id: string;
  name: string;
  stationtags: string[];
}
export type Origins = {
  id: string;
  name: string;
  url: string;
};
export type getMenu = {
  id: string;
  name: string;
  schedule: {
    type: string;
    rules: {
      timezone: string;
      windows: TimeWindow[];
    };
  };
};

export type TimeWindow = {
  days: string[];
  start: string;
  end: string;
};
export function useRestaurant(restaurantId: string) {
  if (!restaurantId) {
    throw new Error('restaurantId required');
  }

  return useQuery<Restaurant>({
    queryKey: ['restaurant', restaurantId],
    queryFn: async () => {
      if (!restaurantId) throw new Error('Missing restaurant ID');
      const response = await axiosInstance.get<ApiResponse<Restaurant>>(`menu-app/${restaurantId}`);
      return handleApiResponse(response.data);
    },
    enabled: !!restaurantId,
  });
}
