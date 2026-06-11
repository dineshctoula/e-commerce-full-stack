import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/products';
import { ArrowLeft, Info, Heart, ShoppingCart, Star, Trash2 } from 'lucide-react';
import { useCartStore } from '../store/cart';
import { useAuthStore } from '../store/auth';
import { useOrderStore } from '../store/orders';
import { useReviewStore } from '../store/reviews';

/**
 * ProductDetail Page Component.
 * Fetches and displays detail specifications (high-resolution image, title, price, descriptions, stock count badge) of a single product.
 * Provides controls for incrementing/decrementing purchase quantities, adding items to the persistent shopping cart,
 * and toggling wishlist status.
 */
export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Retrieve states and actions from stores
  const { currentProduct, loading, error, fetchProductById, clearCurrentProduct } = useProductStore();
  const { addToCart, wishlist, toggleWishlist } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { orders, fetchOrders } = useOrderStore();
  const {
    submitReview,
    deleteReview,
    loading: reviewSubmitLoading,
    error: reviewError,
    canReview,
    eligibilityReason,
    eligibilityLoading,
    checkEligibility,
  } = useReviewStore();

  // Local state for quantity selector
  const [quantity, setQuantity] = useState(1);

  // Local state for review form
  const [formRating, setFormRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formComment, setFormComment] = useState('');

  // Check if current product is wishlisted
  const isWishlisted = currentProduct
    ? wishlist.some((item) => item.id === currentProduct.id)
    : false;

  // Handle wishlist toggle click
  const handleToggleWishlist = () => {
    if (currentProduct) {
      toggleWishlist(currentProduct);
    }
  };

  // Handle add to cart click
  const handleAddToCart = () => {
    if (currentProduct) {
      addToCart(currentProduct, quantity);
    }
  };

  // Handle review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id && formRating > 0 && formComment.trim()) {
      const success = await submitReview(id, formRating, formComment.trim());
      if (success) {
        setFormRating(0);
        setFormComment('');
        // Re-check eligibility since we just submitted a review
        void checkEligibility(id);
      }
    }
  };

  // Handle review deletion
  const handleReviewDelete = async (reviewId: string) => {
    if (id && window.confirm('Are you sure you want to delete this review?')) {
      await deleteReview(id, reviewId);
    }
  };

  // Fetch product data on mount and clean up on unmount
  useEffect(() => {
    if (id) {
      void fetchProductById(id);
      if (isAuthenticated) {
        void checkEligibility(id);
      }
    }
    if (isAuthenticated) {
      void fetchOrders();
    }

    // Reset state when leaving this page to prevent brief flash of old details next time
    return () => {
      clearCurrentProduct();
    };
  }, [id, isAuthenticated, fetchProductById, fetchOrders, checkEligibility, clearCurrentProduct]);

  const handleBackToShop = () => {
    navigate('/shop');
  };

  return (
    <div className="container main-content detail-container">
      {/* Back Button */}
      <button
        type="button"
        onClick={handleBackToShop}
        className="btn btn-secondary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}
      >
        <ArrowLeft size={16} />
        <span>Back to Shop</span>
      </button>

      {/* Loading State */}
      {loading && (
        <div className="loading-container glass">
          <div className="spinner" />
          <p>Fetching product details...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-alert">
          <Info size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Product Details Display */}
      {currentProduct && !loading && !error && (
        <>
          <div className="detail-card glass">
            <div className="detail-grid">

              {/* Left Column: Product Image */}
              <div className="detail-image-wrapper">
                <img
                  src={currentProduct.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600'}
                  alt={currentProduct.title}
                  className="detail-image"
                />
              </div>

              {/* Right Column: Information & Actions */}
              <div className="detail-info">

                {/* Category */}
                <div className="detail-category">{currentProduct.category}</div>

                {/* Title */}
                <h1 className="detail-title">{currentProduct.title}</h1>

                {/* Price */}
                <div className="detail-price">${currentProduct.price.toFixed(2)}</div>

                {/* Description */}
                <p className="detail-desc">{currentProduct.description}</p>

                {/* Stock Status Badge */}
                <div className="detail-meta">
                  <span className="form-label" style={{ margin: 0, color: 'var(--text-secondary)' }}>Status:</span>
                  {currentProduct.stock > 0 ? (
                    <span className="stock-badge in-stock">
                      In Stock ({currentProduct.stock} available)
                    </span>
                  ) : (
                    <span className="stock-badge out-of-stock">Out of Stock</span>
                  )}
                </div>

                {/* Quantity Selector and Action Buttons */}
                {currentProduct.stock > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <span className="form-label" style={{ margin: 0, color: 'var(--text-secondary)' }}>Quantity:</span>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 0 }}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 600, fontSize: '15px' }}>
                        {quantity}
                      </span>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setQuantity((prev) => Math.min(currentProduct.stock, prev + 1))}
                        style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 0 }}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    disabled={currentProduct.stock <= 0}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart size={18} />
                    <span>Add to Shopping Cart</span>
                  </button>

                  <button
                    type="button"
                    className={`btn ${isWishlisted ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderColor: isWishlisted ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'
                    }}
                    onClick={handleToggleWishlist}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    aria-label="Toggle Wishlist"
                  >
                    <Heart
                      size={18}
                      fill={isWishlisted ? 'var(--accent-color)' : 'none'}
                      color={isWishlisted ? 'var(--accent-color)' : 'currentColor'}
                    />
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* Reviews Section */}
          <div className="reviews-section glass" style={{ marginTop: '40px', padding: '32px', borderRadius: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>
              Ratings & Customer Reviews
            </h2>

            <div className="reviews-grid">
              {/* Left Column: Rating breakdown stats */}
              <div className="reviews-breakdown">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    {currentProduct.averageRating || 0}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>/ 5.0</span>
                </div>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= Math.round(currentProduct.averageRating || 0);
                    return (
                      <Star
                        key={star}
                        size={20}
                        fill={isFilled ? '#fbbf24' : 'none'}
                        color={isFilled ? '#fbbf24' : 'var(--text-secondary)'}
                      />
                    );
                  })}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  Based on {currentProduct.reviewsCount || 0} customer reviews
                </p>

                {/* Star Progress Gauges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = (currentProduct.reviews || []).filter((r) => r.rating === stars).length;
                    const percent = currentProduct.reviewsCount ? Math.round((count / currentProduct.reviewsCount) * 100) : 0;
                    return (
                      <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '48px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                          {stars} stars
                        </span>
                        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: 'var(--accent-color)',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                        <span style={{ width: '36px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {percent}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Write a Review Form */}
              <div className="reviews-form-wrapper">
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                  Write a Review
                </h3>

                {!isAuthenticated ? (
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                      Please log in to submit a review.
                    </p>
                  </div>
                ) : eligibilityLoading ? (
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                      Checking review eligibility...
                    </p>
                  </div>
                ) : !canReview ? (
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                      {eligibilityReason === 'ALREADY_REVIEWED'
                        ? 'You have already submitted a review for this product. Thank you for your feedback!'
                        : 'Only verified purchasers of this product can write a review. If you bought this, please complete checkout first.'}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Star Rating Picker */}
                    <div>
                      <label className="form-label" style={{ marginBottom: '8px' }}>Your Rating</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isHighlighted = star <= hoverRating || star <= formRating;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFormRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                              aria-label={`Rate ${star} stars`}
                            >
                              <Star
                                size={28}
                                fill={isHighlighted ? '#fbbf24' : 'none'}
                                color={isHighlighted ? '#fbbf24' : 'var(--text-secondary)'}
                                style={{ transition: 'transform 0.1s ease' }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comment Area */}
                    <div>
                      <label className="form-label" htmlFor="review-comment">Review Description</label>
                      <textarea
                        id="review-comment"
                        className="form-input"
                        placeholder="Share your experience with this product..."
                        rows={4}
                        value={formComment}
                        onChange={(e) => setFormComment(e.target.value)}
                        required
                        maxLength={500}
                        style={{ resize: 'none' }}
                      />
                    </div>

                    {reviewError && (
                      <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>
                        {reviewError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={reviewSubmitLoading || formRating === 0}
                      style={{ padding: '12px' }}
                    >
                      {reviewSubmitLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Bottom Section: Customer Reviews Listing */}
            <div style={{ marginTop: '40px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
                Customer Feedback
              </h3>

              {(!currentProduct.reviews || currentProduct.reviews.length === 0) ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
                  No reviews yet. Be the first to review this product!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {currentProduct.reviews.map((review) => (
                    <div key={review.id} className="review-card glass" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>
                            {review.user?.name || review.user?.email.split('@')[0]}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginLeft: '12px' }}>
                            {new Date(review.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Author/Admin Delete Button */}
                        {(user?.role === 'ADMIN' || review.userId === user?.id) && (
                          <button
                            type="button"
                            className="delete-review-btn"
                            onClick={() => handleReviewDelete(review.id)}
                            title="Delete Review"
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Stars */}
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= review.rating;
                          return (
                            <Star
                              key={star}
                              size={14}
                              fill={isFilled ? '#fbbf24' : 'none'}
                              color={isFilled ? '#fbbf24' : 'var(--text-secondary)'}
                            />
                          );
                        })}
                      </div>

                      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductDetail;
