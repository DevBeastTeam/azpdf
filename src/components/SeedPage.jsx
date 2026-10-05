import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Users, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  LayoutDashboard,
  Cpu
} from 'lucide-react';
import { useAppContext } from '../App';

export default function SeedPage({ onSeedComplete }) {
  const navigate = useNavigate();
  const context = useAppContext();
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSeed = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setResult(json);
        // Update AppContext if present
        if (context?.setUsersData && json.data?.usersData) {
          context.setUsersData(json.data.usersData);
        }
        if (context?.setRecentFiles && json.data?.recentFiles) {
          context.setRecentFiles(json.data.recentFiles);
        }
        if (context?.setConversionStats && json.data?.conversionStats) {
          context.setConversionStats(json.data.conversionStats);
        }
        if (typeof onSeedComplete === 'function') {
          onSeedComplete(json);
        }
      } else {
        setError(json.error || 'Failed to seed demo data');
      }
    } catch (e) {
      setError(e.message || 'Network error while seeding demo data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: 'var(--bg-light)',
      padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '960px', width: '100%' }}>
        {/* Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-light)', 
              backgroundColor: 'var(--bg-card)', 
              color: 'var(--text-gray)', 
              fontWeight: '600', 
              fontSize: '14px', 
              cursor: 'pointer' 
            }}
          >
            <ArrowLeft size={16} /> Home
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate('/admin')} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-light)', 
                backgroundColor: 'var(--bg-card)', 
                color: 'var(--text-dark)', 
                fontWeight: '600', 
                fontSize: '14px', 
                cursor: 'pointer' 
              }}
            >
              <LayoutDashboard size={16} color="var(--primary-red)" /> Admin Dashboard
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-light)', 
          borderRadius: '24px', 
          padding: 'clamp(24px, 5vw, 44px)', 
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)'
            }}>
              <Database size={28} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                  Database Seed Engine
                </h1>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '700', 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                  color: '#3b82f6',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Sparkles size={13} /> Production Ready
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--text-gray)' }}>
                Populate realistic demo users, diverse registration day spreads, recent activity files, and PDF conversion charts.
              </p>
            </div>
          </div>

          {/* Quick Specs Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '16px', 
            margin: '28px 0' 
          }}>
            <div style={{ 
              padding: '16px', 
              borderRadius: '16px', 
              backgroundColor: 'var(--bg-light)', 
              border: '1px solid var(--border-light)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Users size={18} color="#3b82f6" />
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>10 Diverse Users</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-gray)', lineHeight: '1.5' }}>
                Spread across days (2 today, 2 yesterday, 3 on day -2, 0 on day -3, 2 on day -4, 1 on day -5) showing registration fluctuations.
              </p>
            </div>

            <div style={{ 
              padding: '16px', 
              borderRadius: '16px', 
              backgroundColor: 'var(--bg-light)', 
              border: '1px solid var(--border-light)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <FileText size={18} color="#ef4444" />
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>12 Activity Files</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-gray)', lineHeight: '1.5' }}>
                Covers Compress, Word to PDF, Protect, Sign, Split, Merge, OCR, Excel to PDF with sizes, dates and pages.
              </p>
            </div>

            <div style={{ 
              padding: '16px', 
              borderRadius: '16px', 
              backgroundColor: 'var(--bg-light)', 
              border: '1px solid var(--border-light)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <BarChart3 size={18} color="#10b981" />
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Dynamic Charts</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-gray)', lineHeight: '1.5' }}>
                Feeds both the Daily User Registrations Chart (blue) and Daily PDF Conversions Chart (red) with 11 days of data.
              </p>
            </div>
          </div>

          {/* Action Button & Status */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '16px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-light)'
          }}>
            <button
              onClick={handleSeed}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                background: loading 
                  ? 'var(--text-gray)' 
                  : 'linear-gradient(135deg, var(--primary-red) 0%, #b91c1c 100%)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 16px rgba(220, 38, 38, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              {loading ? 'Seeding Demo Data...' : (result ? 'Re-Seed Demo Data' : 'Seed Platform Data Now')}
            </button>

            <span style={{ fontSize: '13px', color: 'var(--text-gray)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#16a34a" /> Syncs to SQLite (<code>database.db</code>) &amp; <code>db.json</code>
            </span>
          </div>

          {/* Success Banner */}
          {result && (
            <div style={{ 
              marginTop: '24px', 
              padding: '20px', 
              borderRadius: '16px', 
              backgroundColor: 'rgba(22, 163, 74, 0.08)', 
              border: '1px solid rgba(22, 163, 74, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={24} color="#16a34a" />
                <span style={{ fontWeight: '800', fontSize: '16px', color: '#16a34a' }}>
                  {result.message || 'Demo data successfully seeded!'}
                </span>
              </div>

              {/* Stats pills */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  fontSize: '13px', 
                  fontWeight: '700', 
                  color: 'var(--text-dark)', 
                  border: '1px solid var(--border-light)' 
                }}>
                  👥 Users: <strong>{result.usersCount || 10}</strong>
                </span>
                <span style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  fontSize: '13px', 
                  fontWeight: '700', 
                  color: 'var(--text-dark)', 
                  border: '1px solid var(--border-light)' 
                }}>
                  📄 Files: <strong>{result.filesCount || 12}</strong>
                </span>
                <span style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  fontSize: '13px', 
                  fontWeight: '700', 
                  color: 'var(--text-dark)', 
                  border: '1px solid var(--border-light)' 
                }}>
                  📈 Conversions: <strong>{result.totalConversions || 163}</strong>
                </span>
              </div>

              {/* Navigation CTA */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/admin')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  View in Admin Dashboard <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-dark)',
                    border: '1px solid var(--border-light)',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  View in User Dashboard
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              borderRadius: '12px', 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Error: {error}
            </div>
          )}
        </div>

        {/* Demo Users Preview */}
        {result?.data?.usersData && (
          <div style={{ 
            marginTop: '32px', 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-light)', 
            borderRadius: '24px', 
            padding: '28px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', margin: '0 0 16px 0' }}>
              Seeded Users Sample ({result.data.usersData.length})
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
              gap: '14px' 
            }}>
              {result.data.usersData.map((u) => (
                <div 
                  key={u.id}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-light)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                    {u.avatar || u.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.email}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: u.plan === 'Business' ? 'rgba(168, 85, 247, 0.15)' : u.plan === 'Premium' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 114, 128, 0.15)', color: u.plan === 'Business' ? '#9333ea' : u.plan === 'Premium' ? '#ef4444' : 'var(--text-gray)' }}>
                        {u.plan}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-gray)' }}>
                        Joined: {u.joinDate}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
