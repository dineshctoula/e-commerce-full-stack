import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { ProtectedRoute } from './components/ProtectedRoute';

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

      {/* Main Pages Switcher */}
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Home/Roadmap Page */}
          <Route path="/" element={<Home />} />

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
        </Routes>
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
