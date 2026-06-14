import React, { useEffect, useState } from 'react';
import { useOrderStore } from '../store/orders';
import { useProductStore } from '../store/products';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertTriangle,
  ChevronDown,
  Info,
  Calendar,
  User,
  MapPin,
  Mail,
  Phone,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { useCouponStore } from '../store/coupons';

/**
 * AdminDashboard Component.
 * Accessible only by users holding the `'ADMIN'` role.
 * Serves as the central console for managing products, tracking customer order statuses,
 * and analyzing business performance metrics.
 */
export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'products' | 'coupons'>('stats');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const {
    adminStats,
    statsLoading,
    statsError,
    fetchAdminStats,
    orders,
    loading: ordersLoading,
    fetchOrders,
    updateOrderStatus
  } = useOrderStore();

  const {
    products,
    loading: productsLoading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  } = useProductStore();

  const {
    coupons,
    loading: couponsLoading,
    fetchCoupons,
    createCoupon,
    deleteCoupon
  } = useCouponStore();

  // Coupon Modals & Form State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [deleteCouponId, setDeleteCouponId] = useState<string | null>(null);
  const [couponFormData, setCouponFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT',
    value: '',
    minOrderAmount: '',
    maxUses: '',
    expiresAt: '',
    active: true,
  });
  const [couponFormError, setCouponFormError] = useState<string | null>(null);

  // Modals & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: 'Accessories',
    image: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      stock: '',
      category: 'Accessories',
      image: '',
    });
    setFormError(null);
    setModalType('create');
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      image: product.image || '',
    });
    setFormError(null);
    setEditProductId(product.id);
    setModalType('edit');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError('Title and Description are required.');
      return;
    }
    const parsedPrice = parseFloat(formData.price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('Price must be a positive number.');
      return;
    }
    const parsedStock = parseInt(formData.stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setFormError('Stock must be a non-negative integer.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: parsedPrice,
      stock: parsedStock,
      category: formData.category,
      image: formData.image.trim() || undefined,
    };

    let success = false;
    if (modalType === 'create') {
      success = await createProduct(payload as any);
    } else if (modalType === 'edit' && editProductId) {
      success = await updateProduct(editProductId, payload);
    }

    if (success) {
      setIsModalOpen(false);
      void fetchAdminStats();
    }
  };

  const openCouponCreateModal = () => {
    setCouponFormData({
      code: '',
      discountType: 'PERCENTAGE',
      value: '',
      minOrderAmount: '',
      maxUses: '',
      expiresAt: '',
      active: true,
    });
    setCouponFormError(null);
    setIsCouponModalOpen(true);
  };

  const handleCouponFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponFormError(null);

    if (!couponFormData.code.trim()) {
      setCouponFormError('Coupon code is required.');
      return;
    }

    const val = parseFloat(couponFormData.value);
    if (isNaN(val) || val <= 0) {
      setCouponFormError('Discount value must be a positive number.');
      return;
    }

    if (couponFormData.discountType === 'PERCENTAGE' && val > 100) {
      setCouponFormError('Percentage discount value cannot exceed 100%.');
      return;
    }

    const minAmt = parseFloat(couponFormData.minOrderAmount || '0');
    if (isNaN(minAmt) || minAmt < 0) {
      setCouponFormError('Minimum order amount must be a non-negative number.');
      return;
    }

    const maxUsages = couponFormData.maxUses ? parseInt(couponFormData.maxUses, 10) : undefined;
    if (maxUsages !== undefined && (isNaN(maxUsages) || maxUsages <= 0)) {
      setCouponFormError('Maximum uses must be a positive integer.');
      return;
    }

    const payload = {
      code: couponFormData.code.toUpperCase().trim(),
      discountType: couponFormData.discountType,
      value: val,
      minOrderAmount: minAmt,
      maxUses: maxUsages ?? null,
      expiresAt: couponFormData.expiresAt ? new Date(couponFormData.expiresAt).toISOString() : null,
      active: couponFormData.active,
    };

    const success = await createCoupon(payload as any);
    if (success) {
      setIsCouponModalOpen(false);
    } else {
      setCouponFormError('Failed to create coupon. Code might already exist.');
    }
  };

  const handleDeleteCouponConfirm = async () => {
    if (deleteCouponId) {
      const success = await deleteCoupon(deleteCouponId);
      if (success) {
        setDeleteCouponId(null);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteProductId) {
      const success = await deleteProduct(deleteProductId);
      if (success) {
        setDeleteProductId(null);
        void fetchAdminStats();
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  useEffect(() => {
    void fetchAdminStats();
    void fetchOrders();
    void fetchProducts({ limit: 100 });
    void fetchCoupons();
  }, [fetchAdminStats, fetchOrders, fetchProducts, fetchCoupons]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      void fetchAdminStats(); // Refresh stats on order update
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return <Clock size={16} color="var(--accent-color)" />;
      case 'PROCESSING':
        return <TrendingUp size={16} color="#3b82f6" />;
      case 'SHIPPED':
        return <Truck size={16} color="#8b5cf6" />;
      case 'DELIVERED':
        return <CheckCircle size={16} color="#10b981" />;
      case 'CANCELLED':
        return <XCircle size={16} color="#ef4444" />;
      default:
        return <Info size={16} />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'status-badge-pending';
      case 'PROCESSING':
        return 'status-badge-processing';
      case 'SHIPPED':
        return 'status-badge-shipped';
      case 'DELIVERED':
        return 'status-badge-delivered';
      case 'CANCELLED':
        return 'status-badge-cancelled';
      default:
        return 'status-badge-default';
    }
  };

  return (
    <div className="container main-content">
      {/* Title block */}
      <div style={{ marginBottom: '32px', textAlign: 'left' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>
          Admin Control Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Manage your products, process customer orders, and analyze store performance metrics.
        </p>
      </div>

      {/* Admin tab navigation */}
      <div className="admin-tabs-nav glass" style={{ display: 'flex', gap: '8px', padding: '8px', marginBottom: '32px', borderRadius: '12px' }}>
        <button
          onClick={() => setActiveTab('stats')}
          className={`admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 600, transition: 'all 0.2s' }}
        >
          Dashboard Stats
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 600, transition: 'all 0.2s' }}
        >
          Manage Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 600, transition: 'all 0.2s' }}
        >
          Manage Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`admin-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 600, transition: 'all 0.2s' }}
        >
          Manage Coupons ({coupons.length})
        </button>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div>
          {statsLoading && !adminStats ? (
            <div className="loading-container glass">
              <div className="spinner" />
              <p>Calculating store performance stats...</p>
            </div>
          ) : statsError ? (
            <div className="error-alert">
              <Info size={16} />
              <span>{statsError}</span>
            </div>
          ) : adminStats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Stat Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="glass stat-card" style={{ padding: '24px', borderRadius: '16px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Total Revenue</span>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px' }}>
                      <DollarSign size={20} color="#10b981" />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>
                    ${adminStats.totalSales.toFixed(2)}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                    Excludes cancelled transactions
                  </p>
                </div>

                <div className="glass stat-card" style={{ padding: '24px', borderRadius: '16px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Orders Received</span>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '8px' }}>
                      <ShoppingBag size={20} color="var(--accent-color)" />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>
                    {adminStats.totalOrders}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                    Lifetime checkout transactions
                  </p>
                </div>

                <div className="glass stat-card" style={{ padding: '24px', borderRadius: '16px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Average Order Value</span>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px' }}>
                      <TrendingUp size={20} color="#3b82f6" />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>
                    ${adminStats.averageOrderValue.toFixed(2)}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                    Average spend per transaction
                  </p>
                </div>

                <div className="glass stat-card" style={{ padding: '24px', borderRadius: '16px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Out of Stock Products</span>
                    <div style={{ background: adminStats.outOfStockProducts > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px' }}>
                      <Package size={20} color={adminStats.outOfStockProducts > 0 ? '#ef4444' : '#10b981'} />
                    </div>
                  </div>
                  <h3 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: adminStats.outOfStockProducts > 0 ? '#ef4444' : 'inherit' }}>
                    {adminStats.outOfStockProducts}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                    Products requiring inventory refill
                  </p>
                </div>
              </div>

              {/* Category Sales & Order Status Breakdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                {/* Sales by Category Card */}
                <div className="glass" style={{ padding: '24px', borderRadius: '16px', textAlign: 'left' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, marginTop: 0, marginBottom: '20px' }}>
                    Sales by Category
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {Object.keys(adminStats.categorySales).length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>No sales logged yet.</p>
                    ) : (
                      Object.entries(adminStats.categorySales).map(([category, amount]) => (
                        <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                            <span style={{ fontWeight: 500 }}>{category}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>${(amount as number).toFixed(2)}</span>
                          </div>
                          {/* Progress Bar */}
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                background: 'var(--accent-gradient)',
                                width: `${adminStats.totalSales > 0 ? ((amount as number) / adminStats.totalSales) * 100 : 0}%`
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Status Breakdown Card */}
                <div className="glass" style={{ padding: '24px', borderRadius: '16px', textAlign: 'left' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, marginTop: 0, marginBottom: '20px' }}>
                    Order Status Breakdown
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {Object.entries(adminStats.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="glass" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {getStatusIcon(status)}
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {status}
                          </span>
                        </div>
                        <span style={{ fontSize: '24px', fontWeight: 800 }}>{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="glass" style={{ padding: '24px', borderRadius: '16px', textAlign: 'left' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, marginTop: 0, marginBottom: '20px' }}>
                  Recent System Orders
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminStats.recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No orders placed in the system yet.
                          </td>
                        </tr>
                      ) : (
                        adminStats.recentOrders.map((order: any) => (
                          <tr key={order.id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                              {order.id.substring(0, 8)}...
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 500 }}>{order.user?.name || 'Guest'}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  {order.user?.email || order.shippingEmail}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                <Calendar size={13} color="var(--text-secondary)" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>
                              ${order.totalAmount.toFixed(2)}
                            </td>
                            <td>
                              <span className={`status-badge ${getStatusBadgeClass(order.status)}`} style={{ fontSize: '11px' }}>
                                {order.status}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => {
                                  setExpandedOrderId(order.id);
                                  setActiveTab('orders');
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No performance statistics available.</p>
          )}
        </div>
      )}

      {/* Orders Management Tab */}
      {activeTab === 'orders' && (
        <div>
          {ordersLoading ? (
            <div className="loading-container glass">
              <div className="spinner" />
              <p>Retrieving all customer orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="glass" style={{ padding: '48px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <ShoppingBag size={48} className="accent-color" />
              <h3>No Customer Orders</h3>
              <p style={{ color: 'var(--text-secondary)' }}>There are no orders registered in the system yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <div key={order.id} className="glass order-item-card" style={{ borderRadius: '16px', overflow: 'hidden', textAlign: 'left', transition: 'all 0.3s' }}>
                    {/* Collapsed Header Summary */}
                    <div
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Order ID</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{order.id}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Order Date</span>
                          <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Items</span>
                          <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Amount</span>
                          <span style={{ fontWeight: 700, color: 'var(--accent-color)' }}>${order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                        <ChevronDown
                          size={18}
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            color: 'var(--text-secondary)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '24px' }}>
                          {/* Left Column: Items */}
                          <div>
                            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                              Order Items
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {order.items.map((item) => (
                                <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                  <img
                                    src={item.product?.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=150'}
                                    alt={item.product?.title || 'Product'}
                                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>
                                      {item.product?.title || 'Unknown Product'}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                      Qty: {item.quantity} &times; ${item.price.toFixed(2)}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                    ${(item.quantity * item.price).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '4px', fontSize: '14px', fontWeight: 700 }}>
                                <span>Grand Total</span>
                                <span color="var(--accent-color)">${order.totalAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Center Column: Shipping Address */}
                          <div>
                            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                              Shipping Details
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <User size={14} color="var(--text-secondary)" style={{ marginTop: '2px' }} />
                                <div>
                                  <span style={{ fontWeight: 600, display: 'block' }}>{order.shippingAddress}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <MapPin size={14} color="var(--text-secondary)" style={{ marginTop: '2px' }} />
                                <div>
                                  <span>{order.shippingLocalAddress}</span>
                                  <span style={{ display: 'block' }}>
                                    {order.shippingCity}, {order.shippingPostalCode}
                                  </span>
                                  <span style={{ display: 'block', fontWeight: 500 }}>{order.shippingCountry}</span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mail size={14} color="var(--text-secondary)" />
                                <span>{order.shippingEmail}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Phone size={14} color="var(--text-secondary)" />
                                <span>{order.shippingPhone}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                              Update Status
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label className="form-label">Current Status: {order.status}</label>
                              <div className="search-input-wrapper">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                  className="form-input"
                                  style={{ paddingRight: '20px', cursor: 'pointer', textTransform: 'uppercase' }}
                                >
                                  <option value="PENDING">Pending Payment</option>
                                  <option value="PROCESSING">Processing (Paid)</option>
                                  <option value="SHIPPED">Shipped</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                              </div>
                              <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <AlertTriangle size={14} color="var(--accent-color)" />
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  Changing status updates the customer's dashboard in real-time.
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Products Management Tab */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Action Header */}
          <div className="glass" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Search products by title or category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="form-input"
                style={{ maxWidth: '400px' }}
              />
            </div>
            <button
              onClick={openCreateModal}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <Plus size={16} />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Products Table Card */}
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', textAlign: 'left' }}>
            {productsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                <div className="spinner" />
                <p style={{ marginTop: '12px' }}>Loading catalog products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No products found matching your search.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Title & Category</th>
                      <th>Price</th>
                      <th>Stock Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <img
                            src={product.image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=150'}
                            alt={product.title}
                            style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{product.title}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {product.category}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          ${product.price.toFixed(2)}
                        </td>
                        <td>
                          {product.stock === 0 ? (
                            <span className="status-badge status-badge-cancelled" style={{ fontSize: '11px' }}>
                              Out of Stock
                            </span>
                          ) : product.stock <= 5 ? (
                            <span className="status-badge status-badge-pending" style={{ fontSize: '11px' }}>
                              Low Stock ({product.stock})
                            </span>
                          ) : (
                            <span className="status-badge status-badge-delivered" style={{ fontSize: '11px' }}>
                              {product.stock} Available
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openEditModal(product)}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px' }}
                              title="Edit Product"
                            >
                              <Edit size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteProductId(product.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              title="Delete Product"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coupons Management Tab */}
      {activeTab === 'coupons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Action Header */}
          <div className="glass" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', textAlign: 'left' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Active Campaigns & Promo Codes
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
                Create discount codes to incentivize purchase flows.
              </p>
            </div>
            <button
              onClick={openCouponCreateModal}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <Plus size={16} />
              <span>Create Coupon</span>
            </button>
          </div>

          {/* Coupons Table Card */}
          <div className="glass" style={{ padding: '24px', borderRadius: '16px', textAlign: 'left' }}>
            {couponsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                <div className="spinner" />
                <p style={{ marginTop: '12px' }}>Loading promo coupons...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No coupons configured yet. Click "Create Coupon" to add one.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Min Spend</th>
                      <th>Usage Limit</th>
                      <th>Expires At</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '15px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                            {coupon.code}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px' }}>
                            {coupon.discountType}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}%` : `$${coupon.value.toFixed(2)}`}
                        </td>
                        <td>
                          ${coupon.minOrderAmount.toFixed(2)}
                        </td>
                        <td>
                          <span style={{ fontSize: '13px' }}>
                            {coupon.usedCount} / {coupon.maxUses ?? '∞'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                          </span>
                        </td>
                        <td>
                          {coupon.active ? (
                            <span className="status-badge status-badge-delivered" style={{ fontSize: '11px' }}>
                              Active
                            </span>
                          ) : (
                            <span className="status-badge status-badge-cancelled" style={{ fontSize: '11px' }}>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setDeleteCouponId(coupon.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                              title="Delete Coupon"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Modal (Create / Edit Product) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass" style={{ padding: '32px', borderRadius: '16px', maxWidth: '500px', width: '90%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, margin: 0 }}>
              {modalType === 'create' ? 'Add New Product' : 'Edit Product'}
            </h3>

            {formError && (
              <div className="error-alert" style={{ fontSize: '13px', padding: '10px 14px' }}>
                <Info size={14} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '6px' }}>Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Keyboard"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '6px' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Accessories">Accessories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px' }}>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder="99.99"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px' }}>Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '6px' }}>Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '6px' }}>Description</label>
                <textarea
                  required
                  placeholder="Describe the product specifications and benefits..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  {modalType === 'create' ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteProductId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass" style={{ padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, margin: 0, color: '#ef4444' }}>
              Delete Product
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this product? This action will remove it from the catalog and cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setDeleteProductId(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="btn btn-primary"
                style={{ padding: '8px 20px', background: '#ef4444', borderColor: '#ef4444' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {isCouponModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass" style={{ padding: '32px', borderRadius: '16px', maxWidth: '500px', width: '90%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, margin: 0 }}>
              Create Discount Coupon
            </h3>

            {couponFormError && (
              <div className="error-alert" style={{ fontSize: '13px', padding: '10px 14px' }}>
                <Info size={14} />
                <span>{couponFormError}</span>
              </div>
            )}

            <form onSubmit={handleCouponFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '6px' }}>Promo Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER50"
                  value={couponFormData.code}
                  onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px' }}>Discount Type</label>
                  <select
                    value={couponFormData.discountType}
                    onChange={(e) => setCouponFormData({ ...couponFormData, discountType: e.target.value as 'PERCENTAGE' | 'FLAT' })}
                    className="form-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Rate ($)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px' }}>Discount Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0.01"
                    placeholder={couponFormData.discountType === 'PERCENTAGE' ? '10' : '15.00'}
                    value={couponFormData.value}
                    onChange={(e) => setCouponFormData({ ...couponFormData, value: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px' }}>Min Spend ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={couponFormData.minOrderAmount}
                    onChange={(e) => setCouponFormData({ ...couponFormData, minOrderAmount: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: '6px' }}>Max Uses (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={couponFormData.maxUses}
                    onChange={(e) => setCouponFormData({ ...couponFormData, maxUses: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '6px' }}>Expires At (Optional)</label>
                <input
                  type="date"
                  value={couponFormData.expiresAt}
                  onChange={(e) => setCouponFormData({ ...couponFormData, expiresAt: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="coupon-active"
                  checked={couponFormData.active}
                  onChange={(e) => setCouponFormData({ ...couponFormData, active: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="coupon-active" style={{ fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>
                  Mark as Active immediately
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Coupon Confirmation Modal */}
      {deleteCouponId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass" style={{ padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, margin: 0, color: '#ef4444' }}>
              Delete Coupon
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this coupon? This will deactivate it and customers will no longer be able to use it.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setDeleteCouponId(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCouponConfirm}
                className="btn btn-primary"
                style={{ padding: '8px 20px', background: '#ef4444', borderColor: '#ef4444' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
