import { debounce } from 'lodash';
import { useEffect, useState } from 'react';
import { usePrinterService } from '../../hooks/usePrinterService';
import { useTodayOrders } from '../../queries/useOrder';
import { appStore } from '../../store';
import { Order } from '../orders-page/types';
import { useHistoryOrdersApi } from '../../queries/history/useHistoryApi';
import { logExceptionError } from '../../utils/errorLogger';

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
    try {
      printOrderService(order, restaurantInfo, appState.printers);
    } catch (error) {
      logExceptionError(
        error instanceof Error ? error : new Error(String(error)),
        'useHistoryOrders.printOrder',
        { restaurantId, locationId, orderId: order._id }
      );
      console.error('Error printing order:', error);
    }
  }, 1000);

  const { isLoading, data } = useHistoryOrdersApi(restaurantId, locationId, selectedDate);
  useEffect(() => {
    try {
      if (!data) return;
      const historyOrders = new Map();

      data.forEach((order: Order) => {
        historyOrders.set(order._id, order);
      });
      setHistoryOrders(historyOrders);
    } catch (error) {
      logExceptionError(
        error instanceof Error ? error : new Error(String(error)),
        'useHistoryOrders.processData',
        { restaurantId, locationId, selectedDate }
      );
      console.error('Error processing history orders data:', error);
    }
  }, [data]);
  
  return {
    historyOrders,
    printOrder,
    isLoading,
  };
};
