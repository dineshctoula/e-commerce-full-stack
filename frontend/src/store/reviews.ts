import { create } from 'zustand';
import { useProductStore } from './products';

interface ReviewState {
  /** True if review operations are running. */
  loading: boolean;
  /** Contains server-returned error text, if any. */
  error: string | null;

  /**
   * Submits a rating and comment for a product.
   * On success, dynamically computes and updates the product's ratings stats in `useProductStore`.
   *
   * @param productId - Target product UUID.
   * @param rating - Star count (1-5).
   * @param comment - Review comment string.
   * @returns Promise resolving to true on success, false on error.
   */
  submitReview: (productId: string, rating: number, comment: string) => Promise<boolean>;
  /**
   * Deletes a review.
   * On success, dynamically adjusts the product's reviews array and average rating inside `useProductStore`.
   *
   * @param productId - Parent product UUID.
   * @param reviewId - Target review UUID to remove.
   * @returns Promise resolving to true on success, false on error.
   */
  deleteReview: (productId: string, reviewId: string) => Promise<boolean>;
}

const API_BASE = 'http://localhost:3000';

/**
 * Zustand store handling review submissions and authorization deletions.
 */
export const useReviewStore = create<ReviewState>((set) => ({
  loading: false,
  error: null,

  submitReview: async (productId, rating, comment) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit review.');
      }

      // Inject the newly created review into useProductStore dynamically
      const productStore = useProductStore.getState();
      if (productStore.currentProduct && productStore.currentProduct.id === productId) {
        const updatedReviews = [data, ...(productStore.currentProduct.reviews || [])];
        const reviewsCount = updatedReviews.length;
        const averageRating = Number(
          (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
        );

        const updatedProduct = {
          ...productStore.currentProduct,
          reviews: updatedReviews,
          reviewsCount,
          averageRating,
        };

        useProductStore.setState({ currentProduct: updatedProduct });
      }

      set({ error: null });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Error occurred while submitting review.' });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  deleteReview: async (productId, reviewId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete review.');
      }

      // Remove the deleted review from useProductStore dynamically
      const productStore = useProductStore.getState();
      if (productStore.currentProduct && productStore.currentProduct.id === productId) {
        const updatedReviews = (productStore.currentProduct.reviews || []).filter(
          (r) => r.id !== reviewId
        );
        const reviewsCount = updatedReviews.length;
        const averageRating =
          reviewsCount > 0
            ? Number(
                (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
              )
            : 0;

        const updatedProduct = {
          ...productStore.currentProduct,
          reviews: updatedReviews,
          reviewsCount,
          averageRating,
        };

        useProductStore.setState({ currentProduct: updatedProduct });
      }

      set({ error: null });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Error occurred while deleting review.' });
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
