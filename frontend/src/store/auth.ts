import { create } from 'zustand';

// Define the shape of User details
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string; // 'USER' | 'ADMIN'
}

/**
 * Zustand authentication store state and actions interface.
 */
interface AuthState {
  /** The currently authenticated user object, or null if guest. */
  user: User | null;
  /** True if the user is verified and authenticated. */
  isAuthenticated: boolean;
  /** True if an authentication API request is currently running. */
  loading: boolean;
  /** Contains the latest authentication-related error message, if any. */
  error: string | null;
  
  /**
   * Authenticates user details against the login endpoint.
   *
   * @param email - User's email.
   * @param password - User's password.
   * @returns Promise resolving to true if login was successful, false otherwise.
   */
  login: (email: string, password: string) => Promise<boolean>;
  /**
   * Registers a new account.
   *
   * @param name - Display name of the user.
   * @param email - Registration email.
   * @param password - Account password.
   * @returns Promise resolving to true if registration was successful, false otherwise.
   */
  register: (name: string, email: string, password: string) => Promise<boolean>;
  /**
   * Logs out the user by clearing credentials.
   */
  logout: () => Promise<void>;
  /**
   * Restores user session from cookie on app initialization.
   */
  checkAuth: () => Promise<void>;
  /**
   * Resets the authentication error state.
   */
  clearError: () => void;
  /**
   * Updates the user's name and/or email profile information.
   */
  updateProfile: (name?: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  /**
   * Securely changes the user's password.
   */
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const API_BASE = 'http://localhost:3000';

/**
 * Zustand hook storing authentication states and core auth routines.
 * Coordinates credentials synchronization with HttpOnly cookie transport.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

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

  // UPDATE PROFILE: Updates user name and/or email
  updateProfile: async (name, email) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = Array.isArray(data.message) 
          ? data.message.join(', ') 
          : (data.message || 'Profile update failed.');
        throw new Error(errMsg);
      }

      set({ user: data, error: null });
      return { success: true };
    } catch (err: any) {
      const errMsg = err.message || 'Something went wrong.';
      set({ error: errMsg });
      return { success: false, error: errMsg };
    } finally {
      set({ loading: false });
    }
  },

  // CHANGE PASSWORD: Changes password securely
  changePassword: async (currentPassword, newPassword) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = Array.isArray(data.message) 
          ? data.message.join(', ') 
          : (data.message || 'Password change failed.');
        throw new Error(errMsg);
      }

      set({ error: null });
      return { success: true };
    } catch (err: any) {
      const errMsg = err.message || 'Something went wrong.';
      set({ error: errMsg });
      return { success: false, error: errMsg };
    } finally {
      set({ loading: false });
    }
  },
}));
