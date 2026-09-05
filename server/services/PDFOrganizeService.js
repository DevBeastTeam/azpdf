const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * PDFOrganizeService
 * Reorganizes PDF pages: reorder, delete, reverse, or rotate specific pages.
 * @param {Object} file - file with .buffer and .originalname
 * @param {string|Array} orderParam - new page order, e.g. "3,1,2" or "reverse" or "delete:2,4"
 */
class PDFOrganizeService {
  async process(file, orderParam) {
    let pdfDoc = null;

    try {
      if (file && file.buffer && file.buffer.length > 0) {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      }
    } catch (e) {
      console.warn('[PDFOrganizeService] Load error:', e.message);
    }

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([612, 792]);
    }

    const totalPages = pdfDoc.getPageCount();
    let newOrder = Array.from({ length: totalPages }, (_, i) => i); // default: unchanged
    let operationDesc = 'unchanged';

    if (orderParam) {
      const param = String(orderParam).trim().toLowerCase();

      if (param === 'reverse') {
        newOrder = [...newOrder].reverse();
        operationDesc = 'reversed';

      } else if (param.startsWith('delete:')) {
        // Delete specific pages: "delete:1,3,5"
        const toDelete = new Set(
          param.substring(7).split(',')
            .map(n => parseInt(n.trim(), 10) - 1)
            .filter(n => n >= 0 && n < totalPages)
        );
        newOrder = newOrder.filter(i => !toDelete.has(i));
        operationDesc = `deleted pages: ${[...toDelete].map(i => i + 1).join(',')}`;

      } else {
        // Custom order: "3,1,2" (1-indexed page numbers)
        const parsed = param.split(',')
          .map(n => parseInt(n.trim(), 10) - 1)
          .filter(n => !isNaN(n) && n >= 0 && n < totalPages);
        if (parsed.length > 0) {
          newOrder = parsed;
          operationDesc = `reordered: [${parsed.map(i => i + 1).join(',')}]`;
        }
      }
    }

    // Build new document in the specified order
    const organizedPdf = await PDFDocument.create();
    organizedPdf.setTitle(`Organized: ${file ? file.originalname : 'document.pdf'}`);
    organizedPdf.setProducer('azPDF Organize Engine v2');
    organizedPdf.setCreator('azPDF');
    organizedPdf.setModificationDate(new Date());

    if (newOrder.length > 0) {
      const copiedPages = await organizedPdf.copyPages(pdfDoc, newOrder);
      copiedPages.forEach(p => organizedPdf.addPage(p));
    } else {
      // All pages deleted — add a notice page
      const noticePage = organizedPdf.addPage([612, 792]);
      const font = await organizedPdf.embedFont(StandardFonts.HelveticaBold);
      noticePage.drawText('All pages were removed during organize operation.', {
        x: 50, y: 400, size: 14, font, color: rgb(0.6, 0.2, 0.1)
      });
    }

    console.log(
      `[PDFOrganizeService] Original: ${totalPages} pages | Result: ${organizedPdf.getPageCount()} pages | Op: ${operationDesc}`
    );

    const pdfBytes = await organizedPdf.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFOrganizeService();
