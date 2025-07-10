import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { PaymentForm } from '../../../../components/gravity/paymentform';
import React, { RefObject } from 'react';

interface PaymentModalProps {
  modalRef: RefObject<HTMLIonModalElement>;
  amount: number;
  customerData: {
    name: string;
    phone: string;
    getSms: boolean;
  };
  onPaymentSuccess: () => void;
  onPaymentError: (error: any) => void;
  onCancel: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  modalRef,
  amount,
  customerData,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
}) => (
  <IonModal id='example-modal' ref={modalRef} trigger='open-payment' canDismiss={true}>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot='start'>
          <IonButton onClick={onCancel}>Cancel</IonButton>
        </IonButtons>
        <IonTitle>Payment Information</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent className='ion-padding-top'>
      <PaymentForm
        amount={amount}
        customerData={customerData}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />{' '}
    </IonContent>
  </IonModal>
);
