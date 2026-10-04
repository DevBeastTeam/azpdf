import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, FileText, UploadCloud, Clock, HardDrive, ShieldCheck, 
  Settings, Star, Download, Trash2, Share2, Sparkles, Plus, Search, 
  ArrowUpRight, CheckCircle2, User, Zap, CreditCard, DollarSign,
  Camera, Bell, Lock, Globe, Phone, Mail, AlertTriangle, Save, Eye, EyeOff, Building2, Check
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export const PLAN_TIERS = [
  {
    id: 'FREE',
    level: 0,
    name: 'Free Plan',
    badge: 'Starter',
    priceMonth: 0,
    priceTotal: 0,
    period: 'Free Forever',
    billingCycle: 'Free',
    description: 'Essential PDF tools for everyday individual tasks and quick edits.',
    features: [
      'Access to standard PDF tools',
      'Process up to 5 files / day',
      'Max 25 MB file size limit',
      'Web browser access',
      'Community support'
    ]
  },
  {
    id: 'BASIC',
    level: 1,
    name: 'Basic Plan',
    badge: 'Student Choice',
    priceMonth: 3,
    priceTotal: 18,
    period: '$18 billed every 6 months ($3/mo)',
    billingCycle: '6 Months',
    description: 'Higher limits, faster processing, and no daily file caps.',
    features: [
      'Unlimited file conversions',
      'Up to 50 MB per file',
      'Batch conversion (up to 10 files)',
      'Ad-free experience',
      'Standard OCR text recognition',
      'Standard email support'
    ]
  },
  {
    id: 'PREMIUM',
    level: 2,
    name: 'Premium Plan',
    badge: 'Most Popular',
    priceMonth: 4,
    priceTotal: 48,
    period: '$48 billed yearly ($4/mo)',
    billingCycle: 'Yearly',
    popular: true,
    description: 'Complete PDF power suite for professionals, researchers, and creators.',
    features: [
      'Unlimited all tools & no size limits',
      'Advanced OCR in 30+ languages',
      'Digital signatures & certifications',
      '2 GB Secure Cloud Storage',
      'High-speed parallel cloud processing',
      'Priority VIP customer support'
    ]
  }
];

export const normalizePlanId = (plan) => {
  if (!plan) return 'FREE';
  const p = plan.toString().toUpperCase();
  if (p.includes('PREMIUM')) return 'PREMIUM';
  if (p.includes('BASIC') || p.includes('6M') || p.includes('6 MONTH') || p.includes('6-MONTH')) return 'BASIC';
  return 'FREE';
};

