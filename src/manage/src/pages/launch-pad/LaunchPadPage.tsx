import { IonCard, IonCol, IonContent, IonGrid, IonIcon, IonPage, IonRow } from '@ionic/react';
import { Link, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import './LaunchPadPage.css';
import { qrCodeOutline } from 'ionicons/icons';
import React from 'react';
import { messaging } from '../../firebase/firebase';
import { onMessage } from 'firebase/messaging';
import { isPlatform } from '@ionic/react';
import { useInitializeNotifications } from '../../queries/useNotification';
import { MdDashboard } from 'react-icons/md';
import { LuGitBranchPlus } from 'react-icons/lu';
import LaunchPadNavBar from '../../components/LanunchpadNavBar';
import { BiFoodMenu } from 'react-icons/bi';

interface user {
  _id: string;
  restaurantId: string;
  name: string;
  userId: string;
  email: string;
}

const LaunchPadPage: React.FC = (props) => {
  const { restaurantId, locationId } = useParams<{ restaurantId: string; locationId: string }>();
  const { mutate: initializeNotifications } = useInitializeNotifications();
  useEffect(() => {
    if (restaurantId) {
      initializeNotifications(restaurantId);

      // Set up web message listener
      if (isPlatform('desktop') || isPlatform('mobileweb')) {
        onMessage(messaging, (payload) => {
          console.log('notification Message received:', payload);
        });
      }
    }
  }, [restaurantId]);

  return (
    <IonPage className='body'>
      <LaunchPadNavBar title='Launch Pad' />
      <IonContent>
        <IonGrid>
          <IonRow class=' ion-padding-top ion-align-items-center'>
            <IonCol size-sm='6' size-md='3' className='ion-text-center'>
              <Link to={`/${restaurantId}/${locationId}/apps/orders`}>
                <IonCard className='card-width ion-padding'>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '25%',
                        padding: '9px',
                        marginTop: '10px',
                      }}
                      className=' icon-back '
                    >
                      <MdDashboard size={32} color='white' />
                    </div>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'center', fontWeight: '400', color: '#383838' }}
                    className='ion-padding-top'
                  >
                    Orders
                  </div>
                </IonCard>
              </Link>
            </IonCol>
            <IonCol size-sm='6' size-md='3' className='ion-text-center'>
              <Link to={`/${restaurantId}/${locationId}/apps/menu/list`}>
                <IonCard className='card-width ion-padding'>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '25%',
                        padding: '9px',
                        marginTop: '10px',
                      }}
                      className=' icon-back '
                    >
                      <BiFoodMenu size={32} color='white' />
                    </div>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'center', color: '#383838' }}
                    className='ion-padding-top'
                  >
                    Menu
                  </div>
                </IonCard>
              </Link>
            </IonCol>
            <IonCol size-sm='6' size-md='3' className='ion-text-center'>
              <Link to={`/${restaurantId}/${locationId}/apps/origins`}>
                <IonCard className='card-width ion-padding'>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <IonIcon
                      icon={qrCodeOutline}
                      size='large'
                      className=' icon-back '
                      color='light'
                      style={{ marginTop: '8px' }}
                    ></IonIcon>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'center', color: '#383838' }}
                    className='ion-padding-top'
                  >
                    Origins
                  </div>
                </IonCard>
              </Link>
            </IonCol>
            <IonCol size-sm='6' size-md='3' className='ion-text-center'>
              <Link to={`/${restaurantId}/${locationId}/apps/kds`}>
                <IonCard className='card-width ion-padding'>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '25%',
                        padding: '9px',
                        marginTop: '10px',
                      }}
                      className=' icon-back '
                    >
                      <LuGitBranchPlus size={32} color='white' />
                    </div>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'center', color: '#383838' }}
                    className='ion-padding-top'
                  >
                    Stations
                  </div>
                </IonCard>
              </Link>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default LaunchPadPage;
