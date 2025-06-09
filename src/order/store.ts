import { create } from 'zustand';
import { produce } from 'immer';
import _, { set } from 'lodash';
import { persist, createJSONStorage } from 'zustand/middleware';
//todo have to refactor
// export type Store = {
//   id: string
//   name: string
//   menu: {
//     items: MenuItem[]
//     toppings: toppingItem[]
//     addOns: AddOn[]
//     categories: categoryItem[]
//   }
//   stations: Station[]
//   settings: {
//     waitTimeInMinutes: number
//     currentWaitTimeInMinutes: number
//     expiresAt: string
//   }
//   isOpen: boolean
//   payment: {
//     acceptPayment: boolean
//   }
// }

export type RestaurantData = {
  restaurant: {
    _id: string;
    name: string;
    concept: string;
    logo?: string;
  };
  location: {
    _id: string;
    locationId: string;
    name: string;
    isActive: boolean;
  };
  origin: {
    _id: string;
    originId: string;
    name: string;
  };
};
export type Location = {
  id: string;
  name: string;
  address: string;
  timezone: string;
  contact: {
    phone: string;
    email: string;
  };
  geo: {
    lat: number;
    lng: number;
  };
  isActive: boolean;

  origins: Origins[];
};
export type Origins = {
  id: string;
  name: string;
  url: string;
};
export type Menu = {
  _id: string;
  menuId: string;
  name: string;
  schedule: {
    type: string;
    rules: {
      timezone: string;
      windows: TimeWindow[];
    };
  };
};

export type TimeWindow = {
  days: string[];
  start: string;
  end: string;
};
export type Customer = {
  name: string;
  phone: string;
};

export type Order = {
  id: string;
  customer: Customer;
  items: OrderItem[];
  getSms: boolean;
};

export type OrderItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  variants: {
    id: string;
    name: string;
    // price: number
    // selected: boolean
  }[];
  modifiers: {
    id: string;
    name: string;
    // price: number
    // quantity: number
    options: {
      id: string;
      name: string;
      // price: number
    }[];
  }[];
  stationTags: string[];
};

// state block
type State = {
  RestaurantData: RestaurantData;
  order: Order;
  station: StationData;
  paymentStatus: PaymentDetails;
  salesTax: number;
  menuId: string;
  getTaxAmount: () => number;
  getTotalWithTax: () => number;
  uuid: string;
};

export type PaymentDetails = {
  resultMessage: string;
  isPayed: boolean;
};
export type StationData = {
  id: string;
  name: string;
};

type Action = {
  setRestaurant: (RestaurantData: RestaurantData) => void;
  addOrderItem: (order: OrderItem) => void;
  removeOrderItem: (orderItemId: string) => void;
  setStation: (station: StationData) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerName: (name: string) => void;
  setGetSms: (value: boolean) => void;
  setOrderId: (id: string) => void;
  setPaymentStatus: (status: PaymentDetails) => void;
  setSalesTax: (salesTax: number) => void;
  setMenuId: (menuId: string) => void;
  setUuid: (uuid: string) => void;
};
const initialState: State = {
  RestaurantData: {
    restaurant: {
      _id: '',
      name: '',
      concept: '',
    },
    location: {
      _id: '',
      locationId: '',
      name: '',
      isActive: false,
    },
    origin: {
      _id: '',
      originId: '',
      name: '',
    },
  },
  order: {
    items: [],
    customer: {
      name: '',
      phone: '',
    },
    getSms: false,
    id: '',
  },
  station: {
    id: '',
    name: '',
  },
  paymentStatus: {
    resultMessage: '',
    isPayed: false,
  },
  salesTax: 0,
  menuId: '',
  getTaxAmount: () => 0,
  getTotalWithTax: () => 0,
  uuid: '',
};
export const appStore = create<State & Action>()(
  persist(
    (set, get) => ({
      ...initialState,
      getTaxAmount: () => {
        const state = get();
        const orderTotalPrice = state.order.items.reduce((sum, item) => sum + item.price, 0);
        return Number(((orderTotalPrice / 100) * (state.salesTax / 100)).toFixed(2));
      },

      getTotalWithTax: () => {
        const state = get();
        const subtotal = state.order.items.reduce((sum, item) => sum + item.price, 0);
        return Number(((subtotal + subtotal * (state.salesTax / 100)) / 100).toFixed(2));
      },

      setRestaurant: (restaurant: RestaurantData) => {
        set(
          produce((state: State) => {
            state.RestaurantData = restaurant;
          })
        );
      },
      addOrderItem: (order: OrderItem) => {
        set(
          produce((state: State) => {
            state.order.items.push(order);
          })
        );
      },

      removeOrderItem(orderItemId: string) {
        set(
          produce((state: State) => {
            const index = _.findIndex(state.order.items, function (i) {
              return i.id === orderItemId;
            });
            if (index !== -1) state.order.items.splice(index, 1);
          })
        );
      },
      setStation: (station: StationData) => {
        set(
          produce((state: State) => {
            state.station = station;
          })
        );
      },
      setCustomerPhone: (phone: string) => {
        set(
          produce((state: State) => {
            state.order.customer.phone = phone;
          })
        );
      },
      setCustomerName: (name: string) => {
        set(
          produce((state: State) => {
            state.order.customer.name = name;
          })
        );
      },

      setGetSms(value: boolean) {
        set(
          produce((state: State) => {
            state.order.getSms = value;
          })
        );
      },
      setOrderId(id: string) {
        set(
          produce((state: State) => {
            state.order.id = id;
          })
        );
      },
      setPaymentStatus(payment: PaymentDetails) {
        set(
          produce((state: State) => {
            state.paymentStatus.resultMessage = payment.resultMessage;
            state.paymentStatus.isPayed = payment.isPayed;
          })
        );
      },
      setSalesTax(salesTax: number) {
        set(
          produce((state: State) => {
            state.salesTax = salesTax;
          })
        );
      },
      setMenuId(menuId: string) {
        set(
          produce((state: State) => {
            state.menuId = menuId;
          })
        );
      },
      setUuid(uuid: string) {
        set(
          produce((state: State) => {
            state.uuid = uuid;
          })
        );
      },
    }),

    {
      name: 'customer-session-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
