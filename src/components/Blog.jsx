import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Clock, Calendar, User, Search, Tag, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { defaultBlogPage } from '../data/legalPagesData';

export default function Blog() {
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
  const blogData = siteContent?.blogPage || defaultBlogPage;

  const title = blogData.title || defaultBlogPage.title;
  const subtitle = blogData.subtitle || defaultBlogPage.subtitle;
  const categories = Array.isArray(blogData.categories) && blogData.categories.length > 0
    ? blogData.categories
    : defaultBlogPage.categories;
  const posts = Array.isArray(blogData.posts) && blogData.posts.length > 0
    ? blogData.posts
    : defaultBlogPage.posts;

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState(null);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesQuery = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-light)', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '980px', width: '100%' }}>

        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-gray)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', backgroundColor: 'var(--border-light)', color: 'var(--primary-red)', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            <BookOpen size={14} /> PDF Insights & Tutorials
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '12px' }}>
            {title}
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-gray)', maxWidth: '640px', margin: '0 auto', lineHeight: '1.6' }}>
            {subtitle}
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
            <Search size={18} color="var(--text-gray)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search articles, guides, tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-dark)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: 'var(--shadow-sm)'
              }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? 'var(--primary-red)' : 'var(--border-light)',
                  backgroundColor: selectedCategory === cat ? 'var(--primary-red)' : 'var(--bg-card)',
                  color: selectedCategory === cat ? '#ffffff' : 'var(--text-gray)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: '16px', color: 'var(--text-gray)', margin: 0 }}>No articles found matching your filter criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '24px' }}>
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '20px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div>
                  {/* Category & Read Time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-red)', backgroundColor: 'rgba(229, 36, 36, 0.08)', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                      {post.category}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-gray)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '10px', lineHeight: '1.4' }}>
                    {post.title}
                  </h3>

                  {/* Summary */}
                  <p style={{ fontSize: '13px', color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '20px' }}>
                    {post.summary}
                  </p>
                </div>

                <div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: '16px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-gray)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} /> {post.date}
                    </span>
                    <button
                      onClick={() => setActiveArticle(post)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-red)',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Read Article <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Article Reader Modal */}
        {activeArticle && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '24px', maxWidth: '720px', width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: 'clamp(24px, 4vw, 44px)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', position: 'relative' }}>
              
              <button
                onClick={() => setActiveArticle(null)}
                style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-gray)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                aria-label="Close article"
              >
                <X size={22} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-red)', backgroundColor: 'rgba(229, 36, 36, 0.08)', padding: '4px 12px', borderRadius: '14px' }}>
                  {activeArticle.category}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-gray)' }}>
                  {activeArticle.date} · {activeArticle.readTime}
                </span>
              </div>

              <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '16px', lineHeight: '1.3' }}>
                {activeArticle.title}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-gray)', marginBottom: '24px' }}>
                <User size={15} color="var(--primary-red)" />
                <span>Written by <strong>{activeArticle.author}</strong></span>
              </div>

              <div style={{ backgroundColor: 'var(--bg-light)', borderRadius: '14px', padding: '16px', borderLeft: '3px solid var(--primary-red)', marginBottom: '28px', fontSize: '14px', color: 'var(--text-dark)', fontWeight: '600', lineHeight: '1.6' }}>
                {activeArticle.summary}
              </div>

              <div style={{ fontSize: '15px', color: 'var(--text-gray)', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                {activeArticle.body}
              </div>

              <div style={{ marginTop: '36px', textAlign: 'right' }}>
                <button onClick={() => setActiveArticle(null)} style={{ padding: '10px 24px', borderRadius: '10px', backgroundColor: 'var(--primary-red)', color: '#ffffff', fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer' }}>
                  Close Reader
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
