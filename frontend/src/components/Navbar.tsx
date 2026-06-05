import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Sun, Moon, User, LogOut, ShoppingBag, Heart, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cart';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cart, wishlist, setCartOpen, setWishlistOpen } = useCartStore();
  const navigate = useNavigate();

  // Compute total quantities dynamically
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;
  
  // Theme state: dark mode is default
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="logo">
          <ShoppingBag size={24} className="accent-color" />
          <span>E</span>-Shop
        </Link>

        {/* Action Buttons & Links */}
        <div className="nav-actions">
          {/* Shop Catalog Link */}
          <Link to="/shop" className="nav-link">
            Shop
          </Link>

          {/* Admin link for administrators */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link to="/admin" className="nav-link" style={{ color: 'var(--accent-color)', fontWeight: 600 }}>
              Admin
            </Link>
          )}

          {/* Light/Dark Theme Switcher */}
          <button 
            type="button" 
            className="icon-btn" 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Wishlist Icon Button with Notification Badge */}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setWishlistOpen(true)}
            title="Wishlist"
            aria-label="Wishlist"
            style={{ position: 'relative' }}
          >
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="nav-badge">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon Button with Notification Badge */}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setCartOpen(true)}
            title="Shopping Cart"
            aria-label="Shopping Cart"
            style={{ position: 'relative' }}
          >
            <ShoppingCart size={20} />
            {cartItemCount > 0 && (
              <span className="nav-badge">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Conditional authentication menu */}
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link 
                to="/profile" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontWeight: 500,
                  fontSize: '15px'
                }}
                className="icon-btn-text"
              >
                <User size={18} />
                <span>{user.name || 'Profile'}</span>
                {user.role === 'ADMIN' && (
                  <span style={{
                    fontSize: '10px',
                    background: 'var(--accent-color)',
                    color: '#0b0c10',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    marginLeft: '4px'
                  }}>
                    ADMIN
                  </span>
                )}
              </Link>
              
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleLogout}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
