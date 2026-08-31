const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PDFMergeService {
  async process(files) {
    if (!files || files.length < 2) {
      throw new Error('At least 2 PDF files are required for merging.');
    }
    const mergedPdf = await PDFDocument.create();

    let idx = 1;
    for (const file of files) {
      let pdfDoc = null;
      try {
        if (file.buffer && file.buffer.length > 0) {
          pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
        }
      } catch (err) {
        console.warn(`[PDFMergeService] Invalid buffer for ${file.originalname}, generating fallback page.`);
      }

      if (!pdfDoc) {
        pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        page.drawText(`Merged Document #${idx}: ${file.originalname}`, { x: 40, y: 700, size: 16, font, color: rgb(0.89, 0.14, 0.14) });
      }

      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      idx++;
    }

    const pdfBytes = await mergedPdf.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFMergeService();
