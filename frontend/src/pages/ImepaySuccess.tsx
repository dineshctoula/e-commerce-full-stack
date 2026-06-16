import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/orders';
import { CheckCircle, AlertTriangle, Loader } from 'lucide-react';

export const ImepaySuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmImepayPayment, error } = useOrderStore();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  const orderId = searchParams.get('orderId');
  const refId = searchParams.get('refId');

  useEffect(() => {
    const verify = async () => {
      if (!orderId || !refId) {
        setStatus('error');
        setErrorMessage('Missing order ID or transaction reference parameter.');
        return;
      }

      try {
        const success = await confirmImepayPayment(orderId, refId);
        if (success) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage('Payment confirmation failed. Transaction could not be verified on our server.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred during confirmation.');
      }
    };

    verify();
  }, [orderId, refId, confirmImepayPayment]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '80vh', alignItems: 'center', padding: '24px' }}>
      <section className="glass" style={{ padding: '48px', borderRadius: '12px', textAlign: 'center', maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {status === 'verifying' && (
          <>
            <Loader className="spinner" size={64} style={{ color: 'var(--accent-color)', marginBottom: '24px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Verifying IME Pay Payment</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Please wait while we confirm your transaction status with the IME Pay servers.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={64} style={{ color: '#10b981', marginBottom: '24px' }} />
            <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '12px' }}>Payment Successful!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px', lineHeight: 1.6 }}>
              Your IME Pay payment was successfully processed. Your order status is now updated to processing.
            </p>
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/profile')}>
                View Order History
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/shop')}>
                Continue Shopping
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertTriangle size={64} style={{ color: '#ef4444', marginBottom: '24px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Verification Failed</h2>
            <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6, fontWeight: 500 }}>
              {errorMessage || error || 'Something went wrong.'}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '32px', lineHeight: 1.6 }}>
              If you believe this is an error and your wallet balance was debited, please contact customer support.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/profile')}>
              Go to Profile
            </button>
          </>
        )}
      </section>
    </div>
  );
};
