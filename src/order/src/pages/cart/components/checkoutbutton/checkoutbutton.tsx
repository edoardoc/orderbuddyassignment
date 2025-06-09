import { IonButton, IonFooter, IonToolbar } from '@ionic/react';
import React from 'react';

interface CheckoutButtonProps {
  isValidPlaceOrder: boolean;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({ isValidPlaceOrder }) => (
  <IonFooter>
    <IonToolbar>
      <div className='ion-padding'>
        <IonButton
          disabled={!isValidPlaceOrder}
          expand='block'
          className='violet-background ion-no-padding place-order'
          style={{
            paddingLeft: '10px',
            paddingRight: '10px',
            fontWeight: '700',
          }}
          id='open-payment'
        >
          Check out
        </IonButton>
      </div>
    </IonToolbar>
  </IonFooter>
);
