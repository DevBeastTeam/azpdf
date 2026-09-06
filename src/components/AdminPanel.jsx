import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Crown, Star, User, Search, ShieldAlert, BadgeCheck, XCircle,
  Trash2, Edit, Plus, Settings, FileText, Server, Activity, DollarSign,
  Database, Clock, ArrowLeft, RefreshCw, Download, Save, CheckCircle, AlertTriangle, Smartphone, Eye, EyeOff,
  Layout, Globe, ExternalLink, Link as LinkIcon, Mail, MessageSquare, Phone, Building, Calendar, Check, Reply, Send
} from 'lucide-react';
import StoreBadges from './StoreBadges';

import { useNavigate } from 'react-router-dom';

export default function AdminPanel({
  usersData,
  setUsersData,
  recentFiles,
  setRecentFiles,
  toolsConfig,
  setToolsConfig,
  systemSettings,
  setSystemSettings,
  siteContent,
  setSiteContent
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

  // Contact Messages State & Handlers
  const [contactMessages, setContactMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [messageStatusFilter, setMessageStatusFilter] = useState('All');
  const [expandedMessageId, setExpandedMessageId] = useState(null);

  // Email Reply Modal State & Handlers
  const [replyModalMsg, setReplyModalMsg] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyResult, setReplyResult] = useState(null);

  const openReplyModal = (msg) => {
    setReplyModalMsg(msg);
    setReplySubject(`Re: ${msg.subject || 'Your azPDF Inquiry'}`);
    setReplyBody(
      `Hi ${msg.name || 'Valued Customer'},\n\nThank you for reaching out to the azPDF support & sales team!\n\nRegarding your inquiry:\n"${msg.message || ''}"\n\nWe would be happy to assist you. \n\nBest regards,\nazPDF Support & Enterprise Team`
    );
    setReplyResult(null);
  };

  const handleSendEmailReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyModalMsg || !replyBody.trim()) return;

    setIsSendingReply(true);
    setReplyResult(null);

    try {
      const res = await fetch(`http://localhost:5000/api/admin/contact-messages/${replyModalMsg.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: replyModalMsg.email,
          subject: replySubject,
          replyText: replyBody,
          senderName: replyModalMsg.name
        })
      });

      const data = await res.json();

      if (data.success) {
        setReplyResult({
          success: true,
          message: data.message || `Email reply sent successfully to ${replyModalMsg.email}!`,
          previewUrl: data.previewUrl,
          deliveryNote: data.deliveryNote
        });
        setContactMessages(prev =>
          prev.map(m =>
            m.id === replyModalMsg.id
              ? { ...m, status: 'Replied', reply_text: replyBody.trim(), replied_at: data.repliedAt || new Date().toISOString() }
              : m
          )
        );
        addLog(`Sent official email reply to ${replyModalMsg.name} (${replyModalMsg.email}).`, 'info');
      } else {
        setReplyResult({
          success: false,
          message: data.message || 'Failed to dispatch email reply.'
        });
      }
    } catch (err) {
      setReplyResult({
        success: false,
        message: 'Could not connect to backend email server: ' + err.message
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const fetchContactMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/contact-messages');
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setContactMessages(data.messages);
        }
      }
    } catch (err) {
      console.warn('Could not fetch contact messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchContactMessages();
    const interval = setInterval(fetchContactMessages, 8000); // live polling every 8s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateMessageStatus = async (id, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/admin/contact-messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setContactMessages(prev =>
        prev.map(m => m.id === id ? { ...m, status: newStatus } : m)
      );
      addLog(`Updated message #${id} status to "${newStatus}".`, 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Delete this contact inquiry permanently?')) return;
    try {
      await fetch(`http://localhost:5000/api/admin/contact-messages/${id}`, {
        method: 'DELETE'
      });
      setContactMessages(prev => prev.filter(m => m.id !== id));
      addLog(`Deleted contact inquiry #${id}.`, 'warning');
    } catch (err) {
      console.error(err);
    }
  };

  const unreadMessagesCount = useMemo(() => {
    return contactMessages.filter(m => m.status === 'Unread').length;
  }, [contactMessages]);

  const filteredMessages = useMemo(() => {
    return contactMessages.filter(m => {
      const q = messageSearch.toLowerCase();
      const matchQuery = !q ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.company && m.company.toLowerCase().includes(q)) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        (m.message && m.message.toLowerCase().includes(q));
      const matchStatus = messageStatusFilter === 'All' || m.status === messageStatusFilter;
      return matchQuery && matchStatus;
    });
  }, [contactMessages, messageSearch, messageStatusFilter]);

  // Cleanup simulation animation state
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState('');

  // Local state for System settings inputs
  const [settingsForm, setSettingsForm] = useState({
    monthlyPremiumPrice: systemSettings?.monthlyPremiumPrice ?? 6.00,
    monthlyBusinessPrice: systemSettings?.monthlyBusinessPrice ?? 12.00,
    autoCleanupHours: systemSettings?.autoCleanupHours ?? 2,
    maxStoragePoolGb: systemSettings?.maxStoragePoolGb ?? 50
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (systemSettings) {
      setSettingsForm(prev => ({
        ...prev,
        ...systemSettings
      }));
    }
  }, [systemSettings]);

  // Local state for Home Page Content inputs
  const [contentForm, setContentForm] = useState({
    brandPrefix: siteContent?.brandPrefix || 'I',
    brandIcon: siteContent?.brandIcon || '❤️',
    brandName: siteContent?.brandName || 'PDF',
    heroTitle: siteContent?.heroTitle || 'Every tool you need to work with PDFs in one place',
    heroSubtitle: siteContent?.heroSubtitle || 'Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.',
    toolsTitle: siteContent?.toolsTitle || 'Most Popular PDF Tools',
    toolsSubtitle: siteContent?.toolsSubtitle || 'Fast, online and free tools for all your PDF requirements.',
    pricingBadge: siteContent?.pricingBadge || 'Simple & Transparent Pricing',
    pricingTitle: siteContent?.pricingTitle || 'Choose the Right Plan for Your PDF Needs',
    pricingSubtitle: siteContent?.pricingSubtitle || 'Work seamlessly with all PDF tools. Get unlimited processing, high-speed OCR, digital e-signatures, and batch file support.',
    freePlanTitle: siteContent?.freePlanTitle || 'Free',
    freePlanDesc: siteContent?.freePlanDesc || 'Essential PDF tools for quick tasks and light usage.',
    premiumPlanTitle: siteContent?.premiumPlanTitle || 'Premium',
    premiumPlanDesc: siteContent?.premiumPlanDesc || 'Complete access, unlimited processing, OCR speed, and zero ads.',
    businessPlanTitle: siteContent?.businessPlanTitle || 'Business / Team',
    businessPlanDesc: siteContent?.businessPlanDesc || 'Custom team management, dedicated support, and enterprise API access.',
    footerBrand: siteContent?.footerBrand || 'I ❤️ PDF',
    footerDesc: siteContent?.footerDesc || 'The all-in-one PDF solution to make working with documents fast, simple, and completely secure.',
    footerCopyright: siteContent?.footerCopyright || '© 2026 iLovePDF. All Rights Reserved.',
    footerColumns: siteContent?.footerColumns || [],
    footerButtons: siteContent?.footerButtons || [],
    socialLinks: siteContent?.socialLinks || { twitter: '', facebook: '', linkedin: '', instagram: '' },
    appStoreBadges: siteContent?.appStoreBadges || {
      enabled: true,
      title: 'Download azPDF Desktop & Mobile App',
      subtitle: 'Work with PDFs directly on Windows, Mac, Android and iOS devices.',
      googlePlay: { enabled: true, url: 'https://play.google.com/store/apps' },
      appStore: { enabled: true, url: 'https://apps.apple.com' },
      macAppStore: { enabled: true, url: 'https://apps.apple.com/macos' },
      microsoftStore: { enabled: true, url: 'https://apps.microsoft.com' }
    }
  });
  const [contentSaved, setContentSaved] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);

  useEffect(() => {
    if (siteContent) {
      setContentForm(prev => ({
        ...prev,
        ...siteContent,
        footerColumns: siteContent.footerColumns || prev.footerColumns,
        footerButtons: siteContent.footerButtons || prev.footerButtons,
        socialLinks: siteContent.socialLinks || prev.socialLinks,
        appStoreBadges: siteContent.appStoreBadges || prev.appStoreBadges
      }));
    }
  }, [siteContent]);

  const handleSaveContent = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setIsSavingContent(true);
    setContentSaved(false);
    try {
      if (setSiteContent) {
        await setSiteContent(contentForm);
      }
      setContentSaved(true);
      addLog(`Updated Home Page branding, text content, and footer links globally.`, 'success');
    } catch (err) {
      console.error('Failed to update home page content:', err);
    } finally {
      setIsSavingContent(false);
      setTimeout(() => setContentSaved(false), 4000);
    }
  };

  // Footer Link Column Handlers
  const handleAddFooterColumn = () => {
    setContentForm(prev => ({
      ...prev,
      footerColumns: [
        ...prev.footerColumns,
        { id: `col-${Date.now()}`, title: 'New Column', links: [{ label: 'New Link', url: '/' }] }
      ]
    }));
  };

  const handleDeleteFooterColumn = (colIdx) => {
    setContentForm(prev => ({
      ...prev,
      footerColumns: prev.footerColumns.filter((_, idx) => idx !== colIdx)
    }));
  };

  const handleColumnTitleChange = (colIdx, title) => {
    setContentForm(prev => {
      const updatedCols = [...prev.footerColumns];
      updatedCols[colIdx] = { ...updatedCols[colIdx], title };
      return { ...prev, footerColumns: updatedCols };
    });
  };

  const handleAddLinkToColumn = (colIdx) => {
    setContentForm(prev => {
      const updatedCols = [...prev.footerColumns];
      const col = updatedCols[colIdx];
      const newLinks = [...(col.links || []), { label: 'New Link', url: '/' }];
      updatedCols[colIdx] = { ...col, links: newLinks };
      return { ...prev, footerColumns: updatedCols };
    });
  };

  const handleAddPresetLinkToColumn = (colIdx, label, url) => {
    setContentForm(prev => {
      const updatedCols = [...prev.footerColumns];
      const col = updatedCols[colIdx];
      const newLinks = [...(col.links || []), { label, url }];
      updatedCols[colIdx] = { ...col, links: newLinks };
      return { ...prev, footerColumns: updatedCols };
    });
  };

  const handleLinkChange = (colIdx, linkIdx, field, value) => {
    setContentForm(prev => {
      const updatedCols = [...prev.footerColumns];
      const col = updatedCols[colIdx];
      const updatedLinks = [...(col.links || [])];
      updatedLinks[linkIdx] = { ...updatedLinks[linkIdx], [field]: value };
      updatedCols[colIdx] = { ...col, links: updatedLinks };
      return { ...prev, footerColumns: updatedCols };
    });
  };

  const handleDeleteLinkFromColumn = (colIdx, linkIdx) => {
    setContentForm(prev => {
      const updatedCols = [...prev.footerColumns];
      const col = updatedCols[colIdx];
      const updatedLinks = col.links.filter((_, idx) => idx !== linkIdx);
      updatedCols[colIdx] = { ...col, links: updatedLinks };
      return { ...prev, footerColumns: updatedCols };
    });
  };

  // Footer Bottom Button Handlers
  const handleAddFooterButton = () => {
    setContentForm(prev => ({
      ...prev,
      footerButtons: [...prev.footerButtons, { label: 'Button Item', url: '/' }]
    }));
  };

  const handleFooterButtonChange = (btnIdx, field, value) => {
    setContentForm(prev => {
      const updatedBtns = [...prev.footerButtons];
      updatedBtns[btnIdx] = { ...updatedBtns[btnIdx], [field]: value };
      return { ...prev, footerButtons: updatedBtns };
    });
  };

  const handleDeleteFooterButton = (btnIdx) => {
    setContentForm(prev => ({
      ...prev,
      footerButtons: prev.footerButtons.filter((_, idx) => idx !== btnIdx)
    }));
  };

  // Social Links Handler
  const handleSocialLinkChange = (key, value) => {
    setContentForm(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value }
    }));
  };

  // App Store Badges Handlers (Master & Individual Store Toggles/URLs)
  const handleAppStoreToggle = (field) => {
    setContentForm(prev => {
      const current = prev.appStoreBadges || {
        enabled: true,
        title: 'Download azPDF Desktop & Mobile App',
        subtitle: 'Work with PDFs directly on Windows, Mac, Android and iOS devices.',
        googlePlay: { enabled: true, url: 'https://play.google.com/store/apps' },
        appStore: { enabled: true, url: 'https://apps.apple.com' },
        macAppStore: { enabled: true, url: 'https://apps.apple.com/macos' },
        microsoftStore: { enabled: true, url: 'https://apps.microsoft.com' }
      };

      if (field === 'master') {
        return {
          ...prev,
          appStoreBadges: { ...current, enabled: !current.enabled }
        };
      }

      return {
        ...prev,
        appStoreBadges: {
          ...current,
          [field]: {
            ...current[field],
            enabled: !current[field]?.enabled
          }
        }
      };
    });
  };

  const handleAppStoreUrlChange = (field, url) => {
    setContentForm(prev => {
      const current = prev.appStoreBadges || {};
      return {
        ...prev,
        appStoreBadges: {
          ...current,
          [field]: {
            ...current[field],
            url
          }
        }
      };
    });
  };

  const handleAppStoreTextChange = (field, text) => {
    setContentForm(prev => {
      const current = prev.appStoreBadges || {};
      return {
        ...prev,
        appStoreBadges: {
          ...current,
          [field]: text
        }
      };
    });
  };

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

  const getPlanMeta = (plan = '') => {
    const p = String(plan || '').toUpperCase();
    if (p === 'BUSINESS') {
      return { color: '#2563eb', bg: '#eff6ff', icon: <Crown size={12} /> };
    }
    if (p === 'PREMIUM') {
      return { color: '#d97706', bg: '#fffbeb', icon: <Star size={12} /> };
    }
    return { color: '#6b7280', bg: '#f9fafb', icon: <User size={12} /> };
  };

  const planMeta = new Proxy({}, {
    get: (target, prop) => getPlanMeta(prop)
  });

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
              { id: 'messages', label: 'Contact Messages', icon: <Mail size={18} />, badge: unreadMessagesCount },
              { id: 'footer', label: 'Footer Manager', icon: <Layout size={18} /> },
              { id: 'content', label: 'Home Page Content', icon: <Edit size={18} /> },
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
                  justifyContent: 'space-between',
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
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {tab.icon} {tab.label}
                </span>
                {tab.badge > 0 && (
                  <span style={{
                    backgroundColor: activeTab === tab.id ? '#ffffff' : 'var(--primary-red)',
                    color: activeTab === tab.id ? 'var(--primary-red)' : '#ffffff',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 7px',
                    borderRadius: '10px'
                  }}>
                    {tab.badge}
                  </span>
                )}
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
                        <stop offset="0%" stopColor="var(--primary-red)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--primary-red)" stopOpacity="0.0" />
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

        {/* === TAB: CONTACT MESSAGES & INQUIRIES === */}
        {activeTab === 'messages' && (
          <div style={{ maxWidth: '1100px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(229, 36, 36, 0.1)', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={22} />
                  </div>
                  <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>Customer Inquiries & Messages</h1>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)', margin: 0 }}>
                  Real-time inquiries and enterprise sales leads submitted from the /contact page.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchContactMessages}
                disabled={isLoadingMessages}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-dark)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: isLoadingMessages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s'
                }}
              >
                <RefreshCw size={15} style={isLoadingMessages ? { animation: 'spin 1s linear infinite' } : {}} />
                Refresh Messages
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Inquiries</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dark)' }}>{contactMessages.length}</div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: unreadMessagesCount > 0 ? '#fef3c7' : 'var(--bg-light)', color: unreadMessagesCount > 0 ? '#d97706' : 'var(--text-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unread Inquiries</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: unreadMessagesCount > 0 ? '#d97706' : 'var(--text-dark)' }}>{unreadMessagesCount}</div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Replied / Handled</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dark)' }}>
                    {contactMessages.filter(m => m.status === 'Replied').length}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', boxShadow: 'var(--shadow-sm)' }}>
              {/* Search Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '8px 14px' }}>
                <Search size={16} color="var(--text-gray)" />
                <input
                  type="text"
                  value={messageSearch}
                  onChange={e => setMessageSearch(e.target.value)}
                  placeholder="Search by name, email, company, subject, or message..."
                  style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-dark)', fontSize: '13px', width: '100%' }}
                />
                {messageSearch && (
                  <button onClick={() => setMessageSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-gray)', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                )}
              </div>

              {/* Status Tabs */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'All', label: `All (${contactMessages.length})` },
                  { id: 'Unread', label: `Unread (${unreadMessagesCount})` },
                  { id: 'Read', label: `Read (${contactMessages.filter(m => m.status === 'Read').length})` },
                  { id: 'Replied', label: `Replied (${contactMessages.filter(m => m.status === 'Replied').length})` }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setMessageStatusFilter(filter.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      fontSize: '12px',
                      fontWeight: messageStatusFilter === filter.id ? '800' : '600',
                      backgroundColor: messageStatusFilter === filter.id ? 'var(--primary-red)' : 'var(--bg-light)',
                      color: messageStatusFilter === filter.id ? '#ffffff' : 'var(--text-gray)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Cards List */}
            {filteredMessages.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--bg-light)', color: 'var(--text-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Mail size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  No Inquiries Found
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)', maxWidth: '400px', margin: '0 auto' }}>
                  {messageSearch || messageStatusFilter !== 'All'
                    ? 'No messages match your search or filter criteria.'
                    : 'Customer messages submitted via the /contact page will appear here immediately in real time.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredMessages.map(msg => {
                  const isExpanded = expandedMessageId === msg.id;
                  const initials = (msg.name || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const isUnread = msg.status === 'Unread';

                  return (
                    <div
                      key={msg.id}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: isUnread ? '1.5px solid #f59e0b' : '1px solid var(--border-light)',
                        borderRadius: '16px',
                        padding: '20px 24px',
                        boxShadow: isUnread ? '0 4px 15px rgba(245, 158, 11, 0.12)' : 'var(--shadow-sm)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {/* Message Card Top Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                        {/* Sender info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: isUnread ? '#fef3c7' : 'var(--bg-light)',
                            color: isUnread ? '#d97706' : 'var(--primary-red)',
                            fontWeight: '800',
                            fontSize: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-light)',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                                {msg.name || 'Anonymous User'}
                              </h3>
                              {msg.company && (
                                <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--bg-light)', color: 'var(--text-gray)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Building size={11} /> {msg.company}
                                </span>
                              )}
                              {msg.team_size && (
                                <span style={{ fontSize: '11px', fontWeight: '600', backgroundColor: 'var(--bg-light)', color: 'var(--text-gray)', padding: '2px 8px', borderRadius: '6px' }}>
                                  👥 {msg.team_size}
                                </span>
                              )}
                            </div>

                            {/* Contact coordinates */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', flexWrap: 'wrap' }}>
                              <a
                                href={`mailto:${msg.email}`}
                                style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                              >
                                <Mail size={13} /> {msg.email}
                              </a>
                              {msg.phone && (
                                <a
                                  href={`tel:${msg.phone}`}
                                  style={{ fontSize: '13px', color: 'var(--text-gray)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Phone size={13} /> {msg.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status & Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '800',
                            backgroundColor: msg.status === 'Unread' ? '#fef3c7' : msg.status === 'Replied' ? '#eff6ff' : '#dcfce7',
                            color: msg.status === 'Unread' ? '#b45309' : msg.status === 'Replied' ? '#1d4ed8' : '#15803d'
                          }}>
                            {msg.status === 'Unread' && '● '}
                            {msg.status === 'Replied' && '💬 '}
                            {msg.status === 'Read' && '✓ '}
                            {msg.status}
                          </span>

                          <span style={{ fontSize: '12px', color: 'var(--text-gray)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {new Date(msg.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Subject Banner */}
                      <div style={{ backgroundColor: 'var(--bg-light)', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
                          Subject:
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>
                          {msg.subject || 'Direct Inquiry'}
                        </div>
                      </div>

                      {/* Message Content */}
                      <div style={{
                        fontSize: '14px',
                        color: 'var(--text-dark)',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        marginBottom: '16px',
                        maxHeight: isExpanded ? 'none' : '90px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        {msg.message}
                        {!isExpanded && msg.message && msg.message.length > 200 && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35px', background: 'linear-gradient(transparent, var(--bg-card))' }} />
                        )}
                      </div>

                      {msg.message && msg.message.length > 200 && (
                        <button
                          onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                          style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: 0, marginBottom: '14px', display: 'block' }}
                        >
                          {isExpanded ? 'Show less ▲' : 'Read full message ▼'}
                        </button>
                      )}

                      {/* Sent Reply Display if exists */}
                      {msg.reply_text && (
                        <div style={{
                          marginTop: '14px',
                          marginBottom: '16px',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle size={15} /> Sent Email Response
                            </span>
                            {msg.replied_at && (
                              <span style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>
                                Replied on {new Date(msg.replied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: '#14532d', whiteSpace: 'pre-wrap', lineHeight: '1.6', backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                            {msg.reply_text}
                          </div>
                        </div>
                      )}

                      {/* Actions Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '10px' }}>
                        {/* Status Toggles */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {msg.status !== 'Read' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateMessageStatus(msg.id, 'Read')}
                              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Check size={13} /> Mark as Read
                            </button>
                          )}
                          {msg.status !== 'Unread' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateMessageStatus(msg.id, 'Unread')}
                              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                            >
                              Mark as Unread
                            </button>
                          )}
                          {msg.status !== 'Replied' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateMessageStatus(msg.id, 'Replied')}
                              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Reply size={13} /> Mark as Replied
                            </button>
                          )}
                        </div>

                        {/* Reply & Delete */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => openReplyModal(msg)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--primary-red)',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 8px rgba(229, 36, 36, 0.25)',
                              transition: 'all 0.15s'
                            }}
                          >
                            <Send size={13} /> {msg.reply_text ? 'Send Another Reply' : 'Reply via Email'}
                          </button>

                          <a
                            href={`mailto:${msg.email}?subject=${encodeURIComponent('Re: ' + (msg.subject || 'Your azPDF Inquiry'))}&body=${encodeURIComponent(`Hi ${msg.name},\n\nThank you for reaching out to us!\n\nRegarding your message:\n"${msg.message}"\n\n`)}`}
                            title="Open in your external email app"
                            style={{
                              padding: '7px 11px',
                              borderRadius: '8px',
                              backgroundColor: 'var(--bg-light)',
                              color: 'var(--text-gray)',
                              border: '1px solid var(--border-light)',
                              fontSize: '11px',
                              fontWeight: '600',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <ExternalLink size={12} /> Mail App
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            style={{
                              padding: '7px 12px',
                              borderRadius: '8px',
                              backgroundColor: '#fee2e2',
                              color: '#ef4444',
                              border: 'none',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Delete this message"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* EMAIL REPLY MODAL (Direct Client Email Dispatch) */}
            {replyModalMsg && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(5px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 99999,
                  padding: '16px'
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget && !isSendingReply) {
                    setReplyModalMsg(null);
                  }
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '680px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--border-light)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '92vh'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div
                    style={{
                      padding: '18px 24px',
                      borderBottom: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-light)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(229, 36, 36, 0.12)', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Send size={18} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                          Reply via Email to Client
                        </h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-gray)', margin: '2px 0 0 0' }}>
                          Dispatch an official branded email response straight to the client's inbox
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyModalMsg(null)}
                      disabled={isSendingReply}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-gray)',
                        fontSize: '22px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Body / Form */}
                  <form onSubmit={handleSendEmailReply} style={{ padding: '22px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Recipient Details Pill */}
                    <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Recipient:
                        </span>{' '}
                        <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{replyModalMsg.name}</strong>{' '}
                        <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>&lt;{replyModalMsg.email}&gt;</span>
                      </div>
                      {replyModalMsg.company && (
                        <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--bg-card)', color: 'var(--text-gray)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                          🏢 {replyModalMsg.company}
                        </span>
                      )}
                    </div>

                    {/* Client's Original Message Preview */}
                    <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.02)', borderLeft: '3px solid var(--primary-red)', fontSize: '12px', color: 'var(--text-gray)' }}>
                      <strong style={{ color: 'var(--text-dark)' }}>Client's Original Message:</strong>
                      <div style={{ marginTop: '4px', fontStyle: 'italic', maxHeight: '55px', overflowY: 'auto', lineHeight: '1.5' }}>
                        "{replyModalMsg.message}"
                      </div>
                    </div>

                    {/* Subject Line */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '5px' }}>
                        Email Subject Line:
                      </label>
                      <input
                        type="text"
                        value={replySubject}
                        onChange={(e) => setReplySubject(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-light)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-dark)',
                          fontSize: '13px',
                          fontWeight: '600',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Quick Response Templates */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Quick One-Click Templates:
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setReplySubject(`Enterprise License & Volume Pricing - azPDF`);
                            setReplyBody(`Hi ${replyModalMsg.name},\n\nThank you for reaching out regarding azPDF Enterprise solutions!\n\nWe would be thrilled to support ${replyModalMsg.company || 'your organization'} with dedicated server capacity, unlimited team seats, priority SLA, and custom volume discounts.\n\nCould you let us know your estimated team size and processing requirements? I can also arrange a quick 15-minute product demonstration for you.\n\nBest regards,\nEnterprise Sales Team\nazPDF Technologies`);
                          }}
                          style={{ fontSize: '11px', fontWeight: '600', padding: '6px 12px', borderRadius: '7px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', cursor: 'pointer' }}
                        >
                          💼 Enterprise Inquiry
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setReplySubject(`Support Update: Regarding your azPDF Inquiry`);
                            setReplyBody(`Hi ${replyModalMsg.name},\n\nThank you for contacting azPDF Technical Support.\n\nWe have reviewed your inquiry regarding:\n"${replyModalMsg.message}"\n\nOur engineering team is actively investigating this. To help us resolve it quickly, could you reply with your browser version and the file format you are working with?\n\nBest regards,\nTechnical Support Team\nazPDF`);
                          }}
                          style={{ fontSize: '11px', fontWeight: '600', padding: '6px 12px', borderRadius: '7px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', cursor: 'pointer' }}
                        >
                          🛠️ Technical Support
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setReplySubject(`Re: ${replyModalMsg.subject || 'Your Inquiry'}`);
                            setReplyBody(`Hi ${replyModalMsg.name},\n\nThank you for contacting azPDF! We have received your inquiry and our team is reviewing it.\n\nPlease let us know if you need any additional assistance or have further questions in the meantime.\n\nBest regards,\nCustomer Success Team\nazPDF`);
                          }}
                          style={{ fontSize: '11px', fontWeight: '600', padding: '6px 12px', borderRadius: '7px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', cursor: 'pointer' }}
                        >
                          ✉️ General Thank You
                        </button>
                      </div>
                    </div>

                    {/* Reply Textarea */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '5px' }}>
                        Your Official Email Message:
                      </label>
                      <textarea
                        rows={7}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        required
                        placeholder="Write your email reply here..."
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-light)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-dark)',
                          fontSize: '13px',
                          lineHeight: '1.6',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Result / Notification Alert */}
                    {replyResult && (
                      <div
                        style={{
                          padding: '14px 18px',
                          borderRadius: '12px',
                          backgroundColor: replyResult.success ? '#f0fdf4' : '#fef2f2',
                          border: replyResult.success ? '1px solid #86efac' : '1px solid #fca5a5',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {replyResult.success ? (
                            <CheckCircle size={18} color="#16a34a" />
                          ) : (
                            <AlertTriangle size={18} color="#dc2626" />
                          )}
                          <span style={{ fontSize: '13px', fontWeight: '700', color: replyResult.success ? '#15803d' : '#b91c1c' }}>
                            {replyResult.message}
                          </span>
                        </div>
                        {replyResult.previewUrl && (
                          <div style={{ marginTop: '4px', fontSize: '12px' }}>
                            <a
                              href={replyResult.previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <ExternalLink size={13} /> View Live Dispatched Email (Ethereal Mailbox Preview)
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Modal Footer / Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '6px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                      <button
                        type="button"
                        onClick={() => setReplyModalMsg(null)}
                        disabled={isSendingReply}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-light)',
                          backgroundColor: 'var(--bg-light)',
                          color: 'var(--text-dark)',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {replyResult?.success ? 'Done' : 'Cancel'}
                      </button>

                      <button
                        type="submit"
                        disabled={isSendingReply || !replyBody.trim()}
                        style={{
                          padding: '10px 22px',
                          borderRadius: '10px',
                          backgroundColor: isSendingReply ? '#94a3b8' : 'var(--primary-red)',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: '700',
                          border: 'none',
                          cursor: isSendingReply ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(229, 36, 36, 0.3)'
                        }}
                      >
                        <Send size={15} style={isSendingReply ? { animation: 'spin 1s linear infinite' } : {}} />
                        {isSendingReply ? 'Sending Email...' : 'Send Email Reply Now'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === TAB: DEDICATED FOOTER MANAGER (FULL CRUD) === */}
        {activeTab === 'footer' && (
          <div style={{ maxWidth: '1050px' }}>
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(229, 36, 36, 0.1)', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layout size={22} />
                  </div>
                  <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>Footer Manager & Customizer</h1>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)', margin: 0 }}>Full CRUD control over navigation columns, links, official store badges, social media profiles, and copyright.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveContent}
                disabled={isSavingContent}
                style={{
                  padding: '12px 26px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'var(--primary-red)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: isSavingContent ? 'not-allowed' : 'pointer',
                  opacity: isSavingContent ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(229, 36, 36, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSavingContent ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving Footer...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Footer Changes
                  </>
                )}
              </button>
            </div>

            {contentSaved && (
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '14px 18px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#059669" />
                Footer navigation links, official badges, and branding updated successfully!
              </div>
            )}

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layout size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Columns</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)' }}>{contentForm.footerColumns?.length || 0}</div>
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LinkIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Total Links</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)' }}>
                    {contentForm.footerColumns?.reduce((acc, c) => acc + (c.links?.length || 0), 0) || 0}
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', textTransform: 'uppercase' }}>App Badges</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)' }}>
                    {contentForm.appStoreBadges?.enabled !== false ? 'Active (Play + Apple)' : 'Hidden'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* 1. Footer Navigation Columns & Links (FULL CRUD) */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📋 Footer Navigation Columns (CRUD)
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-gray)', margin: '2px 0 0 0' }}>
                      Create, edit, reorder or delete entire columns and links. Click any preset button to quickly add real working links.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFooterColumn}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--primary-red)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(229, 36, 36, 0.2)'
                    }}
                  >
                    <Plus size={16} /> + Add New Column
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {contentForm.footerColumns.map((col, colIdx) => (
                    <div
                      key={col.id || colIdx}
                      style={{
                        backgroundColor: 'var(--bg-light)',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: '14px',
                        padding: '18px'
                      }}
                    >
                      {/* Column Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-gray)', minWidth: '70px' }}>
                            COLUMN {colIdx + 1}:
                          </span>
                          <input
                            type="text"
                            value={col.title}
                            onChange={e => handleColumnTitleChange(colIdx, e.target.value)}
                            placeholder="Column Heading (e.g. PRODUCT)"
                            style={{
                              flex: 1,
                              maxWidth: '320px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1.5px solid var(--border-light)',
                              backgroundColor: 'var(--bg-card)',
                              color: 'var(--text-dark)',
                              fontSize: '14px',
                              fontWeight: '800',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete column "${col.title}" and all its links?`)) {
                              handleDeleteFooterColumn(colIdx);
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#fee2e2',
                            color: '#ef4444',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Delete this entire column"
                        >
                          <Trash2 size={14} /> Delete Column
                        </button>
                      </div>

                      {/* Quick Presets for this Column */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '14px', padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)' }}>Quick Add:</span>
                        {[
                          { label: 'Home', url: '/' },
                          { label: 'Features', url: '/#features' },
                          { label: 'Pricing', url: '/#pricing' },
                          { label: 'Tools', url: '/#tools' },
                          { label: 'FAQ', url: '/#faq' },
                          { label: 'About us', url: '/#about' },
                          { label: 'Terms & conditions', url: '/terms' },
                          { label: 'Privacy policy', url: '/privacy' },
                          { label: 'Contact us', url: '/contact' },
                          { label: 'Help & Support', url: '/help' },
                        ].map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleAddPresetLinkToColumn(colIdx, preset.label, preset.url)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: 'var(--bg-light)',
                              border: '1px solid var(--border-light)',
                              color: 'var(--text-dark)',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            title={`Add "${preset.label}" (${preset.url}) to this column`}
                          >
                            + {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Links List for this column */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {col.links && col.links.map((link, linkIdx) => (
                          <div
                            key={linkIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              backgroundColor: 'var(--bg-card)',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-light)'
                            }}
                          >
                            <span style={{ fontSize: '12px', color: 'var(--text-gray)', fontWeight: '700', minWidth: '22px' }}>
                              #{linkIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={link.label}
                              onChange={e => handleLinkChange(colIdx, linkIdx, 'label', e.target.value)}
                              placeholder="Link Text (e.g. Home)"
                              style={{
                                width: '38%',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                backgroundColor: 'var(--bg-light)',
                                color: 'var(--text-dark)',
                                fontSize: '13px'
                              }}
                            />
                            <input
                              type="text"
                              value={link.url}
                              onChange={e => handleLinkChange(colIdx, linkIdx, 'url', e.target.value)}
                              placeholder="Target URL / Path (e.g. /#features or /terms)"
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-light)',
                                backgroundColor: 'var(--bg-light)',
                                color: 'var(--text-dark)',
                                fontSize: '13px'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteLinkFromColumn(colIdx, linkIdx)}
                              style={{
                                color: '#ef4444',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px'
                              }}
                              title="Delete Link"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddLinkToColumn(colIdx)}
                          style={{
                            marginTop: '6px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'transparent',
                            border: '1.5px dashed var(--border-light)',
                            color: 'var(--text-gray)',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Plus size={14} /> Add Custom Link to {col.title || 'Column'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Official App Store Badges (Google Play & App Store ONLY) */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(229,36,36,0.1)', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                        Official Mobile App Store Badges
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-gray)', margin: '2px 0 0 0' }}>
                        Manage Google Play and Apple App Store download badges in the footer (Mac and Microsoft buttons removed).
                      </p>
                    </div>
                  </div>

                  {/* Master Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: contentForm.appStoreBadges?.enabled !== false ? '#059669' : 'var(--text-gray)' }}>
                      {contentForm.appStoreBadges?.enabled !== false ? '● Visible in Footer' : '○ Badges Hidden'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAppStoreToggle('master')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '800',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: contentForm.appStoreBadges?.enabled !== false ? '#d1fae5' : '#f3f4f6',
                        color: contentForm.appStoreBadges?.enabled !== false ? '#065f46' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {contentForm.appStoreBadges?.enabled !== false ? (
                        <>
                          <Eye size={14} /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} /> Hidden
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2 Badges: Google Play and Apple App Store */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {/* Google Play */}
                  <div style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>▶️</span>
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text-dark)', display: 'block' }}>Google Play</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>Android Mobile Application</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAppStoreToggle('googlePlay')}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: '800',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: contentForm.appStoreBadges?.googlePlay?.enabled !== false ? '#d1fae5' : '#fee2e2',
                          color: contentForm.appStoreBadges?.googlePlay?.enabled !== false ? '#065f46' : '#991b1b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {contentForm.appStoreBadges?.googlePlay?.enabled !== false ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '4px' }}>Google Play Store URL</label>
                    <input
                      type="text"
                      value={contentForm.appStoreBadges?.googlePlay?.url || ''}
                      onChange={e => handleAppStoreUrlChange('googlePlay', e.target.value)}
                      placeholder="https://play.google.com/store/apps/..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '12px' }}
                    />
                  </div>

                  {/* Apple App Store */}
                  <div style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🍎</span>
                        <div>
                          <strong style={{ fontSize: '14px', color: 'var(--text-dark)', display: 'block' }}>Apple App Store</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-gray)' }}>iOS iPhone & iPad Application</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAppStoreToggle('appStore')}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: '800',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: contentForm.appStoreBadges?.appStore?.enabled !== false ? '#d1fae5' : '#fee2e2',
                          color: contentForm.appStoreBadges?.appStore?.enabled !== false ? '#065f46' : '#991b1b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {contentForm.appStoreBadges?.appStore?.enabled !== false ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '4px' }}>Apple App Store URL</label>
                    <input
                      type="text"
                      value={contentForm.appStoreBadges?.appStore?.url || ''}
                      onChange={e => handleAppStoreUrlChange('appStore', e.target.value)}
                      placeholder="https://apps.apple.com/app/..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Footer Social Profiles (6 Networks) */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🌐 Social Media Profiles (Footer Icons)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginBottom: '16px' }}>
                  Enter external profile URLs for the 6 social icons shown in the footer bottom bar.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {[
                    { key: 'twitter', label: 'Twitter / X URL', icon: '𝕏', ph: 'https://twitter.com/yourhandle' },
                    { key: 'facebook', label: 'Facebook URL', icon: '📘', ph: 'https://facebook.com/yourpage' },
                    { key: 'linkedin', label: 'LinkedIn URL', icon: '💼', ph: 'https://linkedin.com/company/yourcompany' },
                    { key: 'instagram', label: 'Instagram URL', icon: '📸', ph: 'https://instagram.com/yourprofile' },
                    { key: 'tiktok', label: 'TikTok URL', icon: '🎵', ph: 'https://tiktok.com/@yourchannel' },
                    { key: 'reddit', label: 'Reddit URL', icon: '👾', ph: 'https://reddit.com/r/yourcommunity' },
                  ].map(net => (
                    <div key={net.key}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>
                        <span>{net.icon}</span> {net.label}
                      </label>
                      <input
                        type="text"
                        value={contentForm.socialLinks[net.key] || ''}
                        onChange={e => handleSocialLinkChange(net.key, e.target.value)}
                        placeholder={net.ph}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '13px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Footer Branding & Copyright */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚖️ Footer Branding & Copyright Text
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Footer Brand Title</label>
                    <input
                      type="text"
                      value={contentForm.footerBrand}
                      onChange={e => setContentForm(p => ({ ...p, footerBrand: e.target.value }))}
                      placeholder="Footer Brand (e.g. I ❤️ PDF)"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Footer Copyright Text</label>
                    <input
                      type="text"
                      value={contentForm.footerCopyright}
                      onChange={e => setContentForm(p => ({ ...p, footerCopyright: e.target.value }))}
                      placeholder="Copyright Text (e.g. © 2026 iLovePDF. All Rights Reserved.)"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '14px' }}
                    />
                  </div>
                </div>
              </div>

              {/* 5. Live Footer Preview */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    👁️ Live Real-Time Footer Preview
                  </h3>
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    Live Preview
                  </span>
                </div>

                {/* Dark Preview Container */}
                <div style={{ backgroundColor: '#24252e', borderRadius: '14px', padding: '32px 28px 20px', color: '#ffffff', overflowX: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap', marginBottom: '28px' }}>
                    {/* Columns Preview */}
                    <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap', flex: 1 }}>
                      {contentForm.footerColumns.map((col, idx) => (
                        <div key={idx} style={{ minWidth: '110px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                            {col.title || 'COLUMN'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {col.links && col.links.map((link, lIdx) => (
                              <div key={lIdx} style={{ fontSize: '12px', color: '#cbd5e1' }}>
                                {link.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Store Badges Preview */}
                    {contentForm.appStoreBadges?.enabled !== false && (
                      <div>
                        <StoreBadges config={contentForm.appStoreBadges} layout="vertical" isPreview={true} />
                      </div>
                    )}
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.12)', margin: '20px 0 16px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: '#ffffff' }}>
                      <Globe size={14} /> English ⌵
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ display: 'flex', gap: '12px', color: '#cbd5e1', fontSize: '13px' }}>
                        <span>𝕏</span>
                        <span>f</span>
                        <span>in</span>
                        <span>📸</span>
                        <span>🎵</span>
                        <span>👾</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {contentForm.footerCopyright}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Save Changes Bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', marginBottom: '40px' }}>
                <button
                  type="button"
                  onClick={handleSaveContent}
                  disabled={isSavingContent}
                  style={{
                    padding: '14px 36px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'var(--primary-red)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '15px',
                    cursor: isSavingContent ? 'not-allowed' : 'pointer',
                    opacity: isSavingContent ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 16px rgba(229, 36, 36, 0.3)'
                  }}
                >
                  {isSavingContent ? (
                    <>
                      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving Footer Changes...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Save All Footer Changes
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* === TAB: HOME PAGE CONTENT MANAGER === */}
        {activeTab === 'content' && (
          <div style={{ maxWidth: '850px' }}>
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '6px' }}>Home Page & Brand Customizer</h1>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>Manage and edit all logo, titles, headings, descriptions, pricing text, and footer elements across the entire home page.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveContent}
                disabled={isSavingContent}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'var(--primary-red)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: isSavingContent ? 'not-allowed' : 'pointer',
                  opacity: isSavingContent ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(229, 36, 36, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSavingContent ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save All Changes
                  </>
                )}
              </button>
            </div>

            {contentSaved && (
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '14px 18px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} color="#059669" />
                Home Page logo, titles, headings, and text updated successfully!
              </div>
            )}

            <form onSubmit={handleSaveContent} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* 1. Header & Logo Branding */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎨 Site Logo & Header Brand
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Brand Prefix Text</label>
                    <input
                      type="text"
                      value={contentForm.brandPrefix}
                      onChange={e => setContentForm(p => ({ ...p, brandPrefix: e.target.value }))}
                      placeholder="e.g. I"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Logo Heart / Icon</label>
                    <input
                      type="text"
                      value={contentForm.brandIcon}
                      onChange={e => setContentForm(p => ({ ...p, brandIcon: e.target.value }))}
                      placeholder="e.g. ❤️"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Brand Suffix Text</label>
                    <input
                      type="text"
                      value={contentForm.brandName}
                      onChange={e => setContentForm(p => ({ ...p, brandName: e.target.value }))}
                      placeholder="e.g. PDF"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-gray)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Live Preview:</span>
                  <span style={{ fontWeight: '900', color: 'var(--text-dark)', backgroundColor: 'var(--bg-light)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    {contentForm.brandPrefix} {contentForm.brandIcon} {contentForm.brandName}
                  </span>
                </div>
              </div>

              {/* 2. Hero Section Content */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🚀 Main Hero Banner
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Hero Main Title Heading</label>
                    <input
                      type="text"
                      value={contentForm.heroTitle}
                      onChange={e => setContentForm(p => ({ ...p, heroTitle: e.target.value }))}
                      placeholder="Hero Title"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Hero Subtitle / Description Paragraph</label>
                    <textarea
                      rows={3}
                      value={contentForm.heroSubtitle}
                      onChange={e => setContentForm(p => ({ ...p, heroSubtitle: e.target.value }))}
                      placeholder="Hero Subtitle"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Tools Section Content */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🛠️ PDF Tools Section Headings
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Tools Section Heading</label>
                    <input
                      type="text"
                      value={contentForm.toolsTitle}
                      onChange={e => setContentForm(p => ({ ...p, toolsTitle: e.target.value }))}
                      placeholder="Tools Section Heading"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Tools Section Subtitle</label>
                    <input
                      type="text"
                      value={contentForm.toolsSubtitle}
                      onChange={e => setContentForm(p => ({ ...p, toolsSubtitle: e.target.value }))}
                      placeholder="Tools Section Subtitle"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Pricing Section Content */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💳 Pricing Section & Plan Text
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Pricing Category Badge</label>
                      <input
                        type="text"
                        value={contentForm.pricingBadge}
                        onChange={e => setContentForm(p => ({ ...p, pricingBadge: e.target.value }))}
                        placeholder="Pricing Badge"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Pricing Main Heading</label>
                      <input
                        type="text"
                        value={contentForm.pricingTitle}
                        onChange={e => setContentForm(p => ({ ...p, pricingTitle: e.target.value }))}
                        placeholder="Pricing Title"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Pricing Subtitle / Description</label>
                    <input
                      type="text"
                      value={contentForm.pricingSubtitle}
                      onChange={e => setContentForm(p => ({ ...p, pricingSubtitle: e.target.value }))}
                      placeholder="Pricing Subtitle"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px dashed var(--border-light)', margin: '4px 0' }} />

                  {/* Plan Cards Headings */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Free Plan Title</label>
                      <input
                        type="text"
                        value={contentForm.freePlanTitle}
                        onChange={e => setContentForm(p => ({ ...p, freePlanTitle: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                      />
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '4px' }}>Free Plan Description</label>
                      <input
                        type="text"
                        value={contentForm.freePlanDesc}
                        onChange={e => setContentForm(p => ({ ...p, freePlanDesc: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Premium Plan Title</label>
                      <input
                        type="text"
                        value={contentForm.premiumPlanTitle}
                        onChange={e => setContentForm(p => ({ ...p, premiumPlanTitle: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                      />
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '4px' }}>Premium Plan Description</label>
                      <input
                        type="text"
                        value={contentForm.premiumPlanDesc}
                        onChange={e => setContentForm(p => ({ ...p, premiumPlanDesc: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Business Plan Title</label>
                      <input
                        type="text"
                        value={contentForm.businessPlanTitle}
                        onChange={e => setContentForm(p => ({ ...p, businessPlanTitle: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                      />
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '4px' }}>Business Plan Description</label>
                      <input
                        type="text"
                        value={contentForm.businessPlanDesc}
                        onChange={e => setContentForm(p => ({ ...p, businessPlanDesc: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Footer Section Content & Dynamic Links */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🌐 Footer Branding, Links & Buttons
                </h3>

                {/* Footer Brand & Description */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Footer Brand Title</label>
                    <input
                      type="text"
                      value={contentForm.footerBrand}
                      onChange={e => setContentForm(p => ({ ...p, footerBrand: e.target.value }))}
                      placeholder="Footer Brand"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Footer Copyright Text</label>
                    <input
                      type="text"
                      value={contentForm.footerCopyright}
                      onChange={e => setContentForm(p => ({ ...p, footerCopyright: e.target.value }))}
                      placeholder="Copyright Text"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed var(--border-light)', margin: '20px 0' }} />

                {/* Footer Link Columns Manager */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>Footer Link Columns</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-gray)', margin: '2px 0 0 0' }}>Add, edit, or remove navigation columns and links displayed in the footer grid.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFooterColumn}
                      style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', color: 'var(--text-dark)', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={14} /> Add New Column
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {contentForm.footerColumns.map((col, colIdx) => (
                      <div key={col.id || colIdx} style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                          <input
                            type="text"
                            value={col.title}
                            onChange={e => handleColumnTitleChange(colIdx, e.target.value)}
                            placeholder="Column Title"
                            style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px', fontWeight: '700' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteFooterColumn(colIdx)}
                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            title="Delete Column"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Links List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {col.links && col.links.map((link, linkIdx) => (
                            <div key={linkIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={link.label}
                                onChange={e => handleLinkChange(colIdx, linkIdx, 'label', e.target.value)}
                                placeholder="Link Name"
                                style={{ width: '45%', padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '12px' }}
                              />
                              <input
                                type="text"
                                value={link.url}
                                onChange={e => handleLinkChange(colIdx, linkIdx, 'url', e.target.value)}
                                placeholder="URL / Path"
                                style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '12px' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteLinkFromColumn(colIdx, linkIdx)}
                                style={{ color: 'var(--text-gray)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                                title="Remove Link"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddLinkToColumn(colIdx)}
                            style={{ marginTop: '4px', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'transparent', border: '1px dashed var(--border-light)', color: 'var(--text-gray)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' }}
                          >
                            + Add Link to {col.title || 'Column'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed var(--border-light)', margin: '20px 0' }} />

                {/* Footer Bottom Quick Buttons Manager */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>Footer Bottom Quick Links / Buttons</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-gray)', margin: '2px 0 0 0' }}>Inline links shown next to the copyright text (e.g., Terms, Privacy, Help).</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFooterButton}
                      style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', color: 'var(--text-dark)', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={14} /> Add Quick Button
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                    {contentForm.footerButtons.map((btn, btnIdx) => (
                      <div key={btnIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-light)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <input
                          type="text"
                          value={btn.label}
                          onChange={e => handleFooterButtonChange(btnIdx, 'label', e.target.value)}
                          placeholder="Button Label"
                          style={{ width: '40%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '12px' }}
                        />
                        <input
                          type="text"
                          value={btn.url}
                          onChange={e => handleFooterButtonChange(btnIdx, 'url', e.target.value)}
                          placeholder="Path (e.g. /terms)"
                          style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '12px' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteFooterButton(btnIdx)}
                          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed var(--border-light)', margin: '20px 0' }} />

                {/* Social Links URLs */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '12px' }}>Social Media Links</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Twitter / X URL</label>
                      <input
                        type="text"
                        value={contentForm.socialLinks.twitter || ''}
                        onChange={e => handleSocialLinkChange('twitter', e.target.value)}
                        placeholder="https://twitter.com/yourhandle"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Facebook URL</label>
                      <input
                        type="text"
                        value={contentForm.socialLinks.facebook || ''}
                        onChange={e => handleSocialLinkChange('facebook', e.target.value)}
                        placeholder="https://facebook.com/yourpage"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>LinkedIn URL</label>
                      <input
                        type="text"
                        value={contentForm.socialLinks.linkedin || ''}
                        onChange={e => handleSocialLinkChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/company/yourcompany"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Instagram URL</label>
                      <input
                        type="text"
                        value={contentForm.socialLinks.instagram || ''}
                        onChange={e => handleSocialLinkChange('instagram', e.target.value)}
                        placeholder="https://instagram.com/yourprofile"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* 6. App Store & Mobile Badges Manager (Image/Store Icons matching screenshot) */}
              <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(229,36,36,0.1)', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                        App Store & Mobile Badges Manager
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-gray)', margin: '2px 0 0 0' }}>
                        Manage Google Play, Apple App Store, Mac App Store, and Microsoft Store download badges displayed in the footer.
                      </p>
                    </div>
                  </div>

                  {/* Master Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: contentForm.appStoreBadges?.enabled !== false ? '#059669' : 'var(--text-gray)' }}>
                      {contentForm.appStoreBadges?.enabled !== false ? '● Visible on Site' : '○ Section Hidden'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAppStoreToggle('master')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '800',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: contentForm.appStoreBadges?.enabled !== false ? '#d1fae5' : '#f3f4f6',
                        color: contentForm.appStoreBadges?.enabled !== false ? '#065f46' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {contentForm.appStoreBadges?.enabled !== false ? (
                        <>
                          <Eye size={14} /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} /> Hidden
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Section Title & Subtitle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Section Heading Title</label>
                    <input
                      type="text"
                      value={contentForm.appStoreBadges?.title || ''}
                      onChange={e => handleAppStoreTextChange('title', e.target.value)}
                      placeholder="e.g. Download azPDF Desktop & Mobile App"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '4px' }}>Section Subtitle</label>
                    <input
                      type="text"
                      value={contentForm.appStoreBadges?.subtitle || ''}
                      onChange={e => handleAppStoreTextChange('subtitle', e.target.value)}
                      placeholder="e.g. Work with PDFs directly on Windows, Mac, Android and iOS devices."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px dashed var(--border-light)', margin: '16px 0 20px 0' }} />

                {/* 4 App Store Badges Management Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  
                  {/* Google Play */}
                  <div style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>▶️</span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>Google Play</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAppStoreToggle('googlePlay')}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: '800',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: contentForm.appStoreBadges?.googlePlay?.enabled !== false ? '#d1fae5' : '#fee2e2',
                          color: contentForm.appStoreBadges?.googlePlay?.enabled !== false ? '#065f46' : '#991b1b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {contentForm.appStoreBadges?.googlePlay?.enabled !== false ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '4px' }}>Google Play Store URL</label>
                    <input
                      type="text"
                      value={contentForm.appStoreBadges?.googlePlay?.url || ''}
                      onChange={e => handleAppStoreUrlChange('googlePlay', e.target.value)}
                      placeholder="https://play.google.com/store/apps/..."
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '12px' }}
                    />
                  </div>

                  {/* Apple App Store */}
                  <div style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🍎</span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>App Store (iOS)</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAppStoreToggle('appStore')}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '11px',
                          fontWeight: '800',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: contentForm.appStoreBadges?.appStore?.enabled !== false ? '#d1fae5' : '#fee2e2',
                          color: contentForm.appStoreBadges?.appStore?.enabled !== false ? '#065f46' : '#991b1b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {contentForm.appStoreBadges?.appStore?.enabled !== false ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-gray)', marginBottom: '4px' }}>Apple App Store URL</label>
                    <input
                      type="text"
                      value={contentForm.appStoreBadges?.appStore?.url || ''}
                      onChange={e => handleAppStoreUrlChange('appStore', e.target.value)}
                      placeholder="https://apps.apple.com/app/..."
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '12px' }}
                    />
                  </div>

                </div>

                {/* Live Preview Card */}
                <div style={{ backgroundColor: '#0f172a', borderRadius: '14px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.8px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>👁️ Real Footer Badges Live Preview:</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '15px' }}>
                        {contentForm.appStoreBadges?.title || 'Download azPDF Desktop & Mobile App'}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                        {contentForm.appStoreBadges?.subtitle || 'Work with PDFs directly on Windows, Mac, Android and iOS devices.'}
                      </div>
                    </div>
                    <StoreBadges config={contentForm.appStoreBadges} isPreview={true} />
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={isSavingContent}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'var(--primary-red)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '15px',
                    cursor: isSavingContent ? 'not-allowed' : 'pointer',
                    opacity: isSavingContent ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 20px rgba(229, 36, 36, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSavingContent ? (
                    <>
                      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Updating Content...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Save Home Page Changes
                    </>
                  )}
                </button>
              </div>

            </form>
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
