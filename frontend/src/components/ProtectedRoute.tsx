import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

interface RouteProps {
  children: React.ReactNode;
}

// Global Loading Spinner Component for smooth transitions
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

// Route wrapper that restricts access to authenticated users only
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

// Route wrapper that restricts access to administrator accounts only
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
