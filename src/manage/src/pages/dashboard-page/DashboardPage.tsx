import React, { useEffect, useState } from 'react';
import { useActiveOrder } from '../../queries/useOrder';
import { useParams } from 'react-router-dom';
import moment from 'moment';

import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCol,
  IonContent,
  IonGrid,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonPage,
  IonRow,
  IonText,
} from '@ionic/react';
import { client } from '../../Client';
import { debounce } from 'lodash';
import { appStore } from '../../store';
import { useOrderStatus } from '../../queries/useOrderstatus';
import { MdDone } from 'react-icons/md';
import LaunchPadNavBar from '../../components/LanunchpadNavBar';

interface Customer {
  name: string;
  phone: string;
}

interface Station {
  id: string;
  name: string;
}
interface Variant {
  id: string;
  name: string;
}

interface Modifier {
  id: string;
  name: string;
  options?: Array<{
    id: string;
    name: string;
    priceCents?: number;
  }>;
}

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  modifiers: Modifier[];
  variants: Variant[];
  stationTags: string[];
  startedAt: Date | null;
  completedAt: Date | null;
}

interface Order {
  _id: string;
  paymentId: string;
  restaurant: string;
  customer: Customer;
  station: Station;
  items: OrderItem[];
  startedAt: Date;
  totalPrice: number;
  getSms: boolean;
  status: string;
}
const DashboardPage: React.FC = () => {
  const { restaurantId, locationId } = useParams<{
    restaurantId: string;
    locationId: string;
  }>();
  const [callActive, setCallActive] = useState(false);
  const [audio] = useState(new Audio('/sounds/new-order.mp3'));
  const appState = appStore();

  const [activeOrders, setactiveOrders] = useState<Map<string, Order>>(new Map());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [correlationId, setCorrelationId] = useState<string | undefined>();
  const addItemToMap = (key: string, value: Order) => {
    setactiveOrders((prevOrder) => new Map(prevOrder.set(key, value)));
  };
  const onSelectedOrderChange = (order: any) => {
    setSelectedOrder(order);
  };
  const { data, isLoading, refetch } = useActiveOrder(
    restaurantId,
    locationId,
    addItemToMap,
    setSelectedOrder,
    correlationId
  );
  useEffect(() => {
    initiateStore();
  }, []);

  function initiateStore() {
    client.emit('store_joined', {
      restaurantId,
      locationId,
    });
  }

  client.on('order_received', async ({ orderId, restaurantId, locationId, correlationId }) => {
    console.log('order_received', { orderId, restaurantId, locationId, correlationId });
    setCallActive(true);
    setCorrelationId(correlationId);
    try {
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  });

  client.on('order_ready_for_pickup', ({ orderId, restaurantId }) => {
    if (activeOrders.has(orderId)) {
      const order_ready_for_pickup = {
        orderId: orderId,
        startedBoolean: true,
      };
      appState.setOrderReadyForPickup(order_ready_for_pickup);
    }
  });
  useEffect(() => {
    if (appState.order_ready_for_pickup.startedBoolean) {
      const orderId = appState.order_ready_for_pickup.orderId;
      const order = activeOrders.get(orderId);
      if (order) {
        order.status = 'READY_FOR_PICKUP';
      }
      appState.setOrderReadyForPickupBoolean(false);
    }
  }, [appState.order_ready_for_pickup]);

  client.on('order_completed', ({ orderId, restaurantId }) => {
    const order_completed = {
      orderId: orderId,
      startedBoolean: true,
    };
    appState.setOrderCompleted(order_completed);
  });

  useEffect(() => {
    if (appState.order_completed.startedBoolean) {
      const orderId = appState.order_completed.orderId;
      if (activeOrders.has(orderId)) {
        // activeOrders.delete(orderId)
        const completedOrder = activeOrders.get(orderId);
        if (completedOrder) {
          // appState.addCompletedOrder(completedOrder)
          activeOrders.delete(orderId);
        }
      }
      const nextOrder = activeOrders.entries().next().value;
      setSelectedOrder(nextOrder ? nextOrder[1] : null);
      appState.setOrderCompletedBoolean(false);
    }
  }, [appState.order_completed]);

  const debouncedFetchData = debounce(async () => {
    if (restaurantId && callActive) {
      console.log('fetching data');
      await refetch();
      setCallActive(false);
    }
  }, 300);

  useEffect(() => {
    // ... existing store joined code ...
    initiateStore();

    const handleOrderItemStarted = ({
      orderId,
      itemId,
      restaurantId,
      locationId,
    }: {
      orderId: string;
      itemId: string;
      restaurantId: string;
      locationId: string;
    }) => {
      console.debug('Order item started:', {
        orderId,
        itemId,
        restaurantId,
        locationId,
        currentRestaurantId: restaurantId,
      });

      setactiveOrders((prevOrders) => {
        const newOrders = new Map(prevOrders);
        const order = newOrders.get(orderId);

        if (order) {
          const updatedItems = order.items.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                startedAt: new Date(),
                completedAt: null,
              };
            }
            return item;
          });
          const updatedOrder = { ...order, items: updatedItems };
          newOrders.set(orderId, updatedOrder);
          if (selectedOrder?._id === orderId) {
            console.debug('Updating selected order with completed item:', {
              orderId,
              itemId,
              restaurantId,
              locationId,
              currentRestaurantId: restaurantId,
            });
            setSelectedOrder(updatedOrder);
          }
        }

        return newOrders;
      });
    };

    const handleOrderItemCompleted = ({
      orderId,
      itemId,
      restaurantId,
      locationId,
    }: {
      orderId: string;
      itemId: string;
      restaurantId: string;
      locationId: string;
    }) => {
      console.debug('Order item completed:', {
        orderId,
        itemId,
        restaurantId,
        locationId,
        currentRestaurantId: restaurantId,
      });

      setactiveOrders((prevOrders) => {
        const newOrders = new Map(prevOrders);
        const order = newOrders.get(orderId);

        if (order) {
          const updatedItems = order.items.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                completedAt: new Date(),
                startedAt: item.startedAt || new Date(),
              };
            }
            return item;
          });
          const updatedOrder = { ...order, items: updatedItems };
          newOrders.set(orderId, updatedOrder);
          if (selectedOrder?._id === orderId) {
            console.debug('Updating selected order with completed item:', {
              orderId,
              itemId,
              restaurantId,
              locationId,
              currentRestaurantId: restaurantId,
            });
            setSelectedOrder(updatedOrder);
          }
        }

        return newOrders;
      });
    };

    // Subscribe to events
    client.on('dashboard_order_item_started', handleOrderItemStarted);
    client.on('dashboard_order_item_completed', handleOrderItemCompleted);

    // Cleanup on unmount
    return () => {
      client.off('dashboard_order_item_started', handleOrderItemStarted);
      client.off('dashboard_order_item_completed', handleOrderItemCompleted);
    };
  }, [restaurantId, locationId, selectedOrder]);
  useEffect(() => {
    debouncedFetchData();
    return () => {
      debouncedFetchData.cancel();
    };
  }, [callActive]);

  const notifyPickupOrder = async (orderId: string) => {
    if (client.connected) {
      console.log('restaurantId ' + restaurantId);
      console.log('orderId ' + orderId);
      console.log('notifyPickupOrder');
      client.emit('order_ready_for_pickup', { restaurantId, orderId });
    }
  };

  const notifyCompleteOrder = async (orderId: string) => {
    if (client.connected) {
      console.log('restaurantId ' + restaurantId);
      console.log('orderId ' + orderId);
      console.log('notifyCompleteOrder');
      client.emit('order_completed', { restaurantId, orderId });
    }
  };

  const orderStatus = useOrderStatus({
    activeOrders,
    setSelectedOrder,
    restaurantId: restaurantId,
    authToken: appState.authToken,
    notifyPickupOrder,
    notifyCompleteOrder,
  });

  return (
    <IonPage>
      <LaunchPadNavBar title='Orders' />
      <IonContent fullscreen scrollY={false}>
        {isLoading ? (
          <IonText>Loading orders...</IonText>
        ) : (
          <IonGrid>
            {activeOrders.size > 0 && !isLoading && (
              <IonRow>
                <IonCol size='4'>
                  <IonItemGroup>
                    <IonList>
                      <div
                        className='hidescroll'
                        style={{
                          maxHeight: '100vh',
                          overflowY: 'scroll',
                        }}
                      >
                        {[...activeOrders.keys()]
                          .sort()
                          .reverse()
                          .map((key) => (
                            <IonItem
                              key={key}
                              onClick={() => onSelectedOrderChange(activeOrders.get(key))}
                              style={{
                                backgroundColor:
                                  activeOrders.get(key)?._id === selectedOrder?._id ? 'white' : 'transparent',
                                color: activeOrders.get(key)?._id === selectedOrder?._id ? '#5a189a' : 'inherit',
                              }}
                            >
                              <span style={{ paddingRight: '4px' }}>
                                {activeOrders.get(key)?._id.slice(-4).toUpperCase()} -
                              </span>
                              <span
                                style={{
                                  color: activeOrders.get(key)?._id === selectedOrder?._id ? '#5a189a' : 'gray',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '100px',
                                }}
                              >
                                {activeOrders.get(key)?.customer.name}
                              </span>
                              <IonLabel slot='end'>{moment(activeOrders.get(key)?.startedAt).fromNow()}</IonLabel>
                            </IonItem>
                          ))}
                      </div>
                    </IonList>
                  </IonItemGroup>
                </IonCol>

                <IonCol size='8' className='light-background' style={{ height: '100vh' }}>
                  <IonCard className='rounded ion-padding-top'>
                    <IonCardHeader>
                      {selectedOrder && (
                        <IonList>
                          <IonItemDivider className='ion-padding-bottom'>
                            <IonGrid className='ion-no-padding'>
                              <IonRow className='ion-align-items-center'>
                                <IonCol className='ion-text-start' size='7'>
                                  <span
                                    style={{
                                      fontWeight: '590',
                                      fontSize: '17px',
                                      color: 'black',
                                    }}
                                  >
                                    Order: {selectedOrder._id.slice(-4).toUpperCase()}
                                  </span>
                                </IonCol>
                                <IonCol className='ion-text-end' size='5'>
                                  <span
                                    style={{
                                      color: 'black',
                                      fontSize: '18px',
                                    }}
                                  >
                                    {moment(selectedOrder.startedAt).format('LT')}
                                  </span>
                                </IonCol>
                              </IonRow>
                              <IonRow className='ion-align-items-center'>
                                <IonCol className='ion-text-start' size='7'>
                                  <span
                                    style={{
                                      fontSize: '17px',
                                      color: 'black',
                                    }}
                                  >
                                    Station: {selectedOrder.station.name}
                                  </span>
                                </IonCol>
                              </IonRow>
                            </IonGrid>
                          </IonItemDivider>
                        </IonList>
                      )}
                    </IonCardHeader>

                    <IonCardContent>
                      <div
                        className='hidescroll'
                        style={{
                          maxHeight: '54vh',
                          overflowY: 'scroll',
                        }}
                      >
                        {selectedOrder?.items.map((item, index) => (
                          <IonItem key={index}>
                            <IonLabel>
                              <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</div>
                              {item.variants && item.variants.length > 0 && (
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: '#873a97',
                                    marginTop: '4px',
                                  }}
                                >
                                  {item.variants.map((variant) => variant.name).join(', ')}
                                </div>
                              )}
                              {item.modifiers && item.modifiers.length > 0 && (
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color: '#4cb775',
                                    marginTop: '4px',
                                  }}
                                >
                                  {item.modifiers
                                    .map((mod) => `${mod.name}: ${mod.options?.map((opt) => opt.name).join(', ')}`)
                                    .join(' | ')}
                                </div>
                              )}
                            </IonLabel>
                            <div
                              className='ion-margin-end'
                              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                              {item.completedAt && (
                                <div>
                                  <MdDone size={18} color='green' />
                                </div>
                              )}
                              {!item.completedAt && item.startedAt && (
                                <div>
                                  <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    width='1.2rem'
                                    height='1.2rem'
                                    viewBox='0 0 24 24'
                                  >
                                    <circle cx='4' cy='12' r='3' fill='currentColor'>
                                      <animate
                                        id='svgSpinners3DotsBounce0'
                                        attributeName='cy'
                                        begin='0;svgSpinners3DotsBounce1.end+0.25s'
                                        calcMode='spline'
                                        dur='0.6s'
                                        keySplines='.33,.66,.66,1;.33,0,.66,.33'
                                        values='12;6;12'
                                      />
                                    </circle>
                                    <circle cx='12' cy='12' r='3' fill='currentColor'>
                                      <animate
                                        attributeName='cy'
                                        begin='svgSpinners3DotsBounce0.begin+0.1s'
                                        calcMode='spline'
                                        dur='0.6s'
                                        keySplines='.33,.66,.66,1;.33,0,.66,.33'
                                        values='12;6;12'
                                      />
                                    </circle>
                                    <circle cx='20' cy='12' r='3' fill='currentColor'>
                                      <animate
                                        id='svgSpinners3DotsBounce1'
                                        attributeName='cy'
                                        begin='svgSpinners3DotsBounce0.begin+0.2s'
                                        calcMode='spline'
                                        dur='0.6s'
                                        keySplines='.33,.66,.66,1;.33,0,.66,.33'
                                        values='12;6;12'
                                      />
                                    </circle>
                                  </svg>
                                </div>
                              )}
                              <IonLabel slot='end' className='ion-text-end'>
                                <div
                                  style={{
                                    fontSize: '14px',
                                    color: '#7f7f87',
                                    fontWeight: '500',
                                  }}
                                >
                                  ${(item.price / 100).toFixed(2)}
                                </div>
                              </IonLabel>
                            </div>
                          </IonItem>
                        ))}
                      </div>

                      {selectedOrder && (
                        <div className='ion-padding-top'>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: '18px',
                                  color: 'black',
                                  fontWeight: 'bolder',
                                }}
                              >
                                Total
                              </span>
                              <span
                                style={{
                                  fontSize: '14px',
                                  paddingLeft: '5px',
                                }}
                              >
                                ({selectedOrder.items.length} items)
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '20px',
                                  color: 'black',
                                  fontWeight: 'bold',
                                }}
                              >
                                ${(selectedOrder.totalPrice / 100).toFixed(2)}{' '}
                              </div>
                              <div
                                style={{
                                  color: 'black',
                                  fontSize: '15px',
                                }}
                              >
                                tax included
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div
                        style={{
                          marginTop: '1rem',
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '1rem',
                          paddingTop: '1rem',
                        }}
                      >
                        {selectedOrder?.status === 'ORDER_PLACED' && (
                          <IonButton
                            style={{ backgroundColor: '#5a189a' }}
                            onClick={() => {
                              if (selectedOrder)
                                orderStatus.mutate({
                                  orderId: selectedOrder._id,
                                  orderStatus: 'READY_FOR_PICKUP',
                                });
                            }}
                          >
                            Ready for pickup
                          </IonButton>
                        )}
                        <div> </div>
                        {selectedOrder?.status === 'READY_FOR_PICKUP' && (
                          <IonButton
                            style={{ backgroundColor: '#2b9348' }}
                            onClick={() => {
                              if (selectedOrder)
                                orderStatus.mutate({
                                  orderId: selectedOrder._id,
                                  orderStatus: 'COMPLETED',
                                });
                            }}
                          >
                            Complete Order
                          </IonButton>
                        )}
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            )}
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DashboardPage;
