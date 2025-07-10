import { useMenus } from '@/queries/useMenus';
import {
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonPage,
  IonRow,
  useIonRouter,
} from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import Banner from '../menu/components/banner/Banner';
import { useEntryInfo } from '@/queries/useEntryInfo';
import { useQueryParams } from '@/hooks/useQueryParams';
import { getUserLang, t } from '@/utils/localization';
import { useOrderStore } from '@/stores/orderStore';
import { Paths } from '@/routes/paths';
import React, { useEffect } from 'react';
import '../../../style.css';

export const MenusPage: React.FC = () => {
  //todo:standup
  const originId = useQueryParams().get('originId') || 'web';

  const { restaurantId, locationSlug, locationId } = useParams<{
    restaurantId: string;
    locationSlug: string;
    locationId: string;
  }>();

  const { data: entryInfo, isError: entryInfoIsError, error } = useEntryInfo(restaurantId, locationId, originId);
  const { data: menus, isError } = useMenus(restaurantId, locationId);
  const currentLang = getUserLang();
  const router = useIonRouter();
  const setMenuId = useOrderStore((s) => s.setSelectedMenuId);

  const handleMenuClick = (menu: any) => {
    setMenuId(menu._id);
    router.push(Paths.menu(restaurantId, locationSlug, locationId, menu.menuSlug, menu._id, originId), 'forward');
  };
  useEffect(() => {
    if (menus && menus.length === 1) {
      const menu = menus[0];
      setMenuId(menu._id);
      router.push(Paths.menu(restaurantId, locationSlug, locationId, menu.menuSlug, menu._id, originId), 'forward');
    }
  }, [menus, restaurantId, locationSlug, locationId, originId, router, setMenuId]);
  return (
    <IonPage>
      <IonHeader>
        <IonGrid class='navbar-color'>
          <Banner
            restaurantName={entryInfo?.restaurant.name!}
            restaurantLogo={entryInfo?.restaurant.logo}
            origin={entryInfo?.origin.label!}
            restaurantId={entryInfo?.restaurant._id!}
            locationName={entryInfo?.location.name!}
          />
        </IonGrid>
      </IonHeader>

      <IonContent class='hidescrollall'>
        <IonGrid>
          <IonRow>
            <IonCol size='12'>
              <IonList>
                {menus?.map((menu) => (
                  <IonItem onClick={() => handleMenuClick(menu)} key={menu._id} className='font-size-14'>
                    {t(menu.name, currentLang)}
                    <IonIcon icon={chevronForwardOutline} slot='end' />
                  </IonItem>
                ))}
              </IonList>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default MenusPage;
