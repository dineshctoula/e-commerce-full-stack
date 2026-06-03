import { create } from 'zustand';
import type { Product } from './products';

// Interface representing an item inside an order
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

// Interface representing the Order details
export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingPhone: string;
  shippingEmail: string;
  shippingLocalAddress: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

// Interface for Zustand Order Store State
interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchOrders: () => Promise<void>;
  createOrder: (
    items: { productId: string; quantity: number }[],
    shippingDetails: {
      shippingAddress: string;
      shippingCity: string;
      shippingPostalCode: string;
      shippingCountry: string;
      shippingPhone: string;
      shippingEmail: string;
      shippingLocalAddress: string;
    }
  ) => Promise<Order | null>;
  clearError: () => void;
}

const API_BASE = 'http://localhost:3000';

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  loading: false,
  error: null,

  // Helper action to clear error state
  clearError: () => set({ error: null }),

  // Actions: Fetch past orders list for the authenticated user
  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch orders history.');
      }

      const data = await res.json();
      set({ orders: data, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error occurred while loading orders.' });
    } finally {
      set({ loading: false });
    }
  },

  // Actions: Place a new order
  createOrder: async (items, shippingDetails) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          ...shippingDetails,
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        // If NestJS returns a validation error array
        const errMsg = Array.isArray(data.message)
          ? data.message.join(', ')
          : (data.message || 'Failed to place order.');
        throw new Error(errMsg);
      }

      // Prepend the new order to the local list
      set((state) => ({
        orders: [data, ...state.orders],
        error: null,
      }));

      return data;
    } catch (err: any) {
      set({ error: err.message || 'Something went wrong.' });
      return null;
    } finally {
      set({ loading: false });
    }
  },
}));
