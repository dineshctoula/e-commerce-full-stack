import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/products';
import type { ProductFilters } from '../store/products';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Tag, Info } from 'lucide-react';

export const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const { products, loading, error, page, totalPages, fetchProducts } = useProductStore();

  // Local state for filter inputs
  const [searchVal, setSearchVal] = useState('');
  const [categoryVal, setCategoryVal] = useState('');
  const [minPriceVal, setMinPriceVal] = useState('');
  const [maxPriceVal, setMaxPriceVal] = useState('');

  // Available categories in our seed and backend
  const categories = ['All', 'Accessories', 'Electronics', 'Clothing', 'Home & Kitchen'];

  // Trigger search requests using current filters
  const applyFilters = useCallback((targetPage?: number) => {
    const filters: ProductFilters = {
      page: targetPage ?? 1,
      limit: 8,
    };

    if (searchVal.trim()) filters.search = searchVal.trim();
    if (categoryVal && categoryVal !== 'All') filters.category = categoryVal;
    if (minPriceVal) filters.minPrice = minPriceVal;
    if (maxPriceVal) filters.maxPrice = maxPriceVal;

    void fetchProducts(filters);
  }, [searchVal, categoryVal, minPriceVal, maxPriceVal, fetchProducts]);

  // Initial load
  useEffect(() => {
    applyFilters(1);
  }, [categoryVal, applyFilters]); // Fetch instantly when category changes

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(1);
  };

  const handleClearFilters = () => {
    setSearchVal('');
    setCategoryVal('');
    setMinPriceVal('');
    setMaxPriceVal('');
    // Call fetchProducts directly with clean parameters to bypass state update delays
    void fetchProducts({ page: 1, limit: 8 });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      applyFilters(newPage);
    }
  };

  return (
    <div className="container main-content">
      {/* Header Info */}
      <div style={{ marginBottom: '32px', textAlign: 'left' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>
          Explore Products
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Premium hardware, design utilities, and lifestyle clothing curated for your workspace.
        </p>
      </div>

      {/* Catalog Grid Structure (Filters Sidebar + Products List) */}
      <div className="catalog-layout">

        {/* Filters Sidebar */}
        <aside className="filters-sidebar glass">
          <div className="filters-header">
            <SlidersHorizontal size={18} className="accent-color" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              Filters
            </h2>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="filter-section">
            <label className="form-label">Search Keyword</label>
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Type to search..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="form-input"
                style={{ paddingRight: '40px' }}
              />
              <button type="submit" className="search-icon-btn" aria-label="Search">
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Categories select list */}
          <div className="filter-section">
            <label className="form-label">Category</label>
            <div className="category-chips">
              {categories.map((cat) => {
                const displayName = cat;
                const isSelected = categoryVal === (cat === 'All' ? '' : cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`category-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => setCategoryVal(cat === 'All' ? '' : cat)}
                  >
                    <Tag size={12} style={{ marginRight: '6px' }} />
                    <span>{displayName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Boundary Filter */}
          <div className="filter-section">
            <label className="form-label">Price Range</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={minPriceVal}
                onChange={(e) => setMinPriceVal(e.target.value)}
                className="form-input"
                min="0"
              />
              <span style={{ color: 'var(--text-secondary)' }}>to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPriceVal}
                onChange={(e) => setMaxPriceVal(e.target.value)}
                className="form-input"
                min="0"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
              onClick={() => applyFilters(1)}
            >
              Apply Filters
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '13px' }}
              onClick={handleClearFilters}
            >
              Clear
            </button>
          </div>
        </aside>

        {/* Products Grid Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Loading status */}
          {loading ? (
            <div className="loading-container glass">
              <div className="spinner" />
              <p>Fetching catalog items...</p>
            </div>
          ) : error ? (
            <div className="error-alert">
              <Info size={16} />
              <span>{error}</span>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-catalog glass">
              <Info size={24} className="accent-color" />
              <h3>No products found</h3>
              <p>Try clearing filters or modifying your search keywords.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClearFilters}
                style={{ marginTop: '16px' }}
              >
                Reset Catalog View
              </button>
            </div>
          ) : (
            <>
              {/* Product Card Grid */}
              <div className="product-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card glass">
                    <div className="product-image-container">
                      <img
                        src={product.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=600'}
                        alt={product.title}
                        className="product-image"
                        loading="lazy"
                      />
                      <span className="product-category-badge">{product.category}</span>
                    </div>

                    <div className="product-card-body">
                      <h3 className="product-card-title">{product.title}</h3>
                      <p className="product-card-desc">
                        {product.description.length > 80
                          ? `${product.description.slice(0, 80)}...`
                          : product.description}
                      </p>

                      <div className="product-card-footer">
                        <span className="product-card-price">${product.price.toFixed(2)}</span>

                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-wrapper glass">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <span className="pagination-text">
                    Page <strong>{page}</strong> of {totalPages}
                  </span>

                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalog;
