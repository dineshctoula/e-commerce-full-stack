import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from './products';

// Interface representing an item inside the cart with selected quantity
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Cart and Wishlist store state and operations interface.
 */
interface CartState {
  /** Array of active cart items with their associated quantities. */
  cart: CartItem[];
  /** Array of products added to the user's wishlist. */
  wishlist: Product[];
  /** True if the side cart drawer is currently expanded. */
  isCartOpen: boolean;
  /** True if the wishlist modal panel is visible. */
  isWishlistOpen: boolean;

  /**
   * Toggles the side cart drawer visibility.
   *
   * @param isOpen - Target visibility state.
   */
  setCartOpen: (isOpen: boolean) => void;
  /**
   * Toggles the wishlist modal popup visibility.
   *
   * @param isOpen - Target visibility state.
   */
  setWishlistOpen: (isOpen: boolean) => void;

  /**
   * Adds an item to the shopping cart, clamping to stock.
   *
   * @param product - Target Product structure.
   * @param quantity - Desired count (defaults to 1).
   */
  addToCart: (product: Product, quantity?: number) => void;
  /**
   * Removes a product from the shopping cart.
   *
   * @param productId - Target UUID.
   */
  removeFromCart: (productId: string) => void;
  /**
   * Adjusts the purchase quantity of a cart item.
   *
   * @param productId - Target product UUID.
   * @param quantity - Adjusted count.
   */
  updateQuantity: (productId: string, quantity: number) => void;
  /**
   * Empties all items from the shopping cart.
   */
  clearCart: () => void;

  /**
   * Adds or removes a product from the wishlist array.
   *
   * @param product - Target Product record.
   */
  toggleWishlist: (product: Product) => void;
  /**
   * Explicitly removes a product from the wishlist.
   *
   * @param productId - Target product UUID.
   */
  removeFromWishlist: (productId: string) => void;
}

/**
 * Zustand hook storing shopping cart and wishlist state structures.
 * Hooks into LocalStorage middleware to persist checkout sessions across browser reloads.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      isCartOpen: false,
      isWishlistOpen: false,

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
