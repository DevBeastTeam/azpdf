import React from 'react';
import { ArrowLeft, Users, Target, Zap, Shield, Globe, Award, Sparkles, Heart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { defaultAboutUs } from '../data/legalPagesData';

const valueIcons = [
  <Shield key="1" size={22} color="var(--primary-red)" />,
  <Zap key="2" size={22} color="var(--primary-red)" />,
  <Globe key="3" size={22} color="var(--primary-red)" />,
  <Sparkles key="4" size={22} color="var(--primary-red)" />
];

export default function AboutUs() {
  const navigate = useNavigate();
  const onBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  const context = useAppContext();
  const siteContent = context?.siteContent;
  const aboutData = siteContent?.aboutUs || defaultAboutUs;

  const title = aboutData.title || defaultAboutUs.title;
  const tagline = aboutData.tagline || defaultAboutUs.tagline;
  const mission = aboutData.mission || defaultAboutUs.mission;
  const story = aboutData.story || defaultAboutUs.story;
  const stats = Array.isArray(aboutData.stats) && aboutData.stats.length > 0
    ? aboutData.stats
    : defaultAboutUs.stats;
  const values = Array.isArray(aboutData.values) && aboutData.values.length > 0
    ? aboutData.values
    : defaultAboutUs.values;

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-light)', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '880px', width: '100%' }}>

        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-gray)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: 'clamp(24px, 5vw, 48px)', boxShadow: 'var(--shadow-sm)' }}>

          {/* Hero Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'var(--border-light)', color: 'var(--primary-red)', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
              <Heart size={14} fill="var(--primary-red)" /> Our Story & Purpose
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '12px' }}>
              {title}
            </h1>
            <p style={{ fontSize: '17px', color: 'var(--text-gray)', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
              {tagline}
            </p>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '48px' }}>
            {stats.map((stat, idx) => (
              <div key={stat.id || idx} style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary-red)', marginBottom: '4px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Mission Card */}
          <div style={{ backgroundColor: 'rgba(229, 36, 36, 0.05)', border: '1px solid rgba(229, 36, 36, 0.2)', borderRadius: '20px', padding: '32px', marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Target size={22} color="var(--primary-red)" />
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                Our Mission
              </h2>
            </div>
            <p style={{ fontSize: '15px', color: 'var(--text-dark)', lineHeight: '1.8', margin: 0 }}>
              {mission}
            </p>
          </div>

          {/* Our Story */}
          <div style={{ marginBottom: '44px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '14px' }}>
              How azPDF Came to Life
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-gray)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
              {story}
            </p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: '44px' }} />

          {/* Core Values Grid */}
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '24px', textAlign: 'center' }}>
              Our Core Principles
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {values.map((val, idx) => (
                <div key={val.id || idx} style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}>
                    {valueIcons[idx % valueIcons.length]}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)', margin: 0 }}>
                    {val.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-gray)', lineHeight: '1.6', margin: 0 }}>
                    {val.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Box */}
          <div style={{ marginTop: '54px', textAlign: 'center', padding: '32px', backgroundColor: 'var(--bg-light)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px' }}>
              Ready to streamline your PDF workflow?
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-gray)', marginBottom: '20px' }}>
              Explore our full suite of 20+ free, secure, and fast tools.
            </p>
            <button onClick={() => navigate('/#tools')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '12px', backgroundColor: 'var(--primary-red)', color: '#ffffff', fontWeight: '800', fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(229, 36, 36, 0.3)' }}>
              Explore All Tools <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
