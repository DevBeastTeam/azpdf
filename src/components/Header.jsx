import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, ChevronRight, Check, Moon, Sun, Menu, X, ArrowRight, LogOut, LogIn, CreditCard, Shield, Sparkles, Heart, Monitor, Smartphone, Link as LinkIcon, Building2, HelpCircle, Globe, ChevronLeft, LayoutDashboard, Image as ImageIcon, PenTool, Code2, GraduationCap, ArrowUpRight } from 'lucide-react';
import { 
  JpgToPdfIcon, WordToPdfIcon, PowerpointToPdfIcon, ExcelToPdfIcon, HtmlToPdfIcon,
  PdfToJpgIcon, PdfToWordIcon, PdfToPowerpointIcon, PdfToExcelIcon, PdfToPdfaIcon,
  MergePdfIcon, SplitPdfIcon, OrganizePdfIcon, ProtectPdfIcon, UnlockPdfIcon, AiSummarizerIcon,
  CompressPdfIcon, RepairPdfIcon, RemovePagesIcon, ExtractPagesIcon, ScanPdfIcon, OcrPdfIcon,
  RotatePdfIcon, PageNumbersIcon, WatermarkIcon, CropPdfIcon, EditPdfIcon, PdfFormsIcon,
  SignPdfIcon, RedactPdfIcon, ComparePdfIcon, TranslatePdfIcon, PdfToMarkdownIcon
} from './Icons';

