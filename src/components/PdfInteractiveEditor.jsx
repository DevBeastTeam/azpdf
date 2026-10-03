import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Type, Edit3, Square, Stamp, Trash2, Download,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  FileText, ArrowLeft, Image as ImageIcon, Check, Move, Upload,
  Bold, Italic, Underline, Strikethrough,
  PenTool, Droplets, RotateCw, RotateCcw
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import SignatureModal from './SignatureModal';

// ─── hex → pdf-lib rgb ────────────────────────────────────────────────────────
const hexToRgbLib = (hex) => {
  if (!hex || hex === 'transparent') return null;
  const h = hex.replace('#', '');
  if (h.length === 6) return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255
  );
  return rgb(0, 0, 0);
};

// ─── toolbar format button style ──────────────────────────────────────────────
const fmtBtnStyle = (active) => ({
  backgroundColor: active ? '#2563eb' : '#1e293b',
  color: active ? '#ffffff' : '#cbd5e1',
  border: active ? '1px solid #3b82f6' : '1px solid #475569',
  borderRadius: 4,
  padding: '3px 7px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 700,
  transition: 'all 0.15s ease',
  boxShadow: active ? '0 0 0 1px #3b82f6' : 'none'
});

// ─── Floating Controls for Selected Items (Move, Delete, Resize) ─────────────
const FloatingItemControls = ({
  label,
  onDelete,
  onStartMove,
  onStartResize,
  onRotate,
  onStartRotate,
  rotation = 0,
  hasResize = true,
  hasRotate = false,
  isNearTop = false
}) => {
  return (
    <>
      {/* Floating Toolbar: Move + Label Badge + Delete */}
      <div
        className="no-drag-target"
        style={{
          position: 'absolute',
          ...(isNearTop ? { bottom: -34 } : { top: -34 }),
          left: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          zIndex: 130,
          pointerEvents: 'auto',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {onStartMove && (
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onStartMove(e);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onStartMove(e.touches[0]);
            }}
            style={{
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #475569',
              borderRadius: 5,
              padding: '2px 7px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
              whiteSpace: 'nowrap'
            }}
            title="Drag to reposition"
          >
            <Move size={12} />
            <span>Move</span>
          </div>
        )}

        {label && (
          <span
            style={{
              backgroundColor: '#334155',
              color: '#cbd5e1',
              padding: '2px 7px',
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            {label}
          </span>
        )}

        {onRotate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotate(label?.includes('Watermark') ? (((rotation || 0) + 45) % 360) : (((rotation || 0) + 90) % 360));
            }}
            style={{
              backgroundColor: '#1e293b',
              color: '#a7f3d0',
              border: '1px solid #059669',
              borderRadius: 5,
              padding: '2px 7px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
              whiteSpace: 'nowrap'
            }}
            title={label?.includes('Watermark') ? "Click to rotate +45°" : "Click to rotate +90° clockwise"}
          >
            <RotateCw size={11} />
            <span>{rotation !== undefined ? `${rotation}°` : 'Rotate'}</span>
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 5,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.45)',
              whiteSpace: 'nowrap'
            }}
            title="Delete item (or press Delete / Backspace key)"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        )}
      </div>

      {/* Top Rotation Handle with Connector Line */}
      {hasRotate && onStartRotate && (
        <>
          <div
            style={{
              position: 'absolute',
              top: -14,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 1.5,
              height: 14,
              backgroundColor: '#10b981',
              pointerEvents: 'none',
              zIndex: 134
            }}
          />
          <div
            className="no-drag-target"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onStartRotate(e);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onStartRotate(e.touches[0]);
            }}
            style={{
              position: 'absolute',
              top: -26,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 20,
              height: 20,
              backgroundColor: '#10b981',
              border: '2px solid #ffffff',
              borderRadius: '50%',
              cursor: 'grab',
              zIndex: 135,
              boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
            title="Drag to rotate freely (or click Rotate button)"
          >
            <RotateCw size={11} strokeWidth={2.5} />
          </div>
        </>
      )}

      {/* Resize Handle at Bottom-Right Corner */}
      {hasResize && onStartResize && (
        <div
          className="no-drag-target"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onStartResize(e);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            onStartResize(e.touches[0]);
          }}
          style={{
            position: 'absolute',
            bottom: -7,
            right: -7,
            width: 15,
            height: 15,
            backgroundColor: '#2563eb',
            border: '2px solid #ffffff',
            borderRadius: '50%',
            cursor: 'nwse-resize',
            zIndex: 130,
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            pointerEvents: 'auto'
          }}
          title="Drag to scale / resize"
        />
      )}
    </>
  );
};

