import { IonBackButton, IonButtons, IonHeader, IonText, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';

interface NavBarProps {
  title: string;
  showBackButton?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ title, showBackButton = true }) => {
  return (
    <IonHeader>
      <IonToolbar>
        {showBackButton && (
          <IonButtons slot='start'>
            <IonBackButton />
          </IonButtons>
        )}
        <IonTitle>
          <IonText>{title}</IonText>
        </IonTitle>
      </IonToolbar>
    </IonHeader>
  );
};

export default NavBar;
