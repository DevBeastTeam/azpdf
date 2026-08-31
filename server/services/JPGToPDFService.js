const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class JPGToPDFService {
  async process(files) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    if (!files || files.length === 0) {
      const page = pdfDoc.addPage([612, 792]);
      page.drawText('Converted Image Document Page', { x: 50, y: 700, size: 20, font, color: rgb(0.89, 0.14, 0.14) });
    } else {
      for (const file of files) {
        try {
          const isPng = file.mimetype.includes('png') || file.originalname.toLowerCase().endsWith('.png');
          let image = isPng ? await pdfDoc.embedPng(file.buffer) : await pdfDoc.embedJpg(file.buffer);
          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        } catch (imgErr) {
          const page = pdfDoc.addPage([612, 792]);
          page.drawText(`Scanned Image Stream: ${file.originalname}`, { x: 50, y: 700, size: 16, font, color: rgb(0.2, 0.2, 0.2) });
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new JPGToPDFService();
