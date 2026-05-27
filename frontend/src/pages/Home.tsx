import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { Sparkles, CheckCircle, Play, Lock } from 'lucide-react';

interface RoadmapItem {
  day: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'locked';
}

export const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [backendStatus, setBackendStatus] = useState<'ok' | 'loading' | 'error'>('loading');

  // Verify backend connectivity on load
  useEffect(() => {
    fetch('http://localhost:3000/auth/me', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401 || res.ok) {
          setBackendStatus('ok');
        } else {
          setBackendStatus('error');
        }
      })
      .catch(() => {
        setBackendStatus('error');
      });
  }, []);

  const roadmap: RoadmapItem[] = [
    { day: 1, title: 'Setup & Architecture', description: 'Monorepo project setup, SQLite with Prisma, and unit/e2e test setup.', status: 'completed' },
    { day: 2, title: 'Auth & User Management (Backend)', description: 'Passport JWT strategy, token rotation, and HttpOnly cookies.', status: 'completed' },
    { day: 3, title: 'Auth & User Management (Frontend)', description: 'Zustand session state, login/register views, and route guards.', status: 'completed' },
    { day: 4, title: 'Product Catalog API', description: 'Database schema design and CRUD controller endpoints.', status: 'completed' },
    { day: 5, title: 'Product Catalog UI', description: 'Dynamic listing, filters, search, and detail view pages.', status: 'in-progress' },
    { day: 6, title: 'Cart & Wishlist', description: 'Persistence sync layer, slider drawer, and price calculator.', status: 'locked' },
    { day: 7, title: 'Orders API', description: 'Stock verification, total calculations, and order creation.', status: 'locked' },
    { day: 8, title: 'Checkout Flow', description: 'Multi-step shipping, order summary, and history dashboard.', status: 'locked' },
    { day: 9, title: 'Stripe Payments', description: 'Secure payment intent endpoints and card details form.', status: 'locked' },
    { day: 10, title: 'Reviews & Ratings', description: 'Calculation of rating metrics and interactive star reviews widget.', status: 'locked' },
    { day: 11, title: 'Admin - Products', description: 'Dashboard view for managing catalog items and categories.', status: 'locked' },
    { day: 12, title: 'Admin - Analytics', description: 'Revenue graphs, user registrations, and order management.', status: 'locked' },
    { day: 13, title: 'Search & Recommendations', description: 'Fuzzy keyword searches and related item recommendations.', status: 'locked' },
    { day: 14, title: 'Security Auditing', description: 'Throttler rate limits, Helmet headers, and loading optimizations.', status: 'locked' },
    { day: 15, title: 'Docker & Polishing', description: 'Docker compose orchestration, production builds, and final QA.', status: 'locked' },
  ];

  return (
    <div className="container main-content">
      {/* Hero Header */}
      <header className="hero-section">
        <h1 className="hero-title">
          <span>Next-Gen</span> E-Commerce
        </h1>
        <p className="hero-subtitle">
          A premium, high-performance monorepo application built using NestJS, React, Zustand, and Prisma ORM.
        </p>

        {/* Backend Status Bar */}
        <div className="status-panel glass">
          <div className="status-info">
            <div className={`status-indicator ${backendStatus}`} />
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {backendStatus === 'ok' && 'Backend Server Online'}
                {backendStatus === 'loading' && 'Checking backend status...'}
                {backendStatus === 'error' && 'Backend Server Offline'}
              </span>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {backendStatus === 'ok' && 'Listening on port 3000'}
                {backendStatus === 'loading' && 'Attempting to ping port 3000'}
                {backendStatus === 'error' && 'Make sure backend dev server is running'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              fontWeight: 500
            }}>
              v1.0.0-Beta
            </span>
          </div>
        </div>
      </header>

      {/* User Dashboard Summary */}
      {isAuthenticated && user && (
        <div className="glass" style={{
          padding: '20px 24px',
          borderRadius: 'var(--border-radius-md)',
          marginBottom: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '4px solid var(--accent-color)',
          textAlign: 'left'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} className="accent-color" />
              Welcome back, {user.name}!
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Logged in as {user.email} &bull; Permissions: <strong>{user.role}</strong>
            </p>
          </div>
        </div>
      )}

      {/* 15-Day Roadmap Dashboard */}
      <section style={{ marginTop: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, textAlign: 'left', marginBottom: '8px' }}>
          Project Roadmap Progress
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'left', marginBottom: '24px' }}>
          Track the day-by-day implementation of features across the backend and frontend stack.
        </p>

        <div className="roadmap-grid">
          {roadmap.map((item) => (
            <div 
              key={item.day} 
              className={`roadmap-card ${
                item.status === 'completed' ? 'completed' : item.status === 'in-progress' ? 'active' : 'locked'
              }`}
            >
              <div className="roadmap-day">Day {item.day}</div>
              <h3 className="roadmap-title">{item.title}</h3>
              <p className="roadmap-desc">{item.description}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px' }}>
                {item.status === 'completed' && (
                  <span className="roadmap-status-badge completed">
                    <CheckCircle size={10} style={{ marginRight: '4px', display: 'inline' }} /> Completed
                  </span>
                )}
                {item.status === 'in-progress' && (
                  <span className="roadmap-status-badge in-progress">
                    <Play size={10} style={{ marginRight: '4px', display: 'inline' }} /> In Progress
                  </span>
                )}
                {item.status === 'locked' && (
                  <span className="roadmap-status-badge locked">
                    <Lock size={10} style={{ marginRight: '4px', display: 'inline' }} /> Locked
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
export default Home;
