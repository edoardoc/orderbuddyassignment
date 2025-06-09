import { IonCheckbox, IonInput } from '@ionic/react';
import { UseFormRegister } from 'react-hook-form';
import React, { useState, useEffect } from 'react';
// import './input.css';
import { appStore } from '../../../../../store';

interface InputFieldProps {
  onValidityChange?: (isValid: boolean) => void;
}

export const InputField: React.FC<InputFieldProps> = ({ onValidityChange }) => {
  const appState = appStore();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPhoneNumberInput, setShowPhoneNumberInput] = useState(false);

  useEffect(() => {
    const isValid = customerName.length > 0 && (!showPhoneNumberInput || phone.length === 10);
    onValidityChange?.(isValid);
  }, [customerName, phone, showPhoneNumberInput, onValidityChange]);
  useEffect(() => {
    if (!showPhoneNumberInput) {
      appState.setCustomerPhone('');
      setPhone('');
    }
  }, [showPhoneNumberInput]);
  const handleNameInput = (e: CustomEvent) => {
    const value = ((e.target as HTMLIonInputElement).value as string) || '';
    setCustomerName(value);
    appState.setCustomerName(value);
  };

  const handlePhoneInput = (e: CustomEvent) => {
    const originalValue = (e.target as HTMLIonInputElement).value as string;
    const validPhoneRegex = /^[0-9\s-]*$/;

    if (!originalValue || typeof originalValue !== 'string' || !validPhoneRegex.test(originalValue)) {
      setPhone('');
      appState.setCustomerPhone('');
      return;
    }

    if (originalValue.length === 10) {
      setPhone(originalValue);
      appState.setCustomerPhone(originalValue);
    }
  };

  return (
    <div className='ion-padding'>
      <IonInput
        disabled={appState.order.items.length === 0}
        clearInput={true}
        aria-label='Custom input'
        class='custom'
        placeholder='What name should we put on your order?'
        onIonInput={handleNameInput}
        value={customerName}
      />

      {showPhoneNumberInput && (
        <IonInput
          maxlength={10}
          type='tel'
          style={{ marginTop: '10px' }}
          disabled={appState.order.items.length === 0}
          clearInput={true}
          aria-label='Custom input'
          class='custom'
          placeholder="What's the best number to reach you?"
          onIonInput={handlePhoneInput}
          value={phone}
        />
      )}

      <IonCheckbox
        labelPlacement='end'
        style={{
          paddingTop: '10px',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
        }}
        onIonChange={(e: CustomEvent) => {
          setShowPhoneNumberInput(e.detail.checked);
          appState.setGetSms(e.detail.checked);
        }}
      >
        Get a text message when your order is ready
      </IonCheckbox>

      <p>
        <sub>
          By providing your phone number and checking this box, you consent to receiving text messages from OrderBuddy
          informing you on updates on your order. Message and data rates may apply. Reply HELP for help or STOP to
          cancel. View our{' '}
          <a href={`${import.meta.env.VITE_MENU_ENDPOINT}/privacy`} target='_blank'>
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href={`${import.meta.env.VITE_MENU_ENDPOINT}/terms`} target='_blank'>
            Terms of Service
          </a>
          .
        </sub>
      </p>
    </div>
  );
};
