import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonChip,
  IonLabel,
  IonList,
  IonItem,
  IonSkeletonText,
  IonCol,
  IonGrid,
  IonRow,
  IonButton,
  IonFooter,
  IonItemDivider,
  IonItemGroup,
  IonText,
} from '@ionic/react';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { STATIONS_ORDERS_QUERY_KEY, useStationsOrders } from '../../../queries/useStationsOrder';
import './station.css';
import { client } from '../../../Client';
import moment from 'moment';
import { fetchStationOrder } from '../../../queries/useStationSingleOrder';
import { useQueryClient } from '@tanstack/react-query';
import { useStatusMutation } from '../../../queries/usestatus';
import LaunchPadNavBar from '../../../components/LanunchpadNavBar';

interface OrderData {
  orderId: string;
  stationTags: string[];
  correlationId: string;
  locationId: string;
}

interface StationOrdersResponse {
  locationName: string;
  stationName: string;
  stationTags: string[];
  matchedOrders: Array<{
    _id: string;
    status: string;
    items: Array<{
      id: string;
      name: string;
      isStarted: boolean;
      isCompleted: boolean;
      variants?: Array<{
        id: string;
        name: string;
      }>;
      remarks?: string;
    }>;
  }>;
}
const IndividualStationPage: React.FC = () => {
  const { locationId, stationId, restaurantId } = useParams<{
    locationId: string;
    stationId: string;
    restaurantId: string;
  }>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useStationsOrders(restaurantId, stationId, locationId);
  const statusMutation = useStatusMutation(restaurantId, stationId, locationId, data?.stationTags || []);

  useEffect(() => {
    if (!data?.stationTags) return;
    console.debug('Joining station room with tags:', {
      restaurantId,
      locationId,
      stationId,
      stationTags: data.stationTags,
    });
    // Join station room with tags
    client.emit('station_joined', {
      restaurantId,
      locationId,
      stationId,
      stationTags: data.stationTags,
    });

    // Handle new orders - changed from station_order_received to new_order
    const handleNewOrder = async (orderData: OrderData) => {
      console.debug('New order received:', orderData);
      const hasMatchingTags = orderData.stationTags.some((tag) => data?.stationTags.includes(tag));

      if (hasMatchingTags) {
        console.debug('Matching tags found:', orderData.stationTags);
        try {
          // Use the direct API call instead of the hook
          const orderDetails = await fetchStationOrder(restaurantId, locationId, orderData.orderId, data.stationTags);
          console.debug('Fetched order details:', orderDetails);
          // Update the cache with the new order
          queryClient.setQueryData(
            STATIONS_ORDERS_QUERY_KEY(restaurantId, stationId, locationId),
            (oldData: StationOrdersResponse | undefined) => {
              // If no existing data, create initial structure
              if (!oldData) {
                return {
                  locationName: data?.locationName || '',
                  stationName: data?.stationName || '',
                  stationTags: data?.stationTags || [],
                  matchedOrders: [orderDetails],
                };
              }

              // Check for duplicate orders
              const isDuplicate = oldData.matchedOrders.some((order) => order._id === orderDetails._id);

              if (isDuplicate) {
                return oldData;
              }

              return {
                ...oldData,
                matchedOrders: [...oldData.matchedOrders, orderDetails],
              };
            }
          );
        } catch (error) {
          console.error('Error fetching order details:', error);
        }
      }
    };

    const handleOrderItemStarted = ({
      orderId,
      itemId,
      restaurantId,
      locationId,
      stationId,
      stationTags,
    }: {
      orderId: string;
      itemId: string;
      restaurantId: string;
      locationId: string;
      stationId: string;
      stationTags: string[];
    }) => {
      console.debug('handleOrderItemStarted received:', {
        orderId,
        itemId,
        restaurantId,
        locationId,
        stationId,
        stationTags,
      });

      queryClient.setQueryData(
        STATIONS_ORDERS_QUERY_KEY(restaurantId, stationId, locationId),
        (oldData: StationOrdersResponse | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            matchedOrders: oldData.matchedOrders.map((order) => {
              if (order._id === orderId) {
                return {
                  ...order,
                  items: order.items.map((item) => {
                    if (item.id === itemId) {
                      return { ...item, startedAt: new Date() };
                    }
                    return item;
                  }),
                };
              }
              return order;
            }),
          };
        }
      );
    };

    // Handle order item completed
    const handleOrderItemCompleted = ({
      orderId,
      itemId,
      restaurantId,
      locationId,
      stationId,
      stationTags,
    }: {
      orderId: string;
      itemId: string;
      restaurantId: string;
      locationId: string;
      stationId: string;
      stationTags: string[];
    }) => {
      console.debug('handleOrderItemStarted received:', {
        orderId,
        itemId,
        restaurantId,
        locationId,
        stationId,
        stationTags,
      });

      queryClient.setQueryData(
        STATIONS_ORDERS_QUERY_KEY(restaurantId, stationId, locationId),
        (oldData: StationOrdersResponse | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            matchedOrders: oldData.matchedOrders.map((order) => {
              if (order._id === orderId) {
                return {
                  ...order,
                  items: order.items.map((item) => {
                    if (item.id === itemId) {
                      return { ...item, completedAt: new Date() };
                    }
                    return item;
                  }),
                };
              }
              return order;
            }),
          };
        }
      );
    };
    // Subscribe to new_order event instead of station_order_received
    client.on('new_order', handleNewOrder);
    client.on('order_item_started', handleOrderItemStarted);
    client.on('order_item_completed', handleOrderItemCompleted);
    // Listen for connection confirmation
    client.on('station_connected', (response) => {
      console.debug('Station connected:', response);
    });
    console.debug('Subscribed to station events:', {
      restaurantId,
      locationId,
      stationId,
      stationTags: data.stationTags,
    });
    return () => {
      client.off('new_order', handleNewOrder);
      client.off('order_item_started', handleOrderItemStarted);
      client.off('order_item_completed', handleOrderItemCompleted);
      client.off('station_connected');
    };
  }, [data, restaurantId, locationId, stationId]);
  if (isLoading) {
    return (
      <IonPage>
        <IonContent className='ion-padding'>
          <IonCard>
            <IonCardContent>
              <IonSkeletonText animated style={{ width: '60%' }} />
              <IonSkeletonText animated style={{ width: '80%' }} />
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className='station-page'>
      <LaunchPadNavBar title='Station' />
      <IonContent className='ion-padding'>
        {/* Station Info Card */}
        <IonCard className='station-info-card'>
          <IonCardContent className='station-info-content'>
            <IonGrid>
              <IonRow>
                <IonCol size='8'>
                  <div className='station-header'>
                    <h1>{data?.stationName}</h1>
                    <p className='location-name'>{data?.locationName}</p>
                  </div>
                </IonCol>
                <IonCol size='4' className='ion-text-end'>
                  <div className='orders-count'>Orders: {data?.matchedOrders.length}</div>
                  <div className='date'>{moment().format('MMM DD, YYYY')}</div>
                </IonCol>
              </IonRow>
            </IonGrid>
            <div className='tags-container'>
              {data?.stationTags.map((tag) => (
                <IonChip key={tag} color='primary' outline>
                  <IonLabel>{tag}</IonLabel>
                </IonChip>
              ))}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Orders Section */}
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
          {data?.matchedOrders.map((order) => {
            const hasIncompleteItems = order.items.some((item) => !item.completedAt);
            return (
              <IonCard key={order._id} className='rounded' style={{ display: hasIncompleteItems ? 'block' : 'none' }}>
                <IonList className='padding-list'>
                  <IonItemGroup>
                    <IonItemDivider>
                      <IonGrid>
                        <IonRow class=''>
                          <IonCol class='ion-text-start'>
                            <IonText className='ion-text-end bold font-size-16' color='dark'>
                              {order._id.slice(-4).toUpperCase()}
                            </IonText>

                            {/* <IonIcon
                              //  onClick={() => setSelectedOrderOnClick(order._id)}
                              icon={receiptOutline}
                              style={{ color: '#FF4C00', fontSize: '18px', paddingLeft: '3px' }}
                            ></IonIcon> */}
                          </IonCol>

                          <IonCol class='ion-text-end'>
                            <IonText className='ion-text-end' color='dark'>
                              {/* {order.customer.name} */}
                            </IonText>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </IonItemDivider>

                    {order.items.map(
                      (item, index) =>
                        !item.completedAt && (
                          <IonItem key={index} lines={index !== order.items.length - 1 ? 'full' : 'none'} className=''>
                            <IonGrid>
                              <IonRow className=''>
                                <IonCol className='ion-text-end' size='8'>
                                  <IonGrid>
                                    <IonRow>
                                      {/* <IonCol size='12'> */}
                                      <span>{item.name}</span>
                                    </IonRow>
                                    <IonRow>
                                      <span>
                                        {item.variants?.map((variant, index) => (
                                          <span
                                            key={index}
                                            className='text-[#873a97] text-xs'
                                            style={{ fontSize: '12px', color: '#873a97' }}
                                          >
                                            {variant.name}
                                            {index !== item.variants!.length - 1 && ', '}
                                          </span>
                                        ))}
                                      </span>
                                    </IonRow>
                                    <IonRow>
                                      <span>
                                        {item.modifiers?.map((modifiersOptions, index) => (
                                          <span
                                            key={index}
                                            className='text-[#4cb775] text-xs'
                                            style={{ fontSize: '12px', color: '#4cb775' }}
                                          >
                                            {modifiersOptions.options?.map((option, optIndex) => (
                                              <React.Fragment key={option.id}>{option.name}</React.Fragment>
                                            ))}
                                            {index !== (item.modifiers?.length || 0) - 1 && ', '}
                                          </span>
                                        ))}
                                      </span>
                                    </IonRow>
                                    <IonRow>
                                      <span
                                        className='text-xs grid grid-cols-1'
                                        style={{ color: 'dodgerblue', wordBreak: 'break-word' }}
                                      >
                                        {item.remarks}
                                      </span>
                                    </IonRow>
                                    {/* </IonCol> */}
                                  </IonGrid>
                                </IonCol>
                                <IonCol className='ion-text-end  ' size='4'>
                                  <div className='text-end text-xs font-bold  flex flex-row gap-4 items-baseline col-span-4 justify-end'>
                                    <div className='flex items-center gap-5 '>
                                      {item.startedAt && (item.completedAt == null || !item.completedAt) && (
                                        <IonButton
                                          size='small'
                                          color='success'
                                          fill='outline'
                                          onClick={() =>
                                            statusMutation.mutate({
                                              orderId: order._id,
                                              itemId: item.id,
                                              orderItemStatus: 'COMPLETED',
                                            })
                                          }
                                          className='text-[#4d4d4f] '
                                        >
                                          <span style={{ textTransform: 'capitalize', color: 'black' }}>Complete</span>
                                        </IonButton>
                                      )}
                                      {!item.startedAt && (
                                        <IonButton
                                          fill='outline'
                                          onClick={() =>
                                            statusMutation.mutate({
                                              orderId: order._id,
                                              itemId: item.id,
                                              orderItemStatus: 'STARTED',
                                            })
                                          }
                                          className='button-background'
                                        >
                                          <span
                                            style={{ textTransform: 'capitalize', color: '' }}
                                            className='color5a189a'
                                          >
                                            Accept
                                          </span>
                                        </IonButton>
                                      )}
                                    </div>
                                  </div>
                                </IonCol>
                              </IonRow>
                            </IonGrid>
                          </IonItem>
                        )
                    )}
                  </IonItemGroup>
                </IonList>

                <IonFooter
                  className='ion-text-end '
                  style={{
                    background: 'none',
                    boxShadow: 'none',
                    position: 'absolute',
                    bottom: 8,
                    width: '100%',
                    right: 10,
                  }}
                >
                  {/* <div className='font-size-13'>{moment.tz(order?.startedAt, 'UTC').local().format('LT')}</div> */}
                </IonFooter>
              </IonCard>
            );
          })}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default IndividualStationPage;
