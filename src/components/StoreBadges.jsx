import React from 'react';

// Official SVG Icons for Stores
export function GooglePlayIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M47.7 20.8C42.8 26.2 40 34.3 40 44.8v422.4c0 10.5 2.8 18.6 7.7 24L50.4 494l236.4-236.4v-5.6L50.4 15.6 47.7 20.8z"/>
      <path fill="#FBBC04" d="M366.1 332.2l-79.3-79.4v-5.6l79.3-79.4 2.8 1.6 94 53.4c26.9 15.3 26.9 40.3 0 55.6l-94 53.4-2.8 2z"/>
      <path fill="#EA4335" d="M286.8 252.8L50.4 489.2c8.8 9.3 23.3 10.4 39.8 1.1l278.7-158.1-82.1-79.4z"/>
      <path fill="#34A853" d="M286.8 259.2l82.1-79.4L90.2 21.7C73.7 12.4 59.2 13.5 50.4 22.8L286.8 259.2z"/>
    </svg>
  );
}

export function AppleIcon({ size = 22 }) {
  return (
    <svg width={size} height={size * 1.18} viewBox="0 0 170 170" fill="#ffffff" style={{ flexShrink: 0 }}>
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.86-11.96-14.45-6.66-10.22-11.75-21.75-15.26-34.6-3.52-12.84-5.28-24.87-5.28-36.08 0-14.35 3.42-26.4 10.27-36.14 6.85-9.75 15.54-14.73 26.06-14.95 4.35 0 9.29 1.14 14.82 3.42 5.53 2.29 9.17 3.48 10.92 3.58 2.12 0 6.01-1.34 11.66-4.02 5.66-2.68 10.63-3.88 14.91-3.61 11.2.59 20.31 4.54 27.35 11.87 7.04 7.32 11.68 16.48 13.91 27.46-9.97 6.01-14.88 14.54-14.72 25.59.16 8.57 3.39 15.75 9.7 21.53 6.31 5.77 13.88 9.38 22.7 10.82-2.12 6.54-4.82 13.06-8.1 19.57zM119.22 33.3c0-7.14 2.62-13.82 7.86-20.04 5.24-6.22 11.74-10.45 19.5-12.69.87 7.03-1.42 13.62-6.86 19.78-5.44 6.16-12.24 10.37-20.5 12.63v.32z"/>
    </svg>
  );
}

export function MicrosoftStoreIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="#ffffff" style={{ flexShrink: 0 }}>
      <path d="M0 0h41.4v41.4H0zM46.6 0H88v41.4H46.6zM0 46.6h41.4V88H0zM46.6 46.6H88V88H46.6z"/>
    </svg>
  );
}

/**
 * Reusable Store Badges component matching screenshot
 */
export default function StoreBadges({ config, layout = 'horizontal', isPreview = false }) {
  const badges = config || {};

  // Master disable check
  if (badges.enabled === false && !isPreview) {
    return null;
  }

  const googlePlay = badges.googlePlay || { enabled: true, url: 'https://play.google.com/store/apps' };
  const appStore = badges.appStore || { enabled: true, url: 'https://apps.apple.com' };
  const macAppStore = badges.macAppStore || { enabled: true, url: 'https://apps.apple.com/macos' };
  const microsoftStore = badges.microsoftStore || { enabled: true, url: 'https://apps.microsoft.com' };

  // Common badge style
  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#1b1e28',
    color: '#ffffff',
    padding: '7px 16px',
    borderRadius: '10px',
    border: '1.5px solid rgba(255, 255, 255, 0.85)',
    minWidth: '185px',
    height: '50px',
    textDecoration: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    userSelect: 'none',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
  };

  const onBadgeHover = (e, hover) => {
    e.currentTarget.style.transform = hover ? 'translateY(-2px)' : 'translateY(0)';
    e.currentTarget.style.borderColor = hover ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
    e.currentTarget.style.backgroundColor = hover ? '#272c3b' : '#1b1e28';
    e.currentTarget.style.boxShadow = hover ? '0 6px 16px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.25)';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* 1. Google Play */}
      {googlePlay.enabled && (
        <a
          href={googlePlay.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={badgeStyle}
          onMouseEnter={(e) => onBadgeHover(e, true)}
          onMouseLeave={(e) => onBadgeHover(e, false)}
          title="Get it on Google Play"
          aria-label="Get it on Google Play"
        >
          <GooglePlayIcon size={24} />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.15' }}>
            <span style={{ fontSize: '9.5px', textTransform: 'uppercase', color: '#cbd5e1', fontWeight: '600', letterSpacing: '0.4px' }}>
              GET IT ON
            </span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.2px' }}>
              Google Play
            </span>
          </div>
        </a>
      )}

      {/* 2. Apple App Store */}
      {appStore.enabled && (
        <a
          href={appStore.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={badgeStyle}
          onMouseEnter={(e) => onBadgeHover(e, true)}
          onMouseLeave={(e) => onBadgeHover(e, false)}
          title="Download on the App Store"
          aria-label="Download on the App Store"
        >
          <AppleIcon size={21} />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.15' }}>
            <span style={{ fontSize: '9.5px', color: '#cbd5e1', fontWeight: '500', letterSpacing: '0.2px' }}>
              Download on the
            </span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.2px' }}>
              App Store
            </span>
          </div>
        </a>
      )}

      {/* 3. Mac App Store */}
      {macAppStore.enabled && (
        <a
          href={macAppStore.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={badgeStyle}
          onMouseEnter={(e) => onBadgeHover(e, true)}
          onMouseLeave={(e) => onBadgeHover(e, false)}
          title="Download on the Mac App Store"
          aria-label="Download on the Mac App Store"
        >
          <AppleIcon size={21} />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.15' }}>
            <span style={{ fontSize: '9.5px', color: '#cbd5e1', fontWeight: '500', letterSpacing: '0.2px' }}>
              Download on the
            </span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.2px' }}>
              Mac App Store
            </span>
          </div>
        </a>
      )}

      {/* 4. Microsoft Store */}
      {microsoftStore.enabled && (
        <a
          href={microsoftStore.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={badgeStyle}
          onMouseEnter={(e) => onBadgeHover(e, true)}
          onMouseLeave={(e) => onBadgeHover(e, false)}
          title="Get from Microsoft Store"
          aria-label="Get from Microsoft Store"
        >
          <MicrosoftStoreIcon size={20} />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.15' }}>
            <span style={{ fontSize: '9.5px', textTransform: 'uppercase', color: '#cbd5e1', fontWeight: '600', letterSpacing: '0.4px' }}>
              GET IT FROM
            </span>
            <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.2px' }}>
              Microsoft Store
            </span>
          </div>
        </a>
      )}
    </div>
  );
}
