import { IonButton, IonIcon, IonItem, IonLabel, IonText } from '@ionic/react';
import { closeCircleSharp, closeOutline, trashOutline } from 'ionicons/icons';
import React from 'react';
import { useOrderStore } from '@/stores/orderStore';

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
  const removeOrderItemState = useOrderStore((s) => s.removeOrderItem);

  const removeOrderItem = (orderItemId: string) => {
    removeOrderItemState(orderItemId);
  };

  return (
    <IonItem key={item.id}>
      <IonLabel>
        <IonText className='font-size-14'>{item.name}</IonText>
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
        <p>
          <IonText>${(item.price / 100).toFixed(2)}</IonText>
        </p>
      </IonLabel>
      <IonButton fill='clear' slot='end' onClick={() => removeOrderItem(item.id)}>
        <IonIcon slot='icon-only' icon={closeOutline} />
      </IonButton>
    </IonItem>
  );
};
