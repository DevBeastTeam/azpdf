const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const pdfParse = require('pdf-parse');

/**
 * PDFCompareService
 * Compares two PDF documents by extracting text and performing
 * line-by-line diff analysis, computing similarity percentage,
 * and generating a detailed comparison report.
 */
class PDFCompareService {
  async process(files) {
    const file1 = files && files[0] ? files[0] : null;
    const file2 = files && files[1] ? files[1] : null;

    const file1Name = file1 ? file1.originalname : 'document_a.pdf';
    const file2Name = file2 ? file2.originalname : 'document_b.pdf';

    let text1 = '', text2 = '';
    let pages1 = 1, pages2 = 1;

    // Extract text from both files
    if (file1 && file1.buffer) {
      try {
        const parsed = await pdfParse(file1.buffer);
        text1 = parsed.text || '';
        pages1 = parsed.numpages || 1;
      } catch (e) {
        console.warn('[PDFCompareService] File1 parse error:', e.message);
      }
    }
    if (file2 && file2.buffer) {
      try {
        const parsed = await pdfParse(file2.buffer);
        text2 = parsed.text || '';
        pages2 = parsed.numpages || 1;
      } catch (e) {
        console.warn('[PDFCompareService] File2 parse error:', e.message);
      }
    }

    // Tokenize into sentences/lines
    const lines1 = text1.split(/\n+/).map(l => l.trim()).filter(l => l.length > 5);
    const lines2 = text2.split(/\n+/).map(l => l.trim()).filter(l => l.length > 5);

    // Compute similarity metrics
    const set1 = new Set(lines1);
    const set2 = new Set(lines2);
    const commonLines = [...set1].filter(l => set2.has(l));
    const uniqueToFile1 = [...set1].filter(l => !set2.has(l));
    const uniqueToFile2 = [...set2].filter(l => !set1.has(l));
    const totalUniq = set1.size + set2.size;
    const similarityPct = totalUniq > 0
      ? ((2 * commonLines.length / totalUniq) * 100).toFixed(1)
      : '0.0';

    // Word-level comparison
    const words1 = text1.toLowerCase().split(/\s+/).filter(Boolean);
    const words2 = text2.toLowerCase().split(/\s+/).filter(Boolean);
    const wordSet1 = new Set(words1);
    const wordSet2 = new Set(words2);
    const commonWords = [...wordSet1].filter(w => wordSet2.has(w));
    const wordSimilarity = (wordSet1.size + wordSet2.size) > 0
      ? ((2 * commonWords.length / (wordSet1.size + wordSet2.size)) * 100).toFixed(1)
      : '0.0';

    // Size comparison
    const size1 = file1 && file1.buffer ? file1.buffer.length : 0;
    const size2 = file2 && file2.buffer ? file2.buffer.length : 0;
    const sizeDiff = Math.abs(size1 - size2);
    const sizeMatch = size1 === size2;

    // Build PDF report
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`Compare: ${file1Name} vs ${file2Name}`);
    pdfDoc.setProducer('azPDF Compare Engine v2');
    pdfDoc.setCreator('azPDF');
    pdfDoc.setCreationDate(new Date());

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const PAGE_W = 612, PAGE_H = 792;
    const MARGIN = 45;
    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);

    // Header
    page.drawRectangle({ x: 0, y: PAGE_H - 65, width: PAGE_W, height: 65, color: rgb(0.07, 0.2, 0.55) });
    page.drawText('azPDF Document Comparison Report', {
      x: MARGIN, y: PAGE_H - 30, size: 18, font: fontBold, color: rgb(1, 1, 1)
    });
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: MARGIN, y: PAGE_H - 52, size: 9, font: fontReg, color: rgb(0.7, 0.8, 1)
    });

    // Similarity Score Badge
    const simNum = parseFloat(similarityPct);
    const simColor = simNum >= 80 ? rgb(0.05, 0.6, 0.15) : simNum >= 40 ? rgb(0.8, 0.55, 0.05) : rgb(0.75, 0.1, 0.1);
    page.drawRectangle({ x: PAGE_W - 120, y: PAGE_H - 58, width: 80, height: 46, color: simColor });
    page.drawText(`${similarityPct}%`, {
      x: PAGE_W - 112, y: PAGE_H - 30, size: 20, font: fontBold, color: rgb(1, 1, 1)
    });
    page.drawText('SIMILAR', {
      x: PAGE_W - 108, y: PAGE_H - 50, size: 8, font: fontBold, color: rgb(1, 1, 1)
    });

    // File info boxes
    const drawFileBox = (x, name, pages, words, size, color) => {
      page.drawRectangle({ x, y: PAGE_H - 140, width: 240, height: 65, color, opacity: 0.12, borderColor: color, borderWidth: 1.5 });
      page.drawText(name.length > 32 ? name.substring(0, 29) + '...' : name, {
        x: x + 10, y: PAGE_H - 92, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.2)
      });
      page.drawText(`Pages: ${pages}  |  Words: ${words.toLocaleString()}  |  Size: ${(size / 1024).toFixed(1)} KB`, {
        x: x + 10, y: PAGE_H - 112, size: 8, font: fontReg, color: rgb(0.35, 0.35, 0.45)
      });
    };

    const clean = (s) => String(s || '').replace(/[^\x20-\x7E]/g, ' ');

    drawFileBox(MARGIN, clean(`[A] ${file1Name}`), pages1, words1.length, size1, rgb(0.07, 0.35, 0.75));
    drawFileBox(MARGIN + 260, clean(`[B] ${file2Name}`), pages2, words2.length, size2, rgb(0.07, 0.55, 0.35));

    let curY = PAGE_H - 165;

    // Comparison Stats Table
    const drawRow = (label, value, highlight = false) => {
      if (curY < 60) return;
      if (highlight) {
        page.drawRectangle({ x: MARGIN - 5, y: curY - 4, width: PAGE_W - MARGIN * 2 + 10, height: 18, color: rgb(0.95, 0.97, 1) });
      }
      page.drawText(label, { x: MARGIN, y: curY, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.3) });
      page.drawText(clean(String(value)), { x: MARGIN + 250, y: curY, size: 10, font: fontReg, color: rgb(0.15, 0.15, 0.25) });
      curY -= 20;
    };

    page.drawText('COMPARISON STATISTICS', { x: MARGIN, y: curY + 6, size: 12, font: fontBold, color: rgb(0.07, 0.2, 0.55) });
    page.drawLine({ start: { x: MARGIN, y: curY - 4 }, end: { x: PAGE_W - MARGIN, y: curY - 4 }, thickness: 1, color: rgb(0.07, 0.2, 0.55) });
    curY -= 22;

    drawRow('Line Similarity Score', `${similarityPct}% (${commonLines.length} matching lines)`, true);
    drawRow('Word Similarity Score', `${wordSimilarity}% (${commonWords.length} common words)`);
    drawRow('Lines Unique to File A', `${uniqueToFile1.length} lines`, true);
    drawRow('Lines Unique to File B', `${uniqueToFile2.length} lines`);
    drawRow('File A Size', `${(size1 / 1024).toFixed(2)} KB (${size1} bytes)`, true);
    drawRow('File B Size', `${(size2 / 1024).toFixed(2)} KB (${size2} bytes)`);
    drawRow('Size Difference', sizeMatch ? '0 bytes (identical size)' : `${sizeDiff} bytes (${(sizeDiff / 1024).toFixed(1)} KB)`, true);
    drawRow('Page Count Match', pages1 === pages2 ? `[MATCH] Both have ${pages1} pages` : `[DIFF] File A: ${pages1} pages, File B: ${pages2} pages`);

    curY -= 10;

    // Differences Preview
    if (uniqueToFile1.length > 0 || uniqueToFile2.length > 0) {
      page.drawText('CONTENT DIFFERENCES PREVIEW', { x: MARGIN, y: curY, size: 12, font: fontBold, color: rgb(0.07, 0.2, 0.55) });
      page.drawLine({ start: { x: MARGIN, y: curY - 6 }, end: { x: PAGE_W - MARGIN, y: curY - 6 }, thickness: 1, color: rgb(0.07, 0.2, 0.55) });
      curY -= 24;

      // Show up to 5 lines unique to each file
      if (uniqueToFile1.length > 0) {
        page.drawText('Only in File A:', { x: MARGIN, y: curY, size: 10, font: fontBold, color: rgb(0.75, 0.15, 0.1) });
        curY -= 16;
        uniqueToFile1.slice(0, 4).forEach(line => {
          if (curY < 60) return;
          const display = clean(line.length > 80 ? line.substring(0, 77) + '...' : line);
          page.drawText(`  - ${display}`, { x: MARGIN, y: curY, size: 8, font: fontReg, color: rgb(0.6, 0.1, 0.1) });
          curY -= 14;
        });
        curY -= 6;
      }

      if (uniqueToFile2.length > 0 && curY > 80) {
        page.drawText('Only in File B:', { x: MARGIN, y: curY, size: 10, font: fontBold, color: rgb(0.05, 0.5, 0.15) });
        curY -= 16;
        uniqueToFile2.slice(0, 4).forEach(line => {
          if (curY < 60) return;
          const display = clean(line.length > 80 ? line.substring(0, 77) + '...' : line);
          page.drawText(`  + ${display}`, { x: MARGIN, y: curY, size: 8, font: fontReg, color: rgb(0.05, 0.45, 0.1) });
          curY -= 14;
        });
      }
    } else if (text1.length > 0 && text2.length > 0) {
      page.drawText('[OK] No line-level differences detected. Documents appear identical in content.', {
        x: MARGIN, y: curY, size: 11, font: fontBold, color: rgb(0.05, 0.55, 0.15)
      });
    }

    // Footer
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 28, color: rgb(0.95, 0.95, 0.97) });
    page.drawText(`azPDF Compare Engine v2  |  Document Comparison Report  |  ${new Date().toLocaleDateString()}`, {
      x: MARGIN, y: 10, size: 8, font: fontReg, color: rgb(0.5, 0.5, 0.55)
    });

    console.log(
      `[PDFCompareService] A="${file1Name}" B="${file2Name}" | Similarity=${similarityPct}% | CommonLines=${commonLines.length} | UniqueA=${uniqueToFile1.length} UniqueB=${uniqueToFile2.length}`
    );

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFCompareService();
