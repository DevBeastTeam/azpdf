const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');

class PDFWatermarkService {
  async process(file, watermarkText = 'CONFIDENTIAL') {
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

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      const fontSize = 42;
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      page.drawText(watermarkText, {
        x: Math.max(20, (width - textWidth) / 2),
        y: Math.max(20, (height - textHeight) / 2),
        size: fontSize,
        font,
        color: rgb(0.85, 0.15, 0.15),
        opacity: 0.35,
        rotate: degrees(45)
      });
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFWatermarkService();
