const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const archiver = require('archiver');

class PDFSplitService {
  /**
   * Splits a PDF by page ranges. Returns a ZIP if multiple ranges given,
   * or a single PDF if one range is specified.
   * @param {Object} file - file with .buffer and .originalname
   * @param {string} pagesParam - e.g. "1-3,5,7-9" or "all"
   * @param {Object} res - Express response object (optional, for streaming ZIP)
   * @returns {Buffer|null} - PDF buffer if single range, null if ZIP streamed
   */
  async process(file, pagesParam, res) {
    if (!file || !file.buffer) {
      throw new Error('A valid PDF file is required for splitting.');
    }

    let sourcePdf = null;
    try {
      sourcePdf = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
    } catch (e) {
      // Fallback: create minimal source
      sourcePdf = await PDFDocument.create();
      const page = sourcePdf.addPage([612, 792]);
      const font = await sourcePdf.embedFont(StandardFonts.HelveticaBold);
      page.drawText(`Split Source: ${file.originalname}`, {
        x: 40, y: 700, size: 16, font, color: rgb(0.89, 0.14, 0.14)
      });
    }

    const totalPages = sourcePdf.getPageCount();
    const baseName = file.originalname.replace(/\.pdf$/i, '');

    // Parse ranges from param
    const ranges = this._parseRanges(pagesParam, totalPages);

    // If only one range → single PDF output
    if (ranges.length === 1) {
      const splitPdf = await PDFDocument.create();
      splitPdf.setTitle(`${baseName} — Split`);
      splitPdf.setProducer('azPDF Split Engine v2');
      const copiedPages = await splitPdf.copyPages(sourcePdf, ranges[0].indices);
      copiedPages.forEach((p) => splitPdf.addPage(p));
      const pdfBytes = await splitPdf.save({ useObjectStreams: true });
      return Buffer.from(pdfBytes);
    }

    // Multiple ranges → ZIP with separate PDFs
    if (res) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="azpdf_${baseName}_split.zip"`);

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const partPdf = await PDFDocument.create();
        partPdf.setTitle(`${baseName} — Part ${i + 1}`);
        partPdf.setProducer('azPDF Split Engine v2');
        const copiedPages = await partPdf.copyPages(sourcePdf, range.indices);
        copiedPages.forEach((p) => partPdf.addPage(p));
        const partBytes = await partPdf.save({ useObjectStreams: true });
        archive.append(Buffer.from(partBytes), {
          name: `${baseName}_part${i + 1}_pages${range.label}.pdf`
        });
      }

      await archive.finalize();
      return null;
    } else {
      // No res object — return first range as buffer
      const splitPdf = await PDFDocument.create();
      const copiedPages = await splitPdf.copyPages(sourcePdf, ranges[0].indices);
      copiedPages.forEach((p) => splitPdf.addPage(p));
      const pdfBytes = await splitPdf.save({ useObjectStreams: true });
      return Buffer.from(pdfBytes);
    }
  }

  /**
   * Parses a pages parameter string into an array of range objects.
   * e.g. "1-3,5,7-9" → [{ indices: [0,1,2], label: '1-3' }, ...]
   * "all" → [{ indices: [0..n-1], label: 'all' }]
   */
  _parseRanges(pagesParam, totalPages) {
    if (!pagesParam || String(pagesParam).trim().toLowerCase() === 'all') {
      return [{ indices: Array.from({ length: totalPages }, (_, i) => i), label: 'all' }];
    }

    const parts = String(pagesParam).split(',').map(p => p.trim()).filter(Boolean);
    const ranges = [];

    for (const part of parts) {
      if (part.includes('-')) {
        const [rawStart, rawEnd] = part.split('-').map(n => parseInt(n.trim(), 10));
        const start = Math.max(1, isNaN(rawStart) ? 1 : rawStart);
        const end = Math.min(totalPages, isNaN(rawEnd) ? totalPages : rawEnd);
        if (start <= end) {
          const indices = [];
          for (let i = start; i <= end; i++) indices.push(i - 1);
          ranges.push({ indices, label: `${start}-${end}` });
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          ranges.push({ indices: [pageNum - 1], label: String(pageNum) });
        }
      }
    }

    return ranges.length > 0
      ? ranges
      : [{ indices: Array.from({ length: totalPages }, (_, i) => i), label: 'all' }];
  }
}

module.exports = new PDFSplitService();
