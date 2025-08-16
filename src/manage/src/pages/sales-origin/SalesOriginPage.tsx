import React, { useRef, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import LaunchPadNavBar from '../../components/LanunchpadNavBar';
import { useSalesOrigin } from './useSalesOrigin';
import EmptyState from '../orders-page/components/EmptyState';
import { SalesOriginList } from './components/SalesOriginList';
import '../../../style.css';

const SalesOriginPage: React.FC = () => {
  const modalRef = useRef<HTMLIonModalElement>(null);

  const getYesterdayDate = (): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday.toISOString();
  };

  const [selectedDate, setSelectedDate] = useState<string>(getYesterdayDate());

  const { salesOrigin, isLoading, refetch, formatCurrency, calculateWidth } = useSalesOrigin(selectedDate);

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    modalRef.current?.dismiss();
  };

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    refetch().then(() => {
      event.detail.complete();
    });
  };

  // Now using calculateWidth from the hook

  return (
    <IonPage>
      <LaunchPadNavBar title='Sales by Origin' />
      <IonContent>
        <IonRefresher slot='fixed' onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonGrid>
          <IonRow className='ion-justify-content-center ion-padding-top'>
            <IonDatetimeButton datetime='item-sales-date'></IonDatetimeButton>
            <IonModal ref={modalRef} keepContentsMounted={true}>
              <IonDatetime
                id='item-sales-date'
                presentation='date'
                value={selectedDate}
                onIonChange={(e) => handleDateChange(e.detail.value as string)}
              ></IonDatetime>
            </IonModal>
          </IonRow>

          {isLoading && (
            <IonRow>
              <IonCol>
                {/* Sales items list skeleton */}
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Sales by Origin</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className='sales-origin-list-loading'>
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className='sales-origin-item-loading'>
                          <div className='sales-origin-item-info-loading'>
                            <div className='sales-origin-item-image-loading'></div>
                            <div className='sales-origin-item-details-loading'>
                              <div className='title-loading'></div>
                              <div className='subtitle-loading'></div>
                            </div>
                            <div className='sales-origin-item-amount-loading'></div>
                          </div>
                          <div className='sales-origin-item-progress-loading'></div>
                        </div>
                      ))}
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}

          {!isLoading && salesOrigin.length === 0 && (
            <EmptyState title='📊 No Sales Data' subTitle='There were no sales recorded for the selected date.' />
          )}

          {!isLoading && salesOrigin.length > 0 && (
            <IonRow>
              <IonCol>
                <IonCard>
                  <IonCardContent>
                    <SalesOriginList
                      items={salesOrigin}
                      calculateWidth={calculateWidth}
                      formatCurrency={formatCurrency}
                    />
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default SalesOriginPage;
