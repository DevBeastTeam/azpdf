import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Type, Edit3, Square, Stamp, Trash2, Download,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  FileText, ArrowLeft
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

// ─── PdfInteractiveEditor ─────────────────────────────────────────────────────
export default function PdfInteractiveEditor({ file, onSave, onCancel }) {

  // ── page state ──────────────────────────────────────────────────────────────
  const [numPages,    setNumPages]    = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom,        setZoom]        = useState(1.3);

  // ── tool state ──────────────────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState('text');  // 'text' | 'draw' | 'whiteout' | 'stamp'

  // ── text tool settings ──────────────────────────────────────────────────────
  const [fontSize,   setFontSize]   = useState(14);
  const [textColor,  setTextColor]  = useState('#1e293b');
  const [fillColor,  setFillColor]  = useState('transparent');
  const [strokeWidth,setStrokeWidth]= useState(3);
  const [stampType,  setStampType]  = useState('APPROVED');

  // ── PDF text items extracted from PDF.js (read-only positions from PDF) ─────
  // [ { id, pageNum, text, x, y, w, h, fontSize, color } ]
  const [pdfTextItems, setPdfTextItems] = useState([]);

  // ── user edits to existing PDF text ────────────────────────────────────────
  // key = item.id, value = { text, color, deleted }
  const [textEdits, setTextEdits] = useState({});

  // ── new annotations added by user (text/shape/stamp/draw) ──────────────────
  // { [pageNum]: [ annotationItem ] }
  const [annotations, setAnnotations] = useState({});

  // ── draw state ──────────────────────────────────────────────────────────────
  const [isDrawing,   setIsDrawing]   = useState(false);
  const [currentPath, setCurrentPath] = useState([]);

  // ── selected new-annotation id ──────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState(null);

  // ── refs ────────────────────────────────────────────────────────────────────
  const pdfCanvasRef  = useRef(null);
  const drawCanvasRef = useRef(null);
  const containerRef  = useRef(null);
  const pdfJsDocRef   = useRef(null);
  const renderTaskRef = useRef(null);
  const [pageDim, setPageDim] = useState({ w: 595, h: 842 });
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
          setLoadError('No valid PDF file.'); return;
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

  // ── Render page (canvas) + extract text items ───────────────────────────────
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

      // render PDF into canvas
      const task = page.render({
        canvasContext: pdfCanvasRef.current.getContext('2d'),
        viewport
      });
      renderTaskRef.current = task;
      await task.promise;
      renderTaskRef.current = null;

      // ── extract text content with positions ─────────────────────────────────
      const tc = await page.getTextContent();
      const pdfjsLib = await import('pdfjs-dist');
      const items = tc.items.map((item, idx) => {
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        // tx[4]=x, tx[5]=y-from-top (canvas coords)
        const x  = tx[4];
        const y  = tx[5] - Math.abs(item.height * scale);
        const w  = item.width * scale;
        const h  = Math.abs(item.height * scale) + 4;
        const fs = Math.round(Math.sqrt(tx[0] ** 2 + tx[1] ** 2));
        return {
          id:       `pdf-text-${pageNum}-${idx}`,
          pageNum,
          text:     item.str,
          origText: item.str,
          x, y, w: Math.max(w, 20), h: Math.max(h, 12),
          fontSize: fs || 12,
          color:    '#000000'
        };
      }).filter(i => i.text.trim().length > 0);

      setPdfTextItems(prev => {
        const others = prev.filter(i => i.pageNum !== pageNum);
        return [...others, ...items];
      });
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

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const curPageTextItems = pdfTextItems.filter(i => i.pageNum === currentPage);
  const curPageAnnotations = annotations[currentPage] || [];

  const updateAnnotations = (updater) =>
    setAnnotations(prev => ({
      ...prev,
      [currentPage]: typeof updater === 'function'
        ? updater(prev[currentPage] || [])
        : updater
    }));

  // ── Draw events ─────────────────────────────────────────────────────────────
  const getCanvasXY = (e) => {
    const r = drawCanvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
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
    // only fire on the bg layer itself
    if (!e.target.classList.contains('page-bg-clickable')) return;

    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top)  / rect.height) * 100;
    const id   = 'ann-' + Date.now();

    if (activeTool === 'text') {
      updateAnnotations(p => [...p, {
        id, type: 'text', x: xPct, y: yPct,
        text: 'New Text', fontSize, color: textColor,
        bg: fillColor === 'transparent' ? 'transparent' : fillColor
      }]);
      setSelectedId(id);
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
    setSelectedId(null);
  };

  // ── Delete new annotation ───────────────────────────────────────────────────
  const deleteAnnotation = () => {
    if (!selectedId) return;
    updateAnnotations(p => p.filter(i => i.id !== selectedId));
    setSelectedId(null);
  };

  const clearPage = () => {
    if (!window.confirm('Clear all changes on this page?')) return;
    updateAnnotations([]);
    setPdfTextItems(prev => prev.filter(i => i.pageNum !== currentPage));
    setTextEdits(prev => {
      const next = { ...prev };
      curPageTextItems.forEach(i => { delete next[i.id]; });
      return next;
    });
    setSelectedId(null);
  };

  // ── Save ────────────────────────────────────────────────────────────────────
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

      const font        = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages       = pdfDoc.getPages();

      // Helper: canvas-pixel → pdf-point coordinate
      const toPdfCoords = (xPx, yPx, canvasW, canvasH, pW, pH) => ({
        px: (xPx / canvasW) * pW,
        py: pH - (yPx / canvasH) * pH
      });

      // For each page that has edits
      const allPageNums = new Set([
        ...Object.keys(annotations).map(Number),
        ...pdfTextItems.map(i => i.pageNum)
      ]);

      allPageNums.forEach(pn => {
        const pg = pages[pn - 1] || pages[0];
        if (!pg) return;
        const { width: pW, height: pH } = pg.getSize();
        const cW = pageDim.w, cH = pageDim.h;

        // 1) Edited / deleted existing PDF text
        pdfTextItems.filter(i => i.pageNum === pn).forEach(item => {
          const edit = textEdits[item.id];
          if (!edit && !item._modified) return;

          // White-out the original position
          const coords = toPdfCoords(item.x, item.y, cW, cH, pW, pH);
          pg.drawRectangle({
            x: Math.max(0, coords.px - 2),
            y: Math.max(0, coords.py - 2),
            width:  Math.min(pW - coords.px, (item.w / cW) * pW + 4),
            height: Math.min(pH - coords.py, (item.h / cH) * pH + 4),
            color: rgb(1, 1, 1)
          });

          // If not deleted, draw new text
          if (!edit?.deleted) {
            const newText = edit?.text ?? item.text;
            if (newText.trim()) {
              pg.drawText(newText, {
                x: Math.max(4, coords.px),
                y: Math.max(4, coords.py),
                size: Math.max(6, (item.fontSize / cH) * pH * 1.5),
                font: fontRegular,
                color: hexToRgbLib(edit?.color || item.color) || rgb(0, 0, 0)
              });
            }
          }
        });

        // 2) New annotations
        (annotations[pn] || []).forEach(item => {
          if (item.type === 'text') {
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
            pg.drawText(item.stampText || 'APPROVED', { x: Math.max(0, xPdf + 8), y: Math.max(0, yPdf + 8), size: 12, font, color: sc });
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
        });
      });

      const bytes = await pdfDoc.save();
      const blob  = new Blob([bytes], { type: 'application/pdf' });
      const fname = file?.name ? file.name.replace(/\.pdf$/i, '_edited.pdf') : 'edited.pdf';
      onSave(blob, fname);
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
  };

  // ── colour palette ──────────────────────────────────────────────────────────
  const COLORS = ['#1e293b','#ef4444','#2563eb','#16a34a','#d97706','#7c3aed','#ffffff'];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ width:'100%', minHeight:'90vh', display:'flex', flexDirection:'column',
      backgroundColor:'#0f172a', borderRadius:16, overflow:'hidden',
      boxShadow:'0 20px 50px rgba(0,0,0,.5)',
      fontFamily:'system-ui,-apple-system,sans-serif', color:'#f8fafc' }}>

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
            { id:'text',     label:'Add Text', icon:<Type size={15}/> },
            { id:'draw',     label:'Draw',     icon:<Edit3 size={15}/> },
            { id:'whiteout', label:'Whiteout', icon:<Square size={15}/> },
            { id:'stamp',    label:'Stamp',    icon:<Stamp size={15}/> },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTool(t.id)} style={{
              display:'flex', alignItems:'center', gap:5, padding:'7px 13px', borderRadius:8, border:'none',
              backgroundColor: activeTool===t.id ? '#ef4444':'transparent',
              color: activeTool===t.id ? '#fff':'#94a3b8',
              fontWeight:700, fontSize:12, cursor:'pointer', transition:'all .15s'
            }}>{t.icon} {t.label}</button>
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
        display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', fontSize:12 }}>

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
            💡 Click anywhere on PDF text to cover it with a white box
          </span>}

        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          {selectedId && (
            <button onClick={deleteAnnotation} style={{
              display:'flex', alignItems:'center', gap:4,
              backgroundColor:'#7f1d1d', color:'#fca5a5',
              border:'1px solid #991b1b', padding:'4px 10px',
              borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:12
            }}><Trash2 size={13}/> Delete Selected</button>
          )}
          <button onClick={clearPage} style={{
            backgroundColor:'#334155', color:'#cbd5e1', border:'none',
            padding:'4px 10px', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:12
          }}>Clear Page</button>
        </div>
      </div>

      {/* ── Canvas workspace ─────────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', justifyContent:'center',
        alignItems:'flex-start', padding:'28px 20px', backgroundColor:'#090d16' }}>

        <div style={{ position:'relative', display:'inline-block',
          boxShadow:'0 14px 40px rgba(0,0,0,.6)', borderRadius:4 }}>

          {/* Real PDF canvas */}
          <canvas ref={pdfCanvasRef} style={{ display:'block' }}/>

          {/* Draw overlay canvas */}
          <canvas
            ref={drawCanvasRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ position:'absolute', top:0, left:0, zIndex:10,
              pointerEvents: activeTool==='draw' ? 'auto':'none' }}
          />

          {/* Click-through layer (for adding new things on empty space) */}
          <div
            ref={containerRef}
            className="page-bg-clickable"
            onClick={onPageBgClick}
            style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%',
              zIndex:5,
              cursor: activeTool==='draw' ? 'crosshair' :
                      activeTool==='text' ? 'text' : 'crosshair',
              pointerEvents: activeTool==='draw' ? 'none':'auto'
            }}
          />

          {/* ── Existing PDF text overlays (directly editable) ──────────── */}
          {curPageTextItems.map(item => {
            const edit    = textEdits[item.id] || {};
            const deleted = edit.deleted;
            if (deleted) return null;

            const currentText = edit.text ?? item.text;
            const isSelected  = selectedId === item.id;

            return (
              <div
                key={item.id}
                onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
                title="Click to edit this text"
                style={{
                  position: 'absolute',
                  left:   item.x,
                  top:    item.y,
                  width:  Math.max(item.w, 30),
                  minHeight: item.h,
                  zIndex: isSelected ? 50 : 30,
                  // show dashed border on hover/select to indicate editability
                  border: isSelected ? '1.5px dashed #ef4444' : '1px dashed transparent',
                  borderRadius: 2,
                  cursor: 'text',
                  backgroundColor: isSelected ? 'rgba(239,68,68,0.04)' : 'transparent',
                  boxSizing: 'border-box'
                }}
              >
                <input
                  type="text"
                  value={currentText}
                  onChange={e => editPdfText(item, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: 0,
                    margin: 0,
                    color: edit.color || item.color || '#000000',
                    fontSize: item.fontSize,
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    lineHeight: 1.2,
                    cursor: 'text',
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    // make wider to accommodate edits
                    minWidth: Math.max(item.w, currentText.length * item.fontSize * 0.6)
                  }}
                />
                {/* delete button visible when selected */}
                {isSelected && (
                  <button
                    onClick={e => { e.stopPropagation(); deletePdfText(item); }}
                    style={{
                      position: 'absolute',
                      top: -18,
                      right: 0,
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      zIndex: 60,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Trash2 size={10}/> Delete
                  </button>
                )}
              </div>
            );
          })}

          {/* ── New annotation overlays ─────────────────────────────────── */}
          {curPageAnnotations.map(item => {
            const sel = selectedId === item.id;

            if (item.type === 'text') return (
              <div key={item.id}
                onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
                style={{ position:'absolute', left:`${item.x}%`, top:`${item.y}%`,
                  zIndex: sel ? 45 : 20, padding:'2px 5px', borderRadius:3,
                  backgroundColor: item.bg || 'transparent',
                  border: sel ? '1.5px dashed #ef4444' : '1px dashed rgba(239,68,68,.4)',
                  cursor:'move' }}>
                <input
                  type="text"
                  value={item.text}
                  onChange={e => {
                    const v = e.target.value;
                    updateAnnotations(prev => prev.map(i => i.id===item.id ? {...i,text:v} : i));
                  }}
                  onClick={e => e.stopPropagation()}
                  style={{ background:'transparent', border:'none', outline:'none',
                    color: item.color||'#000', fontSize:`${(item.fontSize||14) * zoom}px`,
                    fontWeight:600, fontFamily:'Helvetica,Arial,sans-serif',
                    minWidth:60, cursor:'text' }}
                />
              </div>
            );

            if (item.type === 'shape') return (
              <div key={item.id}
                onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
                style={{ position:'absolute', left:`${item.x}%`, top:`${item.y}%`,
                  width:`${item.w}%`, height:`${item.h}%`,
                  backgroundColor: item.color, border:`1.5px solid ${item.border||'#e2e8f0'}`,
                  zIndex: sel ? 45:15, cursor:'pointer',
                  boxShadow: sel ? '0 0 0 3px rgba(239,68,68,.4)':'' }}/>
            );

            if (item.type === 'stamp') return (
              <div key={item.id}
                onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
                style={{ position:'absolute', left:`${item.x}%`, top:`${item.y}%`,
                  padding:'5px 12px', border:`3px double ${item.color}`, borderRadius:5,
                  backgroundColor:'#fff', color:item.color, fontWeight:900, fontSize:12,
                  letterSpacing:1, zIndex: sel ? 45:25, cursor:'pointer',
                  transform:'rotate(-5deg)',
                  boxShadow: sel ? '0 0 0 3px rgba(239,68,68,.4)':'0 2px 6px rgba(0,0,0,.15)' }}>
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
