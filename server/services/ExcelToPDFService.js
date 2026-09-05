const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * ExcelToPDFService
 * Converts Excel spreadsheets to PDF with real data rendering.
 * Uses xlsx library for actual data extraction, renders a proper table grid.
 */
class ExcelToPDFService {
  async process(file) {
    const originalName = file ? file.originalname : 'spreadsheet.xlsx';
    let sheets = [];
    let extractionMethod = 'none';

    // Attempt real xlsx extraction
    if (file && file.buffer) {
      try {
        const XLSX = require('xlsx');
        const workbook = XLSX.read(file.buffer, { type: 'buffer', cellText: true, cellDates: true });
        sheets = workbook.SheetNames.map(name => ({
          name,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' })
        }));
        extractionMethod = 'xlsx';
      } catch (err) {
        console.warn('[ExcelToPDFService] xlsx error:', err.message);
        extractionMethod = 'fallback';
      }
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(originalName.replace(/\.xlsx?$/i, ''));
    pdfDoc.setProducer('azPDF Excel→PDF Engine v2');
    pdfDoc.setCreator('azPDF');
    pdfDoc.setCreationDate(new Date());

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const PAGE_W = 792, PAGE_H = 612; // Landscape for tables
    const MARGIN = 40;

    if (sheets.length > 0) {
      for (const sheet of sheets) {
        const { name: sheetName, data: rows } = sheet;
        if (!rows || rows.length === 0) continue;

        let page = pdfDoc.addPage([PAGE_W, PAGE_H]);

        // Header bar
        page.drawRectangle({ x: 0, y: PAGE_H - 50, width: PAGE_W, height: 50, color: rgb(0.89, 0.14, 0.14) });
        page.drawText('azPDF — Excel to PDF Conversion', {
          x: MARGIN, y: PAGE_H - 20, size: 14, font: fontBold, color: rgb(1, 1, 1)
        });
        page.drawText(`File: ${originalName}  |  Sheet: "${sheetName}"  |  Rows: ${rows.length}  |  ${new Date().toLocaleDateString()}`, {
          x: MARGIN, y: PAGE_H - 38, size: 9, font: fontReg, color: rgb(1, 1, 0.8)
        });

        // Calculate column widths
        const maxCols = Math.max(...rows.map(r => r.length), 1);
        const availWidth = PAGE_W - MARGIN * 2;
        const colW = Math.min(Math.floor(availWidth / Math.min(maxCols, 10)), 120);
        const ROW_H = 20;
        const FONT_SIZE = 8;
        const visibleCols = Math.min(maxCols, Math.floor(availWidth / colW));

        let curY = PAGE_H - 65;

        rows.forEach((row, rowIdx) => {
          if (curY < MARGIN + ROW_H) {
            // New page for overflow
            page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            page.drawRectangle({
              x: 0, y: PAGE_H - 28, width: PAGE_W, height: 28, color: rgb(0.95, 0.95, 0.95)
            });
            page.drawText(`${originalName} — Sheet: "${sheetName}" (continued)`, {
              x: MARGIN, y: PAGE_H - 18, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.4)
            });
            curY = PAGE_H - 40;
          }

          const isHeader = rowIdx === 0;
          const bgColor = isHeader ? rgb(0.2, 0.2, 0.35) : (rowIdx % 2 === 0 ? rgb(0.97, 0.97, 1.0) : rgb(1, 1, 1));
          const textColor = isHeader ? rgb(1, 1, 1) : rgb(0.1, 0.1, 0.1);
          const font = isHeader ? fontBold : fontReg;

          // Row background
          page.drawRectangle({
            x: MARGIN, y: curY - ROW_H + 4,
            width: visibleCols * colW, height: ROW_H,
            color: bgColor,
            borderColor: rgb(0.75, 0.75, 0.85), borderWidth: 0.5
          });

          // Cell content
          for (let colIdx = 0; colIdx < visibleCols; colIdx++) {
            const cellVal = row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]) : '';
            const truncated = cellVal.length > 18 ? cellVal.substring(0, 15) + '...' : cellVal;
            const cellX = MARGIN + colIdx * colW + 4;

            if (truncated) {
              try {
                page.drawText(truncated, {
                  x: cellX, y: curY - ROW_H + 8, size: FONT_SIZE, font, color: textColor,
                  maxWidth: colW - 8
                });
              } catch (_) {}
            }
          }

          curY -= ROW_H;
        });
      }
    } else {
      // Fallback page
      const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      page.drawRectangle({ x: 0, y: PAGE_H - 50, width: PAGE_W, height: 50, color: rgb(0.89, 0.14, 0.14) });
      page.drawText('azPDF — Excel to PDF Conversion', {
        x: MARGIN, y: PAGE_H - 20, size: 14, font: fontBold, color: rgb(1, 1, 1)
      });
      page.drawText(originalName, { x: MARGIN, y: PAGE_H - 120, size: 18, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
      page.drawText('Format: Excel Spreadsheet (.xlsx) → PDF Table', {
        x: MARGIN, y: PAGE_H - 150, size: 11, font: fontReg, color: rgb(0.4, 0.4, 0.4)
      });
      page.drawText('Note: Could not extract data from this file. It may be password-protected or unsupported.', {
        x: MARGIN, y: PAGE_H - 200, size: 10, font: fontReg, color: rgb(0.6, 0.3, 0)
      });
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new ExcelToPDFService();
