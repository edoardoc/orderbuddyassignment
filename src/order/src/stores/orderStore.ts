import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ORDER_SESSION_KEY, ORDER_SESSION_TTL } from '@/constants/app-config';
import { produce } from 'immer';
import _ from 'lodash';

// interface OrderStore {
//   validateSession: () => boolean;
// }

interface OrderOrigin {
  restaurantId: string;
  locationId: string;
  originId: string;
}

export type RestaurantData = {
  restaurant: {
    _id: string;
    name: string;
    logo?: string;
  };
  location: {
    _id: string;
    name: string;
    acceptPayment: boolean;
    isOpen: boolean; 
  };
  origin: {
    _id: string;
    name: string;
  };
};
export type Customer = {
  name: string;
  phone: string;
};
export type OrderItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  notes?: string;
  variants: {
    id: string;
    name: string;
    priceCents: number;
    // selected: boolean
  }[];
  modifiers: {
    id: string;
    name: string;
    // quantity: number
    options: {
      id: string;
      name: string;
      priceCents: number;
    }[];
  }[];
  stationTags: string[];
};
export type PaymentDetails = {
  resultMessage: string;
  isPayed: boolean;
};
export type Cart = {
  items: OrderItem[];
  totalPriceCents: number;
  tax: number;
};
type OrderState = {
  menuId: string;
  restaurant: {
    _id: string;
    name: string;
    logo?: string;
  };
  location: {
    _id: string;
    name: string;
    acceptPayment: boolean;
    isOpen: boolean;
  };
  origin: {
    _id: string;
    name: string;
  };
  cart: Cart;
  orderTimeStamp: Date;
  salesTax: number;
};

type OrderActions = {
  setRestaurant: (data: RestaurantData) => void;
  setMenuId: (id: string) => void;
  addOrderItem: (item: OrderItem) => void;
  removeOrderItem: (itemId: string) => void;

  setSalesTax: (tax: number) => void;
  restoreCartFromSession: (cart: Cart) => void;
  // persistSession: () => void;
  setRestaurantName: (name: string) => void;
  validateSession: () => boolean;
  setSelectedMenuId: (id: string) => void;
  setOrderOrigin: (origin: OrderOrigin) => void;
  resetOrderState: () => void;
};

const initialState: OrderState = {
  menuId: '',
  restaurant: {
    _id: '',
    name: '',
    logo: undefined,
  },
  location: {
    _id: '',
    name: '',
    isOpen: false, 
    acceptPayment: false
  },
  origin: {
    _id: '',
    name: '',
  },
  cart: {
    items: [],
    totalPriceCents: 0,
    tax: 0,
  },
  salesTax: 0,
  orderTimeStamp: new Date(),
};
export const useOrderStore = create<OrderState & OrderActions>()(
  persist(
    (set, get) => {
      const calculateSubtotal = (items: OrderItem[]): number => {
        return _.sumBy(items, 'price');
      };

      const calculateTaxAmount = (subtotal: number, taxRate: number): number => {
        return Math.round(subtotal * (taxRate / 100));
      };

      const updateCartTotals = (state: OrderState) => {
        const subtotal = calculateSubtotal(state.cart.items);
        const taxAmount = calculateTaxAmount(subtotal, state.salesTax);

        state.cart.tax = taxAmount;
        state.cart.totalPriceCents = subtotal + taxAmount;
      };

      const updateMenu = (menuId: string) => {
        set({ menuId });
      };

      return {
        ...initialState,

        resetOrderState: () => {
          set(initialState);
          localStorage.removeItem(ORDER_SESSION_KEY);
        },
        setRestaurantName(name: string) {
          set(
            produce((state: OrderState) => {
              state.restaurant.name = name;
            }),
          );
        },

        setOrderOrigin: (origin: OrderOrigin) =>
          set(
            produce((state: OrderState) => {
              state.restaurant._id = origin.restaurantId;
              state.location._id = origin.locationId;
              state.origin._id = origin.originId;
              state.orderTimeStamp = new Date(); // Add this
            }),
          ),

        setRestaurant: (data: RestaurantData) =>
          set(
            produce((state: OrderState) => {
              state.restaurant = data.restaurant;
              state.location = data.location;
              state.origin = data.origin;
            }),
          ),
        setMenuId: (id) => set({ menuId: id }),
        addOrderItem: (item: OrderItem) =>
          set(
            produce((state: OrderState) => {
              state.cart.items.push(item);
              updateCartTotals(state);
            }),
          ),

        removeOrderItem: (itemId: string) =>
          set(
            produce((state: OrderState) => {
              const index = state.cart.items.findIndex((i) => i.id === itemId);
              if (index !== -1) {
                state.cart.items.splice(index, 1);
                updateCartTotals(state);
              }
            }),
          ),

        setSalesTax: (tax) => set({ salesTax: tax }),

        restoreCartFromSession: (cart) => set({ cart }),
        setSelectedMenuId: (id: string) => updateMenu(id),

        validateSession: () => {
          const sessionRaw = localStorage.getItem(ORDER_SESSION_KEY);
          const session = sessionRaw ? JSON.parse(sessionRaw) : null;
          const now = Date.now();

          // Check if session exists
          if (
            !session ||
            !session.state ||
            !session.state.orderTimeStamp ||
            !session.state.restaurant._id ||
            !session.state.location._id ||
            !session.state.origin._id
          ) {
            console.log('No valid session found');
            return false;
          }

          // Check timestamp existence and validity
          const timestamp = new Date(session.state.orderTimeStamp).getTime();
          if (!timestamp) {
            console.log('No valid timestamp in session');
            return false;
          }

          // Validate timestamp
          const timeElapsed = now - timestamp;
          const timeValid = timeElapsed < ORDER_SESSION_TTL;
          return timeValid;
        },
      };
    },
    {
      name: ORDER_SESSION_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
