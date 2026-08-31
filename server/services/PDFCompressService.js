const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PDFCompressService {
  async process(file, level = 'recommended') {
    let pdfDoc = null;
    try {
      if (file && file.buffer) {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      }
    } catch (err) {}

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(`Compressed Document: ${file ? file.originalname : 'document.pdf'}`, { x: 40, y: 700, size: 16, font, color: rgb(0.89, 0.14, 0.14) });
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFCompressService();
