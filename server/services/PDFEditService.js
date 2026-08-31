const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PDFEditService {
  async process(file, annotationText = 'Approved & Reviewed Document') {
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
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    if (firstPage) {
      firstPage.drawRectangle({
        x: 30, y: 30, width: 380, height: 40,
        color: rgb(0.96, 0.96, 0.15),
        borderColor: rgb(0.8, 0.8, 0), borderWidth: 1
      });

      firstPage.drawText(`ANNOTATION: ${annotationText}`, {
        x: 40, y: 46, size: 10, font, color: rgb(0, 0, 0)
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFEditService();
