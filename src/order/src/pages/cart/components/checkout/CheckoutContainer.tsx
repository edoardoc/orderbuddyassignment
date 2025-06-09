import React, { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { appStore } from '../../../../../store';
import { CheckoutButton } from '../checkoutbutton/checkoutbutton';
import { PaymentModal } from '../payment/paymentmodal';

interface CheckoutContainerProps {
  isValidPlaceOrder: boolean;
  calculateTotal: () => number;
}

export const CheckoutContainer: React.FC<CheckoutContainerProps> = ({ isValidPlaceOrder, calculateTotal }) => {
  const paymentModal = useRef<HTMLIonModalElement>({} as HTMLIonModalElement);

  const amount = calculateTotal(); // Now we call the function when needed
  const handlePaymentSuccess = () => {
    paymentModal.current?.dismiss();
    // Add your payment success navigation logic here
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
  };

  const handleCancel = () => {
    paymentModal.current?.dismiss();
  };

  return (
    <>
      <CheckoutButton isValidPlaceOrder={isValidPlaceOrder} />
      <PaymentModal
        modalRef={paymentModal}
        amount={amount}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        onCancel={handleCancel}
      />
    </>
  );
};
