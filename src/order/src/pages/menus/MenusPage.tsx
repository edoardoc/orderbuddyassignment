import { useMenus } from '@/queries/useMenus';
import {
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRow,
  useIonRouter,
} from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import { Link, useParams } from 'react-router-dom';
import Banner from '../menu/components/banner/Banner';
import { useEntryInfo } from '@/queries/useEntryInfo';
import { useQueryParams } from '@/hooks/useQueryParams';
import { getUserLang, t } from '@/utils/localization';

export const MenusPage: React.FC = () => {
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

  return (
    <IonPage>
      <IonHeader>
        <IonGrid class='navbar-violet'>
          <Banner
            restaurantName={entryInfo?.restaurant.name!}
            restaurantLogo={entryInfo?.restaurant.logo}
            origin={entryInfo?.origin.label!}
            restaurantId={entryInfo?.restaurant._id!}
          />
        </IonGrid>
      </IonHeader>

      <IonContent class='hidescrollall'>
        <IonGrid>
          <IonRow>
            <IonCol size='12'>
              <IonList>
                {menus?.map((menu) => (
                  <IonItem key={menu._id} className='ion-activatable'>
                    <Link
                      to={`/menu/${restaurantId}/${locationSlug}/${locationId}/${menu.menuSlug}/${menu._id}?originId=${entryInfo?.origin.label!}`}
                    >
                      {t(menu.name, currentLang)}
                    </Link>
                    <IonIcon icon={chevronForwardOutline} slot='end' color='medium' />
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
