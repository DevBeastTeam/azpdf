import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function Footer({ setView }) {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-col">
          <h4 className="footer-col-title">iLovePDF</h4>
          <ul className="footer-links">
            <li><a href="#home" className="footer-link" onClick={() => setView('home')}>Home</a></li>
            <li><a href="#features" className="footer-link">Features</a></li>
            <li><a href="#pricing" className="footer-link">Pricing</a></li>
            <li><a href="#tools" className="footer-link" onClick={() => setView('home')}>Tools</a></li>
            <li><a href="#faq" className="footer-link">FAQ</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Solutions</h4>
          <ul className="footer-links">
            <li><a href="#business" className="footer-link">Business</a></li>
            <li><a href="#education" className="footer-link">Education</a></li>
            <li><a href="#developers" className="footer-link">Developers</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Applications</h4>
          <ul className="footer-links">
            <li><a href="#desktop" className="footer-link">Desktop App</a></li>
            <li><a href="#mobile" className="footer-link">Mobile App</a></li>
            <li><a href="#api" className="footer-link">iLoveAPI</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Company</h4>
          <ul className="footer-links">
            <li><a href="#about" className="footer-link">Our Story</a></li>
            <li><a href="#blog" className="footer-link">Blog</a></li>
            <li><a href="#careers" className="footer-link">Careers</a></li>
            <li><a href="#press" className="footer-link">Press</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Support</h4>
          <ul className="footer-links">
            <li><a href="#help" className="footer-link" onClick={(e) => { e.preventDefault(); setView('help'); }}>Help &amp; Support</a></li>
            <li><a href="#terms" className="footer-link" onClick={(e) => { e.preventDefault(); setView('terms'); }}>Terms &amp; Conditions</a></li>
            <li><a href="#privacy" className="footer-link" onClick={(e) => { e.preventDefault(); setView('privacy'); }}>Privacy Policy</a></li>
            <li><a href="#contact" className="footer-link" onClick={(e) => { e.preventDefault(); setView('contact'); }}>Contact Support</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">Other Products</h4>
          <ul className="footer-links">
            <li><a href="https://www.iloveimg.com" target="_blank" rel="noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>iLoveIMG <ArrowUpRight size={12} /></a></li>
            <li><a href="https://www.ilovesign.com" target="_blank" rel="noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>iLoveSign <ArrowUpRight size={12} /></a></li>
            <li><a href="https://www.iloveapi.com" target="_blank" rel="noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>iLoveAPI <ArrowUpRight size={12} /></a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-left">
          <span className="copyright">© iLovePDF Clone 2026 - Designed with ❤️</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
            <button onClick={() => setView('terms')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}>Terms</button>
            <span style={{ color: '#4b5563' }}>·</span>
            <button onClick={() => setView('privacy')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}>Privacy</button>
            <span style={{ color: '#4b5563' }}>·</span>
            <button onClick={() => setView('help')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}>Help</button>
          </div>
        </div>

        <div className="footer-socials">
          {/* Custom inline SVGs for social media icons */}
          <a href="#twitter" className="social-icon" aria-label="Twitter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
          </a>
          <a href="#facebook" className="social-icon" aria-label="Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="#linkedin" className="social-icon" aria-label="LinkedIn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
          <a href="#instagram" className="social-icon" aria-label="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
