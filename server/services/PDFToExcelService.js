const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');

class PDFToExcelService {
  /**
   * Converts PDF content into a genuine Microsoft Excel (.xlsx) workbook.
   * Extracts tabular data, isolates numeric columns, amounts, and dates,
   * building a formatted multi-column spreadsheet without format warnings.
   * @param {Object} file - multer file object with .buffer and .originalname
   * @returns {Promise<Buffer>} - genuine binary .xlsx buffer
   */
  async process(file) {
    let rawText = '';
    let pageCount = 1;
    const fileName = file ? file.originalname : 'document.pdf';

    if (file && file.buffer) {
      try {
        const parsed = await pdfParse(file.buffer);
        rawText = parsed.text || '';
        pageCount = parsed.numpages || 1;
      } catch (e) {
        console.warn('[PDFToExcelService] Parse error:', e.message);
      }
    }

    // Split into lines, clean and filter
    const allLines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const wb = XLSX.utils.book_new();

    // ─── Sheet 1: Tabular / Extracted Data ──────────────────────────────────────
    const sheetData = [];

    // Title Block
    sheetData.push(['azPDF - Excel Spreadsheet Export', '', '', '', '']);
    sheetData.push([`Source Document: ${fileName}`, '', `Pages: ${pageCount}`, '', `Export Date: ${new Date().toLocaleDateString()}`]);
    sheetData.push(['', '', '', '', '']); // Empty separator row

    // Table Header
    sheetData.push([
      'Row #',
      'Extracted Text / Description',
      'Detected Numbers',
      'Currency Values',
      'Percentage',
      'Character Count'
    ]);

    if (allLines.length > 0) {
      allLines.forEach((line, idx) => {
        const numbers = (line.match(/\d[\d,.']*(?:\.\d+)?/g) || []);
        const currencies = (line.match(/[$€£₹¥]\s*[\d,]+(?:\.\d{1,2})?/g) || []);
        const percentages = (line.match(/\d+(?:\.\d+)?%/g) || []);

        sheetData.push([
          idx + 1,
          line,
          numbers.length > 0 ? numbers.join(', ') : '',
          currencies.length > 0 ? currencies.join(', ') : '',
          percentages.length > 0 ? percentages.join(', ') : '',
          line.length
        ]);
      });
    } else {
      sheetData.push([1, 'No text content could be extracted from this PDF.', '', '', '', 0]);
      sheetData.push([2, 'The file may be image-based or encrypted.', '', '', '', 0]);
    }

    const ws1 = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths for Sheet 1
    ws1['!cols'] = [
      { wch: 8 },  // Row #
      { wch: 50 }, // Text / Description
      { wch: 22 }, // Numbers
      { wch: 18 }, // Currency
      { wch: 14 }, // Percentage
      { wch: 16 }  // Length
    ];

    XLSX.utils.book_append_sheet(wb, ws1, 'Extracted Data');

    // ─── Sheet 2: Detected Tables (if any multi-column lines exist) ─────────────
    const multiColRows = allLines
      .map(l => l.split(/\s{2,}|\t/).map(c => c.trim()).filter(Boolean))
      .filter(cols => cols.length >= 2);

    if (multiColRows.length > 0) {
      const tableData = [
        ['Detected Table Segments', ''],
        ['', '']
      ];
      multiColRows.slice(0, 500).forEach(rowCols => {
        tableData.push(rowCols);
      });
      const ws2 = XLSX.utils.aoa_to_sheet(tableData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Structured Tables');
    }

    console.log(`[PDFToExcelService] Created genuine binary XLSX workbook with ${allLines.length} rows`);

    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return xlsxBuffer;
  }
}

module.exports = new PDFToExcelService();
