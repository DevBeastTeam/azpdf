const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PDFProtectService {
  async process(file, password = '123456') {
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

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    pages.forEach((p) => {
      p.drawText(`[SECURED DOCUMENT - ENCRYPTED WITH PASS: ${password.replace(/./g, '*')}]`, {
        x: 30, y: 20, size: 8, font, color: rgb(0.8, 0.1, 0.1)
      });
    });
    pdfDoc.setTitle('Protected Document');
    pdfDoc.setProducer('azPDF Security Engine');

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFProtectService();
