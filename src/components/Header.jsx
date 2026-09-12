import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, Moon, Sun, Menu, X, ArrowRight, LogOut, LogIn, CreditCard, Shield, Sparkles, Heart, Monitor, Smartphone, Link as LinkIcon, Building2, HelpCircle, Globe, ChevronLeft, LayoutDashboard } from 'lucide-react';
import { 
  JpgToPdfIcon, WordToPdfIcon, PowerpointToPdfIcon, ExcelToPdfIcon, HtmlToPdfIcon,
  PdfToJpgIcon, PdfToWordIcon, PdfToPowerpointIcon, PdfToExcelIcon, PdfToPdfaIcon,
  MergePdfIcon, SplitPdfIcon, OrganizePdfIcon, ProtectPdfIcon, UnlockPdfIcon, AiSummarizerIcon,
  CompressPdfIcon, RepairPdfIcon, RemovePagesIcon, ExtractPagesIcon, ScanPdfIcon, OcrPdfIcon,
  RotatePdfIcon, PageNumbersIcon, WatermarkIcon, CropPdfIcon, EditPdfIcon, PdfFormsIcon,
  SignPdfIcon, RedactPdfIcon, ComparePdfIcon, TranslatePdfIcon, PdfToMarkdownIcon
} from './Icons';

