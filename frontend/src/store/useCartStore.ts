import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuItem } from "../types/restaurant";

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface RestaurantBill {
  restaurantId: number;
  restaurantName: string;
  items: CartItem[];
}

interface CartState {
  bills: RestaurantBill[];

  // Actions
  addItem: (item: MenuItem, restaurantId: number, restaurantName: string) => void;
  removeItem: (restaurantId: number, itemId: number) => void;
  updateQuantity: (restaurantId: number, itemId: number, delta: number) => void;
  clearBill: (restaurantId: number) => void;
  clearCart: () => void;

  // Getters
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getBillTotal: (restaurantId: number) => number;
  getBillItems: (restaurantId: number) => CartItem[];

  // Compat (for components that still use flat access)
  /** @deprecated use bills instead */
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string | null;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      bills: [],

      // Flat compat getters (derived from bills)
      get items() { return get().bills.flatMap(b => b.items); },
      get restaurantId() { return get().bills[0]?.restaurantId ?? null; },
      get restaurantName() { return get().bills[0]?.restaurantName ?? null; },

      addItem: (item, restaurantId, restaurantName) => {
        const { bills } = get();
        const billIndex = bills.findIndex(b => b.restaurantId === restaurantId);

        if (billIndex >= 0) {
          // Bill exists: add item or bump quantity
          const bill = bills[billIndex];
          const existingItem = bill.items.find(i => i.id === item.id);

          if (existingItem) {
            const updatedItems = bill.items.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            );
            const updatedBills = [...bills];
            updatedBills[billIndex] = { ...bill, items: updatedItems };
            set({ bills: updatedBills });
          } else {
            const updatedBills = [...bills];
            updatedBills[billIndex] = { ...bill, items: [...bill.items, { ...item, quantity: 1 }] };
            set({ bills: updatedBills });
          }
        } else {
          // New restaurant bill
          set({
            bills: [...bills, {
              restaurantId,
              restaurantName,
              items: [{ ...item, quantity: 1 }],
            }],
          });
        }
      },

      removeItem: (restaurantId, itemId) => {
        const { bills } = get();
        const updatedBills = bills.map(b => {
          if (b.restaurantId !== restaurantId) return b;
          return { ...b, items: b.items.filter(i => i.id !== itemId) };
        }).filter(b => b.items.length > 0);
        set({ bills: updatedBills });
      },

      updateQuantity: (restaurantId, itemId, delta) => {
        const { bills } = get();
        const updatedBills = bills.map(b => {
          if (b.restaurantId !== restaurantId) return b;
          const updatedItems = b.items.map(i => {
            if (i.id !== itemId) return i;
            return { ...i, quantity: Math.max(0, i.quantity + delta) };
          }).filter(i => i.quantity > 0);
          return { ...b, items: updatedItems };
        }).filter(b => b.items.length > 0);
        set({ bills: updatedBills });
      },

      clearBill: (restaurantId) => {
        set({ bills: get().bills.filter(b => b.restaurantId !== restaurantId) });
      },

      clearCart: () => set({ bills: [] }),

      getTotalItems: () => get().bills.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0),
      getTotalPrice: () => get().bills.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.price * i.quantity, 0), 0),
      getBillTotal: (restaurantId) => {
        const bill = get().bills.find(b => b.restaurantId === restaurantId);
        return bill ? bill.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0;
      },
      getBillItems: (restaurantId) => {
        const bill = get().bills.find(b => b.restaurantId === restaurantId);
        return bill ? bill.items : [];
      },
    }),
    {
      name: "food-delivery-cart",
    }
  )
);
