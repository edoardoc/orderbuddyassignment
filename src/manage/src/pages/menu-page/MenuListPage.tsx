import {
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
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
import { useMenus } from '../../queries/manage-menu/useMenus';
import LaunchPadNavBar from '../../components/LanunchpadNavBar';

export const MenuListPage: React.FC = () => {
  const { restaurantId, locationId } = useParams<{ restaurantId: string; locationId: string }>();

  const { data: menus, isError } = useMenus(restaurantId, locationId);
  const router = useIonRouter();

  return (
    <IonPage>
      <LaunchPadNavBar title='Menus' />
      <IonContent>
        <IonGrid>
          <IonRow>
            <IonCol size='12'>
              <IonList>
                {menus?.map((menu) => (
                  <Link
                    key={menu._id}
                    to={`/${restaurantId}/${locationId}/apps/menu/${menu._id}/categories`}
                    className='menu-item-link'
                  >
                    <IonItem className='ion-activatable'>
                      <IonLabel>
                        {menu.name.en}
                        <p className='ion-text-wrap ion-text-secondary'>{menu.menuSlug}</p>
                      </IonLabel>
                      <IonIcon icon={chevronForwardOutline} slot='end' color='medium' />
                    </IonItem>
                  </Link>
                ))}
              </IonList>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};
