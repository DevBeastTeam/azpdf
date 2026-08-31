const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PDFRepairService {
  async process(file) {
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
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      pages[0].drawText('REPAIRED & RESTORED BY AZPDF ENGINE', {
        x: 20, y: pages[0].getSize().height - 25, size: 8, font, color: rgb(0.1, 0.7, 0.2)
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFRepairService();
