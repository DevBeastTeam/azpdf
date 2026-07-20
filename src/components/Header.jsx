import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Moon, Sun, Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { 
  JpgToPdfIcon, WordToPdfIcon, PowerpointToPdfIcon, ExcelToPdfIcon, HtmlToPdfIcon,
  PdfToJpgIcon, PdfToWordIcon, PdfToPowerpointIcon, PdfToExcelIcon, PdfToPdfaIcon,
  MergePdfIcon, SplitPdfIcon, OrganizePdfIcon, ProtectPdfIcon, UnlockPdfIcon, AiSummarizerIcon,
  CompressPdfIcon, RepairPdfIcon, RemovePagesIcon, ExtractPagesIcon, ScanPdfIcon, OcrPdfIcon,
  RotatePdfIcon, PageNumbersIcon, WatermarkIcon, CropPdfIcon, EditPdfIcon, PdfFormsIcon,
  SignPdfIcon, RedactPdfIcon, ComparePdfIcon, TranslatePdfIcon, PdfToMarkdownIcon
} from './Icons';

export default function Header({ theme, toggleTheme, currentView, setView }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isAllToolsOpen, setIsAllToolsOpen] = useState(false);

  const getNavItemStyle = (views) => {
    const isActive = views.includes(currentView);
    return {
      color: isActive ? 'var(--primary-red)' : 'var(--text-dark)',
      fontWeight: '700',
      fontSize: '14px',
      letterSpacing: '0.5px'
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
        <a href="#home" className="brand" onClick={() => { setView('home'); setMobileMenuOpen(false); }} style={{ gap: '2px' }}>
          <span style={{ fontWeight: '900', color: '#1f2937' }}>I</span>
          <span style={{ color: 'var(--primary-red)', fontSize: '22px', display: 'flex', alignItems: 'center' }}>❤️</span>
          <span style={{ fontWeight: '900', color: '#1f2937' }}>PDF</span>
        </a>

        {/* Desktop Navigation */}
        <ul className="nav-menu">
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
            className="nav-item" 
            onMouseEnter={() => setIsConvertOpen(true)}
            onMouseLeave={() => setIsConvertOpen(false)}
            onClick={() => setIsConvertOpen(!isConvertOpen)}
            style={{ 
              cursor: 'pointer',
              ...getNavItemStyle([
                'tool-pdftoword', 'tool-pdftopowerpoint', 'tool-pdftoexcel',
                'tool-wordtopdf', 'tool-powerpointtopdf', 'tool-exceltopdf',
                'tool-pdftojpg', 'tool-jpgtopdf', 'tool-htmltopdf', 'tool-pdfa'
              ])
            }}
          >
            CONVERT PDF {isConvertOpen ? <ChevronUp size={14} style={{ color: 'var(--primary-red)' }} /> : <ChevronDown size={14} />}
            <div 
              className="convert-dropdown-container" 
              style={{
                position: 'absolute',
                top: '52px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '600px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.12)',
                padding: '30px 36px 36px 36px',
                display: isConvertOpen ? 'flex' : 'none',
                flexDirection: 'row',
                gap: '40px',
                zIndex: 1001,
                textAlign: 'left'
              }}
            >
              {/* White pointer arrow at the top */}
              <div style={{
                position: 'absolute',
                top: '-9px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '16px',
                height: '16px',
                backgroundColor: '#ffffff',
                borderLeft: '1px solid #e5e7eb',
                borderTop: '1px solid #e5e7eb',
                zIndex: 1002
              }} />

              {/* Left Column: CONVERT TO PDF */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#9ca3af', marginBottom: '14px', letterSpacing: '0.5px' }}>
                  CONVERT TO PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="#jpg-to-pdf" className="dropdown-link-custom" onClick={() => setView('tool-jpgtopdf')}>
                    <JpgToPdfIcon /> JPG to PDF
                  </a>
                  <a href="#word-to-pdf" className="dropdown-link-custom" onClick={() => setView('tool-wordtopdf')}>
                    <WordToPdfIcon /> WORD to PDF
                  </a>
                  <a href="#powerpoint-to-pdf" className="dropdown-link-custom" onClick={() => setView('tool-powerpointtopdf')}>
                    <PowerpointToPdfIcon /> POWERPOINT to PDF
                  </a>
                  <a href="#excel-to-pdf" className="dropdown-link-custom" onClick={() => setView('tool-exceltopdf')}>
                    <ExcelToPdfIcon /> EXCEL to PDF
                  </a>
                  <a href="#html-to-pdf" className="dropdown-link-custom" onClick={() => setView('tool-htmltopdf')}>
                    <HtmlToPdfIcon /> HTML to PDF
                  </a>
                </div>
              </div>

              {/* Right Column: CONVERT FROM PDF */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#9ca3af', marginBottom: '14px', letterSpacing: '0.5px' }}>
                  CONVERT FROM PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="#pdf-to-jpg" className="dropdown-link-custom" onClick={() => setView('tool-pdftojpg')}>
                    <PdfToJpgIcon /> PDF to JPG
                  </a>
                  <a href="#pdf-to-word" className="dropdown-link-custom" onClick={() => setView('tool-pdftoword')}>
                    <PdfToWordIcon /> PDF to WORD
                  </a>
                  <a href="#pdf-to-powerpoint" className="dropdown-link-custom" onClick={() => setView('tool-pdftopowerpoint')}>
                    <PdfToPowerpointIcon /> PDF to POWERPOINT
                  </a>
                  <a href="#pdf-to-excel" className="dropdown-link-custom" onClick={() => setView('tool-pdftoexcel')}>
                    <PdfToExcelIcon /> PDF to EXCEL
                  </a>
                  <a href="#pdf-to-pdfa" className="dropdown-link-custom" onClick={() => setView('tool-pdfa')}>
                    <PdfToPdfaIcon /> PDF to PDF/A
                  </a>
                </div>
              </div>
            </div>
          </li>
          <li 
            className="nav-item" 
            onMouseEnter={() => setIsAllToolsOpen(true)}
            onMouseLeave={() => setIsAllToolsOpen(false)}
            onClick={() => setIsAllToolsOpen(!isAllToolsOpen)}
            style={{ 
              position: 'static', 
              cursor: 'pointer',
              ...getNavItemStyle([
                'tool-edit', 'tool-sign', 'tool-watermark', 'tool-rotate',
                'tool-unlock', 'tool-protect', 'tool-organize', 'tool-repair',
                'tool-pagenumber', 'tool-scan', 'tool-ocr', 'tool-compare',
                'tool-redact', 'tool-crop', 'tool-forms', 'tool-aisummarizer',
                'tool-translate', 'tool-markdown', 'tool-remove', 'tool-extract'
              ])
            }}
          >
            ALL PDF TOOLS {isAllToolsOpen ? <ChevronUp size={14} style={{ color: 'var(--primary-red)' }} /> : <ChevronDown size={14} />}
            <div 
              className="all-tools-dropdown-container" 
              style={{
                position: 'absolute',
                top: '52px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '1240px',
                maxWidth: '96vw',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.12)',
                padding: '36px 48px 48px 48px',
                display: isAllToolsOpen ? 'grid' : 'none',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '24px',
                zIndex: 1001,
                textAlign: 'left'
              }}
            >
              {/* White pointer arrow at the top */}
              <div style={{
                position: 'absolute',
                top: '-9px',
                left: '58%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '16px',
                height: '16px',
                backgroundColor: '#ffffff',
                borderLeft: '1px solid #e5e7eb',
                borderTop: '1px solid #e5e7eb',
                zIndex: 1002
              }} />

              {/* Column 1: ORGANIZE PDF & PDF INTELLIGENCE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#9ca3af', marginBottom: '14px', letterSpacing: '0.5px' }}>
                    ORGANIZE PDF
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#9ca3af', marginBottom: '14px', letterSpacing: '0.5px' }}>
                    PDF INTELLIGENCE
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#9ca3af', marginBottom: '14px', letterSpacing: '0.5px' }}>
                  OPTIMIZE PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#9ca3af', marginBottom: '14px', letterSpacing: '0.5px' }}>
                  CONVERT TO PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#9ca3af', marginBottom: '14px', letterSpacing: '0.5px' }}>
                  CONVERT FROM PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#9ca3af', marginBottom: '14px', letterSpacing: '0.5px' }}>
                  EDIT PDF
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#9ca3af', marginBottom: '14px', letterSpacing: '0.5px' }}>
                  PDF SECURITY
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
          </li>

        </ul>
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Dark Mode">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <a href="#login" className="btn btn-secondary hide-mobile" style={{ border: 'none', fontWeight: '700', color: 'var(--text-dark)' }}>Login</a>
        <a href="#register" className="btn btn-primary hide-mobile" style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700' }}>Sign up</a>

        {/* 3x3 App launcher dots */}
        <div className="app-launcher hide-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 4px)', gap: '3px', cursor: 'pointer', padding: '6px' }} title="iLovePDF Products">
          {[...Array(9)].map((_, i) => (
            <div key={i} style={{ width: '4px', height: '4px', backgroundColor: '#33333b', borderRadius: '50%' }} />
          ))}
        </div>

        <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav">
          <a href="#merge" className="mobile-nav-item" onClick={() => { setView('tool-merge'); setMobileMenuOpen(false); }}>
            MERGE PDF <ArrowRight size={16} />
          </a>
          <a href="#split" className="mobile-nav-item" onClick={() => { setView('tool-split'); setMobileMenuOpen(false); }}>
            SPLIT PDF <ArrowRight size={16} />
          </a>
          <a href="#compress" className="mobile-nav-item" onClick={() => { setView('tool-compress'); setMobileMenuOpen(false); }}>
            COMPRESS PDF <ArrowRight size={16} />
          </a>
          <a href="#login" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
            Login <ArrowRight size={16} />
          </a>
          <a href="#register" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--primary-red)' }}>
            Sign up <ArrowRight size={16} />
          </a>
        </div>
      )}
    </header>
  );
}
