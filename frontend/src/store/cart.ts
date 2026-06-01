import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './products';

// Interface representing an item inside the cart with selected quantity
export interface CartItem {
  product: Product;
  quantity: number;
}

// Interface representing the shape of Cart & Wishlist state and operations
interface CartState {
  cart: CartItem[];
  wishlist: Product[];
  isCartOpen: boolean;
  isWishlistOpen: boolean;

  // UI state control actions
  setCartOpen: (isOpen: boolean) => void;
  setWishlistOpen: (isOpen: boolean) => void;

  // Cart operations
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Wishlist operations
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      // Initial state
      cart: [],
      wishlist: [],
      isCartOpen: false,
      isWishlistOpen: false,

      // UI state control actions
      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      setWishlistOpen: (isOpen) => set({ isWishlistOpen: isOpen }),

      // Cart operations
      addToCart: (product, quantity = 1) =>
        set((state) => {
          // Check if item already exists in the cart
          const existingItemIndex = state.cart.findIndex(
            (item) => item.product.id === product.id
          );

          let updatedCart = [...state.cart];

          if (existingItemIndex > -1) {
            // Calculate new quantity and clamp it to the product's available stock
            const newQuantity = updatedCart[existingItemIndex].quantity + quantity;
            updatedCart[existingItemIndex] = {
              ...updatedCart[existingItemIndex],
              quantity: Math.min(newQuantity, product.stock),
            };
          } else {
            // Add new item clamped to available stock
            updatedCart.push({
              product,
              quantity: Math.min(quantity, product.stock),
            });
          }

          // Open the cart drawer automatically when an item is added
          return { cart: updatedCart, isCartOpen: true };
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          const updatedCart = state.cart.map((item) => {
            if (item.product.id === productId) {
              // Clamp quantity between 1 and the product's maximum available stock
              const clampedQuantity = Math.max(
                1,
                Math.min(quantity, item.product.stock)
              );
              return { ...item, quantity: clampedQuantity };
            }
            return item;
          });

          return { cart: updatedCart };
        }),

      clearCart: () => set({ cart: [] }),

      // Wishlist operations
      toggleWishlist: (product) =>
        set((state) => {
          const exists = state.wishlist.some((item) => item.id === product.id);
          let updatedWishlist;

          if (exists) {
            // Remove if already in wishlist
            updatedWishlist = state.wishlist.filter((item) => item.id !== product.id);
          } else {
            // Add if not in wishlist
            updatedWishlist = [...state.wishlist, product];
          }

          return { wishlist: updatedWishlist };
        }),

      removeFromWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== productId),
        })),
    }),
    {
      // Configuration for localStorage persistence
      name: 'ecom-cart-wishlist-storage',
      // Only persist the cart and wishlist arrays, ignore open/close UI states
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
      }),
    }
  )
);
