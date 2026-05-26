import React from 'react';
import { useAuthStore } from '../store/auth';
import { User, Mail, Shield, CheckCircle, Calendar } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>No user profile found.</h2>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '640px' }}>
      <div className="auth-card glass" style={{ maxWidth: '100%', padding: '40px', textAlign: 'left' }}>
        
        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-dim)',
            color: 'var(--accent-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <User size={32} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800 }}>
              User Profile
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Manage your personal security and account settings
            </p>
          </div>
        </div>

        {/* Profile Details List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* User Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: 'var(--accent-color)' }}><User size={20} /></div>
            <div style={{ flexGrow: 1 }}>
              <div className="form-label" style={{ marginBottom: '2px', color: 'var(--text-secondary)' }}>Full Name</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{user.name || 'Not provided'}</div>
            </div>
          </div>

          {/* User Email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: 'var(--accent-color)' }}><Mail size={20} /></div>
            <div style={{ flexGrow: 1 }}>
              <div className="form-label" style={{ marginBottom: '2px', color: 'var(--text-secondary)' }}>Email Address</div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{user.email}</div>
            </div>
          </div>

          {/* User Role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: 'var(--accent-color)' }}><Shield size={20} /></div>
            <div style={{ flexGrow: 1 }}>
              <div className="form-label" style={{ marginBottom: '2px', color: 'var(--text-secondary)' }}>Account Permissions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '13px',
                  background: user.role === 'ADMIN' ? 'var(--accent-color)' : 'var(--accent-dim)',
                  color: user.role === 'ADMIN' ? '#0b0c10' : 'var(--accent-color)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: 700
                }}>
                  {user.role}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} style={{ color: 'var(--success-color)' }} /> Verified Account
                </span>
              </div>
            </div>
          </div>

          {/* Account ID */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '8px' }}>
            <div style={{ color: 'var(--text-secondary)' }}><Calendar size={20} /></div>
            <div style={{ flexGrow: 1 }}>
              <div className="form-label" style={{ marginBottom: '2px', color: 'var(--text-secondary)' }}>Unique Client ID</div>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{user.id}</div>
            </div>
          </div>

        </div>

        {/* Dummy/Interactive Control Settings */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ flex: 1 }} 
            onClick={() => alert('Profile editing is coming in Day 5!')}
          >
            Edit Profile
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ flex: 1 }}
            onClick={() => alert('Password resetting is coming in Day 5!')}
          >
            Reset Password
          </button>
        </div>

      </div>
    </div>
  );
};
export default Profile;
