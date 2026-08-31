const { PDFDocument, degrees, rgb, StandardFonts } = require('pdf-lib');

class PDFRotateService {
  async process(file, angleParam = 90) {
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

    const angle = isNaN(parseInt(angleParam, 10)) ? 90 : parseInt(angleParam, 10);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angle) % 360));
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFRotateService();
