import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { IonFooter, useIonRouter } from '@ionic/react';
import { useEntryInfo } from '@/queries/useEntryInfo';
import { useOrderStore } from '@/stores/orderStore';
import { IonPage, IonContent, IonSpinner, IonText } from '@ionic/react';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useMenus } from '@/queries/useMenus';
import { ORDER_SESSION_KEY, ORDER_SESSION_TTL } from '@/constants/app-config';
import { useMenu } from '@/queries/useMenu';
import { delay } from '@/utils/delay';
import { menu } from 'ionicons/icons';
import { Paths } from '@/routes/paths';

type EntryParams = {
  restaurantId: string;
  locationId: string;
};

export function EntryPage() {
  const nameParam = useQueryParams().get('name');
  const restaurantName = nameParam ? decodeURIComponent(nameParam) : null;

  const { restaurantId, locationId } = useParams<EntryParams>();
  const router = useIonRouter();

  const setOrderOrigin = useOrderStore((s) => s.setOrderOrigin);
  const setRestaurantName = useOrderStore((s) => s.setRestaurantName);
  const setMenuId = useOrderStore((s) => s.setMenuId);
  const restoreCart = useOrderStore((s) => s.restoreCartFromSession);
  // const persistSession = useOrderStore((s) => s.persistSession);

  //todo:standup
  const originId = useQueryParams().get('originId') || 'web';
  const { data: entryInfo, isError: entryInfoIsError, error } = useEntryInfo(restaurantId, locationId, originId);
  const { data: menus, isError } = useMenus(restaurantId, locationId);

  const start = Date.now();

  const init = async () => {
    if (!entryInfo) return;
    if (!menus || menus.length === 0) return;
    if (entryInfoIsError) {
      switch (error.message) {
        case 'INVALID_ORIGIN':
          router.push('/error?code=invalid-origin', 'forward');
          return;
        case 'INVALID_RESTAURANT':
          router.push('/error?code=invalid-restaurant', 'forward');
          return;
        case 'INVALID_LOCATION':
          router.push('/error?code=invalid-location', 'forward');
          return;
      }
    }
    setOrderOrigin({ restaurantId, locationId, originId });
    setRestaurantName(entryInfo.restaurant.name);

    // Handle session restoration
    const sessionRaw = localStorage.getItem(ORDER_SESSION_KEY);
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const now = Date.now();

    if (menus.length > 1) {
      // persistSession();
      router.push(Paths.menus(restaurantId, entryInfo.location.locationSlug, locationId, originId), 'forward');
      return;
    }

    const menuId = menus[0]._id;
    const menuSlug = menus[0].menuSlug;

    //todo: dupe logic in store.ts
    // if (
    //   session &&
    //   session.restaurantId === restaurantId &&
    //   session.locationId === locationId &&
    //   session.originId === originId &&
    //   session.menuId === menuId &&
    //   now - session.timestamp < ORDER_SESSION_TTL
    // ) {
    //   // restoreCart(session.cart);
    // }
    // persistSession();
    setOrderOrigin({ restaurantId, locationId, originId });
    setRestaurantName(entryInfo.restaurant.name);
    setMenuId(menuId);

    const elapsed = Date.now() - start;
    const MIN_DURATION = 2000;
    if (elapsed < MIN_DURATION) await delay(MIN_DURATION - elapsed);
    router.push(
      Paths.menu(restaurantId, entryInfo.location.locationSlug, locationId, menuSlug, menuId, originId),
      'forward'
    );
    return;
  };

  useEffect(() => {
    init();
  }, [
    menus,
    entryInfo,
    restaurantId,
    locationId,
    originId,
    router,
    setOrderOrigin,
    setRestaurantName,
    setMenuId,
    // persistSession,
  ]);

  if (isError) {
    console.error('Error loading restaurant data:', isError);
    router.push('/error?code=restaurant-load-failed', 'forward');
    return null;
  }

  return (
    <IonPage>
      <IonContent class='ion-padding ion-text-center'>
        <IonText className='ion-padding-bottom'>
          <h1>Welcome to {restaurantName || 'your restaurant'}</h1>
        </IonText>

        <IonText className='ion-padding-bottom'>
          <h4>We’re preparing your menu…</h4>
        </IonText>

        <IonSpinner name='crescent' />
      </IonContent>

      <IonFooter className='ion-padding ion-text-end'>
        <IonText>Powered by OrderBuddy</IonText>
      </IonFooter>
    </IonPage>
  );
}

export default EntryPage;
