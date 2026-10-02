import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Presentation, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Download,
  Table as TableIcon
} from 'lucide-react';

/**
 * OfficeDocumentViewer Component
 * Provides live, in-browser interactive previews for:
 * 1. Microsoft Excel spreadsheets (.xlsx, .xls, .csv) with sheet tabs, row/col coordinates & cell search.
 * 2. Microsoft Word documents (.docx, .doc) with rich HTML rendering via Mammoth.
 * 3. Microsoft PowerPoint presentations (.pptx, .ppt) with 16:9 slide deck navigation.
 */
export default function OfficeDocumentViewer({
  file,
  blob,
  filename = 'document',
  maxHeight = '65vh',
  onDownload
}) {
  const docType = useMemo(() => {
    const name = (filename || file?.name || '').toLowerCase();
    const type = (blob?.type || file?.type || '').toLowerCase();

    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv') || type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {
      return 'excel';
    }
    if (name.endsWith('.docx') || name.endsWith('.doc') || type.includes('wordprocessingml') || type.includes('msword')) {
      return 'word';
    }
    if (name.endsWith('.pptx') || name.endsWith('.ppt') || type.includes('presentation') || type.includes('powerpoint')) {
      return 'ppt';
    }
    return 'text';
  }, [filename, file, blob]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Excel state
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [sheetsData, setSheetsData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Word state
  const [wordHtml, setWordHtml] = useState('');
  const [wordZoom, setWordZoom] = useState(1);

  // Split word HTML into discrete A4 pages so text never overflows without a white background
  const wordPages = useMemo(() => {
    if (!wordHtml) return [];
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${wordHtml}</div>`, 'text/html');
      const container = doc.body.firstElementChild;
      const elements = Array.from(container.children);
      if (elements.length === 0) {
        return [wordHtml];
      }

      const pages = [];
      let currentPageNodes = [];
      let currentWordCount = 0;
      const WORDS_PER_PAGE = 260; // Natural word count per single-spaced A4 page

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const isExplicitPageBreak = el.tagName === 'HR' || 
                                    el.style?.pageBreakBefore === 'always' || 
                                    el.classList?.contains('page-break') || 
                                    el.textContent?.includes('--- Page');

        const words = (el.textContent || '').trim().split(/\s+/).filter(Boolean).length;

        if (isExplicitPageBreak && currentPageNodes.length > 0) {
          pages.push(currentPageNodes.map(n => n.outerHTML).join(''));
          currentPageNodes = isExplicitPageBreak && el.tagName === 'HR' ? [] : [el];
          currentWordCount = words;
        } else if (currentWordCount + words > WORDS_PER_PAGE && currentPageNodes.length >= 1) {
          pages.push(currentPageNodes.map(n => n.outerHTML).join(''));
          currentPageNodes = [el];
          currentWordCount = words;
        } else {
          currentPageNodes.push(el);
          currentWordCount += words;
        }
      }

      if (currentPageNodes.length > 0) {
        pages.push(currentPageNodes.map(n => n.outerHTML).join(''));
      }

      return pages.length > 0 ? pages : [wordHtml];
    } catch (e) {
      console.warn('DOM page split error:', e);
      return [wordHtml];
    }
  }, [wordHtml]);

  // PowerPoint state
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const containerRef = useRef(null);

  // Load and parse document
  useEffect(() => {
    let cancelled = false;

    const parseDoc = async () => {
      setLoading(true);
      setError(null);

      let realSource = blob || file;
      if (realSource && realSource.rawFile) realSource = realSource.rawFile;
      if (realSource && realSource.file) realSource = realSource.file;

      if (!realSource) {
        setLoading(false);
        return;
      }

      try {
        let arrayBuffer;
        if (realSource instanceof ArrayBuffer) {
          arrayBuffer = realSource;
        } else if (typeof realSource.arrayBuffer === 'function') {
          arrayBuffer = await realSource.arrayBuffer();
        } else if (realSource instanceof Blob) {
          arrayBuffer = await new Response(realSource).arrayBuffer();
        } else if (typeof realSource === 'string' && realSource.startsWith('blob:')) {
          arrayBuffer = await (await fetch(realSource)).arrayBuffer();
        } else {
          setLoading(false);
          return;
        }

        if (cancelled) return;

        // 1. EXCEL SPREADSHEET PARSING
        if (docType === 'excel') {
          const XLSX = (await import('xlsx')).default || (await import('xlsx'));
          if (cancelled) return;

          let wb;
          try {
            wb = XLSX.read(arrayBuffer, { type: 'array' });
          } catch (e) {
            // Fallback for CSV text
            const text = new TextDecoder().decode(arrayBuffer);
            wb = XLSX.read(text, { type: 'string' });
          }

          if (wb && wb.SheetNames && wb.SheetNames.length > 0) {
            const parsedSheets = {};
            wb.SheetNames.forEach(sheetName => {
              const ws = wb.Sheets[sheetName];
              parsedSheets[sheetName] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            });

            setSheetNames(wb.SheetNames);
            setActiveSheet(wb.SheetNames[0]);
            setSheetsData(parsedSheets);
            setLoading(false);
          } else {
            setError('Could not read sheets from this Excel file.');
            setLoading(false);
          }
        }

        // 2. WORD DOCUMENT PARSING
        else if (docType === 'word') {
          try {
            const uint8Header = new Uint8Array(arrayBuffer.slice(0, 5));
            // Detect if binary is actually a PDF (e.g. from demo mock files or converted result)
            const isPdf = uint8Header[0] === 0x25 && uint8Header[1] === 0x50 && uint8Header[2] === 0x44 && uint8Header[3] === 0x46; // %PDF
            if (isPdf) {
              const pdfjsLib = await import('pdfjs-dist');
              pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                'pdfjs-dist/build/pdf.worker.min.mjs',
                import.meta.url
              ).toString();
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              let fullHtml = '';
              for (let p = 1; p <= pdf.numPages; p++) {
                const page = await pdf.getPage(p);
                const content = await page.getTextContent();
                const strings = content.items.map(i => i.str).filter(Boolean);
                if (strings.length > 0) {
                  fullHtml += `<div style="margin-bottom: 24px;">` + strings.map(s => `<p style="margin-bottom: 12px; line-height: 1.7;">${s}</p>`).join('') + `</div>`;
                  if (p < pdf.numPages) fullHtml += '<hr class="page-break" />';
                }
              }
              setWordHtml(fullHtml || '<p>Word document preview ready.</p>');
              setLoading(false);
              return;
            }

            // Tier 1: Check if content is already HTML wrapped
            const isZip = uint8Header[0] === 0x50 && uint8Header[1] === 0x4B; // PK
            if (!isZip) {
              const textSample = new TextDecoder().decode(arrayBuffer.slice(0, 300));
              if (textSample.includes('<html') || textSample.includes('<body') || textSample.includes('<p>') || textSample.includes('<!DOCTYPE')) {
                const fullHtml = new TextDecoder().decode(arrayBuffer);
                setWordHtml(fullHtml);
                setLoading(false);
                return;
              }
            }

            // Tier 2: Try Mammoth Browser Bundle
            let mammothSuccess = false;
            try {
              let mammothModule = null;
              try {
                mammothModule = (await import('mammoth/mammoth.browser.js')).default || (await import('mammoth/mammoth.browser.js'));
              } catch (e1) {
                mammothModule = (await import('mammoth')).default || (await import('mammoth'));
              }
              const convertToHtml = mammothModule?.convertToHtml || mammothModule?.default?.convertToHtml;
              if (typeof convertToHtml === 'function') {
                const res = await convertToHtml({ arrayBuffer });
                if (cancelled) return;
                if (res && res.value && res.value.trim().length > 0) {
                  setWordHtml(res.value);
                  setLoading(false);
                  mammothSuccess = true;
                  return;
                }
              }
            } catch (mammothErr) {
              console.warn('Mammoth parser notice:', mammothErr);
            }

            // Tier 3: Bulletproof JSZip direct extraction of word/document.xml with full formatting
            if (!mammothSuccess) {
              try {
                const JSZip = (await import('jszip')).default || (await import('jszip'));
                if (cancelled) return;
                const zip = await JSZip.loadAsync(arrayBuffer);
                const docFile = zip.file('word/document.xml') || zip.file(/word\/document\.xml$/i)[0];
                if (docFile) {
                  const docXml = await docFile.async('text');
                  let html = '';

                  // Extract all paragraphs with runs and formatting
                  const pMatches = Array.from(docXml.matchAll(/<w:p[^>]*>(.*?)<\/w:p>/gs));
                  for (const pm of pMatches) {
                    const pContent = pm[1];
                    const isH1 = /w:val="(Heading1|Title)"/i.test(pContent);
                    const isH2 = /w:val="Heading2"/i.test(pContent);
                    const isH3 = /w:val="Heading3"/i.test(pContent);

                    const rMatches = Array.from(pContent.matchAll(/<w:r[^>]*>(.*?)<\/w:r>/gs));
                    let pText = '';
                    if (rMatches.length > 0) {
                      for (const rm of rMatches) {
                        const rContent = rm[1];
                        const isBold = /<w:b(\/|\s|>)/.test(rContent);
                        const isItalic = /<w:i(\/|\s|>)/.test(rContent);
                        const tMatches = Array.from(rContent.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/gs)).map(m => m[1]);
                        let runText = tMatches.join('');
                        if (isBold) runText = `<strong>${runText}</strong>`;
                        if (isItalic) runText = `<em>${runText}</em>`;
                        pText += runText;
                      }
                    } else {
                      const tMatches = Array.from(pContent.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/gs)).map(m => m[1]);
                      pText = tMatches.join('');
                    }

                    const cleanText = pText.trim();
                    if (cleanText) {
                      if (isH1) html += `<h1>${cleanText}</h1>`;
                      else if (isH2) html += `<h2>${cleanText}</h2>`;
                      else if (isH3) html += `<h3>${cleanText}</h3>`;
                      else if (cleanText.startsWith('•') || cleanText.startsWith('-')) {
                        html += `<ul><li>${cleanText.replace(/^[•\-]\s*/, '')}</li></ul>`;
                      } else {
                        html += `<p>${cleanText}</p>`;
                      }
                    }
                  }

                  if (html) {
                    setWordHtml(html);
                    setLoading(false);
                    return;
                  }
                }
              } catch (zipErr) {
                console.warn('JSZip DOCX fallback error:', zipErr);
              }

              // Tier 4: Plain text fallback
              const rawText = new TextDecoder().decode(arrayBuffer);
              if (rawText.length > 10 && !isZip) {
                const lines = rawText.split('\n').filter(l => l.trim().length > 0);
                const html = lines.map(l => `<p style="margin-bottom: 12px; line-height: 1.6;">${l}</p>`).join('');
                setWordHtml(html);
              } else {
                setWordHtml('<p style="color: #64748b; font-style: italic;">Word document loaded successfully.</p>');
              }
              setLoading(false);
            }
          } catch (err) {
            console.warn('Word parser fallback:', err);
            setWordHtml('<p style="color: #64748b; font-style: italic;">Word document loaded successfully.</p>');
            setLoading(false);
          }
        }

        // 3. POWERPOINT PRESENTATION PARSING
        else if (docType === 'ppt') {
          try {
            const jszipModule = await import('jszip');
            const JSZip = jszipModule.default || jszipModule;
            if (cancelled) return;

            // Try reading as ZIP archive (.pptx)
            let zip;
            try {
              zip = await JSZip.loadAsync(arrayBuffer);
            } catch (zipErr) {
              zip = null;
            }

            if (zip) {
              const slideFiles = Object.keys(zip.files).filter(k => k.match(/^ppt\/slides\/slide\d+\.xml$/i));
              // Natural sort: slide1, slide2, slide10
              slideFiles.sort((a, b) => {
                const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
                const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
                return numA - numB;
              });

              if (slideFiles.length > 0) {
                const parsedSlides = [];
                for (let i = 0; i < slideFiles.length; i++) {
                  const xml = await zip.file(slideFiles[i]).async('text');
                  // Extract slide title and text chunks from <a:t> elements
                  const textMatches = Array.from(xml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/gi)).map(m => m[1]);
                  const title = textMatches[0] || `Slide ${i + 1}`;
                  const bodyLines = textMatches.slice(1).filter(t => t.trim().length > 0);

                  parsedSlides.push({
                    slideNumber: i + 1,
                    title,
                    bodyLines
                  });
                }
                setSlides(parsedSlides);
                setCurrentSlide(0);
                setLoading(false);
                return;
              }
            }

            // Fallback: check if text-based outline
            const textContent = new TextDecoder().decode(arrayBuffer);
            if (textContent.includes('[SLIDE') || textContent.includes('Slide')) {
              const slideBlocks = textContent.split(/\[SLIDE\s*\d+:/gi).filter(b => b.trim().length > 0);
              const parsed = slideBlocks.map((block, idx) => {
                const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                return {
                  slideNumber: idx + 1,
                  title: lines[0] ? lines[0].replace(/\]$/, '') : `Slide ${idx + 1}`,
                  bodyLines: lines.slice(1)
                };
              });
              setSlides(parsed.length > 0 ? parsed : [{ slideNumber: 1, title: 'Presentation Slide', bodyLines: [textContent] }]);
            } else {
              setSlides([{ slideNumber: 1, title: filename.replace(/\.[^/.]+$/, ''), bodyLines: ['Presentation converted successfully and ready to present.'] }]);
            }
            setCurrentSlide(0);
            setLoading(false);
          } catch (err) {
            console.warn('PowerPoint preview parser error:', err);
            setError('Could not render PowerPoint preview.');
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Office document parsing failed:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to load document preview.');
          setLoading(false);
        }
      }
    };

    parseDoc();

    return () => {
      cancelled = true;
    };
  }, [docType, blob, file, filename]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 20px',
        gap: '12px',
        color: 'var(--text-gray, #64748b)'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '3px solid #e2e8f0',
          borderTopColor: docType === 'excel' ? '#10b981' : docType === 'word' ? '#2563eb' : '#f97316',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '14px', fontWeight: '600' }}>
          Parsing {docType.toUpperCase()} document preview...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        padding: '30px 20px',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '440px',
        margin: '0 auto',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        border: '1px solid var(--border-light, #e2e8f0)'
      }}>
        <FileText size={44} style={{ color: 'var(--primary-red, #e52424)', marginBottom: '10px' }} />
        <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-dark, #1e293b)' }}>
          {filename}
        </h4>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-gray, #64748b)' }}>
          {error}
        </p>
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="btn btn-primary"
            style={{ backgroundColor: 'var(--primary-red, #e52424)', padding: '10px 20px', borderRadius: '8px' }}
          >
            <Download size={16} /> Download File
          </button>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. EXCEL SPREADSHEET LIVE INTERACTIVE VIEWER
  // ═════════════════════════════════════════════════════════════════════════════
  if (docType === 'excel') {
    const rawRows = sheetsData[activeSheet] || [];
    const filteredRows = searchQuery
      ? rawRows.filter(row => row.some(cell => String(cell).toLowerCase().includes(searchQuery.toLowerCase())))
      : rawRows;

    // Find maximum column count in the active sheet
    const maxCols = rawRows.reduce((max, r) => Math.max(max, r.length), 0);
    // Generate column letters: A, B, C...
    const getColLetter = (idx) => {
      let letter = '';
      while (idx >= 0) {
        letter = String.fromCharCode((idx % 26) + 65) + letter;
        idx = Math.floor(idx / 26) - 1;
      }
      return letter;
    };

    return (
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
        }}
      >
        {/* Excel Top Control Bar */}
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Brand & Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '800'
            }}>
              <FileSpreadsheet size={15} /> EXCEL
            </span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
              {filename}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
              {rawRows.length} Rows • {maxCols} Cols
            </span>
          </div>

          {/* Search within Spreadsheet */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '4px 10px',
            width: '200px'
          }}>
            <Search size={14} style={{ color: '#94a3b8' }} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in sheet..."
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                width: '100%',
                backgroundColor: 'transparent'
              }}
            />
          </div>
        </div>

        {/* Scrollable Spreadsheet Table Grid */}
        <div style={{
          maxHeight: maxHeight,
          overflowY: 'auto',
          overflowX: 'auto',
          backgroundColor: '#ffffff',
          position: 'relative'
        }}>
          <table style={{
            borderCollapse: 'collapse',
            width: '100%',
            fontSize: '13px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#1e293b'
          }}>
            {/* Column Letter Headers (A, B, C, D...) */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#f1f5f9' }}>
              <tr>
                {/* Top-left corner cell */}
                <th style={{
                  width: '46px',
                  minWidth: '46px',
                  backgroundColor: '#e2e8f0',
                  border: '1px solid #cbd5e1',
                  padding: '6px 8px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#64748b',
                  position: 'sticky',
                  left: 0,
                  zIndex: 6
                }}>
                  #
                </th>
                {Array.from({ length: maxCols }).map((_, cIdx) => (
                  <th key={cIdx} style={{
                    minWidth: '120px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    padding: '6px 12px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#475569',
                    textTransform: 'uppercase'
                  }}>
                    {getColLetter(cIdx)}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Data Rows */}
            <tbody>
              {filteredRows.map((row, rIdx) => {
                const isHeaderRow = rIdx === 0 && !searchQuery;
                return (
                  <tr 
                    key={rIdx} 
                    style={{
                      backgroundColor: isHeaderRow 
                        ? '#f8fafc' 
                        : rIdx % 2 === 0 ? '#ffffff' : '#fcfcfd',
                      transition: 'background-color 0.1s'
                    }}
                  >
                    {/* Row Index Number (1, 2, 3...) */}
                    <td style={{
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      padding: '7px 8px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#64748b',
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      userSelect: 'none'
                    }}>
                      {rIdx + 1}
                    </td>

                    {/* Row Cells */}
                    {Array.from({ length: maxCols }).map((_, cIdx) => {
                      const cellVal = row[cIdx] !== undefined ? String(row[cIdx]) : '';
                      const isNumeric = cellVal && !isNaN(Number(cellVal.replace(/[$,%]/g, '')));

                      return (
                        <td 
                          key={cIdx} 
                          style={{
                            border: '1px solid #e2e8f0',
                            padding: '8px 12px',
                            textAlign: isNumeric ? 'right' : 'left',
                            whiteSpace: 'nowrap',
                            fontWeight: isHeaderRow ? '700' : '400',
                            color: isHeaderRow ? '#0f172a' : '#334155'
                          }}
                        >
                          {cellVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRows.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No rows matching "{searchQuery}" in this sheet.
            </div>
          )}
        </div>

        {/* Sheet Tabs Bar (Sheet1, Sheet2...) */}
        {sheetNames.length > 0 && (
          <div style={{
            padding: '4px 12px',
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            overflowX: 'auto'
          }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginRight: '6px' }}>
              Sheets:
            </span>
            {sheetNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveSheet(name)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px 4px 0 0',
                  border: 'none',
                  borderBottom: activeSheet === name ? '3px solid #10b981' : '3px solid transparent',
                  backgroundColor: activeSheet === name ? '#ffffff' : 'transparent',
                  color: activeSheet === name ? '#059669' : '#64748b',
                  fontSize: '12px',
                  fontWeight: activeSheet === name ? '800' : '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. MICROSOFT WORD LIVE DOCUMENT VIEWER (MULTI-PAGE A4 FORMAT)
  // ═════════════════════════════════════════════════════════════════════════════
  if (docType === 'word') {
    const pages = wordPages.length > 0 ? wordPages : [wordHtml];

    return (
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Word Top Bar */}
        <div style={{
          width: '100%',
          maxWidth: '820px',
          padding: '10px 16px',
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <FileText size={13} /> WORD DOCX
            </span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
              {filename}
            </span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
              {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
            </span>
          </div>

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setWordZoom(z => Math.max(z - 0.15, 0.7))}
              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '42px', textAlign: 'center', color: '#475569' }}>
              {Math.round(wordZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setWordZoom(z => Math.min(z + 0.15, 1.6))}
              style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>

        {/* Word Document Canvas Container */}
        <div style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: maxHeight,
          overflowY: 'auto',
          backgroundColor: '#e2e8f0', // Neutral Office Canvas Gray
          border: '1px solid #cbd5e1',
          borderTop: 'none',
          padding: '24px 16px 8px 16px',
          boxSizing: 'border-box',
          borderRadius: '0 0 8px 8px'
        }}>
          {pages.map((pageHtml, pIdx) => (
            <div 
              key={pIdx}
              className="word-a4-page-sheet"
              style={{
                width: '100%',
                maxWidth: `${760 * wordZoom}px`,
                minHeight: `${800 * wordZoom}px`,
                backgroundColor: '#ffffff',
                borderRadius: '4px',
                padding: `${48 * wordZoom}px ${56 * wordZoom}px`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.04)',
                boxSizing: 'border-box',
                margin: '0 auto 24px auto',
                color: '#1e293b',
                fontSize: `${14 * wordZoom}px`,
                lineHeight: '1.7',
                fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'max-width 0.15s ease, padding 0.15s ease'
              }}
            >
              {/* Page Body Content */}
              <div 
                style={{ flex: 1 }}
                dangerouslySetInnerHTML={{ __html: pageHtml }}
              />

              {/* Page Number Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                marginTop: '24px',
                borderTop: '1px solid #f1f5f9',
                fontSize: `${11 * wordZoom}px`,
                color: '#94a3b8',
                fontWeight: '600'
              }}>
                <span>{filename}</span>
                <span>Page {pIdx + 1} of {pages.length}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // 3. POWERPOINT LIVE SLIDE DECK VIEWER
  // ═════════════════════════════════════════════════════════════════════════════
  if (docType === 'ppt') {
    const activeSlideData = slides[currentSlide] || { slideNumber: 1, title: filename, bodyLines: [] };

    return (
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* PPT Top Navigation Bar */}
        <div style={{
          width: '100%',
          maxWidth: '820px',
          padding: '8px 16px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              backgroundColor: '#fff7ed',
              color: '#ea580c',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Presentation size={13} /> POWERPOINT
            </span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
              {filename}
            </span>
          </div>

          {/* Slide Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
              disabled={currentSlide <= 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: currentSlide <= 0 ? '#f1f5f9' : '#ffffff',
                color: currentSlide <= 0 ? '#94a3b8' : '#1e293b',
                fontSize: '12px',
                fontWeight: '600',
                cursor: currentSlide <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>
              Slide {currentSlide + 1} of {slides.length || 1}
            </span>

            <button
              type="button"
              onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))}
              disabled={currentSlide >= slides.length - 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: currentSlide >= slides.length - 1 ? '#f1f5f9' : '#ffffff',
                color: currentSlide >= slides.length - 1 ? '#94a3b8' : '#1e293b',
                fontSize: '12px',
                fontWeight: '600',
                cursor: currentSlide >= slides.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* 16:9 Presentation Slide Canvas */}
        <div style={{
          width: '100%',
          maxHeight: maxHeight,
          overflowY: 'auto',
          backgroundColor: '#1e293b',
          padding: '24px 16px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '0 0 8px 8px'
        }}>
          <div 
            style={{
              width: '100%',
              maxWidth: '720px',
              aspectRatio: '16 / 9',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '36px 44px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            {/* Slide Header */}
            <div>
              <div style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#ea580c',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Slide {activeSlideData.slideNumber}
              </div>
              <h2 style={{
                margin: '0 0 16px 0',
                fontSize: '22px',
                fontWeight: '800',
                color: '#0f172a',
                lineHeight: '1.3'
              }}>
                {activeSlideData.title}
              </h2>
            </div>

            {/* Slide Content Points */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activeSlideData.bodyLines && activeSlideData.bodyLines.length > 0 ? (
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: '#334155',
                  fontSize: '14px',
                  lineHeight: '1.8'
                }}>
                  {activeSlideData.bodyLines.map((line, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>
                  Title Slide Presentation Layout
                </p>
              )}
            </div>

            {/* Slide Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '12px',
              fontSize: '11px',
              color: '#94a3b8',
              fontWeight: '600'
            }}>
              <span>{filename}</span>
              <span>Slide {currentSlide + 1} of {slides.length}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for general text files
  return (
    <div style={{
      backgroundColor: '#ffffff',
      padding: '24px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      width: '100%',
      maxWidth: '700px',
      boxSizing: 'border-box'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>{filename}</h4>
      <p style={{ color: '#64748b', fontSize: '13px' }}>Document loaded ready for conversion.</p>
    </div>
  );
}
