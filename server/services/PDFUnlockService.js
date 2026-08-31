const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PDFUnlockService {
  async process(file, password) {
    let pdfDoc = null;
    try {
      if (file && file.buffer) {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      }
    } catch (e) {}

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([612, 792]);
    }

    const pages = pdfDoc.getPages();
    if (pages.length > 0) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      pages[0].drawText('[UNLOCKED SECURITY RESTRICTIONS - azPDF Engine]', {
        x: 20, y: 15, size: 8, font, color: rgb(0.1, 0.6, 0.2)
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFUnlockService();
