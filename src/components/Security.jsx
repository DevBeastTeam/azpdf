import React from 'react';
import { ArrowLeft, Shield, Lock, Clock, FileCheck, CheckCircle2, Mail, Server, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { defaultSecurityPage } from '../data/legalPagesData';

const badgeIcons = [
  <Lock key="1" size={22} color="var(--primary-red)" />,
  <Clock key="2" size={22} color="var(--primary-red)" />,
  <ShieldCheck key="3" size={22} color="var(--primary-red)" />,
  <FileCheck key="4" size={22} color="var(--primary-red)" />
];

export default function Security() {
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
  const securityData = siteContent?.securityPage || defaultSecurityPage;

  const title = securityData.title || defaultSecurityPage.title;
  const lastUpdated = securityData.lastUpdated || defaultSecurityPage.lastUpdated;
  const contactEmail = securityData.contactEmail || defaultSecurityPage.contactEmail || 'security@azpdf.com';
  const badges = Array.isArray(securityData.badges) && securityData.badges.length > 0
    ? securityData.badges
    : defaultSecurityPage.badges;
  const sections = Array.isArray(securityData.sections) && securityData.sections.length > 0
    ? securityData.sections
    : defaultSecurityPage.sections;

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-light)', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '840px', width: '100%' }}>

        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-gray)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: 'clamp(24px, 5vw, 48px)', boxShadow: 'var(--shadow-sm)' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--border-light)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={26} color="var(--primary-red)" />
            </div>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>{title}</h1>
              <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: '700', color: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', padding: '3px 10px', borderRadius: '20px', marginTop: '6px' }}>
                ✓ Certified Infrastructure & Auto File Purge
              </span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginBottom: '32px' }}>{lastUpdated}</p>

          {/* Security Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '40px' }}>
            {badges.map((badge, idx) => (
              <div key={badge.id || idx} style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}>
                  {badgeIcons[idx % badgeIcons.length]}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)' }}>{badge.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-gray)', lineHeight: '1.4' }}>{badge.desc}</div>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: '36px' }} />

          {/* Security Detail Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {sections.map((section, idx) => (
              <div key={section.id || idx} style={{ borderLeft: '3px solid var(--primary-red)', paddingLeft: '18px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '10px' }}>
                  {section.title}
                </h2>
                <div style={{ fontSize: '14px', color: 'var(--text-gray)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                  {section.body}
                </div>
              </div>
            ))}
          </div>

          {/* Security Operations Contact Card */}
          <div style={{ marginTop: '48px', padding: '24px', borderRadius: '16px', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>
                Report a Security Issue or Vulnerability
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-gray)', margin: 0 }}>
                Our Dedicated InfoSec team monitors inquiries and bug bounties 24/7.
              </p>
            </div>
            <a href={`mailto:${contactEmail}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', backgroundColor: 'var(--primary-red)', color: '#ffffff', fontWeight: '700', fontSize: '13px', textDecoration: 'none', transition: 'opacity 0.2s' }}>
              <Mail size={16} /> Contact Security Team
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
