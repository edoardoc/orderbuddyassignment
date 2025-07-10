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
  const getContent = (order: Order, restaurantInfo: RestaurantInfo) => {
    const encoder = new ReceiptPrinterEncoder({
      language: 'star-prnt',
      feedBeforeCut: 4,
    });

    const receipt = encoder
      .initialize()
      .codepage('auto')

      // 🏷 Restaurant Header
      .height(2)
      .bold()
      .align('left')
      .line(`${restaurantInfo.restaurantName} - ${restaurantInfo.locationName}`)
      .bold()
      .newline(2)
      .height(1);

    //   // 👤 Customer Info
    //   .width(2)
    //   .underline()
    //   .line(order.customer.name)
    //   .underline()

    //   // 🧾 Order Info
    //   .text('#')
    //   .text(order._id.slice(-4).toUpperCase())
    //   .text(` ${order.origin.name}`)
    //   .newline()
    //   .width(1)
    //   .rule();

    // // 🧂 Items
    // order.items.forEach((item) => {
    //   receipt.bold().line(item.name).bold();

    //   if (item.variants?.length) {
    //     item.variants.forEach((variant) => receipt.text('> ').text(variant.name).newline());
    //   }

    //   if (item.modifiers?.length) {
    //     item.modifiers.forEach((mod) => {
    //       const options = mod.options?.map((o) => o.name).join(', ');
    //       receipt.text('- ').text(mod.name).text(': ').text(options).newline();
    //     });
    //   }

    //   receipt.newline();
    // });

    // receipt.rule();

    // // 🧮 Summary
    // receipt
    //   .width(2)
    //   .line(`Items: ${order.items.length}`)
    //   .newline()
    //   .line(`Total: $${(order.totalPrice / 100).toFixed(2)}`)
    //   .newline()
    //   .width(1);

    // // 🔲 QR Code
    // const qrText = `https://order.dev.orderbuddyapp.com/menus/${restaurantInfo.restaurantId}/${restaurantInfo.locationName}/${restaurantInfo.locationId}`;
    // receipt
    //   .align('center')
    //   .bold()
    //   .text('Order again anytime — just scan')
    //   .bold()
    //   .newline()
    //   .qrcode(qrText, { size: 8 })
    //   .newline()
    //   .align('left');

    // 💜 Footer
    receipt.align('right').invert().text('OrderBuddy').invert().align('left').newline();

    const result = receipt.cut().encode();
    return result;
  };

  const printOrder = async (order: Order, restaurantInfo: RestaurantInfo, printers: PrinterInfo[]) => {
    //todo map printer to orders app and use it
    const printerInfo = _.find(printers, function (printer) {
      return printer.name.toLowerCase() === 'orders';
    });

    if (!printerInfo) {
      console.warn('No printer configured for orders');
      return;
    }

    console.log('Printer info:', printerInfo);

    const result = getContent(order, restaurantInfo);
    const content = toBase64(result);
    console.log('Encoded result:', content);

    await StarPrinter.printOverNetwork({
      ip: printerInfo.ip,
      content: content,
    });
  };

  return {
    printOrder,
  };
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
