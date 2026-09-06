import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StoreBadges from './StoreBadges';

export default function Footer({ siteContent }) {
  const navigate = useNavigate();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [currentLang, setCurrentLang] = useState('English');
  const langDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setShowLangDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = (e, url) => {
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return; // allow normal external navigation
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
  const socialLinks = siteContent?.socialLinks || {};
  const appStoreBadges = siteContent?.appStoreBadges;
  const copyright = siteContent?.footerCopyright || '© iLovePDF 2026 ® - Your PDF Editor';

  return (
    <footer className="footer-exact">
      <div className="footer-exact-inner">
        {/* Top Section: Link Columns (Left) + Store Badges (Right) */}
        <div className="footer-exact-top">
          <div className="footer-exact-cols">
            {columns.map((col, idx) => (
              <div className="footer-exact-col" key={col.id || idx}>
                <h4 className="footer-exact-col-title">{col.title}</h4>
                <ul className="footer-exact-links">
                  {col.links && col.links.map((link, linkIdx) => {
                    const isExternal = link.url && (link.url.startsWith('http://') || link.url.startsWith('https://'));
                    return (
                      <li key={linkIdx}>
                        <a
                          href={link.url || '#'}
                          target={isExternal ? '_blank' : '_self'}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          className="footer-exact-link"
                          onClick={(e) => !isExternal && handleLinkClick(e, link.url)}
                        >
                          {link.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Right Aside: 4 Store Badges Stacked Vertically */}
          {appStoreBadges && appStoreBadges.enabled !== false && (
            <div className="footer-exact-badges" id="app-downloads">
              <StoreBadges config={appStoreBadges} layout="vertical" />
            </div>
          )}
        </div>

        {/* Horizontal Divider Line */}
        <div className="footer-exact-divider" />

        {/* Bottom Bar: Language Selector (Left) + Social Icons & Copyright (Right) */}
        <div className="footer-exact-bottom">
          {/* Left: Language Selector */}
          <div className="footer-exact-lang-box" ref={langDropdownRef}>
            <button
              className="footer-exact-lang-btn"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              type="button"
              aria-label="Select Language"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>{currentLang}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: showLangDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {showLangDropdown && (
              <div className="footer-exact-lang-menu">
                {['English', 'Español', 'Français', 'Deutsch', 'Italiano', 'Português', 'Русский', 'العربية', 'Urdu'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className={`footer-exact-lang-item ${lang === currentLang ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentLang(lang);
                      setShowLangDropdown(false);
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Social Icons + Copyright */}
          <div className="footer-exact-bottom-right">
            <div className="footer-exact-socials">
              {/* X / Twitter */}
              <a href={socialLinks.twitter || 'https://twitter.com'} target="_blank" rel="noopener noreferrer" className="footer-exact-social-icon" aria-label="X">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a href={socialLinks.facebook || 'https://facebook.com'} target="_blank" rel="noopener noreferrer" className="footer-exact-social-icon" aria-label="Facebook">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a href={socialLinks.linkedin || 'https://linkedin.com'} target="_blank" rel="noopener noreferrer" className="footer-exact-social-icon" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.86 0 1.56-.7 1.56-1.56s-.7-1.56-1.56-1.56a1.56 1.56 0 1 0 0 3.12m1.4 9.74V10.13H5.06v8.37z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a href={socialLinks.instagram || 'https://instagram.com'} target="_blank" rel="noopener noreferrer" className="footer-exact-social-icon" aria-label="Instagram">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>

              {/* TikTok */}
              <a href={socialLinks.tiktok || 'https://tiktok.com'} target="_blank" rel="noopener noreferrer" className="footer-exact-social-icon" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.67a6.34 6.34 0 0 0 10.86 4.47 6.13 6.13 0 0 0 1.93-4.47V8.6a8.28 8.28 0 0 0 4.8 1.53V6.69z"/>
                </svg>
              </a>

              {/* Reddit */}
              <a href={socialLinks.reddit || 'https://reddit.com'} target="_blank" rel="noopener noreferrer" className="footer-exact-social-icon" aria-label="Reddit">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.56 12 8 12.56 8 13.25c0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm5.5 0c-.69 0-1.25.56-1.25 1.25 0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm-5.465 3.963c-.11 0-.22.043-.303.125-.164.164-.164.441 0 .605.803.803 2.126 1.207 3.018 1.207.893 0 2.215-.404 3.018-1.207.164-.164.164-.441 0-.605a.428.428 0 0 0-.605 0c-.615.614-1.636.912-2.413.912-.777 0-1.798-.298-2.413-.912a.427.427 0 0 0-.302-.125z"/>
                </svg>
              </a>
            </div>

            <div className="footer-exact-copyright">
              {copyright}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
