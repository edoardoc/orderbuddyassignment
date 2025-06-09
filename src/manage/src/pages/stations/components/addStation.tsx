import {
  IonCard,
  IonCardContent,
  IonIcon,
  IonLabel,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonInput,
  IonText,
} from '@ionic/react';
import { addCircleOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateStation } from '../../../queries/useCreateStation';
import { useParams } from 'react-router-dom';
import slugify from 'slugify';

const schema = z.object({
  name: z.string().min(1, 'Station name is required'),
});

type FormData = z.infer<typeof schema>;

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const AddStationModal: React.FC<AddStationModalProps> = ({ isOpen, onClose }) => {
  const { restaurantId, locationId } = useParams<{
    restaurantId: string;
    locationId: string;
  }>();
  const createStation = useCreateStation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createStation.mutateAsync({
        name: data.name,
        restaurantId,
        locationId,
        tags: [slugify(data.name, '-').toLowerCase()],
      });
    } catch (error) {
      console.error('Error creating station:', error);
    }
    onClose();
    reset();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Add New Station</IonTitle>
            <IonButtons slot='end'>
              <IonButton onClick={onClose}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <form onSubmit={handleSubmit(onSubmit)} className='ion-padding'>
            <IonItem>
              <IonInput
                label='Station Name'
                labelPlacement='floating'
                {...register('name')}
                className={errors.name ? 'ion-invalid' : ''}
              />
            </IonItem>
            {errors.name && (
              <IonText color='danger' className='ion-padding-start'>
                <small>{errors.name.message}</small>
              </IonText>
            )}

            <IonButton type='submit' expand='block' className='ion-margin-top'>
              Add Station
            </IonButton>
          </form>
        </IonContent>
      </IonModal>
    </>
  );
};

export default AddStationModal;
