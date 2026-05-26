import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Sun, Moon, User, LogOut, ShoppingBag } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  
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
