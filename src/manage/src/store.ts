import { create } from 'zustand';
import { produce } from 'immer';
import _ from 'lodash';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Menu = {
  _id: string;
  menu: {
    addOns: AddOn[];
    categories: CategoryItem[];
    displays: Display[];
    items: MenuItem[];
    toppings: ToppingItem[];
  };
};

export type CategoryItem = {
  id: string;
  name: string;
  description: string;
  sequence: number;
};
export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  price: number;
  imageUrl: string;
  description: string;
  toppingsAllowed: string[];
  // maxToppingsAllowed: number //changed to freeToppingsAllowed
  freeToppingsAllowed: number;
  displayIds: string[];
  addOnsAllowed: string[];
  // maxAddOnsAllowed: number //changed to maxAddOnAllowed
  maxAddOnAllowed: number;

  sizes: Size[];
};
export interface Size {
  size: string;
  price: number;
  imageUrl: string;
}
export type ToppingItem = {
  id: string;
  name: string;
};
export type AddOn = {
  id: string;
  name: string;
  price: number;
};
export type Display = {
  id: string;
  name: string;
};

export type editMenuItem = {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  price: number;
  imageUrl: string;
  description: string;
  toppingsAllowed: string[];
  freeToppingsAllowed: number;
  displayIds: string[];
  addOnsAllowed: string[];
  maxAddOnAllowed: number;

  sizes: Size[];
};
export interface order_item_started {
  orderId: string;
  itemId: string;
  startedBoolean: boolean;
}
export interface order_item_completed {
  orderId: string;
  itemId: string;
  startedBoolean: boolean;
}

export interface order_ready_for_pickup {
  orderId: string;
  startedBoolean?: boolean;
}

export interface order_completed {
  orderId: string;
  startedBoolean?: boolean;
}

export interface Store {
  id: string;
  name: string;
}

export interface timeSettings {
  from: string;
  to: string;
  timezone: string;
}

export interface StoreProfileSettings {
  name: string;
  email: string;
  address: string;
  phoneNumber: string;
  opening_hours: timeSettings;
  daysOpen: string[];
}
export type Order = {
  _id: string;
  station: Station;
  customer: Customer;
  items: OrderItem[];
  orderItemCount: number;
  startedAt: string;
  waitTimeInMinutes: number;
  status: string;
  totalPrice: number;
  endedAt?: string;
  isDelayed: boolean;
  hasChanged: boolean;
  isTakeaway: boolean;
  hasCompleted: boolean;
};
export type OrderItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  toppings: string[];
  isStarted: boolean;
  isCompleted: boolean;
  completedAt: Date;
  remarks: string;
  size: string;
  isTakeaway: boolean;
  addons: string[];
  inProgress: boolean;
};
export type Customer = {
  name: string;
  phone: string;
};
export type Station = {
  id: string;
  name: string;
};
type State = {
  selectedRestaurantName?: string;
  selectedLocationName?: string;
  authToken: string;
  order_item_started: order_item_started;
  order_item_completed: order_item_completed;
  order_ready_for_pickup: order_ready_for_pickup;
  order_completed: order_completed;
  // CallByOrderDisplay: boolean
  // DisplayOrderId: string
  // isMenuEditing: boolean
  // store: Store
  // editMenu: MenuItem
  // isEditingMenu: boolean
  // completedOrder: Order[]
  // storeProfileSettings: StoreProfileSettings
};

type Action = {
  setAuthToken: (token: string) => void;

  // setOrderItemStarted: (value: order_item_started) => void;
  // setOrderItemStartedBoolean: (value: boolean) => void;

  // setOrderItemCompleted: (value: order_item_completed) => void;
  // setOrderItemCompletedBoolean: (value: boolean) => void;

  setOrderReadyForPickup: (value: order_ready_for_pickup) => void;
  setOrderReadyForPickupBoolean: (value: boolean) => void;

  setOrderCompleted: (value: order_completed) => void;
  setOrderCompletedBoolean: (value: boolean) => void;

  setRestaurantName: (name: string) => void;
  setLocationName: (name: string) => void;

  // setDisplayOrderId: (id: string) => void
  // setDisplayOrderIdFlag: (flag: boolean) => void

  // setMenuEditing: (value: boolean) => void

  // setStore: (store: Store) => void

  // setEditMenu: (menu: MenuItem) => void

  // setIsEditingMenu: (status: boolean) => void

  // setCompletedOrder: (order: Order[]) => void
  // addCompletedOrder: (order: Order) => void
  // setStoreProfileSettings: (settings: StoreProfileSettings) => void

  reset: () => void;
};
const initialState: State = {
  authToken: '',

  order_item_started: {
    orderId: '',
    itemId: '',
    startedBoolean: false,
  },
  order_item_completed: {
    orderId: '',
    itemId: '',
    startedBoolean: false,
  },
  order_ready_for_pickup: {
    orderId: '',
    startedBoolean: false,
  },
  order_completed: {
    orderId: '',
    startedBoolean: false,
  },
};

