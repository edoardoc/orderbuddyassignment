import { StarPrinter } from '../services/print-service';
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';
import _ from 'lodash';
import { Order } from '../pages/orders-page/types';

interface RestaurantInfo {
  restaurantId: string;
  restaurantName: string;
  locationId: string;
  locationName: string;
}

interface PrinterInfo {
  id: string;
  ip: string;
  name: string;
  type: string;
}
export function usePrinterService() {
  const printOrder = async (order: Order, restaurantInfo: RestaurantInfo, printerInfo: PrinterInfo) => {
    if (!printerInfo) {
      console.warn('No printer configured for orders');
      return;
    }
    console.log('Printer info:', printerInfo);
    console.log('Order to print:', order);
    console.log('Restaurant info:', restaurantInfo);
    const payload = {
      order: JSON.parse(JSON.stringify(order)),
      printerInfo: JSON.parse(JSON.stringify(printerInfo)),
      restaurantInfo: JSON.parse(JSON.stringify(restaurantInfo)),
    };

    await StarPrinter.printOverNetwork({ data: JSON.stringify(payload) });
  };

  return {
    printOrder,
  };
}
