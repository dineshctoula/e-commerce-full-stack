import { create } from 'zustand';

// Define the shape of User details
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string; // 'USER' | 'ADMIN'
}

// Define the authentication store state & actions
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const API_BASE = 'http://localhost:3000';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // Clears any current auth-related error message
  clearError: () => set({ error: null }),

  // RESTORE SESSION: Check if the user is already logged in on application mount
  checkAuth: async () => {
    set({ loading: true, error: null });
    try {
      // Must include credentials so cookies are sent with the request
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          set({ user: data.user, isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      } else {
        // Not authenticated, clean up state
        set({ user: null, isAuthenticated: false });
      }
    } catch {
      // Backend is offline or network error, fail silently without throwing error to UI
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },

  // SIGN IN: Authenticate with email & password
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Receive and store the HTTP-only cookie
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Please check credentials.');
      }

      set({ user: data.user, isAuthenticated: true, error: null });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Something went wrong.' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // SIGN UP: Register a new user account
  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        // If there's a detailed message (e.g. array from validation pipe)
        const errMsg = Array.isArray(data.message) 
          ? data.message.join(', ') 
          : (data.message || 'Registration failed.');
        throw new Error(errMsg);
      }

      set({ user: data.user, isAuthenticated: true, error: null });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Something went wrong.' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // SIGN OUT: Invalidate refresh token and clear cookies
  logout: async () => {
    set({ loading: true });
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    } catch {
      // Fail silently if backend logout endpoint fails, still clear local store state
    } finally {
      set({ user: null, isAuthenticated: false, error: null, loading: false });
    }
  },
}));
