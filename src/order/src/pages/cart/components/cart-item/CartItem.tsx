import { IonButton, IonIcon, IonItem, IonLabel } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import React from 'react';
import { appStore } from '../../../../../store';

interface ModifierOption {
  name: string;
}

interface Modifier {
  name: string;
  options: ModifierOption[];
}

interface Variant {
  name: string;
}
interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    variants?: Variant[];
    modifiers?: Modifier[];
  };
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const appState = appStore();
  const removeOrderItem = (orderItemId: string) => {
    appState.removeOrderItem(orderItemId);
  };
  
  return (
    <IonItem key={item.id}>
      <IonLabel>
        <h2>{item.name}</h2>
        {item.variants && <p className='ion-no-margin'>{item.variants.map((variant) => variant.name).join(', ')}</p>}
        {item.modifiers && (
          <div>
            {item.modifiers.map((mod) => (
              <p key={mod.name} className='ion-text-wrap ion-no-margin text-small'>
                {`${mod.name}: ${mod.options.map((opt) => opt.name).join(', ')}`}
              </p>
            ))}
          </div>
        )}
      </IonLabel>
      <IonLabel slot='end'>
        {' '}
        <p>${(item.price / 100).toFixed(2)}</p>
      </IonLabel>
      <IonButton fill='clear' slot='end' onClick={() => removeOrderItem(item.id)}>
        <IonIcon slot='icon-only' icon={trashOutline} color='danger' />
      </IonButton>
    </IonItem>
  );
};
