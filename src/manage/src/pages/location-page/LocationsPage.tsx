import { IonCard, IonCol, IonContent, IonGrid, IonPage, IonRow, useIonRouter } from '@ionic/react';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLocations } from '../../queries/useLocations';
import NavBar from '../../components/NavBar';
import { appStore } from '../../store';

const LocationsPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { data: locations } = useLocations(restaurantId);
  const { setLocationName } = appStore();
  const router = useIonRouter();

  const handleLocationClick = (location: any) => {
    setLocationName(location.name);
    router.push(`/${restaurantId}/${location._id}/launch-pad`);
  };

  useEffect(() => {
    if (locations?.length === 1) {
      router.push(`/${restaurantId}/${locations[0]._id}/launch-pad`);
    }
  }, [locations, restaurantId]);

  return (
    <IonPage className='body'>
      <NavBar title='Locations' />

      <IonContent>
        <IonGrid>
          <IonRow class=' ion-padding-top ion-align-items-center'>
            {locations?.map((location) => (
              <IonCol size-sm='6' size-md='3' className='ion-text-center' key={location._id}>
                <IonCard className='card-width ion-padding' onClick={() => handleLocationClick(location)}>
                  <div className='ion-text-center'>
                    <div className='location-icon'>🏪</div>
                  </div>
                  <div className='ion-text-center ion-padding-top'>
                    <h3>{location.name}</h3>
                    {/* <p className='ion-no-margin'>Location ID: {location.locationId}</p> */}
                  </div>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default LocationsPage;
