import React from 'react';
import { IonRow, IonCol, IonText, IonGrid, useIonRouter, IonBadge, IonIcon, IonAvatar } from '@ionic/react';
import { bagOutline } from 'ionicons/icons';
import { appStore } from '../../../../../store';
import '../../menu.css';

interface BannerProps {
  restaurantId: string;
  restaurantName: string;
  restaurantLogo?: string;
  origin: string;
}

const Banner: React.FC<BannerProps> = (props) => {
  const router = useIonRouter();
  const appState = appStore();
  const navigateCart = () => {
    if (appState.order.items.length > 0) {
      router.push(
        `/cart/${props.restaurantId}/${appState.RestaurantData.location.locationId}/${appState.menuId}?originId=${appState.RestaurantData.origin.originId}`
      );
    }
  };
  return (
    <div>
      <IonGrid>
        <IonRow>
          <IonCol size='11'>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {props.restaurantLogo && (
                <IonAvatar style={{ width: '40px', height: '40px' }}>
                  <img src={props.restaurantLogo} style={{ objectFit: 'cover' }} />
                </IonAvatar>
              )}
              <IonText color={'light'}>
                <h1>{props.restaurantName}</h1>
              </IonText>
            </div>
          </IonCol>
          <IonCol size='1'>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
              onClick={navigateCart}
            >
              <IonIcon icon={bagOutline} style={{ fontSize: '24px' }} color='light' />
              {appState.order.items.length > 0 && (
                <IonBadge
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '-4px',
                    background: '#0E793C',
                    padding: '2px',
                  }}
                >
                  {appState.order.items.length}
                </IonBadge>
              )}
            </div>
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol class='ion-text-end ion-padding-bottom'>
            <IonText>
              <sub>{appState.RestaurantData.origin.name}</sub>
            </IonText>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default Banner;
