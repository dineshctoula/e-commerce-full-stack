import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/products';
import { ArrowLeft, Info, Heart, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cart';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Retrieve states and actions from the Zustand products store
  const { currentProduct, loading, error, fetchProductById, clearCurrentProduct } = useProductStore();
  const { addToCart, wishlist, toggleWishlist } = useCartStore();

  // Local state for quantity selector
  const [quantity, setQuantity] = useState(1);

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

  // Fetch product data on mount and clean up on unmount
  useEffect(() => {
    if (id) {
      void fetchProductById(id);
    }
    
    // Reset state when leaving this page to prevent brief flash of old details next time
    return () => {
      clearCurrentProduct();
    };
  }, [id, fetchProductById, clearCurrentProduct]);

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
      )}
    </div>
  );
};

export default ProductDetail;
