import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { Navbar } from './components/Navbar';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { CartDrawer } from './components/CartDrawer';
import { WishlistModal } from './components/WishlistModal';

// Lazy load pages to optimize initial bundle sizes and performance
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const Catalog = lazy(() => import('./pages/Catalog').then((m) => ({ default: m.Catalog })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then((m) => ({ default: m.ProductDetail })));
const Checkout = lazy(() => import('./pages/Checkout').then((m) => ({ default: m.Checkout })));

/**
 * Root Application Component.
 * Initializes authentication checks on mount, builds routes to public and guarded pages,
 * and renders global overlays like the Cart drawer and Wishlist modal.
 */
function App() {
  const { checkAuth } = useAuthStore();

  // Validate authentication session on application load
  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      {/* Header Navigation Panel */}
      <Navbar />

      {/* Global Overlays: Cart & Wishlist */}
      <CartDrawer />
      <WishlistModal />

      {/* Main Pages Switcher */}
      <main style={{ flex: 1 }}>
        <Suspense fallback={
          <div className="loading-container glass" style={{ margin: '80px auto', maxWidth: '300px', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Loading section...</p>
          </div>
        }>
          <Routes>
            {/* Public Home/Roadmap Page */}
            <Route path="/" element={<Home />} />

            {/* Product Catalog & Details */}
            <Route path="/shop" element={<Catalog />} />
            <Route path="/products/:id" element={<ProductDetail />} />

            {/* Authentication Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Profile Dashboard */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Protected Checkout Page */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Control Center */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>

      {/* Application Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} E-Shop Monorepo. Built for premium scalability.</p>
        </div>
      </footer>
    </Router>
  );
}

export default App;
