import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, UploadCloud, Clock, HardDrive, ShieldCheck, 
  Settings, Star, Download, Trash2, Share2, Sparkles, Plus, Search, 
  ArrowUpRight, CheckCircle2, User, Zap, CreditCard, DollarSign,
  Camera, Bell, Lock, Globe, Phone, Mail, AlertTriangle, Save, Eye, EyeOff, Building2
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function Dashboard({ 
  usersData,
  setUsersData,
  recentFiles,
  setRecentFiles
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Billing state
  const [billingPlan, setBillingPlan] = useState('PREMIUM');
  const [invoices, setInvoices] = useState([]);
  const [billingMsg, setBillingMsg] = useState('');

  // Payment Card state
  const [paymentCard, setPaymentCard] = useState({
    cardType: 'Visa',
    cardNumber: '4242424242424242',
    cardHolder: 'Alex Johnson',
    expiryMonth: '12',
    expiryYear: '2028',
    cvv: '123'
  });
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [cardMsg, setCardMsg] = useState('');
  const [cardForm, setCardForm] = useState({
    cardType: 'Visa',
    cardNumber: '4242424242424242',
    cardHolder: 'Alex Johnson',
    expiryMonth: '12',
    expiryYear: '2028',
    cvv: '123'
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/user/invoices')
      .then(res => res.json())
      .then(data => {
        if (data.invoices) setInvoices(data.invoices);
      })
      .catch(err => console.error('Error fetching invoices:', err));
  }, []);

  const handleUpgradePlan = async (newPlan) => {
    try {
      const res = await fetch('http://localhost:5000/api/user/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 1, 
          plan: newPlan, 
          billingCycle: 'yearly', 
          paymentMethod: `${paymentCard.cardType} ending in ${paymentCard.cardNumber.replace(/\s+/g, '').slice(-4) || '4242'}` 
        })
      });
      const data = await res.json();
      if (data.success) {
        setBillingPlan(newPlan);
        setBillingMsg(`✅ ${data.message}`);
        setTimeout(() => setBillingMsg(''), 4000);
      }
    } catch (err) {
      console.error('Billing update error:', err);
    }
  };

  const handleSaveCard = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/user/payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardForm)
      });
      const data = await res.json();
      setPaymentCard(cardForm);
      setCardMsg(`✅ ${data.message || 'Payment card updated successfully!'}`);
      setIsEditingCard(false);
      setTimeout(() => setCardMsg(''), 4000);
    } catch (err) {
      setPaymentCard(cardForm);
      setCardMsg('✅ Payment card updated successfully!');
      setIsEditingCard(false);
      setTimeout(() => setCardMsg(''), 4000);
    }
  };

  // Profile state
  const [profile, setProfile] = useState({
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@ilovepdf.com',
    phone: '+1 (555) 012-3456',
    bio: 'PDF processing enthusiast. Managing documents and workflows at iLovePDF.',
    language: 'English',
    avatarInitials: 'AJ',
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

  const handleDeleteFile = (id) => {
    setRecentFiles(prev => prev.filter(f => f.id !== id));
  };



  const filteredFiles = recentFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.tool.toLowerCase().includes(searchQuery.toLowerCase())
  );



  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: 'var(--bg-light)',
      display: 'flex',
      flexDirection: 'row',
      color: 'var(--text-dark)'
    }}>
      
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-light)',
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
            backgroundColor: 'var(--bg-light)',
            borderRadius: '12px',
            marginBottom: '28px',
            border: '1px solid var(--border-light)'
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
              AJ
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                Alex Johnson
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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

        {/* Cloud Storage Usage */}
        <div style={{
          backgroundColor: 'var(--bg-light)',
          borderRadius: '14px',
          padding: '16px',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HardDrive size={14} /> Cloud Storage</span>
            <span>2.4 GB / 50 GB</span>
          </div>
          
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '5%', height: '100%', backgroundColor: 'var(--primary-red)' }} />
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-light-gray)', marginTop: '8px' }}>
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
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Welcome back, Alex Johnson 👋
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
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-gray)' }}>Total Processed</span>
                  <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--primary-red)' }}>
                    <FileText size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>148</div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>↑ +12% from last week</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-gray)' }}>Time Saved</span>
                  <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#2563eb' }}>
                    <Clock size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>14.2 hrs</div>
                <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Estimated work time saved</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-gray)' }}>OCR Conversions</span>
                  <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#16a34a' }}>
                    <Zap size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>32</div>
                <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>High-accuracy OCR active</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-gray)' }}>Security Status</span>
                  <div style={{ padding: '8px', backgroundColor: 'var(--border-light)', borderRadius: '8px', color: '#ca8a04' }}>
                    <ShieldCheck size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>256-Bit SSL</div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>✓ Auto-Encrypted & Safe</div>
              </div>

            </div>

            {/* Favorite Tools Quick Launcher */}
            <div style={{ marginBottom: '36px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px' }}>
                Quick Action Tools
              </h3>

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
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Document History & Files
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>
                  Manage and download all documents processed in your workspace.
                </p>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} color="var(--text-light-gray)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search file name or tool..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                    {filteredFiles.map(file => (
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
                            <button style={{ border: 'none', backgroundColor: 'var(--bg-light)', borderRadius: '6px', padding: '8px', color: 'var(--text-gray)', cursor: 'pointer' }} title="Download File">
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

        {/* Billing & Subscription Tab */}
        {activeTab === 'billing' && (
          <div style={{ maxWidth: '850px' }}>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>
                Billing & Subscription
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>
                Manage your active plan, payment methods, and download invoice history.
              </p>
            </div>

            {billingMsg && (
              <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: '700', fontSize: '14px', marginBottom: '24px' }}>
                {billingMsg}
              </div>
            )}

            {/* Current Active Plan Card */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--primary-red)', borderRadius: '20px', padding: '30px', marginBottom: '32px', boxShadow: '0 10px 30px rgba(229, 36, 36, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-red)', backgroundColor: 'rgba(229, 36, 36, 0.1)', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase' }}>
                    Active Plan
                  </span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '10px', marginBottom: '4px' }}>
                    {billingPlan} Plan
                  </h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>
                    Billed Yearly — Next renewal on August 14, 2027
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-dark)' }}>
                    {billingPlan === 'BUSINESS' ? '$8' : billingPlan === 'PREMIUM' ? '$4' : '$0'}
                    <span style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: '500' }}> / month</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700', marginTop: '4px' }}>
                    ✓ Auto-Renewal Active
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '24px 0' }} />

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleUpgradePlan('PREMIUM')}
                  style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border-light)', backgroundColor: billingPlan === 'PREMIUM' ? 'var(--primary-red)' : 'var(--bg-card)', color: billingPlan === 'PREMIUM' ? '#ffffff' : 'var(--text-dark)', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {billingPlan === 'PREMIUM' ? '✓ Current Plan (Premium)' : 'Switch to Premium ($4/mo)'}
                </button>

                <button
                  onClick={() => handleUpgradePlan('BUSINESS')}
                  style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border-light)', backgroundColor: billingPlan === 'BUSINESS' ? 'var(--primary-red)' : 'var(--bg-card)', color: billingPlan === 'BUSINESS' ? '#ffffff' : 'var(--text-dark)', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {billingPlan === 'BUSINESS' ? '✓ Current Plan (Business)' : 'Upgrade to Business ($8/mo)'}
                </button>
              </div>
            </div>

            {/* Payment Method Card */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '28px', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CreditCard size={20} color="var(--primary-red)" /> Primary Payment Method
              </h3>

              {cardMsg && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', fontWeight: '700', fontSize: '14px', marginBottom: '16px' }}>
                  {cardMsg}
                </div>
              )}

              {!isEditingCard ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: 'var(--bg-light)', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      padding: '10px 14px',
                      backgroundColor: paymentCard.cardType === 'MasterCard' ? '#dc2626' : paymentCard.cardType === 'American Express' ? '#0284c7' : '#1d4ed8',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: '900',
                      fontSize: '13px',
                      letterSpacing: '0.5px'
                    }}>
                      {paymentCard.cardType === 'American Express' ? 'EXPRESS' : paymentCard.cardType.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>
                        {paymentCard.cardType} ending in {paymentCard.cardNumber.replace(/\s+/g, '').slice(-4) || '4242'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>
                        Expires {paymentCard.expiryMonth} / {paymentCard.expiryYear} — {paymentCard.cardHolder} (Default Payment)
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCardForm({ ...paymentCard });
                      setIsEditingCard(true);
                    }}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Edit Card
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveCard} style={{ backgroundColor: 'var(--bg-light)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    
                    {/* Card Type Dropdown */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>
                        CARD TYPE (SELECT)
                      </label>
                      <select
                        value={cardForm.cardType}
                        onChange={(e) => setCardForm({ ...cardForm, cardType: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', fontWeight: '700' }}
                      >
                        <option value="Visa">Visa Card</option>
                        <option value="MasterCard">MasterCard</option>
                        <option value="American Express">American Express (Express)</option>
                      </select>
                    </div>

                    {/* Cardholder Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>
                        CARDHOLDER NAME
                      </label>
                      <input
                        type="text"
                        value={cardForm.cardHolder}
                        onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value })}
                        placeholder="Alex Johnson"
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px' }}
                      />
                    </div>

                    {/* Card Number */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>
                        CARD NUMBER
                      </label>
                      <input
                        type="text"
                        value={cardForm.cardNumber}
                        onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                        placeholder="4242 4242 4242 4242"
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', fontFamily: 'monospace' }}
                      />
                    </div>

                    {/* Expiration Date & CVV */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>MONTH</label>
                        <select
                          value={cardForm.expiryMonth}
                          onChange={(e) => setCardForm({ ...cardForm, expiryMonth: e.target.value })}
                          style={{ width: '100%', padding: '10px 6px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>YEAR</label>
                        <select
                          value={cardForm.expiryYear}
                          onChange={(e) => setCardForm({ ...cardForm, expiryYear: e.target.value })}
                          style={{ width: '100%', padding: '10px 6px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                        >
                          {['2025', '2026', '2027', '2028', '2029', '2030'].map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardForm.cvv}
                          onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                          placeholder="123"
                          required
                          style={{ width: '100%', padding: '10px 8px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditingCard(false)}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'transparent', color: 'var(--text-gray)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-red)', color: '#ffffff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Save Card Details
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Billing Information & Tax ID Card */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '28px', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={20} color="var(--primary-red)" /> Billing Information & Tax Details
              </h3>

              <form onSubmit={(e) => { e.preventDefault(); alert('✅ Billing information updated successfully!'); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>COMPANY / BILLING NAME</label>
                  <input type="text" defaultValue="Alex Johnson Inc." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>VAT / TAX ID NUMBER</label>
                  <input type="text" defaultValue="US987654321" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>BILLING EMAIL ADDRESS</label>
                  <input type="email" defaultValue="alex@example.com" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>COUNTRY / REGION</label>
                  <select defaultValue="United States" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '14px' }}>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Canada</option>
                    <option>Germany</option>
                    <option>Pakistan</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2', textAlign: 'right', marginTop: '10px' }}>
                  <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-red)', color: '#ffffff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                    Save Billing Info
                  </button>
                </div>
              </form>
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
                        <button onClick={() => alert(`📄 Downloading invoice PDF for ${inv.id}...`)} style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--primary-red)', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
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
          <div style={{ maxWidth: '720px' }}>
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
                  <div style={{ fontSize: '12px', color: 'var(--primary-red)', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Sparkles size={11} /> Premium Account</div>
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

            {/* === Notification Preferences === */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '30px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={17} color="var(--primary-red)" /> Notification Preferences
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { key: 'emailReports',  label: 'Monthly Usage Reports',        desc: 'Receive a monthly summary of your PDF processing activity.' },
                  { key: 'fileReady',     label: 'File Processing Alerts',       desc: 'Get notified when your file is ready to download.' },
                  { key: 'planReminder',  label: 'Plan Renewal Reminders',       desc: 'Reminders before your subscription renews or expires.' },
                  { key: 'newsletter',    label: 'Product News & Updates',       desc: 'Tips, new features, and product announcements from iLovePDF.' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                    <button
                      onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                      style={{
                        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', flexShrink: 0,
                        backgroundColor: notifications[item.key] ? 'var(--primary-red)' : 'var(--border-light)',
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
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1.5px solid #fecaca', borderRadius: '18px', padding: '30px', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#dc2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={17} /> Danger Zone
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginBottom: '20px' }}>These actions are irreversible. Please be certain before proceeding.</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button style={{ padding: '10px 20px', borderRadius: '9px', border: '1.5px solid #fca5a5', backgroundColor: 'var(--bg-card)', color: '#dc2626', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Clear All My Files</button>
                <button style={{ padding: '10px 20px', borderRadius: '9px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Delete My Account</button>
              </div>
            </div>

          </div>
        )}



      </main>
    </div>
  );
}
