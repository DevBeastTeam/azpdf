import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StoreBadges from './StoreBadges';

export default function Footer({ siteContent }) {
  const navigate = useNavigate();

  const handleLinkClick = (e, url) => {
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return; // allow normal external anchor navigation with target="_blank"
    }
    e.preventDefault();

    if (url === '/' || url === '/#home') {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (url.startsWith('/tool/')) {
      navigate(url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (url.startsWith('/#') || url.startsWith('#')) {
      const id = url.replace(/^\/?#/, '');
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const elem = document.getElementById(id);
          if (elem) {
            elem.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 150);
      } else {
        const elem = document.getElementById(id);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const columns = siteContent?.footerColumns || [];
  const bottomButtons = siteContent?.footerButtons || [];
  const socialLinks = siteContent?.socialLinks || {};
  const appStoreBadges = siteContent?.appStoreBadges;

  return (
    <footer className="footer">
      {/* 1. Main Navigation Columns Grid */}
      <div className="footer-grid">
        {columns.map((col, idx) => (
          <div className="footer-col" key={col.id || idx}>
            <h4 className="footer-col-title">{col.title}</h4>
            <ul className="footer-links">
              {col.links && col.links.map((link, linkIdx) => {
                const isExternal = link.url && (link.url.startsWith('http://') || link.url.startsWith('https://'));
                return (
                  <li key={linkIdx}>
                    <a
                      href={link.url || '#'}
                      target={isExternal ? '_blank' : '_self'}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="footer-link"
                      onClick={(e) => !isExternal && handleLinkClick(e, link.url)}
                      style={isExternal ? { display: 'inline-flex', alignItems: 'center', gap: '4px' } : {}}
                    >
                      {link.label}
                      {isExternal && <ArrowUpRight size={12} />}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* 2. Official App Store & Play Store Download Badges Banner (Admin Manageable) */}
      {appStoreBadges && appStoreBadges.enabled !== false && (
        <div className="footer-apps-section" id="app-downloads">
          <div className="footer-apps-content">
            <div className="footer-apps-info">
              <h4 className="footer-apps-title">{appStoreBadges.title || 'Download azPDF Desktop & Mobile App'}</h4>
              <p className="footer-apps-sub">{appStoreBadges.subtitle || 'Work with PDFs directly on Windows, Mac, Android and iOS devices.'}</p>
            </div>
            <StoreBadges config={appStoreBadges} layout="horizontal" />
          </div>
        </div>
      )}

      {/* 3. Footer Bottom Bar: Copyright, Quick Buttons & Socials */}
      <div className="footer-bottom">
        <div className="footer-bottom-left">
          <span className="copyright">{siteContent?.footerCopyright || '© 2026 iLovePDF. All Rights Reserved.'}</span>
          {bottomButtons.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
              {bottomButtons.map((btn, btnIdx) => (
                <React.Fragment key={btnIdx}>
                  <button
                    onClick={(e) => handleLinkClick(e, btn.url)}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}
                  >
                    {btn.label}
                  </button>
                  {btnIdx < bottomButtons.length - 1 && <span style={{ color: '#4b5563' }}>·</span>}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="footer-socials">
          {socialLinks.twitter && (
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
          )}
          {socialLinks.facebook && (
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
          )}
          {socialLinks.linkedin && (
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          )}
          {socialLinks.instagram && (
            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
