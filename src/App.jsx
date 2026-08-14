import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolsGrid from './components/ToolsGrid';
import Pricing from './components/Pricing';
import ContactUs from './components/ContactUs';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import HelpAndSupport from './components/HelpAndSupport';
import ToolWorkspace from './components/ToolWorkspace';
import Footer from './components/Footer';
import './App.css';

// ─── Global App Context ────────────────────────────────────────────────────────
export const AppContext = createContext(null);

export function useAppContext() {
  return useContext(AppContext);
}

// ─── Tool metadata lookup ──────────────────────────────────────────────────────
const toolMeta = {
  merge:           { title: 'Merge PDF',          desc: 'Combine PDFs in the order you want with the easiest PDF merger available.' },
  split:           { title: 'Split PDF',           desc: 'Separate one page or a whole set for easy conversion into independent PDF files.' },
  compress:        { title: 'Compress PDF',        desc: 'Reduce file size while optimizing for maximal PDF quality.' },
  pdftoword:       { title: 'PDF to Word',         desc: 'Easily convert your PDF files into easy to edit DOC and DOCX documents.' },
  pdftopowerpoint: { title: 'PDF to PowerPoint',   desc: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.' },
  pdftoexcel:      { title: 'PDF to Excel',        desc: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.' },
  wordtopdf:       { title: 'Word to PDF',         desc: 'Make DOC and DOCX files easy to read by converting them to PDF.' },
  powerpointtopdf: { title: 'PowerPoint to PDF',   desc: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.' },
  exceltopdf:      { title: 'Excel to PDF',        desc: 'Make EXCEL spreadsheets easy to read by converting them to PDF.' },
  organize:        { title: 'Organize PDF',        desc: 'Sort, add, delete, or rotate PDF pages in a document at your convenience.' },
  protect:         { title: 'Protect PDF',         desc: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.' },
  unlock:          { title: 'Unlock PDF',          desc: 'Remove PDF password security, giving you the freedom to use your files as you want.' },
  aisummarizer:    { title: 'AI Summarizer',       desc: 'Summarize documents using AI, extract key highlights, answers, and summaries in seconds.' },
  translate:       { title: 'Translate PDF',       desc: 'Translate PDF files into multiple languages instantly using AI-powered translations.' },
  markdown:        { title: 'PDF to Markdown',     desc: 'Convert rich PDFs to structural Markdown formatting for clean editing.' },
  pdftojpg:        { title: 'PDF to JPG',          desc: 'Convert each PDF page into a JPG or extract all images contained in a PDF.' },
  jpgtopdf:        { title: 'JPG to PDF',          desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.' },
  htmltopdf:       { title: 'HTML to PDF',         desc: 'Convert webpages in HTML to PDF with a click.' },
  pdfa:            { title: 'PDF to PDF/A',        desc: 'Transform your PDF to PDF/A, the ISO-standardized version for long-term archiving.' },
  edit:            { title: 'Edit PDF',            desc: 'Add text, images, shapes or freehand annotations to a PDF document.' },
  sign:            { title: 'Sign PDF',            desc: 'Sign yourself or request electronic signatures from others.' },
  watermark:       { title: 'Watermark',           desc: 'Stamp an image or text over your PDF in seconds.' },
  rotate:          { title: 'Rotate PDF',          desc: 'Rotate your PDFs the way you need them.' },
  repair:          { title: 'Repair PDF',          desc: 'Repair a damaged PDF and recover data from corrupt PDF.' },
  pagenumber:      { title: 'Page Numbers',        desc: 'Add page numbers into PDFs with ease.' },
  scan:            { title: 'Scan to PDF',         desc: 'Capture document scans from your mobile device.' },
  ocr:             { title: 'OCR PDF',             desc: 'Easily convert scanned PDF into searchable and selectable documents.' },
  compare:         { title: 'Compare PDF',         desc: 'Show a side-by-side document comparison and easily spot changes.' },
  redact:          { title: 'Redact PDF',          desc: 'Redact text and graphics to permanently remove sensitive information from a PDF.' },
  crop:            { title: 'Crop PDF',            desc: 'Crop margins of PDF documents or select specific areas.' },
  forms:           { title: 'PDF Forms',           desc: 'Detect form fields automatically and create interactive fillable PDFs.' },
  remove:          { title: 'Remove Pages',        desc: 'Remove one or multiple pages from your PDF.' },
  extract:         { title: 'Extract Pages',       desc: 'Extract selected pages from your PDF to create a new document.' },
};

// ─── Home Page (combined hero + tools + pricing) ───────────────────────────────
function HomePage({ toolsConfig }) {
  const navigate = useNavigate();
  return (
    <>
      <Hero />
      <ToolsGrid
        toolsConfig={toolsConfig}
        onSelectTool={(tool) => navigate(`/tool/${tool.id.replace('tool-', '')}`)}
      />
      <Pricing onContactSales={() => navigate('/contact')} />
    </>
  );
}

// ─── Tool Workspace Page ───────────────────────────────────────────────────────
function ToolPage({ toolsConfig }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addRecentFile } = useAppContext();

  // Extract toolId from URL e.g. /tool/merge → "merge"
  const toolId = location.pathname.replace('/tool/', '').trim();
  const meta = toolMeta[toolId];

  if (!meta) return <Navigate to="/" replace />;

  const tool = { id: `tool-${toolId}`, title: meta.title, desc: meta.desc };

  return (
    <ToolWorkspace
      tool={tool}
      toolsConfig={toolsConfig}
      onBack={() => navigate('/')}
      onFileProcessed={(f) => addRecentFile(f)}
    />
  );
}

// ─── Maintenance Screen ────────────────────────────────────────────────────────
function MaintenanceScreen({ onAdminAccess }) {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === 'admin123' || code === 'admin') {
      onAdminAccess();
      setShowModal(false);
    } else {
      setError('Invalid access code. Please try again.');
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', backgroundColor:'#0f172a', color:'#f8fafc', fontFamily:'var(--font-family)', padding:'24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-10%', left:'-10%', width:'50%', height:'50%', background:'radial-gradient(circle, rgba(229,36,36,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-10%', right:'-10%', width:'50%', height:'50%', background:'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ maxWidth:'600px', backgroundColor:'rgba(30,41,59,0.7)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'24px', padding:'48px 40px', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ width:'80px', height:'80px', borderRadius:'50%', backgroundColor:'rgba(229,36,36,0.1)', color:'var(--primary-red)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'40px', marginBottom:'28px', margin:'0 auto 28px auto', animation:'pulse 2s infinite' }}>🛠️</div>
        <h1 style={{ fontSize:'32px', fontWeight:'800', marginBottom:'16px', color:'#fff' }}>Scheduled Updates in Progress</h1>
        <p style={{ fontSize:'16px', color:'#94a3b8', lineHeight:'1.7', marginBottom:'32px' }}>We are performing essential system maintenance and optimization on the PDF processing engine. We will be back online shortly. Thank you for your patience!</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ fontSize:'13px', color:'#64748b', fontWeight:'600' }}>Expected Down-Time: ~15 mins</div>
          <div style={{ display:'flex', justifyContent:'center', gap:'8px' }}>
            <span style={{ display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'var(--primary-red)', animation:'ping 1s infinite' }} />
            <span style={{ fontSize:'12px', color:'#94a3b8' }}>Monitoring server telemetry...</span>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ marginTop:'40px', fontSize:'13px', color:'#64748b', textDecoration:'underline', background:'none', border:'none', cursor:'pointer', transition:'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color='var(--primary-red)'} onMouseLeave={e => e.currentTarget.style.color='#64748b'}>
          Access Portal (Admins Only)
        </button>
      </div>
      {showModal && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999, backdropFilter:'blur(8px)' }}>
          <div style={{ backgroundColor:'#1e293b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'30px', width:'380px', textAlign:'left' }}>
            <h3 style={{ fontSize:'18px', fontWeight:'800', marginBottom:'14px', color:'#fff' }}>Admin Access Portal</h3>
            <form onSubmit={handleSubmit}>
              <label style={{ display:'block', fontSize:'12px', color:'#94a3b8', marginBottom:'6px', fontWeight:'700' }}>Enter Admin Access Code</label>
              <input type="password" placeholder="Access Code" value={code} onChange={e => setCode(e.target.value)} autoFocus style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #475569', backgroundColor:'#0f172a', color:'#fff', fontSize:'14px', outline:'none', marginBottom:'12px', boxSizing:'border-box' }} />
              {error && <div style={{ color:'var(--primary-red)', fontSize:'12px', marginBottom:'12px', fontWeight:'600' }}>{error}</div>}
              <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
                <button type="button" onClick={() => { setShowModal(false); setError(''); }} style={{ padding:'8px 16px', borderRadius:'6px', backgroundColor:'#334155', color:'#94a3b8', fontSize:'13px', fontWeight:'700', border:'none', cursor:'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding:'8px 16px', borderRadius:'6px', backgroundColor:'var(--primary-red)', color:'#fff', fontSize:'13px', fontWeight:'700', border:'none', cursor:'pointer' }}>Submit Code</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Logout Confirmation Modal ─────────────────────────────────────────────────
function LogoutModal({ onCancel, onConfirm }) {
  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999, backdropFilter:'blur(6px)', animation:'fadeIn 0.2s ease' }}>
      <div style={{ backgroundColor:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'20px', padding:'40px 36px', width:'380px', textAlign:'center', boxShadow:'0 25px 60px rgba(0,0,0,0.25)', animation:'slideUp 0.25s ease' }}>
        <div style={{ width:'64px', height:'64px', borderRadius:'50%', backgroundColor:'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px auto' }}>
          <span style={{ fontSize:'28px' }}>👋</span>
        </div>
        <h3 style={{ fontSize:'20px', fontWeight:'800', color:'var(--text-dark)', marginBottom:'10px' }}>Are you sure you want to logout?</h3>
        <p style={{ fontSize:'14px', color:'var(--text-gray)', lineHeight:'1.6', marginBottom:'28px' }}>You will be signed out of your account and your current session will end.</p>
        <div style={{ display:'flex', gap:'12px' }}>
          <button onClick={onCancel} style={{ flex:1, padding:'12px', borderRadius:'10px', backgroundColor:'var(--bg-light)', border:'1px solid var(--border-light)', color:'var(--text-dark)', fontWeight:'700', fontSize:'14px', cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='var(--border-light)'} onMouseLeave={e => e.currentTarget.style.backgroundColor='var(--bg-light)'}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex:1, padding:'12px', borderRadius:'10px', backgroundColor:'#ef4444', border:'none', color:'#ffffff', fontWeight:'700', fontSize:'14px', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 4px 12px rgba(239,68,68,0.3)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='#dc2626'} onMouseLeave={e => e.currentTarget.style.backgroundColor='#ef4444'}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Login & Signup Auth Modal ──────────────────────────────────────────────────
function AuthModal({ initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.message || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError('Could not connect to Node.js backend server. Make sure backend is running.');
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999, backdropFilter:'blur(6px)', animation:'fadeIn 0.2s ease' }}>
      <div style={{ backgroundColor:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'24px', padding:'40px', width:'420px', textAlign:'left', boxShadow:'0 25px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
          <h2 style={{ fontSize:'24px', fontWeight:'800', color:'var(--text-dark)' }}>
            {mode === 'login' ? 'Welcome Back 👋' : 'Create Account 🚀'}
          </h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'var(--text-gray)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ display:'block', fontSize:'13px', fontWeight:'700', color:'var(--text-dark)', marginBottom:'6px' }}>Full Name</label>
              <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:'1px solid var(--border-light)', backgroundColor:'var(--bg-light)', color:'var(--text-dark)', fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
            </div>
          )}

          <div>
            <label style={{ display:'block', fontSize:'13px', fontWeight:'700', color:'var(--text-dark)', marginBottom:'6px' }}>Email Address</label>
            <input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:'1px solid var(--border-light)', backgroundColor:'var(--bg-light)', color:'var(--text-dark)', fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
          </div>

          <div>
            <label style={{ display:'block', fontSize:'13px', fontWeight:'700', color:'var(--text-dark)', marginBottom:'6px' }}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width:'100%', padding:'12px 14px', borderRadius:'10px', border:'1px solid var(--border-light)', backgroundColor:'var(--bg-light)', color:'var(--text-dark)', fontSize:'14px', outline:'none', boxSizing:'border-box' }} />
          </div>

          {error && (
            <div style={{ color:'#dc2626', backgroundColor:'#fef2f2', border:'1px solid #fecaca', padding:'10px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'600' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px', borderRadius:'12px', border:'none', backgroundColor:'var(--primary-red)', color:'#fff', fontWeight:'800', fontSize:'15px', cursor:'pointer', transition:'all 0.2s', marginTop:'8px' }}>
            {loading ? 'Processing...' : (mode === 'login' ? 'Log In to Account' : 'Sign Up Free')}
          </button>
        </form>

        <div style={{ marginTop:'24px', textAlign:'center', fontSize:'14px', color:'var(--text-gray)' }}>
          {mode === 'login' ? (
            <>Don't have an account? <span onClick={() => { setMode('signup'); setError(''); }} style={{ color:'var(--primary-red)', fontWeight:'700', cursor:'pointer' }}>Sign up</span></>
          ) : (
            <>Already have an account? <span onClick={() => { setMode('login'); setError(''); }} style={{ color:'var(--primary-red)', fontWeight:'700', cursor:'pointer' }}>Log in</span></>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [theme, setTheme] = useState('light');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [bypassMaintenance, setBypassMaintenance] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // ── Shared State ────────────────────────────────────────────────────────────
  const [usersData, setUsersData] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [toolsConfig, setToolsConfig] = useState({});
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoCleanupHours: 2,
    maxStoragePoolGb: 50,
    monthlyPremiumPrice: 6.00,
    monthlyBusinessPrice: 12.00,
    autoCleanupEnabled: true
  });

  // Fetch db.json data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/data');
        if (res.ok) {
          const db = await res.json();
          if (db.usersData) setUsersData(db.usersData);
          if (db.recentFiles) setRecentFiles(db.recentFiles);
          if (db.toolsConfig) setToolsConfig(db.toolsConfig);
          if (db.systemSettings) setSystemSettings(db.systemSettings);
        }
      } catch (err) {
        console.error('Failed to load database from backend:', err);
      }
    };
    loadData();
  }, []);

  // Sync wrappers
  const updateUsersData = async (newVal) => {
    const resolved = typeof newVal === 'function' ? newVal(usersData) : newVal;
    setUsersData(resolved);
    try {
      await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolved)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const updateRecentFiles = async (newVal) => {
    const resolved = typeof newVal === 'function' ? newVal(recentFiles) : newVal;
    setRecentFiles(resolved);
  };

  const updateToolsConfig = async (newVal) => {
    const resolved = typeof newVal === 'function' ? newVal(toolsConfig) : newVal;
    setToolsConfig(resolved);
    try {
      await fetch('http://localhost:5000/api/admin/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolved)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const updateSystemSettings = async (newVal) => {
    const resolved = typeof newVal === 'function' ? newVal(systemSettings) : newVal;
    setSystemSettings(resolved);
    try {
      await fetch('http://localhost:5000/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolved)
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ── Theme ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSignupClick = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (user) => {
    setIsLoggedIn(true);
    if (user && user.name) {
      setUsersData(prev => {
        const exists = prev.some(u => u.email === user.email);
        return exists ? prev : [user, ...prev];
      });
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    setIsLoggedIn(false);
    navigate('/');
  };

  // ── Context value ─────────────────────────────────────────────────────────────
  const addRecentFile = async (newFile) => {
    const entry = { id: Date.now(), name: newFile.name, tool: newFile.tool, size: newFile.size, date: 'Just now', pages: Math.floor(Math.random() * 20) + 1, status: 'Completed' };
    setRecentFiles(prev => [entry, ...prev]);
    setUsersData(prev => {
      const updatedUsers = prev.map(u => u.id === 1 ? { ...u, files: u.files + 1 } : u);
      fetch('http://localhost:5000/api/admin/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: entry, users: updatedUsers })
      }).catch(e => console.error(e));
      return updatedUsers;
    });
  };

  const contextValue = {
    usersData, setUsersData: updateUsersData,
    recentFiles, setRecentFiles: updateRecentFiles,
    toolsConfig, setToolsConfig: updateToolsConfig,
    systemSettings, setSystemSettings: updateSystemSettings,
    addRecentFile,
    isLoggedIn,
  };

  // ── Maintenance check ──────────────────────────────────────────────────────
  const isMaintenanceActive = systemSettings.maintenanceMode && !bypassMaintenance;

  if (isMaintenanceActive) {
    return <MaintenanceScreen onAdminAccess={() => { setBypassMaintenance(true); navigate('/admin'); }} />;
  }

  const isDashboardOrAdmin = location.pathname === '/dashboard' || location.pathname === '/admin';

  return (
    <AppContext.Provider value={contextValue}>
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>

        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          isLoggedIn={isLoggedIn}
          onLoginClick={handleLoginClick}
          onSignupClick={handleSignupClick}
          onLogoutClick={() => setShowLogoutModal(true)}
        />

        {/* Admin Bypass Banner */}
        {systemSettings.maintenanceMode && bypassMaintenance && (
          <div style={{ backgroundColor:'var(--primary-red)', color:'#fff', padding:'8px 16px', textAlign:'center', fontSize:'13px', fontWeight:'700', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', position:'sticky', top:'64px', zIndex:999 }}>
            <span>🛠️ Maintenance Mode is Active — You are viewing the site with Admin Bypass.</span>
            <button onClick={() => setBypassMaintenance(false)} style={{ backgroundColor:'rgba(255,255,255,0.2)', color:'#fff', padding:'2px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:'800', border:'none', cursor:'pointer' }}>Exit Bypass Mode</button>
          </div>
        )}

        {/* Auth Modal (Login / Signup) */}
        {showAuthModal && (
          <AuthModal
            initialMode={authMode}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}

        {/* Logout Modal */}
        {showLogoutModal && (
          <LogoutModal
            onCancel={() => setShowLogoutModal(false)}
            onConfirm={handleLogout}
          />
        )}

        <main className="main-content" style={{ marginTop:'64px', flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/"        element={<HomePage toolsConfig={toolsConfig} />} />
            <Route path="/tool/:toolId" element={<ToolPage toolsConfig={toolsConfig} />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/terms"   element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/help"    element={<HelpAndSupport />} />

            {/* User Dashboard */}
            <Route path="/dashboard" element={
              <Dashboard
                usersData={usersData}
                setUsersData={updateUsersData}
                recentFiles={recentFiles}
                setRecentFiles={updateRecentFiles}
              />
            } />

            {/* Admin Panel */}
            <Route path="/admin" element={
              <AdminPanel
                usersData={usersData}
                setUsersData={updateUsersData}
                recentFiles={recentFiles}
                setRecentFiles={updateRecentFiles}
                toolsConfig={toolsConfig}
                setToolsConfig={updateToolsConfig}
                systemSettings={systemSettings}
                setSystemSettings={updateSystemSettings}
              />
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {!isDashboardOrAdmin && <Footer />}
      </div>
    </AppContext.Provider>
  );
}

export default App;
