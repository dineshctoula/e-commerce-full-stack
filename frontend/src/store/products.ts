import { create } from 'zustand';

// Interface representing a single Product entity from the backend database
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

// Interface for query parameter filters
export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: number;
  limit?: number;
}

// Interface representing the Product state & operations
interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;

  // Actions
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  clearCurrentProduct: () => void;
}

const API_BASE = 'http://localhost:3000';

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  currentProduct: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  loading: false,
  error: null,

  // Helper action to reset the currently viewed single product
  clearCurrentProduct: () => set({ currentProduct: null }),

  // Actions: Fetch list of products with optional filtering parameters
  fetchProducts: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      // Build search query parameters dynamically
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      
      // Page and limit defaults
      const pageVal = filters.page || 1;
      const limitVal = filters.limit || 8; // Display 8 per page on UI
      
      queryParams.append('page', pageVal.toString());
      queryParams.append('limit', limitVal.toString());

      const res = await fetch(`${API_BASE}/products?${queryParams.toString()}`);
      
      if (!res.ok) {
        throw new Error('Failed to retrieve products catalog.');
      }
      
      const data = await res.json();
      
      set({
        products: data.products,
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
        error: null,
      });
    } catch (err: any) {
      set({ error: err.message || 'Error occurred while loading products.' });
    } finally {
      set({ loading: false });
    }
  },

  // Actions: Retrieve details of a specific product ID
  fetchProductById: async (id: string) => {
    set({ loading: true, error: null, currentProduct: null });
    try {
      const res = await fetch(`${API_BASE}/products/${id}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Product not found.');
        }
        throw new Error('Failed to load product details.');
      }
      
      const productData = await res.json();
      set({ currentProduct: productData, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error loading product details.' });
    } finally {
      set({ loading: false });
    }
  },
}));
