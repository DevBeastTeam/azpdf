const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PDFPageNumberService {
  async process(file, position = 'bottom-center') {
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
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = pages.length;

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const pageText = `Page ${index + 1} of ${totalPages}`;
      const textWidth = font.widthOfTextAtSize(pageText, 10);
      let posX = (width - textWidth) / 2;
      let posY = 25;

      if (position === 'bottom-right') posX = width - textWidth - 30;
      if (position === 'top-right') {
        posX = width - textWidth - 30;
        posY = height - 30;
      }

      page.drawText(pageText, {
        x: posX, y: posY, size: 10, font, color: rgb(0.3, 0.3, 0.3)
      });
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFPageNumberService();