export default function Dashboard({ 
  currentUser,
  usersData,
  setUsersData,
  recentFiles,
  setRecentFiles
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllTools, setShowAllTools] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toolFilter, setToolFilter] = useState('all');

  // Plans section ref
  const plansSectionRef = useRef(null);

  // Billing state
  const [billingPlan, setBillingPlan] = useState(() => {
    const u = currentUser || (() => {
      try {
        const saved = sessionStorage.getItem('azpdf_user_session') || sessionStorage.getItem('azpdf_active_user');
        return saved ? JSON.parse(saved) : null;
      } catch (e) { return null; }
    })();
    return normalizePlanId(u?.plan || 'FREE');
  });
  const [invoices, setInvoices] = useState([]);
  const [billingMsg, setBillingMsg] = useState('');

  useEffect(() => {
    fetch('/api/user/invoices')
      .then(res => res.json())
      .then(data => {
        if (data.invoices) setInvoices(data.invoices);
      })
      .catch(err => console.error('Error fetching invoices:', err));
  }, []);

  // Tier calculations
  const currentNormalized = normalizePlanId(billingPlan);
  const currentTierIndex = Math.max(0, PLAN_TIERS.findIndex(p => p.id === currentNormalized));
  const currentTier = PLAN_TIERS[currentTierIndex] || PLAN_TIERS[0];
  const nextTier = currentTierIndex < PLAN_TIERS.length - 1 ? PLAN_TIERS[currentTierIndex + 1] : null;

  const handleScrollToPlans = () => {
    if (plansSectionRef.current) {
      plansSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Profile state
  const [profile, setProfile] = useState(() => {
    // Priority 1: Use live currentUser prop from App.jsx (set on login)
    const u = currentUser || (() => {
      try {
        const savedUser = sessionStorage.getItem('azpdf_user_session') || sessionStorage.getItem('azpdf_active_user');
        return savedUser ? JSON.parse(savedUser) : null;
      } catch (e) { return null; }
    })();

    if (u && (u.email || u.name)) {
      const nameParts = (u.name || 'User').trim().split(/\s+/);
      return {
        firstName: nameParts[0] || 'User',
        lastName: nameParts.slice(1).join(' ') || '',
        email: u.email || 'user@example.com',
        phone: u.phone || '+1 (555) 012-3456',
        bio: u.bio || 'PDF processing enthusiast. Managing documents and workflows.',
        language: 'English',
        avatarInitials: u.avatar || (nameParts[0] ? nameParts[0][0] : 'U').toUpperCase(),
        avatarColor: 'var(--primary-red)',
        plan: u.plan || 'FREE',
      };
    }
    return {
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex.johnson@ilovepdf.com',
      phone: '+1 (555) 012-3456',
      bio: 'PDF processing enthusiast. Managing documents and workflows at iLovePDF.',
      language: 'English',
      avatarInitials: 'AJ',
      avatarColor: 'var(--primary-red)',
      plan: 'FREE',
    };
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [notifications, setNotifications] = useState({
    emailReports: true,
    fileReady: true,
    planReminder: false,
    newsletter: false,
  });

  const handleProfileSave = async () => {
    try {
      // Persist updated profile back to storage so it survives page refresh
      const stored = JSON.parse(sessionStorage.getItem('azpdf_user_session') || '{}');
      const updated = {
        ...stored,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
        avatar: profile.avatarInitials,
      };
      sessionStorage.setItem('azpdf_user_session', JSON.stringify(updated));
      // Also persist to backend DB
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: `${profile.firstName} ${profile.lastName}`.trim(),
          phone: profile.phone,
          bio: profile.bio,
        })
      });
    } catch (e) { console.error('Profile save error:', e); }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePasswordChange = () => {
    if (!passwordData.current) { setPasswordMsg('Enter your current password.'); return; }
    if (passwordData.newPass.length < 8) { setPasswordMsg('New password must be at least 8 characters.'); return; }
    if (passwordData.newPass !== passwordData.confirm) { setPasswordMsg('Passwords do not match.'); return; }
    setPasswordMsg('✅ Password changed successfully!');
    setPasswordData({ current: '', newPass: '', confirm: '' });
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const handleDeleteFile = (id) => {
    setRecentFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDownloadFile = (file) => {
    if (file.downloadUrl) {
      const a = document.createElement('a');
      a.href = file.downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const blob = new Blob([
      `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n4 0 obj<</Length 64>>stream\nBT /F1 14 Tf 50 700 Td (${file.name || 'document.pdf'} - Processed by azPDF) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n325\n%%EOF`
    ], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearAllFiles = () => {
    if (window.confirm('Are you sure you want to clear all your recent files?')) {
      setRecentFiles([]);
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      sessionStorage.removeItem('azpdf_user_session');
      sessionStorage.removeItem('azpdf_active_user');
      localStorage.removeItem('azpdf_auth');
      localStorage.removeItem('azpdf_user');
      localStorage.removeItem('azpdf_active_user');
      window.location.href = '/';
    }
  };

  const handleDownloadInvoice = (inv) => {
    const invoiceBlob = new Blob([
      `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>endobj\n4 0 obj<</Length 110>>stream\nBT /F1 16 Tf 50 720 Td (INVOICE ${inv.id}) Tj /F1 12 Tf 50 690 Td (Plan: ${inv.plan}  Amount: ${inv.amount}  Date: ${inv.date}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n370\n%%EOF`
    ], { type: 'application/pdf' });
    const url = URL.createObjectURL(invoiceBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${inv.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  const filteredFiles = recentFiles.filter(f =>
    (f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.tool.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (toolFilter === 'all' || f.tool === toolFilter)
  );
  const [filesPage, setFilesPage] = useState(1);
  const filesPerPage = 8;
  const totalFilePages = Math.max(1, Math.ceil(filteredFiles.length / filesPerPage));
  const currentFilesPage = Math.min(filesPage, totalFilePages);
  const paginatedFiles = filteredFiles.slice((currentFilesPage - 1) * filesPerPage, currentFilesPage * filesPerPage);


  return (
    <div className="dashboard-container" style={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: 'var(--bg-light)',
      display: 'flex',
      flexDirection: 'row',
      color: 'var(--text-dark)'
    }}>
      
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar" style={{
        width: '260px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-light)',
        padding: '28px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div className="dashboard-sidebar-top">
          {/* User Account Info */}
          <div className="dashboard-user-info" onClick={() => setActiveTab('settings')} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'var(--bg-light)',
            borderRadius: '12px',
            marginBottom: '28px',
            border: '1px solid var(--border-light)',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-red)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '16px'
            }}>
              {profile.avatarInitials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {profile.firstName} {profile.lastName}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="dashboard-nav-links" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`dashboard-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'overview' ? 'var(--border-light)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--primary-red)' : 'var(--text-gray)',
                fontWeight: activeTab === 'overview' ? '700' : '600',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <LayoutDashboard size={18} /> Overview
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`dashboard-nav-btn ${activeTab === 'files' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'files' ? 'var(--border-light)' : 'transparent',
                color: activeTab === 'files' ? 'var(--primary-red)' : 'var(--text-gray)',
                fontWeight: activeTab === 'files' ? '700' : '600',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <FileText size={18} /> Recent Processed Files
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`dashboard-nav-btn ${activeTab === 'billing' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'billing' ? 'var(--border-light)' : 'transparent',
                color: activeTab === 'billing' ? 'var(--primary-red)' : 'var(--text-gray)',
                fontWeight: activeTab === 'billing' ? '700' : '600',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <CreditCard size={18} /> Billing & Subscription
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`dashboard-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'settings' ? 'var(--border-light)' : 'transparent',
                color: activeTab === 'settings' ? 'var(--primary-red)' : 'var(--text-gray)',
                fontWeight: activeTab === 'settings' ? '700' : '600',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <Settings size={18} /> Account Settings
            </button>
          </div>
        </div>

      </aside>

      {/* Main Dashboard Content */}
      <main className="dashboard-main-content" style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Title & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Welcome back, {profile.firstName} {profile.lastName} 👋
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>
                  Here is a quick overview of your PDF document processing metrics and activity.
                </p>
              </div>

              <button
                onClick={() => navigate('/tool/merge')}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--primary-red)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(229, 36, 36, 0.25)'
                }}
              >
                <Plus size={18} /> New PDF Task
              </button>
            </div>

            {/* Metrics Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '36px'
            }}>
              
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-gray)' }}>Plan</span>
                  <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)' }}>
                    <Star size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>{billingPlan}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Current subscription plan</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-gray)' }}>Total Processes</span>
                  <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#2563eb' }}>
                    <FileText size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>148</div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>↑ +12% from last week</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-gray)' }}>Scan PDFs</span>
                  <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#16a34a' }}>
                    <Clock size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>12</div>
                <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Scanned documents total</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-gray)' }}>OCR PDFs</span>
                  <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#ca8a04' }}>
                    <Zap size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>32</div>
                <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>High-accuracy OCR active</div>
              </div>

            </div>

            {/* Quick Action Tools Grid */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                  Quick Action Tools
                </h3>
                <button
                  onClick={() => setShowAllTools(v => !v)}
                  style={{ border: 'none', backgroundColor: 'var(--border-light)', color: 'var(--text-dark)', borderRadius: '8px', padding: '6px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                >
                  {showAllTools ? 'Less' : 'All'}
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div
                  onClick={() => navigate('/tool/merge')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Merge PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/split')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Split PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/compress')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Compress PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/pdftoword')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#2563eb', fontWeight: '800' }}>
                      DOC
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>PDF to Word</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/pdftopowerpoint')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#ea580c', fontWeight: '800' }}>
                      PPT
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>PDF to PowerPoint</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/pdftoexcel')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#16a34a', fontWeight: '800' }}>
                      XLS
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>PDF to Excel</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/wordtopdf')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#2563eb', fontWeight: '800' }}>
                      DOC
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Word to PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                {!showAllTools && (
                  <div
                    onClick={() => setShowAllTools(true)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1.5px solid var(--border-light)',
                      borderRadius: '14px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-dark)' }}>See All →</span>
                  </div>
                )}

                {showAllTools && (
                  <>
                <div
                  onClick={() => navigate('/tool/powerpointtopdf')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#ea580c', fontWeight: '800' }}>
                      PPT
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>PowerPoint to PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>
                <div
                  onClick={() => navigate('/tool/exceltopdf')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#16a34a', fontWeight: '800' }}>
                      XLS
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Excel to PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/organize')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Organize PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/protect')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Protect PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/unlock')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Unlock PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/aisummarizer')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#7c3aed', fontWeight: '800' }}>
                      AI
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>AI Summarizer</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/translate')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Translate PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/markdown')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#475569', fontWeight: '800' }}>
                      MD
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>PDF to Markdown</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/pdftojpg')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#ca8a04', fontWeight: '800' }}>
                      JPG
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>PDF to JPG</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/jpgtopdf')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#ca8a04', fontWeight: '800' }}>
                      JPG
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>JPG to PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/htmltopdf')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#0891b2', fontWeight: '800' }}>
                      HTML
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>HTML to PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/pdfa')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>PDF to PDF/A</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/edit')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Edit PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/sign')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Sign PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/watermark')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Watermark</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/rotate')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Rotate PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/repair')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Repair PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/pagenumber')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Page Numbers</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/scan')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Scan to PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/ocr')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>OCR PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/compare')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Compare PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/redact')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Redact PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/crop')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Crop PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/forms')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>PDF Forms</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/remove')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Remove Pages</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                <div
                  onClick={() => navigate('/tool/extract')}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Extract Pages</span>
                  </div>
                  <ArrowUpRight size={16} color="var(--text-light-gray)" />
                </div>

                  </>
                )}
              </div>
            </div>

                        {/* Recent Files Table Preview */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>
                  Recently Processed Documents
                </h3>
                <button 
                  onClick={() => setActiveTab('files')}
                  style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--primary-red)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                >
                  View All Files →
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-gray)', fontSize: '12px', fontWeight: '700' }}>
                      <th style={{ padding: '12px 16px' }}>DOCUMENT NAME</th>
                      <th style={{ padding: '12px 16px' }}>TOOL USED</th>
                      <th style={{ padding: '12px 16px' }}>FILE SIZE</th>
                      <th style={{ padding: '12px 16px' }}>DATE</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFiles.slice(0, 3).map(file => (
                      <tr key={file.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '14px', color: 'var(--text-gray)' }}>
                        <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-dark)' }}>{file.name}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ backgroundColor: 'var(--bg-light)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                            {file.tool}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--text-gray)' }}>{file.size}</td>
                        <td style={{ padding: '16px', color: 'var(--text-gray)' }}>{file.date}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDownloadFile(file)}
                            style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--primary-red)', cursor: 'pointer', padding: '6px' }} 
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Files Manager Tab */}
        {activeTab === 'files' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Document History & Files
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>
                  Manage and download all documents processed in your workspace.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={toolFilter}
                onChange={(e) => { setToolFilter(e.target.value); setFilesPage(1); }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-dark)',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Tools</option>
                {[...new Set(recentFiles.map(f => f.tool))].map(tool => (
                  <option key={tool} value={tool}>{tool}</option>
                ))}
              </select>
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} color="var(--text-light-gray)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search file name or tool..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setFilesPage(1); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-dark)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px' }}>
              {filteredFiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                  No files found matching "{searchQuery}".
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-gray)', fontSize: '12px', fontWeight: '700' }}>
                      <th style={{ padding: '14px 16px' }}>FILE NAME</th>
                      <th style={{ padding: '14px 16px' }}>TOOL</th>
                      <th style={{ padding: '14px 16px' }}>SIZE</th>
                      <th style={{ padding: '14px 16px' }}>PROCESSED DATE</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFiles.map(file => (
                      <tr key={file.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '14px', color: 'var(--text-gray)' }}>
                        <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-dark)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={18} color="var(--primary-red)" />
                            {file.name}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ backgroundColor: 'var(--border-light)', color: 'var(--primary-red)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                            {file.tool}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--text-gray)' }}>{file.size}</td>
                        <td style={{ padding: '16px', color: 'var(--text-gray)' }}>{file.date}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleDownloadFile(file)}
                              style={{ border: 'none', backgroundColor: 'var(--bg-light)', borderRadius: '6px', padding: '8px', color: 'var(--text-gray)', cursor: 'pointer' }} 
                              title="Download File"
                            >
                              <Download size={16} />
                            </button>
                            <button onClick={() => handleDeleteFile(file.id)} style={{ border: 'none', backgroundColor: '#fee2e2', borderRadius: '6px', padding: '8px', color: '#dc2626', cursor: 'pointer' }} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {filteredFiles.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
                    Page {currentFilesPage} of {totalFilePages} ({filteredFiles.length} files)
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setFilesPage(p => Math.max(1, p - 1))}
                      disabled={currentFilesPage === 1}
                      style={{ border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', borderRadius: '8px', padding: '6px 14px', fontWeight: '700', fontSize: '13px', color: currentFilesPage === 1 ? 'var(--text-light-gray)' : 'var(--text-dark)', cursor: currentFilesPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalFilePages }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => setFilesPage(n)}
                        style={{ border: '1px solid var(--border-light)', backgroundColor: n === currentFilesPage ? 'var(--primary-red)' : 'var(--bg-card)', color: n === currentFilesPage ? '#fff' : 'var(--text-dark)', borderRadius: '8px', padding: '6px 12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setFilesPage(p => Math.min(totalFilePages, p + 1))}
                      disabled={currentFilesPage === totalFilePages}
                      style={{ border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', borderRadius: '8px', padding: '6px 14px', fontWeight: '700', fontSize: '13px', color: currentFilesPage === totalFilePages ? 'var(--text-light-gray)' : 'var(--text-dark)', cursor: currentFilesPage === totalFilePages ? 'not-allowed' : 'pointer' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Billing & Subscription Tab */}
        {activeTab === 'billing' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>
                Billing & Subscription
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>
                Manage your active subscription plan and download invoice history.
              </p>
            </div>

            {billingMsg && (
              <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: '700', fontSize: '14px', marginBottom: '24px' }}>
                {billingMsg}
              </div>
            )}

            {/* Section 1: Current Active Plan Card */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--primary-red)', borderRadius: '20px', padding: '30px', marginBottom: '32px', boxShadow: '0 10px 30px rgba(229, 36, 36, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-red)', backgroundColor: 'rgba(229, 36, 36, 0.1)', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase' }}>
                    Active Plan
                  </span>
                  <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '10px', marginBottom: '4px' }}>
                    {currentTier.name}
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>
                    {currentTier.period} — Next renewal on {new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '34px', fontWeight: '900', color: 'var(--text-dark)' }}>
                    {currentTier.priceMonth === 0 ? 'Free' : `$${currentTier.priceMonth}`}
                    {currentTier.priceMonth > 0 && (
                      <span style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: '500' }}> / month</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700', marginTop: '4px' }}>
                    ✓ Auto-Renewal Active
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '24px 0' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  {nextTier ? (
                    <button
                      onClick={handleScrollToPlans}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #e52424 0%, #b91c1c 100%)',
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(229, 36, 36, 0.35)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Sparkles size={16} />
                      Upgrade to {nextTier.name} (${nextTier.priceMonth}/mo)
                    </button>
                  ) : (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      borderRadius: '12px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#15803d',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      <CheckCircle2 size={18} />
                      You are on our highest tier ({currentTier.name})!
                    </div>
                  )}
                </div>

                <button
                  onClick={handleScrollToPlans}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-light)',
                    color: 'var(--text-dark)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  View All Plans ↓
                </button>
              </div>
            </div>

            {/* Section 2: Available Subscription Plans */}
            <div ref={plansSectionRef} style={{ marginBottom: '36px', scrollMarginTop: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-dark)', marginBottom: '4px' }}>
                  Available Subscription Plans
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>
                  Choose the plan that best fits your workflow. Flexible options tailored for personal and business use.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '20px'
              }}>
                {PLAN_TIERS.map((tier) => {
                  const isCurrent = tier.id === currentNormalized;
                  const isUpgrade = tier.level > currentTier.level;

                  return (
                    <div
                      key={tier.id}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: '18px',
                        border: isCurrent 
                          ? '2px solid #16a34a' 
                          : tier.popular 
                            ? '2px solid var(--primary-red)' 
                            : '1px solid var(--border-light)',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        boxShadow: tier.popular ? '0 10px 25px rgba(229, 36, 36, 0.12)' : 'var(--shadow-sm)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                    >
                      {tier.popular && (
                        <div style={{
                          position: 'absolute',
                          top: '-12px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: 'var(--primary-red)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '900',
                          letterSpacing: '0.5px',
                          padding: '4px 14px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 8px rgba(229, 36, 36, 0.3)'
                        }}>
                          MOST POPULAR
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '800',
                            color: isCurrent ? '#16a34a' : tier.popular ? 'var(--primary-red)' : 'var(--text-gray)',
                            textTransform: 'uppercase'
                          }}>
                            {tier.badge}
                          </span>
                          {isCurrent && (
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                              ✓ Current
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>
                          {tier.name}
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginBottom: '16px', minHeight: '34px' }}>
                          {tier.description}
                        </p>

                        <div style={{ marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '30px', fontWeight: '900', color: 'var(--text-dark)' }}>
                              {tier.priceMonth === 0 ? '$0' : `$${tier.priceMonth}`}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: '500' }}>
                              / month
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>
                            {tier.period}
                          </div>
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {tier.features.map((feat, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-dark)' }}>
                              <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        {isCurrent ? (
                          <button
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '10px',
                              border: '1px solid #bbf7d0',
                              backgroundColor: '#f0fdf4',
                              color: '#15803d',
                              fontWeight: '800',
                              fontSize: '13px',
                              cursor: 'default',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <CheckCircle2 size={16} /> Active Plan
                          </button>
                        ) : isUpgrade ? (
                          <button
                            onClick={() => {
                              setBillingMsg(`Selected plan: ${tier.name}.`);
                              setTimeout(() => setBillingMsg(''), 4000);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '10px',
                              border: 'none',
                              background: tier.popular 
                                ? 'linear-gradient(135deg, #e52424 0%, #b91c1c 100%)' 
                                : 'var(--primary-red)',
                              color: '#ffffff',
                              fontWeight: '800',
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(229, 36, 36, 0.25)',
                              transition: 'opacity 0.2s'
                            }}
                          >
                            <Sparkles size={15} /> Upgrade to {tier.name}
                          </button>
                        ) : (
                          <button
                            disabled
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '10px',
                              border: '1px solid var(--border-light)',
                              backgroundColor: 'var(--bg-light)',
                              color: 'var(--text-gray)',
                              fontWeight: '700',
                              fontSize: '13px',
                              cursor: 'default'
                            }}
                          >
                            Included in Your Plan
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoices & Payment History */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DollarSign size={20} color="var(--primary-red)" /> Billing History & Invoices
              </h3>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-gray)', fontSize: '12px', fontWeight: '700' }}>
                    <th style={{ padding: '12px 16px' }}>INVOICE ID</th>
                    <th style={{ padding: '12px 16px' }}>DATE</th>
                    <th style={{ padding: '12px 16px' }}>AMOUNT</th>
                    <th style={{ padding: '12px 16px' }}>PLAN</th>
                    <th style={{ padding: '12px 16px' }}>STATUS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-light)', fontSize: '14px', color: 'var(--text-gray)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--text-dark)' }}>{inv.id}</td>
                      <td style={{ padding: '14px 16px' }}>{inv.date}</td>
                      <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--text-dark)' }}>{inv.amount}</td>
                      <td style={{ padding: '14px 16px' }}>{inv.plan}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                          ✓ {inv.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button onClick={() => handleDownloadInvoice(inv)} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--primary-red)', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Account Settings / Profile Tab */}
        {activeTab === 'settings' && (
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>My Profile</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-gray)', marginBottom: '32px' }}>Manage your personal information, password, and notification preferences.</p>

            {/* === Avatar & Basic Info === */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '30px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={17} color="var(--primary-red)" /> Personal Information
              </h2>

              {/* Avatar Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: profile.avatarColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', border: '3px solid var(--bg-card)', boxShadow: '0 0 0 2px var(--primary-red)' }}>
                    {profile.avatarInitials}
                  </div>
                  <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '24px', height: '24px', backgroundColor: 'var(--primary-red)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg-card)' }}>
                    <Camera size={12} color="#fff" />
                    <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                      if (e.target.files[0]) {
                        const initials = (profile.firstName[0] || '') + (profile.lastName[0] || '');
                        setProfile(p => ({ ...p, avatarInitials: initials.toUpperCase() }));
                      }
                    }} />
                  </label>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)' }}>{profile.firstName} {profile.lastName}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-gray)', marginTop: '2px' }}>{profile.email}</div>
                </div>
              </div>

              {/* Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>First Name</label>
                  <input type="text" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--primary-red)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Last Name</label>
                  <input type="text" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--primary-red)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={13} /> Email Address (Non-editable)</label>
                  <input type="email" value={profile.email} readOnly disabled style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-gray)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={13} /> Phone Number</label>
                  <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--primary-red)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Bio / Description</label>
                  <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = 'var(--primary-red)'} onBlur={e => e.target.style.borderColor = 'var(--border-light)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={13} /> Language</label>
                  <select value={profile.language} onChange={e => setProfile(p => ({ ...p, language: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}>
                    {['English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German', 'Chinese'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleProfileSave} style={{ marginTop: '24px', padding: '12px 28px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary-red)', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' }}>
                <Save size={16} /> {profileSaved ? '✅ Profile Saved!' : 'Save Profile'}
              </button>
            </div>

            {/* === Change Password === */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '30px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={17} color="var(--primary-red)" /> Change Password
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={passwordData.current} onChange={e => setPasswordData(p => ({ ...p, current: e.target.value }))} placeholder="Enter current password" style={{ width: '100%', padding: '11px 40px 11px 13px', borderRadius: '9px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light-gray)' }}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showNewPassword ? 'text' : 'password'} value={passwordData.newPass} onChange={e => setPasswordData(p => ({ ...p, newPass: e.target.value }))} placeholder="Min. 8 characters" style={{ width: '100%', padding: '11px 40px 11px 13px', borderRadius: '9px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                      <button type="button" onClick={() => setShowNewPassword(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light-gray)' }}>{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Confirm New Password</label>
                    <input type="password" value={passwordData.confirm} onChange={e => setPasswordData(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                {passwordMsg && <div style={{ fontSize: '13px', fontWeight: '600', color: passwordMsg.startsWith('✅') ? '#16a34a' : '#dc2626', backgroundColor: passwordMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', padding: '10px 14px', borderRadius: '8px' }}>{passwordMsg}</div>}
                <button onClick={handlePasswordChange} style={{ alignSelf: 'flex-start', padding: '12px 28px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--text-dark)', color: 'var(--bg-card)', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={15} /> Update Password
                </button>
              </div>
            </div>


            {/* === Danger Zone === */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1.5px solid #fecaca', borderRadius: '18px', padding: '30px', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#dc2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={17} /> Danger Zone
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginBottom: '20px' }}>These actions are irreversible. Please be certain before proceeding.</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={handleClearAllFiles} style={{ padding: '10px 20px', borderRadius: '9px', border: '1.5px solid #fca5a5', backgroundColor: 'var(--bg-card)', color: '#dc2626', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Clear All My Files</button>
                <button onClick={handleDeleteAccount} style={{ padding: '10px 20px', borderRadius: '9px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Delete My Account</button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