export default function Header({ theme, toggleTheme, isLoggedIn, onLoginClick, onSignupClick, onLogoutClick, siteContent }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentView = location.pathname === '/' ? 'home' 
    : location.pathname.startsWith('/tool/') ? 'tool-' + location.pathname.replace('/tool/', '') 
    : location.pathname.replace('/', '');

  const setView = (view) => {
    if (view === 'home') navigate('/');
    else if (view.startsWith('tool-')) navigate(`/tool/${view.replace('tool-', '')}`);
    else navigate(`/${view}`);
  };
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isAllToolsOpen, setIsAllToolsOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [mobileConvertOpen, setMobileConvertOpen] = useState(false);
  const [mobileAllToolsOpen, setMobileAllToolsOpen] = useState(false);
  const appLauncherRef = useRef(null);
  const allToolsRef = useRef(null);
  const convertRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (appLauncherRef.current && !appLauncherRef.current.contains(event.target)) {
        setIsAppLauncherOpen(false);
      }
      if (allToolsRef.current && !allToolsRef.current.contains(event.target)) {
        setIsAllToolsOpen(false);
      }
      if (convertRef.current && !convertRef.current.contains(event.target)) {
        setIsConvertOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Dropdown background adapts to theme
  const dropdownBg = theme === 'dark' ? '#1f2937' : '#ffffff';
  const dropdownBorder = theme === 'dark' ? '#374151' : '#e5e7eb';
  const dropdownArrowBg = theme === 'dark' ? '#1f2937' : '#ffffff';
  const dropdownCategoryColor = theme === 'dark' ? '#6b7280' : '#9ca3af';

  const getNavItemStyle = (views) => {
    const isActive = views.includes(currentView);
    return {
      color: isActive ? 'var(--primary-red)' : 'var(--text-dark)',
      fontWeight: '700',
      fontSize: '14px',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      flexShrink: 0
    };
  };

  const getLinkStyle = (viewName) => {
    return {
      color: currentView === viewName ? 'var(--primary-red)' : 'var(--text-dark)'
    };
  };

  return (
    <header className="header">
      <div className="header-left">
        <a href="#home" className="brand" onClick={() => { setView('home'); setMobileMenuOpen(false); }} style={{ gap: '4px' }}>
          <span style={{ fontWeight: '900', color: 'var(--text-dark)' }}>{siteContent?.brandPrefix || 'I'}</span>
          <span style={{ color: 'var(--primary-red)', fontSize: '20px', display: 'flex', alignItems: 'center' }}>{siteContent?.brandIcon || '❤️'}</span>
          <span style={{ fontWeight: '900', color: 'var(--text-dark)' }}>{siteContent?.brandName || 'PDF'}</span>
        </a>

        {/* Desktop Navigation */}
        <ul className="nav-menu">
          <li>
            <a 
              href="#home" 
              className="nav-item" 
              onClick={(e) => {
                e.preventDefault();
                setView('home');
                if (location.pathname !== '/') {
                  navigate('/');
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              style={{
                ...getNavItemStyle(['home']),
                ...(currentView === 'home' && location.pathname === '/' ? { color: 'var(--primary-red)' } : {})
              }}
            >
              HOME
            </a>
          </li>
          <li>
            <a 
              href="/#pricing" 
              className="nav-item" 
              onClick={(e) => {
                e.preventDefault();
                if (location.pathname !== '/') {
                  navigate('/');
                  setTimeout(() => {
                    const el = document.getElementById('pricing');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  const el = document.getElementById('pricing');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={getNavItemStyle(['pricing'])}
            >
              PRICING
            </a>
          </li>
          <li>
            <a 
              href="#merge" 
              className="nav-item" 
              onClick={() => setView('tool-merge')}
              style={getNavItemStyle(['tool-merge'])}
            >
              MERGE PDF
            </a>
          </li>
          <li>
            <a 
              href="#split" 
              className="nav-item" 
              onClick={() => setView('tool-split')}
              style={getNavItemStyle(['tool-split'])}
            >
              SPLIT PDF
            </a>
          </li>
          <li>
            <a 
              href="#compress" 
              className="nav-item" 
              onClick={() => setView('tool-compress')}
              style={getNavItemStyle(['tool-compress'])}
            >
              COMPRESS PDF
            </a>
          </li>
          <li 
            ref={convertRef}
            className="nav-item" 
            onMouseEnter={() => setIsConvertOpen(true)}
            onMouseLeave={() => setIsConvertOpen(false)}
            onClick={(e) => {
              e.stopPropagation();
              setIsConvertOpen(prev => !prev);
            }}
            style={{ 
              position: 'relative',
              cursor: 'pointer',
              ...getNavItemStyle([
                'tool-pdftoword', 'tool-pdftopowerpoint', 'tool-pdftoexcel',
                'tool-wordtopdf', 'tool-powerpointtopdf', 'tool-exceltopdf',
                'tool-pdftojpg', 'tool-jpgtopdf', 'tool-htmltopdf', 'tool-pdfa'
              ]),
              ...(isConvertOpen ? { color: 'var(--primary-red)' } : {})
            }}
          >
            CONVERT PDF <ChevronDown size={14} className={`nav-chevron ${isConvertOpen ? 'open' : ''}`} style={{ color: isConvertOpen ? 'var(--primary-red)' : undefined }} />
            {isConvertOpen && (
            <div className="convert-dropdown-container">
              {/* Arrow pointer */}
              <div className="convert-dropdown-arrow" />

              {/* Left Column: CONVERT TO PDF */}
              <div style={{ flex: '1 1 0', minWidth: '220px', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '800', color: dropdownCategoryColor, marginBottom: '14px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  CONVERT TO PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <a href="#jpg-to-pdf" className="dropdown-link-custom" onClick={() => setView('tool-jpgtopdf')} style={getLinkStyle('tool-jpgtopdf')}>
                    <JpgToPdfIcon /> JPG to PDF
                  </a>
                  <a href="#word-to-pdf" className="dropdown-link-custom" onClick={() => setView('tool-wordtopdf')} style={getLinkStyle('tool-wordtopdf')}>
                    <WordToPdfIcon /> WORD to PDF
                  </a>
                  <a href="#powerpoint-to-pdf" className="dropdown-link-custom" onClick={() => setView('tool-powerpointtopdf')} style={getLinkStyle('tool-powerpointtopdf')}>
                    <PowerpointToPdfIcon /> POWERPOINT to PDF
                  </a>
                  <a href="#excel-to-pdf" className="dropdown-link-custom" onClick={() => setView('tool-exceltopdf')} style={getLinkStyle('tool-exceltopdf')}>
                    <ExcelToPdfIcon /> EXCEL to PDF
                  </a>
                  <a href="#html-to-pdf" className="dropdown-link-custom" onClick={() => setView('tool-htmltopdf')} style={getLinkStyle('tool-htmltopdf')}>
                    <HtmlToPdfIcon /> HTML to PDF
                  </a>
                </div>
              </div>

              {/* Right Column: CONVERT FROM PDF */}
              <div style={{ flex: '1 1 0', minWidth: '220px', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '800', color: dropdownCategoryColor, marginBottom: '14px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  CONVERT FROM PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <a href="#pdf-to-jpg" className="dropdown-link-custom" onClick={() => setView('tool-pdftojpg')} style={getLinkStyle('tool-pdftojpg')}>
                    <PdfToJpgIcon /> PDF to JPG
                  </a>
                  <a href="#pdf-to-word" className="dropdown-link-custom" onClick={() => setView('tool-pdftoword')} style={getLinkStyle('tool-pdftoword')}>
                    <PdfToWordIcon /> PDF to WORD
                  </a>
                  <a href="#pdf-to-powerpoint" className="dropdown-link-custom" onClick={() => setView('tool-pdftopowerpoint')} style={getLinkStyle('tool-pdftopowerpoint')}>
                    <PdfToPowerpointIcon /> PDF to POWERPOINT
                  </a>
                  <a href="#pdf-to-excel" className="dropdown-link-custom" onClick={() => setView('tool-pdftoexcel')} style={getLinkStyle('tool-pdftoexcel')}>
                    <PdfToExcelIcon /> PDF to EXCEL
                  </a>
                  <a href="#pdf-to-pdfa" className="dropdown-link-custom" onClick={() => setView('tool-pdfa')} style={getLinkStyle('tool-pdfa')}>
                    <PdfToPdfaIcon /> PDF to PDF/A
                  </a>
                </div>
              </div>
            </div>
            )}
          </li>
          <li 
            ref={allToolsRef}
            className="nav-item" 
            onMouseEnter={() => setIsAllToolsOpen(true)}
            onMouseLeave={() => setIsAllToolsOpen(false)}
            onClick={(e) => {
              e.stopPropagation();
              setIsAllToolsOpen(prev => !prev);
            }}
            style={{ 
              position: 'relative', 
              cursor: 'pointer',
              ...getNavItemStyle([
                'tool-edit', 'tool-sign', 'tool-watermark', 'tool-rotate',
                'tool-unlock', 'tool-protect', 'tool-organize', 'tool-repair',
                'tool-pagenumber', 'tool-scan', 'tool-ocr', 'tool-compare',
                'tool-redact', 'tool-crop', 'tool-forms', 'tool-aisummarizer',
                'tool-translate', 'tool-markdown', 'tool-remove', 'tool-extract'
              ]),
              ...(isAllToolsOpen ? { color: 'var(--primary-red)' } : {})
            }}
          >
            ALL PDF TOOLS <ChevronDown size={14} className={`nav-chevron ${isAllToolsOpen ? 'open' : ''}`} style={{ color: isAllToolsOpen ? 'var(--primary-red)' : undefined }} />
            {isAllToolsOpen && (
            <>
              {/* Arrow pointer positioned directly under ALL PDF TOOLS */}
              <div style={{
                position: 'absolute',
                top: '41px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '13px',
                height: '13px',
                backgroundColor: dropdownBg,
                borderLeft: `1px solid ${dropdownBorder}`,
                borderTop: `1px solid ${dropdownBorder}`,
                zIndex: 1002
              }} />
              <div className="all-tools-dropdown-container">

              {/* Column 1: ORGANIZE PDF & PDF INTELLIGENCE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', color: dropdownCategoryColor, marginBottom: '14px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    ORGANIZE PDF
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <a href="#merge" className="dropdown-link-custom" style={getLinkStyle('tool-merge')} onClick={() => setView('tool-merge')}>
                      <MergePdfIcon /> Merge PDF
                    </a>
                    <a href="#split" className="dropdown-link-custom" style={getLinkStyle('tool-split')} onClick={() => setView('tool-split')}>
                      <SplitPdfIcon /> Split PDF
                    </a>
                    <a href="#remove-pages" className="dropdown-link-custom" style={getLinkStyle('tool-remove')} onClick={() => setView('tool-remove')}>
                      <RemovePagesIcon /> Remove pages
                    </a>
                    <a href="#extract-pages" className="dropdown-link-custom" style={getLinkStyle('tool-extract')} onClick={() => setView('tool-extract')}>
                      <ExtractPagesIcon /> Extract pages
                    </a>
                    <a href="#organize" className="dropdown-link-custom" style={getLinkStyle('tool-organize')} onClick={() => setView('tool-organize')}>
                      <OrganizePdfIcon /> Organize PDF
                    </a>
                    <a href="#scan-to-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-scan')} onClick={() => setView('tool-scan')}>
                      <ScanPdfIcon /> Scan to PDF
                    </a>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', color: dropdownCategoryColor, marginBottom: '14px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    PDF INTELLIGENCE
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <a href="#ai-summarizer" className="dropdown-link-custom" style={getLinkStyle('tool-aisummarizer')} onClick={() => setView('tool-aisummarizer')}>
                      <AiSummarizerIcon /> AI Summarizer
                    </a>
                    <a href="#translate-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-translate')} onClick={() => setView('tool-translate')}>
                      <TranslatePdfIcon /> Translate PDF
                    </a>
                    <a href="#pdf-to-markdown" className="dropdown-link-custom" style={getLinkStyle('tool-markdown')} onClick={() => setView('tool-markdown')}>
                      <PdfToMarkdownIcon /> PDF to Markdown
                    </a>
                  </div>
                </div>
              </div>

              {/* Column 2: OPTIMIZE PDF */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: dropdownCategoryColor, marginBottom: '14px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  OPTIMIZE PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <a href="#compress" className="dropdown-link-custom" style={getLinkStyle('tool-compress')} onClick={() => setView('tool-compress')}>
                    <CompressPdfIcon /> Compress PDF
                  </a>
                  <a href="#repair" className="dropdown-link-custom" style={getLinkStyle('tool-repair')} onClick={() => setView('tool-repair')}>
                    <RepairPdfIcon /> Repair PDF
                  </a>
                  <a href="#ocr-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-ocr')} onClick={() => setView('tool-ocr')}>
                    <OcrPdfIcon /> OCR PDF
                  </a>
                </div>
              </div>

              {/* Column 3: CONVERT TO PDF */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: dropdownCategoryColor, marginBottom: '14px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  CONVERT TO PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <a href="#jpg-to-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-jpgtopdf')} onClick={() => setView('tool-jpgtopdf')}>
                    <JpgToPdfIcon /> JPG to PDF
                  </a>
                  <a href="#word-to-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-wordtopdf')} onClick={() => setView('tool-wordtopdf')}>
                    <WordToPdfIcon /> WORD to PDF
                  </a>
                  <a href="#powerpoint-to-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-powerpointtopdf')} onClick={() => setView('tool-powerpointtopdf')}>
                    <PowerpointToPdfIcon /> POWERPOINT to PDF
                  </a>
                  <a href="#excel-to-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-exceltopdf')} onClick={() => setView('tool-exceltopdf')}>
                    <ExcelToPdfIcon /> EXCEL to PDF
                  </a>
                  <a href="#html-to-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-htmltopdf')} onClick={() => setView('tool-htmltopdf')}>
                    <HtmlToPdfIcon /> HTML to PDF
                  </a>
                </div>
              </div>

              {/* Column 4: CONVERT FROM PDF */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: dropdownCategoryColor, marginBottom: '14px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  CONVERT FROM PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <a href="#pdf-to-jpg" className="dropdown-link-custom" style={getLinkStyle('tool-pdftojpg')} onClick={() => setView('tool-pdftojpg')}>
                    <PdfToJpgIcon /> PDF to JPG
                  </a>
                  <a href="#pdf-to-word" className="dropdown-link-custom" style={getLinkStyle('tool-pdftoword')} onClick={() => setView('tool-pdftoword')}>
                    <PdfToWordIcon /> PDF to WORD
                  </a>
                  <a href="#pdf-to-powerpoint" className="dropdown-link-custom" style={getLinkStyle('tool-pdftopowerpoint')} onClick={() => setView('tool-pdftopowerpoint')}>
                    <PdfToPowerpointIcon /> PDF to POWERPOINT
                  </a>
                  <a href="#pdf-to-excel" className="dropdown-link-custom" style={getLinkStyle('tool-pdftoexcel')} onClick={() => setView('tool-pdftoexcel')}>
                    <PdfToExcelIcon /> PDF to EXCEL
                  </a>
                  <a href="#pdf-to-pdfa" className="dropdown-link-custom" style={getLinkStyle('tool-pdfa')} onClick={() => setView('tool-pdfa')}>
                    <PdfToPdfaIcon /> PDF to PDF/A
                  </a>
                </div>
              </div>

              {/* Column 5: EDIT PDF */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: dropdownCategoryColor, marginBottom: '14px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  EDIT PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <a href="#rotate-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-rotate')} onClick={() => setView('tool-rotate')}>
                    <RotatePdfIcon /> Rotate PDF
                  </a>
                  <a href="#add-page-numbers" className="dropdown-link-custom" style={getLinkStyle('tool-pagenumber')} onClick={() => setView('tool-pagenumber')}>
                    <PageNumbersIcon /> Add page numbers
                  </a>
                  <a href="#add-watermark" className="dropdown-link-custom" style={getLinkStyle('tool-watermark')} onClick={() => setView('tool-watermark')}>
                    <WatermarkIcon /> Add watermark
                  </a>
                  <a href="#crop-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-crop')} onClick={() => setView('tool-crop')}>
                    <CropPdfIcon /> Crop PDF
                  </a>
                  <a href="#edit-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-edit')} onClick={() => setView('tool-edit')}>
                    <EditPdfIcon /> Edit PDF
                  </a>
                  <a href="#pdf-forms" className="dropdown-link-custom" style={getLinkStyle('tool-forms')} onClick={() => setView('tool-forms')}>
                    <PdfFormsIcon /> PDF Forms
                  </a>
                </div>
              </div>

              {/* Column 6: PDF SECURITY */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: dropdownCategoryColor, marginBottom: '14px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  PDF SECURITY
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <a href="#unlock-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-unlock')} onClick={() => setView('tool-unlock')}>
                    <UnlockPdfIcon /> Unlock PDF
                  </a>
                  <a href="#protect-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-protect')} onClick={() => setView('tool-protect')}>
                    <ProtectPdfIcon /> Protect PDF
                  </a>
                  <a href="#sign-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-sign')} onClick={() => setView('tool-sign')}>
                    <SignPdfIcon /> Sign PDF
                  </a>
                  <a href="#redact-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-redact')} onClick={() => setView('tool-redact')}>
                    <RedactPdfIcon /> Redact PDF
                  </a>
                  <a href="#compare-pdf" className="dropdown-link-custom" style={getLinkStyle('tool-compare')} onClick={() => setView('tool-compare')}>
                    <ComparePdfIcon /> Compare PDF
                  </a>
                </div>
              </div>
            </div>
            </>
            )}
          </li>

        </ul>
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Dark Mode">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>



        {isLoggedIn ? (
          <>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary hide-mobile"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: currentView === 'dashboard' ? 'rgba(229, 36, 36, 0.1)' : 'var(--bg-light)',
                border: currentView === 'dashboard' ? '1px solid var(--primary-red)' : '1px solid var(--border-light)',
                color: currentView === 'dashboard' ? 'var(--primary-red)' : 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <LayoutDashboard size={15} /> Dashboard
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogoutClick}
              className="hide-mobile"
              title="Logout"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#ef4444';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)';
                e.currentTarget.style.color = '#ef4444';
              }}
            >
              <LogOut size={15} /> Logout
            </button>
          </>
        ) : (
          <>
            {/* Login Button */}
            <button
              onClick={onLoginClick}
              className="btn btn-secondary hide-mobile"
              style={{
                border: '1px solid var(--border-light)',
                fontWeight: '700',
                color: 'var(--text-dark)',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '8px 18px',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <LogIn size={15} /> Login
            </button>
            <button 
              onClick={onSignupClick} 
              className="btn btn-primary hide-mobile" 
              style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', border: 'none' }}
            >
              Sign up
            </button>
          </>
        )}

        {/* 3x3 App launcher dots with Hover/Click Popup Menu */}
        <div 
          ref={appLauncherRef}
          className="app-launcher hide-mobile" 
          onMouseEnter={() => setIsAppLauncherOpen(true)}
          onClick={(e) => {
            if (!e.target.closest('.app-launcher-popup')) {
              setIsAppLauncherOpen(prev => !prev);
            }
          }}
          style={{ 
            position: 'relative', 
            padding: '8px', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: isAppLauncherOpen ? 'var(--bg-light)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }} 
          title="iLovePDF Products & Applications"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 4px)', gap: '3px' }}>
            {[...Array(9)].map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  width: '4px', 
                  height: '4px', 
                  backgroundColor: isAppLauncherOpen ? 'var(--primary-red)' : 'var(--text-dark)', 
                  borderRadius: '50%',
                  transition: 'background-color 0.2s ease'
                }} 
              />
            ))}
          </div>

          {/* Apps Popup Card matching exact iLovePDF design */}
          {isAppLauncherOpen && (
            <div 
              className="app-launcher-popup"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '48px',
                right: '-6px',
                width: '790px',
                maxWidth: '92vw',
                boxSizing: 'border-box',
                backgroundColor: dropdownBg,
                border: `1px solid ${dropdownBorder}`,
                borderRadius: '16px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.14)',
                padding: '28px 32px',
                zIndex: 2000,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'row',
                gap: '30px'
              }}
            >
              {/* Arrow pointer pointing to 9-dots icon */}
              <div style={{
                position: 'absolute',
                top: '-7px',
                right: '16px',
                transform: 'rotate(45deg)',
                width: '13px',
                height: '13px',
                backgroundColor: dropdownBg,
                borderLeft: `1px solid ${dropdownBorder}`,
                borderTop: `1px solid ${dropdownBorder}`,
                zIndex: 2001
              }} />

              {/* COLUMN 1: OTHER PRODUCTS */}
              <div style={{ flex: '1 1 0', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '800', color: dropdownCategoryColor, letterSpacing: '0.6px', textTransform: 'uppercase', margin: 0 }}>
                  OTHER PRODUCTS
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* iLoveIMG */}
                  <a href="#iloveimg" onClick={(e) => e.preventDefault()} className="app-launcher-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', padding: '6px 8px', borderRadius: '8px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eef4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>iLoveIMG</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>Effortless image editing</div>
                    </div>
                  </a>

                  {/* iLoveSign */}
                  <a href="#ilovesign" onClick={(e) => e.preventDefault()} className="app-launcher-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', padding: '6px 8px', borderRadius: '8px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eef4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#1d4ed8">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>iLoveSign</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>e-Signing made simple</div>
                    </div>
                  </a>

                  {/* iLoveAPI */}
                  <a href="#iloveapi" onClick={(e) => e.preventDefault()} className="app-launcher-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', padding: '6px 8px', borderRadius: '8px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#e6f9f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#0d9488">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>iLoveAPI</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>Document automation for developers</div>
                    </div>
                  </a>

                  {/* Integrations Card */}
                  <div style={{ border: `1px solid ${dropdownBorder}`, borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#fcfcfd' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${dropdownBorder}`, backgroundColor: dropdownBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LinkIcon size={15} color="var(--text-gray)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Integrations</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '2px' }}>Zapier, Make, Wordpress...</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMN 2: SOLUTIONS */}
              <div style={{ flex: '1.2 1 0', minWidth: '240px', borderLeft: `1px solid ${dropdownBorder}`, paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* SOLUTIONS */}
                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: '800', color: dropdownCategoryColor, letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '14px' }}>
                    SOLUTIONS
                  </h4>

                  <a href="#business" onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/pricing'); }} className="app-launcher-item" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', padding: '6px 8px', borderRadius: '8px' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '10px', backgroundColor: theme === 'dark' ? '#374151' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                        <rect x="5" y="14" width="6" height="15" rx="2" fill="#7f1d1d" />
                        <rect x="14" y="9" width="6" height="20" rx="2" fill="#e5322d" />
                        <rect x="23" y="5" width="6" height="24" rx="2" fill="#fca5a5" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>Business</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '3px', lineHeight: '1.35' }}>Streamlined PDF editing and workflows for business teams</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* COLUMN 3: LINKS & UTILITIES */}
              <div style={{ width: '150px', borderLeft: `1px solid ${dropdownBorder}`, paddingLeft: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <a href="#pricing" onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/pricing'); }} className="app-launcher-link" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '700', fontSize: '14px' }}>
                    <CreditCard size={17} color="var(--text-gray)" /> Pricing
                  </a>

                  <a href="#security" onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/privacy'); }} className="app-launcher-link" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '700', fontSize: '14px' }}>
                    <Shield size={17} color="var(--text-gray)" /> Security
                  </a>

                  <a href="#features" onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/'); }} className="app-launcher-link" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '700', fontSize: '14px' }}>
                    <LayoutDashboard size={17} color="var(--text-gray)" /> Features
                  </a>

                  <a href="#about" onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/contact'); }} className="app-launcher-link" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '700', fontSize: '14px' }}>
                    <Heart size={17} color="var(--text-gray)" /> About us
                  </a>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: `1px solid ${dropdownBorder}`, paddingTop: '18px' }}>
                  <a href="#help" onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/help'); }} className="app-launcher-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '700', fontSize: '14px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800' }}>‹</span> Help
                  </a>

                  <a href="#language" onClick={(e) => { e.preventDefault(); alert('🌐 Language selection: English (US)'); }} className="app-launcher-link" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '700', fontSize: '14px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800' }}>‹</span> Language
                  </a>
                </div>
              </div>

            </div>
          )}
        </div>

        <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Comprehensive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav">
          <div className="mobile-nav-inner">

            {/* Quick Popular Tools */}
            <div className="mobile-nav-section-title">POPULAR TOOLS</div>
            <a href="#merge" className="mobile-nav-item" onClick={() => { setView('tool-merge'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><MergePdfIcon /> Merge PDF</span> <ArrowRight size={16} />
            </a>
            <a href="#split" className="mobile-nav-item" onClick={() => { setView('tool-split'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><SplitPdfIcon /> Split PDF</span> <ArrowRight size={16} />
            </a>
            <a href="#compress" className="mobile-nav-item" onClick={() => { setView('tool-compress'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><CompressPdfIcon /> Compress PDF</span> <ArrowRight size={16} />
            </a>

            {/* Convert PDF Accordion */}
            <button 
              type="button"
              className="mobile-nav-accordion-btn"
              onClick={() => setMobileConvertOpen(!mobileConvertOpen)}
            >
              <span style={{ fontWeight: '800' }}>CONVERT PDF</span>
              <ChevronDown size={18} style={{ transform: mobileConvertOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {mobileConvertOpen && (
              <div className="mobile-nav-sublist">
                <div className="mobile-nav-subheading">CONVERT TO PDF</div>
                <a href="#jpg-to-pdf" className="mobile-nav-sublink" onClick={() => { setView('tool-jpgtopdf'); setMobileMenuOpen(false); }}>
                  <JpgToPdfIcon /> JPG to PDF
                </a>
                <a href="#word-to-pdf" className="mobile-nav-sublink" onClick={() => { setView('tool-wordtopdf'); setMobileMenuOpen(false); }}>
                  <WordToPdfIcon /> Word to PDF
                </a>
                <a href="#powerpoint-to-pdf" className="mobile-nav-sublink" onClick={() => { setView('tool-powerpointtopdf'); setMobileMenuOpen(false); }}>
                  <PowerpointToPdfIcon /> PowerPoint to PDF
                </a>
                <a href="#excel-to-pdf" className="mobile-nav-sublink" onClick={() => { setView('tool-exceltopdf'); setMobileMenuOpen(false); }}>
                  <ExcelToPdfIcon /> Excel to PDF
                </a>
                <a href="#html-to-pdf" className="mobile-nav-sublink" onClick={() => { setView('tool-htmltopdf'); setMobileMenuOpen(false); }}>
                  <HtmlToPdfIcon /> HTML to PDF
                </a>

                <div className="mobile-nav-subheading" style={{ marginTop: '10px' }}>CONVERT FROM PDF</div>
                <a href="#pdf-to-jpg" className="mobile-nav-sublink" onClick={() => { setView('tool-pdftojpg'); setMobileMenuOpen(false); }}>
                  <PdfToJpgIcon /> PDF to JPG
                </a>
                <a href="#pdf-to-word" className="mobile-nav-sublink" onClick={() => { setView('tool-pdftoword'); setMobileMenuOpen(false); }}>
                  <PdfToWordIcon /> PDF to Word
                </a>
                <a href="#pdf-to-powerpoint" className="mobile-nav-sublink" onClick={() => { setView('tool-pdftopowerpoint'); setMobileMenuOpen(false); }}>
                  <PdfToPowerpointIcon /> PDF to PowerPoint
                </a>
                <a href="#pdf-to-excel" className="mobile-nav-sublink" onClick={() => { setView('tool-pdftoexcel'); setMobileMenuOpen(false); }}>
                  <PdfToExcelIcon /> PDF to Excel
                </a>
                <a href="#pdf-to-pdfa" className="mobile-nav-sublink" onClick={() => { setView('tool-pdfa'); setMobileMenuOpen(false); }}>
                  <PdfToPdfaIcon /> PDF to PDF/A
                </a>
              </div>
            )}

            {/* All PDF Tools Accordion */}
            <button 
              type="button"
              className="mobile-nav-accordion-btn"
              onClick={() => setMobileAllToolsOpen(!mobileAllToolsOpen)}
            >
              <span style={{ fontWeight: '800' }}>ALL PDF TOOLS ({32})</span>
              <ChevronDown size={18} style={{ transform: mobileAllToolsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {mobileAllToolsOpen && (
              <div className="mobile-nav-sublist">
                <div className="mobile-nav-subheading">EDIT & SIGN</div>
                <a href="#edit" className="mobile-nav-sublink" onClick={() => { setView('tool-edit'); setMobileMenuOpen(false); }}>
                  <EditPdfIcon /> Edit PDF
                </a>
                <a href="#sign" className="mobile-nav-sublink" onClick={() => { setView('tool-sign'); setMobileMenuOpen(false); }}>
                  <SignPdfIcon /> Sign PDF
                </a>
                <a href="#watermark" className="mobile-nav-sublink" onClick={() => { setView('tool-watermark'); setMobileMenuOpen(false); }}>
                  <WatermarkIcon /> Watermark
                </a>
                <a href="#rotate" className="mobile-nav-sublink" onClick={() => { setView('tool-rotate'); setMobileMenuOpen(false); }}>
                  <RotatePdfIcon /> Rotate PDF
                </a>
                <a href="#crop" className="mobile-nav-sublink" onClick={() => { setView('tool-crop'); setMobileMenuOpen(false); }}>
                  <CropPdfIcon /> Crop PDF
                </a>
                <a href="#pagenumber" className="mobile-nav-sublink" onClick={() => { setView('tool-pagenumber'); setMobileMenuOpen(false); }}>
                  <PageNumbersIcon /> Page Numbers
                </a>

                <div className="mobile-nav-subheading" style={{ marginTop: '10px' }}>SECURITY & REPAIR</div>
                <a href="#protect" className="mobile-nav-sublink" onClick={() => { setView('tool-protect'); setMobileMenuOpen(false); }}>
                  <ProtectPdfIcon /> Protect PDF
                </a>
                <a href="#unlock" className="mobile-nav-sublink" onClick={() => { setView('tool-unlock'); setMobileMenuOpen(false); }}>
                  <UnlockPdfIcon /> Unlock PDF
                </a>
                <a href="#redact" className="mobile-nav-sublink" onClick={() => { setView('tool-redact'); setMobileMenuOpen(false); }}>
                  <RedactPdfIcon /> Redact PDF
                </a>
                <a href="#repair" className="mobile-nav-sublink" onClick={() => { setView('tool-repair'); setMobileMenuOpen(false); }}>
                  <RepairPdfIcon /> Repair PDF
                </a>

                <div className="mobile-nav-subheading" style={{ marginTop: '10px' }}>AI & ADVANCED</div>
                <a href="#ocr" className="mobile-nav-sublink" onClick={() => { setView('tool-ocr'); setMobileMenuOpen(false); }}>
                  <OcrPdfIcon /> OCR PDF
                </a>
                <a href="#compare" className="mobile-nav-sublink" onClick={() => { setView('tool-compare'); setMobileMenuOpen(false); }}>
                  <ComparePdfIcon /> Compare PDF
                </a>
                <a href="#aisummarizer" className="mobile-nav-sublink" onClick={() => { setView('tool-aisummarizer'); setMobileMenuOpen(false); }}>
                  <AiSummarizerIcon /> AI Summarizer
                </a>
                <a href="#translate" className="mobile-nav-sublink" onClick={() => { setView('tool-translate'); setMobileMenuOpen(false); }}>
                  <TranslatePdfIcon /> Translate PDF
                </a>
                <a href="#markdown" className="mobile-nav-sublink" onClick={() => { setView('tool-markdown'); setMobileMenuOpen(false); }}>
                  <PdfToMarkdownIcon /> PDF to Markdown
                </a>
                <a href="#forms" className="mobile-nav-sublink" onClick={() => { setView('tool-forms'); setMobileMenuOpen(false); }}>
                  <PdfFormsIcon /> PDF Forms
                </a>
                <a href="#organize" className="mobile-nav-sublink" onClick={() => { setView('tool-organize'); setMobileMenuOpen(false); }}>
                  <OrganizePdfIcon /> Organize PDF
                </a>
                <a href="#scan" className="mobile-nav-sublink" onClick={() => { setView('tool-scan'); setMobileMenuOpen(false); }}>
                  <ScanPdfIcon /> Scan to PDF
                </a>
              </div>
            )}

            {/* General Navigation Links */}
            <div className="mobile-nav-section-title" style={{ marginTop: '14px' }}>NAVIGATION</div>
            <a href="#pricing" className="mobile-nav-item" onClick={() => { navigate('/#pricing'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><CreditCard size={18} /> Pricing</span> <ArrowRight size={16} />
            </a>
            <a href="#features" className="mobile-nav-item" onClick={() => { navigate('/#features'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><LayoutDashboard size={18} /> Features</span> <ArrowRight size={16} />
            </a>
            <a href="#help" className="mobile-nav-item" onClick={() => { navigate('/help'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><HelpCircle size={18} /> Help & Support</span> <ArrowRight size={16} />
            </a>
            <a href="#contact" className="mobile-nav-item" onClick={() => { navigate('/contact'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><Building2 size={18} /> Contact Sales</span> <ArrowRight size={16} />
            </a>
            <a href="#privacy" className="mobile-nav-item" onClick={() => { navigate('/privacy'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><Shield size={18} /> Privacy Policy</span> <ArrowRight size={16} />
            </a>

            {/* Dark / Light Mode Toggle */}
            <div className="mobile-nav-theme-row">
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>Appearance</span>
              <button 
                type="button"
                className="mobile-theme-btn" 
                onClick={toggleTheme}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <><Moon size={16} /> Dark Mode</> : <><Sun size={16} /> Light Mode</>}
              </button>
            </div>

            {/* User Authentication Actions */}
            <div className="mobile-nav-auth-box">
              {isLoggedIn ? (
                <>
                  <button 
                    type="button"
                    className="btn btn-primary"
                    onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '15px', fontWeight: '800' }}
                  >
                    <LayoutDashboard size={16} /> Open Dashboard
                  </button>
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { onLogoutClick(); setMobileMenuOpen(false); }}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '15px', fontWeight: '700' }}
                  >
                    <LogIn size={16} /> Login
                  </button>
                  <button 
                    type="button"
                    className="btn btn-primary"
                    onClick={() => { onSignupClick(); setMobileMenuOpen(false); }}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '15px', fontWeight: '800' }}
                  >
                    Sign up Free
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
