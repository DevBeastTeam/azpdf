import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, Calendar, User, Search, Tag, ArrowRight, Share2, Check, ChevronRight, Sparkles, Layers } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAppContext } from '../App';
import { defaultBlogPage } from '../data/legalPagesData';

export default function Blog() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const context = useAppContext();
  const siteContent = context?.siteContent;

  const [blogsList, setBlogsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch blogs from API or fallback
  useEffect(() => {
    let isMounted = true;
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (res.ok) {
          const data = await res.json();
          if (data.blogs && Array.isArray(data.blogs) && data.blogs.length > 0) {
            if (isMounted) setBlogsList(data.blogs);
            return;
          }
        }
      } catch (err) {
        console.warn('API fetch error, falling back to default blog data:', err);
      }

      // Fallback to siteContent or defaultBlogPage
      const fallback = (siteContent?.blogPage?.posts && siteContent.blogPage.posts.length > 0)
        ? siteContent.blogPage.posts
        : defaultBlogPage.posts;

      const formatted = fallback.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        excerpt: p.summary || p.excerpt || '',
        content: p.body || p.content || '',
        category: p.category || 'Tutorials',
        author: p.author || 'Editorial Team',
        read_time: p.readTime || p.read_time || '4 min read',
        image: p.image || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80',
        tags: p.tags || 'PDF, Tips',
        status: p.status || 'Published',
        created_at: p.date || p.created_at || 'Aug 2026'
      }));

      if (isMounted) setBlogsList(formatted);
    };

    fetchBlogs().finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [siteContent]);

  // Find active article if slug is in URL
  const activeArticle = slug
    ? blogsList.find(b => b.slug === slug || String(b.id) === slug)
    : null;

  // Derive unique categories
  const categories = ['All', ...new Set(blogsList.map(b => b.category).filter(Boolean))];

  // Filter posts
  const filteredPosts = blogsList.filter(post => {
    if (post.status && post.status.toLowerCase() === 'draft') return false;
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesQuery = !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.tags && post.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // ── Render Single Article Detail View ──────────────────────────────────────
  if (slug) {
    if (loading) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-light)', borderTopColor: 'var(--primary-red)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-gray)', fontSize: '14px' }}>Loading article...</p>
          </div>
        </div>
      );
    }

    if (!activeArticle) {
      return (
        <div style={{ minHeight: '70vh', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-light)' }}>
          <div style={{ maxWidth: '480px', textAlign: 'center', backgroundColor: 'var(--bg-card)', padding: '40px 32px', borderRadius: '20px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
            <BookOpen size={48} color="var(--text-light-gray)" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px' }}>Article Not Found</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-gray)', marginBottom: '24px', lineHeight: '1.5' }}>
              The blog article you are looking for may have been moved, unpublished, or does not exist.
            </p>
            <button
              onClick={() => navigate('/blog')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '10px', backgroundColor: 'var(--primary-red)', color: '#ffffff', fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Return to Blog
            </button>
          </div>
        </div>
      );
    }

    // Related articles
    const relatedPosts = blogsList
      .filter(b => b.id !== activeArticle.id && (b.category === activeArticle.category || !activeArticle.category))
      .slice(0, 3);

    return (
      <div style={{ width: '100%', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-light)', padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 24px) 80px' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>

          {/* Breadcrumbs & Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-gray)' }}>
              <Link to="/" style={{ color: 'var(--text-gray)', fontWeight: '600' }}>Home</Link>
              <ChevronRight size={14} />
              <Link to="/blog" style={{ color: 'var(--text-gray)', fontWeight: '600' }}>Blog</Link>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--primary-red)', fontWeight: '700' }}>{activeArticle.category || 'Article'}</span>
            </div>

            <button
              onClick={() => navigate('/blog')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-dark)',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <ArrowLeft size={15} /> All Articles
            </button>
          </div>

          {/* Article Container */}
          <article style={{ backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-light)', padding: 'clamp(24px, 5vw, 48px)', boxShadow: 'var(--shadow-sm)', marginBottom: '40px' }}>

            {/* Badges & Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-red)', backgroundColor: 'rgba(229, 36, 36, 0.08)', padding: '5px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {activeArticle.category}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-gray)' }}>
                <Clock size={14} /> {activeArticle.read_time || '4 min read'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-gray)' }}>
                <Calendar size={14} /> {activeArticle.created_at ? new Date(activeArticle.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: '800', color: 'var(--text-dark)', lineHeight: '1.25', marginBottom: '20px' }}>
              {activeArticle.title}
            </h1>

            {/* Author row & Share button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--border-light)', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--primary-red)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' }}>
                  {(activeArticle.author || 'T')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)' }}>{activeArticle.author || 'Editorial Team'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>azPDF Document Specialists</div>
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  backgroundColor: copiedLink ? '#10b981' : 'var(--bg-light)',
                  color: copiedLink ? '#ffffff' : 'var(--text-dark)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copiedLink ? <Check size={15} /> : <Share2 size={15} />}
                {copiedLink ? 'Link Copied!' : 'Share Article'}
              </button>
            </div>

            {/* Featured Image */}
            {activeArticle.image && (
              <div style={{ width: '100%', maxHeight: '420px', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
                <img
                  src={activeArticle.image}
                  alt={activeArticle.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            {/* Highlighted Excerpt Callout */}
            {activeArticle.excerpt && (
              <div style={{ backgroundColor: 'var(--bg-light)', borderLeft: '4px solid var(--primary-red)', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px', fontSize: '16px', color: 'var(--text-dark)', fontStyle: 'italic', lineHeight: '1.6' }}>
                "{activeArticle.excerpt}"
              </div>
            )}

            {/* Main Content */}
            <div style={{ fontSize: '16px', color: 'var(--text-dark)', lineHeight: '1.85', whiteSpace: 'pre-line' }}>
              {activeArticle.content}
            </div>

            {/* Tags */}
            {activeArticle.tags && (
              <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-gray)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={14} /> Tags:
                </span>
                {activeArticle.tags.split(',').map((t, idx) => (
                  <span
                    key={idx}
                    style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-light)', color: 'var(--text-gray)', fontWeight: '600' }}
                  >
                    #{t.trim()}
                  </span>
                ))}
              </div>
            )}
          </article>

          {/* Quick PDF CTA Banner */}
          <div style={{ backgroundColor: 'linear-gradient(135deg, #1e1e24 0%, #2b2b36 100%)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '32px', textAlign: 'center', marginBottom: '44px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '8px' }}>
              Put these PDF tips into action
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-gray)', maxWidth: '540px', margin: '0 auto 20px', lineHeight: '1.6' }}>
              Merge, compress, edit, convert, and protect your PDF documents in seconds with zero watermarks and military-grade privacy.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/tool/compress')}
                style={{ padding: '10px 22px', borderRadius: '10px', backgroundColor: 'var(--primary-red)', color: '#ffffff', fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(229, 36, 36, 0.25)' }}
              >
                Compress PDF
              </button>
              <button
                onClick={() => navigate('/')}
                style={{ padding: '10px 22px', borderRadius: '10px', backgroundColor: 'var(--bg-light)', color: 'var(--text-dark)', fontWeight: '700', fontSize: '14px', border: '1px solid var(--border-light)', cursor: 'pointer' }}
              >
                Explore All 30+ Tools
              </button>
            </div>
          </div>

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '20px' }}>
                Related Articles
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                {relatedPosts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { navigate(`/blog/${p.slug}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-red)', backgroundColor: 'rgba(229,36,36,0.08)', padding: '3px 8px', borderRadius: '8px', textTransform: 'uppercase' }}>
                        {p.category}
                      </span>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)', marginTop: '10px', marginBottom: '8px', lineHeight: '1.4' }}>
                        {p.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-gray)', lineHeight: '1.5', margin: 0 }}>
                        {p.excerpt ? p.excerpt.substring(0, 90) + '...' : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-red)', fontWeight: '700', fontSize: '12px', marginTop: '16px' }}>
                      Read More <ArrowRight size={13} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ── Render All Blogs List View ─────────────────────────────────────────────
  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-light)', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '1080px', width: '100%' }}>

        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', backgroundColor: 'rgba(229, 36, 36, 0.08)', color: 'var(--primary-red)', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
            <BookOpen size={14} /> Official azPDF Knowledge Center
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '14px', letterSpacing: '-0.5px' }}>
            The azPDF Blog
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-gray)', maxWidth: '680px', margin: '0 auto', lineHeight: '1.6' }}>
            Expert guides, industry best practices, release notes, and productivity workflows to supercharge your document management.
          </p>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px', margin: '0 auto' }}>
            <Search size={18} color="var(--text-gray)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search tutorials, security guides, feature updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 46px',
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
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Post Spotlight (When on "All" and no search query) */}
        {selectedCategory === 'All' && !searchQuery && filteredPosts.length > 0 && (
          <div
            onClick={() => { navigate(`/blog/${filteredPosts[0].slug}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              marginBottom: '40px',
              cursor: 'pointer',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 0,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
          >
            {filteredPosts[0].image && (
              <div style={{ width: '100%', height: '100%', minHeight: '260px', overflow: 'hidden' }}>
                <img
                  src={filteredPosts[0].image}
                  alt={filteredPosts[0].title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}
            <div style={{ padding: 'clamp(24px, 4vw, 40px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-red)', backgroundColor: 'rgba(229,36,36,0.08)', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                    Featured Spotlight
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-gray)' }}>
                    {filteredPosts[0].read_time || '4 min read'}
                  </span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '12px', lineHeight: '1.3' }}>
                  {filteredPosts[0].title}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '20px' }}>
                  {filteredPosts[0].excerpt}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>
                  By {filteredPosts[0].author || 'azPDF Team'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary-red)', fontWeight: '700', fontSize: '14px' }}>
                  Read Full Article <ArrowRight size={15} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: '16px', color: 'var(--text-gray)', margin: 0 }}>No articles found matching your criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredPosts.slice(selectedCategory === 'All' && !searchQuery ? 1 : 0).map((post) => (
              <div
                key={post.id}
                onClick={() => { navigate(`/blog/${post.slug}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                {post.image && (
                  <div style={{ width: '100%', height: '180px', overflow: 'hidden' }}>
                    <img
                      src={post.image}
                      alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                )}

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    {/* Category & Read Time */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-red)', backgroundColor: 'rgba(229, 36, 36, 0.08)', padding: '4px 10px', borderRadius: '12px', textTransform: 'uppercase' }}>
                        {post.category}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-gray)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {post.read_time || '4 min read'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '10px', lineHeight: '1.4' }}>
                      {post.title}
                    </h3>

                    {/* Summary */}
                    <p style={{ fontSize: '13px', color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '20px' }}>
                      {post.excerpt}
                    </p>
                  </div>

                  <div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', marginBottom: '16px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-gray)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> {post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--primary-red)',
                          fontWeight: '700',
                          fontSize: '13px'
                        }}
                      >
                        Read Article <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
