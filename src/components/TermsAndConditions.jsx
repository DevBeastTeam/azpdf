import React from 'react';
import { ArrowLeft, Shield, FileText, Eye, Lock, Bell, Trash2, Globe, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { defaultTermsAndConditions } from '../data/legalPagesData';

const sectionIcons = [
  <Globe key="1" size={20} />,
  <FileText key="2" size={20} />,
  <Lock key="3" size={20} />,
  <Eye key="4" size={20} />,
  <Shield key="5" size={20} />,
  <Bell key="6" size={20} />,
  <Trash2 key="7" size={20} />,
  <Scale key="8" size={20} />
];

export default function TermsAndConditions() {
  const navigate = useNavigate();
  const onBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  const context = useAppContext();
  const siteContent = context?.siteContent;
  const termsData = siteContent?.termsAndConditions || defaultTermsAndConditions;

  const title = termsData.title || defaultTermsAndConditions.title;
  const lastUpdated = termsData.lastUpdated || defaultTermsAndConditions.lastUpdated;
  const contactEmail = termsData.contactEmail || defaultTermsAndConditions.contactEmail || 'legal@ilovepdf.com';
  const sections = Array.isArray(termsData.sections) && termsData.sections.length > 0 
    ? termsData.sections 
    : defaultTermsAndConditions.sections;

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-light)', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '820px', width: '100%' }}>

        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-gray)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: 'clamp(20px, 4vw, 48px)', boxShadow: 'var(--shadow-sm)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--border-light)', borderRadius: '12px' }}>
              <FileText size={24} color="var(--primary-red)" />
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-dark)' }}>{title}</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-light-gray)', marginBottom: '36px' }}>{lastUpdated}</p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: '36px' }} />

          {/* Dynamic Sections */}
          {sections.map((section, i) => (
            <div key={section.id || i} style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--primary-red)' }}>{sectionIcons[i % sectionIcons.length]}</span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>{section.title}</h2>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--text-gray)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>{section.body}</p>
            </div>
          ))}

          {/* Contact notice */}
          {contactEmail && (
            <div style={{ backgroundColor: 'var(--bg-light)', borderRadius: '12px', padding: '20px 24px', borderLeft: '4px solid var(--primary-red)', marginTop: '10px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: '600', margin: 0 }}>
                For any questions regarding these Terms, contact our legal department at <a href={`mailto:${contactEmail}`} style={{ color: 'var(--primary-red)', textDecoration: 'none', fontWeight: '700' }}>{contactEmail}</a>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
