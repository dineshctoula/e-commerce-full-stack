import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Sun, Moon, User, LogOut, ShoppingBag, Heart, ShoppingCart, Search } from 'lucide-react';
import { useCartStore } from '../store/cart';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cart, wishlist, setCartOpen, setWishlistOpen } = useCartStore();
  const navigate = useNavigate();

  // Compute total quantities dynamically
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;
  
  // Theme state: light mode is now default to capture the Daraz look
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'light'
  );

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <>
      {/* Top Utility Ribbon */}
      <div className="top-bar">
        <div className="container top-bar-container">
          <a href="#" className="top-bar-link">Become a Seller</a>
          <a href="#" className="top-bar-link">Hamro Pasal Affiliate Program</a>
          <a href="#" className="top-bar-link">Help & Support</a>
          <a href="#" className="top-bar-link">Track My Order</a>
        </div>
      </div>

      <nav className="navbar">
        <div className="container navbar-container">
          {/* Brand Logo - Daraz Style */}
          <Link to="/" className="logo" style={{ color: 'var(--accent-color)', fontWeight: 900 }}>
            <ShoppingBag size={26} fill="var(--accent-color)" style={{ color: '#ffffff' }} />
            <span>Hamro Pasal</span>
          </Link>

          {/* Center Search Input */}
          <form onSubmit={handleSearchSubmit} className="nav-search-form">
            <div className="nav-search-wrapper">
              <input
                type="text"
                placeholder="Search in Hamro Pasal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="nav-search-input"
              />
              <button type="submit" className="nav-search-btn" aria-label="Search">
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Action Buttons & Links */}
          <div className="nav-actions">
            {/* Shop Catalog Link */}
            <Link to="/shop" className="nav-link" style={{ fontWeight: 700 }}>
              Catalog
            </Link>

            {/* Admin link for administrators */}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <Link to="/admin" className="nav-link" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link 
                  to="/profile" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--text-primary)'
                  }}
                >
                  <User size={16} />
                  <span>{user.name?.split(' ')[0] || 'Profile'}</span>
                  {user.role === 'ADMIN' && (
                    <span style={{
                      fontSize: '9px',
                      background: 'var(--accent-color)',
                      color: '#ffffff',
                      padding: '2px 4px',
                      borderRadius: '3px',
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
                  style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '4px' }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '4px' }}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '4px' }}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};