export const appStore = create<State & Action>()(
  persist(
    (set) => ({
      ...initialState,
      authToken: '',

      order_item_started: {
        orderId: '',
        itemId: '',
        startedBoolean: false,
      },
      order_item_completed: {
        orderId: '',
        itemId: '',
        startedBoolean: false,
      },
      order_ready_for_pickup: {
        orderId: '',
        startedBoolean: false,
      },
      order_completed: {
        orderId: '',
        startedBoolean: false,
      },
      DisplayOrderId: '',
      CallByOrderDisplay: false,
      isMenuEditing: false,
      store: {
        id: '',
        name: '',
      },
      editMenu: {
        id: '',
        categoryId: '',
        name: '',
        code: '',
        price: 0,
        imageUrl: '',
        description: '',
        toppingsAllowed: [],
        // maxToppingsAllowed: 0,
        displayIds: [],
        addOnsAllowed: [],
        // maxAddOnsAllowed: 0,
        sizes: [],
        freeToppingsAllowed: 0,
        maxAddOnAllowed: 0,
      },
      completedOrder: [],
      isEditingMenu: false,
      reset: () => {
        set(initialState);
      },
      setAuthToken(token: string) {
        set(
          produce((state: State) => {
            state.authToken = token;
          })
        );
      },
      setRestaurantName: (name: string) => set((state) => ({ selectedRestaurantName: name })),

      setLocationName: (name: string) => set((state) => ({ selectedLocationName: name })),
      setOrderReadyForPickup(value: order_ready_for_pickup) {
        set(
          produce((state: State) => {
            state.order_ready_for_pickup.orderId = value.orderId;
            state.order_ready_for_pickup.startedBoolean = value.startedBoolean;
          })
        );
      },
      setOrderReadyForPickupBoolean(value: boolean) {
        set(
          produce((state: State) => {
            state.order_ready_for_pickup.startedBoolean = value;
          })
        );
      },

      setOrderCompleted(value: order_completed) {
        set(
          produce((state: State) => {
            state.order_completed.orderId = value.orderId;
            state.order_completed.startedBoolean = value.startedBoolean;
          })
        );
      },

      setOrderCompletedBoolean(value: boolean) {
        set(
          produce((state: State) => {
            state.order_completed.startedBoolean = value;
          })
        );
      },

      // setDisplayOrderId(id: string) {
      //   set(
      //     produce((state: State) => {
      //       state.DisplayOrderId = id
      //     })
      //   )
      // },
      // setDisplayOrderIdFlag(flag: boolean) {
      //   set(
      //     produce((state: State) => {
      //       state.CallByOrderDisplay = flag
      //     })
      //   )
      // },
      // setMenuEditing(value: boolean) {
      //   set(
      //     produce((state: State) => {
      //       state.isMenuEditing = value
      //     })
      //   )
      // },
      // setStore(store: any) {
      //   set(
      //     produce((state: State) => {
      //       state.store.id = store._id
      //       state.store.name = store.name
      //     })
      //   )
      // },

      // setEditMenu(menu: MenuItem) {
      //   set(
      //     produce((state: State) => {
      //       state.editMenu = menu
      //     })
      //   )
      // },
      // setIsEditingMenu(status: boolean) {
      //   set(
      //     produce((state: State) => {
      //       state.isEditingMenu = status
      //     })
      //   )
      // },

      // setCompletedOrder(order: Order[]) {
      //   set(
      //     produce((state: State) => {
      //       state.completedOrder = order
      //     })
      //   )
      // },
      // addCompletedOrder(order: Order) {
      //   set(
      //     produce((state: State) => {
      //       state.completedOrder.push(order)
      //     })
      //   )
      // },
      // setStoreProfileSettings(settings: StoreProfileSettings) {
      //   set(
      //     produce((state: State) => {
      //       state.storeProfileSettings = settings
      //     })
      //   )
      // },
    }),

    {
      name: 'storev2-session-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
