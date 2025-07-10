import { registerPlugin } from '@capacitor/core';

export interface PrintOptions {
  ip: string;
  content: string; // raw ESC/POS or text
}

export const StarPrinter = registerPlugin<{
  printOverNetwork(options: PrintOptions): Promise<void>;
}>('StarPrinter');
