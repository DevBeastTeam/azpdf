import React, { useState } from 'react';
import { ArrowLeft, Search, BookOpen, Zap, Shield, CreditCard, ChevronDown, ChevronUp, Mail, MessageCircle, FileText } from 'lucide-react';

const FAQ_DATA = [
  {
    category: 'Getting Started',
    icon: <BookOpen size={18} />,
    color: '#3b82f6',
    bg: '#eff6ff',
    items: [
      { q: 'How do I merge PDF files?', a: 'Click "Merge PDF" in the navigation or tools grid. Upload two or more PDF files by clicking "Select PDF files" or drag-and-drop. Then click "Merge PDF" to combine them into a single document. The merged PDF will download automatically.' },
      { q: 'What file size limit does iLovePDF support?', a: 'Free users can upload files up to 15MB per file. Premium users get up to 4GB per file upload, and Business users have unlimited file size with batch processing support.' },
      { q: 'How many files can I process at once?', a: 'Free users can process 2 files per batch. Premium users can process up to 100 files simultaneously, while Business users have unlimited batch processing.' },
      { q: 'Do I need to create an account to use iLovePDF?', a: 'No account is required for basic PDF tools. You can use all standard tools without registering. Creating a Premium account unlocks unlimited processing, larger file sizes, OCR, e-Signatures, and no ads.' }
    ]
  },
  {
    category: 'PDF Tools & Features',
    icon: <Zap size={18} />,
    color: '#16a34a',
    bg: '#f0fdf4',
    items: [
      { q: 'What is OCR PDF and how does it work?', a: 'OCR (Optical Character Recognition) converts scanned images or image-based PDFs into searchable, editable text. Upload your scanned PDF, select your language, and iLovePDF will extract all text making the PDF fully selectable and searchable.' },
      { q: 'Can I compress a PDF without losing quality?', a: 'Yes. iLovePDF uses smart compression algorithms that reduce file size while preserving visual quality. You can choose compression levels: Extreme Compression (smallest size), Recommended (balanced quality/size), or Low Compression (best quality).' },
      { q: 'How do I convert PDF to Word/Excel?', a: 'Select "PDF to Word" or "PDF to Excel" from the tools. Upload your PDF and click Convert. The tool extracts text and tables and converts them to an editable DOC or XLSX file. Premium users get higher accuracy conversion with formatting preserved.' },
      { q: 'Can I rotate specific pages in a PDF?', a: 'Yes. Use the "Rotate PDF" tool. You can rotate all pages or select individual pages to rotate 90°, 180°, or 270°. Changes are applied and the rotated PDF is downloaded automatically.' }
    ]
  },
  {
    category: 'Security & Privacy',
    icon: <Shield size={18} />,
    color: 'var(--primary-red)',
    bg: '#fff1f2',
    items: [
      { q: 'Are my uploaded files secure?', a: 'Absolutely. All file transfers are protected with 256-bit SSL/TLS encryption. Your files are processed on secure servers and are permanently and automatically deleted from our systems within 2 hours of processing.' },
      { q: 'Does iLovePDF read or store my PDF content?', a: 'No. Your PDF files are processed automatically by our servers without any human access. We do not read, analyze, or store the content of your files. Files are deleted immediately after processing is complete.' },
      { q: 'Can I password-protect my PDF?', a: 'Yes. Use the "Protect PDF" tool to add password encryption to any PDF. You can set both a user password (required to open the file) and restrict permissions like copying, printing, or editing.' }
    ]
  },
  {
    category: 'Billing & Premium',
    icon: <CreditCard size={18} />,
    color: '#7c3aed',
    bg: '#f5f3ff',
    items: [
      { q: 'How do I upgrade to Premium?', a: 'Click "Sign up" in the top navigation or go to the Pricing section on the homepage. Choose Premium or Business plan. You will be redirected to our secure payment page powered by Stripe. After payment, your account is upgraded instantly.' },
      { q: 'Can I cancel my subscription anytime?', a: 'Yes. You can cancel your Premium or Business subscription at any time from your Account Settings dashboard. Your access continues until the end of the current billing period. We offer a full 7-day money-back guarantee.' },
      { q: 'What payment methods are accepted?', a: 'We accept all major credit and debit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Business plans. All payments are processed securely through Stripe.' },
      { q: 'Is there a free trial?', a: 'Yes! Premium accounts include a 7-day free trial. Click "Go Premium (7 Days Free)" on the Pricing page. No charge until the trial period ends. Cancel anytime before the trial ends to avoid any charges.' }
    ]
  }
];

