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

/**
 * Orders store state and actions interface.
 */
interface OrderState {
  /** Array of order histories retrieved from backend. */
  orders: Order[];
  /** True if order-specific API operations are in progress. */
  loading: boolean;
  /** Admin statistics dataset containing sales totals, breakdowns, charts data. */
  adminStats: any | null;
  /** True if stats query is running. */
  statsLoading: boolean;
  /** Server statistics fetching error context text. */
  statsError: string | null;

  /**
   * Queries customer order history list.
   */
  fetchOrders: () => Promise<void>;
  /**
   * Places a pending order.
   *
   * @param items - Cart products list.
   * @param shippingDetails - Delivery destination properties.
   * @returns Resolves to the created Order entity or null on errors.
   */
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
  /**
   * Clears active store error flags.
   */
  clearError: () => void;
  /**
   * Invokes `/payments/create-intent` to register checkout intent with Stripe on backend.
   *
   * @param orderId - UUID of the target pending order.
   * @returns Promise resolving to intent data or null.
   */
  createPaymentIntent: (orderId: string) => Promise<{ clientSecret: string; paymentIntentId: string } | null>;
  /**
   * Confirms payment completion status on backend.
   *
   * @param orderId - UUID of order.
   * @param paymentIntentId - Completed Stripe PaymentIntent ID.
   * @returns True on successful confirmation; false otherwise.
   */
  confirmPayment: (orderId: string, paymentIntentId: string) => Promise<boolean>;
  /**
   * Admin-only statistics analytics retrieval.
   */
  fetchAdminStats: () => Promise<void>;
  /**
   * Admin-only order status transition modifier.
   *
   * @param orderId - Target order UUID.
   * @param status - Predefined status term.
   */
  updateOrderStatus: (orderId: string, status: string) => Promise<boolean>;
  /**
   * Cancels a customer order.
   *
   * @param orderId - UUID of the target order to cancel.
   */
  cancelOrder: (orderId: string) => Promise<boolean>;
}

const API_BASE = 'http://localhost:3000';

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  loading: false,
  error: null,
  adminStats: null,
  statsLoading: false,
  statsError: null,

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

  createPaymentIntent: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create payment intent.');
      }
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Payment setup failed.' });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  confirmPayment: async (orderId, paymentIntentId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentIntentId }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Payment confirmation failed.');
      }
      set((state) => ({
        orders: state.orders.map((o) => o.id === orderId ? { ...o, status: 'PROCESSING' } : o),
        error: null,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to confirm payment on backend.' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  fetchAdminStats: async () => {
    set({ statsLoading: true, statsError: null });
    try {
      const res = await fetch(`${API_BASE}/orders/admin/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch admin statistics.');
      }
      set({ adminStats: data, statsError: null });
    } catch (err: any) {
      set({ statsError: err.message || 'Error occurred while loading statistics.' });
    } finally {
      set({ statsLoading: false });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update order status.');
      }
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? data : o)),
        error: null,
      }));
      set((state) => {
        if (!state.adminStats) return {};
        const updatedRecent = state.adminStats.recentOrders.map((o: any) =>
          o.id === orderId ? { ...o, status: data.status } : o
        );
        return {
          adminStats: {
            ...state.adminStats,
            recentOrders: updatedRecent,
          },
        };
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Error updating order status.' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  cancelOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to cancel order.');
      }
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? data : o)),
        error: null,
      }));
      set((state) => {
        if (!state.adminStats) return {};
        const updatedRecent = state.adminStats.recentOrders.map((o: any) =>
          o.id === orderId ? { ...o, status: 'CANCELLED' } : o
        );
        return {
          adminStats: {
            ...state.adminStats,
            recentOrders: updatedRecent,
          },
        };
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Error cancelling order.' });
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
