import React, { useState } from 'react';
import { 
  LayoutDashboard, FileText, UploadCloud, Clock, HardDrive, ShieldCheck, 
  Key, Settings, Star, Download, Trash2, Share2, Sparkles, Plus, Search, 
  ArrowUpRight, CheckCircle2, User, Zap, Users, Crown, BadgeCheck, XCircle,
  Camera, Bell, Lock, Globe, Phone, Mail, AlertTriangle, Save, Eye, EyeOff
} from 'lucide-react';

export default function Dashboard({ setView, onSelectTool }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    firstName: 'DevBeast',
    lastName: 'Team',
    email: 'devbeast@company.com',
    phone: '+92 300 1234567',
    bio: 'PDF processing enthusiast. Managing documents for DevBeast Team.',
    language: 'English',
    avatarInitials: 'AZ',
    avatarColor: 'var(--primary-red)',
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

  const handleProfileSave = () => {
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

  // Mock list of user's recently processed PDF files
  const [recentFiles, setRecentFiles] = useState([
    { id: 1, name: 'annual_financial_report_2026.pdf', tool: 'Merge PDF', size: '4.2 MB', date: 'Just now', pages: 18, status: 'Completed' },
    { id: 2, name: 'client_contract_signed.pdf', tool: 'Protect PDF', size: '1.8 MB', date: '2 hours ago', pages: 6, status: 'Completed' },
    { id: 3, name: 'scanned_tax_invoice.pdf', tool: 'OCR PDF', size: '3.1 MB', date: 'Yesterday', pages: 4, status: 'Completed' },
    { id: 4, name: 'company_presentation.pdf', tool: 'Compress PDF', size: '12.4 MB', date: '3 days ago', pages: 24, status: 'Completed' },
    { id: 5, name: 'product_specs_draft.pdf', tool: 'PDF to Word', size: '2.5 MB', date: '5 days ago', pages: 10, status: 'Completed' }
  ]);

  const handleDeleteFile = (id) => {
    setRecentFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('ilovepdf_live_sec_89237492837482937498');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const filteredFiles = recentFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.tool.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock users with plan data
  const [usersData] = useState([
    { id: 1, name: 'Sarah Johnson',    email: 'sarah.j@company.com',    plan: 'Business', joinDate: 'Jan 12, 2026', status: 'Active',   files: 142, avatar: 'SJ' },
    { id: 2, name: 'Ahmed Raza',       email: 'ahmed.raza@gmail.com',   plan: 'Premium',  joinDate: 'Feb 3, 2026',  status: 'Active',   files: 87,  avatar: 'AR' },
    { id: 3, name: 'Maria Garcia',     email: 'maria.g@outlook.com',    plan: 'Free',     joinDate: 'Mar 19, 2026', status: 'Active',   files: 23,  avatar: 'MG' },
    { id: 4, name: 'James Wilson',     email: 'jwilson@techcorp.io',    plan: 'Business', joinDate: 'Jan 30, 2026', status: 'Active',   files: 310, avatar: 'JW' },
    { id: 5, name: 'Ayesha Khan',      email: 'ayesha.k@webdev.pk',     plan: 'Premium',  joinDate: 'Apr 5, 2026',  status: 'Active',   files: 56,  avatar: 'AK' },
    { id: 6, name: 'Carlos Mendez',    email: 'carlos@designstudio.es', plan: 'Free',     joinDate: 'May 10, 2026', status: 'Inactive', files: 4,   avatar: 'CM' },
    { id: 7, name: 'Priya Sharma',     email: 'priya.s@infosys.in',     plan: 'Business', joinDate: 'Feb 22, 2026', status: 'Active',   files: 204, avatar: 'PS' },
    { id: 8, name: 'Oliver Smith',     email: 'oliver.s@ukfirm.co.uk',  plan: 'Premium',  joinDate: 'Jun 1, 2026',  status: 'Active',   files: 39,  avatar: 'OS' },
    { id: 9, name: 'Fatima Al-Hassan', email: 'fatima.h@arabtech.ae',   plan: 'Free',     joinDate: 'Jun 18, 2026', status: 'Active',   files: 11,  avatar: 'FA' },
    { id: 10, name: 'David Chen',      email: 'dchen@startuplab.sg',    plan: 'Business', joinDate: 'Mar 8, 2026',  status: 'Inactive', files: 88,  avatar: 'DC' },
  ]);

  const [userSearch, setUserSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');

  const filteredUsers = usersData.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchPlan   = planFilter === 'All' || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const planMeta = {
    Business: { color: '#7c3aed', bg: '#f5f3ff', icon: <Crown size={13} /> },
    Premium:  { color: '#d97706', bg: '#fffbeb', icon: <Star size={13} /> },
    Free:     { color: '#6b7280', bg: '#f9fafb', icon: <User size={13} /> },
  };

  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: '#f8f9fc',
      display: 'flex',
      flexDirection: 'row'
    }}>
      
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        padding: '28px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div>
          {/* User Account Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            marginBottom: '28px',
            border: '1px solid #f3f4f6'
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
              AZ
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#111827', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                DevBeast Team
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={11} color="var(--primary-red)" /> Premium Account
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'overview' ? '#fff1f2' : 'transparent',
                color: activeTab === 'overview' ? 'var(--primary-red)' : '#4b5563',
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'files' ? '#fff1f2' : 'transparent',
                color: activeTab === 'files' ? 'var(--primary-red)' : '#4b5563',
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
              onClick={() => setActiveTab('api')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'api' ? '#fff1f2' : 'transparent',
                color: activeTab === 'api' ? 'var(--primary-red)' : '#4b5563',
                fontWeight: activeTab === 'api' ? '700' : '600',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <Key size={18} /> Developer API Keys
            </button>

            <button
              onClick={() => setActiveTab('users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'users' ? '#fff1f2' : 'transparent',
                color: activeTab === 'users' ? 'var(--primary-red)' : '#4b5563',
                fontWeight: activeTab === 'users' ? '700' : '600',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <Users size={18} /> Users &amp; Plans
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeTab === 'settings' ? '#fff1f2' : 'transparent',
                color: activeTab === 'settings' ? 'var(--primary-red)' : '#4b5563',
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

        {/* Cloud Storage Usage */}
        <div style={{
          backgroundColor: '#f9fafb',
          borderRadius: '14px',
          padding: '16px',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HardDrive size={14} /> Cloud Storage</span>
            <span>2.4 GB / 50 GB</span>
          </div>
          
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '5%', height: '100%', backgroundColor: 'var(--primary-red)' }} />
          </div>

          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
            Auto-cleanup: Files deleted after 2 hours
          </div>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Title & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '6px' }}>
                  Welcome back, DevBeast Team 👋
                </h1>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Here is a quick overview of your PDF document processing metrics and activity.
                </p>
              </div>

              <button
                onClick={() => setView('tool-merge')}
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
              
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>Total Processed</span>
                  <div style={{ padding: '8px', backgroundColor: '#fff1f2', borderRadius: '8px', color: 'var(--primary-red)' }}>
                    <FileText size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>148</div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>↑ +12% from last week</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>Time Saved</span>
                  <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
                    <Clock size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>14.2 hrs</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Estimated work time saved</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>OCR Conversions</span>
                  <div style={{ padding: '8px', backgroundColor: '#f0fdf4', borderRadius: '8px', color: '#16a34a' }}>
                    <Zap size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>32</div>
                <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>High-accuracy OCR active</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>Security Status</span>
                  <div style={{ padding: '8px', backgroundColor: '#fefce8', borderRadius: '8px', color: '#ca8a04' }}>
                    <ShieldCheck size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>256-Bit SSL</div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>✓ Auto-Encrypted & Safe</div>
              </div>

            </div>

            {/* Favorite Tools Quick Launcher */}
            <div style={{ marginBottom: '36px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '16px' }}>
                Quick Action Tools
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div 
                  onClick={() => setView('tool-merge')}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
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
                    <div style={{ padding: '8px', backgroundColor: '#fff1f2', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>Merge PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="#9ca3af" />
                </div>

                <div 
                  onClick={() => setView('tool-split')}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
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
                    <div style={{ padding: '8px', backgroundColor: '#fff1f2', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>Split PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="#9ca3af" />
                </div>

                <div 
                  onClick={() => setView('tool-compress')}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
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
                    <div style={{ padding: '8px', backgroundColor: '#fff1f2', borderRadius: '8px', color: 'var(--primary-red)', fontWeight: '800' }}>
                      PDF
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>Compress PDF</span>
                  </div>
                  <ArrowUpRight size={16} color="#9ca3af" />
                </div>

                <div 
                  onClick={() => setView('tool-pdftoword')}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
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
                    <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px', color: '#2563eb', fontWeight: '800' }}>
                      DOC
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>PDF to Word</span>
                  </div>
                  <ArrowUpRight size={16} color="#9ca3af" />
                </div>
              </div>
            </div>

            {/* Recent Files Table Preview */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>
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
                    <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '12px', fontWeight: '700' }}>
                      <th style={{ padding: '12px 16px' }}>DOCUMENT NAME</th>
                      <th style={{ padding: '12px 16px' }}>TOOL USED</th>
                      <th style={{ padding: '12px 16px' }}>FILE SIZE</th>
                      <th style={{ padding: '12px 16px' }}>DATE</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFiles.slice(0, 3).map(file => (
                      <tr key={file.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#374151' }}>
                        <td style={{ padding: '16px', fontWeight: '700', color: '#111827' }}>{file.name}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                            {file.tool}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#6b7280' }}>{file.size}</td>
                        <td style={{ padding: '16px', color: '#6b7280' }}>{file.date}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--primary-red)', cursor: 'pointer', padding: '6px' }} title="Download">
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
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '6px' }}>
                  Document History & Files
                </h1>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Manage and download all documents processed in your workspace.
                </p>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search file name or tool..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '24px' }}>
              {filteredFiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  No files found matching "{searchQuery}".
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '12px', fontWeight: '700' }}>
                      <th style={{ padding: '14px 16px' }}>FILE NAME</th>
                      <th style={{ padding: '14px 16px' }}>TOOL</th>
                      <th style={{ padding: '14px 16px' }}>SIZE</th>
                      <th style={{ padding: '14px 16px' }}>PROCESSED DATE</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map(file => (
                      <tr key={file.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#374151' }}>
                        <td style={{ padding: '16px', fontWeight: '700', color: '#111827' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={18} color="var(--primary-red)" />
                            {file.name}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ backgroundColor: '#fff1f2', color: 'var(--primary-red)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                            {file.tool}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: '#6b7280' }}>{file.size}</td>
                        <td style={{ padding: '16px', color: '#6b7280' }}>{file.date}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button style={{ border: 'none', backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '8px', color: '#374151', cursor: 'pointer' }} title="Download File">
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
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '6px' }}>
              Developer API Keys
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>
              Use your API secret key to integrate PDF processing endpoints directly into your application.
            </p>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '30px', maxWidth: '640px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                Live Production Secret Key
              </label>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="password"
                  readOnly
                  value="ilovepdf_live_sec_89237492837482937498"
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb'
                  }}
                />
                <button
                  onClick={handleCopyApiKey}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--primary-red)',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {copiedKey ? 'Copied!' : 'Copy Key'}
                </button>
              </div>

              <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
                Server Endpoint Base: <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: '#111827' }}>http://localhost:5000/api/</code>
              </div>
            </div>
          </div>
        )}

        {/* Account Settings / Profile Tab */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '720px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>My Profile</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>Manage your personal information, password, and notification preferences.</p>

            {/* === Avatar & Basic Info === */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '18px', padding: '30px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={17} color="var(--primary-red)" /> Personal Information
              </h2>

              {/* Avatar Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: profile.avatarColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', border: '3px solid #fff', boxShadow: '0 0 0 2px var(--primary-red)' }}>
                    {profile.avatarInitials}
                  </div>
                  <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '24px', height: '24px', backgroundColor: 'var(--primary-red)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
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
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>{profile.firstName} {profile.lastName}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{profile.email}</div>
                  <div style={{ fontSize: '12px', color: 'var(--primary-red)', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Sparkles size={11} /> Premium Account</div>
                </div>
              </div>

              {/* Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>First Name</label>
                  <input type="text" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--primary-red)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Last Name</label>
                  <input type="text" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--primary-red)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={13} /> Email Address</label>
                  <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--primary-red)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={13} /> Phone Number</label>
                  <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.target.style.borderColor = 'var(--primary-red)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Bio / Description</label>
                  <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = 'var(--primary-red)'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={13} /> Language</label>
                  <select value={profile.language} onChange={e => setProfile(p => ({ ...p, language: e.target.value }))} style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}>
                    {['English', 'Urdu', 'Arabic', 'Spanish', 'French', 'German', 'Chinese'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleProfileSave} style={{ marginTop: '24px', padding: '12px 28px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary-red)', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity 0.2s' }}>
                <Save size={16} /> {profileSaved ? '✅ Profile Saved!' : 'Save Profile'}
              </button>
            </div>

            {/* === Change Password === */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '18px', padding: '30px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={17} color="var(--primary-red)" /> Change Password
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={passwordData.current} onChange={e => setPasswordData(p => ({ ...p, current: e.target.value }))} placeholder="Enter current password" style={{ width: '100%', padding: '11px 40px 11px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                    <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showNewPassword ? 'text' : 'password'} value={passwordData.newPass} onChange={e => setPasswordData(p => ({ ...p, newPass: e.target.value }))} placeholder="Min. 8 characters" style={{ width: '100%', padding: '11px 40px 11px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                      <button type="button" onClick={() => setShowNewPassword(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Confirm New Password</label>
                    <input type="password" value={passwordData.confirm} onChange={e => setPasswordData(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" style={{ width: '100%', padding: '11px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                {passwordMsg && <div style={{ fontSize: '13px', fontWeight: '600', color: passwordMsg.startsWith('✅') ? '#16a34a' : '#dc2626', backgroundColor: passwordMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', padding: '10px 14px', borderRadius: '8px' }}>{passwordMsg}</div>}
                <button onClick={handlePasswordChange} style={{ alignSelf: 'flex-start', padding: '12px 28px', borderRadius: '10px', border: 'none', backgroundColor: '#111827', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={15} /> Update Password
                </button>
              </div>
            </div>

            {/* === Notification Preferences === */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '18px', padding: '30px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={17} color="var(--primary-red)" /> Notification Preferences
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { key: 'emailReports',  label: 'Monthly Usage Reports',        desc: 'Receive a monthly summary of your PDF processing activity.' },
                  { key: 'fileReady',     label: 'File Processing Alerts',       desc: 'Get notified when your file is ready to download.' },
                  { key: 'planReminder',  label: 'Plan Renewal Reminders',       desc: 'Reminders before your subscription renews or expires.' },
                  { key: 'newsletter',    label: 'Product News & Updates',       desc: 'Tips, new features, and product announcements from iLovePDF.' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                    <button
                      onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                      style={{
                        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', flexShrink: 0,
                        backgroundColor: notifications[item.key] ? 'var(--primary-red)' : '#d1d5db',
                        position: 'relative', transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ position: 'absolute', top: '2px', left: notifications[item.key] ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* === Danger Zone === */}
            <div style={{ backgroundColor: '#fff', border: '1.5px solid #fecaca', borderRadius: '18px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#dc2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={17} /> Danger Zone
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>These actions are irreversible. Please be certain before proceeding.</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button style={{ padding: '10px 20px', borderRadius: '9px', border: '1.5px solid #fca5a5', backgroundColor: '#fff', color: '#dc2626', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Clear All My Files</button>
                <button style={{ padding: '10px 20px', borderRadius: '9px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Delete My Account</button>
              </div>
            </div>

          </div>
        )}

        {/* Users & Plans Tab */}
        {activeTab === 'users' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                  Users &amp; Plans
                </h1>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  See which users have purchased which plan and their activity.
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Total Users',     value: usersData.length,                                         color: '#111827', bg: '#f9fafb', icon: <Users size={20} /> },
                { label: 'Business Plans',  value: usersData.filter(u => u.plan === 'Business').length,      color: '#7c3aed', bg: '#f5f3ff', icon: <Crown size={20} /> },
                { label: 'Premium Plans',   value: usersData.filter(u => u.plan === 'Premium').length,       color: '#d97706', bg: '#fffbeb', icon: <Star size={20} /> },
                { label: 'Free Plans',      value: usersData.filter(u => u.plan === 'Free').length,          color: '#6b7280', bg: '#f3f4f6', icon: <User size={20} /> },
              ].map((card, i) => (
                <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div style={{ padding: '10px', backgroundColor: card.bg, borderRadius: '10px', color: card.color }}>
                    {card.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: '#111827' }}>{card.value}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>{card.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Search & Filter bar */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '20px 24px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['All', 'Business', 'Premium', 'Free'].map(f => (
                  <button
                    key={f}
                    onClick={() => setPlanFilter(f)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: planFilter === f ? 'var(--primary-red)' : '#e5e7eb',
                      backgroundColor: planFilter === f ? '#fff1f2' : '#ffffff',
                      color: planFilter === f ? 'var(--primary-red)' : '#6b7280',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >{f}</button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              {/* Table Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2.5fr 1fr 1fr 1fr 1fr', padding: '14px 24px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['User', 'Email', 'Plan', 'Files', 'Joined', 'Status'].map((h, i) => (
                  <div key={i} style={{ fontSize: '12px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                ))}
              </div>

              {/* Table Rows */}
              {filteredUsers.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No users found for the selected filter.
                </div>
              ) : (
                filteredUsers.map((user, i) => {
                  const meta = planMeta[user.plan];
                  return (
                    <div
                      key={user.id}
                      style={{ display: 'grid', gridTemplateColumns: '2fr 2.5fr 1fr 1fr 1fr 1fr', padding: '16px 24px', alignItems: 'center', borderBottom: i < filteredUsers.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* User Avatar + Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0, border: `1px solid ${meta.color}30` }}>
                          {user.avatar}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{user.name}</span>
                      </div>

                      {/* Email */}
                      <div style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>

                      {/* Plan Badge */}
                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', backgroundColor: meta.bg, color: meta.color, fontSize: '12px', fontWeight: '800' }}>
                          {meta.icon} {user.plan}
                        </span>
                      </div>

                      {/* Files Count */}
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>{user.files}</div>

                      {/* Join Date */}
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{user.joinDate}</div>

                      {/* Status Badge */}
                      <div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', backgroundColor: user.status === 'Active' ? '#f0fdf4' : '#fef2f2', color: user.status === 'Active' ? '#16a34a' : '#dc2626', fontSize: '12px', fontWeight: '800' }}>
                          {user.status === 'Active' ? <BadgeCheck size={13} /> : <XCircle size={13} />}
                          {user.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: '12px', fontSize: '13px', color: '#9ca3af', textAlign: 'right' }}>
              Showing {filteredUsers.length} of {usersData.length} users
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