export default function Header({ theme, toggleTheme, isLoggedIn, isAdminLoggedIn, onLoginClick, onSignupClick, onLogoutClick, siteContent }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentView = location.pathname === '/' ? 'home' 
    : location.pathname.startsWith('/tool/') ? 'tool-' + location.pathname.replace('/tool/', '') 
    : location.pathname.replace('/', '');

  const setView = (view, e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setIsConvertOpen(false);
    setIsAllToolsOpen(false);
    setIsAppLauncherOpen(false);
    setMobileMenuOpen(false);
    setMobileConvertOpen(false);
    setMobileAllToolsOpen(false);

    if (view === 'home') {
      navigate('/');
    } else if (view.startsWith('tool-')) {
      const toolSlug = view.replace('tool-', '');
      navigate(`/tool/${toolSlug}`);
    } else {
      navigate(`/${view}`);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isAllToolsOpen, setIsAllToolsOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const languages = ['English', 'Español', 'Français', 'Deutsch', 'Português', 'Italiano', '日本語'];
  const [mobileConvertOpen, setMobileConvertOpen] = useState(false);
  const [mobileAllToolsOpen, setMobileAllToolsOpen] = useState(false);
  const appLauncherRef = useRef(null);
  const allToolsRef = useRef(null);
  const convertRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (appLauncherRef.current && !appLauncherRef.current.contains(event.target)) {
        setIsAppLauncherOpen(false);
        setIsLangOpen(false);
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
        <a href="/" className="brand" onClick={(e) => setView('home', e)} style={{ gap: '4px' }}>
          <span style={{ fontWeight: '900', color: 'var(--text-dark)' }}>{siteContent?.brandPrefix || 'I'}</span>
          <span style={{ color: 'var(--primary-red)', fontSize: '20px', display: 'flex', alignItems: 'center' }}>{siteContent?.brandIcon || '❤️'}</span>
          <span style={{ fontWeight: '900', color: 'var(--text-dark)' }}>{siteContent?.brandName || 'PDF'}</span>
        </a>

        {/* Desktop Navigation */}
        <ul className="nav-menu">
          <li>
            <a 
              href="/" 
              className="nav-item" 
              onClick={(e) => {
                e.preventDefault();
                setView('home', e);
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
              href="/pricing" 
              className="nav-item" 
              onClick={(e) => {
                e.preventDefault();
                setIsConvertOpen(false);
                setIsAllToolsOpen(false);
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
              href="/tool/merge" 
              className="nav-item" 
              onClick={(e) => setView('tool-merge', e)}
              style={getNavItemStyle(['tool-merge'])}
            >
              MERGE PDF
            </a>
          </li>
          <li>
            <a 
              href="/tool/split" 
              className="nav-item" 
              onClick={(e) => setView('tool-split', e)}
              style={getNavItemStyle(['tool-split'])}
            >
              SPLIT PDF
            </a>
          </li>
          <li>
            <a 
              href="/tool/compress" 
              className="nav-item" 
              onClick={(e) => setView('tool-compress', e)}
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
                  <a href="/tool/jpgtopdf" className="dropdown-link-custom" onClick={(e) => setView('tool-jpgtopdf', e)} style={getLinkStyle('tool-jpgtopdf')}>
                    <JpgToPdfIcon /> JPG to PDF
                  </a>
                  <a href="/tool/wordtopdf" className="dropdown-link-custom" onClick={(e) => setView('tool-wordtopdf', e)} style={getLinkStyle('tool-wordtopdf')}>
                    <WordToPdfIcon /> WORD to PDF
                  </a>
                  <a href="/tool/powerpointtopdf" className="dropdown-link-custom" onClick={(e) => setView('tool-powerpointtopdf', e)} style={getLinkStyle('tool-powerpointtopdf')}>
                    <PowerpointToPdfIcon /> POWERPOINT to PDF
                  </a>
                  <a href="/tool/exceltopdf" className="dropdown-link-custom" onClick={(e) => setView('tool-exceltopdf', e)} style={getLinkStyle('tool-exceltopdf')}>
                    <ExcelToPdfIcon /> EXCEL to PDF
                  </a>
                  <a href="/tool/htmltopdf" className="dropdown-link-custom" onClick={(e) => setView('tool-htmltopdf', e)} style={getLinkStyle('tool-htmltopdf')}>
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
                  <a href="/tool/pdftojpg" className="dropdown-link-custom" onClick={(e) => setView('tool-pdftojpg', e)} style={getLinkStyle('tool-pdftojpg')}>
                    <PdfToJpgIcon /> PDF to JPG
                  </a>
                  <a href="/tool/pdftoword" className="dropdown-link-custom" onClick={(e) => setView('tool-pdftoword', e)} style={getLinkStyle('tool-pdftoword')}>
                    <PdfToWordIcon /> PDF to WORD
                  </a>
                  <a href="/tool/pdftopowerpoint" className="dropdown-link-custom" onClick={(e) => setView('tool-pdftopowerpoint', e)} style={getLinkStyle('tool-pdftopowerpoint')}>
                    <PdfToPowerpointIcon /> PDF to POWERPOINT
                  </a>
                  <a href="/tool/pdftoexcel" className="dropdown-link-custom" onClick={(e) => setView('tool-pdftoexcel', e)} style={getLinkStyle('tool-pdftoexcel')}>
                    <PdfToExcelIcon /> PDF to EXCEL
                  </a>
                  <a href="/tool/pdfa" className="dropdown-link-custom" onClick={(e) => setView('tool-pdfa', e)} style={getLinkStyle('tool-pdfa')}>
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
                    <a href="/tool/merge" className="dropdown-link-custom" style={getLinkStyle('tool-merge')} onClick={(e) => setView('tool-merge', e)}>
                      <MergePdfIcon /> Merge PDF
                    </a>
                    <a href="/tool/split" className="dropdown-link-custom" style={getLinkStyle('tool-split')} onClick={(e) => setView('tool-split', e)}>
                      <SplitPdfIcon /> Split PDF
                    </a>
                    <a href="/tool/remove" className="dropdown-link-custom" style={getLinkStyle('tool-remove')} onClick={(e) => setView('tool-remove', e)}>
                      <RemovePagesIcon /> Remove pages
                    </a>
                    <a href="/tool/extract" className="dropdown-link-custom" style={getLinkStyle('tool-extract')} onClick={(e) => setView('tool-extract', e)}>
                      <ExtractPagesIcon /> Extract pages
                    </a>
                    <a href="/tool/organize" className="dropdown-link-custom" style={getLinkStyle('tool-organize')} onClick={(e) => setView('tool-organize', e)}>
                      <OrganizePdfIcon /> Organize PDF
                    </a>
                    <a href="/tool/scan" className="dropdown-link-custom" style={getLinkStyle('tool-scan')} onClick={(e) => setView('tool-scan', e)}>
                      <ScanPdfIcon /> Scan to PDF
                    </a>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', color: dropdownCategoryColor, marginBottom: '14px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    PDF INTELLIGENCE
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <a href="/tool/aisummarizer" className="dropdown-link-custom" style={getLinkStyle('tool-aisummarizer')} onClick={(e) => setView('tool-aisummarizer', e)}>
                      <AiSummarizerIcon /> AI Summarizer
                    </a>
                    <a href="/tool/translate" className="dropdown-link-custom" style={getLinkStyle('tool-translate')} onClick={(e) => setView('tool-translate', e)}>
                      <TranslatePdfIcon /> Translate PDF
                    </a>
                    <a href="/tool/markdown" className="dropdown-link-custom" style={getLinkStyle('tool-markdown')} onClick={(e) => setView('tool-markdown', e)}>
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
                  <a href="/tool/compress" className="dropdown-link-custom" style={getLinkStyle('tool-compress')} onClick={(e) => setView('tool-compress', e)}>
                    <CompressPdfIcon /> Compress PDF
                  </a>
                  <a href="/tool/repair" className="dropdown-link-custom" style={getLinkStyle('tool-repair')} onClick={(e) => setView('tool-repair', e)}>
                    <RepairPdfIcon /> Repair PDF
                  </a>
                  <a href="/tool/ocr" className="dropdown-link-custom" style={getLinkStyle('tool-ocr')} onClick={(e) => setView('tool-ocr', e)}>
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
                  <a href="/tool/jpgtopdf" className="dropdown-link-custom" style={getLinkStyle('tool-jpgtopdf')} onClick={(e) => setView('tool-jpgtopdf', e)}>
                    <JpgToPdfIcon /> JPG to PDF
                  </a>
                  <a href="/tool/wordtopdf" className="dropdown-link-custom" style={getLinkStyle('tool-wordtopdf')} onClick={(e) => setView('tool-wordtopdf', e)}>
                    <WordToPdfIcon /> WORD to PDF
                  </a>
                  <a href="/tool/powerpointtopdf" className="dropdown-link-custom" style={getLinkStyle('tool-powerpointtopdf')} onClick={(e) => setView('tool-powerpointtopdf', e)}>
                    <PowerpointToPdfIcon /> POWERPOINT to PDF
                  </a>
                  <a href="/tool/exceltopdf" className="dropdown-link-custom" style={getLinkStyle('tool-exceltopdf')} onClick={(e) => setView('tool-exceltopdf', e)}>
                    <ExcelToPdfIcon /> EXCEL to PDF
                  </a>
                  <a href="/tool/htmltopdf" className="dropdown-link-custom" style={getLinkStyle('tool-htmltopdf')} onClick={(e) => setView('tool-htmltopdf', e)}>
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
                  <a href="/tool/pdftojpg" className="dropdown-link-custom" style={getLinkStyle('tool-pdftojpg')} onClick={(e) => setView('tool-pdftojpg', e)}>
                    <PdfToJpgIcon /> PDF to JPG
                  </a>
                  <a href="/tool/pdftoword" className="dropdown-link-custom" style={getLinkStyle('tool-pdftoword')} onClick={(e) => setView('tool-pdftoword', e)}>
                    <PdfToWordIcon /> PDF to WORD
                  </a>
                  <a href="/tool/pdftopowerpoint" className="dropdown-link-custom" style={getLinkStyle('tool-pdftopowerpoint')} onClick={(e) => setView('tool-pdftopowerpoint', e)}>
                    <PdfToPowerpointIcon /> PDF to POWERPOINT
                  </a>
                  <a href="/tool/pdftoexcel" className="dropdown-link-custom" style={getLinkStyle('tool-pdftoexcel')} onClick={(e) => setView('tool-pdftoexcel', e)}>
                    <PdfToExcelIcon /> PDF to EXCEL
                  </a>
                  <a href="/tool/pdfa" className="dropdown-link-custom" style={getLinkStyle('tool-pdfa')} onClick={(e) => setView('tool-pdfa', e)}>
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
                  <a href="/tool/rotate" className="dropdown-link-custom" style={getLinkStyle('tool-rotate')} onClick={(e) => setView('tool-rotate', e)}>
                    <RotatePdfIcon /> Rotate PDF
                  </a>
                  <a href="/tool/pagenumber" className="dropdown-link-custom" style={getLinkStyle('tool-pagenumber')} onClick={(e) => setView('tool-pagenumber', e)}>
                    <PageNumbersIcon /> Add page numbers
                  </a>
                  <a href="/tool/watermark" className="dropdown-link-custom" style={getLinkStyle('tool-watermark')} onClick={(e) => setView('tool-watermark', e)}>
                    <WatermarkIcon /> Add watermark
                  </a>
                  <a href="/tool/crop" className="dropdown-link-custom" style={getLinkStyle('tool-crop')} onClick={(e) => setView('tool-crop', e)}>
                    <CropPdfIcon /> Crop PDF
                  </a>
                  <a href="/tool/edit" className="dropdown-link-custom" style={getLinkStyle('tool-edit')} onClick={(e) => setView('tool-edit', e)}>
                    <EditPdfIcon /> Edit PDF
                  </a>
                  <a href="/tool/forms" className="dropdown-link-custom" style={getLinkStyle('tool-forms')} onClick={(e) => setView('tool-forms', e)}>
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
                  <a href="/tool/unlock" className="dropdown-link-custom" style={getLinkStyle('tool-unlock')} onClick={(e) => setView('tool-unlock', e)}>
                    <UnlockPdfIcon /> Unlock PDF
                  </a>
                  <a href="/tool/protect" className="dropdown-link-custom" style={getLinkStyle('tool-protect')} onClick={(e) => setView('tool-protect', e)}>
                    <ProtectPdfIcon /> Protect PDF
                  </a>
                  <a href="/tool/sign" className="dropdown-link-custom" style={getLinkStyle('tool-sign')} onClick={(e) => setView('tool-sign', e)}>
                    <SignPdfIcon /> Sign PDF
                  </a>
                  <a href="/tool/redact" className="dropdown-link-custom" style={getLinkStyle('tool-redact')} onClick={(e) => setView('tool-redact', e)}>
                    <RedactPdfIcon /> Redact PDF
                  </a>
                  <a href="/tool/compare" className="dropdown-link-custom" style={getLinkStyle('tool-compare')} onClick={(e) => setView('tool-compare', e)}>
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



        {(isLoggedIn || isAdminLoggedIn) ? (
          <>
            {isLoggedIn && currentView !== 'dashboard' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn btn-secondary hide-mobile"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-light)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-dark)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <LayoutDashboard size={15} /> Dashboard
              </button>
            )}

            {isAdminLoggedIn && currentView !== 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="btn btn-secondary hide-mobile"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--primary-color, #6366f1)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Shield size={15} /> Admin Dashboard
              </button>
            )}

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

        {/* 3x3 App launcher dots with Click Popup Menu */}
        <div 
          ref={appLauncherRef}
          className="app-launcher hide-mobile" 
          onClick={(e) => {
            if (!e.target.closest('.app-launcher-popup')) {
              setIsAppLauncherOpen(prev => !prev);
            }
          }}
          style={{ 
            position: 'relative', 
            padding: '8px 10px', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center',
            backgroundColor: isAppLauncherOpen ? 'var(--bg-light)' : 'transparent',
            transition: 'background-color 0.2s ease'
          }} 
          title="iLovePDF Ecosystem & Applications"
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

          {/* Redesigned Premium App Launcher Menu */}
          {isAppLauncherOpen && (
            <div 
              className="app-launcher-popup"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '46px',
                right: '-10px',
                width: '730px',
                maxWidth: 'calc(100vw - 24px)',
                boxSizing: 'border-box',
                backgroundColor: dropdownBg,
                border: `1px solid ${dropdownBorder}`,
                borderRadius: '16px',
                boxShadow: theme === 'dark' 
                  ? '0 24px 50px -10px rgba(0, 0, 0, 0.55), 0 0 1px 1px rgba(255, 255, 255, 0.08)' 
                  : '0 20px 48px -10px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.04)',
                padding: '22px 24px',
                zIndex: 2000,
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: '1.15fr 1.15fr 155px',
                gap: '20px',
                animation: 'fadeIn 0.18s ease-out'
              }}
            >
              {/* Arrow pointer positioned directly below 9-dots button */}
              <div style={{
                position: 'absolute',
                top: '-7px',
                right: '23px',
                transform: 'rotate(45deg)',
                width: '12px',
                height: '12px',
                backgroundColor: dropdownBg,
                borderLeft: `1px solid ${dropdownBorder}`,
                borderTop: `1px solid ${dropdownBorder}`,
                zIndex: 2001
              }} />

              {/* COLUMN 2: SOLUTIONS & APPLICATIONS */}
              <div style={{ borderLeft: `1px solid ${dropdownBorder}`, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: '800', color: dropdownCategoryColor, letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                    SOLUTIONS
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Business */}
                    <a 
                      href="#business" 
                      onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/pricing'); }} 
                      className="app-launcher-item" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', padding: '7px 8px', borderRadius: '10px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={20} color="#dc2626" />
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-dark)' }}>Business</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '1px' }}>Streamlined workflows for teams</div>
                        </div>
                      </div>
                      <ChevronRight size={15} className="item-arrow" />
                    </a>

                    {/* Education */}
                    <a 
                      href="#education" 
                      onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/pricing'); }} 
                      className="app-launcher-item" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', padding: '7px 8px', borderRadius: '10px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <GraduationCap size={20} color="#d97706" />
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-dark)' }}>Education</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '1px' }}>Smart tools for schools & students</div>
                        </div>
                      </div>
                      <ChevronRight size={15} className="item-arrow" />
                    </a>
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${dropdownBorder}`, paddingTop: '10px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: '800', color: dropdownCategoryColor, letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                    APPLICATIONS
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Mobile App */}
                    <a 
                      href="#mobile" 
                      onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/'); }} 
                      className="app-launcher-item" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', padding: '7px 8px', borderRadius: '10px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Smartphone size={20} color="#9333ea" />
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-dark)' }}>Mobile App</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '1px' }}>Scan and edit on iOS & Android</div>
                        </div>
                      </div>
                      <ChevronRight size={15} className="item-arrow" />
                    </a>
                  </div>
                </div>
              </div>

              {/* COLUMN 3: QUICK LINKS & HELP */}
              <div style={{ borderLeft: `1px solid ${dropdownBorder}`, paddingLeft: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: '800', color: dropdownCategoryColor, letterSpacing: '0.8px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                    QUICK ACCESS
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <a 
                      href="#pricing" 
                      onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/pricing'); }} 
                      className="app-launcher-link" 
                      style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '600', fontSize: '13.5px', padding: '6px 8px', borderRadius: '8px' }}
                    >
                      <CreditCard size={15} color="var(--text-gray)" /> Pricing
                    </a>

                    <a 
                      href="#security" 
                      onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/security'); }} 
                      className="app-launcher-link" 
                      style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '600', fontSize: '13.5px', padding: '6px 8px', borderRadius: '8px' }}
                    >
                      <Shield size={15} color="var(--text-gray)" /> Security
                    </a>

                    <a 
                      href="#features" 
                      onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/'); }} 
                      className="app-launcher-link" 
                      style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '600', fontSize: '13.5px', padding: '6px 8px', borderRadius: '8px' }}
                    >
                      <LayoutDashboard size={15} color="var(--text-gray)" /> Features
                    </a>

                    <a 
                      href="#about" 
                      onClick={(e) => { e.preventDefault(); setIsAppLauncherOpen(false); navigate('/about'); }} 
                      className="app-launcher-link" 
                      style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '600', fontSize: '13.5px', padding: '6px 8px', borderRadius: '8px' }}
                    >
                      <Heart size={15} color="var(--text-gray)" /> About us
                    </a>
                  </div>
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
            <a href="/tool/merge" className="mobile-nav-item" onClick={(e) => setView('tool-merge', e)}>
              <span className="mobile-nav-label"><MergePdfIcon /> Merge PDF</span> <ArrowRight size={16} />
            </a>
            <a href="/tool/split" className="mobile-nav-item" onClick={(e) => setView('tool-split', e)}>
              <span className="mobile-nav-label"><SplitPdfIcon /> Split PDF</span> <ArrowRight size={16} />
            </a>
            <a href="/tool/compress" className="mobile-nav-item" onClick={(e) => setView('tool-compress', e)}>
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
                <a href="/tool/jpgtopdf" className="mobile-nav-sublink" onClick={(e) => setView('tool-jpgtopdf', e)}>
                  <JpgToPdfIcon /> JPG to PDF
                </a>
                <a href="/tool/wordtopdf" className="mobile-nav-sublink" onClick={(e) => setView('tool-wordtopdf', e)}>
                  <WordToPdfIcon /> Word to PDF
                </a>
                <a href="/tool/powerpointtopdf" className="mobile-nav-sublink" onClick={(e) => setView('tool-powerpointtopdf', e)}>
                  <PowerpointToPdfIcon /> PowerPoint to PDF
                </a>
                <a href="/tool/exceltopdf" className="mobile-nav-sublink" onClick={(e) => setView('tool-exceltopdf', e)}>
                  <ExcelToPdfIcon /> Excel to PDF
                </a>
                <a href="/tool/htmltopdf" className="mobile-nav-sublink" onClick={(e) => setView('tool-htmltopdf', e)}>
                  <HtmlToPdfIcon /> HTML to PDF
                </a>

                <div className="mobile-nav-subheading" style={{ marginTop: '10px' }}>CONVERT FROM PDF</div>
                <a href="/tool/pdftojpg" className="mobile-nav-sublink" onClick={(e) => setView('tool-pdftojpg', e)}>
                  <PdfToJpgIcon /> PDF to JPG
                </a>
                <a href="/tool/pdftoword" className="mobile-nav-sublink" onClick={(e) => setView('tool-pdftoword', e)}>
                  <PdfToWordIcon /> PDF to Word
                </a>
                <a href="/tool/pdftopowerpoint" className="mobile-nav-sublink" onClick={(e) => setView('tool-pdftopowerpoint', e)}>
                  <PdfToPowerpointIcon /> PDF to PowerPoint
                </a>
                <a href="/tool/pdftoexcel" className="mobile-nav-sublink" onClick={(e) => setView('tool-pdftoexcel', e)}>
                  <PdfToExcelIcon /> PDF to Excel
                </a>
                <a href="/tool/pdfa" className="mobile-nav-sublink" onClick={(e) => setView('tool-pdfa', e)}>
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
                <a href="/tool/edit" className="mobile-nav-sublink" onClick={(e) => setView('tool-edit', e)}>
                  <EditPdfIcon /> Edit PDF
                </a>
                <a href="/tool/sign" className="mobile-nav-sublink" onClick={(e) => setView('tool-sign', e)}>
                  <SignPdfIcon /> Sign PDF
                </a>
                <a href="/tool/watermark" className="mobile-nav-sublink" onClick={(e) => setView('tool-watermark', e)}>
                  <WatermarkIcon /> Watermark
                </a>
                <a href="/tool/rotate" className="mobile-nav-sublink" onClick={(e) => setView('tool-rotate', e)}>
                  <RotatePdfIcon /> Rotate PDF
                </a>
                <a href="/tool/crop" className="mobile-nav-sublink" onClick={(e) => setView('tool-crop', e)}>
                  <CropPdfIcon /> Crop PDF
                </a>
                <a href="/tool/pagenumber" className="mobile-nav-sublink" onClick={(e) => setView('tool-pagenumber', e)}>
                  <PageNumbersIcon /> Page Numbers
                </a>

                <div className="mobile-nav-subheading" style={{ marginTop: '10px' }}>SECURITY & REPAIR</div>
                <a href="/tool/protect" className="mobile-nav-sublink" onClick={(e) => setView('tool-protect', e)}>
                  <ProtectPdfIcon /> Protect PDF
                </a>
                <a href="/tool/unlock" className="mobile-nav-sublink" onClick={(e) => setView('tool-unlock', e)}>
                  <UnlockPdfIcon /> Unlock PDF
                </a>
                <a href="/tool/redact" className="mobile-nav-sublink" onClick={(e) => setView('tool-redact', e)}>
                  <RedactPdfIcon /> Redact PDF
                </a>
                <a href="/tool/repair" className="mobile-nav-sublink" onClick={(e) => setView('tool-repair', e)}>
                  <RepairPdfIcon /> Repair PDF
                </a>

                <div className="mobile-nav-subheading" style={{ marginTop: '10px' }}>AI & ADVANCED</div>
                <a href="/tool/ocr" className="mobile-nav-sublink" onClick={(e) => setView('tool-ocr', e)}>
                  <OcrPdfIcon /> OCR PDF
                </a>
                <a href="/tool/compare" className="mobile-nav-sublink" onClick={(e) => setView('tool-compare', e)}>
                  <ComparePdfIcon /> Compare PDF
                </a>
                <a href="/tool/aisummarizer" className="mobile-nav-sublink" onClick={(e) => setView('tool-aisummarizer', e)}>
                  <AiSummarizerIcon /> AI Summarizer
                </a>
                <a href="/tool/translate" className="mobile-nav-sublink" onClick={(e) => setView('tool-translate', e)}>
                  <TranslatePdfIcon /> Translate PDF
                </a>
                <a href="/tool/markdown" className="mobile-nav-sublink" onClick={(e) => setView('tool-markdown', e)}>
                  <PdfToMarkdownIcon /> PDF to Markdown
                </a>
                <a href="/tool/forms" className="mobile-nav-sublink" onClick={(e) => setView('tool-forms', e)}>
                  <PdfFormsIcon /> PDF Forms
                </a>
                <a href="/tool/organize" className="mobile-nav-sublink" onClick={(e) => setView('tool-organize', e)}>
                  <OrganizePdfIcon /> Organize PDF
                </a>
                <a href="/tool/scan" className="mobile-nav-sublink" onClick={(e) => setView('tool-scan', e)}>
                  <ScanPdfIcon /> Scan to PDF
                </a>
              </div>
            )}

            {/* General Navigation Links */}
            <div className="mobile-nav-section-title" style={{ marginTop: '14px' }}>NAVIGATION</div>
            <a href="/pricing" className="mobile-nav-item" onClick={(e) => { e.preventDefault(); navigate('/pricing'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><CreditCard size={18} /> Pricing</span> <ArrowRight size={16} />
            </a>
            <a href="/#features" className="mobile-nav-item" onClick={(e) => { e.preventDefault(); navigate('/#features'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><LayoutDashboard size={18} /> Features</span> <ArrowRight size={16} />
            </a>
            <a href="/help" className="mobile-nav-item" onClick={(e) => { e.preventDefault(); navigate('/help'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><HelpCircle size={18} /> Help & Support</span> <ArrowRight size={16} />
            </a>
            <a href="/contact" className="mobile-nav-item" onClick={(e) => { e.preventDefault(); navigate('/contact'); setMobileMenuOpen(false); }}>
              <span className="mobile-nav-label"><Building2 size={18} /> Contact Sales</span> <ArrowRight size={16} />
            </a>
            <a href="/privacy" className="mobile-nav-item" onClick={(e) => { e.preventDefault(); navigate('/privacy'); setMobileMenuOpen(false); }}>
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
              {(isLoggedIn || isAdminLoggedIn) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  {isLoggedIn && currentView !== 'dashboard' && (
                    <button 
                      type="button"
                      className="btn btn-primary"
                      onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '15px', fontWeight: '800' }}
                    >
                      <LayoutDashboard size={16} /> Open Dashboard
                    </button>
                  )}
                  {isAdminLoggedIn && currentView !== 'admin' && (
                    <button 
                      type="button"
                      className="btn btn-primary"
                      onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '15px', fontWeight: '800', backgroundColor: '#6366f1' }}
                    >
                      <Shield size={16} /> Admin Dashboard
                    </button>
                  )}
                  <button 
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { onLogoutClick(); setMobileMenuOpen(false); }}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
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
