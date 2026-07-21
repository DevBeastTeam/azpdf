import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolsGrid from './components/ToolsGrid';
import ToolWorkspace from './components/ToolWorkspace';
import Pricing from './components/Pricing';
import ContactUs from './components/ContactUs';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import HelpAndSupport from './components/HelpAndSupport';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [theme, setTheme] = useState('light');
  const [currentView, setCurrentView] = useState('home');
  const [activeTool, setActiveTool] = useState(null);

  // Lifted Database States
  const [usersData, setUsersData] = useState([
    { id: 1, name: 'Sarah Johnson',    email: 'sarah.j@company.com',    plan: 'Premium',  joinDate: 'Jan 12, 2026', status: 'Active',   files: 142, avatar: 'SJ' },
    { id: 2, name: 'Ahmed Raza',       email: 'ahmed.raza@gmail.com',   plan: 'Premium',  joinDate: 'Feb 3, 2026',  status: 'Active',   files: 87,  avatar: 'AR' },
    { id: 3, name: 'Maria Garcia',     email: 'maria.g@outlook.com',    plan: 'Free',     joinDate: 'Mar 19, 2026', status: 'Active',   files: 23,  avatar: 'MG' },
    { id: 4, name: 'James Wilson',     email: 'jwilson@techcorp.io',    plan: 'Premium',  joinDate: 'Jan 30, 2026', status: 'Active',   files: 310, avatar: 'JW' },
    { id: 5, name: 'Ayesha Khan',      email: 'ayesha.k@webdev.pk',     plan: 'Premium',  joinDate: 'Apr 5, 2026',  status: 'Banned',   files: 56,  avatar: 'AK' },
    { id: 6, name: 'Carlos Mendez',    email: 'carlos@designstudio.es', plan: 'Free',     joinDate: 'May 10, 2026', status: 'Inactive', files: 4,   avatar: 'CM' },
    { id: 7, name: 'Priya Sharma',     email: 'priya.s@infosys.in',     plan: 'Premium',  joinDate: 'Feb 22, 2026', status: 'Active',   files: 204, avatar: 'PS' },
    { id: 8, name: 'Oliver Smith',     email: 'oliver.s@ukfirm.co.uk',  plan: 'Premium',  joinDate: 'Jun 1, 2026',  status: 'Active',   files: 39,  avatar: 'OS' },
    { id: 9, name: 'Fatima Al-Hassan', email: 'fatima.h@arabtech.ae',   plan: 'Free',     joinDate: 'Jun 18, 2026', status: 'Banned',   files: 11,  avatar: 'FA' },
    { id: 10, name: 'David Chen',      email: 'dchen@startuplab.sg',    plan: 'Premium',  joinDate: 'Mar 8, 2026',  status: 'Inactive', files: 88,  avatar: 'DC' },
  ]);

  const [recentFiles, setRecentFiles] = useState([
    { id: 1, name: 'annual_financial_report_2026.pdf', tool: 'Merge PDF', size: '4.2 MB', date: 'Just now', pages: 18, status: 'Completed' },
    { id: 2, name: 'client_contract_signed.pdf', tool: 'Protect PDF', size: '1.8 MB', date: '2 hours ago', pages: 6, status: 'Completed' },
    { id: 3, name: 'scanned_tax_invoice.pdf', tool: 'OCR PDF', size: '3.1 MB', date: 'Yesterday', pages: 4, status: 'Completed' },
    { id: 4, name: 'company_presentation.pdf', tool: 'Compress PDF', size: '12.4 MB', date: '3 days ago', pages: 24, status: 'Completed' },
    { id: 5, name: 'product_specs_draft.pdf', tool: 'PDF to Word', size: '2.5 MB', date: '5 days ago', pages: 10, status: 'Completed' }
  ]);

  const [toolsConfig, setToolsConfig] = useState({
    'tool-merge': { enabled: true, maxFileSizeMb: 50 },
    'tool-split': { enabled: true, maxFileSizeMb: 50 },
    'tool-compress': { enabled: true, maxFileSizeMb: 25 },
    'tool-pdftoword': { enabled: true, maxFileSizeMb: 15 },
    'tool-pdftopowerpoint': { enabled: true, maxFileSizeMb: 15 },
    'tool-pdftoexcel': { enabled: true, maxFileSizeMb: 10 },
    'tool-wordtopdf': { enabled: true, maxFileSizeMb: 20 },
    'tool-powerpointtopdf': { enabled: true, maxFileSizeMb: 20 },
    'tool-exceltopdf': { enabled: true, maxFileSizeMb: 20 },
    'tool-edit': { enabled: true, maxFileSizeMb: 15 },
    'tool-pdftojpg': { enabled: true, maxFileSizeMb: 20 },
    'tool-jpgtopdf': { enabled: true, maxFileSizeMb: 20 },
    'tool-organize': { enabled: true, maxFileSizeMb: 25 },
    'tool-protect': { enabled: true, maxFileSizeMb: 10 },
    'tool-unlock': { enabled: true, maxFileSizeMb: 15 },
    'tool-aisummarizer': { enabled: true, maxFileSizeMb: 5 },
    'tool-translate': { enabled: true, maxFileSizeMb: 8 },
    'tool-markdown': { enabled: true, maxFileSizeMb: 5 }
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoCleanupHours: 2,
    maxStoragePoolGb: 50,
    monthlyPremiumPrice: 6.00,
    monthlyBusinessPrice: 12.00,
    autoCleanupEnabled: true
  });

  const [bypassMaintenance, setBypassMaintenance] = useState(false);
  const [showBypassModal, setShowBypassModal] = useState(false);
  const [bypassCode, setBypassCode] = useState('');
  const [bypassError, setBypassError] = useState('');

  // Sync theme with DOM documentElement attributes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSelectTool = (tool) => {
    setActiveTool(tool);
    setCurrentView(tool.id);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setActiveTool(null);
  };

  // Callback when a tool successfully processes a file
  const handleFileProcessed = (newFile) => {
    const fileWithId = {
      id: Date.now(),
      name: newFile.name,
      tool: newFile.tool,
      size: newFile.size,
      date: 'Just now',
      pages: Math.floor(Math.random() * 20) + 1,
      status: 'Completed'
    };
    setRecentFiles(prev => [fileWithId, ...prev]);

    // Also update logged-in user files count (DevBeast Team)
    setUsersData(prev => prev.map(u => {
      if (u.name === 'DevBeast Team' || u.id === 1) {
        return { ...u, files: u.files + 1 };
      }
      return u;
    }));
  };

  const handleSetViewFromNav = (viewName) => {
    if (viewName === 'home') {
      handleBackToHome();
    } else if (viewName === 'contact') {
      setCurrentView('contact');
      setActiveTool(null);
    } else if (viewName === 'dashboard') {
      setCurrentView('dashboard');
      setActiveTool(null);
    } else if (viewName === 'admin') {
      setCurrentView('admin');
      setActiveTool(null);
    } else if (viewName === 'terms') {
      setCurrentView('terms');
      setActiveTool(null);
      window.scrollTo(0, 0);
    } else if (viewName === 'privacy') {
      setCurrentView('privacy');
      setActiveTool(null);
      window.scrollTo(0, 0);
    } else if (viewName === 'help') {
      setCurrentView('help');
      setActiveTool(null);
      window.scrollTo(0, 0);
    } else if (viewName.startsWith('tool-')) {
      const toolId = viewName;
      let title = 'PDF Tool';
      let desc = 'Work with PDF files easily and securely.';
      
      if (toolId === 'tool-merge') {
        title = 'Merge PDF';
        desc = 'Combine PDFs in the order you want with the easiest PDF merger available.';
      } else if (toolId === 'tool-split') {
        title = 'Split PDF';
        desc = 'Separate one page or a whole set for easy conversion into independent PDF files.';
      } else if (toolId === 'tool-compress') {
        title = 'Compress PDF';
        desc = 'Reduce file size while optimizing for maximal PDF quality.';
      } else if (toolId === 'tool-pdftoword') {
        title = 'PDF to Word';
        desc = 'Easily convert your PDF files into easy to edit DOC and DOCX documents.';
      } else if (toolId === 'tool-pdftopowerpoint') {
        title = 'PDF to PowerPoint';
        desc = 'Turn your PDF files into easy to edit PPT and PPTX slideshows.';
      } else if (toolId === 'tool-pdftoexcel') {
        title = 'PDF to Excel';
        desc = 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.';
      } else if (toolId === 'tool-wordtopdf') {
        title = 'Word to PDF';
        desc = 'Make DOC and DOCX files easy to read by converting them to PDF.';
      } else if (toolId === 'tool-powerpointtopdf') {
        title = 'PowerPoint to PDF';
        desc = 'Make PPT and PPTX slideshows easy to view by converting them to PDF.';
      } else if (toolId === 'tool-exceltopdf') {
        title = 'Excel to PDF';
        desc = 'Make EXCEL spreadsheets easy to read by converting them to PDF.';
      } else if (toolId === 'tool-organize') {
        title = 'Organize PDF';
        desc = 'Sort, add, delete, or rotate PDF pages in a document at your convenience.';
      } else if (toolId === 'tool-protect') {
        title = 'Protect PDF';
        desc = 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.';
      } else if (toolId === 'tool-unlock') {
        title = 'Unlock PDF';
        desc = 'Remove PDF password security, giving you the freedom to use your files as you want.';
      } else if (toolId === 'tool-aisummarizer') {
        title = 'AI Summarizer';
        desc = 'Summarize documents using AI, extract key highlights, answers, and summaries in seconds.';
      } else if (toolId === 'tool-translate') {
        title = 'Translate PDF';
        desc = 'Translate PDF files into multiple languages instantly using AI-powered translations.';
      } else if (toolId === 'tool-markdown') {
        title = 'PDF to Markdown';
        desc = 'Convert rich PDFs to structural Markdown formatting for clean editing.';
      }

      setActiveTool({ id: toolId, title, desc });
      setCurrentView(toolId);
    }
  };

  const handleBypassSubmit = (e) => {
    e.preventDefault();
    if (bypassCode === 'admin123' || bypassCode === 'admin') {
      setBypassMaintenance(true);
      setShowBypassModal(false);
      setBypassError('');
      setCurrentView('admin');
    } else {
      setBypassError('Galt Access Code! (Try "admin123")');
    }
  };

  // If maintenance mode is active and not bypassed by admin
  const isMaintenanceActive = systemSettings.maintenanceMode && !bypassMaintenance;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isMaintenanceActive && (
        <Header 
          theme={theme} 
          toggleTheme={toggleTheme} 
          currentView={currentView}
          setView={handleSetViewFromNav}
        />
      )}
      
      <main className="main-content" style={{ marginTop: isMaintenanceActive ? 0 : '64px' }}>
        {isMaintenanceActive ? (
          // BEAUTIFUL PREMIUM MAINTENANCE SCREEN
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'var(--font-family)',
            padding: '24px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background glowing effects */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(229,36,36,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{
              maxWidth: '600px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '48px 40px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(229,36,36,0.1)',
                color: 'var(--primary-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                marginBottom: '28px',
                marginLeft: 'auto',
                marginRight: 'auto',
                animation: 'pulse 2s infinite'
              }}>
                🛠️
              </div>
              
              <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>
                Scheduled Updates in Progress
              </h1>
              
              <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.7', marginBottom: '32px' }}>
                We are performing essential system maintenance and optimization on the PDF processing engine. We will be back online shortly. Thank you for your patience!
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                  Expected Down-Time: ~15 mins
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-red)', animation: 'ping 1s infinite' }} />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Monitoring server telemetry...</span>
                </div>
              </div>

              {/* Staff login link */}
              <button 
                onClick={() => setShowBypassModal(true)}
                style={{
                  marginTop: '40px',
                  fontSize: '13px',
                  color: '#64748b',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-red)'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
              >
                Access Portal (Admins Only)
              </button>
            </div>

            {/* Bypass Modal Dialog */}
            {showBypassModal && (
              <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                backdropFilter: 'blur(8px)'
              }}>
                <div style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '30px',
                  width: '380px',
                  textAlign: 'left'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '14px', color: '#fff' }}>Admin Access Portal</h3>
                  <form onSubmit={handleBypassSubmit}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '700' }}>
                      Enter Access Code (admin123)
                    </label>
                    <input 
                      type="password"
                      placeholder="Access Code"
                      value={bypassCode}
                      onChange={e => setBypassCode(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #475569',
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        marginBottom: '12px'
                      }}
                      autoFocus
                    />
                    {bypassError && <div style={{ color: 'var(--primary-red)', fontSize: '12px', marginBottom: '12px', fontWeight: '600' }}>{bypassError}</div>}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        type="button" 
                        onClick={() => { setShowBypassModal(false); setBypassError(''); }} 
                        style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#334155', color: '#94a3b8', fontSize: '13px', fontWeight: '700' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--primary-red)', color: '#fff', fontSize: '13px', fontWeight: '700' }}
                      >
                        Submit Code
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Standard Views Router
          <>
            {/* If bypassed maintenance, show a nice top-banner notification to admin */}
            {systemSettings.maintenanceMode && bypassMaintenance && (
              <div style={{
                backgroundColor: 'var(--primary-red)',
                color: '#fff',
                padding: '8px 16px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                position: 'sticky',
                top: 0,
                zIndex: 999
              }}>
                <span>🛠️ Maintenance Mode Active (Viewing with Admin Bypass Mode).</span>
                <button 
                  onClick={() => setBypassMaintenance(false)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Enable Overlay
                </button>
              </div>
            )}

            {currentView === 'home' ? (
              <>
                <Hero />
                <ToolsGrid toolsConfig={toolsConfig} onSelectTool={handleSelectTool} />
                <Pricing onContactSales={() => setCurrentView('contact')} />
              </>
            ) : currentView === 'contact' ? (
              <ContactUs onBack={handleBackToHome} />
            ) : currentView === 'dashboard' ? (
              <Dashboard 
                setView={handleSetViewFromNav} 
                onSelectTool={handleSelectTool} 
                usersData={usersData}
                setUsersData={setUsersData}
                recentFiles={recentFiles}
                setRecentFiles={setRecentFiles}
              />
            ) : currentView === 'admin' ? (
              <AdminPanel 
                onBack={handleBackToHome}
                setView={handleSetViewFromNav}
                usersData={usersData}
                setUsersData={setUsersData}
                recentFiles={recentFiles}
                setRecentFiles={setRecentFiles}
                toolsConfig={toolsConfig}
                setToolsConfig={setToolsConfig}
                systemSettings={systemSettings}
                setSystemSettings={setSystemSettings}
              />
            ) : currentView === 'terms' ? (
              <TermsAndConditions onBack={handleBackToHome} />
            ) : currentView === 'privacy' ? (
              <PrivacyPolicy onBack={handleBackToHome} />
            ) : currentView === 'help' ? (
              <HelpAndSupport onBack={handleBackToHome} />
            ) : (
              activeTool && (
                <ToolWorkspace 
                  tool={activeTool} 
                  toolsConfig={toolsConfig}
                  onBack={handleBackToHome} 
                  onFileProcessed={handleFileProcessed}
                />
              )
            )}
          </>
        )}
      </main>

      {!isMaintenanceActive && currentView !== 'dashboard' && currentView !== 'admin' && (
        <Footer setView={handleSetViewFromNav} />
      )}
    </div>
  );
}

export default App;
