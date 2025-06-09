import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrderBuddySession } from '@/hooks/useSessionStorage';
import { ORDER_SESSION_KEY, ORDER_SESSION_TTL } from '@/constants/app-config';

interface OrderStore {
  validateSession: () => boolean;
}

interface OrderOrigin {
  restaurantId: string;
  locationId: string;
  originId: string;
}

interface OrderStore {
  orderOrigin: OrderOrigin | null;
  restaurant: any | null;
  menuId: string | null;
  salesTax: number | null;
  cart: any[];

  setOrderOrigin: (origin: OrderOrigin) => void;
  setRestaurant: (data: any) => void;
  setMenuId: (id: string) => void;
  setSalesTax: (salesTax: number) => void;

  addToCart: (item: any) => void;
  clearCart: () => void;

  restoreCartFromSession: (cart: any[]) => void;
  persistSession: () => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orderOrigin: null,
      restaurant: null,
      menuId: null,
      salesTax: null,
      cart: [],

      setOrderOrigin: (origin) => set({ orderOrigin: origin }),
      setRestaurant: (data) => set({ restaurant: data }),
      setMenuId: (id) => set({ menuId: id }),
      setSalesTax: (salesTax) => set({ salesTax: salesTax }),
      addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
      clearCart: () => set({ cart: [] }),

      restoreCartFromSession: (cart) => set({ cart }),

      persistSession: () => {
        const { orderOrigin, cart, menuId } = get();
        if (!orderOrigin || !menuId) return;
        const session: Omit<OrderBuddySession, 'timestamp'> = {
          restaurantId: orderOrigin.restaurantId,
          locationId: orderOrigin.locationId,
          originId: orderOrigin.originId,
          menuId,
          cart,
        };

        localStorage.setItem('ob-session', JSON.stringify({ ...session, timestamp: Date.now() }));
      },
      validateSession: () => {
        const sessionRaw = localStorage.getItem(ORDER_SESSION_KEY);
        console.log('Session Raw:', sessionRaw);
        const session = sessionRaw ? JSON.parse(sessionRaw) : null;
        const { orderOrigin, menuId } = get();
        const now = Date.now();

        if (!session || !orderOrigin) {
          console.log('Validation failed: missing session or orderOrigin', { session, orderOrigin });
          return false;
        }

        const isValid =
          session.restaurantId === orderOrigin.restaurantId &&
          session.locationId === orderOrigin.locationId &&
          session.originId === orderOrigin.originId &&
          session.menuId === menuId &&
          now - session.timestamp < ORDER_SESSION_TTL;

        return isValid;
      },
    }),
    {
      name: 'ob-order-store',
      partialize: (state) => ({
        // cart: state.cart,
        orderOrigin: state.orderOrigin,
        menuId: state.menuId,
      }),
    }
  )
);
