import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProductStore } from '../store/products';
import type { ProductFilters } from '../store/products';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Tag, Info, Heart, Star } from 'lucide-react';
import { useCartStore } from '../store/cart';

/**
 * Catalog Page Component.
 * Implements a responsive page featuring a products category sidebar, price selectors, keyword search bar,
 * a paginated products grid layout, and wishlist interaction triggers.
 */
export const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading, error, page, totalPages, fetchProducts } = useProductStore();
  const { wishlist, toggleWishlist } = useCartStore();

  // Helper to determine if a product is in the wishlist
  const isWishlisted = (productId: string) => 
    wishlist.some((item) => item.id === productId);

  // Local state for filter inputs - initialized from search parameters
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [categoryVal, setCategoryVal] = useState(searchParams.get('category') || '');
  const [minPriceVal, setMinPriceVal] = useState(searchParams.get('minPrice') || '');
  const [maxPriceVal, setMaxPriceVal] = useState(searchParams.get('maxPrice') || '');
  const [sortByVal, setSortByVal] = useState(searchParams.get('sortBy') || 'newest');

  // Available categories in our seed and backend
  const categories = ['All', 'Accessories', 'Electronics', 'Clothing', 'Home & Kitchen'];

  // Sync state and fetch products when searchParams change
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const pageNum = parseInt(searchParams.get('page') || '1', 10);

    setSearchVal(search);
    setCategoryVal(category);
    setMinPriceVal(minPrice);
    setMaxPriceVal(maxPrice);
    setSortByVal(sortBy);

    const filters: ProductFilters = {
      page: pageNum,
      limit: 8,
    };

    if (search.trim()) filters.search = search.trim();
    if (category && category !== 'All') filters.category = category;
    if (minPrice) filters.minPrice = minPrice;
    if (maxPrice) filters.maxPrice = maxPrice;

    if (sortBy === 'newest') {
      filters.sortBy = 'newest';
      filters.sortOrder = 'desc';
    } else if (sortBy === 'price-asc') {
      filters.sortBy = 'price';
      filters.sortOrder = 'asc';
    } else if (sortBy === 'price-desc') {
      filters.sortBy = 'price';
      filters.sortOrder = 'desc';
    } else if (sortBy === 'rating-desc') {
      filters.sortBy = 'rating';
      filters.sortOrder = 'desc';
    } else if (sortBy === 'title-asc') {
      filters.sortBy = 'title';
      filters.sortOrder = 'asc';
    } else if (sortBy === 'title-desc') {
      filters.sortBy = 'title';
      filters.sortOrder = 'desc';
    }

    void fetchProducts(filters);
  }, [searchParams, fetchProducts]);

  // Helper to update url search parameters
  const updateParams = (newParams: Record<string, string>) => {
    setSearchParams((prev) => {
      Object.entries(newParams).forEach(([key, val]) => {
        if (val) {
          prev.set(key, val);
        } else {
          prev.delete(key);
        }
      });
      return prev;
    });
  };

  const applyFilters = () => {
    updateParams({
      search: searchVal.trim(),
      category: categoryVal,
      minPrice: minPriceVal,
      maxPrice: maxPriceVal,
      sortBy: sortByVal,
      page: '1',
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setSortByVal(newVal);
    updateParams({ sortBy: newVal, page: '1' });
  };

  const handleClearFilters = () => {
    setSearchVal('');
    setCategoryVal('');
    setMinPriceVal('');
    setMaxPriceVal('');
    setSortByVal('newest');
    setSearchParams({});
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateParams({ page: newPage.toString() });
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
                    onClick={() => {
                      const nextCat = cat === 'All' ? '' : cat;
                      setCategoryVal(nextCat);
                      updateParams({ category: nextCat, page: '1' });
                    }}
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

          {/* Sort Selection Filter */}
          <div className="filter-section">
            <label className="form-label" htmlFor="catalog-sort">Sort By</label>
            <select
              id="catalog-sort"
              className="form-input"
              value={sortByVal}
              onChange={handleSortChange}
              style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
            >
              <option value="newest" style={{ background: '#121212' }}>Newest Arrivals</option>
              <option value="price-asc" style={{ background: '#121212' }}>Price: Low to High</option>
              <option value="price-desc" style={{ background: '#121212' }}>Price: High to Low</option>
              <option value="rating-desc" style={{ background: '#121212' }}>Highest Rated</option>
              <option value="title-asc" style={{ background: '#121212' }}>Name: A to Z</option>
              <option value="title-desc" style={{ background: '#121212' }}>Name: Z to A</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
              onClick={() => applyFilters()}
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
              {searchVal.trim() && (
                <div className="glass" style={{ padding: '16px 24px', borderRadius: '12px', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span>
                    Showing results for "<strong>{searchVal.trim()}</strong>"
                    {sortByVal === 'newest' ? ' sorted by search relevance' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchVal('');
                      void fetchProducts({
                        page: 1,
                        limit: 8,
                        category: categoryVal || undefined,
                        minPrice: minPriceVal || undefined,
                        maxPrice: maxPriceVal || undefined,
                        sortBy: sortByVal,
                        sortOrder: sortByVal === 'price-asc' ? 'asc' : 'desc'
                      });
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0 }}
                  >
                    Clear Search
                  </button>
                </div>
              )}

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
