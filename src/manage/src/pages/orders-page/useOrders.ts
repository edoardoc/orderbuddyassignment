import { useState, useEffect } from 'react';
import { useTodayOrders } from '../../queries/useOrder';
import { client } from '../../Client';
import { debounce } from 'lodash';
import { Order } from './types';
import { fetchDashboardOrder } from '../../queries/dashboard/useSingleDasboardOrder';
import { appStore } from '../../store';
import { useOrderStatus } from '../../queries/useOrderstatus';
import { useStatusMutation } from '../../queries/dashboard/useDashboardStatusMutation';
import { OrderStatus } from '../../constants';
import { usePrinterService } from '../../hooks/usePrinterService';

interface OrderData {
  orderId: string;
  locationId: string;
  restaurantId: string;
  correlationId: string;
}

interface RestaurantInfo {
  restaurantId: string;
  restaurantName: string;
  locationId: string;
  locationName: string;
}

export const useOrders = (restaurantId: string, locationId: string) => {
  const { printOrder: printOrderService } = usePrinterService();

  const [audio] = useState(new Audio('/sounds/new-order.mp3'));
  const appState = appStore();

  const [activeOrders, setActiveOrders] = useState<Map<string, Order>>(new Map());
  const [completedOrders, setCompletedOrders] = useState<Map<string, Order>>(new Map());
  const [futureOrders, setFutureOrders] = useState<Map<string, Order>>(new Map());
  const restaurantInfo = {
    restaurantId: restaurantId,
    restaurantName: appState.selection.restaurant.name!,
    locationId: locationId,
    locationName: appState.selection.location.name!,
  };
  const printOrder = debounce((order: Order) => {
    printOrderService(order, restaurantInfo, appState.printers);
  }, 1000);

  const addItemToMap = (key: string, value: Order) => {
    setActiveOrders((prevOrder) => {
      const newOrders = new Map(prevOrder.set(key, value));
      return newOrders;
    });
  };

  const addCompletedOrderToMap = (key: string, value: Order) => {
    setCompletedOrders((prevOrder) => new Map(prevOrder.set(key, value)));
  };

  const { isLoading } = useTodayOrders(restaurantId, locationId, addItemToMap, addCompletedOrderToMap);

  const initiateStore = () => {
    client.emit('store_joined', {
      restaurantId,
      locationId,
    });
  };

  useEffect(() => {
    initiateStore();
  }, []);

  useEffect(() => {
    const handleOrderReceived = async (orderData: OrderData) => {
      try {
        const newOrder = await fetchDashboardOrder(
          orderData.restaurantId,
          orderData.locationId,
          orderData.orderId,
          orderData.correlationId,
        );
        if (newOrder) {
          printOrderService(newOrder, restaurantInfo, appState.printers);

          if (newOrder.status === OrderStatus.Completed) {
            addCompletedOrderToMap(orderData.orderId, newOrder);
          } else {
            addItemToMap(orderData.orderId, newOrder);
            await audio.play();
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      }
    };

    client.off('order_received').on('order_received', handleOrderReceived);

    return () => {
      client.off('order_received', handleOrderReceived);
    };
  }, [appState, audio]);

  useEffect(() => {
    const handleOrderItemEvents = () => {
      client.on('order_ready_for_pickup', ({ orderId, restaurantId }) => {
        if (!activeOrders.has(orderId)) return;
        setActiveOrders((prevOrders) => {
          const newOrders = new Map(prevOrders);
          const order = newOrders.get(orderId)!;
          const currentTime = new Date();
          order.items.forEach((item) => {
            if (!item.startedAt) {
              item.startedAt = order.startedAt;
            }
            if (!item.completedAt) {
              item.completedAt = currentTime;
            }
          });
          order.status = OrderStatus.ReadyForPickup;
          return newOrders;
        });
      });

      client.on('order_completed', ({ orderId, restaurantId }) => {
        if (!activeOrders.has(orderId)) return;
        const order = activeOrders.get(orderId)!;
        const orderCorrelationId = order.meta.correlationId; //needed for fetchDashboardOrder
        setActiveOrders((prevOrders) => {
          const newOrders = new Map(prevOrders);
          order.status = OrderStatus.Completed;
          newOrders.delete(orderId);
          return newOrders;
        });

        fetchDashboardOrder(restaurantId, locationId, orderId, orderCorrelationId)
          .then((completedOrder) => {
            if (completedOrder && completedOrder.status === OrderStatus.Completed) {
              addCompletedOrderToMap(orderId, completedOrder);
            }
          })
          .catch((error) => {
            console.error('Error fetching completed order:', error);
          });
      });
    };

    handleOrderItemEvents();

    return () => {
      client.off('order_ready_for_pickup');
      client.off('order_completed');
    };
  }, [activeOrders]);

  const notifyPickupOrder = async (orderId: string) => {
    if (client.connected) {
      client.emit('order_ready_for_pickup', { restaurantId, orderId });
    }
  };

  const notifyCompleteOrder = async (orderId: string) => {
    if (client.connected) {
      client.emit('order_completed', { restaurantId, orderId });
    }
  };
  const removeOrderFromActive = (orderId: string) => {
    setActiveOrders((prev) => {
      const newOrders = new Map(prev);
      const order = activeOrders.get(orderId)!;
      order.status = OrderStatus.Completed;
      newOrders.delete(orderId);
      return newOrders;
    });
  };
  const updateOrderToReadyForPickup = (orderId: string) => {
    setActiveOrders((prevOrders) => {
      const newOrders = new Map(prevOrders);
      const order = newOrders.get(orderId)!;
      const currentTime = new Date();
      order.status = OrderStatus.ReadyForPickup;
      order.items.forEach((item) => {
        if (!item.startedAt) {
          item.startedAt = order.startedAt;
        }
        if (!item.completedAt) {
          item.completedAt = currentTime;
        }
      });
      return newOrders;
    });
  };

  const orderStatusMutation = useOrderStatus({
    activeOrders,
    restaurantId,
    locationId,
    addCompletedOrderToMap,
    notifyPickupOrder,
    notifyCompleteOrder,
    removeOrderFromActive,
    updateOrderToReadyForPickup,
  });
  // Handle item status updates
  useEffect(() => {
    const handleOrderItemStarted = ({
      orderId,
      itemId,
    }: {
      orderId: string;
      itemId: string;
      restaurantId: string;
      locationId: string;
    }) => {
      setActiveOrders((prevOrders) => {
        const newOrders = new Map(prevOrders);
        const order = newOrders.get(orderId)!;
        const itemToUpdate = order.items.find((item) => item.id === itemId)!;
        itemToUpdate.startedAt = new Date();
        itemToUpdate.completedAt = null;
        return newOrders;
      });
    };

    const handleOrderItemCompleted = ({
      orderId,
      itemId,
    }: {
      orderId: string;
      itemId: string;
      restaurantId: string;
      locationId: string;
    }) => {
      setActiveOrders((prevOrders) => {
        const newOrders = new Map(prevOrders);
        const order = newOrders.get(orderId)!;
        const itemToUpdate = order.items.find((item) => item.id === itemId)!;
        itemToUpdate.completedAt = new Date();
        itemToUpdate.startedAt = itemToUpdate.startedAt || new Date();
        return newOrders;
      });
    };

    client.on('dashboard_order_item_started', handleOrderItemStarted);
    client.on('dashboard_order_item_completed', handleOrderItemCompleted);

    return () => {
      client.off('dashboard_order_item_started', handleOrderItemStarted);
      client.off('dashboard_order_item_completed', handleOrderItemCompleted);
    };
  }, []);

  const updateOrderStatus = (orderId: string, orderStatus: string, correlationId: string) => {
    orderStatusMutation.mutate({
      orderId,
      orderStatus,
      correlationId,
    });
  };

  const updateOrderItemStatusMutation = useStatusMutation(restaurantId, locationId, {
    onOrderItemCompleted: ({ orderId, itemId, restaurantId, locationId, stationTags }) => {
      setActiveOrders((prevOrders) => {
        const newOrders = new Map(prevOrders);
        const order = newOrders.get(orderId)!;
        const itemToUpdate = order.items.find((item) => item.id === itemId)!;
        itemToUpdate.completedAt = new Date();
        return newOrders;
      });
    },
  });
  const updateOrderItemStatus = (
    orderId: string,
    itemId: string,
    orderItemStatus: string,
    stationTags: string[],
    correlationId: string,
  ) => {
    updateOrderItemStatusMutation.mutate({
      orderId,
      itemId,
      orderItemStatus,
      stationTags,
      correlationId,
    });
  };

  return {
    activeOrders,
    printOrder,
    completedOrders,
    futureOrders,
    notifyPickupOrder,
    notifyCompleteOrder,
    isLoading,
    addCompletedOrderToMap,
    updateOrderItemStatus,
    updateOrderStatus,
  };
};
