import { debounce } from 'lodash';
import { useEffect, useState } from 'react';
import { usePrinterService } from '../../hooks/usePrinterService';
import { useTodayOrders } from '../../queries/useOrder';
import { appStore } from '../../store';
import { Order } from '../orders-page/types';
import { useHistoryOrdersApi } from '../../queries/history/useHistoryApi';
export const useHistoryOrders = (restaurantId: string, locationId: string, selectedDate: string) => {
  const { printOrder: printOrderService } = usePrinterService();
  const appState = appStore();
  const [historyOrders, setHistoryOrders] = useState<Map<string, Order>>(new Map());

  const restaurantInfo = {
    restaurantId: restaurantId,
    restaurantName: appState.selection.restaurant.name!,
    locationId: locationId,
    locationName: appState.selection.location.name!,
  };

  const printOrder = debounce((order: Order) => {
    printOrderService(order, restaurantInfo, appState.printers);
  }, 1000);

  const { isLoading, data } = useHistoryOrdersApi(restaurantId, locationId, selectedDate);
  useEffect(() => {
    if (!data) return;
    const historyOrders = new Map();

    data.forEach((order: Order) => {
      historyOrders.set(order._id, order);
    });
    setHistoryOrders(historyOrders);
  }, [data]);
  return {
    historyOrders,
    printOrder,
    isLoading,
  };
};
