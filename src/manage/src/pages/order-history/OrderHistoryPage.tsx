import {
  IonContent,
  IonPage,
  IonIcon,
  IonFab,
  IonFabButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
  useIonToast,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonRow,
  IonDatetime,
  IonDatetimeButton,
} from '@ionic/react';
import React, { use, useEffect, useRef, useState } from 'react';
import LaunchPadNavBar from '../../components/LanunchpadNavBar';

import { useParams } from 'react-router-dom';
import OrderList from '../orders-page/components/OrderList';
import OrderDetail from '../orders-page/components/OrderDetail';
import { useHistoryOrders } from './usehistory';
import { Order } from '../orders-page/types';
import EmptyState from '../orders-page/components/EmptyState';

const OrderHistoryPage: React.FC = () => {
  const { restaurantId, locationId } = useParams<any>();
  const modalRef = useRef<HTMLIonModalElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // const getYesterdayDate = (): string => {
  //   const date = new Date();
  //   date.setDate(date.getDate() - 1);
  //   return date.toISOString();
  // };
  const getYesterdayDate = (): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday.toISOString();
  };

  const [selectedDate, setSelectedDate] = useState<string>(getYesterdayDate());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { historyOrders, printOrder, isLoading } = useHistoryOrders(restaurantId, locationId, selectedDate);

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setSelectedOrder(null);
    setIsOpen(!isOpen);
    modalRef.current?.dismiss();
  };
  useEffect(() => {
    if (selectedOrder && historyOrders.has(selectedOrder._id)) return;
    if (historyOrders.size) {
      const firstActiveOrder = historyOrders.values().next().value!;
      setSelectedOrder(firstActiveOrder);
      return;
    }

    setSelectedOrder(null);
  }, [historyOrders]);
  return (
    <IonPage className='stations-page'>
      <LaunchPadNavBar title='History' />
      <IonContent>
        <IonGrid>
          <IonRow className='ion-justify-content-center ion-padding-top'>
            <IonDatetimeButton datetime='date'></IonDatetimeButton>
            <IonModal ref={modalRef} keepContentsMounted={true}>
              <IonDatetime
                id='date'
                presentation='date'
                value={selectedDate}
                onIonChange={(e) => handleDateChange(e.detail.value as string)}
              ></IonDatetime>
            </IonModal>
          </IonRow>

          {!historyOrders.size  && (
            <EmptyState
              title='📄 No orders processed on this day'
              subTitle='Looks like there were no orders recorded. This report reflects all completed activity.'
            />
          )}

          {!!historyOrders.size && (
            <IonRow>
              <IonCol size='4'>
                <OrderList orders={historyOrders} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} />
              </IonCol>
              <IonCol size='8'>
                <OrderDetail selectedOrder={selectedOrder} printOrder={printOrder} />
              </IonCol>
            </IonRow>
          )}
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default OrderHistoryPage;
