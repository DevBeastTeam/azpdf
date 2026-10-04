import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, CreditCard, CheckCircle2, AlertCircle, X,
  ExternalLink, User, Mail, Sparkles, Check, ArrowRight, RefreshCw, Zap
} from 'lucide-react';

export default function PaddleCheckoutModal({
  isOpen,
  onClose,
  plan,
  customerPreset = null,
  onSuccess
}) {
  const [name, setName] = useState(customerPreset?.name || 'Alex Johnson');
  const [email, setEmail] = useState(customerPreset?.email || 'alex@example.com');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [postalCode, setPostalCode] = useState('10001');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setSuccessData(null);
      setActiveTransaction(null);
      setErrorMessage('');
      setIsLoading(false);
      if (customerPreset?.name) setName(customerPreset.name);
      if (customerPreset?.email) setEmail(customerPreset.email);
    }
  }, [isOpen, plan, customerPreset]);

  if (!isOpen || !plan) return null;

  const handlePayWithPaddle = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    setLoadingStep('Connecting to Paddle Payment Gateway...');

    try {
      // 1. Create Transaction on backend Paddle endpoint
      const initRes = await fetch('/api/paddle?action=create_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          plan_name: plan.name,
          amount: plan.priceTotal || plan.priceMonth,
          customer_name: name.trim(),
          customer_email: email.trim(),
          user_id: 1
        })
      });

      const initData = await initRes.json();
      if (!initData || !initData.success) {
        throw new Error(initData?.error || 'Failed to initialize Paddle transaction.');
      }

      setActiveTransaction(initData);
      setLoadingStep('Authorizing payment with Paddle Sandbox...');

      // Small pause for realistic payment processing feel
      await new Promise(r => setTimeout(r, 1200));
      setLoadingStep('Activating subscription and generating invoice...');

      // 2. Verify and complete payment
      const verifyRes = await fetch('/api/paddle?action=verify_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txn_id: initData.txn_id,
          plan_id: plan.id,
          plan_name: plan.name,
          amount: plan.priceTotal || plan.priceMonth,
          user_id: 1
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyData || !verifyData.success) {
        throw new Error(verifyData?.error || 'Failed to verify transaction with Paddle.');
      }

      setIsLoading(false);
      setIsSuccess(true);
      setSuccessData(verifyData);

      if (onSuccess) {
        onSuccess({
          planId: plan.id,
          planName: plan.name,
          amount: plan.priceTotal || plan.priceMonth,
          invoiceId: verifyData.invoice_id,
          txnId: initData.txn_id
        });
      }
    } catch (err) {
      console.error('Paddle payment error:', err);
      setIsLoading(false);
      setErrorMessage(err.message || 'Payment processing failed. Please try again.');
    }
  };

  const handleOpenPaddleHosted = async () => {
    try {
      setIsLoading(true);
      setLoadingStep('Launching Paddle Hosted Checkout...');
      const initRes = await fetch('/api/paddle?action=create_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          plan_name: plan.name,
          amount: plan.priceTotal || plan.priceMonth,
          customer_name: name.trim(),
          customer_email: email.trim(),
          user_id: 1
        })
      });
      const initData = await initRes.json();
      setIsLoading(false);
      if (initData?.checkout_url) {
        window.open(initData.checkout_url, '_blank', 'width=800,height=750,scrollbars=yes,resizable=yes');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Could not open hosted checkout: ' + err.message);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '94vh',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          border: '1px solid #e2e8f0',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafbfc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#e52424'
            }}>
              <Lock size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                  Paddle Checkout
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: '800', backgroundColor: '#e0f2fe',
                  color: '#0284c7', padding: '2px 8px', borderRadius: '12px', letterSpacing: '0.5px'
                }}>
                  SANDBOX TESTING
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Merchant of Record & 256-Bit SSL Protection
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', padding: '6px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {isSuccess ? (
            /* Success View */
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                backgroundColor: '#dcfce7', color: '#16a34a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px auto', boxShadow: '0 10px 25px rgba(22, 163, 74, 0.2)'
              }}>
                <CheckCircle2 size={40} />
              </div>

              <span style={{
                fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                backgroundColor: '#f0fdf4', color: '#15803d', padding: '4px 14px',
                borderRadius: '20px', letterSpacing: '0.8px', border: '1px solid #bbf7d0'
              }}>
                Payment Approved
              </span>

              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '14px 0 6px 0' }}>
                Account Successfully Upgraded!
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '400px', margin: '0 auto 24px auto' }}>
                Your subscription to <strong>{plan.name}</strong> is now active. All premium vector features, high-speed OCR, and unlimited conversions are unlocked.
              </p>

              <div style={{
                backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px',
                border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Receipt / Invoice ID:</span>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{successData?.invoice_id || 'INV-2026-NEW'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Date:</span>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{successData?.invoice_date || 'Today'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Amount Paid:</span>
                  <span style={{ fontWeight: '800', color: '#16a34a' }}>{successData?.invoice_amount || `$${plan.priceTotal || plan.priceMonth}.00`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Gateway Status:</span>
                  <span style={{ fontWeight: '700', color: '#0284c7' }}>Paddle Sandbox Verified (Paid)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%', padding: '14px', borderRadius: '10px',
                  backgroundColor: '#e52424', color: '#ffffff',
                  fontWeight: '800', fontSize: '15px', border: 'none',
                  cursor: 'pointer', boxShadow: '0 8px 20px rgba(229, 36, 36, 0.25)'
                }}
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            /* Checkout Form View */
            <form onSubmit={handlePayWithPaddle}>
              {/* Plan Summary Card */}
              <div style={{
                backgroundColor: '#fff1f2',
                border: '1.5px solid #fecdd3',
                borderRadius: '14px',
                padding: '16px 18px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <span style={{
                    fontSize: '11px', fontWeight: '800', color: '#e52424',
                    textTransform: 'uppercase', letterSpacing: '0.8px'
                  }}>
                    SELECTED PLAN
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {plan.billingPeriod || 'Subscription Access'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#e52424' }}>
                    ${plan.priceTotal || plan.priceMonth}
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>.00</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>
                    ✓ Instant Activation
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div style={{
                  padding: '12px 14px', borderRadius: '8px',
                  backgroundColor: '#fee2e2', border: '1px solid #fca5a5',
                  color: '#b91c1c', fontSize: '13px', fontWeight: '600',
                  marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Customer Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '5px' }}>
                    CUSTOMER NAME
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Full legal name"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '5px' }}>
                    BILLING EMAIL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Payment Card Box (Paddle Simulator / Sandbox) */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={16} color="#e52424" />
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                      Paddle Test Card Details
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>
                    Dummy Card (Safe)
                  </span>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                    CARD NUMBER
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: '6px',
                        border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'monospace',
                        fontWeight: '700', color: '#0f172a', backgroundColor: '#ffffff'
                      }}
                    />
                    <span style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: 'translateY(-50%)', fontSize: '11px',
                      fontWeight: '800', color: '#15803d', backgroundColor: '#dcfce7',
                      padding: '2px 6px', borderRadius: '4px'
                    }}>
                      SANDBOX
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                      EXPIRY
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="MM/YY"
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: '6px',
                        border: '1px solid #cbd5e1', fontSize: '13px', textAlign: 'center',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: '6px',
                        border: '1px solid #cbd5e1', fontSize: '13px', textAlign: 'center',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                      ZIP CODE
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="10001"
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: '6px',
                        border: '1px solid #cbd5e1', fontSize: '13px', textAlign: 'center',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#e52424',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '15px',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 20px rgba(229, 36, 36, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{loadingStep || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Pay ${plan.priceTotal || plan.priceMonth}.00 with Paddle & Upgrade</span>
                  </>
                )}
              </button>

              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleOpenPaddleHosted}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#64748b', fontSize: '12px', fontWeight: '600',
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <ExternalLink size={13} /> Open Official Paddle Hosted Checkout
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>🔒 Encrypted with Paddle TLS 1.3</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>⚡ Instant Account Activation</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>📄 Auto Invoicing</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
