import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Crown, Star, User, Search, ShieldAlert, BadgeCheck, XCircle, 
  Trash2, Edit, Plus, Settings, FileText, Server, Activity, DollarSign, 
  Database, Clock, ArrowLeft, RefreshCw, Download, Save, CheckCircle, AlertTriangle
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function AdminPanel({
  usersData,
  setUsersData,
  recentFiles,
  setRecentFiles,
  toolsConfig,
  setToolsConfig,
  systemSettings,
  setSystemSettings
}) {
  const navigate = useNavigate();
  const onBack = () => navigate(-1);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('All');
  const [fileSearch, setFileSearch] = useState('');

  // Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  // New User Form state
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', plan: 'Free', status: 'Active' });
  const [userFormError, setUserFormError] = useState('');

  // Cleanup simulation animation state
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState('');

  // Local state for System settings inputs
  const [settingsForm, setSettingsForm] = useState({
    monthlyPremiumPrice: systemSettings.monthlyPremiumPrice,
    monthlyBusinessPrice: systemSettings.monthlyBusinessPrice,
    autoCleanupHours: systemSettings.autoCleanupHours,
    maxStoragePoolGb: systemSettings.maxStoragePoolGb
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // CPU and latency simulation
  const [serverMetrics, setServerMetrics] = useState({
    cpu: 18,
    ram: 42,
    latency: 24,
    storage: 2.4
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setServerMetrics(prev => ({
        cpu: Math.max(12, Math.min(85, Math.floor(prev.cpu + (Math.random() * 10 - 5)))),
        ram: Math.max(38, Math.min(65, Math.floor(prev.ram + (Math.random() * 2 - 1)))),
        latency: Math.max(15, Math.min(50, Math.floor(prev.latency + (Math.random() * 6 - 3)))),
        storage: parseFloat((recentFiles.length * 0.45).toFixed(1))
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, [recentFiles]);

  // Live platform logs
  const [logs, setLogs] = useState([
    { id: 1, time: '11:01 AM', text: 'Admin accessed the system portal.', type: 'info' },
    { id: 2, time: '10:45 AM', text: 'Sarah Johnson converted document: annual_report_draft.docx to PDF.', type: 'success' },
    { id: 3, time: '09:30 AM', text: 'System auto-cleanup task executed successfully. Cleared 0 expired files.', type: 'info' },
    { id: 4, time: '08:15 AM', text: 'User Ahmed Raza uploaded 8.4 MB client_contract_signed.pdf for compression.', type: 'success' },
    { id: 5, time: '07:50 AM', text: 'New signup: David Chen registered for a Business Account.', type: 'user' }
  ]);

  // Append logs on user data changes
  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [{ id: Date.now(), time, text, type }, ...prev.slice(0, 15)]);
  };

  // User CRUD Operations
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) {
      setUserFormError('Please fill out all fields.');
      return;
    }
    const emailExists = usersData.some(u => u.email.toLowerCase() === newUserForm.email.toLowerCase());
    if (emailExists) {
      setUserFormError('This email is already registered.');
      return;
    }

    const newUser = {
      id: Date.now(),
      name: newUserForm.name,
      email: newUserForm.email,
      plan: newUserForm.plan,
      joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: newUserForm.status,
      files: 0,
      avatar: newUserForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    };

    setUsersData(prev => [newUser, ...prev]);
    addLog(`Manually created user: ${newUser.name} (${newUser.email}).`, 'user');
    setShowAddUserModal(false);
    setNewUserForm({ name: '', email: '', plan: 'Free', status: 'Active' });
    setUserFormError('');
  };

  const handleOpenEditUser = (user) => {
    setEditingUser({ ...user });
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    if (!editingUser.name || !editingUser.email) return;

    setUsersData(prev => prev.map(u => (u.id === editingUser.id ? editingUser : u)));
    addLog(`Updated profile details for user: ${editingUser.name}.`, 'info');
    setEditingUser(null);
  };

  const handleDeleteUser = (id, name) => {
    setDeleteConfirmUser({ id, name });
  };

  const confirmDeleteUser = () => {
    if (deleteConfirmUser) {
      const { id, name } = deleteConfirmUser;
      setUsersData(prev => prev.filter(u => u.id !== id));
      addLog(`Deleted user: ${name}.`, 'warning');
      setDeleteConfirmUser(null);
    }
  };

  // Tool Config actions
  const handleToggleTool = (toolId, name, currentStatus) => {
    setToolsConfig(prev => ({
      ...prev,
      [toolId]: {
        ...prev[toolId],
        enabled: !currentStatus
      }
    }));
    addLog(`${!currentStatus ? 'Enabled' : 'Disabled'} access to tool: ${name} globally.`, 'info');
  };

  const handleLimitChange = (toolId, limit) => {
    const numericLimit = parseInt(limit) || 1;
    setToolsConfig(prev => ({
      ...prev,
      [toolId]: {
        ...prev[toolId],
        maxFileSizeMb: numericLimit
      }
    }));
  };

  // Files actions
  const handleDeleteFile = (id, filename) => {
    if (window.confirm(`Delete file "${filename}" from server storage permanently?`)) {
      setRecentFiles(prev => prev.filter(f => f.id !== id));
      addLog(`Admin deleted file from storage: ${filename}.`, 'warning');
    }
  };

  const handleAutoCleanup = () => {
    setIsCleaning(true);
    setCleanupMessage('Analyzing file tables...');
    
    setTimeout(() => {
      setCleanupMessage('Deleting files exceeding cleanup timeout (2 hours)...');
      setTimeout(() => {
        const deletedCount = recentFiles.length > 2 ? recentFiles.length - 2 : 0;
        if (deletedCount > 0) {
          setRecentFiles(prev => prev.slice(0, 2));
        }
        setIsCleaning(false);
        setCleanupMessage('');
        addLog(`Cleaned up ${deletedCount} expired documents from storage pool.`, 'warning');
        alert(`Successfully cleaned up ${deletedCount} expired temporary files!`);
      }, 1500);
    }, 1000);
  };

  // Settings actions
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSystemSettings(prev => ({
      ...prev,
      monthlyPremiumPrice: parseFloat(settingsForm.monthlyPremiumPrice),
      monthlyBusinessPrice: parseFloat(settingsForm.monthlyBusinessPrice),
      autoCleanupHours: parseInt(settingsForm.autoCleanupHours),
      maxStoragePoolGb: parseInt(settingsForm.maxStoragePoolGb)
    }));
    setSettingsSaved(true);
    addLog(`Updated global platform pricing and cache retention configuration.`, 'info');
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleToggleMaintenance = () => {
    const mode = !systemSettings.maintenanceMode;
    setSystemSettings(prev => ({ ...prev, maintenanceMode: mode }));
    addLog(`${mode ? 'ACTIVATED Maintenance Mode' : 'DEACTIVATED Maintenance Mode'} globally.`, mode ? 'warning' : 'success');
  };

  // Analytics Helpers
  const premiumCount = usersData.filter(u => u.plan === 'Premium').length;
  const bannedCount = usersData.filter(u => u.status === 'Banned').length;
  const freeCount = usersData.filter(u => u.plan === 'Free').length;

  const estimatedMonthlyRevenue = useMemo(() => {
    return premiumCount * systemSettings.monthlyPremiumPrice;
  }, [premiumCount, systemSettings]);

  const totalFilesCount = useMemo(() => {
    return usersData.reduce((acc, curr) => acc + curr.files, 0) + recentFiles.length;
  }, [usersData, recentFiles]);

  const filteredUsers = usersData.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchPlan = userPlanFilter === 'All' || u.plan === userPlanFilter;
    return matchSearch && matchPlan;
  });

  const filteredFiles = recentFiles.filter(f => 
    f.name.toLowerCase().includes(fileSearch.toLowerCase()) || 
    f.tool.toLowerCase().includes(fileSearch.toLowerCase())
  );

  const planMeta = {
    Premium:  { color: '#d97706', bg: '#fffbeb', icon: <Star size={12} /> },
    Free:     { color: '#6b7280', bg: '#f9fafb', icon: <User size={12} /> },
  };

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
        color: 'var(--text-dark)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        borderRight: '1px solid var(--border-light)',
        zIndex: 10
      }}>
        <div>
          {/* Admin Identity */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            backgroundColor: 'var(--bg-light)',
            borderRadius: '14px',
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
              AD
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)' }}>Admin Panel</div>
              <div style={{ fontSize: '11px', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Super Admin Active
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: <Activity size={18} /> },
              { id: 'users', label: 'User Accounts', icon: <Users size={18} /> },
              { id: 'tools', label: 'PDF Tools Config', icon: <Settings size={18} /> },
              { id: 'files', label: 'Platform Files', icon: <FileText size={18} /> },
              { id: 'settings', label: 'System Settings', icon: <Server size={18} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? 'var(--primary-red)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--text-gray)',
                  fontWeight: activeTab === tab.id ? '700' : '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Back Link to Home */}
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '10px',
            color: 'var(--text-gray)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            border: 'none',
            backgroundColor: 'transparent',
            transition: 'color 0.2s',
            marginTop: 'auto',
            width: '100%',
            textAlign: 'left'
          }}
        >
          <ArrowLeft size={16} /> Exit to Site Home
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto', boxSizing: 'border-box' }}>
        
        {/* === TAB 1: DASHBOARD OVERVIEW === */}
        {activeTab === 'overview' && (
          <div>
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>Platform Dashboard</h1>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>Real-time telemetry, user signups, and document server stats.</p>
              </div>

              {/* Server Live Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--border-light)', padding: '6px 14px', borderRadius: '20px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>Server Online</span>
              </div>
            </div>

            {/* Quick stats cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
              {[
                { label: 'Total Users', value: usersData.length, change: 'All registrations', color: '#2563eb', bg: 'var(--border-light)', icon: <Users size={20} /> },
                { label: 'Banned Users', value: bannedCount, change: 'Suspended accounts', color: '#ef4444', bg: '#fef2f2', icon: <ShieldAlert size={20} /> },
                { label: 'Free Users', value: freeCount, change: 'Standard plan', color: 'var(--text-gray)', bg: 'var(--border-light)', icon: <User size={20} /> },
                { label: 'Premium Users', value: premiumCount, change: 'Subscription active', color: '#d97706', bg: '#fffbeb', icon: <Star size={20} /> }
              ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-gray)', display: 'block', marginBottom: '8px' }}>{stat.label}</span>
                    <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>{stat.value}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: '500' }}>{stat.change}</span>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-light)', color: stat.color, borderRadius: '12px' }}>
                    {stat.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Charts & Live Server Metrics Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
              
              {/* Analytics SVG Charts Card */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '18px' }}>Monthly Traffic & Usage Trend</h3>
                
                <div style={{ position: 'relative', height: '180px', width: '100%', borderBottom: '1px solid var(--border-light)', marginBottom: '12px' }}>
                  <svg viewBox="0 0 500 150" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary-red)" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="var(--primary-red)" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    
                    <line x1="0" y1="37" x2="500" y2="37" stroke="var(--border-light)" strokeWidth="1" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="var(--border-light)" strokeWidth="1" />
                    <line x1="0" y1="112" x2="500" y2="112" stroke="var(--border-light)" strokeWidth="1" />

                    <path d="M 0 150 Q 80 80, 160 110 T 320 40 T 500 20 L 500 150 L 0 150 Z" fill="url(#chart-grad)" />
                    <path d="M 0 150 Q 80 80, 160 110 T 320 40 T 500 20" fill="none" stroke="var(--primary-red)" strokeWidth="3" strokeLinecap="round" />

                    <circle cx="160" cy="110" r="5" fill="#ffffff" stroke="var(--primary-red)" strokeWidth="2" />
                    <circle cx="320" cy="40" r="5" fill="#ffffff" stroke="var(--primary-red)" strokeWidth="2" />
                    <circle cx="500" cy="20" r="5" fill="#ffffff" stroke="var(--primary-red)" strokeWidth="2" />
                  </svg>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-gray)', fontWeight: '700' }}>
                  <span>FEB 2026</span>
                  <span>MAR 2026</span>
                  <span>APR 2026</span>
                  <span>MAY 2026</span>
                  <span>JUN 2026</span>
                  <span>JUL 2026 (Live)</span>
                </div>
              </div>

              {/* Server Performance Ticker */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={16} color="var(--primary-red)" /> Server Node Status
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>
                      <span>CPU Utilization</span>
                      <span>{serverMetrics.cpu}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${serverMetrics.cpu}%`, height: '100%', backgroundColor: serverMetrics.cpu > 75 ? '#ef4444' : '#10b981', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px' }}>
                      <span>Memory Pool (Allocated)</span>
                      <span>{serverMetrics.ram}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${serverMetrics.ram}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-light-gray)', fontWeight: '700', textTransform: 'uppercase' }}>API Latency</span>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', display: 'block', marginTop: '2px' }}>{serverMetrics.latency} ms</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-light-gray)', fontWeight: '700', textTransform: 'uppercase' }}>Active Tasks</span>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', display: 'block', marginTop: '2px' }}>{recentFiles.length > 0 ? '1 Idle' : '0 Idle'}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Live Activity Ticker & Recent Users Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              
              {/* Activity Log */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px' }}>Live Security & Activity Log</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                  {logs.map(log => (
                    <div key={log.id} style={{ display: 'flex', gap: '10px', fontSize: '13px', padding: '10px', backgroundColor: 'var(--bg-light)', borderRadius: '8px', borderLeft: '3px solid', borderLeftColor: log.type === 'warning' ? '#f59e0b' : log.type === 'success' ? '#10b981' : '#3b82f6' }}>
                      <span style={{ color: 'var(--text-light-gray)', fontWeight: '700', flexShrink: 0 }}>{log.time}</span>
                      <span style={{ color: 'var(--text-dark)', fontWeight: '500' }}>{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Users preview */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)' }}>Latest Registrations</h3>
                  <button onClick={() => setActiveTab('users')} style={{ border: 'none', background: 'none', color: 'var(--primary-red)', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Manage Users →</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {usersData.slice(0, 4).map(user => (
                    <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: planMeta[user.plan].bg, color: planMeta[user.plan].color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', border: `1px solid ${planMeta[user.plan].color}30` }}>
                          {user.avatar}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>{user.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-light-gray)' }}>{user.email}</div>
                        </div>
                      </div>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', backgroundColor: planMeta[user.plan].bg, color: planMeta[user.plan].color }}>
                        {user.plan}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* === TAB 2: USER ACCOUNTS (CRUD) === */}
        {activeTab === 'users' && (
          <div>
            {editingUser ? (
              /* --- FULL PAGE PROFILE / DETAIL VIEW --- */
              <div>
                {/* Back button and header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                  <button 
                    onClick={() => setEditingUser(null)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      border: '1.5px solid var(--border-light)', 
                      backgroundColor: 'var(--bg-card)', 
                      color: 'var(--text-gray)', 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    title="Back to User Accounts"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '4px' }}>User Profile details</h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>Configure parameters, inspect metrics, and review system audit records for this account.</p>
                  </div>
                </div>

                {/* Profile Grid Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px' }}>
                  
                  {/* Left Side: Avatar & Card overview */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '28px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ 
                        width: '90px', 
                        height: '90px', 
                        borderRadius: '50%', 
                        backgroundColor: editingUser.plan === 'Premium' ? '#fffbeb' : 'var(--bg-light)', 
                        color: editingUser.plan === 'Premium' ? '#d97706' : 'var(--text-gray)', 
                        fontSize: '32px', 
                        fontWeight: '800', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 16px auto',
                        border: `2px solid ${editingUser.plan === 'Premium' ? '#fde047' : 'var(--border-light)'}`
                      }}>
                        {editingUser.avatar || editingUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      
                      <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>{editingUser.name}</h2>
                      <p style={{ fontSize: '13px', color: 'var(--text-gray)', marginBottom: '16px' }}>{editingUser.email}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '20px', backgroundColor: editingUser.plan === 'Premium' ? '#fffbeb' : 'var(--bg-light)', color: editingUser.plan === 'Premium' ? '#d97706' : 'var(--text-gray)', fontSize: '11px', fontWeight: '800' }}>
                          {editingUser.plan === 'Premium' ? <Star size={12} /> : <User size={12} />} {editingUser.plan} Plan
                        </span>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '11px', 
                          fontWeight: '800', 
                          backgroundColor: editingUser.status === 'Active' ? '#ecfdf5' : editingUser.status === 'Inactive' ? 'var(--bg-light)' : '#fef2f2',
                          color: editingUser.status === 'Active' ? '#10b981' : editingUser.status === 'Inactive' ? 'var(--text-gray)' : '#ef4444'
                        }}>
                          {editingUser.status}
                        </span>
                      </div>
                    </div>

                    {/* Stats Card */}
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-dark)', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform Usage</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-gray)' }}>Files Processed:</span>
                          <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{editingUser.files}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-gray)' }}>Estimated Cache:</span>
                          <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{(editingUser.files * 1.8).toFixed(1)} MB</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-gray)' }}>Join Date:</span>
                          <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{editingUser.joinDate}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-gray)' }}>Last Session:</span>
                          <span style={{ fontWeight: '700', color: '#059669' }}>Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Account details form & Mock Activities */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Settings Form Card */}
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '20px' }}>Modify Account Specifications</h3>
                      <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Full Name</label>
                            <input 
                              type="text" 
                              value={editingUser.name} 
                              onChange={e => setEditingUser(p => ({ ...p, name: e.target.value }))} 
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} 
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Email Address (Non-editable)</label>
                            <input 
                              type="email" 
                              value={editingUser.email} 
                              readOnly
                              disabled
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-gray)', outline: 'none', fontSize: '14px', boxSizing: 'border-box', cursor: 'not-allowed' }} 
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Subscription Plan</label>
                            <select 
                              value={editingUser.plan} 
                              onChange={e => setEditingUser(p => ({ ...p, plan: e.target.value }))} 
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                            >
                              <option value="Free">Free</option>
                              <option value="Premium">Premium</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Account Status</label>
                            <select 
                              value={editingUser.status} 
                              onChange={e => setEditingUser(p => ({ ...p, status: e.target.value }))} 
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Banned">Banned</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                          <button 
                            type="button" 
                            onClick={() => setEditingUser(null)} 
                            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--bg-light)', color: 'var(--text-gray)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                          >
                            Discard
                          </button>
                          <button 
                            type="submit" 
                            style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-red)', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(229, 36, 36, 0.2)' }}
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Mock Action History */}
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-dark)', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Action History</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { text: 'Merged contract_signed.pdf with annual_sheet.pdf', time: '1 hour ago' },
                          { text: 'Extracted text content from project_doc.pdf', time: '2 hours ago' },
                          { text: 'Compressed design_portfolio_high_res.pdf (saved 4.2 MB)', time: 'Yesterday' },
                          { text: 'Changed account billing structure from Free to Premium', time: '3 days ago' },
                        ].map((act, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '8px 12px', backgroundColor: 'var(--bg-light)', borderRadius: '8px' }}>
                            <span style={{ color: 'var(--text-dark)', fontWeight: '500' }}>{act.text}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-light-gray)' }}>{act.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              /* --- STANDARD TABULAR USERS LIST VIEW --- */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>Manage User Accounts</h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>Provision users, update licenses, and supervise activity logs.</p>
                  </div>

                  {/* Create User Button */}
                  <button
                    onClick={() => setShowAddUserModal(true)}
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
                      boxShadow: '0 4px 15px rgba(229, 36, 36, 0.2)'
                    }}
                  >
                    <Plus size={16} /> Add User Manually
                  </button>
                </div>

                {/* Quick summary numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Total Users', value: usersData.length, color: 'var(--text-dark)', bg: 'var(--bg-light)', icon: <Users size={18} /> },
                    { label: 'Banned Users', value: bannedCount, color: '#ef4444', bg: '#fef2f2', icon: <ShieldAlert size={18} /> },
                    { label: 'Free Users', value: freeCount, color: 'var(--text-gray)', bg: 'var(--border-light)', icon: <User size={18} /> },
                    { label: 'Premium Users', value: premiumCount, color: '#d97706', bg: '#fffbeb', icon: <Star size={18} /> }
                  ].map((card, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px', backgroundColor: card.bg, borderRadius: '8px', color: card.color }}>
                        {card.icon}
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-gray)', fontWeight: '700', textTransform: 'uppercase' }}>{card.label}</span>
                        <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', display: 'block' }}>{card.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filtering toolbar */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} color="var(--text-light-gray)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['All', 'Premium', 'Free'].map(f => (
                      <button
                        key={f}
                        onClick={() => setUserPlanFilter(f)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--border-light)',
                          borderColor: userPlanFilter === f ? 'var(--primary-red)' : 'var(--border-light)',
                          backgroundColor: userPlanFilter === f ? '#fff1f2' : 'var(--bg-card)',
                          color: userPlanFilter === f ? 'var(--primary-red)' : 'var(--text-gray)',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >{f}</button>
                    ))}
                  </div>
                </div>

                {/* User Records Table */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                  
                  {/* Table Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2.5fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 24px', backgroundColor: 'var(--bg-light)', borderBottom: '1.5px solid var(--border-light)', fontWeight: '800', fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Registered User</span>
                    <span>Email Address</span>
                    <span>License</span>
                    <span>Files</span>
                    <span>Join Date</span>
                    <span>Status Toggle</span>
                    <span style={{ textAlign: 'right', paddingRight: '8px' }}>Action</span>
                  </div>

                  {/* Table Body */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {filteredUsers.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)', fontSize: '14px' }}>No records match your query filters.</div>
                    ) : (
                      filteredUsers.map((user, idx) => {
                        const meta = planMeta[user.plan];
                        return (
                          <div
                            key={user.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '2fr 2.5fr 1fr 1fr 1fr 1fr 1fr',
                              padding: '16px 24px',
                              alignItems: 'center',
                              borderBottom: idx < filteredUsers.length - 1 ? '1px solid var(--border-light)' : 'none',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-light)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {/* Avatar & Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', border: `1px solid ${meta.color}30` }}>
                                {user.avatar}
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>{user.name}</span>
                            </div>

                            {/* Email */}
                            <span style={{ fontSize: '13px', color: 'var(--text-gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>

                            {/* Plan badge */}
                            <div>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', backgroundColor: meta.bg, color: meta.color, fontSize: '11px', fontWeight: '800' }}>
                                {meta.icon} {user.plan}
                              </span>
                            </div>

                            {/* Files processed */}
                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', paddingLeft: '8px' }}>{user.files}</span>

                            {/* Join Date */}
                            <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{user.joinDate}</span>

                            {/* Status Toggle Switch */}
                            <div>
                              <button
                                onClick={() => {
                                  const newStatus = user.status === 'Banned' ? 'Active' : 'Banned';
                                  setUsersData(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
                                  addLog(`User status for ${user.name} changed to ${newStatus}.`, newStatus === 'Banned' ? 'warning' : 'success');
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  backgroundColor: user.status === 'Banned' ? '#fef2f2' : '#ecfdf5',
                                  border: `1.5px solid ${user.status === 'Banned' ? '#fca5a5' : '#a7f3d0'}`,
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  color: user.status === 'Banned' ? '#ef4444' : '#10b981',
                                  transition: 'all 0.2s',
                                }}
                                title={user.status === 'Banned' ? "Click to Unban User (Set Active)" : "Click to Ban User"}
                              >
                                {/* Toggle Switch indicator */}
                                <div style={{
                                  width: '28px',
                                  height: '14px',
                                  borderRadius: '7px',
                                  backgroundColor: user.status === 'Banned' ? '#ef4444' : '#10b981',
                                  position: 'relative',
                                  transition: 'background-color 0.2s',
                                  display: 'inline-block'
                                }}>
                                  <div style={{
                                    position: 'absolute',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: '#ffffff',
                                    top: '2px',
                                    left: user.status === 'Banned' ? '2px' : '16px',
                                    transition: 'left 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                  }} />
                                </div>
                                <span>{user.status}</span>
                              </button>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenEditUser(user)}
                                style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'var(--bg-light)', color: 'var(--text-gray)', cursor: 'pointer', border: 'none' }}
                                title="Edit User Details"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#ef4444', cursor: 'pointer', border: 'none' }}
                                title="Delete User"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Custom Delete Confirmation Modal */}
                {deleteConfirmUser && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', width: '360px', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)', padding: '24px', textAlign: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                        <Trash2 size={24} />
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px' }}>Delete User Account?</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-gray)', lineHeight: '1.5', marginBottom: '20px' }}>
                        Are you sure you want to delete <strong>{deleteConfirmUser.name}</strong>? This action cannot be undone.
                      </p>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button onClick={() => setDeleteConfirmUser(null)} style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--bg-light)', color: 'var(--text-gray)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={confirmDeleteUser} style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>Delete User</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal: Add User */}
                {showAddUserModal && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', width: '420px', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)', padding: '24px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '18px', color: 'var(--text-dark)' }}>Add New User Account</h3>
                      {userFormError && <div style={{ fontSize: '13px', color: '#ef4444', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', fontWeight: '600' }}>{userFormError}</div>}
                      <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '5px' }}>Full Name</label>
                          <input type="text" placeholder="John Doe" value={newUserForm.name} onChange={e => setNewUserForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', outline: 'none', fontSize: '14px' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '5px' }}>Email Address</label>
                          <input type="email" placeholder="john@company.com" value={newUserForm.email} onChange={e => setNewUserForm(p => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', outline: 'none', fontSize: '14px' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '5px' }}>Licensing Plan</label>
                          <select value={newUserForm.plan} onChange={e => setNewUserForm(p => ({ ...p, plan: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', outline: 'none', fontSize: '14px' }}>
                            <option value="Free">Free Account</option>
                            <option value="Premium">Premium Account</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '5px' }}>Initial Status</label>
                          <select value={newUserForm.status} onChange={e => setNewUserForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', outline: 'none', fontSize: '14px' }}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Banned">Banned</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                          <button type="button" onClick={() => { setShowAddUserModal(false); setUserFormError(''); }} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--bg-light)', color: 'var(--text-gray)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                          <button type="submit" style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary-red)', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Add User</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* === TAB 3: PDF TOOLS CONFIGURATION === */}
        {activeTab === 'tools' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>PDF Engine Configuration</h1>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>Configure file size upload constraints and toggle specific microservices globally.</p>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 1.5fr', padding: '12px 16px', backgroundColor: 'var(--bg-light)', borderBottom: '1.5px solid var(--border-light)', fontWeight: '800', fontSize: '12px', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>PDF Processing Tool</span>
                <span style={{ textAlign: 'center' }}>Upload Size Limit (MB)</span>
                <span style={{ textAlign: 'right', paddingRight: '12px' }}>Operational Access</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {Object.keys(toolsConfig).map((toolId) => {
                  const conf = toolsConfig[toolId];
                  const formattedTitle = toolId
                    .replace('tool-', '')
                    .replace('to', ' to ')
                    .replace('pdf', 'PDF')
                    .replace('word', 'Word')
                    .replace('excel', 'Excel')
                    .replace('powerpoint', 'PowerPoint')
                    .replace('jpg', 'JPG')
                    .replace('aisummarizer', 'AI Summarizer')
                    .replace(/^\w/, c => c.toUpperCase());

                  return (
                    <div
                      key={toolId}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '3fr 1.5fr 1.5fr',
                        padding: '16px',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-light)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Name & ID */}
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>{formattedTitle}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light-gray)' }}>Resource Identifier: <code style={{ backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', padding: '2px 4px', borderRadius: '4px' }}>{toolId}</code></div>
                      </div>

                      {/* File Size input limit */}
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={conf.maxFileSizeMb}
                          onChange={e => handleLimitChange(toolId, e.target.value)}
                          style={{
                            width: '80px',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1.5px solid var(--border-light)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-dark)',
                            fontSize: '13px',
                            fontWeight: '700',
                            textAlign: 'center',
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--text-gray)', marginLeft: '6px', fontWeight: '700' }}>MB</span>
                      </div>

                      {/* Status toggle operational */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '8px' }}>
                        <button
                          onClick={() => handleToggleTool(toolId, formattedTitle, conf.enabled)}
                          style={{
                            width: '52px',
                            height: '26px',
                            borderRadius: '13px',
                            backgroundColor: conf.enabled ? '#10b981' : '#cbd5e1',
                            position: 'relative',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            top: '3px',
                            left: conf.enabled ? '29px' : '3px',
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                          }} />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* === TAB 4: PLATFORM FILES MANAGER === */}
        {activeTab === 'files' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>Server Storage Files</h1>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>Audit file transfers, inspect size metrics, and clear memory logs.</p>
              </div>

              {/* Cache Clean Action */}
              <button
                onClick={handleAutoCleanup}
                disabled={isCleaning}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--text-dark)',
                  color: 'var(--bg-card)',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: isCleaning ? 0.7 : 1
                }}
              >
                <RefreshCw size={16} style={{ animation: isCleaning ? 'spin 1.5s linear infinite' : 'none' }} />
                {isCleaning ? 'Cleaning Cache...' : 'Auto-Cleanup Cache'}
              </button>
            </div>

            {/* Cleaning Ticker Overlay Alert */}
            {isCleaning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', backgroundColor: '#fffbeb', border: '1px solid #fde047', borderRadius: '10px', marginBottom: '20px' }}>
                <Clock size={18} color="#d97706" style={{ animation: 'spin 3s linear infinite' }} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#d97706' }}>{cleanupMessage}</span>
              </div>
            )}

            {/* Filter toolbar */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--text-light-gray)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search file database by filename or tool processed..."
                  value={fileSearch}
                  onChange={e => setFileSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>

            {/* Platform files list (Table) */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3.5fr 2fr 1fr 1.5fr 1fr 1fr', padding: '14px 24px', backgroundColor: 'var(--bg-light)', borderBottom: '1px solid var(--border-light)' }}>
                {['Document Filename', 'Tool Mode', 'Size', 'Processing Date', 'Status', 'Action'].map((h, i) => (
                  <div key={i} style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                ))}
              </div>

              {filteredFiles.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light-gray)' }}>No records logged in memory.</div>
              ) : (
                filteredFiles.map((file, idx) => (
                  <div
                    key={file.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3.5fr 2fr 1fr 1.5fr 1fr 1fr',
                      padding: '16px 24px',
                      alignItems: 'center',
                      borderBottom: idx < filteredFiles.length - 1 ? '1px solid var(--border-light)' : 'none',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-light)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Filename & Type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '18px', flexShrink: 0 }}>📄</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{file.name}</span>
                    </div>

                    {/* Tool */}
                    <div>
                      <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                        {file.tool}
                      </span>
                    </div>

                    {/* Size */}
                    <span style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: '600' }}>{file.size}</span>

                    {/* Processed Date */}
                    <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{file.date}</span>

                    {/* Status */}
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', backgroundColor: '#ecfdf5', color: '#10b981' }}>
                        ✓ OK
                      </span>
                    </div>

                    {/* Action delete */}
                    <div>
                      <button
                        onClick={() => handleDeleteFile(file.id, file.name)}
                        style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#ef4444', cursor: 'pointer', border: 'none' }}
                        title="Delete permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-light-gray)', textAlign: 'right' }}>
              Logged storage count: {filteredFiles.length} files
            </div>

          </div>
        )}

        {/* === TAB 5: SYSTEM SETTINGS === */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '720px' }}>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>System Control Settings</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>Manage subscription price lists, server caches, and active maintenance mode overlays.</p>
            </div>

            {/* 1. Maintenance mode block */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-light)', borderRadius: '18px', padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ maxWidth: '420px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color={systemSettings.maintenanceMode ? 'var(--primary-red)' : 'var(--text-gray)'} />
                    Platform Maintenance Mode
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-gray)', lineHeight: '1.5' }}>
                    Activating Maintenance Mode blocks standard visitors with an informational splash screen, disabling document uploads while keeping Admin controls open.
                  </p>
                </div>
                <button
                  onClick={handleToggleMaintenance}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: '1.5px solid',
                    borderColor: systemSettings.maintenanceMode ? 'var(--primary-red)' : 'var(--border-light)',
                    backgroundColor: systemSettings.maintenanceMode ? 'rgba(229,36,36,0.06)' : 'var(--bg-card)',
                    color: systemSettings.maintenanceMode ? 'var(--primary-red)' : 'var(--text-gray)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {systemSettings.maintenanceMode ? 'Deactivate Maintenance' : 'Activate Maintenance'}
                </button>
              </div>
            </div>

            {/* 2. Parameters editing form */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '30px', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '24px' }}>Global Configuration Values</h3>
              
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Pricing section */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '14px' }}>Licensing Pricing Rates ($)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-dark)', fontWeight: '700', marginBottom: '6px' }}>Premium Subscription Rate (Monthly)</label>
                      <div style={{ position: 'relative', maxWidth: '340px' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light-gray)', fontSize: '14px', fontWeight: '700' }}>$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={settingsForm.monthlyPremiumPrice}
                          onChange={e => setSettingsForm(p => ({ ...p, monthlyPremiumPrice: e.target.value }))}
                          style={{ width: '100%', padding: '10px 12px 10px 24px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storage & Limits section */}
                <div style={{ marginTop: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '14px' }}>Server Cache Retention Policies</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-dark)', fontWeight: '700', marginBottom: '6px' }}>File Auto-Cleanup Lifetime</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          value={settingsForm.autoCleanupHours}
                          onChange={e => setSettingsForm(p => ({ ...p, autoCleanupHours: e.target.value }))}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: '700' }}>Hours</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-dark)', fontWeight: '700', marginBottom: '6px' }}>Max Target Storage Pool</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          value={settingsForm.maxStoragePoolGb}
                          onChange={e => setSettingsForm(p => ({ ...p, maxStoragePoolGb: e.target.value }))}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-gray)', fontWeight: '700' }}>GB</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save button and alerts */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 28px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: 'var(--primary-red)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(229, 36, 36, 0.2)'
                    }}
                  >
                    <Save size={16} /> Save Configuration
                  </button>
                  {settingsSaved && (
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={15} /> System settings saved!
                    </span>
                  )}
                </div>

              </form>
            </div>
          </div>
        )}

      </main>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

    </div>
  );
}
