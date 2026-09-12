import React from 'react';
import { ArrowLeft, Shield, Eye, Database, Cookie, UserCheck, Lock, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { defaultPrivacyPolicy } from '../data/legalPagesData';

const highlightIcons = [
  <Lock key="1" size={20} />,
  <Database key="2" size={20} />,
  <UserCheck key="3" size={20} />,
  <Eye key="4" size={20} />
];

const sectionIcons = [
  <Database key="1" size={20} />,
  <Eye key="2" size={20} />,
  <UserCheck key="3" size={20} />,
  <Lock key="4" size={20} />,
  <Cookie key="5" size={20} />,
  <Shield key="6" size={20} />,
  <Mail key="7" size={20} />,
  <FileText key="8" size={20} />
];

export default function PrivacyPolicy() {
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
  const privacyData = siteContent?.privacyPolicy || defaultPrivacyPolicy;

  const title = privacyData.title || defaultPrivacyPolicy.title;
  const lastUpdated = privacyData.lastUpdated || defaultPrivacyPolicy.lastUpdated;
  const contactEmail = privacyData.contactEmail || defaultPrivacyPolicy.contactEmail || 'privacy@ilovepdf.com';
  const highlights = Array.isArray(privacyData.highlights) && privacyData.highlights.length > 0 
    ? privacyData.highlights 
    : defaultPrivacyPolicy.highlights;
  const sections = Array.isArray(privacyData.sections) && privacyData.sections.length > 0 
    ? privacyData.sections 
    : defaultPrivacyPolicy.sections;

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-light)', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '820px', width: '100%' }}>

        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-gray)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: 'clamp(20px, 4vw, 48px)', boxShadow: 'var(--shadow-sm)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--border-light)', borderRadius: '12px' }}>
              <Shield size={24} color="var(--primary-red)" />
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-dark)' }}>{title}</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-light-gray)', marginBottom: '36px' }}>{lastUpdated}</p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: '36px' }} />

          {/* Highlights row */}
          {highlights && highlights.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '16px', marginBottom: '40px' }}>
              {highlights.map((item, i) => (
                <div key={item.id || i} style={{ backgroundColor: 'var(--bg-light)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--primary-red)' }}>{highlightIcons[i % highlightIcons.length]}</span>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-dark)' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          )}

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
            <div style={{ backgroundColor: 'var(--bg-light)', borderRadius: '12px', padding: '20px 24px', borderLeft: '4px solid var(--primary-red)' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: '600', margin: 0 }}>
                Privacy questions? Contact our Data Protection Officer at <a href={`mailto:${contactEmail}`} style={{ color: 'var(--primary-red)', textDecoration: 'none', fontWeight: '700' }}>{contactEmail}</a>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
