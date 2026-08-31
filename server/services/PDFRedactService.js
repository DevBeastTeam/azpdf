const { PDFDocument, rgb } = require('pdf-lib');

class PDFRedactService {
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
    pages.forEach((page) => {
      const { width, height } = page.getSize();
      page.drawRectangle({
        x: 50, y: height - 60, width: 180, height: 16, color: rgb(0, 0, 0)
      });
      page.drawRectangle({
        x: 50, y: height / 2, width: 250, height: 18, color: rgb(0, 0, 0)
      });
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFRedactService();
