import React from 'react';
import { ArrowLeft, Newspaper, Download, Mail, Calendar, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { defaultPressPage } from '../data/legalPagesData';

export default function Press() {
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
  const pressData = siteContent?.pressPage || defaultPressPage;

  const title = pressData.title || defaultPressPage.title;
  const subtitle = pressData.subtitle || defaultPressPage.subtitle;
  const mediaContact = pressData.mediaContact || defaultPressPage.mediaContact;
  const pressReleases = Array.isArray(pressData.pressReleases) && pressData.pressReleases.length > 0
    ? pressData.pressReleases
    : defaultPressPage.pressReleases;
  const brandAssets = Array.isArray(pressData.brandAssets) && pressData.brandAssets.length > 0
    ? pressData.brandAssets
    : defaultPressPage.brandAssets;

  const handleDownloadAsset = (assetName) => {
    alert(`📥 Downloading ${assetName}. Brand guidelines and media kit ready.`);
  };

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-light)', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '880px', width: '100%' }}>

        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-gray)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: 'clamp(24px, 5vw, 48px)', boxShadow: 'var(--shadow-sm)' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'var(--border-light)', color: 'var(--primary-red)', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
              <Newspaper size={14} /> Official Media Center
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '12px' }}>
              {title}
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-gray)', maxWidth: '640px', margin: '0 auto', lineHeight: '1.6' }}>
              {subtitle}
            </p>
          </div>

          {/* Press Releases Section */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Newspaper size={20} color="var(--primary-red)" /> Recent Announcements
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pressReleases.map((pr, idx) => (
                <div key={pr.id || idx} style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--primary-red)' }}>
                    <Calendar size={13} /> {pr.date}
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', margin: 0, lineHeight: '1.4' }}>
                    {pr.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-gray)', margin: 0, lineHeight: '1.6' }}>
                    {pr.excerpt}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: '44px' }} />

          {/* Brand Assets & Media Kit */}
          <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Download size={20} color="var(--primary-red)" /> Official Brand Assets
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-gray)', marginBottom: '20px' }}>
              Download official logos, brand color guidelines, and media kits for publication use.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {brandAssets.map((asset, idx) => (
                <div key={asset.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: '14px', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)' }}>{asset.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>{asset.format} · {asset.size}</div>
                  </div>
                  <button onClick={() => handleDownloadAsset(asset.name)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-dark)', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <Download size={14} /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Media Contact Card */}
          <div style={{ padding: '28px', borderRadius: '18px', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.1)', padding: '3px 10px', borderRadius: '12px', marginBottom: '8px' }}>
                <CheckCircle2 size={12} /> Press Inquiries Only
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>
                Media & Journalist Relations
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-gray)', margin: 0 }}>
                {mediaContact?.spokesperson || 'Media Relations Team'} · {mediaContact?.officeHours || 'Mon–Fri 9am–6pm'}
              </p>
            </div>
            <a href={`mailto:${mediaContact?.email || 'press@azpdf.com'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', backgroundColor: 'var(--primary-red)', color: '#ffffff', fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}>
              <Mail size={16} /> {mediaContact?.email || 'press@azpdf.com'}
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
