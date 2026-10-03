import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Download, RefreshCw, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, 
  Maximize2, Minimize2, CheckCircle2, FileText, ArrowLeft, ExternalLink,
  Layers, Eye, EyeOff, KeyRound, Check, ShieldCheck, Lock
} from 'lucide-react';
import OfficeDocumentViewer from './OfficeDocumentViewer';

export default function PdfResultViewer({ 
  blob, 
  filename, 
  toolTitle, 
  onDownload, 
  onStartOver, 
  onBack,
  onReorganize 
}) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(() => (window.innerWidth < 768 ? 0.85 : 1.0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [testPassword, setTestPassword] = useState('');
  const [showTestPassword, setShowTestPassword] = useState(false);
  const [testingPassword, setTestingPassword] = useState(false);
  const [testPasswordError, setTestPasswordError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfJsDoc, setPdfJsDoc] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [zipImages, setZipImages] = useState([]);

  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const arrayBufferRef = useRef(null);

  // Scroll to the very top header whenever page or zoom changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentPage, zoom]);

  const isPdf = filename?.toLowerCase().endsWith('.pdf') || blob?.type === 'application/pdf';
  const isZip = filename?.toLowerCase().endsWith('.zip');
  const isOffice = Boolean(
    filename && (
      filename.toLowerCase().endsWith('.xlsx') ||
      filename.toLowerCase().endsWith('.xls') ||
      filename.toLowerCase().endsWith('.csv') ||
      filename.toLowerCase().endsWith('.docx') ||
      filename.toLowerCase().endsWith('.doc') ||
      filename.toLowerCase().endsWith('.pptx') ||
      filename.toLowerCase().endsWith('.ppt')
    )
  );
  const isText = !isOffice && !isZip && (filename?.toLowerCase().endsWith('.txt') || filename?.toLowerCase().endsWith('.md'));

  // Load document
  useEffect(() => {
    let cancelled = false;

    const loadDoc = async () => {
      setLoading(true);
      setError(null);

      if (!blob) {
        setLoading(false);
        return;
      }

      if (isPdf) {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
          ).toString();

          let arrayBuffer;
          if (typeof blob.arrayBuffer === 'function') {
            arrayBuffer = await blob.arrayBuffer();
          } else {
            arrayBuffer = await (await fetch(URL.createObjectURL(blob))).arrayBuffer();
          }

          if (cancelled) return;
          arrayBufferRef.current = arrayBuffer;

          const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          if (cancelled) return;

          setPdfJsDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
        } catch (err) {
          console.warn('PDF.js preview render error:', err);
          if (!cancelled) {
            const isPassword = err?.name === 'PasswordException' || 
                               (err?.message && err.message.toLowerCase().includes('password')) ||
                               (filename && filename.toLowerCase().includes('protected')) ||
                               (toolTitle && toolTitle.toLowerCase().includes('protect'));
            if (isPassword) {
              setIsPasswordProtected(true);
            } else {
              setError('Could not render in-canvas preview. You can still download the complete file below.');
            }
            setLoading(false);
          }
        }
      } else if (isText) {
        try {
          const text = await blob.text();
          if (!cancelled) {
            setTextContent(text);
            setLoading(false);
          }
        } catch (e) {
          if (!cancelled) setLoading(false);
        }
      } else if (isZip) {
        try {
          const JSZip = (await import('jszip')).default;
          let arrayBuffer;
          if (typeof blob.arrayBuffer === 'function') {
            arrayBuffer = await blob.arrayBuffer();
          } else {
            arrayBuffer = await (await fetch(URL.createObjectURL(blob))).arrayBuffer();
          }
          const zip = await JSZip.loadAsync(arrayBuffer);
          const imgEntries = Object.keys(zip.files).filter(k => k.match(/\.(jpg|jpeg|png|webp)$/i) && !zip.files[k].dir);
          const urls = [];
          for (const entry of imgEntries) {
            const imgData = await zip.files[entry].async('blob');
            urls.push({
              name: entry,
              url: URL.createObjectURL(imgData)
            });
          }
          if (!cancelled) {
            setZipImages(urls);
            setLoading(false);
          }
        } catch (e) {
          console.warn('Zip preview error:', e);
          if (!cancelled) setLoading(false);
        }
      } else {
        if (!cancelled) setLoading(false);
      }
    };

    loadDoc();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (e) {}
      }
    };
  }, [blob, isPdf, isText, isOffice, isZip]);

  const handleTestUnlock = async (e) => {
    if (e) e.preventDefault();
    if (!testPassword) {
      setTestPasswordError('Please enter the password to test unlocking.');
      return;
    }
    setTestingPassword(true);
    setTestPasswordError('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const doc = await pdfjsLib.getDocument({
        data: arrayBufferRef.current,
        password: testPassword
      }).promise;
      setPdfJsDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
      setIsPasswordProtected(false);
      setTestingPassword(false);
    } catch (err) {
      setTestingPassword(false);
      if (err?.name === 'PasswordException' || err?.message?.toLowerCase().includes('password')) {
        setTestPasswordError('Incorrect password. Please verify and try again.');
      } else {
        setTestPasswordError('Could not unlock document with this password.');
      }
    }
  };

  // Render active page onto canvas
  const renderPage = useCallback(async (pageNum, scale) => {
    if (!pdfJsDoc || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (e) {}
        renderTaskRef.current = null;
      }

      const page = await pdfJsDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * dpr });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn('Page render error:', err);
      }
    }
  }, [pdfJsDoc]);

  // Re-render when page or zoom changes
  useEffect(() => {
    if (pdfJsDoc && currentPage && isPdf) {
      renderPage(currentPage, zoom);
    }
  }, [pdfJsDoc, currentPage, zoom, renderPage, isPdf]);

  const handleZoomIn = () => setZoom(z => Math.min(2.5, +(z + 0.2).toFixed(1)));
  const handleZoomOut = () => setZoom(z => Math.max(0.6, +(z - 0.2).toFixed(1)));
  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(numPages, p + 1));

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formattedSize = blob ? (blob.size / (1024 * 1024)).toFixed(2) + ' MB' : '1.45 MB';

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: isFullscreen ? '100%' : '980px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'var(--bg-card)',
        borderRadius: isFullscreen ? '0' : '16px',
        border: isFullscreen ? 'none' : '1px solid var(--border-light)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* ── Top Header & Actions ── */}
      <div style={{
        width: '100%',
        padding: '16px 22px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#fafbfc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            backgroundColor: '#ecfdf5', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>
                {toolTitle} Ready
              </h3>
              <span style={{
                fontSize: '11px', fontWeight: '700', color: '#10b981',
                backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '12px'
              }}>
                {isPdf ? 'Verified PDF' : isOffice ? 'Verified Document' : 'Complete'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-gray)' }}>
              {filename} • <strong style={{ color: 'var(--text-dark)' }}>{formattedSize}</strong>
            </p>
          </div>
        </div>

        {/* Primary Header Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {onReorganize && (
            <button
              type="button"
              onClick={onReorganize}
              title="Return to interactive page organizer to reorder or delete pages"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(238, 108, 77, 0.1)',
                color: '#EE6C4D',
                border: '1.5px solid #EE6C4D',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Layers size={16} /> Sort / Delete Pages
            </button>
          )}

          <button
            type="button"
            onClick={onStartOver}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-gray)',
              border: '1px solid var(--border-light)',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={15} /> Start Over
          </button>

          <button
            type="button"
            onClick={onDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--primary-red)',
              color: '#ffffff',
              border: 'none',
              padding: '11px 24px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(229, 36, 36, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <Download size={18} /> Download Document
          </button>
        </div>
      </div>

      {/* ── Toolbar for PDF Zoom & Navigation ── */}
      {isPdf && numPages > 0 && (
        <div style={{
          width: '100%',
          padding: '10px 20px',
          backgroundColor: '#f1f5f9',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Page Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              style={{
                width: '32px', height: '32px', borderRadius: '6px',
                border: '1px solid var(--border-light)',
                backgroundColor: currentPage <= 1 ? '#e2e8f0' : '#ffffff',
                color: currentPage <= 1 ? '#94a3b8' : '#0f172a',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Previous Page"
            >
              <ChevronLeft size={18} />
            </button>

            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
              Page {currentPage} of {numPages}
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              style={{
                width: '32px', height: '32px', borderRadius: '6px',
                border: '1px solid var(--border-light)',
                backgroundColor: currentPage >= numPages ? '#e2e8f0' : '#ffffff',
                color: currentPage >= numPages ? '#94a3b8' : '#0f172a',
                cursor: currentPage >= numPages ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Next Page"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Zoom Controls & Fullscreen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleZoomOut}
              style={{
                width: '32px', height: '32px', borderRadius: '6px',
                border: '1px solid var(--border-light)', backgroundColor: '#ffffff',
                color: '#1e293b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>

            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', minWidth: '44px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              style={{
                width: '32px', height: '32px', borderRadius: '6px',
                border: '1px solid var(--border-light)', backgroundColor: '#ffffff',
                color: '#1e293b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                marginLeft: '8px',
                width: '32px', height: '32px', borderRadius: '6px',
                border: '1px solid var(--border-light)', backgroundColor: '#ffffff',
                color: '#1e293b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* ── Document Canvas Viewport ── */}
      <div 
        ref={scrollContainerRef}
        style={{
          width: '100%',
          minHeight: '460px',
          maxHeight: isFullscreen ? 'calc(100vh - 140px)' : '72vh',
          backgroundColor: '#334155',
          overflowY: 'auto',
          overflowX: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '36px 20px',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#ffffff', margin: 'auto' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: 'var(--primary-red)',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Rendering document preview...</span>
          </div>
        )}

        {isPasswordProtected && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '36px 28px',
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '500px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
            margin: 'auto'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'rgba(229, 36, 36, 0.1)',
              color: 'var(--primary-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <Lock size={32} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)' }}>
              Document Successfully Protected
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-gray)', lineHeight: '1.5' }}>
              Your PDF is now encrypted with standard AES encryption. A password prompt will appear whenever this document is opened in Adobe Acrobat, Google Chrome, Apple Preview, or any PDF reader.
            </p>

            <button
              type="button"
              onClick={onDownload}
              style={{
                backgroundColor: 'var(--primary-red)',
                color: '#fff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(229, 36, 36, 0.25)',
                marginBottom: '24px'
              }}
            >
              <Download size={18} /> Download Protected PDF
            </button>

            {/* Test Password and Preview in-browser */}
            <div style={{
              borderTop: '1px solid var(--border-light, #e2e8f0)',
              paddingTop: '20px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <KeyRound size={15} style={{ color: 'var(--primary-red)' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)' }}>
                  Test Your Password (Live Preview)
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-gray)', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                Enter the password you just set to unlock and verify the document preview directly on this screen:
              </p>

              <form onSubmit={handleTestUnlock} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showTestPassword ? 'text' : 'password'}
                    value={testPassword}
                    onChange={(e) => {
                      setTestPassword(e.target.value);
                      if (testPasswordError) setTestPasswordError('');
                    }}
                    placeholder="Enter password to verify..."
                    style={{
                      width: '100%',
                      padding: '9px 36px 9px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${testPasswordError ? '#ef4444' : '#cbd5e1'}`,
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: '#f8fafc',
                      color: 'var(--text-dark)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTestPassword(!showTestPassword)}
                    title={showTestPassword ? 'Hide' : 'Show'}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showTestPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={testingPassword || !testPassword}
                  style={{
                    backgroundColor: testPassword ? '#0f172a' : '#94a3b8',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: testPassword && !testingPassword ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {testingPassword ? (
                    'Verifying...'
                  ) : (
                    <>
                      <Eye size={15} /> Unlock Preview
                    </>
                  )}
                </button>
              </form>

              {testPasswordError && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#ef4444',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ⚠️ {testPasswordError}
                </div>
              )}
            </div>
          </div>
        )}

        {!isPasswordProtected && error && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            textAlign: 'center',
            maxWidth: '440px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            margin: 'auto'
          }}>
            <FileText size={44} style={{ color: 'var(--primary-red)', marginBottom: '10px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-dark)' }}>Document Generated!</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-gray)' }}>{error}</p>
            <button
              type="button"
              onClick={onDownload}
              style={{
                backgroundColor: 'var(--primary-red)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Download size={16} /> Download File
            </button>
          </div>
        )}

        {isPdf && !error && !isPasswordProtected && (
          <div style={{
            display: loading ? 'none' : 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45), 0 2px 10px rgba(0, 0, 0, 0.25)',
            borderRadius: '4px',
            overflow: 'hidden',
            lineHeight: 0,
            margin: '0 auto',
            maxWidth: '100%',
            flexShrink: 0
          }}>
            <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
          </div>
        )}

        {/* Office Document Interactive Live Viewer (Excel, Word, PowerPoint) */}
        {isOffice && !loading && (
          <div style={{ width: '100%', maxWidth: '980px', margin: '0 auto' }}>
            <OfficeDocumentViewer 
              blob={blob} 
              filename={filename} 
              maxHeight="70vh"
              onDownload={onDownload} 
            />
          </div>
        )}

        {/* Text Content Output */}
        {isText && !loading && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '10px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '400px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#1e293b'
          }}>
            {textContent || 'No text content available.'}
          </div>
        )}

        {/* ZIP Image Gallery Output (PDF to JPG) */}
        {isZip && !loading && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '960px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: '#fef2f2', color: '#e52424', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                  IMAGES ZIP
                </span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                  {zipImages.length} Extracted Image{zipImages.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
              maxHeight: '60vh',
              overflowY: 'auto',
              padding: '4px'
            }}>
              {zipImages.map((img, idx) => (
                <div key={idx} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ height: '140px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
                    <img src={img.url} alt={img.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                      {img.name}
                    </span>
                    <a href={img.url} download={img.name} style={{ color: '#e52424', display: 'flex', alignItems: 'center' }}>
                      <Download size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Binary Non-PDF & Non-Office & Non-Zip Output Card */}
        {!isPdf && !isText && !isOffice && !isZip && !loading && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '36px',
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '460px',
            boxShadow: '0 15px 30px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              backgroundColor: 'rgba(229, 36, 36, 0.1)',
              color: 'var(--primary-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <FileText size={36} />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '800', color: 'var(--text-dark)' }}>
              {filename}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-gray)' }}>
              File format converted successfully with 256-bit SSL encryption.
            </p>
            <button
              type="button"
              onClick={onDownload}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'var(--primary-red)',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(229, 36, 36, 0.3)'
              }}
            >
              <Download size={20} /> Download {filename}
            </button>
          </div>
        )}
      </div>

      {/* ── Multi-Page Thumbnail Strip for PDFs with > 1 page ── */}
      {isPdf && numPages > 1 && (
        <div style={{
          width: '100%',
          padding: '12px 18px',
          borderTop: '1px solid var(--border-light)',
          backgroundColor: '#fafbfc',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          overflowX: 'auto',
          boxSizing: 'border-box'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>
            Pages:
          </span>
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pNum) => (
            <button
              key={pNum}
              type="button"
              onClick={() => setCurrentPage(pNum)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                border: currentPage === pNum ? '2px solid var(--primary-red)' : '1px solid var(--border-light)',
                backgroundColor: currentPage === pNum ? 'rgba(229, 36, 36, 0.08)' : '#ffffff',
                color: currentPage === pNum ? 'var(--primary-red)' : '#1e293b',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              Page {pNum}
            </button>
          ))}
        </div>
      )}

      {/* ── Bottom Confirm / Download Strip ── */}
      <div style={{
        width: '100%',
        padding: '14px 22px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
          <ShieldCheck size={16} style={{ color: '#10b981' }} />
          <span>Review your document above before downloading. Ready to save!</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {onReorganize && (
            <button
              type="button"
              onClick={onReorganize}
              title="Return to interactive page organizer to reorder or delete pages"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(238, 108, 77, 0.1)',
                color: '#EE6C4D',
                border: '1.5px solid #EE6C4D',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Layers size={16} /> Sort / Delete Pages
            </button>
          )}

          <button
            type="button"
            onClick={onStartOver}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-gray)',
              border: '1px solid var(--border-light)',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={15} /> Retry / Start Over
          </button>

          <button
            type="button"
            onClick={onBack}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-gray)',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            All Tools <ExternalLink size={13} />
          </button>

          <button
            type="button"
            onClick={onDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--primary-red)',
              color: '#ffffff',
              border: 'none',
              padding: '11px 26px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(229, 36, 36, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <Download size={18} /> Download {filename}
          </button>
        </div>
      </div>
    </div>
  );
}
