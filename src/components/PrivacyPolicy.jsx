import React from 'react';
import { ArrowLeft, Shield, Eye, Database, Cookie, UserCheck, Lock, Mail } from 'lucide-react';

export default function PrivacyPolicy({ onBack }) {
  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 64px)', backgroundColor: '#f8f9fc', padding: '48px 24px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '820px', width: '100%' }}>

        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', color: '#374151', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '48px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{ padding: '10px', backgroundColor: '#fff1f2', borderRadius: '12px' }}>
              <Shield size={24} color="var(--primary-red)" />
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#111827' }}>Privacy Policy</h1>
          </div>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '36px' }}>Last updated: July 20, 2026 · We value your privacy and are committed to protecting your personal data.</p>

          <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', marginBottom: '36px' }} />

          {/* Highlights row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            {[
              { icon: <Lock size={20} />, label: '256-Bit Encryption', desc: 'All uploads are SSL encrypted in transit' },
              { icon: <Database size={20} />, label: 'Auto File Delete', desc: 'Files deleted within 2 hours of processing' },
              { icon: <UserCheck size={20} />, label: 'No Selling Data', desc: 'We never sell your personal data to third parties' },
              { icon: <Eye size={20} />, label: 'Full Transparency', desc: 'Clear information about what data we collect' }
            ].map((item, i) => (
              <div key={i} style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #f3f4f6' }}>
                <span style={{ color: 'var(--primary-red)' }}>{item.icon}</span>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#111827' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.desc}</div>
              </div>
            ))}
          </div>

          {[
            {
              icon: <Database size={20} />,
              title: '1. Information We Collect',
              body: `We collect the following types of information when you use iLovePDF:

• Account Information: Name, email address, and password when you register for an account.
• Usage Data: Pages processed, tools used, file sizes, and timestamps — used to improve our service.
• Uploaded Files: Temporarily stored only during processing. Files are permanently deleted within 2 hours.
• Device & Browser Data: IP address, browser type, operating system — used for security and analytics.
• Payment Information: Processed securely by our payment provider (Stripe). We do not store card details.`
            },
            {
              icon: <Eye size={20} />,
              title: '2. How We Use Your Information',
              body: `Your information is used exclusively for:

• Providing and improving our PDF processing services.
• Processing transactions and managing your subscription.
• Sending account-related communications (receipts, security alerts).
• Analyzing aggregate usage data to enhance performance (never individual file content).
• Complying with legal obligations and preventing fraud.`
            },
            {
              icon: <UserCheck size={20} />,
              title: '3. Information Sharing',
              body: `We do not sell, trade, or share your personal data with third parties except:

• Service Providers: Trusted partners (e.g. payment processors, cloud infrastructure) who assist in our operations under strict confidentiality agreements.
• Legal Requirements: When required by law, court order, or governmental authority.
• Business Transfers: In the event of a merger or acquisition, with equivalent privacy protections.`
            },
            {
              icon: <Lock size={20} />,
              title: '4. Data Security',
              body: `We implement industry-standard security measures including:

• 256-bit SSL/TLS encryption for all data transmissions.
• Automatic deletion of uploaded files within 2 hours of processing.
• Access controls limiting staff access to personal data.
• Regular security audits and vulnerability assessments.

No method of transmission or storage is 100% secure. In the event of a data breach affecting your rights, we will notify you within 72 hours as required by GDPR.`
            },
            {
              icon: <Cookie size={20} />,
              title: '5. Cookies & Tracking',
              body: `We use cookies to:

• Keep you logged in to your account (session cookies).
• Remember your language and display preferences.
• Analyze usage patterns through anonymized analytics (Google Analytics with IP anonymization enabled).

You can disable cookies through your browser settings, but some features may not function correctly. We do not use cookies for advertising or cross-site tracking.`
            },
            {
              icon: <Shield size={20} />,
              title: '6. Your Rights (GDPR & CCPA)',
              body: `Depending on your location, you have the following rights:

• Right to Access: Request a copy of your personal data.
• Right to Rectification: Correct inaccurate or incomplete data.
• Right to Erasure: Request deletion of your account and associated data.
• Right to Portability: Receive your data in a machine-readable format.
• Right to Object: Opt out of certain types of data processing.

To exercise these rights, contact us at privacy@ilovepdf.com. We will respond within 30 days.`
            },
            {
              icon: <Mail size={20} />,
              title: '7. Contact Our Privacy Team',
              body: `For any privacy-related questions, requests, or complaints, please contact:

Data Protection Officer: privacy@ilovepdf.com
Legal Department: legal@ilovepdf.com
Postal: iLovePDF S.L., Barcelona, Spain

We take all privacy concerns seriously and will respond to your inquiry within 72 hours.`
            }
          ].map((section, i) => (
            <div key={i} style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--primary-red)' }}>{section.icon}</span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>{section.title}</h2>
              </div>
              <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.8', whiteSpace: 'pre-line' }}>{section.body}</p>
            </div>
          ))}

          <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px 24px', borderLeft: '4px solid var(--primary-red)' }}>
            <p style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>
              Privacy questions? Contact us at <a href="mailto:privacy@ilovepdf.com" style={{ color: 'var(--primary-red)', textDecoration: 'none' }}>privacy@ilovepdf.com</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
