import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { PaymentForm } from '../../../../components/gravity/paymentform';
import React, { RefObject } from 'react';

interface PaymentModalProps {
  modalRef: RefObject<HTMLIonModalElement>;
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: any) => void;
  onCancel: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  modalRef,
  amount,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
}) => (
  <IonModal id='example-modal' ref={modalRef} trigger='open-payment' canDismiss={true}>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot='start'>
          <IonButton onClick={onCancel} color={'primary'}>
            Cancel
          </IonButton>
        </IonButtons>
        <IonTitle>Payment Information</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent className='ion-padding-top'>
      <PaymentForm amount={amount} onPaymentSuccess={onPaymentSuccess} onPaymentError={onPaymentError} />
    </IonContent>
  </IonModal>
);
