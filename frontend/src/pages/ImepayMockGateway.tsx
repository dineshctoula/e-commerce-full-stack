import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet, Smartphone, ShieldCheck, HelpCircle } from 'lucide-react';

export const ImepayMockGateway: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '0.00';

  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'login' | 'otp' | 'paying'>('login');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mobileNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1200);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length < 4) {
      setError('Please enter the 4-digit OTP sent to your mobile.');
      return;
    }

    setStep('paying');
    setLoading(true);

    setTimeout(() => {
      const mockRefId = `IMEPAY_REF_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const successUrl = `${window.location.origin}/payment/imepay/success?orderId=${orderId}&refId=${mockRefId}`;
      window.location.href = successUrl;
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh', backgroundColor: '#0c0d12', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255, 68, 0, 0.15)', backgroundColor: '#141620' }}>
        {/* Header Banner representing IME Pay Brand */}
        <div style={{ padding: '24px', background: 'linear-gradient(135deg, #ff4500 0%, #d02c00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={24} />
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px' }}>IME pay</span>
            <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}>SIMULATOR</span>
          </div>
          <HelpCircle size={20} style={{ opacity: 0.8, cursor: 'pointer' }} />
        </div>

        {/* Merchant & Amount Information */}
        <div style={{ backgroundColor: '#1e2230', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#ff8c69', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Merchant</span>
            <strong style={{ fontSize: '15px', color: 'white' }}>Hamro Pasal E-Shop</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Amount</span>
            <strong style={{ fontSize: '18px', color: '#ff4500' }}>Rs. {amount}</strong>
          </div>
        </div>

        <div style={{ padding: '32px 24px' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'left' }}>
              {error}
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Smartphone size={20} color="#ff4500" />
                <h3 style={{ margin: 0, fontSize: '16px', color: 'white', fontWeight: 600 }}>Mobile Wallet Authentication</h3>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>IME Pay Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="98XXXXXXXX"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1e2230', color: 'white', fontSize: '15px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>4-Digit Wallet PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1e2230', color: 'white', fontSize: '18px', letterSpacing: '4px', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#ff4500', color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Wallet'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <ShieldCheck size={20} color="#ff4500" />
                <h3 style={{ margin: 0, fontSize: '16px', color: 'white', fontWeight: 600 }}>Enter Verification OTP</h3>
              </div>

              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>
                A simulated verification code has been dispatched to <strong style={{ color: 'white' }}>{mobileNumber}</strong>. Enter any 4-digit code to authorize the payment.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontWeight: 600 }}>One-Time Password (OTP)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="XXXX"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#1e2230', color: 'white', fontSize: '18px', letterSpacing: '8px', textAlign: 'center', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#ff4500', color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                {loading ? 'Confirming Payment...' : `Pay Rs. ${amount}`}
              </button>
            </form>
          )}

          {step === 'paying' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '16px' }}>
              <div style={{ border: '4px solid rgba(255,69,0,0.1)', borderTop: '4px solid #ff4500', width: '48px', height: '48px', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'white', fontWeight: 600 }}>Authorizing Transaction</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
                Securing connection with bank server... Please do not go back or refresh the page.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ padding: '16px', backgroundColor: '#0e1017', fontSize: '11px', color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          Secured by IME Pay checkout engine. This is a sandbox testing interface.
        </div>
      </div>
    </div>
  );
};