// ─── PdfInteractiveEditor ─────────────────────────────────────────────────────
export default function PdfInteractiveEditor({ file, onSave, onCancel, mode = 'edit' }) {

  // ── page state ──────────────────────────────────────────────────────────────
  const [numPages,    setNumPages]    = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom,        setZoom]        = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth <= 480) return 0.55;
      if (window.innerWidth <= 768) return 0.8;
    }
    return 1.3;
  });

  // ── signature modal state ───────────────────────────────────────────────────
  const [showSignModal, setShowSignModal] = useState(mode === 'sign');

  // ── tool state ──────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState(mode === 'sign' ? 'sign' : 'text');  // 'text' | 'image' | 'draw' | 'whiteout' | 'stamp'

  // ── text tool settings ──────────────────────────────────────────────────────
  const [fontSize,   setFontSize]   = useState(14);
  const [textColor,  setTextColor]  = useState('#1e293b');
  const [fillColor,  setFillColor]  = useState('transparent');
  const [strokeWidth,setStrokeWidth]= useState(3);
  const [stampType,  setStampType]  = useState('APPROVED');

  // ── PDF text items extracted from PDF.js (grouped by line) ─────────────────
  // [ { id, pageNum, text, origText, x, y, w, h, fontSize, color } ]
  const [pdfTextItems, setPdfTextItems] = useState([]);

  // ── PDF image items extracted from PDF.js ──────────────────────────────────
  // [ { id, pageNum, x, y, w, h, origX, origY, origW, origH } ]
  const [pdfImageItems, setPdfImageItems] = useState([]);

  // ── user edits to existing PDF text ────────────────────────────────────────
  // key = item.id, value = { text, color, fontSize, deleted }
  const [textEdits, setTextEdits] = useState({});

  // ── user edits to existing PDF images ──────────────────────────────────────
  // key = item.id, value = { x, y, w, h, deleted }
  const [imageEdits, setImageEdits] = useState({});

  // ── new annotations added by user (text / image / shape / stamp / draw) ────
  // { [pageNum]: [ annotationItem ] }
  const [annotations, setAnnotations] = useState({});

  // ── draw state ──────────────────────────────────────────────────────────────
  const [isDrawing,   setIsDrawing]   = useState(false);
  const [currentPath, setCurrentPath] = useState([]);

  // ── selected item state ─────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState(null);

  // ── dragging & resizing state for annotations ───────────────────────────────
  const [draggingItem, setDraggingItem] = useState(null);
  const [resizingItem, setResizingItem] = useState(null);
  const [rotatingItem, setRotatingItem] = useState(null);

  // ── refs ────────────────────────────────────────────────────────────────────
  const pdfCanvasRef   = useRef(null);
  const drawCanvasRef  = useRef(null);
  const containerRef   = useRef(null);
  const pdfJsDocRef    = useRef(null);
  const renderTaskRef  = useRef(null);
  const imageInputRef  = useRef(null);

  const [pageDim, setPageDim]     = useState({ w: 595, h: 842 });
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // ── Load PDF via PDF.js ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();

        let data;
        if (file?.rawFile && typeof file.rawFile.arrayBuffer === 'function') {
          data = await file.rawFile.arrayBuffer();
        } else {
          setLoadError('No valid PDF file.');
          return;
        }
        const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;
        pdfJsDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setPdfLoaded(true);
      } catch (err) {
        if (!cancelled) setLoadError('Failed to load PDF: ' + err.message);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [file]);

  // ── Auto-initialize Watermark when in watermark mode ────────────────────────
  useEffect(() => {
    if (pdfLoaded && mode === 'watermark') {
      setAnnotations(prev => {
        const p1 = prev[1] || [];
        if (p1.some(it => it.type === 'watermark')) return prev;
        const id = 'wm-' + Date.now();
        setSelectedId(id);
        return {
          ...prev,
          1: [
            ...p1,
            {
              id,
              type: 'watermark',
              text: 'CONFIDENTIAL',
              x: 25,
              y: 40,
              fontSize: 50,
              rotation: 45,
              opacity: 0.35,
              color: '#ef4444',
              applyAllPages: true
            }
          ]
        };
      });
    }
  }, [pdfLoaded, mode]);

  // ── Render page (canvas) + extract grouped text lines ──────────────────────
  const renderPage = useCallback(async (pageNum, scale) => {
    if (!pdfJsDocRef.current) return;
    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      const page     = await pdfJsDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // size canvases
      [pdfCanvasRef, drawCanvasRef].forEach(ref => {
        if (ref.current) {
          ref.current.width  = viewport.width;
          ref.current.height = viewport.height;
        }
      });
      setPageDim({ w: viewport.width, h: viewport.height });

      // render PDF into canvas with high fidelity
      const task = page.render({
        canvasContext: pdfCanvasRef.current.getContext('2d'),
        viewport
      });
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;

      // ── extract text content with positions & group into lines ──────────────
      const tc = await page.getTextContent();
      const pdfjsLib = await import('pdfjs-dist');

      const rawTokens = tc.items.map((item, idx) => {
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const fs = Math.round(Math.sqrt(tx[0] ** 2 + tx[1] ** 2)) || 12;
        const fontH = item.height ? Math.abs(item.height * scale) : fs;
        const x  = tx[4];
        const y  = tx[5] - fontH;
        const w  = item.width * scale;
        const h  = fontH + 4;
        const fontName = item.fontName || 'sans-serif';
        const isBold = /bold|black|heavy|semibold|demibold/i.test(fontName);
        const isItalic = /italic|oblique/i.test(fontName);
        return {
          idx,
          str: item.str || '',
          x,
          y,
          w: Math.max(w, 2),
          h: Math.max(h, 12),
          fontSize: fs,
          fontName,
          bold: isBold,
          italic: isItalic
        };
      }).filter(i => i.str.length > 0);

      // Sort top-to-bottom, left-to-right
      rawTokens.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 4) return a.y - b.y;
        return a.x - b.x;
      });

      // Group adjacent tokens into coherent lines/phrases
      const groupedItems = [];
      let curLine = null;

      for (const tok of rawTokens) {
        if (!tok.str.trim()) {
          if (curLine) {
            curLine.text += tok.str;
            curLine.w = Math.max(curLine.w, (tok.x + tok.w) - curLine.x);
          }
          continue;
        }

        if (!curLine) {
          curLine = {
            id: `pdf-text-${pageNum}-${tok.idx}`,
            pageNum,
            text: tok.str,
            origText: tok.str,
            x: tok.x,
            y: tok.y,
            w: Math.max(tok.w, 15),
            h: Math.max(tok.h, 14),
            fontSize: tok.fontSize,
            color: '#000000',
            bold: tok.bold,
            italic: tok.italic,
            underline: false,
            strikethrough: false
          };
          continue;
        }

        const sameLine = Math.abs(tok.y - curLine.y) <= 5;
        const gap = tok.x - (curLine.x + curLine.w);
        const isAdjacent = sameLine && gap >= -4 && gap < Math.max(25, tok.fontSize * 1.5);

        if (isAdjacent) {
          const needSpace = gap > 1.5 && !curLine.text.endsWith(' ') && !tok.str.startsWith(' ');
          curLine.text += (needSpace ? ' ' : '') + tok.str;
          curLine.origText = curLine.text;
          curLine.w = Math.max(curLine.w, (tok.x + tok.w) - curLine.x);
          curLine.h = Math.max(curLine.h, tok.h);
          curLine.fontSize = Math.max(curLine.fontSize, tok.fontSize);
          curLine.bold = curLine.bold || tok.bold;
          curLine.italic = curLine.italic || tok.italic;
        } else {
          groupedItems.push(curLine);
          curLine = {
            id: `pdf-text-${pageNum}-${tok.idx}`,
            pageNum,
            text: tok.str,
            origText: tok.str,
            x: tok.x,
            y: tok.y,
            w: Math.max(tok.w, 15),
            h: Math.max(tok.h, 14),
            fontSize: tok.fontSize,
            color: '#000000',
            bold: tok.bold,
            italic: tok.italic,
            underline: false,
            strikethrough: false
          };
        }
      }
      if (curLine) groupedItems.push(curLine);

      setPdfTextItems(prev => {
        const others = prev.filter(i => i.pageNum !== pageNum);
        return [...others, ...groupedItems];
      });

      // ── extract embedded image positions from operator list ────────────
      try {
        const ops = await page.getOperatorList();
        const pdfjsLib2 = await import('pdfjs-dist');
        const OPS = pdfjsLib2.OPS;
        const extractedImages = [];
        // Walk the operator list tracking CTM (current transform matrix)
        const ctmStack = [viewport.transform.slice()];
        const getCTM = () => ctmStack[ctmStack.length - 1];

        for (let k = 0; k < ops.fnArray.length; k++) {
          const fn = ops.fnArray[k];
          const args = ops.argsArray[k];

          if (fn === OPS.save) {
            ctmStack.push(getCTM().slice());
          } else if (fn === OPS.restore) {
            if (ctmStack.length > 1) ctmStack.pop();
          } else if (fn === OPS.transform) {
            const prev = getCTM();
            const [a, b, c, d, e, f] = args;
            // Multiply prev * [a,b,c,d,e,f]
            const n = [
              prev[0]*a + prev[2]*b,
              prev[1]*a + prev[3]*b,
              prev[0]*c + prev[2]*d,
              prev[1]*c + prev[3]*d,
              prev[0]*e + prev[2]*f + prev[4],
              prev[1]*e + prev[3]*f + prev[5]
            ];
            ctmStack[ctmStack.length - 1] = n;
          } else if (fn === OPS.paintImageXObject || fn === OPS.paintJpegXObject) {
            const ctm = getCTM();
            // Image is drawn in a 1x1 unit square, CTM scales it
            const imgW = Math.abs(ctm[0]);
            const imgH = Math.abs(ctm[3]);
            const imgX = ctm[4];
            const imgY = ctm[5] - imgH; // PDF y is bottom of image in viewport space

            // Only include reasonably sized images (not tiny decorative elements)
            if (imgW > 15 && imgH > 15) {
              extractedImages.push({
                id: `pdf-img-${pageNum}-${k}`,
                pageNum,
                x: imgX,
                y: imgY,
                w: imgW,
                h: imgH,
                origX: imgX,
                origY: imgY,
                origW: imgW,
                origH: imgH
              });
            }
          }
        }

        setPdfImageItems(prev => {
          const others = prev.filter(i => i.pageNum !== pageNum);
          return [...others, ...extractedImages];
        });
      } catch (imgErr) {
        console.warn('Image extraction:', imgErr);
      }
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException')
        console.error('Render error:', err);
    }
  }, []);

  // ── Re-render when page/zoom changes ───────────────────────────────────────
  useEffect(() => {
    if (pdfLoaded) renderPage(currentPage, zoom);
  }, [pdfLoaded, currentPage, zoom, renderPage]);

  // ── Re-render draw canvas ──────────────────────────────────────────────────
  const redrawDraw = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const items = annotations[currentPage] || [];
    items.forEach(item => {
      if (item.type === 'draw' && item.points?.length > 1) {
        const isSel = item.id === selectedId;

        // If selected, draw an accent glow underneath
        if (isSel) {
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
          ctx.lineWidth   = (item.width || 3) + 8;
          ctx.lineCap = ctx.lineJoin = 'round';
          item.points.forEach((pt, i) =>
            i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
          ctx.stroke();
          ctx.restore();
        }

        ctx.beginPath();
        ctx.strokeStyle = item.color || '#2563eb';
        ctx.lineWidth   = item.width || 3;
        ctx.lineCap = ctx.lineJoin = 'round';
        item.points.forEach((pt, i) =>
          i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      }
    });
    if (isDrawing && currentPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = textColor;
      ctx.lineWidth   = strokeWidth;
      ctx.lineCap = ctx.lineJoin = 'round';
      currentPath.forEach((pt, i) =>
        i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    }
  }, [annotations, currentPage, isDrawing, currentPath, textColor, strokeWidth, selectedId]);

  useEffect(() => { redrawDraw(); }, [redrawDraw]);

  // ── Auto-cleanup empty text annotation boxes on deselect ─────────────────
  const prevSelectedIdRef = useRef(null);
  useEffect(() => {
    const prevId = prevSelectedIdRef.current;
    prevSelectedIdRef.current = selectedId;

    // When deselecting (or changing to different item), check if previous was an empty text box
    if (prevId && prevId !== selectedId && prevId.startsWith('ann-')) {
      setAnnotations(prev => {
        const updated = {};
        for (const [pageNum, items] of Object.entries(prev)) {
          updated[pageNum] = items.filter(item => {
            if (item.id === prevId && item.type === 'text') {
              const txt = (item.text || '').trim();
              // Remove ONLY if completely empty (user cleared all text)
              if (!txt) return false;
            }
            return true;
          });
        }
        return updated;
      });
    }
  }, [selectedId]);

  // ── Global Drag & Resize & Rotate Listener for Annotations ──────────────────
  useEffect(() => {
    if (!draggingItem && !resizingItem && !rotatingItem) return;

    const handleMouseMove = (e) => {
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

      if (rotatingItem) {
        const dx = clientX - rotatingItem.centerX;
        const dy = clientY - rotatingItem.centerY;
        const curAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        let deltaDeg = Math.round(curAngleDeg - rotatingItem.startAngle);
        let newRot = Math.round((rotatingItem.startRotation + deltaDeg) % 360);
        if (newRot < 0) newRot += 360;

        // Snap to cardinal angles within 4 degrees
        const snaps = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        for (const s of snaps) {
          if (Math.abs(newRot - s) <= 4) {
            newRot = s === 360 ? 0 : s;
            break;
          }
        }

        setAnnotations(prev => ({
          ...prev,
          [currentPage]: (prev[currentPage] || []).map(it =>
            it.id === rotatingItem.id ? { ...it, rotation: newRot } : it
          )
        }));
      } else if (draggingItem) {
        if (draggingItem.type === 'pdfImage') {
          // PDF image dragging uses pixel coordinates
          const dx = clientX - draggingItem.startX;
          const dy = clientY - draggingItem.startY;
          const newX = Math.max(0, Math.min(pageDim.w - 20, draggingItem.startItemX + dx));
          const newY = Math.max(0, Math.min(pageDim.h - 20, draggingItem.startItemY + dy));
          setImageEdits(prev => ({
            ...prev,
            [draggingItem.id]: { ...prev[draggingItem.id], x: newX, y: newY }
          }));
        } else if (draggingItem.type === 'draw') {
          // Draw stroke dragging: offset all points by dx, dy
          const dx = clientX - draggingItem.startX;
          const dy = clientY - draggingItem.startY;
          setAnnotations(prev => ({
            ...prev,
            [currentPage]: (prev[currentPage] || []).map(it => {
              if (it.id !== draggingItem.id) return it;
              return {
                ...it,
                points: (draggingItem.origPoints || []).map(p => ({
                  x: Math.round(p.x + dx),
                  y: Math.round(p.y + dy)
                }))
              };
            })
          }));
        } else {
          // Annotation dragging uses percentage coordinates
          const dx = ((clientX - draggingItem.startX) / pageDim.w) * 100;
          const dy = ((clientY - draggingItem.startY) / pageDim.h) * 100;
          const newX = Math.max(0, Math.min(95, +(draggingItem.startItemX + dx).toFixed(2)));
          const newY = Math.max(0, Math.min(95, +(draggingItem.startItemY + dy).toFixed(2)));
          setAnnotations(prev => ({
            ...prev,
            [currentPage]: (prev[currentPage] || []).map(it =>
              it.id === draggingItem.id ? { ...it, x: newX, y: newY } : it
            )
          }));
        }
      } else if (resizingItem) {
        if (resizingItem.type === 'pdfImage') {
          // PDF image resizing uses pixel coordinates with aspect ratio
          const dx = clientX - resizingItem.startX;
          const dy = clientY - resizingItem.startY;
          const { corner, startW, startH, startItemX, startItemY } = resizingItem;
          let newW = startW, newH = startH, newX = startItemX, newY = startItemY;
          const aspect = startW / startH;

          if (corner === 'se') {
            newW = Math.max(20, startW + dx);
            newH = newW / aspect;
          } else if (corner === 'ne') {
            newW = Math.max(20, startW + dx);
            newH = newW / aspect;
            newY = startItemY + (startH - newH);
          } else if (corner === 'sw') {
            newW = Math.max(20, startW - dx);
            newH = newW / aspect;
            newX = startItemX + (startW - newW);
          } else if (corner === 'nw') {
            newW = Math.max(20, startW - dx);
            newH = newW / aspect;
            newX = startItemX + (startW - newW);
            newY = startItemY + (startH - newH);
          }
          setImageEdits(prev => ({
            ...prev,
            [resizingItem.id]: { ...prev[resizingItem.id], x: newX, y: newY, w: newW, h: newH }
          }));
        } else if (resizingItem.type === 'draw') {
          // Draw stroke scaling
          const dx = clientX - resizingItem.startX;
          const startW = resizingItem.startW || 1;
          const scale = Math.max(0.1, (startW + dx) / startW);
          setAnnotations(prev => ({
            ...prev,
            [currentPage]: (prev[currentPage] || []).map(it => {
              if (it.id !== resizingItem.id) return it;
              return {
                ...it,
                points: (resizingItem.origPoints || []).map(p => ({
                  x: Math.round(resizingItem.minX + (p.x - resizingItem.minX) * scale),
                  y: Math.round(resizingItem.minY + (p.y - resizingItem.minY) * scale)
                }))
              };
            })
          }));
        } else if (resizingItem.type === 'stamp') {
          // Stamp scaling
          const dx = clientX - resizingItem.startX;
          const newScale = Math.max(0.4, Math.min(3.0, +(resizingItem.startScale + dx * 0.015).toFixed(2)));
          setAnnotations(prev => ({
            ...prev,
            [currentPage]: (prev[currentPage] || []).map(it =>
              it.id === resizingItem.id ? { ...it, scale: newScale } : it
            )
          }));
        } else if (resizingItem.type === 'text') {
          // Text resizing (adjusts fontSize)
          const dx = clientX - resizingItem.startX;
          const dy = clientY - resizingItem.startY;
          const delta = (dx + dy) * 0.5;
          const newFontSize = Math.max(8, Math.min(72, Math.round(resizingItem.startFontSize + delta * 0.15)));
          setAnnotations(prev => ({
            ...prev,
            [currentPage]: (prev[currentPage] || []).map(it =>
              it.id === resizingItem.id ? { ...it, fontSize: newFontSize } : it
            )
          }));
        } else if (resizingItem.type === 'watermark') {
          // Watermark scaling (adjusts fontSize)
          const dx = clientX - resizingItem.startX;
          const dy = clientY - resizingItem.startY;
          const delta = (dx + dy) * 0.5;
          const newFontSize = Math.max(16, Math.min(130, Math.round(resizingItem.startFontSize + delta * 0.25)));
          setAnnotations(prev => ({
            ...prev,
            [currentPage]: (prev[currentPage] || []).map(it =>
              it.id === resizingItem.id ? { ...it, fontSize: newFontSize } : it
            )
          }));
        } else {
          // shape (whiteout) or image
          const dw = ((clientX - resizingItem.startX) / pageDim.w) * 100;
          const dh = ((clientY - resizingItem.startY) / pageDim.h) * 100;
          const newW = Math.max(1, Math.min(95, +(resizingItem.startW + dw).toFixed(2)));
          const newH = resizingItem.aspectRatio
            ? +((newW / resizingItem.aspectRatio) * (pageDim.w / pageDim.h)).toFixed(2)
            : Math.max(0.5, Math.min(95, +(resizingItem.startH + dh).toFixed(2)));
          setAnnotations(prev => ({
            ...prev,
            [currentPage]: (prev[currentPage] || []).map(it =>
              it.id === resizingItem.id ? { ...it, w: newW, h: newH } : it
            )
          }));
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingItem(null);
      setResizingItem(null);
      setRotatingItem(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [draggingItem, resizingItem, rotatingItem, pageDim, currentPage]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const curPageTextItems   = pdfTextItems.filter(i => i.pageNum === currentPage);
  const curPageAnnotations = annotations[currentPage] || [];

  const updateAnnotations = useCallback((updater) =>
    setAnnotations(prev => ({
      ...prev,
      [currentPage]: typeof updater === 'function'
        ? updater(prev[currentPage] || [])
        : updater
    })), [currentPage]);

  // Selected item references
  const selectedExtractedItem = curPageTextItems.find(i => i.id === selectedId);
  const selectedExtractedEdit = selectedExtractedItem ? (textEdits[selectedExtractedItem.id] || {}) : null;
  const selectedAnnotation    = curPageAnnotations.find(i => i.id === selectedId);
  const selectedPdfImage      = pdfImageItems.find(i => i.id === selectedId && i.pageNum === currentPage);

  // ── Draw events ─────────────────────────────────────────────────────────────
  const getCanvasXY = (e) => {
    const r = drawCanvasRef.current.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  };
  const onMouseDown = (e) => {
    if (activeTool !== 'draw') return;
    setIsDrawing(true);
    setCurrentPath([getCanvasXY(e)]);
  };
  const onMouseMove = (e) => {
    if (!isDrawing || activeTool !== 'draw') return;
    setCurrentPath(p => [...p, getCanvasXY(e)]);
  };
  const onMouseUp = () => {
    if (!isDrawing || activeTool !== 'draw') return;
    setIsDrawing(false);
    if (currentPath.length > 1)
      updateAnnotations(p => [...p, {
        id: 'draw-' + Date.now(), type: 'draw',
        points: currentPath, color: textColor, width: strokeWidth
      }]);
    setCurrentPath([]);
  };

  // ── Click on page background → add new annotation ──────────────────────────
  const onPageBgClick = (e) => {
    if (activeTool === 'draw' || isDrawing) return;
    if (!e.target.classList.contains('page-bg-clickable')) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xPct = +(((e.clientX - rect.left) / rect.width) * 100).toFixed(2);
    const yPct = +(((e.clientY - rect.top)  / rect.height) * 100).toFixed(2);
    const id   = 'ann-' + Date.now();

    if (activeTool === 'text') {
      updateAnnotations(p => [...p, {
        id, type: 'text', x: xPct, y: yPct,
        text: 'New Text', fontSize, color: textColor,
        bg: fillColor === 'transparent' ? 'transparent' : fillColor
      }]);
      setSelectedId(id);
    } else if (activeTool === 'image') {
      imageInputRef.current?.click();
    } else if (activeTool === 'whiteout') {
      updateAnnotations(p => [...p, {
        id, type: 'shape', x: xPct, y: yPct,
        w: 25, h: 6, color: '#ffffff', border: '#e2e8f0', isWhiteout: true
      }]);
      setSelectedId(id);
    } else if (activeTool === 'stamp') {
      const STAMP_COLORS = {
        APPROVED:'#16a34a', CONFIDENTIAL:'#dc2626',
        REJECTED:'#991b1b', COMPLETED:'#2563eb', DRAFT:'#d97706'
      };
      updateAnnotations(p => [...p, {
        id, type: 'stamp', x: xPct, y: yPct,
        stampText: stampType, color: STAMP_COLORS[stampType] || '#16a34a'
      }]);
      setSelectedId(id);
    }
  };

  // ── Image Upload Handler ────────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const img = new window.Image();
      img.onload = () => {
        const aspect = (img.naturalWidth && img.naturalHeight)
          ? img.naturalWidth / img.naturalHeight
          : 1;
        const wPct = 28;
        const hPct = +((wPct / aspect) * (pageDim.w / pageDim.h)).toFixed(2);
        const id = 'img-' + Date.now();

        updateAnnotations(p => [
          ...p,
          {
            id,
            type: 'image',
            x: 36,
            y: 30,
            w: wPct,
            h: Math.min(50, Math.max(6, hPct)),
            src: dataUrl,
            aspectRatio: aspect,
            name: uploadedFile.name,
            rotation: 0
          }
        ]);
        setSelectedId(id);
        setActiveTool('image');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(uploadedFile);
    e.target.value = '';
  };

  // ── Signature Apply Handler ─────────────────────────────────────────────────
  const handleApplySignature = (dataUrl, aspect = 2.5) => {
    const wPct = 26;
    const safeAspect = aspect && aspect > 0 ? aspect : 2.5;
    const hPct = +((wPct / safeAspect) * (pageDim.w / pageDim.h)).toFixed(2);
    const id = 'sig-' + Date.now();

    updateAnnotations(p => [
      ...p,
      {
        id,
        type: 'image',
        isSignature: true,
        x: 37,
        y: 45,
        w: wPct,
        h: Math.min(45, Math.max(5, hPct)),
        src: dataUrl,
        aspectRatio: safeAspect,
        name: 'Signature',
        rotation: 0
      }
    ]);
    setSelectedId(id);
    setShowSignModal(false);
  };

  // ── Watermark Add Handler ───────────────────────────────────────────────────
  const addWatermark = (customText = 'CONFIDENTIAL') => {
    const id = 'wm-' + Date.now();
    updateAnnotations(p => [
      ...p,
      {
        id,
        type: 'watermark',
        text: customText,
        x: 25,
        y: 40,
        fontSize: 50,
        rotation: 45,
        opacity: 0.35,
        color: '#ef4444',
        applyAllPages: true
      }
    ]);
    setSelectedId(id);
    setActiveTool('watermark');
  };

  // ── Edit existing PDF text item ─────────────────────────────────────────────
  const editPdfText = (item, newText) => {
    setTextEdits(prev => ({
      ...prev,
      [item.id]: { ...prev[item.id], text: newText }
    }));
  };

  const deletePdfText = (item) => {
    setTextEdits(prev => ({
      ...prev,
      [item.id]: { ...prev[item.id], deleted: true }
    }));
  };

  // ── Universal Delete for Selected Item ──────────────────────────────────────
  const deleteSelectedItem = useCallback(() => {
    if (!selectedId) return;

    // 1) Extracted PDF text
    const textItem = pdfTextItems.find(i => i.id === selectedId && i.pageNum === currentPage);
    if (textItem) {
      deletePdfText(textItem);
      setSelectedId(null);
      return;
    }

    // 2) Extracted PDF image
    const pdfImg = pdfImageItems.find(i => i.id === selectedId && i.pageNum === currentPage);
    if (pdfImg) {
      setImageEdits(prev => ({
        ...prev,
        [pdfImg.id]: { ...prev[pdfImg.id], deleted: true }
      }));
      setSelectedId(null);
      return;
    }

    // 3) Annotation item (text, image, shape, stamp, draw)
    updateAnnotations(p => p.filter(i => i.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, pdfTextItems, currentPage, pdfImageItems, updateAnnotations]);

  const deleteAnnotation = deleteSelectedItem;

  // ── Global Keyboard Shortcuts (Delete, Backspace, Escape) ──────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeEl = document.activeElement;
        const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

        if (isInput) {
          // If typing in an input: delete only if text is empty or fully selected
          const val = activeEl.value || '';
          const isAllSelected = activeEl.selectionStart === 0 && activeEl.selectionEnd === val.length;
          if (!val.trim() || isAllSelected) {
            e.preventDefault();
            deleteSelectedItem();
          }
          return;
        }

        // If not typing in an input and an item is selected on the canvas
        if (selectedId) {
          e.preventDefault();
          deleteSelectedItem();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteSelectedItem]);

  const clearPage = () => {
    if (!window.confirm('Clear all modifications on this page?')) return;
    updateAnnotations([]);
    setTextEdits(prev => {
      const next = { ...prev };
      curPageTextItems.forEach(i => { delete next[i.id]; });
      return next;
    });
    setSelectedId(null);
  };

  // ── Save to PDF ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      let pdfDoc = null;
      if (file?.rawFile && typeof file.rawFile.arrayBuffer === 'function') {
        try {
          pdfDoc = await PDFDocument.load(await file.rawFile.arrayBuffer(), { ignoreEncryption: true });
        } catch { /* fallback */ }
      }
      if (!pdfDoc) {
        pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([612, 792]);
      }

      const fontBold       = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular    = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontItalic     = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const fontBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
      const pages          = pdfDoc.getPages();

      // Helper: pick font based on bold/italic
      const pickFont = (b, i) => {
        if (b && i) return fontBoldItalic;
        if (b)      return fontBold;
        if (i)      return fontItalic;
        return fontRegular;
      };

      const allPageNums = Array.from(new Set([
        ...Object.keys(annotations).map(Number),
        ...pdfTextItems.map(i => i.pageNum),
        ...pdfImageItems.map(i => i.pageNum)
      ]));

      const processedWatermarks = new Set();

      for (const pn of allPageNums) {
        const pg = pages[pn - 1] || pages[0];
        if (!pg) continue;
        const { width: pW, height: pH } = pg.getSize();
        const cW = pageDim.w, cH = pageDim.h;
        const scaleX = pW / cW;
        const scaleY = pH / cH;

        // 1) Edited / deleted existing PDF text
        const pageTextItems = pdfTextItems.filter(i => i.pageNum === pn);
        for (const item of pageTextItems) {
          const edit = textEdits[item.id];
          if (!edit && !item._modified) continue;

          const pdfX = item.x * scaleX;
          const pdfW = item.w * scaleX;
          const pdfH = item.h * scaleY;
          // In PDF coordinates (0,0) is bottom-left
          const pdfYBottom = pH - (item.y + item.h) * scaleY;

          // White-out the original position on PDF
          pg.drawRectangle({
            x: Math.max(0, pdfX - 2),
            y: Math.max(0, pdfYBottom - 2),
            width:  Math.min(pW - pdfX + 4, pdfW + 6),
            height: Math.min(pH - pdfYBottom + 4, pdfH + 4),
            color: rgb(1, 1, 1)
          });

          // If not deleted, draw the replacement text with formatting
          if (!edit?.deleted) {
            const newText = edit?.text ?? item.text;
            if (newText && newText.trim()) {
              const itemFs = edit?.fontSize || item.fontSize || 12;
              const pdfFs = Math.max(6, itemFs * scaleY);
              const baselineY = pdfYBottom + (pdfH - pdfFs) * 0.35 + 1;
              const textColor = hexToRgbLib(edit?.color || item.color) || rgb(0, 0, 0);
              const b = edit?.bold ?? item.bold ?? false;
              const i = edit?.italic ?? item.italic ?? false;
              const u = edit?.underline ?? item.underline ?? false;
              const s = edit?.strikethrough ?? item.strikethrough ?? false;
              const selectedFont = pickFont(b, i);

              pg.drawText(newText, {
                x: Math.max(2, pdfX),
                y: Math.max(2, baselineY),
                size: pdfFs,
                font: selectedFont,
                color: textColor
              });

              // Draw underline
              if (u) {
                const textW = selectedFont.widthOfTextAtSize(newText, pdfFs);
                pg.drawLine({
                  start: { x: Math.max(2, pdfX), y: Math.max(1, baselineY - pdfFs * 0.15) },
                  end:   { x: Math.max(2, pdfX) + textW, y: Math.max(1, baselineY - pdfFs * 0.15) },
                  thickness: Math.max(0.5, pdfFs * 0.06),
                  color: textColor
                });
              }

              // Draw strikethrough
              if (s) {
                const textW = selectedFont.widthOfTextAtSize(newText, pdfFs);
                const midY = baselineY + pdfFs * 0.32;
                pg.drawLine({
                  start: { x: Math.max(2, pdfX), y: midY },
                  end:   { x: Math.max(2, pdfX) + textW, y: midY },
                  thickness: Math.max(0.5, pdfFs * 0.05),
                  color: textColor
                });
              }
            }
          }
        }

        // 1b) Edited / deleted existing PDF images
        const pageImageItems = pdfImageItems.filter(i => i.pageNum === pn);
        for (const item of pageImageItems) {
          const edit = imageEdits[item.id];
          if (!edit) continue;

          // White-out the ORIGINAL image position
          const origPdfX = item.origX * scaleX;
          const origPdfW = item.origW * scaleX;
          const origPdfH = item.origH * scaleY;
          const origPdfYBottom = pH - (item.origY + item.origH) * scaleY;

          pg.drawRectangle({
            x: Math.max(0, origPdfX - 1),
            y: Math.max(0, origPdfYBottom - 1),
            width:  Math.min(pW - origPdfX + 2, origPdfW + 2),
            height: Math.min(pH - origPdfYBottom + 2, origPdfH + 2),
            color: rgb(1, 1, 1)
          });

          // If not deleted, re-draw the image at new position/size
          if (!edit.deleted) {
            // Capture the original image region from the PDF canvas
            try {
              const canvas = pdfCanvasRef.current;
              if (canvas) {
                const capCanvas = document.createElement('canvas');
                capCanvas.width  = Math.round(item.origW);
                capCanvas.height = Math.round(item.origH);
                const capCtx = capCanvas.getContext('2d');
                capCtx.drawImage(
                  canvas,
                  Math.round(item.origX), Math.round(item.origY),
                  Math.round(item.origW), Math.round(item.origH),
                  0, 0,
                  Math.round(item.origW), Math.round(item.origH)
                );
                const dataUrl = capCanvas.toDataURL('image/png');
                const base64 = dataUrl.split(',')[1];
                if (base64) {
                  const bin = atob(base64);
                  const bytes = new Uint8Array(bin.length);
                  for (let b = 0; b < bin.length; b++) bytes[b] = bin.charCodeAt(b);
                  const embImg = await pdfDoc.embedPng(bytes);

                  const newX = (edit.x ?? item.x) * scaleX;
                  const newW = (edit.w ?? item.w) * scaleX;
                  const newH = (edit.h ?? item.h) * scaleY;
                  const newYBottom = pH - ((edit.y ?? item.y) + (edit.h ?? item.h)) * scaleY;

                  pg.drawImage(embImg, {
                    x: Math.max(0, newX),
                    y: Math.max(0, newYBottom),
                    width:  newW,
                    height: newH
                  });
                }
              }
            } catch (capErr) {
              console.warn('Image capture/re-draw failed:', capErr);
            }
          }
        }

        // 2) New annotations (text, image, shape, stamp, draw)
        const pageAnnotations = annotations[pn] || [];
        for (const item of pageAnnotations) {
          if (item.type === 'image' && item.src) {
            try {
              let embeddedImg = null;
              const base64Data = item.src.split(',')[1];
              if (base64Data) {
                const binStr = atob(base64Data);
                const bytes = new Uint8Array(binStr.length);
                for (let b = 0; b < binStr.length; b++) bytes[b] = binStr.charCodeAt(b);

                if (item.src.startsWith('data:image/png')) {
                  embeddedImg = await pdfDoc.embedPng(bytes);
                } else if (item.src.startsWith('data:image/jpeg') || item.src.startsWith('data:image/jpg')) {
                  embeddedImg = await pdfDoc.embedJpg(bytes);
                } else {
                  // Fallback: convert via offscreen canvas to PNG
                  const offCanvas = document.createElement('canvas');
                  const offImg = new window.Image();
                  await new Promise((res, rej) => {
                    offImg.onload = res;
                    offImg.onerror = rej;
                    offImg.src = item.src;
                  });
                  offCanvas.width = offImg.naturalWidth || 300;
                  offCanvas.height = offImg.naturalHeight || 300;
                  const ctx = offCanvas.getContext('2d');
                  ctx.drawImage(offImg, 0, 0);
                  const pngUrl = offCanvas.toDataURL('image/png');
                  const pngBase64 = pngUrl.split(',')[1];
                  const pngBin = atob(pngBase64);
                  const pngBytes = new Uint8Array(pngBin.length);
                  for (let b = 0; b < pngBin.length; b++) pngBytes[b] = pngBin.charCodeAt(b);
                  embeddedImg = await pdfDoc.embedPng(pngBytes);
                }
              }

              if (embeddedImg) {
                const angleDeg = item.rotation || 0;
                const wPdf = (item.w / 100) * pW;
                const hPdf = (item.h / 100) * pH;

                if (!angleDeg) {
                  const xPdf = (item.x / 100) * pW;
                  const yPdf = pH - ((item.y / 100) * pH) - hPdf;
                  pg.drawImage(embeddedImg, {
                    x: Math.max(0, xPdf),
                    y: Math.max(0, yPdf),
                    width: Math.min(pW - xPdf, wPdf),
                    height: Math.min(pH - yPdf, hPdf)
                  });
                } else {
                  // In CSS, rotation is clockwise around center by angleDeg:
                  // Center in PDF coordinates:
                  const cxPdf = ((item.x / 100) * pW) + (wPdf / 2);
                  const cyPdf = pH - (((item.y / 100) * pH) + (hPdf / 2));

                  // In PDF coordinates, clockwise in screen is negative angle:
                  const rad = (-angleDeg * Math.PI) / 180;
                  const cos = Math.cos(rad);
                  const sin = Math.sin(rad);

                  const rotBlX = -(wPdf / 2) * cos + (hPdf / 2) * sin;
                  const rotBlY = -(wPdf / 2) * sin - (hPdf / 2) * cos;

                  pg.drawImage(embeddedImg, {
                    x: cxPdf + rotBlX,
                    y: cyPdf + rotBlY,
                    width: wPdf,
                    height: hPdf,
                    rotate: degrees(-angleDeg)
                  });
                }
              }
            } catch (imgErr) {
              console.error('Image embedding error:', imgErr);
            }
          } else if (item.type === 'text') {
            const xPdf = (item.x / 100) * pW;
            const yPdf = pH - ((item.y / 100) * pH) - (item.fontSize || 14);
            if (item.bg && item.bg !== 'transparent') {
              pg.drawRectangle({
                x: Math.max(0, xPdf - 3), y: Math.max(0, yPdf - 3),
                width:  Math.min(pW - xPdf, (item.text?.length || 4) * (item.fontSize * 0.6) + 10),
                height: (item.fontSize || 14) + 8,
                color: hexToRgbLib(item.bg) || rgb(1, 1, 0.8)
              });
            }
            pg.drawText(item.text || '', {
              x: Math.max(4, xPdf), y: Math.max(4, yPdf),
              size: item.fontSize || 14, font: fontRegular,
              color: hexToRgbLib(item.color) || rgb(0, 0, 0)
            });
          } else if (item.type === 'shape') {
            const xPdf = (item.x / 100) * pW;
            const wPdf = (item.w / 100) * pW;
            const hPdf = (item.h / 100) * pH;
            pg.drawRectangle({
              x: Math.max(0, xPdf), y: Math.max(0, pH - ((item.y / 100) * pH) - hPdf),
              width: wPdf, height: hPdf,
              color: hexToRgbLib(item.color) || rgb(1, 1, 1),
              borderColor: hexToRgbLib(item.border) || rgb(0.9, 0.9, 0.9),
              borderWidth: 1
            });
          } else if (item.type === 'stamp') {
            const scMultiplier = item.scale || 1;
            const baseW = 130 * scMultiplier;
            const baseH = 30 * scMultiplier;
            const xPdf = (item.x / 100) * pW;
            const yPdf = pH - ((item.y / 100) * pH) - baseH;
            const sc   = hexToRgbLib(item.color) || rgb(0.1, 0.6, 0.2);
            pg.drawRectangle({
              x: Math.max(0, xPdf),
              y: Math.max(0, yPdf),
              width: baseW,
              height: baseH,
              color: rgb(1, 1, 1),
              borderColor: sc,
              borderWidth: 2 * scMultiplier
            });
            pg.drawText(item.stampText || 'APPROVED', {
              x: Math.max(0, xPdf + 8 * scMultiplier),
              y: Math.max(0, yPdf + 8 * scMultiplier),
              size: 12 * scMultiplier,
              font: fontBold,
              color: sc
            });
          } else if (item.type === 'draw' && item.points?.length > 1) {
            const dc = hexToRgbLib(item.color) || rgb(0.1, 0.4, 0.9);
            for (let k = 0; k < item.points.length - 1; k++) {
              const p1 = item.points[k], p2 = item.points[k + 1];
              pg.drawLine({
                start: { x: (p1.x / cW) * pW, y: pH - (p1.y / cH) * pH },
                end:   { x: (p2.x / cW) * pW, y: pH - (p2.y / cH) * pH },
                thickness: item.width || 2, color: dc
              });
            }
          } else if (item.type === 'watermark') {
            if (!processedWatermarks.has(item.id)) {
              processedWatermarks.add(item.id);
              const rot = item.rotation !== undefined ? item.rotation : 45;
              const op = item.opacity !== undefined ? item.opacity : 0.35;
              const col = hexToRgbLib(item.color) || rgb(0.85, 0.15, 0.15);
              const fs = item.fontSize || 48;
              const targetPages = item.applyAllPages !== false ? pages : [pg];

              for (const targetPg of targetPages) {
                const { width: tw, height: th } = targetPg.getSize();
                const textStr = item.text || 'CONFIDENTIAL';
                const textW = fontBold.widthOfTextAtSize(textStr, fs);
                const textH = fontBold.heightAtSize(fs);
                const cx = (item.x / 100) * tw + textW / 2;
                const cy = th - ((item.y / 100) * th) - textH / 2;
                const angleDeg = -rot; // In PDF-lib, counter-clockwise is positive, CSS is clockwise
                const rad = (angleDeg * Math.PI) / 180;
                const u0 = -textW / 2;
                const v0 = -textH / 2;
                const drawX = cx + (u0 * Math.cos(rad) - v0 * Math.sin(rad));
                const drawY = cy + (u0 * Math.sin(rad) + v0 * Math.cos(rad));

                targetPg.drawText(textStr, {
                  x: drawX,
                  y: drawY,
                  size: fs,
                  font: fontBold,
                  color: col,
                  opacity: op,
                  rotate: degrees(angleDeg)
                });
              }
            }
          }
        }
      }

      const bytes = await pdfDoc.save();
      const blob  = new Blob([bytes], { type: 'application/pdf' });
      const suffix = mode === 'sign' ? '_signed.pdf' : mode === 'watermark' ? '_watermarked.pdf' : '_edited.pdf';
      const fname = file?.name 
        ? file.name.replace(/\.pdf$/i, suffix) 
        : (mode === 'sign' ? 'signed.pdf' : mode === 'watermark' ? 'watermarked.pdf' : 'edited.pdf');
      onSave(blob, fname);
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
  };

  // ── colour palette ──────────────────────────────────────────────────────────
  const COLORS = ['#000000','#1e293b','#ef4444','#2563eb','#16a34a','#d97706','#7c3aed','#ffffff'];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ width:'100%', minHeight:'90vh', display:'flex', flexDirection:'column',
      backgroundColor:'#0f172a', borderRadius:16, overflow:'hidden',
      boxShadow:'0 20px 50px rgba(0,0,0,.5)',
      fontFamily:'system-ui,-apple-system,sans-serif', color:'#f8fafc' }}>

      {/* Hidden image file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div style={{ padding:'12px 20px', backgroundColor:'#1e293b', borderBottom:'1px solid #334155',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onCancel} style={S.btn('#334155','#94a3b8')}>
            <ArrowLeft size={15}/> Back
          </button>
          <div style={{ width:1, height:22, background:'#475569' }}/>
          <FileText size={18} style={{ color:'#ef4444' }}/>
          <span style={{ fontWeight:700, fontSize:14, maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {mode === 'watermark' ? '💧 Watermark PDF — ' : mode === 'sign' ? '✍️ Sign PDF — ' : ''}{file?.name || 'document.pdf'}
          </span>
          {loadError && <span style={{ color:'#f87171', fontSize:12 }}>⚠ {loadError}</span>}
          {!pdfLoaded && !loadError && <span style={{ color:'#94a3b8', fontSize:12, animation:'pulse 1s infinite' }}>Loading PDF…</span>}
        </div>

        {/* Tool bar */}
        <div style={{ display:'flex', backgroundColor:'#0f172a', padding:4, borderRadius:10,
          border:'1px solid #334155', gap:3 }}>
          {[
            ...(mode === 'watermark' ? [{ id:'watermark', label:'Watermark', icon:<Droplets size={15}/> }] : []),
            ...(mode === 'sign' ? [{ id:'sign', label:'Signature', icon:<PenTool size={15}/> }] : []),
            { id:'text',     label:'Add Text',   icon:<Type size={15}/> },
            { id:'image',    label:'Add Image',  icon:<ImageIcon size={15}/> },
            { id:'draw',     label:'Draw',       icon:<Edit3 size={15}/> },
            { id:'whiteout', label:'Whiteout',   icon:<Square size={15}/> },
            { id:'stamp',    label:'Stamp',      icon:<Stamp size={15}/> },
            ...(mode !== 'watermark' ? [{ id:'watermark', label:'Watermark', icon:<Droplets size={15}/> }] : []),
            ...(mode !== 'sign' ? [{ id:'sign', label:'Signature', icon:<PenTool size={15}/> }] : []),
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'sign') {
                  setShowSignModal(true);
                } else if (t.id === 'watermark') {
                  addWatermark();
                } else if (t.id === 'image') {
                  imageInputRef.current?.click();
                } else {
                  setActiveTool(prev => prev === t.id ? null : t.id);
                  setSelectedId(null);
                }
              }}
              style={{
                display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:8, border:'none',
                backgroundColor: (activeTool===t.id || (t.id==='sign' && mode==='sign') || (t.id==='watermark' && mode==='watermark')) ? '#ef4444':'transparent',
                color: (activeTool===t.id || (t.id==='sign' && mode==='sign') || (t.id==='watermark' && mode==='watermark')) ? '#fff':'#94a3b8',
                fontWeight:700, fontSize:12, cursor:'pointer', transition:'all .15s'
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <button onClick={handleSave} style={{
          display:'flex', alignItems:'center', gap:7, backgroundColor:'#ef4444',
          color:'#fff', border:'none', padding:'10px 20px', borderRadius:10,
          fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 4px 14px rgba(239,68,68,.35)'
        }}>
          <Download size={17}/> {mode === 'watermark' ? 'Apply & Download Watermarked PDF' : mode === 'sign' ? 'Sign & Download PDF' : 'Apply & Download'}
        </button>
      </div>

      {/* ── Property Bar ────────────────────────────────────────────────── */}
      <div style={{ padding:'8px 20px', backgroundColor:'#1e293b', borderBottom:'1px solid #334155',
        display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', fontSize:12, minHeight: 46 }}>

        {/* State S: Sign Mode Guide Banner when idle */}
        {mode === 'sign' && !selectedExtractedItem && !selectedAnnotation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd' }}>
            <PenTool size={15} style={{ color: '#38bdf8' }} />
            <span style={{ fontWeight: '600', fontSize: '12px' }}>
              Signing Mode: Click <strong>Signature</strong> to draw, type, or upload your signature, then drag and resize it into position.
            </span>
            <button
              onClick={() => setShowSignModal(true)}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                marginLeft: '6px'
              }}
            >
              ✍️ Open Signature Pad
            </button>
          </div>
        )}

        {/* State W: Watermark Mode Guide Banner when idle */}
        {mode === 'watermark' && !selectedExtractedItem && !selectedAnnotation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd' }}>
            <Droplets size={15} style={{ color: '#38bdf8' }} />
            <span style={{ fontWeight: '600', fontSize: '12px' }}>
              Watermark Mode: Click or drag watermark to reposition, use corner handle to scale, or customize text &amp; opacity.
            </span>
            <button
              onClick={() => addWatermark()}
              style={{
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                marginLeft: '6px'
              }}
            >
              + Add Watermark
            </button>
          </div>
        )}

        {/* State A: Selected Extracted PDF Text */}
        {selectedExtractedItem && !selectedExtractedEdit?.deleted && (
          <>
            <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '3px 9px', borderRadius: 5, fontWeight: 700, fontSize: 11 }}>
              Editing Text Line
            </span>
            <Lbl>Size:</Lbl>
            <select
              value={selectedExtractedEdit.fontSize || selectedExtractedItem.fontSize || 14}
              onChange={(e) => setTextEdits(prev => ({
                ...prev,
                [selectedExtractedItem.id]: { ...prev[selectedExtractedItem.id], fontSize: +e.target.value }
              }))}
              style={S.sel}
            >
              {[9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 42].map(s => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
            <Lbl>Color:</Lbl>
            {COLORS.map(c => (
              <Dot
                key={c}
                c={c}
                active={(selectedExtractedEdit.color || selectedExtractedItem.color || '#000000') === c}
                onClick={() => setTextEdits(prev => ({
                  ...prev,
                  [selectedExtractedItem.id]: { ...prev[selectedExtractedItem.id], color: c }
                }))}
              />
            ))}
            <div style={{ width: 1, height: 20, background: '#475569', margin: '0 2px' }} />
            <Lbl>Format:</Lbl>
            <div style={{ display: 'flex', gap: 3 }}>
              <button
                onClick={() => {
                  const cur = selectedExtractedEdit.bold ?? selectedExtractedItem.bold ?? false;
                  setTextEdits(prev => ({
                    ...prev,
                    [selectedExtractedItem.id]: { ...prev[selectedExtractedItem.id], bold: !cur }
                  }));
                }}
                style={fmtBtnStyle(selectedExtractedEdit.bold ?? selectedExtractedItem.bold ?? false)}
                title="Bold"
              >
                <Bold size={13} />
              </button>
              <button
                onClick={() => {
                  const cur = selectedExtractedEdit.italic ?? selectedExtractedItem.italic ?? false;
                  setTextEdits(prev => ({
                    ...prev,
                    [selectedExtractedItem.id]: { ...prev[selectedExtractedItem.id], italic: !cur }
                  }));
                }}
                style={fmtBtnStyle(selectedExtractedEdit.italic ?? selectedExtractedItem.italic ?? false)}
                title="Italic"
              >
                <Italic size={13} />
              </button>
              <button
                onClick={() => {
                  const cur = selectedExtractedEdit.underline ?? selectedExtractedItem.underline ?? false;
                  setTextEdits(prev => ({
                    ...prev,
                    [selectedExtractedItem.id]: { ...prev[selectedExtractedItem.id], underline: !cur }
                  }));
                }}
                style={fmtBtnStyle(selectedExtractedEdit.underline ?? selectedExtractedItem.underline ?? false)}
                title="Underline"
              >
                <Underline size={13} />
              </button>
              <button
                onClick={() => {
                  const cur = selectedExtractedEdit.strikethrough ?? selectedExtractedItem.strikethrough ?? false;
                  setTextEdits(prev => ({
                    ...prev,
                    [selectedExtractedItem.id]: { ...prev[selectedExtractedItem.id], strikethrough: !cur }
                  }));
                }}
                style={fmtBtnStyle(selectedExtractedEdit.strikethrough ?? selectedExtractedItem.strikethrough ?? false)}
                title="Strikethrough"
              >
                <Strikethrough size={13} />
              </button>
            </div>
            <button
              onClick={() => deletePdfText(selectedExtractedItem)}
              style={{ ...S.miniBtn, backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={12} /> Delete Text
            </button>
            <button
              onClick={() => setSelectedId(null)}
              style={{ ...S.miniBtn, backgroundColor: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Check size={12} /> Done
            </button>
          </>
        )}

        {/* State A2: Selected PDF Image */}
        {selectedPdfImage && !(imageEdits[selectedPdfImage.id]?.deleted) && (() => {
          const imgEdit = imageEdits[selectedPdfImage.id] || {};
          const imgW = Math.round(imgEdit.w ?? selectedPdfImage.w);
          const imgH = Math.round(imgEdit.h ?? selectedPdfImage.h);
          return (
            <>
              <span style={{ backgroundColor: '#7c3aed', color: '#fff', padding: '3px 9px', borderRadius: 5, fontWeight: 700, fontSize: 11 }}>
                📷 PDF Image
              </span>
              <Lbl>Size:</Lbl>
              <span style={{ color: '#94a3b8', fontSize: 11 }}>{imgW} × {imgH}px</span>
              <Lbl>Scale:</Lbl>
              <input
                type="range"
                min={20}
                max={200}
                value={Math.round((imgW / selectedPdfImage.origW) * 100)}
                onChange={(e) => {
                  const pct = +e.target.value / 100;
                  const newW = selectedPdfImage.origW * pct;
                  const newH = selectedPdfImage.origH * pct;
                  setImageEdits(prev => ({
                    ...prev,
                    [selectedPdfImage.id]: {
                      ...prev[selectedPdfImage.id],
                      w: newW,
                      h: newH
                    }
                  }));
                }}
                style={{ width: 80, accentColor: '#7c3aed' }}
              />
              <span style={{ color: '#94a3b8', fontSize: 10 }}>
                {Math.round(((imgEdit.w ?? selectedPdfImage.w) / selectedPdfImage.origW) * 100)}%
              </span>
              <button
                onClick={() => {
                  setImageEdits(prev => ({
                    ...prev,
                    [selectedPdfImage.id]: {
                      ...prev[selectedPdfImage.id],
                      x: selectedPdfImage.origX,
                      y: selectedPdfImage.origY,
                      w: selectedPdfImage.origW,
                      h: selectedPdfImage.origH
                    }
                  }));
                }}
                style={{ ...S.miniBtn, backgroundColor: '#334155', color: '#e2e8f0', border: '1px solid #475569', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                ↩ Reset
              </button>
              <button
                onClick={() => {
                  setImageEdits(prev => ({ ...prev, [selectedPdfImage.id]: { ...prev[selectedPdfImage.id], deleted: true } }));
                  setSelectedId(null);
                }}
                style={{ ...S.miniBtn, backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Trash2 size={12} /> Remove Image
              </button>
              <button
                onClick={() => setSelectedId(null)}
                style={{ ...S.miniBtn, backgroundColor: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Check size={12} /> Done
              </button>
            </>
          );
        })()}

        {/* State B: Selected Image or Signature Annotation */}
        {selectedAnnotation?.type === 'image' && (
          <>
            <span style={{ backgroundColor: selectedAnnotation.isSignature ? '#16a34a' : '#7c3aed', color: '#fff', padding: '3px 9px', borderRadius: 5, fontWeight: 700, fontSize: 11 }}>
              {selectedAnnotation.isSignature ? '✍️ Signature Selected' : 'Image Selected'}
            </span>
            <Lbl>Size:</Lbl>
            <input
              type="range"
              min={8}
              max={95}
              value={Math.round(selectedAnnotation.w)}
              onChange={(e) => {
                const newW = +e.target.value;
                const newH = selectedAnnotation.aspectRatio
                  ? +((newW / selectedAnnotation.aspectRatio) * (pageDim.w / pageDim.h)).toFixed(2)
                  : selectedAnnotation.h;
                updateAnnotations(prev => prev.map(it => it.id === selectedAnnotation.id ? { ...it, w: newW, h: newH } : it));
              }}
              style={{ accentColor: '#2563eb', width: 100 }}
            />
            <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{Math.round(selectedAnnotation.w)}%</span>

            <Lbl>Rotate:</Lbl>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <button
                type="button"
                onClick={() => {
                  const currentRot = selectedAnnotation.rotation || 0;
                  const newRot = (currentRot - 90 + 360) % 360;
                  updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, rotation: newRot } : i));
                }}
                style={{ ...S.miniBtn, padding: '2px 6px', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #475569', display: 'flex', alignItems: 'center', gap: 3 }}
                title="Rotate 90° Counter-Clockwise"
              >
                <RotateCcw size={11} /> -90°
              </button>

              <button
                type="button"
                onClick={() => {
                  const currentRot = selectedAnnotation.rotation || 0;
                  const newRot = (currentRot + 90) % 360;
                  updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, rotation: newRot } : i));
                }}
                style={{ ...S.miniBtn, padding: '2px 6px', backgroundColor: '#1e293b', color: '#a7f3d0', border: '1px solid #059669', display: 'flex', alignItems: 'center', gap: 3 }}
                title="Rotate 90° Clockwise"
              >
                <RotateCw size={11} /> +90°
              </button>

              {[0, 90, 180, 270].map(deg => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, rotation: deg } : i))}
                  style={{
                    backgroundColor: (selectedAnnotation.rotation || 0) === deg ? '#16a34a' : '#0f172a',
                    color: (selectedAnnotation.rotation || 0) === deg ? '#fff' : '#94a3b8',
                    border: '1px solid #475569',
                    borderRadius: 4,
                    padding: '2px 5px',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title={`Rotate to ${deg}°`}
                >
                  {deg}°
                </button>
              ))}

              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={(() => {
                  let r = selectedAnnotation.rotation || 0;
                  if (r > 180) r -= 360;
                  return r;
                })()}
                onChange={(e) => {
                  let val = +e.target.value;
                  if (val < 0) val += 360;
                  updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, rotation: val } : i));
                }}
                style={{ accentColor: '#10b981', width: 65 }}
                title="Fine-tune rotation angle (-180° to 180°)"
              />
              <span style={{ fontWeight: 700, color: '#10b981', fontSize: 11, minWidth: 26, textAlign: 'center' }}>
                {selectedAnnotation.rotation || 0}°
              </span>

              {(selectedAnnotation.rotation || 0) !== 0 && (
                <button
                  type="button"
                  onClick={() => updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, rotation: 0 } : i))}
                  style={{ ...S.miniBtn, padding: '2px 5px', fontSize: 10, backgroundColor: '#0f172a', color: '#94a3b8', border: '1px solid #334155' }}
                  title="Reset rotation to 0°"
                >
                  Reset
                </button>
              )}
            </div>
            {selectedAnnotation.isSignature ? (
              <button
                onClick={() => setShowSignModal(true)}
                style={{ ...S.miniBtn, backgroundColor: '#0f172a', color: '#86efac', border: '1px solid #16a34a' }}
              >
                Change Signature
              </button>
            ) : (
              <button
                onClick={() => imageInputRef.current?.click()}
                style={{ ...S.miniBtn, backgroundColor: '#0f172a', color: '#93c5fd' }}
              >
                Replace Image
              </button>
            )}
            <button
              onClick={deleteAnnotation}
              style={{ ...S.miniBtn, backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={12} /> Delete
            </button>
          </>
        )}

        {/* State B2: Selected Shape / Whiteout */}
        {selectedAnnotation?.type === 'shape' && (
          <>
            <span style={{ backgroundColor: '#475569', color: '#fff', padding: '3px 9px', borderRadius: 5, fontWeight: 700, fontSize: 11 }}>
              ⬜ Whiteout Box
            </span>
            <Lbl>Size:</Lbl>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{Math.round(selectedAnnotation.w)}% × {Math.round(selectedAnnotation.h)}%</span>
            <Lbl>Border:</Lbl>
            {['#e2e8f0', '#94a3b8', '#3b82f6', '#ef4444', 'transparent'].map(bc => (
              <div
                key={bc}
                onClick={() => updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, border: bc } : i))}
                style={{
                  width: 18, height: 18, borderRadius: 4, backgroundColor: bc === 'transparent' ? '#1e293b' : bc,
                  border: (selectedAnnotation.border || '#e2e8f0') === bc ? '2px solid #38bdf8' : '1px solid #475569',
                  cursor: 'pointer'
                }}
                title={bc}
              />
            ))}
            <button
              onClick={deleteSelectedItem}
              style={{ ...S.miniBtn, backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={12} /> Delete Box
            </button>
            <button
              onClick={() => setSelectedId(null)}
              style={{ ...S.miniBtn, backgroundColor: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Check size={12} /> Done
            </button>
          </>
        )}

        {/* State B3: Selected Stamp */}
        {selectedAnnotation?.type === 'stamp' && (
          <>
            <span style={{ backgroundColor: '#16a34a', color: '#fff', padding: '3px 9px', borderRadius: 5, fontWeight: 700, fontSize: 11 }}>
              🔖 Stamp: {selectedAnnotation.stampText}
            </span>
            <Lbl>Scale:</Lbl>
            <input
              type="range"
              min={50}
              max={250}
              value={Math.round((selectedAnnotation.scale || 1) * 100)}
              onChange={(e) => {
                const sc = +e.target.value / 100;
                updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, scale: sc } : i));
              }}
              style={{ accentColor: '#2563eb', width: 90 }}
            />
            <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 700 }}>{Math.round((selectedAnnotation.scale || 1) * 100)}%</span>
            <button
              onClick={deleteSelectedItem}
              style={{ ...S.miniBtn, backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={12} /> Delete Stamp
            </button>
            <button
              onClick={() => setSelectedId(null)}
              style={{ ...S.miniBtn, backgroundColor: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Check size={12} /> Done
            </button>
          </>
        )}

        {/* State B4: Selected Draw Stroke */}
        {selectedAnnotation?.type === 'draw' && (
          <>
            <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '3px 9px', borderRadius: 5, fontWeight: 700, fontSize: 11 }}>
              ✏️ Drawing Stroke
            </span>
            <Lbl>Thickness:</Lbl>
            <span style={{ color: '#cbd5e1', fontSize: 11 }}>{selectedAnnotation.width || 3}px</span>
            <Lbl>Color:</Lbl>
            {COLORS.map(c => (
              <Dot
                key={c}
                c={c}
                active={(selectedAnnotation.color || '#2563eb') === c}
                onClick={() => updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, color: c } : i))}
              />
            ))}
            <button
              onClick={deleteSelectedItem}
              style={{ ...S.miniBtn, backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={12} /> Delete Drawing
            </button>
            <button
              onClick={() => setSelectedId(null)}
              style={{ ...S.miniBtn, backgroundColor: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Check size={12} /> Done
            </button>
          </>
        )}

        {/* State B5: Selected Text Annotation */}
        {selectedAnnotation?.type === 'text' && (
          <>
            <span style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '3px 9px', borderRadius: 5, fontWeight: 700, fontSize: 11 }}>
              🔤 Text Box
            </span>
            <Lbl>Size:</Lbl>
            <select
              value={selectedAnnotation.fontSize || 14}
              onChange={e => updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, fontSize: +e.target.value } : i))}
              style={S.sel}
            >
              {[10, 12, 14, 16, 18, 20, 24, 28, 32, 40].map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
            <Lbl>Color:</Lbl>
            {COLORS.map(c => (
              <Dot
                key={c}
                c={c}
                active={(selectedAnnotation.color || '#000000') === c}
                onClick={() => updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, color: c } : i))}
              />
            ))}
            <button
              onClick={deleteSelectedItem}
              style={{ ...S.miniBtn, backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={12} /> Delete Text
            </button>
            <button
              onClick={() => setSelectedId(null)}
              style={{ ...S.miniBtn, backgroundColor: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Check size={12} /> Done
            </button>
          </>
        )}

        {/* State B6: Selected Watermark */}
        {selectedAnnotation?.type === 'watermark' && (
          <>
            <span style={{ backgroundColor: '#0284c7', color: '#fff', padding: '3px 9px', borderRadius: 5, fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Droplets size={12} /> Watermark Selected
            </span>

            <Lbl>Text:</Lbl>
            <input
              type="text"
              value={selectedAnnotation.text || ''}
              onChange={(e) => {
                const val = e.target.value;
                updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, text: val } : i));
              }}
              style={{ ...S.sel, width: 130, fontWeight: 700 }}
              placeholder="Watermark text..."
            />

            {/* Quick preset texts */}
            <div style={{ display: 'flex', gap: 3 }}>
              {['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE'].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, text: preset } : i))}
                  style={{
                    backgroundColor: (selectedAnnotation.text === preset) ? '#0284c7' : '#0f172a',
                    color: (selectedAnnotation.text === preset) ? '#fff' : '#94a3b8',
                    border: '1px solid #475569',
                    borderRadius: 4,
                    padding: '2px 5px',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>

            <Lbl>Scale / Size:</Lbl>
            <input
              type="range"
              min={18}
              max={120}
              value={selectedAnnotation.fontSize || 48}
              onChange={(e) => {
                const val = +e.target.value;
                updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, fontSize: val } : i));
              }}
              style={{ accentColor: '#0284c7', width: 85 }}
            />
            <span style={{ fontWeight: 700, color: '#e2e8f0', minWidth: 32 }}>{selectedAnnotation.fontSize || 48}px</span>

            <Lbl>Rotate:</Lbl>
            <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              {[
                { label: '45° ↗', val: 45 },
                { label: '0° →', val: 0 },
                { label: '90° ↑', val: 90 },
                { label: '-45° ↘', val: -45 },
                { label: '180° ←', val: 180 }
              ].map(r => (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, rotation: r.val } : i))}
                  style={{
                    backgroundColor: ((selectedAnnotation.rotation ?? 45) === r.val) ? '#0284c7' : '#0f172a',
                    color: ((selectedAnnotation.rotation ?? 45) === r.val) ? '#fff' : '#94a3b8',
                    border: '1px solid #475569',
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {r.label}
                </button>
              ))}

              <input
                type="range"
                min={-180}
                max={180}
                step={5}
                value={selectedAnnotation.rotation ?? 45}
                onChange={(e) => {
                  const val = +e.target.value;
                  updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, rotation: val } : i));
                }}
                style={{ accentColor: '#0284c7', width: 70 }}
                title="Slide to rotate watermark"
              />
              <span style={{ fontWeight: 700, color: '#e2e8f0', minWidth: 26, fontSize: 11 }}>
                {selectedAnnotation.rotation ?? 45}°
              </span>
            </div>

            <Lbl>Opacity:</Lbl>
            <input
              type="range"
              min={10}
              max={90}
              value={Math.round((selectedAnnotation.opacity ?? 0.35) * 100)}
              onChange={(e) => {
                const val = +(e.target.value / 100).toFixed(2);
                updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, opacity: val } : i));
              }}
              style={{ accentColor: '#0284c7', width: 75 }}
            />
            <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{Math.round((selectedAnnotation.opacity ?? 0.35) * 100)}%</span>

            <Lbl>Color:</Lbl>
            {['#ef4444', '#64748b', '#2563eb', '#0f172a', '#d97706', '#16a34a'].map(c => (
              <Dot
                key={c}
                c={c}
                active={(selectedAnnotation.color || '#ef4444') === c}
                onClick={() => updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, color: c } : i))}
              />
            ))}

            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: '#e2e8f0', marginLeft: 4 }}>
              <input
                type="checkbox"
                checked={selectedAnnotation.applyAllPages !== false}
                onChange={(e) => {
                  const val = e.target.checked;
                  updateAnnotations(prev => prev.map(i => i.id === selectedAnnotation.id ? { ...i, applyAllPages: val } : i));
                }}
                style={{ accentColor: '#0284c7' }}
              />
              <span>All Pages</span>
            </label>

            <button
              onClick={deleteAnnotation}
              style={{ ...S.miniBtn, backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={12} /> Delete
            </button>
            <button
              onClick={() => setSelectedId(null)}
              style={{ ...S.miniBtn, backgroundColor: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Check size={12} /> Done
            </button>
          </>
        )}

        {/* State C: Default tool controls when nothing active is selected */}
        {!selectedId && (
          <>
            {activeTool === 'text' && <>
              <Lbl>Size:</Lbl>
              <select value={fontSize} onChange={e => setFontSize(+e.target.value)} style={S.sel}>
                {[10,12,14,16,18,20,24,28,32].map(s => <option key={s} value={s}>{s}px</option>)}
              </select>
              <Lbl>Color:</Lbl>
              {COLORS.map(c => <Dot key={c} c={c} active={textColor===c} onClick={() => setTextColor(c)}/>)}
              <Lbl>Highlight:</Lbl>
              <select value={fillColor} onChange={e => setFillColor(e.target.value)} style={S.sel}>
                <option value="transparent">None</option>
                <option value="#fef08a">Yellow</option>
                <option value="#bbf7d0">Green</option>
                <option value="#bfdbfe">Blue</option>
                <option value="#fecaca">Red</option>
                <option value="#ffffff">White</option>
              </select>
            </>}

            {activeTool === 'image' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  style={{ ...S.btn('#2563eb', '#fff'), padding: '5px 12px', fontSize: 12 }}
                >
                  <Upload size={14} /> Upload &amp; Place Image
                </button>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>
                  💡 Upload any PNG/JPG image to place and resize on the PDF.
                </span>
              </div>
            )}

            {activeTool === 'draw' && <>
              <Lbl>Thickness:</Lbl>
              <input type="range" min={1} max={12} value={strokeWidth}
                onChange={e => setStrokeWidth(+e.target.value)}
                style={{ accentColor:'#ef4444', width:90 }}/>
              <span style={{ fontWeight:700, color:'#e2e8f0' }}>{strokeWidth}px</span>
              <Lbl>Color:</Lbl>
              {COLORS.map(c => <Dot key={c} c={c} active={textColor===c} onClick={() => setTextColor(c)}/>)}
            </>}

            {activeTool === 'stamp' && <>
              <Lbl>Type:</Lbl>
              {['APPROVED','CONFIDENTIAL','REJECTED','COMPLETED','DRAFT'].map(s => (
                <button key={s} onClick={() => setStampType(s)} style={{
                  ...S.miniBtn,
                  backgroundColor: stampType===s ? '#ef4444':'#0f172a',
                  color: stampType===s ? '#fff':'#94a3b8'
                }}>{s}</button>
              ))}
            </>}

            {activeTool === 'whiteout' &&
              <span style={{ color:'#38bdf8', fontWeight:600 }}>
                💡 Click anywhere on the PDF to cover text with an opaque whiteout box.
              </span>}
          </>
        )}

        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems: 'center' }}>
          {selectedId && (
            <button onClick={deleteSelectedItem} style={{
              display:'flex', alignItems:'center', gap:5,
              backgroundColor:'#dc2626', color:'#ffffff',
              border:'none', padding:'5px 12px',
              borderRadius:6, cursor:'pointer', fontWeight:700, fontSize:12,
              boxShadow:'0 2px 8px rgba(220, 38, 38, 0.45)'
            }} title="Delete selected item (Delete / Backspace key)"><Trash2 size={13}/> Delete Selected</button>
          )}
          <button onClick={clearPage} style={{
            backgroundColor:'#334155', color:'#cbd5e1', border:'none',
            padding:'5px 12px', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:12
          }}>Reset Page</button>
        </div>
      </div>

      {/* ── Canvas workspace ─────────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', alignItems:'center',
        padding:'24px 20px', backgroundColor:'#090d16' }}>

        <div style={{
          marginBottom: 14,
          padding: '6px 16px',
          backgroundColor: 'rgba(30, 41, 59, 0.85)',
          borderRadius: 20,
          border: '1px solid #334155',
          fontSize: 12,
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ color: '#38bdf8' }}>✨ Pro Tip:</span>
          <span>Click directly on any original PDF text below to edit or replace it in-place.</span>
        </div>

        <div style={{ position:'relative', display:'inline-block',
          boxShadow:'0 14px 40px rgba(0,0,0,.6)', borderRadius:4 }}>

          {/* Real PDF canvas (crisp vector rendering) */}
          <canvas ref={pdfCanvasRef} style={{ display:'block' }}/>

          {/* Draw overlay canvas */}
          <canvas
            ref={drawCanvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ position:'absolute', top:0, left:0,
              zIndex: activeTool==='draw' ? 90 : 10,
              touchAction: 'none',
              pointerEvents: activeTool==='draw' ? 'auto':'none' }}
          />

          {/* SVG click-detection & selection layer for drawn strokes */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 95
            }}
          >
            {(annotations[currentPage] || []).map(item => {
              if (item.type !== 'draw' || !item.points || item.points.length < 2) return null;
              const pathD = item.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
              const isSel = selectedId === item.id;
              return (
                <path
                  key={'svg-' + item.id}
                  d={pathD}
                  fill="none"
                  stroke={isSel ? 'rgba(59, 130, 246, 0.45)' : 'transparent'}
                  strokeWidth={Math.max(22, (item.width || 3) + 16)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    pointerEvents: 'stroke',
                    cursor: isSel ? 'grab' : 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                  }}
                  onMouseDown={(e) => {
                    if (isSel) {
                      e.stopPropagation();
                      setDraggingItem({
                        id: item.id,
                        type: 'draw',
                        startX: e.clientX,
                        startY: e.clientY,
                        origPoints: item.points.map(p => ({ ...p }))
                      });
                    }
                  }}
                />
              );
            })}
          </svg>

          {/* Click-through layer (for adding new text/annotations on empty space) */}
          <div
            ref={containerRef}
            className="page-bg-clickable"
            onClick={onPageBgClick}
            style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%',
              zIndex:5,
              cursor: activeTool==='draw' ? 'crosshair' :
                      activeTool==='text' ? 'text' :
                      activeTool==='image' ? 'pointer' : 'crosshair',
              pointerEvents: activeTool==='draw' ? 'none':'auto'
            }}
          />

          {/* ── Extracted PDF text items (clean in-place replacement) ───────── */}
          {curPageTextItems.map(item => {
            const edit = textEdits[item.id] || {};
            const isDeleted = !!edit.deleted;
            const isSelected = selectedId === item.id;
            const currentText = edit.text ?? item.text;
            const itemColor = edit.color || item.color || '#000000';
            const itemFontSize = edit.fontSize || item.fontSize || 12;

            // Formatting state (edit overrides > original detection)
            const isBold = edit.bold ?? item.bold ?? false;
            const isItalic = edit.italic ?? item.italic ?? false;
            const isUnderline = edit.underline ?? item.underline ?? false;
            const isStrikethrough = edit.strikethrough ?? item.strikethrough ?? false;

            // Consider edited if text, color, fontSize, or formatting changed
            const isEdited = (edit.text !== undefined && edit.text !== item.origText)
              || edit.color !== undefined
              || edit.fontSize !== undefined
              || edit.bold !== undefined
              || edit.italic !== undefined
              || edit.underline !== undefined
              || edit.strikethrough !== undefined;

            // Maximum allowed width before touching the right edge of the page
            const maxAvailW = Math.max(20, pageDim.w - item.x - 8);

            // 1. Deleted text -> opaque whiteout box covering canvas text completely
            if (isDeleted) {
              const deletedW = Math.min(item.w + 4, maxAvailW);
              return (
                <div
                  key={item.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                  title="Deleted text (covered with whiteout) - Click to restore"
                  style={{
                    position: 'absolute',
                    left: item.x - 2,
                    top: item.y - 1,
                    width: deletedW,
                    maxWidth: maxAvailW,
                    height: item.h + 2,
                    backgroundColor: '#ffffff',
                    border: isSelected ? '1.5px dashed #ef4444' : '1px dashed #cbd5e1',
                    borderRadius: 2,
                    zIndex: isSelected ? 50 : 25,
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTextEdits(prev => {
                          const next = { ...prev };
                          delete next[item.id];
                          return next;
                        });
                      }}
                      style={{
                        position: 'absolute',
                        top: item.y >= 30 ? -26 : (item.h + 4),
                        left: 0,
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        whiteSpace: 'nowrap',
                        zIndex: 60
                      }}
                    >
                      ↩ Restore Text
                    </button>
                  )}
                </div>
              );
            }

            // 2. Selected OR Edited text -> white background masking original canvas text + active input
            if (isSelected || isEdited) {
              const charRatio = (item.origText && item.origText.length > 0)
                ? (currentText.length / item.origText.length)
                : 1;
              const naturalW = Math.max(item.w + 6, (item.w + 6) * Math.max(1, charRatio));
              const boxW = Math.min(naturalW, maxAvailW);

              return (
                <div
                  key={item.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                  style={{
                    position: 'absolute',
                    left: item.x - 3,
                    top: item.y - 2,
                    width: boxW,
                    maxWidth: maxAvailW,
                    minHeight: item.h + 4,
                    backgroundColor: '#ffffff', // Opaque white completely hides canvas text underneath!
                    border: isSelected ? '2px solid #2563eb' : '1px dashed #3b82f6',
                    borderRadius: 4,
                    zIndex: isSelected ? 55 : 30,
                    boxShadow: isSelected ? '0 0 0 3px rgba(37,99,235,0.2), 0 4px 12px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.08)',
                    boxSizing: 'border-box',
                    padding: '1px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'visible'
                  }}
                >
                  <input
                    type="text"
                    autoFocus={isSelected}
                    value={currentText}
                    onChange={(e) => editPdfText(item, e.target.value)}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                    style={{
                      width: '100%',
                      minWidth: 0,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      padding: 0,
                      margin: 0,
                      color: itemColor,
                      fontSize: `${itemFontSize}px`,
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      fontWeight: isBold ? 700 : 400,
                      fontStyle: isItalic ? 'italic' : 'normal',
                      textDecoration: [
                        isUnderline ? 'underline' : '',
                        isStrikethrough ? 'line-through' : ''
                      ].filter(Boolean).join(' ') || 'none',
                      lineHeight: 1.2,
                      cursor: 'text'
                    }}
                  />
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: item.y >= 32 ? -30 : (item.h + 6),
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      zIndex: 65,
                      backgroundColor: '#1e293b',
                      padding: '3px 5px',
                      borderRadius: 6,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      border: '1px solid #334155'
                    }}>
                      {/* B/I/U/S formatting buttons */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const cur = (textEdits[item.id] || {}).bold ?? item.bold ?? false;
                          setTextEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], bold: !cur } }));
                        }}
                        title="Bold"
                        style={fmtBtnStyle((textEdits[item.id] || {}).bold ?? item.bold ?? false)}
                      >
                        <Bold size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const cur = (textEdits[item.id] || {}).italic ?? item.italic ?? false;
                          setTextEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], italic: !cur } }));
                        }}
                        title="Italic"
                        style={fmtBtnStyle((textEdits[item.id] || {}).italic ?? item.italic ?? false)}
                      >
                        <Italic size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const cur = (textEdits[item.id] || {}).underline ?? item.underline ?? false;
                          setTextEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], underline: !cur } }));
                        }}
                        title="Underline"
                        style={fmtBtnStyle((textEdits[item.id] || {}).underline ?? item.underline ?? false)}
                      >
                        <Underline size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const cur = (textEdits[item.id] || {}).strikethrough ?? item.strikethrough ?? false;
                          setTextEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], strikethrough: !cur } }));
                        }}
                        title="Strikethrough"
                        style={fmtBtnStyle((textEdits[item.id] || {}).strikethrough ?? item.strikethrough ?? false)}
                      >
                        <Strikethrough size={12} />
                      </button>

                      <div style={{ width: 1, height: 18, background: '#475569', margin: '0 1px' }} />

                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePdfText(item); }}
                        title="Delete this text line"
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '3px 8px',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Trash2 size={10} /> Delete
                      </button>
                      {/* Done button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                        title="Done editing"
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '3px 8px',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Check size={10} /> Done
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // 3. Unedited and Unselected -> Transparent hover hit box (NO duplicate letters!)
            const hitW = Math.min(item.w + 4, maxAvailW);
            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(item.id);
                }}
                title="Click to edit text"
                style={{
                  position: 'absolute',
                  left: item.x - 2,
                  top: item.y - 1,
                  width: hitW,
                  maxWidth: maxAvailW,
                  height: item.h + 2,
                  zIndex: 22,
                  cursor: 'pointer',
                  borderRadius: 3,
                  boxSizing: 'border-box',
                  backgroundColor: 'transparent',
                  border: '1px dashed transparent',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.7)';
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              />
            );
          })}

          {/* ── Extracted PDF image overlays (select / move / resize / delete) ── */}
          {pdfImageItems.filter(i => i.pageNum === currentPage).map(item => {
            const edit = imageEdits[item.id] || {};
            if (edit.deleted) return null;
            const isSelected = selectedId === item.id;
            const imgX = edit.x ?? item.x;
            const imgY = edit.y ?? item.y;
            const imgW = edit.w ?? item.w;
            const imgH = edit.h ?? item.h;

            return (
              <div
                key={item.id}
                onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(item.id);
                  setDraggingItem({
                    id: item.id,
                    type: 'pdfImage',
                    startX: e.clientX,
                    startY: e.clientY,
                    startItemX: imgX,
                    startItemY: imgY
                  });
                }}
                style={{
                  position: 'absolute',
                  left: imgX,
                  top: imgY,
                  width: imgW,
                  height: imgH,
                  border: isSelected ? '2px solid #7c3aed' : '2px dashed transparent',
                  borderRadius: 4,
                  cursor: 'move',
                  zIndex: isSelected ? 50 : 20,
                  boxSizing: 'border-box',
                  backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.06)' : 'transparent',
                  transition: 'border-color 0.15s, background 0.15s'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.6)';
                    e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {/* Corner resize handles */}
                {isSelected && ['nw', 'ne', 'se', 'sw'].map(corner => {
                  const pos = {
                    nw: { top: -5, left: -5, cursor: 'nwse-resize' },
                    ne: { top: -5, right: -5, cursor: 'nesw-resize' },
                    se: { bottom: -5, right: -5, cursor: 'nwse-resize' },
                    sw: { bottom: -5, left: -5, cursor: 'nesw-resize' }
                  }[corner];
                  return (
                    <div
                      key={corner}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingItem({
                          id: item.id,
                          type: 'pdfImage',
                          corner,
                          startX: e.clientX,
                          startY: e.clientY,
                          startW: imgW,
                          startH: imgH,
                          startItemX: imgX,
                          startItemY: imgY
                        });
                      }}
                      style={{
                        position: 'absolute',
                        ...pos,
                        width: 10,
                        height: 10,
                        background: '#7c3aed',
                        borderRadius: 2,
                        border: '2px solid #fff',
                        zIndex: 55
                      }}
                    />
                  );
                })}

                {/* Label + Actions toolbar */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: imgY >= 36 ? -32 : (imgH + 6),
                    left: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    zIndex: 65,
                    backgroundColor: '#1e293b',
                    padding: '4px 8px',
                    borderRadius: 6,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    border: '1px solid #334155',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ color: '#c4b5fd', fontSize: 10, fontWeight: 700 }}>📷 PDF Image</span>
                    <div style={{ width: 1, height: 16, background: '#475569' }} />
                    <span style={{ color: '#94a3b8', fontSize: 9 }}>
                      {Math.round(imgW)}×{Math.round(imgH)}
                    </span>
                    <div style={{ width: 1, height: 16, background: '#475569' }} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], deleted: true } }));
                        setSelectedId(null);
                      }}
                      title="Remove image"
                      style={{
                        backgroundColor: '#ef4444', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '3px 8px', fontSize: 10,
                        fontWeight: 700, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: 2
                      }}
                    >
                      <Trash2 size={10} /> Remove
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
                      title="Done"
                      style={{
                        backgroundColor: '#16a34a', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '3px 8px', fontSize: 10,
                        fontWeight: 700, cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: 2
                      }}
                    >
                      <Check size={10} /> Done
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* ── New annotation overlays (Images, Text, Shapes, Stamps, Draw) ──── */}
          {curPageAnnotations.map(item => {
            const sel = selectedId === item.id;
            const isDraggingThis = draggingItem?.id === item.id;

            // Draw Stroke Selection Bounding Box & Controls
            if (item.type === 'draw') {
              if (!sel || !item.points || item.points.length < 2) return null;
              const xs = item.points.map(p => p.x);
              const ys = item.points.map(p => p.y);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              const pad = 8;
              const bBoxLeft = Math.max(0, minX - pad);
              const bBoxTop = Math.max(0, minY - pad);
              const bBoxWidth = Math.max(30, maxX - minX + pad * 2);
              const bBoxHeight = Math.max(24, maxY - minY + pad * 2);

              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    left: bBoxLeft,
                    top: bBoxTop,
                    width: bBoxWidth,
                    height: bBoxHeight,
                    border: '1.5px dashed #2563eb',
                    borderRadius: 4,
                    boxShadow: '0 0 0 2px rgba(37,99,235,0.2)',
                    zIndex: 120,
                    cursor: isDraggingThis ? 'grabbing' : 'grab',
                    pointerEvents: 'auto',
                    boxSizing: 'border-box'
                  }}
                  onMouseDown={(e) => {
                    if (e.target.closest('.no-drag-target')) return;
                    e.stopPropagation();
                    setDraggingItem({
                      id: item.id,
                      type: 'draw',
                      startX: e.clientX,
                      startY: e.clientY,
                      origPoints: item.points.map(p => ({ ...p }))
                    });
                  }}
                  onTouchStart={(e) => {
                    if (e.target.closest('.no-drag-target')) return;
                    e.stopPropagation();
                    const t = e.touches[0];
                    setDraggingItem({
                      id: item.id,
                      type: 'draw',
                      startX: t.clientX,
                      startY: t.clientY,
                      origPoints: item.points.map(p => ({ ...p }))
                    });
                  }}
                >
                  <FloatingItemControls
                    label="Drawing"
                    onDelete={deleteSelectedItem}
                    onStartMove={(e) => {
                      setDraggingItem({
                        id: item.id,
                        type: 'draw',
                        startX: e.clientX,
                        startY: e.clientY,
                        origPoints: item.points.map(p => ({ ...p }))
                      });
                    }}
                    onStartResize={(e) => {
                      setResizingItem({
                        id: item.id,
                        type: 'draw',
                        startX: e.clientX,
                        startY: e.clientY,
                        startW: bBoxWidth,
                        startH: bBoxHeight,
                        minX,
                        minY,
                        origPoints: item.points.map(p => ({ ...p }))
                      });
                    }}
                    hasResize={true}
                    isNearTop={bBoxTop < 36}
                  />
                </div>
              );
            }

            // Image Annotation
            if (item.type === 'image') {
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                  }}
                  onMouseDown={(e) => {
                    if (e.target.closest('.no-drag-target')) return;
                    e.stopPropagation();
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                    setDraggingItem({
                      id: item.id,
                      type: 'image',
                      startX: e.clientX,
                      startY: e.clientY,
                      startItemX: item.x,
                      startItemY: item.y
                    });
                  }}
                  onTouchStart={(e) => {
                    if (e.target.closest('.no-drag-target')) return;
                    e.stopPropagation();
                    const t = e.touches[0];
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                    setDraggingItem({
                      id: item.id,
                      type: 'image',
                      startX: t.clientX,
                      startY: t.clientY,
                      startItemX: item.x,
                      startItemY: item.y
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    width: `${item.w}%`,
                    height: `${item.h}%`,
                    transform: `rotate(${item.rotation || 0}deg)`,
                    transformOrigin: 'center center',
                    zIndex: sel ? 60 : 25,
                    cursor: isDraggingThis ? 'grabbing' : 'grab',
                    border: sel ? '2px solid #2563eb' : '1px dashed transparent',
                    borderRadius: 4,
                    boxSizing: 'border-box',
                    boxShadow: sel ? '0 0 0 3px rgba(37,99,235,0.3), 0 6px 18px rgba(0,0,0,0.35)' : 'none',
                    userSelect: 'none'
                  }}
                >
                  <img
                    src={item.src}
                    alt="Inserted"
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      pointerEvents: 'none',
                      borderRadius: 2
                    }}
                  />
                  {sel && (
                    <FloatingItemControls
                      label={item.isSignature ? '✍️ Signature' : 'Image'}
                      onDelete={deleteSelectedItem}
                      onStartMove={(e) => {
                        setDraggingItem({
                          id: item.id,
                          type: 'image',
                          startX: e.clientX,
                          startY: e.clientY,
                          startItemX: item.x,
                          startItemY: item.y
                        });
                      }}
                      onStartResize={(e) => {
                        setResizingItem({
                          id: item.id,
                          type: 'image',
                          startX: e.clientX,
                          startY: e.clientY,
                          startW: item.w,
                          startH: item.h,
                          aspectRatio: item.aspectRatio || (item.w / item.h)
                        });
                      }}
                      hasResize={true}
                      hasRotate={true}
                      rotation={item.rotation || 0}
                      onRotate={(newRot) => {
                        updateAnnotations(prev => prev.map(i => i.id === item.id ? { ...i, rotation: newRot } : i));
                      }}
                      onStartRotate={(e) => {
                        let cx = e.clientX;
                        let cy = e.clientY + 40;
                        if (containerRef.current) {
                          const rect = containerRef.current.getBoundingClientRect();
                          cx = rect.left + ((item.x + (item.w / 2)) / 100) * rect.width;
                          cy = rect.top + ((item.y + (item.h / 2)) / 100) * rect.height;
                        }
                        const startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
                        setRotatingItem({
                          id: item.id,
                          centerX: cx,
                          centerY: cy,
                          startAngle,
                          startRotation: item.rotation || 0
                        });
                      }}
                      isNearTop={item.y < 8}
                    />
                  )}
                </div>
              );
            }

            // New Text Annotation
            if (item.type === 'text') {
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                  }}
                  onMouseDown={(e) => {
                    if (e.target.tagName !== 'INPUT' && !e.target.closest('.no-drag-target')) {
                      e.stopPropagation();
                      setSelectedId(item.id);
                      if (activeTool === 'draw') setActiveTool(null);
                      setDraggingItem({
                        id: item.id,
                        type: 'text',
                        startX: e.clientX,
                        startY: e.clientY,
                        startItemX: item.x,
                        startItemY: item.y
                      });
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    zIndex: sel ? 60 : 20,
                    padding: '3px 8px',
                    borderRadius: 4,
                    backgroundColor: item.bg || 'transparent',
                    border: sel ? '1.5px dashed #2563eb' : '1px dashed rgba(37,99,235,0.4)',
                    cursor: isDraggingThis ? 'grabbing' : 'move'
                  }}
                >
                  <input
                    type="text"
                    autoFocus={sel}
                    value={item.text}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateAnnotations(prev => prev.map(i => i.id === item.id ? { ...i, text: v } : i));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setSelectedId(null);
                      }
                      if (e.key === 'Backspace' || e.key === 'Delete') {
                        const val = e.target.value || '';
                        const isAllSelected = e.target.selectionStart === 0 && e.target.selectionEnd === val.length;
                        if (!val.trim() || isAllSelected) {
                          e.preventDefault();
                          deleteSelectedItem();
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = (e.target.value || '').trim();
                      if (!val && !draggingItem && !resizingItem) {
                        deleteSelectedItem();
                      }
                    }}
                    onFocus={(e) => {
                      if (item.text === 'New Text') e.target.select();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: item.color || '#000000',
                      fontSize: `${(item.fontSize || 14) * zoom}px`,
                      fontWeight: 600,
                      fontFamily: 'Helvetica,Arial,sans-serif',
                      minWidth: 70,
                      width: `${Math.max(70, ((item.text || 'New Text').length + 2) * (item.fontSize || 14) * 0.62 * zoom)}px`,
                      cursor: 'text'
                    }}
                  />
                  {sel && (
                    <FloatingItemControls
                      label="Text"
                      onDelete={deleteSelectedItem}
                      onStartMove={(e) => {
                        setDraggingItem({
                          id: item.id,
                          type: 'text',
                          startX: e.clientX,
                          startY: e.clientY,
                          startItemX: item.x,
                          startItemY: item.y
                        });
                      }}
                      onStartResize={(e) => {
                        setResizingItem({
                          id: item.id,
                          type: 'text',
                          startX: e.clientX,
                          startY: e.clientY,
                          startFontSize: item.fontSize || 14
                        });
                      }}
                      hasResize={true}
                      isNearTop={item.y < 8}
                    />
                  )}
                </div>
              );
            }

            // Shape / Whiteout Annotation
            if (item.type === 'shape') {
              const isWhiteout = item.isWhiteout || item.color === '#ffffff';
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                  }}
                  onMouseDown={(e) => {
                    if (e.target.closest('.no-drag-target')) return;
                    e.stopPropagation();
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                    setDraggingItem({
                      id: item.id,
                      type: 'shape',
                      startX: e.clientX,
                      startY: e.clientY,
                      startItemX: item.x,
                      startItemY: item.y
                    });
                  }}
                  onTouchStart={(e) => {
                    if (e.target.closest('.no-drag-target')) return;
                    e.stopPropagation();
                    const t = e.touches[0];
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                    setDraggingItem({
                      id: item.id,
                      type: 'shape',
                      startX: t.clientX,
                      startY: t.clientY,
                      startItemX: item.x,
                      startItemY: item.y
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    width: `${item.w}%`,
                    height: `${item.h}%`,
                    backgroundColor: item.color || '#ffffff',
                    border: sel ? '2px solid #2563eb' : `1.5px solid ${item.border || '#cbd5e1'}`,
                    borderRadius: 3,
                    zIndex: sel ? 60 : 15,
                    cursor: isDraggingThis ? 'grabbing' : 'grab',
                    boxShadow: sel
                      ? '0 0 0 3px rgba(37,99,235,0.35), 0 4px 12px rgba(0,0,0,0.2)'
                      : '0 1px 3px rgba(0,0,0,0.1)',
                    userSelect: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {sel && (
                    <FloatingItemControls
                      label={isWhiteout ? "Whiteout" : "Box"}
                      onDelete={deleteSelectedItem}
                      onStartMove={(e) => {
                        setDraggingItem({
                          id: item.id,
                          type: 'shape',
                          startX: e.clientX,
                          startY: e.clientY,
                          startItemX: item.x,
                          startItemY: item.y
                        });
                      }}
                      onStartResize={(e) => {
                        setResizingItem({
                          id: item.id,
                          type: 'shape',
                          startX: e.clientX,
                          startY: e.clientY,
                          startW: item.w,
                          startH: item.h
                        });
                      }}
                      hasResize={true}
                      isNearTop={item.y < 8}
                    />
                  )}
                </div>
              );
            }

            // Stamp Annotation
            if (item.type === 'stamp') {
              const stampScale = item.scale || 1;
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                  }}
                  onMouseDown={(e) => {
                    if (e.target.closest('.no-drag-target')) return;
                    e.stopPropagation();
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                    setDraggingItem({
                      id: item.id,
                      type: 'stamp',
                      startX: e.clientX,
                      startY: e.clientY,
                      startItemX: item.x,
                      startItemY: item.y
                    });
                  }}
                  onTouchStart={(e) => {
                    if (e.target.closest('.no-drag-target')) return;
                    e.stopPropagation();
                    const t = e.touches[0];
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                    setDraggingItem({
                      id: item.id,
                      type: 'stamp',
                      startX: t.clientX,
                      startY: t.clientY,
                      startItemX: item.x,
                      startItemY: item.y
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    padding: `${5 * stampScale}px ${12 * stampScale}px`,
                    border: `${3 * stampScale}px double ${item.color}`,
                    borderRadius: 5,
                    backgroundColor: '#ffffff',
                    color: item.color,
                    fontWeight: 900,
                    fontSize: `${12 * stampScale}px`,
                    letterSpacing: 1,
                    zIndex: sel ? 60 : 25,
                    cursor: isDraggingThis ? 'grabbing' : 'grab',
                    transform: 'rotate(-5deg)',
                    transformOrigin: 'top left',
                    boxShadow: sel
                      ? '0 0 0 3px rgba(37,99,235,0.4), 0 4px 14px rgba(0,0,0,0.25)'
                      : '0 2px 6px rgba(0,0,0,0.15)',
                    userSelect: 'none'
                  }}
                >
                  {item.stampText}
                  {sel && (
                    <FloatingItemControls
                      label="Stamp"
                      onDelete={deleteSelectedItem}
                      onStartMove={(e) => {
                        setDraggingItem({
                          id: item.id,
                          type: 'stamp',
                          startX: e.clientX,
                          startY: e.clientY,
                          startItemX: item.x,
                          startItemY: item.y
                        });
                      }}
                      onStartResize={(e) => {
                        setResizingItem({
                          id: item.id,
                          type: 'stamp',
                          startX: e.clientX,
                          startY: e.clientY,
                          startScale: stampScale
                        });
                      }}
                      hasResize={true}
                      isNearTop={item.y < 8}
                    />
                  )}
                </div>
              );
            }

            // Watermark Annotation
            if (item.type === 'watermark') {
              const rot = item.rotation !== undefined ? item.rotation : 45;
              const op = item.opacity !== undefined ? item.opacity : 0.35;
              const fs = (item.fontSize || 48) * (zoom / 1.3);

              return (
                <div
                  key={item.id}
                  data-annotation-id={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                  }}
                  onMouseDown={(e) => {
                    if (e.target.closest('.no-drag-target')) return;
                    e.stopPropagation();
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                    setDraggingItem({
                      id: item.id,
                      type: 'watermark',
                      startX: e.clientX,
                      startY: e.clientY,
                      startItemX: item.x,
                      startItemY: item.y
                    });
                  }}
                  onTouchStart={(e) => {
                    if (e.target.closest('.no-drag-target')) return;
                    e.stopPropagation();
                    const t = e.touches[0];
                    setSelectedId(item.id);
                    if (activeTool === 'draw') setActiveTool(null);
                    setDraggingItem({
                      id: item.id,
                      type: 'watermark',
                      startX: t.clientX,
                      startY: t.clientY,
                      startItemX: item.x,
                      startItemY: item.y
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: `rotate(${rot}deg)`,
                    transformOrigin: 'center center',
                    zIndex: sel ? 60 : 25,
                    cursor: isDraggingThis ? 'grabbing' : 'grab',
                    border: sel ? '2px dashed #0284c7' : '1px dashed transparent',
                    borderRadius: 8,
                    padding: '6px 16px',
                    backgroundColor: sel ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                    userSelect: 'none',
                    display: 'inline-block',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      fontWeight: 900,
                      fontSize: `${Math.round(fs)}px`,
                      color: item.color || '#ef4444',
                      opacity: op,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      display: 'block',
                      pointerEvents: 'none',
                      lineHeight: 1.1
                    }}
                  >
                    {item.text || 'CONFIDENTIAL'}
                  </span>

                  {sel && (
                    <FloatingItemControls
                      label="💧 Watermark"
                      onDelete={deleteSelectedItem}
                      onStartMove={(e) => {
                        setDraggingItem({
                          id: item.id,
                          type: 'watermark',
                          startX: e.clientX,
                          startY: e.clientY,
                          startItemX: item.x,
                          startItemY: item.y
                        });
                      }}
                      onStartResize={(e) => {
                        setResizingItem({
                          id: item.id,
                          type: 'watermark',
                          startX: e.clientX,
                          startY: e.clientY,
                          startFontSize: item.fontSize || 48
                        });
                      }}
                      hasResize={true}
                      hasRotate={true}
                      rotation={rot}
                      onRotate={(newRot) => {
                        updateAnnotations(prev => prev.map(i => i.id === item.id ? { ...i, rotation: newRot } : i));
                      }}
                      onStartRotate={(e) => {
                        let cx = e.clientX;
                        let cy = e.clientY + 40;
                        const handleEl = e.currentTarget || e.target;
                        const itemEl = handleEl?.closest(`[data-annotation-id="${item.id}"]`);
                        if (itemEl) {
                          const rect = itemEl.getBoundingClientRect();
                          cx = rect.left + rect.width / 2;
                          cy = rect.top + rect.height / 2;
                        } else if (containerRef.current) {
                          const rect = containerRef.current.getBoundingClientRect();
                          cx = rect.left + (item.x / 100) * rect.width;
                          cy = rect.top + (item.y / 100) * rect.height;
                        }
                        const startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
                        setRotatingItem({
                          id: item.id,
                          centerX: cx,
                          centerY: cy,
                          startAngle,
                          startRotation: rot
                        });
                      }}
                      isNearTop={item.y < 12}
                    />
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* ── Footer bar ──────────────────────────────────────────────────── */}
      <div style={{ padding:'10px 20px', backgroundColor:'#1e293b', borderTop:'1px solid #334155',
        display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:13 }}>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button disabled={currentPage<=1} onClick={() => setCurrentPage(p => p-1)}
            style={{ ...S.navBtn, opacity: currentPage<=1 ? .4:1 }}>
            <ChevronLeft size={16}/>
          </button>
          <span style={{ fontWeight:700, color:'#cbd5e1', minWidth:110, textAlign:'center' }}>
            Page {currentPage} / {numPages||'?'}
          </span>
          <button disabled={currentPage>=numPages} onClick={() => setCurrentPage(p => p+1)}
            style={{ ...S.navBtn, opacity: currentPage>=numPages ? .4:1 }}>
            <ChevronRight size={16}/>
          </button>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setZoom(z => Math.max(0.5, +(z-0.15).toFixed(2)))} style={S.navBtn}>
            <ZoomOut size={16}/>
          </button>
          <span style={{ fontWeight:700, color:'#94a3b8', minWidth:48, textAlign:'center' }}>
            {Math.round(zoom*100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(2.5, +(z+0.15).toFixed(2)))} style={S.navBtn}>
            <ZoomIn size={16}/>
          </button>
        </div>
      </div>

      {/* ── Signature Modal ── */}
      <SignatureModal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        onApplySignature={handleApplySignature}
        initialName="Alex Johnson"
      />
    </div>
  );
}

// ── Style objects ─────────────────────────────────────────────────────────────
const S = {
  btn:    (bg, color) => ({ display:'flex', alignItems:'center', gap:5, backgroundColor:bg, color, border:'none', padding:'7px 13px', borderRadius:7, cursor:'pointer', fontWeight:600, fontSize:13 }),
  sel:    { backgroundColor:'#0f172a', color:'#e2e8f0', border:'1px solid #475569', borderRadius:6, padding:'4px 8px', fontSize:12 },
  miniBtn:{ border:'1px solid #475569', padding:'4px 9px', borderRadius:6, fontWeight:700, fontSize:11, cursor:'pointer' },
  navBtn: { backgroundColor:'#0f172a', color:'#e2e8f0', border:'1px solid #334155', padding:'6px 10px', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }
};

// ── Tiny sub-components ────────────────────────────────────────────────────────
const Lbl = ({ children }) => <span style={{ color:'#94a3b8', fontWeight:600 }}>{children}</span>;
const Dot = ({ c, active, onClick }) => (
  <div onClick={onClick} style={{ width:20, height:20, borderRadius:'50%', backgroundColor:c,
    border: active ? '2px solid #38bdf8':'1px solid #475569', cursor:'pointer', flexShrink:0 }}/>
);
