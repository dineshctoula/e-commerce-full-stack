import { create } from 'zustand';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CouponState {
  coupons: Coupon[];
  loading: boolean;
  error: string | null;
  
  appliedCoupon: Coupon | null;
  isValidating: boolean;
  validationError: string | null;

  fetchCoupons: () => Promise<void>;
  createCoupon: (dto: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  deleteCoupon: (id: string) => Promise<boolean>;
  validateCoupon: (code: string, cartTotal: number) => Promise<boolean>;
  clearAppliedCoupon: () => void;
}

const API_BASE = 'http://localhost:3000';

export const useCouponStore = create<CouponState>((set) => ({
  coupons: [],
  loading: false,
  error: null,
  
  appliedCoupon: null,
  isValidating: false,
  validationError: null,

  fetchCoupons: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/coupons`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch coupons');
      }
      set({ coupons: data, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error fetching coupons' });
    } finally {
      set({ loading: false });
    }
  },

  createCoupon: async (dto) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create coupon');
      }
      set((state) => ({
        coupons: [data, ...state.coupons],
        error: null,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Error creating coupon' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteCoupon: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/coupons/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete coupon');
      }
      set((state) => ({
        coupons: state.coupons.filter((c) => c.id !== id),
        error: null,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Error deleting coupon' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  validateCoupon: async (code, cartTotal) => {
    set({ isValidating: true, validationError: null });
    try {
      const res = await fetch(
        `${API_BASE}/coupons/validate/${encodeURIComponent(code)}?cartTotal=${cartTotal}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid coupon code');
      }
      set({ appliedCoupon: data, validationError: null });
      return true;
    } catch (err: any) {
      set({ appliedCoupon: null, validationError: err.message || 'Failed to validate coupon' });
      return false;
    } finally {
      set({ isValidating: false });
    }
  },

  clearAppliedCoupon: () => {
    set({ appliedCoupon: null, validationError: null });
  },
}));
