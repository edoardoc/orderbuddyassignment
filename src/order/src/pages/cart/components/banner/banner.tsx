import React from 'react';
import { IonRow, IonCol, IonImg, IonText, IonGrid, useIonRouter, IonBadge, IonIcon, IonAvatar } from '@ionic/react';
import { arrowBackOutline, bagOutline } from 'ionicons/icons';
import { appStore } from '../../../../../store';
import { Link } from 'react-router-dom';

const Banner: React.FC = () => {
  const router = useIonRouter();
  const appState = appStore();
  const navigateCart = () => {
    // if (cartCount > 0) {
    router.push(
      `/cart/${appState.RestaurantData.restaurant._id}/${appState.RestaurantData.location.locationId}/${
        appState.menuId
      }?originId=${appState.RestaurantData.origin.originId ? appState.RestaurantData.origin.originId : 'Web'}`
    );
    // }
  };
  return (
    <div>
      <IonGrid>
        <IonRow class='ion-justify-content-between ion-align-items-center'>
          <span>
            <Link
              to={`/menu/${appState.RestaurantData.restaurant._id}/${appState.RestaurantData.location.locationId}/${
                appState.menuId
              }?originId=${appState.RestaurantData.origin.originId ? appState.RestaurantData.origin.originId : 'Web'}`}
            >
              <IonIcon icon={arrowBackOutline} style={{ fontSize: '23px', color: 'white' }} color='light'></IonIcon>
            </Link>
          </span>

          <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'white' }}>Order Summary</span>
          <sub style={{ color: 'white' }}>
            {appState.RestaurantData.origin.name ? appState.RestaurantData.origin.name : 'Web'}
          </sub>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default Banner;
