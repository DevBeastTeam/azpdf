const pdfParse = require('pdf-parse');

class PDFToExcelService {
  /**
   * Converts PDF content to a structured CSV (Excel-compatible).
   * Detects tabular data, isolates numeric columns, and properly
   * escapes all fields.
   * @param {Object} file - file with .buffer and .originalname
   * @returns {Buffer} - UTF-8 CSV buffer with BOM for Excel compatibility
   */
  async process(file) {
    let rawText = '';
    let pageCount = 1;

    if (file && file.buffer) {
      try {
        const parsed = await pdfParse(file.buffer);
        rawText = parsed.text || '';
        pageCount = parsed.numpages || 1;
      } catch (e) {
        console.warn('[PDFToExcelService] Parse error:', e.message);
      }
    }

    const fileName = file ? file.originalname : 'document.pdf';

    // Split into lines, clean and filter
    const allLines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Build CSV rows
    const rows = [];

    // Header row
    rows.push([
      'Row #',
      'Text Content',
      'Numbers Found',
      'Has Currency',
      'Has Percentage',
      'Character Count'
    ]);

    if (allLines.length > 0) {
      allLines.forEach((line, idx) => {
        const numbers = (line.match(/\d[\d,.']*(?:\.\d+)?/g) || []);
        const currencies = (line.match(/[$€£₹¥]\s*[\d,]+(?:\.\d{1,2})?/g) || []);
        const percentages = (line.match(/\d+(?:\.\d+)?%/g) || []);

        rows.push([
          String(idx + 1),
          line,
          numbers.join('; '),
          currencies.length > 0 ? currencies.join('; ') : '',
          percentages.length > 0 ? percentages.join('; ') : '',
          String(line.length)
        ]);
      });
    } else {
      // No content — add placeholder
      rows.push(['1', 'No text content could be extracted from this PDF.', '', '', '', '0']);
      rows.push(['2', 'The file may be image-based or encrypted.', '', '', '', '0']);
    }

    // Detect and highlight potential table rows (multiple tab/space-delimited columns)
    const tableRows = allLines.filter(l => {
      const cols = l.split(/\s{2,}|\t/);
      return cols.length >= 3;
    });

    // Serialize to CSV
    let csvContent = '';

    // Metadata sheet header
    csvContent += `"azPDF Excel Export","","","","",""\n`;
    csvContent += `"Source File:","${this._escCsv(fileName)}","","","",""\n`;
    csvContent += `"Total Pages:","${pageCount}","","","",""\n`;
    csvContent += `"Total Lines:","${allLines.length}","","","",""\n`;
    csvContent += `"Potential Table Rows:","${tableRows.length}","","","",""\n`;
    csvContent += `"Exported On:","${new Date().toLocaleString()}","","","",""\n`;
    csvContent += `"","","","","",""\n`;

    // Data rows
    rows.forEach(row => {
      csvContent += row.map(cell => `"${this._escCsv(String(cell))}"`).join(',') + '\n';
    });

    // Potential table section (if any detected)
    if (tableRows.length > 0) {
      csvContent += `\n"","","","","",""\n`;
      csvContent += `"=== DETECTED TABULAR SECTIONS ===","","","","",""\n`;
      tableRows.slice(0, 50).forEach((row, idx) => {
        const cols = row.split(/\s{2,}|\t/);
        const paddedCols = [...cols, '', '', '', '', ''].slice(0, 6);
        csvContent += paddedCols.map(c => `"${this._escCsv(c.trim())}"`).join(',') + '\n';
      });
    }

    // Return with UTF-8 BOM for Excel compatibility
    const bom = Buffer.from('\xEF\xBB\xBF', 'latin1');
    return Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]);
  }

  /** Escape CSV field (double-quote any double quotes) */
  _escCsv(str) {
    return String(str).replace(/"/g, '""');
  }
}

module.exports = new PDFToExcelService();
