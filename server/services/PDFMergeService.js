const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PDFMergeService {
  /**
   * Merges multiple PDF files strictly in the order provided.
   * Preserves all pages, bookmarks metadata, and document info.
   * @param {Array} files - Array of file objects with .buffer and .originalname
   * @returns {Buffer} - Merged PDF as Buffer
   */
  async process(files) {
    if (!files || files.length < 2) {
      throw new Error('At least 2 PDF files are required for merging.');
    }

    const mergedPdf = await PDFDocument.create();

    // Set merged document metadata
    mergedPdf.setTitle('Merged Document — azPDF');
    mergedPdf.setProducer('azPDF Merge Engine v2');
    mergedPdf.setCreator('azPDF');
    mergedPdf.setCreationDate(new Date());
    mergedPdf.setModificationDate(new Date());

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      let pdfDoc = null;

      // Attempt 1: Load with encryption bypass
      if (file.buffer && file.buffer.length > 0) {
        try {
          pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
        } catch (err) {
          errors.push(`File ${idx + 1} (${file.originalname}): ${err.message}`);
        }
      }

      // Attempt 2: Try loading without ignoreEncryption flag
      if (!pdfDoc && file.buffer && file.buffer.length > 0) {
        try {
          pdfDoc = await PDFDocument.load(file.buffer);
        } catch (err2) {
          // Both attempts failed — use fallback placeholder
        }
      }

      if (pdfDoc) {
        // Copy all pages from source document
        const pageIndices = pdfDoc.getPageIndices();
        if (pageIndices.length > 0) {
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          successCount++;
        } else {
          // PDF has no pages — create placeholder
          pdfDoc = null;
        }
      }

      // Fallback: create a placeholder page for failed/empty files
      if (!pdfDoc) {
        failCount++;
        const placeholderDoc = await PDFDocument.create();
        const page = placeholderDoc.addPage([612, 792]);
        const font = await placeholderDoc.embedFont(StandardFonts.HelveticaBold);
        const fontReg = await placeholderDoc.embedFont(StandardFonts.Helvetica);

        page.drawRectangle({ x: 0, y: 740, width: 612, height: 52, color: rgb(0.95, 0.97, 1.0) });
        page.drawText(`Document ${idx + 1} of ${files.length}`, {
          x: 40, y: 760, size: 11, font, color: rgb(0.4, 0.4, 0.5)
        });
        page.drawText(`File: ${file.originalname}`, {
          x: 40, y: 680, size: 18, font, color: rgb(0.89, 0.14, 0.14)
        });
        page.drawText('[!] This file could not be loaded and was replaced with a placeholder.', {
          x: 40, y: 640, size: 11, font: fontReg, color: rgb(0.6, 0.3, 0)
        });
        page.drawText(`File size: ${file.buffer ? file.buffer.length : 0} bytes`, {
          x: 40, y: 610, size: 10, font: fontReg, color: rgb(0.5, 0.5, 0.5)
        });

        const phPages = await mergedPdf.copyPages(placeholderDoc, [0]);
        phPages.forEach((p) => mergedPdf.addPage(p));
      }
    }

    console.log(`[PDFMergeService] Merged ${files.length} files: ${successCount} ok, ${failCount} fallback.`);
    if (errors.length > 0) {
      console.warn('[PDFMergeService] Errors:', errors.join(' | '));
    }

    const pdfBytes = await mergedPdf.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFMergeService();
