import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useOrderStore } from '../store/orders';
import { User, Mail, Shield, CheckCircle, Calendar, ShoppingBag, MapPin, Lock, Settings } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuthStore();
  const { orders, fetchOrders, loading, cancelOrder } = useOrderStore();

  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Sync state if user data loads/updates
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  // Load user orders history when the component mounts
  useEffect(() => {
    if (user) {
      void fetchOrders();
    }
  }, [user, fetchOrders]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    const result = await updateProfile(profileName, profileEmail);
    setFormLoading(false);
    if (result.success) {
      setFormSuccess('Profile updated successfully.');
      setIsEditing(false);
    } else {
      setFormError(result.error || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match.');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    const result = await changePassword(currentPassword, newPassword);
    setFormLoading(false);
    if (result.success) {
      setFormSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setFormError(result.error || 'Failed to change password.');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }
    const success = await cancelOrder(orderId);
    if (success) {
      alert('Order cancelled successfully.');
    } else {
      alert('Failed to cancel order.');
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>No user profile found.</h2>
      </div>
    );
  }

  // Helper function to return status badge styling classes
  const getStatusBadgeStyle = (status: string) => {
    const formatted = status.toUpperCase();
    if (formatted === 'DELIVERED') {
      return { backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' };
    }
    if (formatted === 'CANCELLED') {
      return { backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' };
    }
    // PENDING, PROCESSING, SHIPPED
    return { backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
  };

  return (
    <div className="container main-content" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px', alignItems: 'start', textAlign: 'left' }}>
        
        {/* Left Side Column: User Info Card */}
        <section className="auth-card glass" style={{ maxWidth: '100%', padding: '32px' }}>
          {/* Profile Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-dim)',
              color: 'var(--accent-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <User size={28} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 800 }}>
                My Profile
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Manage account credentials
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'details' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '13px', flex: 1 }}
              onClick={() => {
                setActiveTab('details');
                setFormError(null);
                setFormSuccess(null);
              }}
            >
              <Settings size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Details
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '13px', flex: 1 }}
              onClick={() => {
                setActiveTab('security');
                setFormError(null);
                setFormSuccess(null);
              }}
            >
              <Lock size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Security
            </button>
          </div>

          {/* Form Message Banners */}
          {formError && (
            <div className="error-alert" style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '4px', fontSize: '13px' }}>
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="success-alert" style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
              {formSuccess}
            </div>
          )}

          {activeTab === 'details' ? (
            <div>
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-name">Full Name</label>
                    <input
                      id="profile-name"
                      type="text"
                      className="form-input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="profile-email">Email Address</label>
                    <input
                      id="profile-email"
                      type="email"
                      className="form-input"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                      placeholder="email@example.com"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '10px' }}
                      disabled={formLoading}
                    >
                      {formLoading ? <span className="loading-spinner" style={{ width: '16px', height: '16px' }} /> : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '10px' }}
                      onClick={() => {
                        setIsEditing(false);
                        setProfileName(user.name || '');
                        setProfileEmail(user.email || '');
                        setFormError(null);
                        setFormSuccess(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* User Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--accent-color)' }}><User size={18} /></div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Full Name</div>
                      <div style={{ fontSize: '15px', fontWeight: 600 }}>{user.name || 'Not provided'}</div>
                    </div>
                  </div>

                  {/* User Email */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--accent-color)' }}><Mail size={18} /></div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Email Address</div>
                      <div style={{ fontSize: '15px', fontWeight: 600 }}>{user.email}</div>
                    </div>
                  </div>

                  {/* User Role */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--accent-color)' }}><Shield size={18} /></div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Account Permissions</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{
                          fontSize: '11px',
                          background: user.role === 'ADMIN' ? 'var(--accent-color)' : 'var(--accent-dim)',
                          color: user.role === 'ADMIN' ? '#0b0c10' : 'var(--accent-color)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>
                          {user.role}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} style={{ color: 'var(--success-color)' }} /> Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account ID */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '4px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}><Calendar size={18} /></div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Client ID</div>
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{user.id}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: '12px', width: '100%', padding: '10px' }}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile Details
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="current-password">Current Password</label>
                <input
                  id="current-password"
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '12px', width: '100%', padding: '10px' }}
                disabled={formLoading}
              >
                {formLoading ? <span className="loading-spinner" style={{ width: '16px', height: '16px' }} /> : 'Change Password'}
              </button>
            </form>
          )}
        </section>

        {/* Right Side Column: Order History list */}
        <section className="glass" style={{ padding: '32px', borderRadius: '12px', minHeight: '400px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={22} className="accent-color" /> Order History
          </h2>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <div className="loading-spinner" />
            </div>
          ) : orders.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: 'var(--text-secondary)' }}>
              <ShoppingBag size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {orders.map((order) => (
                <div key={order.id} className="glass" style={{ padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  
                  {/* Order Meta row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Order ID</span>
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600 }}>{order.id}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Date Placed</span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </div>
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: '4px',
                        ...getStatusBadgeStyle(order.status)
                      }}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Order Items line items list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {order.items.map((item) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={item.product?.image || 'https://via.placeholder.com/150'} 
                          alt={item.product?.title || 'Product'} 
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.product?.title || 'Unknown Product'}
                          </h4>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Qty: {item.quantity} &bull; ${item.price.toFixed(2)} each
                          </span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer row with Shipping info & total */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <MapPin size={14} className="accent-color" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <span><strong>Address:</strong> {order.shippingAddress}, {order.shippingLocalAddress}, {order.shippingCity}, {order.shippingPostalCode}, {order.shippingCountry}</span>
                        <span style={{ display: 'block', marginTop: '2px' }}><strong>Contact:</strong> {order.shippingEmail} | {order.shippingPhone}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '8px' }}>
                      <div>
                        {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--error-color)', color: '#ef4444' }}
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', marginRight: '6px', fontWeight: 500 }}>Grand Total:</span>
                        <span className="accent-color">${order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default Profile;
