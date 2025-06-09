import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonPopover,
  IonRow,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { personOutline, logOutOutline, restaurantOutline, location, locationOutline } from 'ionicons/icons';
import React from 'react';
import { signOut } from 'supertokens-web-js/recipe/session';
import { appStore } from '../store';

interface NavBarProps {
  title: string;
  showBackButton?: boolean;
}
async function onLogout() {
  await signOut();
  window.location.href = '/login';
}
const LaunchPadNavBar: React.FC<NavBarProps> = ({ title, showBackButton = true }) => {
  const restaurantName = appStore((s) => s.selectedRestaurantName);
  const locationName = appStore((s) => s.selectedLocationName);

  return (
    <IonHeader>
      <IonToolbar>
        <IonGrid>
          <IonRow class=' '>
            <IonCol sizeMd='6' sizeXs='12'>
              {showBackButton && (
                <IonButtons slot='start'>
                  <IonBackButton />
                </IonButtons>
              )}
              <IonTitle>{title}</IonTitle>{' '}
            </IonCol>

            <IonCol sizeMd='6' sizeXs='9' className='ion-text-end'>
              {restaurantName && (
                <>
                  <IonIcon icon={restaurantOutline} />
                  <IonText className='ion-margin-end'>{restaurantName}</IonText>
                </>
              )}
              {locationName && (
                <>
                  <IonIcon icon={locationOutline} />
                  <IonText className='ion-margin-end'>{locationName}</IonText>
                </>
              )}
              <IonIcon id='click-trigger' icon={personOutline} className='profile-icon ' />
              <IonPopover trigger='click-trigger' triggerAction='click'>
                <IonContent className='ion-padding'>
                  <IonButton size='small' expand='block' fill='clear' onClick={onLogout}>
                    <IonIcon slot='start' icon={logOutOutline} />
                    Logout
                  </IonButton>
                </IonContent>
              </IonPopover>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonToolbar>
    </IonHeader>
  );
};

export default LaunchPadNavBar;
