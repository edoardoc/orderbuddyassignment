import { IonCol, IonContent, IonGrid, IonPage, IonRow, IonSpinner, useIonRouter } from '@ionic/react';
import { Router, useHistory } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUserSession } from './queries/useUser';
import { appStore } from './store';
// import { signOut } from "supertokens-auth-react/recipe/session";

const RootPage: React.FC = () => {
  const router = useIonRouter();

  useEffect(() => {
    router.push(`/restaurants`);
    return;
  }, []);

  return (
    <IonPage className='body'>
      <IonContent className='IonContent'>
        <IonGrid className='spinner-container' style={{ height: '100vh' }}>
          <IonRow className='ion-justify-content-center ion-align-items-center' style={{ height: '100%' }}>
            <IonCol className='ion-text-center IonCol'>
              <IonSpinner className='spinner-icon' color='tertiary' name='lines-sharp' style={{ width: '300px' }} />
              <div style={{ marginTop: '20px' }}>Loading...</div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default RootPage;
