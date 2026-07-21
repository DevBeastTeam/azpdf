import React from 'react';
import { ArrowLeft, Shield, FileText, Eye, Lock, Bell, Trash2, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsAndConditions() {
  const navigate = useNavigate();
  const onBack = () => navigate(-1);
  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-light)', padding: '48px 24px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '820px', width: '100%' }}>

        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-gray)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '48px', boxShadow: 'var(--shadow-sm)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--border-light)', borderRadius: '12px' }}>
              <FileText size={24} color="var(--primary-red)" />
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-dark)' }}>Terms and Conditions</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-light-gray)', marginBottom: '36px' }}>Last updated: July 20, 2026 · Effective immediately</p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: '36px' }} />

          {[
            {
              icon: <Globe size={20} />,
              title: '1. Acceptance of Terms',
              body: `By accessing or using iLovePDF ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service. These terms apply to all users including visitors, free users, and premium subscribers.`
            },
            {
              icon: <FileText size={20} />,
              title: '2. Description of Service',
              body: `iLovePDF provides online PDF processing tools including but not limited to: merging, splitting, compressing, converting, rotating, watermarking, protecting, and extracting text from PDF documents. The Service is provided "as is" and may be updated or modified at any time without prior notice.`
            },
            {
              icon: <Lock size={20} />,
              title: '3. User Responsibilities',
              body: `You are solely responsible for the files you upload and process through the Service. You agree not to upload files that contain illegal content, malware, copyrighted materials you do not own, or any content that violates applicable laws. You are responsible for maintaining the confidentiality of your account credentials.`
            },
            {
              icon: <Eye size={20} />,
              title: '4. Intellectual Property',
              body: `All content, design, code, logos, and trademarks on iLovePDF are the exclusive property of iLovePDF. You may not copy, reproduce, distribute, or create derivative works from our Service without express written permission. Your uploaded files remain your intellectual property — we do not claim ownership.`
            },
            {
              icon: <Shield size={20} />,
              title: '5. Data Retention & File Deletion',
              body: `Uploaded files are automatically and permanently deleted from our servers within 2 hours of processing. We do not store, share, or sell your file content. Premium accounts with cloud storage retain files as per their plan settings, which can be managed in the account dashboard.`
            },
            {
              icon: <Bell size={20} />,
              title: '6. Disclaimer of Warranties',
              body: `The Service is provided without any warranty of any kind, express or implied. iLovePDF does not guarantee uninterrupted service availability, accuracy of processing results, or fitness for a particular purpose. Use of the Service is at your own risk.`
            },
            {
              icon: <Trash2 size={20} />,
              title: '7. Limitation of Liability',
              body: `iLovePDF shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of the Service. In no event shall our total liability exceed the amount paid by you to iLovePDF in the 12 months prior to the claim.`
            },
            {
              icon: <Globe size={20} />,
              title: '8. Governing Law & Changes',
              body: `These Terms shall be governed by the laws of Spain. We reserve the right to update these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms. We will notify registered users of significant changes via email.`
            }
          ].map((section, i) => (
            <div key={i} style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--primary-red)' }}>{section.icon}</span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>{section.title}</h2>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--text-gray)', lineHeight: '1.8' }}>{section.body}</p>
            </div>
          ))}

          <div style={{ backgroundColor: 'var(--bg-light)', borderRadius: '12px', padding: '20px 24px', borderLeft: '4px solid var(--primary-red)', marginTop: '10px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: '600' }}>
              For any questions regarding these Terms, contact us at <a href="mailto:legal@ilovepdf.com" style={{ color: 'var(--primary-red)', textDecoration: 'none' }}>legal@ilovepdf.com</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
