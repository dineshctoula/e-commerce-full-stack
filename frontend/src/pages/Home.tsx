import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/products';
import { useCartStore } from '../store/cart';
import { 
  Heart, 
  Star, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  BadgePercent
} from 'lucide-react';

interface Slide {
  id: number;
  tag: string;
  title: string;
  description: string;
  gradient: string;
  category: string;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { products, fetchProducts, loading } = useProductStore();
  const { wishlist, toggleWishlist } = useCartStore();

  // Load products on mount
  useEffect(() => {
    void fetchProducts({ page: 1, limit: 10 });
  }, [fetchProducts]);

  // Slides data
  const slides: Slide[] = [
    {
      id: 0,
      tag: 'Grand Tech Release',
      title: 'Upgrade Your Workspace Setup',
      description: 'Get up to 40% OFF on mechanical keyboards, smart desk hubs, and ergonomic accessories.',
      gradient: 'linear-gradient(135deg, #f57224 0%, #ff8c42 100%)',
      category: 'Electronics'
    },
    {
      id: 1,
      tag: 'Monsoon Style Upgrade',
      title: 'Trending Apparel Collection',
      description: 'Step out in style with curated local and international fashion wear designed for maximum comfort.',
      gradient: 'linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)',
      category: 'Clothing'
    },
    {
      id: 2,
      tag: 'Smart Home Event',
      title: 'Modern Kitchen & Decor',
      description: 'Simplify your daily routine with high-quality smart appliances and beautiful organizer bundles.',
      gradient: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)',
      category: 'Home & Kitchen'
    }
  ];

  // Auto-playing slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Flash Sale Countdown State (Starts at 4 hours, 12 minutes, 30 seconds)
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 12, seconds: 30 });
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset back to 4 hours to keep the UI active
          return { hours: 4, minutes: 12, seconds: 30 };
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format countdown digits to always be two characters
  const formatTimeVal = (num: number) => num.toString().padStart(2, '0');

  // Categories list
  const categories = [
    { name: 'Electronics', icon: '💻' },
    { name: 'Accessories', icon: '🎧' },
    { name: 'Clothing', icon: '👕' },
    { name: 'Home & Kitchen', icon: '🏠' }
  ];

  // Wishlist state check helper
  const isWishlisted = (productId: string) => wishlist.some((item) => item.id === productId);

  // Take the first 4 products for the Flash Sale
  const flashSaleProducts = products.slice(0, 4);

  return (
    <div className="container main-content">
      {/* Top Slider and Category Sidebar Section */}
      <div className="home-layout">
        {/* Left Category Sidebar */}
        <aside className="home-categories-panel">
          <div style={{ padding: '0 20px 12px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '15px' }}>
            Categories
          </div>
          <div style={{ marginTop: '8px' }}>
            {categories.map((cat) => (
              <div 
                key={cat.name} 
                className="home-category-item"
                onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Banner Slider with Auto-play */}
        <div 
          className="home-slider" 
          style={{ 
            background: slides[currentSlide].gradient, 
            transition: 'background 0.5s ease-in-out' 
          }}
        >
          <div className="slider-content">
            <span className="slider-tag">{slides[currentSlide].tag}</span>
            <h1 className="slider-title">{slides[currentSlide].title}</h1>
            <p className="slider-desc">{slides[currentSlide].description}</p>
            <button 
              type="button" 
              className="slider-btn"
              onClick={() => navigate(`/shop?category=${encodeURIComponent(slides[currentSlide].category)}`)}
            >
              <span>Shop Now</span>
              <ArrowRight size={16} />
            </button>
          </div>
          {/* Background visuals */}
          <div className="slider-bg-circle" />
          <div className="slider-bg-circle-small" />

          {/* Slider Indicators */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            right: '48px',
            display: 'flex',
            gap: '8px',
            zIndex: 10
          }}>
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                aria-label={`Slide ${index + 1}`}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: currentSlide === index ? '#ffffff' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'background-color 0.3s'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Trust Badges Bar */}
      <div className="glass" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        padding: '16px 24px',
        borderRadius: 'var(--border-radius-sm)',
        marginBottom: '24px',
        border: '1px solid var(--border-color)',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={28} className="accent-color" />
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>100% Genuine Products</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Directly from official brand partners</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Truck size={28} className="accent-color" />
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Fast Delivery</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Reliable logistics across all major cities</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RotateCcw size={28} className="accent-color" />
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>7-Day Easy Return</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Hassle-free refund policy for security</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BadgePercent size={28} className="accent-color" />
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Best Price Guaranteed</h4>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Unbeatable campaign discount events</p>
          </div>
        </div>
      </div>

      {/* Flash Sale Widget Section */}
      {flashSaleProducts.length > 0 && (
        <section className="flash-sale-box">
          <div className="flash-sale-header">
            <div className="flash-sale-title-info">
              <Zap size={22} fill="var(--accent-color)" color="var(--accent-color)" />
              <span className="flash-sale-title">Flash Sale</span>
              <div className="countdown-timer">
                <span className="countdown-label">On Sale Now</span>
                <span className="countdown-box">{formatTimeVal(countdown.hours)}</span>
                <span className="countdown-divider">:</span>
                <span className="countdown-box">{formatTimeVal(countdown.minutes)}</span>
                <span className="countdown-divider">:</span>
                <span className="countdown-box">{formatTimeVal(countdown.seconds)}</span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/shop')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Shop More</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="flash-sale-grid">
            {flashSaleProducts.map((product) => {
              // Calculate discount price (20% off)
              const promoPrice = product.price * 0.8;
              const stockRatio = (product.stock % 7) + 3; // mock stock remaining
              const totalMock = stockRatio + 6;
              const fillPercent = (stockRatio / totalMock) * 100;

              return (
                <div 
                  key={product.id} 
                  className="flash-sale-card"
                  onClick={() => navigate(`/products/${product.id}`)}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <span className="flash-sale-badge">-20%</span>
                  <div style={{ height: '180px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src={product.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600'} 
                      alt={product.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                  <div style={{ padding: '12px' }}>
                    <h4 style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      margin: '0 0 8px 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'var(--text-primary)'
                    }}>
                      {product.title}
                    </h4>

                    <div className="flash-sale-price-group">
                      <span className="flash-sale-current-price">Rs. {(promoPrice * 130).toFixed(0)}</span>
                      <span className="flash-sale-original-price">Rs. {(product.price * 130).toFixed(0)}</span>
                    </div>

                    <div className="stock-progress-container">
                      <div className="stock-progress-bar">
                        <div className="stock-progress-fill" style={{ width: `${fillPercent}%` }} />
                      </div>
                      <div className="stock-progress-text">{stockRatio} items left</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Just For You Product Grid */}
      <section style={{ marginTop: '24px' }}>
        <div className="section-header">
          <span className="section-title">Just For You</span>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/shop')}
          >
            See All Products
          </button>
        </div>

        {loading ? (
          <div className="loading-container glass" style={{ padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p>Fetching products...</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="product-card glass"
                onClick={() => navigate(`/products/${product.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="product-image-container">
                  <img 
                    src={product.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600'} 
                    alt={product.title} 
                    className="product-image"
                    loading="lazy"
                  />
                  <span className="product-category-badge">{product.category}</span>
                  
                  {/* Floating Wishlist Heart Toggle Button */}
                  <button
                    type="button"
                    className={`wishlist-toggle-btn ${isWishlisted(product.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Avoid navigating to details page
                      toggleWishlist(product);
                    }}
                    title={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    aria-label="Toggle Wishlist"
                  >
                    <Heart 
                      size={16} 
                      fill={isWishlisted(product.id) ? 'var(--accent-color)' : 'none'}
                      color={isWishlisted(product.id) ? 'var(--accent-color)' : 'currentColor'}
                    />
                  </button>
                </div>

                <div className="product-card-body">
                  <h3 className="product-card-title">{product.title}</h3>
                  
                  {/* Rating Stars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= Math.round(product.averageRating || 0);
                        return (
                          <Star
                            key={star}
                            size={13}
                            fill={isFilled ? '#fbbf24' : 'none'}
                            color={isFilled ? '#fbbf24' : 'var(--text-secondary)'}
                          />
                        );
                      })}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      ({product.reviewsCount || 0})
                    </span>
                  </div>

                  <p className="product-card-desc">
                    {product.description.length > 80
                      ? `${product.description.slice(0, 80)}...`
                      : product.description}
                  </p>

                  <div className="product-card-footer">
                    {/* Convert to Nepalese Rupees (approx 1 USD = 130 NPR) */}
                    <span className="product-card-price">Rs. {(product.price * 130).toFixed(0)}</span>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${product.id}`);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Partner Banner Block */}
      <div className="partners-block">
        <h3 className="partners-title">Authorized Digital Payment Partners</h3>
        <div className="partners-flex">
          <span className="partner-logo esewa">eSewa</span>
          <span className="partner-logo imepay">IME Pay</span>
          <span className="partner-logo stripe">Stripe Security</span>
          <span className="partner-logo cod">Cash on Delivery</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
