import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonLabel,
  IonIcon,
  IonButton,
  IonFab,
  IonGrid,
  IonRow,
  IonCol,
  IonFabButton,
} from '@ionic/react';
import React, { useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { useStations } from '../../queries/useStations';
import './stations.css';
import LaunchPadNavBar from '../../components/LanunchpadNavBar';
import { add, enterOutline } from 'ionicons/icons';
import AddStationModal from './components/addStation';

const StationsPage: React.FC = () => {
  const { restaurantId, locationId } = useParams<{
    restaurantId: string;
    locationId: string;
  }>();
  const router = useHistory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: stations } = useStations(restaurantId, locationId);

  return (
    <IonPage className='stations-page'>
      <LaunchPadNavBar title='Stations' />

      <IonContent>
        <IonGrid>
          <IonRow>
            {stations?.map((station, index) => (
              <IonCol size-sm='6' size-md='3' key={index}>
                <IonCard key={station._id}>
                  <IonCardHeader>
                    <IonCardTitle>{station.name}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow class='ion-align-items-center ion-justify-content-between'>
                        <IonCol size='auto'>
                          {station.tags?.map((tag) => (
                            <IonChip key={tag} color='primary'>
                              <IonLabel>{tag}</IonLabel>
                            </IonChip>
                          ))}
                        </IonCol>
                      </IonRow>
                      <IonRow>
                        <IonCol size='12'>
                          <Link to={`/${restaurantId}/${locationId}/apps/station/${station._id}`}>
                            <IonButton expand='block' fill='outline' size='small'>
                              <IonIcon icon={enterOutline} slot='start' />
                              Go to Station
                            </IonButton>
                          </Link>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        <IonFab slot='fixed' vertical='bottom' horizontal='end'>
          <IonFabButton color='primary' onClick={() => setIsModalOpen(true)}>
            {' '}
            <IonIcon icon={add} />
          </IonFabButton>
          <AddStationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />{' '}
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default StationsPage;
