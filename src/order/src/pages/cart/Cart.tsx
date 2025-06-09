import {
  IonPage,
  IonHeader,
  IonContent,
  IonList,
  IonFooter,
  IonGrid,
  IonCard,
  IonCol,
  IonRow,
  useIonRouter,
  IonSpinner,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { appStore } from '../../../store';
import './cart.css';

import { client } from '../../client';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import Banner from './components/banner/banner';
import { CartItem } from './components/cart-item/CartItem';
import { InputField } from './components/input-field/input';
import { CheckoutContainer } from './components/checkout/CheckoutContainer';
import { useOrderGuard } from '../../hooks/useOrderGuard';

const CartPage: React.FC = () => {
  // const { isValid, error, isLoading } = useOrderGuard();

  const appState = appStore();
  const [isValidPlaceOrder, setIsValidPlaceOrder] = useState(false);
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const history = useHistory();
  const router = useIonRouter();
  const getTotalWithTax = appStore((state) => state.getTotalWithTax);
  const getTaxAmount = appStore((state) => state.getTaxAmount);

  useEffect(() => {
    if (appState.paymentStatus.isPayed && appState.order.id) {
      if (client.connected) {
        initiateOrder(appState.order.id);
      }

      history.push(`/status/${appState.RestaurantData.restaurant._id}/${appState.order.id}`);
    }
  }, [appState.paymentStatus]);

  function initiateOrder(orderNumber: string) {
    const payload = {
      orderId: orderNumber,
      restaurantId: restaurantId, // From useParams
      locationId: appState.RestaurantData.location.locationId, //hardcoded value
      stationTags: [...new Set(appState.order.items.flatMap((item) => item.stationTags))],
    };
    client.emit('order_joined', payload);
  }

  useEffect(() => {
    if (appState.order.items.length === 0) {
      router.push(
        `/menu/${appState.RestaurantData.restaurant._id}/${appState.RestaurantData.location.locationId}/${
          appState.menuId
        }?originId=${appState.RestaurantData.origin.originId}`
      );
    }
  }, [appState.order.items.length]);

  return (
    <IonPage>
      <IonHeader class='navbar-violet'>
        <IonGrid>
          <Banner />
        </IonGrid>
      </IonHeader>

      <IonContent>
        <IonList>
          <IonCard className='ion-margin'>
            <div style={{ height: '40vh', overflowY: 'auto' }}>
              {appState.order.items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          </IonCard>
        </IonList>
        <div className='ion-no-padding ion-padding-start ion-padding-end'>
          <IonGrid>
            <IonRow>
              <IonCol style={{ fontSize: '14px' }}>Tax</IonCol>
              <IonCol class='ion-text-end'>
                <span style={{ fontSize: '14px' }}>$ {getTaxAmount()}</span>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol className='font-size-18 bold'>Total</IonCol>
              <IonCol class='ion-text-end '>
                <span className='font-size-18 bold'> $ {getTotalWithTax()}</span>
              </IonCol>
            </IonRow>
            <IonRow className='ion-no-padding'>
              <IonCol>
                <hr />
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        <InputField onValidityChange={(isValid) => setIsValidPlaceOrder(isValid)} />
      </IonContent>

      <IonFooter>
        <CheckoutContainer isValidPlaceOrder={isValidPlaceOrder} calculateTotal={getTotalWithTax} />
      </IonFooter>
    </IonPage>
  );
};

export default CartPage;
