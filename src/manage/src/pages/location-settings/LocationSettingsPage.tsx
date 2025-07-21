import {
  IonPage,
  IonContent,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
  IonGrid,
  IonCol,
  IonRow,
} from '@ionic/react';
import LaunchPadNavBar from '../../components/LanunchpadNavBar';
import WorkingHours from './components/WorkingHours';
import Timezone from './components/Timezone';
import OrderAcceptance from './components/OrderAcceptance';
import { useLocationSettings } from './useLocationSettings';

const LocationSettingsPage: React.FC = () => {
  const {
    workingHours,
    timezone,
    isLoading,
    isUpdating,
    updateTimezone,
    updateStoreOpen,
    updateWorkingHours,
    timezones,
    startAcceptMinutes,
    stopAcceptMinutes,
    updateStartAcceptOrders,
    updateStopAcceptOrders,
  } = useLocationSettings();

  return (
    <IonPage className='stations-page'>
      <LaunchPadNavBar title='Location Settings' />
      <IonContent>
        <IonGrid>
          <IonRow className='ion-justify-content-center ion-padding'>
            <IonCol size='12'>
              <IonAccordionGroup>
                <IonAccordion value='timezone'>
                  <IonItem slot='header' color='light'>
                    <IonLabel>Time Zone</IonLabel>
                  </IonItem>
                  <div className='ion-padding' slot='content'>
                    <Timezone timezone={timezone} updateTimezone={updateTimezone} timezones={timezones} />
                  </div>
                </IonAccordion>
                <IonAccordion value='Hours'>
                  <IonItem slot='header' color='light'>
                    <IonLabel> Working Hours </IonLabel>
                  </IonItem>
                  <div className='ion-padding' slot='content'>
                    <WorkingHours
                      workingHours={workingHours}
                      updateStoreOpen={updateStoreOpen}
                      updateWorkingHours={updateWorkingHours}
                      isLoading={isLoading}
                    />
                  </div>
                </IonAccordion>
                <IonAccordion value='Acceptance'>
                  <IonItem slot='header' color='light'>
                    <IonLabel>Order Acceptance</IonLabel>
                  </IonItem>
                  <div className='ion-padding' slot='content'>
                    <OrderAcceptance
                      startAcceptMinutes={startAcceptMinutes}
                      stopAcceptMinutes={stopAcceptMinutes}
                      updateStartAcceptOrders={updateStartAcceptOrders}
                      updateStopAcceptOrders={updateStopAcceptOrders}
                    />
                  </div>
                </IonAccordion>
              </IonAccordionGroup>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default LocationSettingsPage;