export default function HelpAndSupport({ onBack }) {
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFAQ = FAQ_DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      searchQuery === '' ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 64px)', backgroundColor: 'var(--bg-light)', padding: '48px 24px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '860px', width: '100%' }}>

        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-gray)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Back to Home
        </button>

        {/* Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1.2px', color: 'var(--primary-red)', textTransform: 'uppercase', backgroundColor: 'var(--border-light)', padding: '6px 14px', borderRadius: '20px', display: 'inline-block', marginBottom: '14px' }}>
            Help Center
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-dark)', marginBottom: '12px' }}>
            How can we help you?
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-gray)', marginBottom: '28px' }}>
            Find answers to common questions or contact our support team directly.
          </p>

          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: '520px', margin: '0 auto' }}>
            <Search size={18} color="var(--text-light-gray)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search help topics... e.g. merge, compress, OCR"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 46px', borderRadius: '12px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-card)', color: 'var(--text-dark)', fontSize: '15px', outline: 'none', boxShadow: 'var(--shadow-sm)' }}
            />
          </div>
        </div>

        {/* Category cards */}
        {!searchQuery && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '48px' }}>
            {FAQ_DATA.map((cat, i) => (
              <div key={i} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'var(--shadow-sm)', cursor: 'default' }}>
                <div style={{ padding: '8px', backgroundColor: cat.bg, borderRadius: '8px', width: 'fit-content', color: cat.color }}>
                  {cat.icon}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)' }}>{cat.category}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{cat.items.length} articles</div>
              </div>
            ))}
          </div>
        )}

        {/* FAQ Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '48px' }}>
          {filteredFAQ.map((cat, catIdx) => (
            <div key={catIdx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '8px', backgroundColor: cat.bg, borderRadius: '8px', color: cat.color }}>
                  {cat.icon}
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>{cat.category}</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cat.items.map((item, itemIdx) => {
                  const key = `${catIdx}-${itemIdx}`;
                  const isOpen = !!openItems[key];
                  return (
                    <div
                      key={itemIdx}
                      style={{ backgroundColor: 'var(--bg-card)', border: `1px solid ${isOpen ? 'var(--primary-red)' : 'var(--border-light)'}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s' }}
                    >
                      <button
                        onClick={() => toggleItem(catIdx, itemIdx)}
                        style={{ width: '100%', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>{item.q}</span>
                        {isOpen ? <ChevronUp size={18} color="var(--primary-red)" /> : <ChevronDown size={18} color="var(--text-light-gray)" />}
                      </button>
                      {isOpen && (
                        <div style={{ padding: '4px 20px 20px', fontSize: '14px', color: 'var(--text-gray)', lineHeight: '1.8', borderTop: '1px solid var(--border-light)' }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredFAQ.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-gray)' }}>
              <Search size={40} color="var(--text-light-gray)" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: '600' }}>No results for "{searchQuery}"</div>
              <div style={{ fontSize: '14px', marginTop: '6px' }}>Try a different keyword or contact our support team below.</div>
            </div>
          )}
        </div>

        {/* Still Need Help - Contact Cards */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '40px', color: 'var(--text-dark)', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-dark)' }}>
            Still need help?
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-gray)', marginBottom: '32px' }}>
            Our support team is available Monday to Friday, 9am – 6pm CET.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <a href="mailto:support@ilovepdf.com" style={{ textDecoration: 'none', backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: 'background 0.2s' }}>
              <Mail size={28} color="var(--primary-red)" />
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>Email Support</div>
              <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>support@ilovepdf.com</div>
            </a>

            <div style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <MessageCircle size={28} color="#3b82f6" />
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>Live Chat</div>
              <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>Available for Premium users</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <FileText size={28} color="#10b981" />
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>Documentation</div>
              <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>API & Developer Docs</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
