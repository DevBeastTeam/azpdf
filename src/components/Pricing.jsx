import React, { useState } from 'react';
import { Check, Zap, Shield, Sparkles, Building2, HelpCircle } from 'lucide-react';

export default function Pricing({ onContactSales, siteContent }) {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="pricing-section" style={{
      padding: '80px 24px',
      backgroundColor: 'var(--bg-light)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      borderTop: '1px solid var(--border-light)'
    }}>
      <div style={{ maxWidth: '1200px', width: '100%', textAlign: 'center' }}>
        
        {/* Category Badge */}
        <span style={{
          fontSize: '12px',
          fontWeight: '800',
          letterSpacing: '1.2px',
          color: 'var(--primary-red)',
          textTransform: 'uppercase',
          backgroundColor: 'var(--border-light)',
          padding: '6px 14px',
          borderRadius: '20px',
          display: 'inline-block',
          marginBottom: '16px'
        }}>
          {siteContent?.pricingBadge || 'Simple & Transparent Pricing'}
        </span>

        {/* Section Heading */}
        <h2 style={{
          fontSize: '36px',
          fontWeight: '800',
          color: 'var(--text-dark)',
          marginBottom: '12px',
          letterSpacing: '-0.5px'
        }}>
          {siteContent?.pricingTitle || 'Choose the Right Plan for Your PDF Needs'}
        </h2>

        <p style={{
          fontSize: '16px',
          color: 'var(--text-gray)',
          maxWidth: '640px',
          margin: '0 auto 36px auto',
          lineHeight: '1.6'
        }}>
          {siteContent?.pricingSubtitle || 'Work seamlessly with all PDF tools. Get unlimited processing, high-speed OCR, digital e-signatures, and batch file support.'}
        </p>

        {/* Monthly / Yearly Billing Toggle */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'var(--border-light)',
          padding: '4px',
          borderRadius: '30px',
          marginBottom: '50px'
        }}>
          <button
            onClick={() => setIsYearly(false)}
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: !isYearly ? 'var(--bg-card)' : 'transparent',
              color: !isYearly ? 'var(--text-dark)' : 'var(--text-gray)',
              boxShadow: !isYearly ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Monthly Billed
          </button>
          
          <button
            onClick={() => setIsYearly(true)}
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: isYearly ? 'var(--bg-card)' : 'transparent',
              color: isYearly ? 'var(--text-dark)' : 'var(--text-gray)',
              boxShadow: isYearly ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Yearly Billed
            <span style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '12px'
            }}>
              SAVE 20%
            </span>
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          textAlign: 'left',
          alignItems: 'stretch'
        }}>
          
          {/* Card 1: Free Plan */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '20px',
            padding: '36px 30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: 'var(--bg-light)', borderRadius: '10px' }}>
                  <Shield size={20} color="var(--text-gray)" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)' }}>{siteContent?.freePlanTitle || 'Free'}</h3>
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-gray)', marginBottom: '24px', minHeight: '40px' }}>
                {siteContent?.freePlanDesc || 'Essential PDF tools for quick tasks and light usage.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                <span style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-dark)' }}>$0</span>
                <span style={{ fontSize: '14px', color: 'var(--text-light-gray)' }}>/ forever</span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: '24px' }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="#10b981" /> Access to standard web tools
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="#10b981" /> Up to 15MB file upload limit
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="#10b981" /> Process 2 files per batch
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="#10b981" /> Standard 256-bit SSL security
                </li>
              </ul>
            </div>

            <button style={{
              marginTop: '36px',
              padding: '14px',
              width: '100%',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-gray)',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              Get Started Free
            </button>
          </div>

          {/* Card 2: Premium Plan (Featured) */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '2px solid var(--primary-red)',
            borderRadius: '20px',
            padding: '36px 30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(229, 36, 36, 0.12)',
            transform: 'scale(1.02)'
          }}>
            {/* Top Recommended Tag */}
            <div style={{
              position: 'absolute',
              top: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--primary-red)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '1px',
              padding: '5px 16px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Sparkles size={13} /> MOST POPULAR
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: '#fff1f2', borderRadius: '10px' }}>
                  <Zap size={20} color="var(--primary-red)" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)' }}>{siteContent?.premiumPlanTitle || 'Premium'}</h3>
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-gray)', marginBottom: '24px', minHeight: '40px' }}>
                {siteContent?.premiumPlanDesc || 'Complete access, unlimited processing, OCR speed, and zero ads.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                <span style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-dark)' }}>
                  ${isYearly ? '4' : '6'}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-light-gray)' }}>/ month</span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: '24px' }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-dark)', fontWeight: '600' }}>
                  <Check size={18} color="var(--primary-red)" /> Unlimited PDF processing
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-dark)', fontWeight: '600' }}>
                  <Check size={18} color="var(--primary-red)" /> Up to 4GB file size limit
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-dark)', fontWeight: '600' }}>
                  <Check size={18} color="var(--primary-red)" /> High-speed OCR text recognition
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="var(--primary-red)" /> Batch process 100 files at once
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="var(--primary-red)" /> Digital e-Signatures & Security
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="var(--primary-red)" /> 100% Ad-free experience
                </li>
              </ul>
            </div>

            <button style={{
              marginTop: '36px',
              padding: '14px',
              width: '100%',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'var(--primary-red)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(229, 36, 36, 0.3)',
              transition: 'all 0.2s'
            }}>
              Go Premium (7 Days Free)
            </button>
          </div>

          {/* Card 3: Business Plan */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '20px',
            padding: '36px 30px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '10px' }}>
                  <Building2 size={20} color="#2563eb" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)' }}>{siteContent?.businessPlanTitle || 'Business'}</h3>
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-gray)', marginBottom: '24px', minHeight: '40px' }}>
                {siteContent?.businessPlanDesc || 'Custom workflow tools and team license management.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                <span style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-dark)' }}>
                  ${isYearly ? '8' : '10'}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-light-gray)' }}>/ user / mo</span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: '24px' }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="#2563eb" /> Everything in Premium
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="#2563eb" /> Multi-user team management
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="#2563eb" /> Single Sign-On (SAML SSO)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="#2563eb" /> Dedicated account manager
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-gray)' }}>
                  <Check size={18} color="#2563eb" /> 24/7 VIP priority support
                </li>
              </ul>
            </div>

            <button 
              onClick={onContactSales}
              style={{
                marginTop: '36px',
                padding: '14px',
                width: '100%',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-gray)',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Contact Sales
            </button>
          </div>

        </div>

        {/* Trust & Guarantees Bar */}
        <div id="faq" style={{
          marginTop: '60px',
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '40px',
          paddingTop: '30px',
          borderTop: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-gray)', fontSize: '14px', fontWeight: '500' }}>
            <Shield size={18} color="var(--primary-red)" /> 256-Bit SSL Encrypted & Secure
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-gray)', fontSize: '14px', fontWeight: '500' }}>
            <HelpCircle size={18} color="var(--primary-red)" /> Cancel Subscription Anytime
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-gray)', fontSize: '14px', fontWeight: '500' }}>
            <Sparkles size={18} color="var(--primary-red)" /> 7-Day Money Back Guarantee
          </div>
        </div>

      </div>
    </section>
  );
}
