import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PenTool, Type, Upload, RotateCcw, RotateCw, Check, X, Sparkles } from 'lucide-react';

// ─── Helper: Trim transparent borders from canvas ─────────────────────────────
const cropSignatureCanvas = (canvas, padding = 10) => {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const { data } = imgData;

  let minX = w, minY = h, maxX = 0, maxY = 0;
  let hasInk = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 15) {
        hasInk = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasInk) return null;

  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropW = Math.min(w - cropX, (maxX - minX + 1) + padding * 2);
  const cropH = Math.min(h - cropY, (maxY - minY + 1) + padding * 2);

  const trimmed = document.createElement('canvas');
  trimmed.width = cropW;
  trimmed.height = cropH;
  const tCtx = trimmed.getContext('2d');
  tCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return {
    dataUrl: trimmed.toDataURL('image/png'),
    aspectRatio: cropW / cropH
  };
};

// ─── Preset Cursive Signature Styles ──────────────────────────────────────────
const SIGNATURE_STYLES = [
  {
    id: 'dancing',
    name: 'Classic Cursive',
    fontFamily: "'Dancing Script', cursive",
    weight: '700',
    sampleSize: 34
  },
  {
    id: 'caveat',
    name: 'Modern Flow',
    fontFamily: "'Caveat', cursive",
    weight: '700',
    sampleSize: 38
  },
  {
    id: 'greatvibes',
    name: 'Executive Script',
    fontFamily: "'Great Vibes', cursive",
    weight: '400',
    sampleSize: 36
  },
  {
    id: 'sacramento',
    name: 'Delicate Monoline',
    fontFamily: "'Sacramento', cursive",
    weight: '400',
    sampleSize: 38
  }
];

const SIGN_COLORS = [
  { label: 'Black', hex: '#0f172a' },
  { label: 'Navy Blue', hex: '#1e40af' },
  { label: 'Dark Red', hex: '#991b1b' }
];

