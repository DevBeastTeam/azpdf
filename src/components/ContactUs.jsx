import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, ArrowLeft, Building2 } from 'lucide-react';

export default function ContactUs() {
  const navigate = useNavigate();
  const onBack = () => navigate(-1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    company: '',
    teamSize: '10-50 employees',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          subject: `Sales inquiry from ${formData.company || formData.fullName}`,
          message: formData.message
        })
      });
    } catch (err) {
      console.warn('Contact API note:', err.message);
    }
    setSubmitted(true);
  };

  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: 'var(--bg-light)',
      padding: '50px 24px 80px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '1100px', width: '100%' }}>
        
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-gray)',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '30px',
            transition: 'all 0.2s'
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
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
            marginBottom: '14px'
          }}>
            Contact Sales & Support
          </span>

          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            color: 'var(--text-dark)',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>
            Talk to Our PDF Enterprise Team
          </h1>

          <p style={{
            fontSize: '16px',
            color: 'var(--text-gray)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Have questions about custom team licenses, API integration, or enterprise pricing? 
            Fill out the form and our specialist will reach out within 2 hours.
          </p>
        </div>

        {/* Main Grid: Form + Contact Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'start'
        }}>
          
          {/* Left Column: Contact Form */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto'
                }}>
                  <CheckCircle2 size={36} color="#15803d" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '10px' }}>
                  Message Sent Successfully!
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '24px' }}>
                  Thank you for reaching out. Our enterprise sales manager has received your request and will contact you at <strong>{formData.email || 'your email'}</strong> shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--primary-red)',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-dark)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-dark)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-dark)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-dark)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>
                      Team Size
                    </label>
                    <select
                      value={formData.teamSize}
                      onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        fontSize: '14px',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-dark)',
                        outline: 'none'
                      }}
                    >
                      <option>1-10 employees</option>
                      <option>10-50 employees</option>
                      <option>50-250 employees</option>
                      <option>250+ employees</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>
                    How can we help your team? *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your PDF workflow requirements, expected monthly document volume, or custom API needs..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-dark)',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    marginTop: '10px',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'var(--primary-red)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 8px 20px rgba(229, 36, 36, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Send size={18} /> Send Message to Sales
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Contact Info Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '20px' }}>
                Contact Information
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'var(--border-light)', borderRadius: '10px', color: 'var(--primary-red)' }}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: '600' }}>Sales & Enterprise Support</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-dark)', fontWeight: '700' }}>sales@ilovepdf.com</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'var(--border-light)', borderRadius: '10px', color: 'var(--primary-red)' }}>
                    <Phone size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: '600' }}>Direct Sales Hotline</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-dark)', fontWeight: '700' }}>+1 (800) 555-PDFS</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'var(--border-light)', borderRadius: '10px', color: 'var(--primary-red)' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: '600' }}>Average Response Time</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-dark)', fontWeight: '700' }}>Under 2 hours (Mon - Fri)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enterprise Perks Box */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Building2 size={22} color="var(--primary-red)" />
                <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>Why iLovePDF Enterprise?</h4>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-gray)' }}>
                <li>✓ Dedicated SAML Single Sign-On (SSO)</li>
                <li>✓ Custom SLA & Dedicated Account Manager</li>
                <li>✓ Enterprise Security & Audit Logging</li>
                <li>✓ Unlimited API & Batch Document Processing</li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
