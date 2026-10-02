import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  FileText, 
  FileSpreadsheet,
  Presentation,
  Camera,
  Layers,
  RefreshCw
} from 'lucide-react';
import OfficeDocumentViewer from './OfficeDocumentViewer';

/**
 * RightSidePreviewSheet Component
 * Opens an off-canvas drawer from the right edge showing a rich,
 * interactive preview of the document / scanned pages.
 * Includes page navigation, zoom/rotation controls, a mini thumbnail carousel,
 * and bottom actions for "Close Sheet", "Retry", and "Convert & Download PDF".
 */
export default function RightSidePreviewSheet({
  isOpen,
  onClose,
  files = [],
  currentIndex = 0,
  onSelectIndex,
  onDeletePage,
  onDownloadOrConvert,
  onRetry,
  toolTitle = 'Scan to PDF'
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const sheetBodyRef = useRef(null);

  // Reset zoom & rotation and scroll to the top header when page changes or when sheet opens
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    if (sheetBodyRef.current) {
      sheetBodyRef.current.scrollTop = 0;
    }
  }, [currentIndex, isOpen]);

  // Keyboard navigation (Esc to close, Arrow keys to navigate)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onSelectIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < files.length - 1) {
        onSelectIndex(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, files.length, onClose, onSelectIndex]);

  if (!isOpen || !files || files.length === 0) return null;

  const currentFile = files[currentIndex] || files[0];
  const currentFileName = (currentFile?.name || '').toLowerCase();
  const isExcel = Boolean(currentFileName.match(/\.(xlsx|xls|csv)$/i));
  const isWord = Boolean(currentFileName.match(/\.(docx|doc)$/i));
  const isPpt = Boolean(currentFileName.match(/\.(pptx|ppt)$/i));
  const isCurrentFileOffice = isExcel || isWord || isPpt;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => { setZoom(1); setRotation(0); };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div 
      className="preview-sheet-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 100000,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Slide-in Sheet Panel */}
      <div 
        className="preview-side-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(620px, 94vw)',
          height: '100vh',
          height: '100dvh',
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-dark, #1e293b)',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border-light, #e2e8f0)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* 1. Header */}
        <div 
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: isExcel ? '#ecfdf5' : isWord ? '#eff6ff' : isPpt ? '#fff7ed' : 'rgba(229, 36, 36, 0.1)',
                color: isExcel ? '#059669' : isWord ? '#2563eb' : isPpt ? '#ea580c' : 'var(--primary-red, #e52424)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {isExcel ? <FileSpreadsheet size={18} /> : isWord ? <FileText size={18} /> : isPpt ? <Presentation size={18} /> : <Camera size={18} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-dark, #1e293b)' }}>
                  Document Preview
                </h3>
                <span 
                  style={{
                    backgroundColor: 'rgba(229, 36, 36, 0.08)',
                    color: 'var(--primary-red, #e52424)',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  Page {currentIndex + 1} of {files.length}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-gray, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
                {currentFile.name} {currentFile.size ? `• ${currentFile.size}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close Sheet (Esc)"
            aria-label="Close Preview Sheet"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid var(--border-light, #e2e8f0)',
              backgroundColor: 'var(--bg-light, #f8fafc)',
              color: 'var(--text-gray, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = '#fca5a5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-light, #f8fafc)';
              e.currentTarget.style.color = 'var(--text-gray, #64748b)';
              e.currentTarget.style.borderColor = 'var(--border-light, #e2e8f0)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Top Navigation Bar (Pages Carousel & Prev/Next buttons) */}
        {files.length > 1 && (
          <div 
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--bg-card, #ffffff)',
              borderBottom: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexShrink: 0
            }}
          >
            <button
              type="button"
              onClick={() => onSelectIndex(prev => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-light, #e2e8f0)',
                backgroundColor: currentIndex === 0 ? 'var(--bg-light, #f8fafc)' : '#ffffff',
                color: currentIndex === 0 ? '#94a3b8' : 'var(--text-dark, #1e293b)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentIndex === 0 ? 0.5 : 1
              }}
            >
              <ChevronLeft size={14} /> Prev
            </button>

            {/* Horizontal Mini Thumbnails Strip */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                padding: '2px 4px',
                maxWidth: '360px',
                scrollbarWidth: 'thin'
              }}
            >
              {files.map((file, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectIndex(idx)}
                  title={`Go to page ${idx + 1}`}
                  style={{
                    width: '32px',
                    height: '42px',
                    borderRadius: '4px',
                    border: idx === currentIndex ? '2px solid var(--primary-red, #e52424)' : '1px solid var(--border-light, #e2e8f0)',
                    backgroundColor: '#ffffff',
                    padding: '1px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: idx === currentIndex ? '0 2px 8px rgba(229, 36, 36, 0.25)' : 'none',
                    transform: idx === currentIndex ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {file.previewUrl ? (
                    <img 
                      src={file.previewUrl} 
                      alt={`P${idx + 1}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : file.name?.match(/\.(xlsx|xls|csv)$/i) ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ecfdf5', color: '#059669' }}>
                      <FileSpreadsheet size={15} />
                      <span style={{ fontSize: '7px', fontWeight: '800', marginTop: '1px' }}>XLS</span>
                    </div>
                  ) : file.name?.match(/\.(docx|doc)$/i) ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                      <FileText size={15} />
                      <span style={{ fontSize: '7px', fontWeight: '800', marginTop: '1px' }}>DOC</span>
                    </div>
                  ) : file.name?.match(/\.(pptx|ppt)$/i) ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7ed', color: '#ea580c' }}>
                      <Presentation size={15} />
                      <span style={{ fontSize: '7px', fontWeight: '800', marginTop: '1px' }}>PPT</span>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '700', color: '#64748b' }}>
                      {idx + 1}
                    </div>
                  )}
                  <span 
                    style={{
                      position: 'absolute',
                      bottom: '1px',
                      right: '1px',
                      backgroundColor: idx === currentIndex ? 'var(--primary-red)' : 'rgba(0,0,0,0.6)',
                      color: '#ffffff',
                      fontSize: '8px',
                      fontWeight: '800',
                      padding: '1px 3px',
                      borderRadius: '2px',
                      lineHeight: 1
                    }}
                  >
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onSelectIndex(prev => Math.min(prev + 1, files.length - 1))}
              disabled={currentIndex === files.length - 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-light, #e2e8f0)',
                backgroundColor: currentIndex === files.length - 1 ? 'var(--bg-light, #f8fafc)' : '#ffffff',
                color: currentIndex === files.length - 1 ? '#94a3b8' : 'var(--text-dark, #1e293b)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: currentIndex === files.length - 1 ? 'not-allowed' : 'pointer',
                opacity: currentIndex === files.length - 1 ? 0.5 : 1
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Dedicated Toolbar Bar for Image zoom/rotation (Hidden for Office docs as OfficeViewer has native controls) */}
        {!isCurrentFileOffice && (
          <div 
            style={{
              padding: '8px 18px',
              backgroundColor: 'var(--bg-card, #ffffff)',
              borderBottom: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-gray, #64748b)' }}>
              Page View
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out (-)"
                style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid var(--border-light, #e2e8f0)', background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset Zoom (100%)"
                style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-light, #e2e8f0)', background: '#ffffff', cursor: 'pointer', color: '#475569' }}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In (+)"
                style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid var(--border-light, #e2e8f0)', background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
              >
                <ZoomIn size={14} />
              </button>
              <div style={{ width: '1px', height: '16px', backgroundColor: '#e2e8f0', margin: '0 4px' }} />
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate 90° Clockwise"
                style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid var(--border-light, #e2e8f0)', background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>
        )}

        {/* 3. Sheet Body (Interactive Viewport - Aligned to Top so Header is Always Visible) */}
        <div 
          ref={sheetBodyRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'auto',
            padding: '24px 20px',
            backgroundColor: 'var(--bg-light, #f8fafc)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            position: 'relative'
          }}
        >
          {/* Office Document Interactive Live Viewer (Excel, Word, PowerPoint) */}
          {isCurrentFileOffice ? (
            <div style={{ width: '100%', maxWidth: '100%' }}>
              <OfficeDocumentViewer 
                file={currentFile.rawFile || currentFile.file || currentFile}
                filename={currentFile.name}
                maxHeight="68vh"
              />
            </div>
          ) : (
            <div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                maxWidth: '100%',
                transition: 'transform 0.15s ease'
              }}
            >
              {currentFile.previewUrl ? (
                <img
                  src={currentFile.previewUrl}
                  alt={`Page ${currentIndex + 1}`}
                  style={{
                    maxHeight: zoom <= 1 ? '62vh' : 'none',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    transformOrigin: 'top center'
                  }}
                />
              ) : (
                <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-gray, #64748b)' }}>
                  <FileText size={56} style={{ color: 'var(--primary-red, #e52424)', marginBottom: '12px' }} />
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', color: 'var(--text-dark, #1e293b)' }}>
                    {currentFile.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    {currentFile.size || 'Document file ready to process'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Bottom Footer Bar (Close Sheet and Download / Convert Actions) */}
        <div 
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-light, #e2e8f0)',
            backgroundColor: 'var(--bg-card, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0
          }}
        >
          {/* Left: Close Sheet Button & Delete Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                backgroundColor: 'var(--bg-light, #f8fafc)',
                color: 'var(--text-dark, #1e293b)',
                border: '1px solid var(--border-light, #cbd5e1)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={15} /> Close Sheet
            </button>

            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="btn btn-secondary"
                title="Clear pages and start over"
                style={{
                  backgroundColor: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-gray, #64748b)',
                  border: '1px solid var(--border-light, #cbd5e1)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <RefreshCw size={14} /> Retry
              </button>
            )}

            {onDeletePage && (
              <button
                type="button"
                onClick={() => onDeletePage(currentIndex)}
                title="Delete this page"
                aria-label="Delete this page"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.15s ease'
                }}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Right: Convert & Download Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onDownloadOrConvert}
            style={{
              backgroundColor: 'var(--primary-red, #e52424)',
              color: '#ffffff',
              border: 'none',
              padding: '11px 22px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(229, 36, 36, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={17} /> Convert & Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