export default function SignatureModal({
  isOpen,
  onClose,
  onApplySignature,
  initialName = 'Alex Johnson'
}) {
  const [tab, setTab] = useState('draw'); // 'draw' | 'type' | 'upload'
  
  // Draw State
  const canvasRef = useRef(null);
  const [drawColor, setDrawColor] = useState('#0f172a');
  const [penWidth, setPenWidth] = useState(3.5);
  const [hasDrawn, setHasDrawn] = useState(false);
  const isPaintingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  // Type State
  const [typedName, setTypedName] = useState(initialName);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const [typeColor, setTypeColor] = useState('#1e40af');

  // Upload State
  const [uploadDataUrl, setUploadDataUrl] = useState(null);
  const [uploadAspect, setUploadAspect] = useState(2.5);
  const [removeBg, setRemoveBg] = useState(true);
  const fileInputRef = useRef(null);

  // ── Setup Canvas on Open or Tab Switch ─────────────────────────────────────────
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 2;
    const rect = canvas.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = penWidth;
    }
  }, [drawColor, penWidth]);

  useEffect(() => {
    if (isOpen && tab === 'draw') {
      // Allow DOM rendering before measuring bounding rect
      const t = setTimeout(initCanvas, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, tab, initCanvas]);

  // Handle color change for draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = penWidth;
  }, [drawColor, penWidth]);

  // ── Freehand Canvas Drawing Handlers ──────────────────────────────────────────
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStartDraw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pt = getCanvasCoordinates(e);

    isPaintingRef.current = true;
    lastPointRef.current = pt;

    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineTo(pt.x, pt.y + 0.5); // dot on click
    ctx.stroke();
    setHasDrawn(true);
  };

  const handleMoveDraw = (e) => {
    if (!isPaintingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pt = getCanvasCoordinates(e);

    // Smooth midpoint quadratic curve
    const last = lastPointRef.current;
    const midX = (last.x + pt.x) / 2;
    const midY = (last.y + pt.y) / 2;

    ctx.quadraticCurveTo(last.x, last.y, midX, midY);
    ctx.stroke();

    lastPointRef.current = pt;
  };

  const handleEndDraw = () => {
    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.closePath();
    }
  };

  const handleClearDraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // ── Upload Image Handler with Optional White-Background Removal ───────────────
  const processUploadedImage = (dataUrl, shouldRemoveBg) => {
    const img = new Image();
    img.onload = () => {
      const natW = img.naturalWidth || 600;
      const natH = img.naturalHeight || 200;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = natW;
      offCanvas.height = natH;
      const ctx = offCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      if (shouldRemoveBg) {
        const imgData = ctx.getImageData(0, 0, natW, natH);
        const { data } = imgData;
        // Make light / paper white pixels transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Brightness threshold for paper background
          if (r > 215 && g > 215 && b > 215) {
            data[i + 3] = 0; // Transparent
          } else {
            // Keep ink dark and clean
            const brightness = (r + g + b) / 3;
            if (brightness > 180) {
              data[i + 3] = Math.max(0, Math.round((255 - brightness) * 3));
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      const cropped = cropSignatureCanvas(offCanvas, 10);
      if (cropped) {
        setUploadDataUrl(cropped.dataUrl);
        setUploadAspect(cropped.aspectRatio);
      } else {
        setUploadDataUrl(offCanvas.toDataURL('image/png'));
        setUploadAspect(natW / natH);
      }
    };
    img.src = dataUrl;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawUrl = ev.target.result;
      processUploadedImage(rawUrl, removeBg);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRotateUploadedImage = () => {
    if (!uploadDataUrl) return;
    const img = new Image();
    img.onload = () => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.naturalHeight || 200;
      offCanvas.height = img.naturalWidth || 600;
      const ctx = offCanvas.getContext('2d');
      ctx.translate(offCanvas.width / 2, offCanvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      const cropped = cropSignatureCanvas(offCanvas, 10);
      if (cropped) {
        setUploadDataUrl(cropped.dataUrl);
        setUploadAspect(cropped.aspectRatio);
      } else {
        setUploadDataUrl(offCanvas.toDataURL('image/png'));
        setUploadAspect(offCanvas.width / offCanvas.height);
      }
    };
    img.src = uploadDataUrl;
  };

  // ── Generate Cursive Typed Signature to DataURL ────────────────────────────────
  const generateTypedSignature = async () => {
    const style = SIGNATURE_STYLES[selectedStyleIndex] || SIGNATURE_STYLES[0];
    const text = typedName.trim() || 'Signature';

    // Wait for fonts to be ready
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch { /* proceed */ }
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${style.weight} 88px ${style.fontFamily}`;
    ctx.fillStyle = typeColor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    // Draw text with safety padding
    ctx.fillText(text, 60, canvas.height / 2);

    const cropped = cropSignatureCanvas(canvas, 12);
    return cropped || {
      dataUrl: canvas.toDataURL('image/png'),
      aspectRatio: canvas.width / canvas.height
    };
  };

  // ── Apply Signature to Document ───────────────────────────────────────────────
  const handleApply = async () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const cropped = cropSignatureCanvas(canvas, 10);
      if (cropped) {
        onApplySignature(cropped.dataUrl, cropped.aspectRatio);
      }
    } else if (tab === 'type') {
      const result = await generateTypedSignature();
      if (result) {
        onApplySignature(result.dataUrl, result.aspectRatio);
      }
    } else if (tab === 'upload') {
      if (uploadDataUrl) {
        onApplySignature(uploadDataUrl, uploadAspect);
      }
    }
  };

  if (!isOpen) return null;

  const isApplyDisabled =
    (tab === 'draw' && !hasDrawn) ||
    (tab === 'type' && !typedName.trim()) ||
    (tab === 'upload' && !uploadDataUrl);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: '1px solid #334155',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#f8fafc'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0f172a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}
            >
              <PenTool size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#f8fafc' }}>
                Create Your Signature
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Sign by drawing, typing in authentic cursive, or uploading an image
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Tabs Navigation ── */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #334155',
            backgroundColor: '#1e293b',
            padding: '4px 16px 0 16px',
            gap: '8px'
          }}
        >
          {[
            { id: 'draw', label: 'Draw Signature', icon: <PenTool size={15} /> },
            { id: 'type', label: 'Type Name (Cursive)', icon: <Type size={15} /> },
            { id: 'upload', label: 'Upload Image', icon: <Upload size={15} /> }
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '3px solid #ef4444' : '3px solid transparent',
                  color: active ? '#ffffff' : '#94a3b8',
                  fontWeight: active ? '700' : '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Modal Body Content ── */}
        <div style={{ padding: '20px 24px', flex: 1, minHeight: '300px' }}>
          {/* TAB 1: DRAW */}
          {tab === 'draw' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>Ink Color:</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {SIGN_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setDrawColor(c.hex)}
                        title={c.label}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: c.hex,
                          border: drawColor === c.hex ? '2px solid #38bdf8' : '1px solid #475569',
                          boxShadow: drawColor === c.hex ? '0 0 0 2px rgba(56,189,248,0.4)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      />
                    ))}
                  </div>

                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginLeft: '6px' }}>
                    Thickness:
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                      { label: 'Fine', val: 2 },
                      { label: 'Normal', val: 3.5 },
                      { label: 'Bold', val: 5 }
                    ].map((w) => (
                      <button
                        key={w.val}
                        type="button"
                        onClick={() => setPenWidth(w.val)}
                        style={{
                          backgroundColor: penWidth === w.val ? '#334155' : '#0f172a',
                          color: penWidth === w.val ? '#38bdf8' : '#94a3b8',
                          border: '1px solid #475569',
                          borderRadius: '5px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearDraw}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <RotateCcw size={13} />
                  Clear Pad
                </button>
              </div>

              {/* Drawing Pad Area */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '210px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '2px solid #cbd5e1',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.08)',
                  cursor: 'crosshair',
                  touchAction: 'none'
                }}
              >
                {/* Visual signature baseline guide in the background */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '30px',
                    right: '30px',
                    borderBottom: '1.5px dashed #cbd5e1',
                    pointerEvents: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    paddingBottom: '4px'
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '800' }}>✕</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px' }}>
                    SIGN HERE
                  </span>
                </div>

                {!hasDrawn && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      fontSize: '13px',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      fontWeight: '500'
                    }}
                  >
                    Draw your signature here with your mouse, finger, or stylus
                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleMoveDraw}
                  onMouseUp={handleEndDraw}
                  onMouseLeave={handleEndDraw}
                  onTouchStart={handleStartDraw}
                  onTouchMove={handleMoveDraw}
                  onTouchEnd={handleEndDraw}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block'
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: TYPE */}
          {tab === 'type' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                  Full Name:
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Enter your name..."
                    style={{
                      flex: 1,
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '15px',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                  />

                  {/* Color Selector */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {SIGN_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setTypeColor(c.hex)}
                        title={c.label}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: c.hex,
                          border: typeColor === c.hex ? '2px solid #38bdf8' : '1px solid #475569',
                          boxShadow: typeColor === c.hex ? '0 0 0 2px rgba(56,189,248,0.4)' : 'none',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '10px' }}>
                Select Cursive Handwriting Style:
              </div>

              {/* 4 Cursive Preview Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px'
                }}
              >
                {SIGNATURE_STYLES.map((style, idx) => {
                  const isSelected = selectedStyleIndex === idx;
                  return (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyleIndex(idx)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(37,99,235,0.1)' : '#0f172a',
                        border: isSelected ? '2px solid #3b82f6' : '1px solid #334155',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '85px',
                        boxShadow: isSelected ? '0 4px 14px rgba(37,99,235,0.2)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>
                          {style.name}
                        </span>
                        {isSelected && (
                          <span
                            style={{
                              backgroundColor: '#2563eb',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Check size={11} />
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontFamily: style.fontFamily,
                          fontWeight: style.weight,
                          fontSize: `${style.sampleSize}px`,
                          color: typeColor,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          padding: '4px 0'
                        }}
                      >
                        {typedName || 'Your Signature'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD */}
          {tab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {!uploadDataUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #475569',
                    borderRadius: '12px',
                    padding: '36px 20px',
                    textAlign: 'center',
                    backgroundColor: '#0f172a',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#475569';
                    e.currentTarget.style.backgroundColor = '#0f172a';
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px auto'
                    }}
                  >
                    <Upload size={22} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                    Click to upload signature image
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                    PNG, JPG, or WEBP (Max 5MB). Transparent signatures or scanned paper signatures supported.
                  </p>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '160px',
                      marginBottom: '12px',
                      boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06)'
                    }}
                  >
                    <img
                      src={uploadDataUrl}
                      alt="Uploaded Signature"
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e1' }}>
                      <input
                        type="checkbox"
                        checked={removeBg}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setRemoveBg(val);
                          processUploadedImage(uploadDataUrl, val);
                        }}
                        style={{ accentColor: '#2563eb' }}
                      />
                      <span>Automatically remove white paper background</span>
                    </label>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleRotateUploadedImage}
                        style={{
                          backgroundColor: '#0f172a',
                          color: '#a7f3d0',
                          border: '1px solid #059669',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        title="Rotate uploaded signature 90° clockwise"
                      >
                        <RotateCw size={13} />
                        Rotate 90°
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          backgroundColor: '#0f172a',
                          color: '#93c5fd',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Choose Different Image
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #334155',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={14} style={{ color: '#f59e0b' }} />
            <span>Signature can be freely moved and resized on any page</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #475569',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isApplyDisabled}
              onClick={handleApply}
              style={{
                backgroundColor: isApplyDisabled ? '#475569' : '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 20px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: isApplyDisabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: isApplyDisabled ? 'none' : '0 4px 14px rgba(239,68,68,0.4)',
                opacity: isApplyDisabled ? 0.6 : 1,
                transition: 'all 0.15s'
              }}
            >
              <PenTool size={15} />
              Insert Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
