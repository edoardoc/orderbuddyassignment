import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  IonContent,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSegmentContent,
  IonSegmentView,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { appStore } from '../../store';
import LaunchPadNavBar from '../../components/LanunchpadNavBar';
import { usePrinterService } from '../../hooks';
import { Order } from './types';
import { useOrders } from './useOrders';
import OrderList from './components/OrderList';
import OrderDetail from './components/OrderDetail';
import MobileOrderList from './components/MobileOrderList';
import EmptyState from './components/EmptyState';

const OrdersPage: React.FC = () => {
  const { restaurantId, locationId } = useParams<{
    restaurantId: string;
    locationId: string;
  }>();

  const [selectedActiveOrder, setSelectedActiveOrder] = useState<Order | null>(null);
  const [selectedCompletedOrder, setSelectedCompletedOrder] = useState<Order | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const { activeOrders, completedOrders, updateOrderItemStatus, updateOrderStatus, printOrder } = useOrders(
    restaurantId,
    locationId,
  );

  useEffect(() => {
    // if (selectedActiveOrder && activeOrders.has(selectedActiveOrder._id)) return;
    if (selectedActiveOrder && activeOrders.has(selectedActiveOrder._id)) {
      setSelectedActiveOrder(activeOrders.get(selectedActiveOrder._id)!);
      return;
    }
    if (activeOrders.size) {
      const firstActiveOrder = activeOrders.values().next().value!;
      setSelectedActiveOrder(firstActiveOrder);
      return;
    }

    setSelectedActiveOrder(null);
  }, [activeOrders]);

  useEffect(() => {
    if (selectedCompletedOrder && completedOrders.has(selectedCompletedOrder._id)) return;
    if (completedOrders.size) {
      const firstCompletedOrder = completedOrders.values().next().value!;
      setSelectedCompletedOrder(firstCompletedOrder);
      return;
    }

    setSelectedCompletedOrder(null);
  }, [completedOrders]);

  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 600px)').matches);
  }, []);
  return (
    <IonPage>
      <LaunchPadNavBar title='Orders' />
      <IonContent fullscreen scrollY={false}>
        <IonSegment>
          <IonSegmentButton value='active' contentId='active'>
            <IonLabel style={{ textTransform: 'capitalize' }}>
              Active {activeOrders.size > 0 && `(${activeOrders.size})`}
            </IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value='completed' contentId='completed'>
            <IonLabel style={{ textTransform: 'capitalize' }}>
              Completed {completedOrders.size > 0 && `(${completedOrders.size})`}
            </IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value='future' contentId='future'>
            <IonLabel style={{ textTransform: 'capitalize' }}>Future</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <IonSegmentView>
          <IonSegmentContent id='active'>
            {!activeOrders.size && (
              <EmptyState
                title='🧾 No orders in the queue.'
                subTitle='You’re in control. Orders will appear here the moment they’re placed.'
              />
            )}
            
            {isMobile && !!activeOrders.size && (
              <MobileOrderList
                orders={activeOrders}
                updateOrderStatus={updateOrderStatus}
                updateOrderItemStatus={updateOrderItemStatus}
                selectedOrder={selectedActiveOrder}
                setSelectedOrder={setSelectedActiveOrder}
                printOrder={printOrder}
              />
            )}

            {!isMobile && !!activeOrders.size && (
              <IonGrid>
                <IonRow>
                  <IonCol size='4'>
                    <OrderList
                      orders={activeOrders}
                      selectedOrder={selectedActiveOrder}
                      setSelectedOrder={setSelectedActiveOrder}
                    />
                  </IonCol>
                  <IonCol size='8'>
                    <OrderDetail
                      selectedOrder={selectedActiveOrder}
                      updateOrderStatus={updateOrderStatus}
                      printOrder={printOrder}
                    />
                  </IonCol>
                </IonRow>
              </IonGrid>
            )}
          </IonSegmentContent>

          <IonSegmentContent id='completed'>
            {!completedOrders.size && (
              <EmptyState
                title='✅ No completed orders yet.'
                subTitle='Once an order is finished, it’ll show up here for your records.'
              />
            )}

            {isMobile && (
              <MobileOrderList
                orders={completedOrders}
                selectedOrder={selectedCompletedOrder}
                setSelectedOrder={setSelectedCompletedOrder}
                printOrder={printOrder}
                tabValue='completed'
              />
            )}

            {!isMobile && !!completedOrders.size && (
              <IonGrid>
                <IonRow>
                  <IonCol size='4'>
                    <OrderList
                      orders={completedOrders}
                      selectedOrder={selectedCompletedOrder}
                      setSelectedOrder={setSelectedCompletedOrder}
                    />
                  </IonCol>
                  <IonCol size='8'>
                    <OrderDetail selectedOrder={selectedCompletedOrder} printOrder={printOrder} />
                  </IonCol>
                </IonRow>
              </IonGrid>
            )}
          </IonSegmentContent>

          <IonSegmentContent id='future'>
            <EmptyState
              title='🕒 No upcoming orders just yet.'
              subTitle='You’re all set — we’ll add future orders here as they come in.'
            />
          </IonSegmentContent>
        </IonSegmentView>
      </IonContent>
    </IonPage>
  );
};

export default OrdersPage;
