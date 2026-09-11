import React from 'react';

// Official SVG Icons for Stores
export function GooglePlayIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ffffff" style={{ flexShrink: 0 }}>
      <path d="M3.609 1.814L13.792 12 3.61 22.186c-.378-.344-.61-.84-.61-1.408V3.222c0-.568.232-1.064.609-1.408zm1.094-.658L15.42 7.02 14.5 12l-9.797-10.844zm0 21.688L14.5 12l.92 4.98-10.717 5.864zM16.12 7.425l3.22 1.76c1.1.6 1.1 1.57 0 2.17l-3.22 1.76-1.01-2.845 1.01-2.845z"/>
    </svg>
  );
}

export function AppleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size * 1.18} viewBox="0 0 170 170" fill="#ffffff" style={{ flexShrink: 0 }}>
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.86-11.96-14.45-6.66-10.22-11.75-21.75-15.26-34.6-3.52-12.84-5.28-24.87-5.28-36.08 0-14.35 3.42-26.4 10.27-36.14 6.85-9.75 15.54-14.73 26.06-14.95 4.35 0 9.29 1.14 14.82 3.42 5.53 2.29 9.17 3.48 10.92 3.58 2.12 0 6.01-1.34 11.66-4.02 5.66-2.68 10.63-3.88 14.91-3.61 11.2.59 20.31 4.54 27.35 11.87 7.04 7.32 11.68 16.48 13.91 27.46-9.97 6.01-14.88 14.54-14.72 25.59.16 8.57 3.39 15.75 9.7 21.53 6.31 5.77 13.88 9.38 22.7 10.82-2.12 6.54-4.82 13.06-8.1 19.57zM119.22 33.3c0-7.14 2.62-13.82 7.86-20.04 5.24-6.22 11.74-10.45 19.5-12.69.87 7.03-1.42 13.62-6.86 19.78-5.44 6.16-12.24 10.37-20.5 12.63v.32z"/>
    </svg>
  );
}

/**
 * Store Badges component - strictly Google Play & App Store as per user requirement
 */
export default function StoreBadges({ config, layout = 'vertical' }) {
  const badges = config || {};

  if (badges.enabled === false) {
    return null;
  }

  const googlePlay = badges.googlePlay || { enabled: true, url: 'https://play.google.com/store/apps' };
  const appStore = badges.appStore || { enabled: true, url: 'https://apps.apple.com' };

  const isVertical = layout === 'vertical';
  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#1f2129',
    color: '#ffffff',
    padding: '0 14px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.45)',
    width: '168px',
    height: '42px',
    textDecoration: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    userSelect: 'none',
  };

  const onBadgeHover = (e, hover) => {
    e.currentTarget.style.borderColor = hover ? '#ffffff' : 'rgba(255, 255, 255, 0.45)';
    e.currentTarget.style.backgroundColor = hover ? '#272a36' : '#1f2129';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: isVertical ? 'flex-start' : 'center',
        gap: '10px',
      }}
    >
      {/* 1. Google Play */}
      {googlePlay.enabled !== false && (
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
          <GooglePlayIcon size={20} />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
            <span style={{ fontSize: '8px', textTransform: 'uppercase', color: '#cbd5e1', fontWeight: '500', letterSpacing: '0.4px' }}>
              GET IT ON
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.1px' }}>
              Google Play
            </span>
          </div>
        </a>
      )}

      {/* 2. Apple App Store */}
      {appStore.enabled !== false && (
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
          <AppleIcon size={19} />
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: '1.2' }}>
            <span style={{ fontSize: '8px', color: '#cbd5e1', fontWeight: '500', letterSpacing: '0.2px' }}>
              Download on the
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.1px' }}>
              App Store
            </span>
          </div>
        </a>
      )}
    </div>
  );
}

