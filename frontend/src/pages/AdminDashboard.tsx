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
  Plus
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'products'>('stats');
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
    fetchProducts
  } = useProductStore();

  useEffect(() => {
    void fetchAdminStats();
    void fetchOrders();
    void fetchProducts({ limit: 100 });
  }, [fetchAdminStats, fetchOrders, fetchProducts]);

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

      {/* Products Management Tab (Placeholder for Commit 3) */}
      {activeTab === 'products' && (
        <div className="glass" style={{ padding: '48px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Package size={48} className="accent-color" />
          <h3>Manage Product Catalog</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Product list loading...</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
