const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const archiver = require('archiver');

class PDFSplitService {
  async process(file, pagesParam) {
    if (!file || !file.buffer) {
      throw new Error('A valid PDF file is required for splitting.');
    }

    let sourcePdf = null;
    try {
      sourcePdf = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
    } catch (e) {
      sourcePdf = await PDFDocument.create();
      const page = sourcePdf.addPage([612, 792]);
      const font = await sourcePdf.embedFont(StandardFonts.HelveticaBold);
      page.drawText(`Split Source Document: ${file.originalname}`, { x: 40, y: 700, size: 16, font, color: rgb(0.89, 0.14, 0.14) });
    }

    const totalPages = sourcePdf.getPageCount();
    let pageIndices = [0];

    if (pagesParam) {
      const parts = String(pagesParam).split(',');
      const parsedIndices = [];
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= totalPages) parsedIndices.push(i - 1);
            }
          }
        } else {
          const pageNum = parseInt(part.trim(), 10);
          if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            parsedIndices.push(pageNum - 1);
          }
        }
      }
      if (parsedIndices.length > 0) pageIndices = parsedIndices;
    }

    const splitPdf = await PDFDocument.create();
    const copiedPages = await splitPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach((p) => splitPdf.addPage(p));

    const pdfBytes = await splitPdf.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFSplitService();
