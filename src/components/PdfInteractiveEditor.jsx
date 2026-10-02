import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Type, Edit3, Square, Stamp, Trash2, Download,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  FileText, ArrowLeft, Image as ImageIcon, Check, Move, Upload,
  Bold, Italic, Underline, Strikethrough
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

// ─── PdfInteractiveEditor ─────────────────────────────────────────────────────
export default function PdfInteractiveEditor({ file, onSave, onCancel }) {

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

  // ── tool state ──────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState('text');  // 'text' | 'image' | 'draw' | 'whiteout' | 'stamp'

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
  }, [annotations, currentPage, isDrawing, currentPath, textColor, strokeWidth]);

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
              // Remove if empty or still has the default placeholder
              if (!txt || txt === 'New Text') return false;
            }
            return true;
          });
        }
        return updated;
      });
    }
  }, [selectedId]);

  // ── Global Drag & Resize Listener for Annotations ──────────────────────────
  useEffect(() => {
    if (!draggingItem && !resizingItem) return;

    const handleMouseMove = (e) => {
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;

      if (draggingItem) {
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
        } else {
          // Annotation resizing uses percentage coordinates
          const dw = ((clientX - resizingItem.startX) / pageDim.w) * 100;
          const newW = Math.max(5, Math.min(95, +(resizingItem.startW + dw).toFixed(2)));
          const newH = resizingItem.aspectRatio
            ? +((newW / resizingItem.aspectRatio) * (pageDim.w / pageDim.h)).toFixed(2)
            : Math.max(3, Math.min(95, +(resizingItem.startH + ((clientY - resizingItem.startY) / pageDim.h) * 100).toFixed(2)));
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
  }, [draggingItem, resizingItem, pageDim, currentPage]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const curPageTextItems   = pdfTextItems.filter(i => i.pageNum === currentPage);
  const curPageAnnotations = annotations[currentPage] || [];

  const updateAnnotations = (updater) =>
    setAnnotations(prev => ({
      ...prev,
      [currentPage]: typeof updater === 'function'
        ? updater(prev[currentPage] || [])
        : updater
    }));

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
            name: uploadedFile.name
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

  // ── Delete annotation ───────────────────────────────────────────────────────
  const deleteAnnotation = () => {
    if (!selectedId) return;
    updateAnnotations(p => p.filter(i => i.id !== selectedId));
    setSelectedId(null);
  };

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
                const xPdf = (item.x / 100) * pW;
                const wPdf = (item.w / 100) * pW;
                const hPdf = (item.h / 100) * pH;
                const yPdf = pH - ((item.y / 100) * pH) - hPdf;
                pg.drawImage(embeddedImg, {
                  x: Math.max(0, xPdf),
                  y: Math.max(0, yPdf),
                  width: Math.min(pW - xPdf, wPdf),
                  height: Math.min(pH - yPdf, hPdf)
                });
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
            const xPdf = (item.x / 100) * pW;
            const yPdf = pH - ((item.y / 100) * pH) - 30;
            const sc   = hexToRgbLib(item.color) || rgb(0.1, 0.6, 0.2);
            pg.drawRectangle({ x: Math.max(0, xPdf), y: Math.max(0, yPdf), width: 130, height: 30, color: rgb(1, 1, 1), borderColor: sc, borderWidth: 2 });
            pg.drawText(item.stampText || 'APPROVED', { x: Math.max(0, xPdf + 8), y: Math.max(0, yPdf + 8), size: 12, font: fontBold, color: sc });
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
          }
        }
      }

      const bytes = await pdfDoc.save();
      const blob  = new Blob([bytes], { type: 'application/pdf' });
      const fname = file?.name ? file.name.replace(/\.pdf$/i, '_edited.pdf') : 'edited.pdf';
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
          <span style={{ fontWeight:700, fontSize:14, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {file?.name || 'document.pdf'}
          </span>
          {loadError && <span style={{ color:'#f87171', fontSize:12 }}>⚠ {loadError}</span>}
          {!pdfLoaded && !loadError && <span style={{ color:'#94a3b8', fontSize:12, animation:'pulse 1s infinite' }}>Loading PDF…</span>}
        </div>

        {/* Tool bar */}
        <div style={{ display:'flex', backgroundColor:'#0f172a', padding:4, borderRadius:10,
          border:'1px solid #334155', gap:3 }}>
          {[
            { id:'text',     label:'Add Text',   icon:<Type size={15}/> },
            { id:'image',    label:'Add Image',  icon:<ImageIcon size={15}/> },
            { id:'draw',     label:'Draw',       icon:<Edit3 size={15}/> },
            { id:'whiteout', label:'Whiteout',   icon:<Square size={15}/> },
            { id:'stamp',    label:'Stamp',      icon:<Stamp size={15}/> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'image') {
                  imageInputRef.current?.click();
                } else {
                  setActiveTool(t.id);
                  setSelectedId(null);
                }
              }}
              style={{
                display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:8, border:'none',
                backgroundColor: activeTool===t.id ? '#ef4444':'transparent',
                color: activeTool===t.id ? '#fff':'#94a3b8',
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
          <Download size={17}/> Apply &amp; Download
        </button>
      </div>

      {/* ── Property Bar ────────────────────────────────────────────────── */}
      <div style={{ padding:'8px 20px', backgroundColor:'#1e293b', borderBottom:'1px solid #334155',
        display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', fontSize:12, minHeight: 46 }}>

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

        {/* State B: Selected Image Annotation */}
        {selectedAnnotation?.type === 'image' && (
          <>
            <span style={{ backgroundColor: '#7c3aed', color: '#fff', padding: '3px 9px', borderRadius: 5, fontWeight: 700, fontSize: 11 }}>
              Image Selected
            </span>
            <Lbl>Size:</Lbl>
            <input
              type="range"
              min={10}
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
            <button
              onClick={() => imageInputRef.current?.click()}
              style={{ ...S.miniBtn, backgroundColor: '#0f172a', color: '#93c5fd' }}
            >
              Replace Image
            </button>
            <button
              onClick={deleteAnnotation}
              style={{ ...S.miniBtn, backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Trash2 size={12} /> Delete Image
            </button>
          </>
        )}

        {/* State C: Default tool controls when nothing active is selected */}
        {!selectedExtractedItem && selectedAnnotation?.type !== 'image' && (
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
          {selectedId && !selectedExtractedItem && selectedAnnotation?.type !== 'image' && (
            <button onClick={deleteAnnotation} style={{
              display:'flex', alignItems:'center', gap:4,
              backgroundColor:'#7f1d1d', color:'#fca5a5',
              border:'1px solid #991b1b', padding:'4px 10px',
              borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:12
            }}><Trash2 size={13}/> Delete Selected</button>
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
              zIndex: activeTool==='draw' ? 100 : 10,
              touchAction: 'none',
              pointerEvents: activeTool==='draw' ? 'auto':'none' }}
          />

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

          {/* ── New annotation overlays (Images, Text, Shapes, Stamps) ──────── */}
          {curPageAnnotations.map(item => {
            const sel = selectedId === item.id;
            const isDraggingThis = draggingItem?.id === item.id;

            // Image Annotation
            if (item.type === 'image') {
              return (
                <div
                  key={item.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); setActiveTool('image'); }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedId(item.id);
                    setActiveTool('image');
                    setDraggingItem({
                      id: item.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      startItemX: item.x,
                      startItemY: item.y
                    });
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    const t = e.touches[0];
                    setSelectedId(item.id);
                    setActiveTool('image');
                    setDraggingItem({
                      id: item.id,
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

                  {/* Resize handle in bottom-right corner */}
                  {sel && (
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingItem({
                          id: item.id,
                          startX: e.clientX,
                          startY: e.clientY,
                          startW: item.w,
                          startH: item.h,
                          aspectRatio: item.aspectRatio || (item.w / item.h)
                        });
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const t = e.touches[0];
                        setResizingItem({
                          id: item.id,
                          startX: t.clientX,
                          startY: t.clientY,
                          startW: item.w,
                          startH: item.h,
                          aspectRatio: item.aspectRatio || (item.w / item.h)
                        });
                      }}
                      style={{
                        position: 'absolute',
                        right: -6,
                        bottom: -6,
                        width: 14,
                        height: 14,
                        backgroundColor: '#2563eb',
                        border: '2px solid #ffffff',
                        borderRadius: '50%',
                        cursor: 'nwse-resize',
                        zIndex: 70,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}
                      title="Drag to resize image"
                    />
                  )}

                  {/* Delete button */}
                  {sel && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAnnotation(); }}
                      style={{
                        position: 'absolute',
                        top: -24,
                        right: 0,
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        whiteSpace: 'nowrap',
                        zIndex: 70,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Trash2 size={10} /> Delete Image
                    </button>
                  )}
                </div>
              );
            }

            // New Text Annotation
            if (item.type === 'text') return (
              <div key={item.id}
                onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
                onMouseDown={e => {
                  if (e.target.tagName !== 'INPUT') {
                    e.stopPropagation();
                    setDraggingItem({
                      id: item.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      startItemX: item.x,
                      startItemY: item.y
                    });
                  }
                }}
                style={{ position:'absolute', left:`${item.x}%`, top:`${item.y}%`,
                  zIndex: sel ? 45 : 20, padding:'2px 6px', borderRadius:4,
                  backgroundColor: item.bg || 'transparent',
                  border: sel ? '1.5px dashed #2563eb' : '1px dashed rgba(37,99,235,.4)',
                  cursor: isDraggingThis ? 'grabbing' : 'move' }}>
                <input
                  type="text"
                  autoFocus={sel}
                  value={item.text}
                  onChange={e => {
                    const v = e.target.value;
                    updateAnnotations(prev => prev.map(i => i.id===item.id ? {...i,text:v} : i));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Escape') { e.preventDefault(); setSelectedId(null); }
                  }}
                  onFocus={e => {
                    // Auto-select placeholder text for easy replacement
                    if (item.text === 'New Text') e.target.select();
                  }}
                  onClick={e => e.stopPropagation()}
                  style={{ background:'transparent', border:'none', outline:'none',
                    color: item.color||'#000', fontSize:`${(item.fontSize||14) * zoom}px`,
                    fontWeight:600, fontFamily:'Helvetica,Arial,sans-serif',
                    minWidth:60, cursor:'text' }}
                />
                {/* Delete button on text box */}
                {sel && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateAnnotations(prev => prev.filter(i => i.id !== item.id));
                      setSelectedId(null);
                    }}
                    title="Delete text box"
                    style={{
                      position: 'absolute', top: -10, right: -10,
                      width: 20, height: 20,
                      backgroundColor: '#ef4444', color: '#fff',
                      border: '2px solid #fff', borderRadius: '50%',
                      fontSize: 11, fontWeight: 800,
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      padding: 0, lineHeight: 1,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      zIndex: 50
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            );

            // Shape / Whiteout Annotation
            if (item.type === 'shape') return (
              <div key={item.id}
                onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
                onMouseDown={e => {
                  e.stopPropagation();
                  setDraggingItem({
                    id: item.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    startItemX: item.x,
                    startItemY: item.y
                  });
                }}
                style={{ position:'absolute', left:`${item.x}%`, top:`${item.y}%`,
                  width:`${item.w}%`, height:`${item.h}%`,
                  backgroundColor: item.color, border:`1.5px solid ${item.border||'#e2e8f0'}`,
                  zIndex: sel ? 45:15, cursor: isDraggingThis ? 'grabbing' : 'move',
                  boxShadow: sel ? '0 0 0 3px rgba(37,99,235,.4)':'' }}/>
            );

            // Stamp Annotation
            if (item.type === 'stamp') return (
              <div key={item.id}
                onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
                onMouseDown={e => {
                  e.stopPropagation();
                  setDraggingItem({
                    id: item.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    startItemX: item.x,
                    startItemY: item.y
                  });
                }}
                style={{ position:'absolute', left:`${item.x}%`, top:`${item.y}%`,
                  padding:'5px 12px', border:`3px double ${item.color}`, borderRadius:5,
                  backgroundColor:'#fff', color:item.color, fontWeight:900, fontSize:12,
                  letterSpacing:1, zIndex: sel ? 45:25, cursor: isDraggingThis ? 'grabbing' : 'move',
                  transform:'rotate(-5deg)',
                  boxShadow: sel ? '0 0 0 3px rgba(37,99,235,.4)':'0 2px 6px rgba(0,0,0,.15)' }}>
                {item.stampText}
              </div>
            );

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
