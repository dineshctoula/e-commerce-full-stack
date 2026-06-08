import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cart';
import { useOrderStore } from '../store/orders';
import { MapPin, CreditCard, CheckCircle, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

/**
 * CheckoutContent Component.
 * Implements step-by-step wizard forms (Shipping information, Review, Payment integration, Order complete screen).
 * Connects with Stripe React hooks to confirm payments securely.
 */
const CheckoutContent: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  const { createOrder, loading, error, clearError, createPaymentIntent, confirmPayment: confirmOrderPayment } = useOrderStore();
  const stripe = useStripe();
  const elements = useElements();

  // Active step state: 1 = Shipping, 2 = Review, 3 = Success
  const [step, setStep] = useState<number>(1);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Form states for Shipping details
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '', // Used for frontend display/review
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: '',
    shippingPhone: '',
    shippingEmail: '',
    shippingLocalAddress: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>('card');

  // Compute pricing totals (matching backend expectations)
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  // Validate form details
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!shippingDetails.fullName.trim()) errors.fullName = 'Full name is required';
    if (!shippingDetails.shippingAddress.trim()) errors.shippingAddress = 'Address is required';
    if (!shippingDetails.shippingCity.trim()) errors.shippingCity = 'City is required';
    if (!shippingDetails.shippingPostalCode.trim()) errors.shippingPostalCode = 'Postal/Zip code is required';
    if (!shippingDetails.shippingCountry.trim()) errors.shippingCountry = 'Country is required';
    if (!shippingDetails.shippingPhone.trim()) errors.shippingPhone = 'Phone number is required';
    if (!shippingDetails.shippingEmail.trim()) {
      errors.shippingEmail = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(shippingDetails.shippingEmail)) {
      errors.shippingEmail = 'Please enter a valid email address';
    }
    if (!shippingDetails.shippingLocalAddress.trim()) errors.shippingLocalAddress = 'Local address detail is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1: Submit Shipping details
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (validateForm()) {
      setStep(2); // Proceed to Review step
    }
  };

  // Step 2: Confirm and Place Order
  const handlePlaceOrder = async () => {
    clearError();
    setPaymentLoading(true);

    try {
      // 1. Map and create the pending order
      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const orderResult = await createOrder(orderItems, {
        shippingAddress: shippingDetails.shippingAddress,
        shippingCity: shippingDetails.shippingCity,
        shippingPostalCode: shippingDetails.shippingPostalCode,
        shippingCountry: shippingDetails.shippingCountry,
        shippingPhone: shippingDetails.shippingPhone,
        shippingEmail: shippingDetails.shippingEmail,
        shippingLocalAddress: shippingDetails.shippingLocalAddress,
      });

      if (!orderResult) {
        setPaymentLoading(false);
        return;
      }

      // If COD, bypass Stripe
      if (paymentMethod === 'cod') {
        setCreatedOrderId(orderResult.id);
        clearCart();
        setStep(3);
        setPaymentLoading(false);
        return;
      }

      // If Card payment, process with Stripe
      if (!stripe || !elements) {
        throw new Error('Stripe has not loaded yet.');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found.');
      }

      // 2. Request PaymentIntent clientSecret from backend
      const intentResult = await createPaymentIntent(orderResult.id);
      if (!intentResult) {
        throw new Error('Failed to create Stripe payment intent.');
      }

      // 3. Confirm card payment with Stripe
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(
        intentResult.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: shippingDetails.fullName,
              email: shippingDetails.shippingEmail,
              phone: shippingDetails.shippingPhone,
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment confirmation failed with Stripe.');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // 4. Confirm payment status on the backend to update order to PROCESSING
        const confirmResult = await confirmOrderPayment(orderResult.id, paymentIntent.id);
        if (confirmResult) {
          setCreatedOrderId(orderResult.id);
          clearCart();
          setStep(3);
        } else {
          throw new Error('Payment succeeded, but failed to confirm order status on server.');
        }
      } else {
        throw new Error('Payment status did not succeed.');
      }
    } catch (err: any) {
      useOrderStore.setState({ error: err.message || 'Payment processing failed.' });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Direct rendering guards
  if (cart.length === 0 && step !== 3) {
    return (
      <div className="container main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="glass" style={{ padding: '40px', borderRadius: '12px', textAlign: 'center', maxWidth: '450px' }}>
          <ShoppingBag size={48} className="accent-color" style={{ marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '12px' }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Add products from our catalog to your cart before proceeding to checkout.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/shop')}>
            Go to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container main-content">
      {/* Checkout Page Header & Progress Tracker */}
      <header style={{ marginBottom: '32px', textAlign: 'left' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>Checkout</h1>
        
        {/* Visual Progress Steps */}
        <div className="checkout-progress-steps glass" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderRadius: '8px' }}>
          <div className={`step-indicator ${step >= 1 ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
            <span className="step-num">1</span> Shipping Details
          </div>
          <div className="step-connector" style={{ flex: 1, height: '2px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 16px', alignSelf: 'center' }} />
          <div className={`step-indicator ${step >= 2 ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
            <span className="step-num">2</span> Order Review
          </div>
          <div className="step-connector" style={{ flex: 1, height: '2px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 16px', alignSelf: 'center' }} />
          <div className={`step-indicator ${step >= 3 ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
            <span className="step-num">3</span> Confirmation
          </div>
        </div>
      </header>

      {/* Render Backend Errors if present */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '24px', padding: '12px 16px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', textAlign: 'left' }}>
          {error}
        </div>
      )}

      {/* STEP 1: SHIPPING INFORMATION */}
      {step === 1 && (
        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', textAlign: 'left' }}>
          {/* Shipping Details Form */}
          <section className="glass" style={{ padding: '32px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} className="accent-color" /> Shipping Address
            </h2>
            
            <form onSubmit={handleShippingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label htmlFor="fullName" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Recipient's Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  className={`form-input ${formErrors.fullName ? 'error' : ''}`}
                  value={shippingDetails.fullName}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, fullName: e.target.value })}
                  placeholder="John Doe"
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
                {formErrors.fullName && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.fullName}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="shippingEmail" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Email Address</label>
                  <input
                    type="email"
                    id="shippingEmail"
                    className={`form-input ${formErrors.shippingEmail ? 'error' : ''}`}
                    value={shippingDetails.shippingEmail}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, shippingEmail: e.target.value })}
                    placeholder="john@example.com"
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                  />
                  {formErrors.shippingEmail && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.shippingEmail}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="shippingPhone" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Phone Number</label>
                  <input
                    type="tel"
                    id="shippingPhone"
                    className={`form-input ${formErrors.shippingPhone ? 'error' : ''}`}
                    value={shippingDetails.shippingPhone}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, shippingPhone: e.target.value })}
                    placeholder="+1 (555) 019-9234"
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                  />
                  {formErrors.shippingPhone && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.shippingPhone}</p>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="shippingAddress" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Street Address</label>
                <input
                  type="text"
                  id="shippingAddress"
                  className={`form-input ${formErrors.shippingAddress ? 'error' : ''}`}
                  value={shippingDetails.shippingAddress}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, shippingAddress: e.target.value })}
                  placeholder="123 Main St"
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
                {formErrors.shippingAddress && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.shippingAddress}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="shippingLocalAddress" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Local Address (Apartment, unit, suite, building, floor, etc.)</label>
                <input
                  type="text"
                  id="shippingLocalAddress"
                  className={`form-input ${formErrors.shippingLocalAddress ? 'error' : ''}`}
                  value={shippingDetails.shippingLocalAddress}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, shippingLocalAddress: e.target.value })}
                  placeholder="Apt 4B, Building C"
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
                {formErrors.shippingLocalAddress && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.shippingLocalAddress}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="shippingCity" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>City</label>
                  <input
                    type="text"
                    id="shippingCity"
                    className={`form-input ${formErrors.shippingCity ? 'error' : ''}`}
                    value={shippingDetails.shippingCity}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, shippingCity: e.target.value })}
                    placeholder="Metropolis"
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                  />
                  {formErrors.shippingCity && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.shippingCity}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="shippingPostalCode" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Postal / ZIP Code</label>
                  <input
                    type="text"
                    id="shippingPostalCode"
                    className={`form-input ${formErrors.shippingPostalCode ? 'error' : ''}`}
                    value={shippingDetails.shippingPostalCode}
                    onChange={(e) => setShippingDetails({ ...shippingDetails, shippingPostalCode: e.target.value })}
                    placeholder="10001"
                    style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                  />
                  {formErrors.shippingPostalCode && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.shippingPostalCode}</p>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="shippingCountry" style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>Country</label>
                <input
                  type="text"
                  id="shippingCountry"
                  className={`form-input ${formErrors.shippingCountry ? 'error' : ''}`}
                  value={shippingDetails.shippingCountry}
                  onChange={(e) => setShippingDetails({ ...shippingDetails, shippingCountry: e.target.value })}
                  placeholder="United States"
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
                {formErrors.shippingCountry && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{formErrors.shippingCountry}</p>}
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', padding: '14px', justifyContent: 'center' }}>
                Review Order <ArrowRight size={18} style={{ marginLeft: '8px' }} />
              </button>
            </form>
          </section>

          {/* Cart Summary Column */}
          <aside className="glass" style={{ padding: '32px', borderRadius: '12px', height: 'fit-content' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Items Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto', marginBottom: '24px', paddingRight: '4px' }}>
              {cart.map((item) => (
                <div key={item.product.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={item.product.image || ''} alt={item.product.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.title}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Qty: {item.quantity} &bull; ${item.product.price.toFixed(2)}</p>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Estimated Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <span>Total</span>
                <span className="accent-color">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* STEP 2: ORDER REVIEW & PAYMENT */}
      {step === 2 && (
        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Review Shipping Info */}
            <section className="glass" style={{ padding: '32px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={20} className="accent-color" /> Shipping Details
              </h2>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                <p><strong style={{ color: 'white' }}>Recipient:</strong> {shippingDetails.fullName}</p>
                <p><strong style={{ color: 'white' }}>Email:</strong> {shippingDetails.shippingEmail}</p>
                <p><strong style={{ color: 'white' }}>Phone:</strong> {shippingDetails.shippingPhone}</p>
                <p><strong style={{ color: 'white' }}>Street Address:</strong> {shippingDetails.shippingAddress}</p>
                <p><strong style={{ color: 'white' }}>Local Detail:</strong> {shippingDetails.shippingLocalAddress}</p>
                <p><strong style={{ color: 'white' }}>City & Zip:</strong> {shippingDetails.shippingCity}, {shippingDetails.shippingPostalCode}</p>
                <p><strong style={{ color: 'white' }}>Country:</strong> {shippingDetails.shippingCountry}</p>
              </div>
              <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ marginTop: '16px', padding: '6px 12px', fontSize: '12px' }}>
                Edit Details
              </button>
            </section>

            {/* Dummy Payment Selection */}
            <section className="glass" style={{ padding: '32px', borderRadius: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} className="accent-color" /> Payment Method
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className={`payment-option glass ${paymentMethod === 'card' ? 'selected' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', backgroundColor: paymentMethod === 'card' ? 'rgba(255, 255, 255, 0.05)' : 'transparent' }}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>Stripe Secure Card Payment</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pay safely using Stripe elements.</span>
                  </div>
                </label>

                {paymentMethod === 'card' && (
                  <div className="glass" style={{ padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Card Details
                    </label>
                    <div style={{
                      padding: '12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <CardElement options={{
                        style: {
                          base: {
                            color: '#ffffff',
                            fontFamily: 'Inter, sans-serif',
                            fontSmoothing: 'antialiased',
                            fontSize: '15px',
                            '::placeholder': {
                              color: 'rgba(255,255,255,0.3)',
                            },
                          },
                          invalid: {
                            color: '#ef4444',
                            iconColor: '#ef4444',
                          },
                        },
                      }} />
                    </div>
                  </div>
                )}
                
                <label className={`payment-option glass ${paymentMethod === 'cod' ? 'selected' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', backgroundColor: paymentMethod === 'cod' ? 'rgba(255, 255, 255, 0.05)' : 'transparent' }}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>Cash on Delivery (COD)</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pay cash when your shipment is delivered.</span>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Pricing Totals & Confirmation Button */}
          <aside className="glass" style={{ padding: '32px', borderRadius: '12px', height: 'fit-content' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Order Total</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Estimated Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <span>Grand Total</span>
                <span className="accent-color">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="btn btn-primary"
                onClick={handlePlaceOrder}
                disabled={loading || paymentLoading}
                style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
              >
                {loading || paymentLoading ? 'Processing...' : 'Confirm & Place Order'}
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                disabled={loading || paymentLoading}
                style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
              >
                <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Shipping
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* STEP 3: SUCCESS CONFIRMATION */}
      {step === 3 && (
        <div style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
          <section className="glass" style={{ padding: '48px', borderRadius: '12px', textAlign: 'center', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircle size={64} style={{ color: '#10b981', marginBottom: '24px' }} />
            <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '12px' }}>Order Placed Successfully!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
              Thank you for your purchase. We have received your order and are processing it.
            </p>
            
            <div className="glass" style={{ width: '100%', padding: '16px', borderRadius: '8px', marginBottom: '32px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Order Reference ID</span>
              <strong style={{ fontSize: '15px', color: 'var(--accent-color)', fontFamily: 'monospace' }}>{createdOrderId}</strong>
            </div>

            <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/profile')}>
                View Order History
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/shop')}>
                Continue Shopping
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

/**
 * Checkout Component.
 * Wraps CheckoutContent inside Stripe Elements context to load payment input card APIs.
 */
export const Checkout: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent />
    </Elements>
  );
};

export default Checkout;
