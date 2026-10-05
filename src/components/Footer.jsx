import React from 'react';
import { useNavigate } from 'react-router-dom';
import StoreBadges from './StoreBadges';

export const IMAGE_FOOTER_COLUMNS = [
  {
    id: 'col-product',
    title: 'PRODUCT',
    links: [
      { label: 'Home', url: '/' },
      { label: 'Features', url: '/#features' },
      { label: 'Pricing', url: '/#pricing' },
      { label: 'Tools', url: '/#tools' },
      { label: 'FAQ', url: '/help' }
    ]
  },
  {
    id: 'col-legal',
    title: 'LEGAL',
    links: [
      { label: 'Security', url: '/security' },
      { label: 'Privacy policy', url: '/privacy' },
      { label: 'Terms & conditions', url: '/terms' },
      { label: 'Cookies', url: '/privacy' }
    ]
  },
  {
    id: 'col-company',
    title: 'COMPANY',
    links: [
      { label: 'About us', url: '/about' },
      { label: 'Contact us', url: '/contact' },
      { label: 'Blog', url: '/blog' }
    ]
  }
];

export default function Footer({ siteContent }) {
  const navigate = useNavigate();

  const handleLinkClick = (e, url) => {
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return; // allow normal external navigation
    }
    e.preventDefault();

    // 1. Home link
    if (url === '/' || url === '/#home') {
      if (window.location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
      }
      return;
    }

    // 2. Pricing link
    if (url === '/pricing' || url === '/#pricing' || url === '#pricing') {
      if (window.location.pathname === '/') {
        const elem = document.getElementById('pricing');
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/#pricing');
        setTimeout(() => {
          const elem = document.getElementById('pricing');
          if (elem) elem.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
      return;
    }

    // 3. Features link
    if (url === '/features' || url === '/#features' || url === '#features') {
      if (window.location.pathname === '/') {
        const elem = document.getElementById('features') || document.getElementById('tools');
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/#features');
        setTimeout(() => {
          const elem = document.getElementById('features') || document.getElementById('tools');
          if (elem) elem.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
      return;
    }

    // 4. Tools link
    if (url === '/tools' || url === '/#tools' || url === '#tools') {
      if (window.location.pathname === '/') {
        const elem = document.getElementById('tools');
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/#tools');
        setTimeout(() => {
          const elem = document.getElementById('tools');
          if (elem) elem.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
      return;
    }

    // 5. App Downloads / Mobile / Desktop link
    if (url === '#app-downloads' || url === '/#app-downloads') {
      const elem = document.getElementById('app-downloads');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
        elem.style.transition = 'all 0.3s ease';
        elem.style.transform = 'scale(1.05)';
        setTimeout(() => {
          elem.style.transform = 'scale(1)';
        }, 600);
      }
      return;
    }

    // 6. Direct Tool links e.g. /tool/sign, /tool/jpgtopdf
    if (url.startsWith('/tool/')) {
      navigate(url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 7. Any other anchor links
    if (url.startsWith('/#') || url.startsWith('#')) {
      const id = url.replace(/^\/?#/, '');
      if (window.location.pathname !== '/') {
        navigate(`/#${id}`);
        setTimeout(() => {
          const elem = document.getElementById(id);
          if (elem) elem.scrollIntoView({ behavior: 'smooth' });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 150);
      } else {
        const elem = document.getElementById(id);
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // 8. Default page navigation e.g. /contact, /terms, /privacy, /help
    navigate(url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const rawColumns = (siteContent?.footerColumns && siteContent.footerColumns.length > 0)
    ? siteContent.footerColumns
    : IMAGE_FOOTER_COLUMNS;
  const columns = rawColumns.map(col => ({
    ...col,
    links: (col.links || []).filter(l => {
      const lbl = (l.label || '').toLowerCase().trim();
      const url = (l.url || '').toLowerCase().trim();
      return lbl !== 'press' && url !== '/press';
    })
  }));
  const socialLinks = siteContent?.socialLinks || {};
  const appStoreBadges = siteContent?.appStoreBadges;
  const copyright = siteContent?.footerCopyright || '© iLovePDF 2026 ® - Your PDF Editor';
  const brand = siteContent?.footerBrand || '';
  const quickLinks = (siteContent?.footerButtons || []).filter((btn) => btn && btn.label);

  const socialNetworks = [
    {
      key: 'twitter',
      label: 'X',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-2.18c-.75 0-.98.42-.98 1.158V12h2.96l-.39 2.89h-2.57v7.36c3.86-.63 6.67-3.16 6.67-7.25 0-4.14-3.363-7.5-7.5-7.5z" />
        </svg>
      )
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-5 5.5A1.5 1.5 0 1 0 12.5 10a1.5 1.5 0 0 0 1.5-1.5m0 3.5h-2v8h2zm-5-3H5v8h2zm10 0h-2v8h2z" />
        </svg>
      )
    },
    {
      key: 'instagram',
      label: 'Instagram',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      )
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69A8.83 8.83 0 0 1 15.77 4V1.2h-3.45v10.58a3.89 3.89 0 1 1-3.45-3.85V4.5A7.35 7.35 0 1 0 15.77 11.9V7.02a12.3 12.3 0 0 0 3.82.67z" />
        </svg>
      )
    },
    {
      key: 'reddit',
      label: 'Reddit',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744a1.249 1.249 0 1 0 0 2.498 1.249 1.249 0 0 0 0-2.498M12 8.8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m-5.5.25a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8m11 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8M12 12.9c2.1 0 3.95.74 5.2 1.95a.94.94 0 0 1-1.35 1.3c-.95-.94-2.3-1.38-3.85-1.38s-2.9.44-3.85 1.38a.94.94 0 1 1-1.35-1.3A7.4 7.4 0 0 1 12 12.9m-3.4 4.7a.94.94 0 1 0 1.35 1.3c.53-.53 1.28-1 2.05-1.3a.94.94 0 1 0-.53-1.8c-1.03.4-2.02 1-2.73 1.74a.94.94 0 0 0-.14.06z" />
        </svg>
      )
    }
  ].filter((net) => Boolean(socialLinks[net.key]));

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

{/* Bottom Bar: Brand & Social Icons (Left) + Quick Links & Copyright (Right) */}
        <div className="footer-exact-bottom">
          <div className="footer-exact-bottom-left">
            {brand && (
              <span className="footer-exact-brand">{brand}</span>
            )}

            {socialNetworks.length > 0 && (
              <div className="footer-exact-socials">
                {socialNetworks.map((net) => (
                  <a key={net.key} href={socialLinks[net.key]} target="_blank" rel="noopener noreferrer" className="footer-exact-social-icon" aria-label={net.label}>
                    {net.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="footer-exact-bottom-right">
            {quickLinks.length > 0 && (
              <nav className="footer-exact-quicklinks">
                {quickLinks.map((btn, btnIdx) => {
                  const isExternal = btn.url && (btn.url.startsWith('http://') || btn.url.startsWith('https://'));
                  return (
                    <a
                      key={btnIdx}
                      href={btn.url || '#'}
                      target={isExternal ? '_blank' : '_self'}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className="footer-exact-quicklink"
                      onClick={(e) => !isExternal && handleLinkClick(e, btn.url)}
                    >
                      {btn.label}
                    </a>
                  );
                })}
              </nav>
            )}

            <div className="footer-exact-copyright">
              {copyright}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
