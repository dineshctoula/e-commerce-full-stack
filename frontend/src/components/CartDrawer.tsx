import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cart';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCartStore();
  const navigate = useNavigate();

  // If the cart drawer is closed, do not render anything
  if (!isCartOpen) return null;

  // Compute total quantities and prices
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  // Estimate tax at 10%
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  return (
    <div className="drawer-overlay" onClick={() => setCartOpen(false)}>
      <div 
        className="drawer-content glass" 
        onClick={(e) => e.stopPropagation()} // Prevent drawer closing when clicking inside the panel
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} className="accent-color" />
            <h2 className="drawer-title">Shopping Cart</h2>
          </div>
          <button 
            type="button" 
            className="icon-btn" 
            onClick={() => setCartOpen(false)}
            aria-label="Close Cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty-state">
              <p>Your shopping cart is empty.</p>
            </div>
          ) : (
            <div className="cart-list">
              {cart.map((item) => (
                <div key={item.product.id} className="cart-item">
                  {/* Item Image */}
                  <img 
                    src={item.product.image || 'https://via.placeholder.com/150'} 
                    alt={item.product.title} 
                    className="cart-item-img"
                  />

                  {/* Item Info */}
                  <div className="cart-item-info">
                    <span className="cart-item-category">{item.product.category}</span>
                    <h3 className="cart-item-title">{item.product.title}</h3>
                    <p className="cart-item-price">${item.product.price.toFixed(2)}</p>
                    
                    {/* Quantity Controls */}
                    <div className="quantity-adjuster">
                      <button
                        type="button"
                        className="quantity-adjuster-btn"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="quantity-adjuster-btn"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Item Actions & Subtotal */}
                  <div className="cart-item-actions">
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      className="icon-btn danger-hover"
                      onClick={() => removeFromCart(item.product.id)}
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="drawer-footer glass">
            {/* Price Calculations */}
            <div className="price-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="price-row">
              <span>Estimated Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="price-row total">
              <span>Total</span>
              <span className="accent-color">${grandTotal.toFixed(2)}</span>
            </div>

            {/* CTA Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
                onClick={() => {
                  setCartOpen(false);
                  navigate('/checkout');
                }}
              >
                Proceed to Checkout
              </button>
              
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
                onClick={clearCart}
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
