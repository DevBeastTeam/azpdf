import React from 'react';

export default function Hero({ siteContent }) {
  return (
    <section id="home" className="hero">
      <span id="about" style={{ display: 'block', position: 'relative', top: '-70px', visibility: 'hidden' }} />
      <h1 className="hero-title">{siteContent?.heroTitle || 'Every tool you need to work with PDFs in one place'}</h1>
      <p className="hero-subtitle">
        {siteContent?.heroSubtitle || 'Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.'}
      </p>
    </section>
  );
}
