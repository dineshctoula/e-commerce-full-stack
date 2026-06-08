import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

interface RouteProps {
  children: React.ReactNode;
}

/**
 * LoadingScreen Component.
 * Renders a full-sized stylized progress spinner and loading text to prevent
 * flash-of-unauthenticated-content (FOUC) while restoring credentials from cookie storage.
 */
export const LoadingScreen: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px'
    }}>
      <div className="status-indicator loading" style={{ width: '40px', height: '40px' }} />
      <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
        Verifying security session...
      </p>
    </div>
  );
};

/**
 * ProtectedRoute Wrapper.
 * Restricts access to children components to authenticated users.
 * Redirects guests to the `/login` route, passing the requested page location in state for redirect-back on success.
 */
export const ProtectedRoute: React.FC<RouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login page and store the original location for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/**
 * AdminRoute Wrapper.
 * Restricts access to administrator accounts only (role === 'ADMIN').
 * Redirects guests to `/login` and authenticated non-admin users to the root homepage (`/`).
 */
export const AdminRoute: React.FC<RouteProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    // Non-admin trying to access admin page: redirect to home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
