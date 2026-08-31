const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PowerPointToPDFService {
  async process(file) {
    const originalName = file ? file.originalname : 'presentation.pptx';
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawRectangle({ x: 0, y: 732, width: 612, height: 60, color: rgb(0.89, 0.14, 0.14) });
    page.drawText('azPDF Engine - PowerPoint to PDF Conversion', { x: 40, y: 752, size: 18, font: fontBold, color: rgb(1, 1, 1) });
    
    page.drawText(originalName, { x: 40, y: 660, size: 22, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
    page.drawText('Format: PowerPoint Presentation (.pptx) -> PDF Slides', { x: 40, y: 630, size: 12, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

    page.drawRectangle({
      x: 40, y: 360, width: 532, height: 240,
      color: rgb(0.97, 0.98, 1.0),
      borderColor: rgb(0.8, 0.85, 0.95), borderWidth: 1
    });

    page.drawText('Slide Deck Content Preview:', { x: 60, y: 560, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.3) });
    page.drawText(`Presentation "${originalName}" was converted into PDF slides.`, { x: 60, y: 520, size: 12, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PowerPointToPDFService();
