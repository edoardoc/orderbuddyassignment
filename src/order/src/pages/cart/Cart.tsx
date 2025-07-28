import {
  IonPage,
  IonContent,
  IonList,
  IonFooter,
  IonGrid,
  IonCard,
  IonCol,
  IonRow,
  useIonRouter,
  IonCardContent,
  IonButton,
  IonIcon,
  IonText,
} from '@ionic/react';
import React, { useEffect, useState } from 'react';

import { client } from '../../client';
import { useParams } from 'react-router-dom';
import Banner from './components/banner/banner';
import { CartItem } from './components/cart-item/CartItem';
import { InputField } from './components/input-field/input';
import { CheckoutContainer } from './components/checkout/CheckoutContainer';
import { useOrderStore } from '@/stores/orderStore';
import { Paths } from '@/routes/paths';
import { useQueryParams } from '@/hooks/useQueryParams';
import { addOutline } from 'ionicons/icons';
import '../../../style.css';
import { useCreateOrder } from '@/queries/useCreateOrder';
import { logApiError, logExceptionError } from '@/utils/errorLogger';

const CartPage: React.FC = () => {
  // const { isValid, error, isLoading } = useOrderGuard();
  // useCartGuard();
  const originId = useQueryParams().get('originId') || 'web';

  const cartItems = useOrderStore((s) => s.cart.items);
  const location = useOrderStore((s) => s.location);
  const origin = useOrderStore((s) => s.origin);
  const restaurant = useOrderStore((s) => s.restaurant);
  const isStoreOpen = useOrderStore((s) => s.location.isOpen);

  const [isValidPlaceOrder, setIsValidPlaceOrder] = useState(false);
  const { restaurantId, locationSlug, locationId, menuSlug, menuId } = useParams<{
    restaurantId: string;
    locationSlug: string;
    locationId: string;
    menuSlug: string;
    menuId: string;
  }>();
  const router = useIonRouter();
  const cartTotalCents = useOrderStore((s) => s.cart.totalPriceCents);
  const cartTaxCents = useOrderStore((s) => s.cart.tax);
  const totalInDollars = (cartTotalCents / 100).toFixed(2);
  const taxInDollars = (cartTaxCents / 100).toFixed(2);
  const resetOrderState = useOrderStore((s) => s.resetOrderState);

  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    getSms: false,
  });
  const acceptPayment = useOrderStore((s) => s.location.acceptPayment);
  const createOrderMutation = useCreateOrder();

  function initiateOrder(orderNumber: string) {
    try {
      const payload = {
        orderId: orderNumber,
        restaurantId: restaurantId,
        locationId: location._id,
        stationTags: [...new Set(cartItems.flatMap((item) => item.stationTags))],
      };
      client.emit('order_joined', payload);
    } catch (error) {
      logExceptionError(error, 'InitiateOrder', {
        operation: 'emitOrderJoined',
        orderNumber,
        restaurantId
      });
    }
  }

  useEffect(() => {
    if (cartItems.length === 0) {
      console.warn('Cart is empty, redirecting to menu page');

      router.push(Paths.menu(restaurantId, locationSlug, locationId, menuSlug, menuId, originId), 'back');

      return;
    }
  }, [cartItems.length]);
  const RedirectMenu = () => {
    router.push(Paths.menu(restaurantId, locationSlug, locationId, menuSlug, menuId, originId), 'back');
  };
  const placeOrder = async () => {
    const orderItems = cartItems.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      notes: item.notes,
      variants:
        item.variants?.map((variant) => ({
          id: variant.id,
          name: variant.name,
          priceCents: variant.priceCents,
        })) || [],
      modifiers:
        item.modifiers?.map((mod) => ({
          id: mod.id,
          name: mod.name,
          options:
            mod.options?.map((option) => ({
              name: option.name,
              priceCents: option.priceCents,
            })) || [],
        })) || [],
      stationTags: item.stationTags,
    }));

    const createOrder = {
      restaurantId: restaurant._id,
      locationId: location._id,
      locationSlug: locationSlug,
      paymentId: '',
      origin: origin._id ? { id: origin._id, name: origin.name } : { id: '', name: 'Web' },
      customer: {
        name: customerData.name,
        phone: customerData.phone,
      },
      items: orderItems,
      getSms: customerData.getSms,
    };

    try {
      const orderId = await createOrderMutation.mutateAsync(createOrder);
      initiateOrder(orderId);
      resetOrderState();

      router.push(`/status/${restaurant._id}/${orderId}`, 'forward');
    } catch (error) {
      console.error('Failed to create order:', error);
      logApiError(error, 'menu-app/restaurant/order', {
        operation: 'placeOrderCart',
        restaurantId: restaurant._id,
        locationId: location._id
      });
    }
  };
  return (
    <IonPage>
      <Banner />
      <IonContent>
        <IonList>
          <IonCard className='ion-margin'>
            <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
            <IonCardContent>
              <IonButton onClick={RedirectMenu} expand='full' className='force-outline-button'>
                Add More
                <IonIcon slot='end' icon={addOutline}></IonIcon>
              </IonButton>
            </IonCardContent>
          </IonCard>
        </IonList>
        <div className='ion-no-padding ion-padding-start ion-padding-end'>
          <IonGrid>
            <IonRow>
              <IonCol className='font-size-14'>Total (Tax)</IonCol>
              <IonCol class='ion-text-end'>
                <span className='font-size-14'>
                  $ {totalInDollars} ($ {taxInDollars})
                </span>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
        <InputField
          onValidityChange={(isValid) => setIsValidPlaceOrder(isValid)}
          onCustomerDataChange={setCustomerData}
        />{' '}
      </IonContent>
      {isStoreOpen && (
        <IonFooter>
          {acceptPayment && (
            <CheckoutContainer
              isValidPlaceOrder={isValidPlaceOrder}
              calculateTotal={Number(totalInDollars)}
              customerData={customerData}
            />
          )}
          {!acceptPayment && (
            <IonButton
              disabled={!isValidPlaceOrder}
              expand='block'
              className='solid-button'
              style={{ paddingLeft: '10px', paddingRight: '10px', fontWeight: '700' }}
              onClick={() => placeOrder()}
            >
              Place order
            </IonButton>
          )}
        </IonFooter>
      )}
    </IonPage>
  );
};

export default CartPage;
