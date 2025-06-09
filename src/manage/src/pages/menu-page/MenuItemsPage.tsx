import {
  IonButton,
  IonCard,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonIcon,
  IonPage,
  IonRow,
  IonText,
  useIonRouter,
} from '@ionic/react';
import { add, addOutline, createOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { useMenu } from '../../queries/useMenu';
import LaunchPadNavBar from '../../components/LanunchpadNavBar';
import './MenuItemPage.css';

//todo menu items api and ui
export const MenuItemsPage: React.FC = () => {
  const { restaurantId, locationId, menuId, categoryId } = useParams<{
    restaurantId: string;
    locationId: string;
    menuId: string;
    categoryId: string;
  }>();
  const { data: menu } = useMenu(restaurantId, locationId, menuId);

  const filteredItems = menu?.items.filter((item) => item.categoryId === categoryId);
  const router = useIonRouter();

  const handleEditClick = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${restaurantId}/${locationId}/apps/menu/${menuId}/${categoryId}/items/${item.id}`);
  };

  const handleAddClick = () => {
    router.push(`/${restaurantId}/${locationId}/apps/menu/${menuId}/${categoryId}/items/new`);
  };

  return (
    <IonPage>
      <LaunchPadNavBar title='Menu Items' />
      <IonContent>
        <IonGrid>
          <IonRow>
            <IonCol size='12'>
              {filteredItems?.map((item) => (
                <IonCard key={item.id} className='menu-item-card'>
                  <IonButton
                    fill='clear'
                    size='small'
                    onClick={(e) => handleEditClick(item, e)}
                    className='edit-button'
                  >
                    <IonIcon icon={createOutline} />
                  </IonButton>
                  <IonGrid className='ion-no-padding'>
                    <IonRow className='ion-align-items-center'>
                      <IonCol size='3' sizeSm='1' className='ion-no-padding'>
                        <img src={item.imageUrls?.[0] ?? ''} alt={item.name.en} className='menu-item-image' />
                      </IonCol>
                      <IonCol size='9' sizeSm='11' className='ion-padding'>
                        <IonText>
                          <h4 className='ion-no-margin'>{item.name.en}</h4>
                          <p className='ion-no-margin'>{item.description.en}</p>
                          <strong>${(item.priceCents / 100).toFixed(2)}</strong>
                        </IonText>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCard>
              ))}
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonFab slot='fixed' vertical='bottom' horizontal='end'>
          <IonFabButton color='primary' onClick={handleAddClick}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};
