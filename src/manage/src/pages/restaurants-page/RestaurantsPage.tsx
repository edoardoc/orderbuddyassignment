import { IonPage, IonContent, IonGrid, IonRow, IonCard, IonIcon, IonCol, useIonRouter } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { useRestaurants } from '../../queries/useRestaurants';
import Session from 'supertokens-web-js/recipe/session';
import NavBar from '../../components/NavBar';
import { appStore } from '../../store';

const RestaurantsPage: React.FC = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const { setRestaurantName } = appStore();
  useEffect(() => {
    const getJWT = async () => {
      if (await Session.doesSessionExist()) {
        const accessToken = await Session.getUserId();
        setUserId(accessToken);
      }
    };
    getJWT();
  }, []);

  const { data: restaurantsData } = useRestaurants(userId);

  const router = useIonRouter();

  const handleRestaurantClick = (restaurantId: string) => {
    setRestaurantName(restaurantsData?.find((r) => r._id === restaurantId)?.name || '');
    router.push(`/${restaurantId}/locations`);
    return;
  };
  React.useEffect(() => {
    if (restaurantsData && restaurantsData.length === 1) {
      handleRestaurantClick(restaurantsData[0]._id);
    }
  }, [restaurantsData]);
  return (
    <IonPage className='body'>
      <NavBar title='Restaurants' showBackButton={false} />
      <IonContent>
        <IonGrid>
          <IonRow class=' ion-padding-top ion-align-items-center'>
            {restaurantsData?.map((restaurant) => (
              <IonCol size-sm='6' size-md='3' className='ion-text-center' key={restaurant._id}>
                <IonCard
                  className='card-width ion-padding'
                  onClick={() => handleRestaurantClick(restaurant._id)}
                  key={restaurant._id}
                >
                  <div className='ion-text-center'>
                    {restaurant.logo && (
                      <img src={restaurant.logo} alt={restaurant.name} style={{ width: '64px', height: '54px' }} />
                    )}
                  </div>
                  <div className='ion-text-center '>
                    <h3>{restaurant.name}</h3>
                    {/* <p className='ion-no-margin'>{restaurant.concept}</p> */}
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

export default RestaurantsPage;
