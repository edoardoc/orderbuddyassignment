import { useEffect, useState } from 'react';
import { client } from '../../client';
import { useParams } from 'react-router-dom';
import { useOrderStatus } from '../../queries/useOrderStatus';
import { IonContent, IonPage } from '@ionic/react';

const StatusPage: React.FC = () => {
  const { orderId } = useParams<any>();
  const [orderStatus, setOrderStatus] = useState('order placed');
  const { data: orderData, isLoading } = useOrderStatus(orderId!, {
    onStatusChange: (status) => {
      setOrderStatus(status.status.toLowerCase());
    },
  });
  // useEffect(() => {
  //   if (client.connected) {
  //     //orderCompleted

  //     client.on("order_completed", ({ orderId, restaurantId }) => {
  //       console.log("status order completed message received");
  //       logger.debug(`Order Completed ${restaurantId}-${orderId}`);
  //       setOrderStatus("completed");
  //     });

  //     //orderPickup
  //     client.on("order_ready_for_pickup", ({ orderId, restaurantId }) => {
  //       console.log("status orderPickup message received");
  //       logger.debug(`Order Pickup ${restaurantId}-${orderId}`);
  //       setOrderStatus("ready_for_pickup");
  //     });
  //   }
  // }, [client.connected, orderid]);
  useEffect(() => {
    if (client.connected) {
      // Join order room to receive updates
      client.emit('order_joined', {
        orderId: orderId,
        restaurantId: '', // These fields are required by the DTO but not needed for status updates
        locationId: '',
        stationTags: [],
      });

      // Listen for status updates
      client.on('order_completed', ({ orderId, restaurantId }) => {
        console.log('status order completed message received');
        setOrderStatus('completed');
      });

      client.on('order_ready_for_pickup', ({ orderId, restaurantId }) => {
        console.log('status orderPickup message received');
        setOrderStatus('ready_for_pickup');
      });

      // Cleanup listeners
      return () => {
        client.off('order_completed');
        client.off('order_ready_for_pickup');
      };
    }
  }, [client.connected, orderId]);
  return (
    <IonPage>
      <IonContent>
        <h1>
          Order Status {orderId}-{orderStatus}
        </h1>
        <p>Your order is being processed.</p>
      </IonContent>
    </IonPage>
  );
};
export default StatusPage;
