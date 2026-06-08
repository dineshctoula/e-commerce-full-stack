import React from 'react';
import { useCartStore } from '../store/cart';
import { X, Trash2, ShoppingCart } from 'lucide-react';

/**
 * WishlistModal Component.
 * Overlay popup modal displaying the user's bookmarked product catalog items.
 * Allows direct add-to-cart migration for in-stock items, and removal triggers.
 */
export const WishlistModal: React.FC = () => {
  const {
    wishlist,
    isWishlistOpen,
    setWishlistOpen,
    removeFromWishlist,
    addToCart,
  } = useCartStore();

  // If the wishlist modal is not set to open, render nothing
  if (!isWishlistOpen) return null;

  // Handle adding a wishlisted item to the cart
  const handleAddToCart = (item: any) => {
    addToCart(item);
    // Optionally remove from wishlist when adding to cart
    removeFromWishlist(item.id);
  };

  return (
    <div className="modal-overlay" onClick={() => setWishlistOpen(false)}>
      <div 
        className="modal-content glass" 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">My Wishlist</h2>
          <button 
            type="button" 
            className="icon-btn" 
            onClick={() => setWishlistOpen(false)}
            aria-label="Close Wishlist"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {wishlist.length === 0 ? (
            <div className="empty-state">
              <p>Your wishlist is currently empty.</p>
            </div>
          ) : (
            <div className="wishlist-list">
              {wishlist.map((product) => (
                <div key={product.id} className="wishlist-item">
                  {/* Product Image */}
                  <img 
                    src={product.image || 'https://via.placeholder.com/150'} 
                    alt={product.title} 
                    className="wishlist-item-img"
                  />

                  {/* Product Info */}
                  <div className="wishlist-item-info">
                    <span className="wishlist-item-category">{product.category}</span>
                    <h3 className="wishlist-item-title">{product.title}</h3>
                    <p className="wishlist-item-price">${product.price.toFixed(2)}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="wishlist-item-actions">
                    {/* Add to Cart button */}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      title={product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    >
                      <ShoppingCart size={14} />
                      <span>{product.stock === 0 ? 'Out of Stock' : 'Add'}</span>
                    </button>

                    {/* Remove from Wishlist button */}
                    <button
                      type="button"
                      className="icon-btn danger-hover"
                      onClick={() => removeFromWishlist(product.id)}
                      title="Remove from Wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistModal;
