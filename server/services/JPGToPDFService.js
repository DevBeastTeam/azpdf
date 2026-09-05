const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * JPGToPDFService
 * Converts image files (JPG/PNG) to PDF.
 * Auto-detects orientation (portrait/landscape) based on image dimensions.
 * Scales images to fit page with proper margins.
 */
class JPGToPDFService {
  async process(files) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle('Image to PDF Conversion');
    pdfDoc.setProducer('azPDF Image→PDF Engine v2');
    pdfDoc.setCreator('azPDF');
    pdfDoc.setCreationDate(new Date());

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    if (!files || files.length === 0) {
      const page = pdfDoc.addPage([612, 792]);
      page.drawRectangle({ x: 0, y: 742, width: 612, height: 50, color: rgb(0.89, 0.14, 0.14) });
      page.drawText('azPDF — Image to PDF', { x: 40, y: 760, size: 16, font, color: rgb(1, 1, 1) });
      page.drawText('No image files were provided.', { x: 40, y: 700, size: 14, font: fontReg, color: rgb(0.4, 0.4, 0.4) });
    } else {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const isPng = (file.mimetype && file.mimetype.includes('png')) ||
                        file.originalname.toLowerCase().endsWith('.png');
          const isWebp = file.originalname.toLowerCase().endsWith('.webp');

          let image;
          if (isPng) {
            image = await pdfDoc.embedPng(file.buffer);
          } else if (!isWebp) {
            image = await pdfDoc.embedJpg(file.buffer);
          } else {
            throw new Error('WebP not directly supported — use JPG or PNG');
          }

          const imgW = image.width;
          const imgH = image.height;
          const isLandscape = imgW > imgH;

          // Page dimensions with 20px margin
          const MARGIN = 20;
          const maxPageW = isLandscape ? 841 : 612;  // A4 landscape or portrait
          const maxPageH = isLandscape ? 595 : 792;
          const availW = maxPageW - MARGIN * 2;
          const availH = maxPageH - MARGIN * 2;

          // Scale image to fit within available area (maintain aspect ratio)
          const scaleX = availW / imgW;
          const scaleY = availH / imgH;
          const scale = Math.min(scaleX, scaleY, 1); // Never upscale
          const drawW = imgW * scale;
          const drawH = imgH * scale;

          // Center on page
          const drawX = MARGIN + (availW - drawW) / 2;
          const drawY = MARGIN + (availH - drawH) / 2;

          const page = pdfDoc.addPage([maxPageW, maxPageH]);

          // White background
          page.drawRectangle({ x: 0, y: 0, width: maxPageW, height: maxPageH, color: rgb(1, 1, 1) });

          // Draw image
          page.drawImage(image, { x: drawX, y: drawY, width: drawW, height: drawH });

          // Footer strip
          page.drawRectangle({ x: 0, y: 0, width: maxPageW, height: 18, color: rgb(0.95, 0.95, 0.97) });
          page.drawText(
            `${file.originalname}  |  ${imgW}×${imgH}px  |  Page ${i + 1} of ${files.length}  |  azPDF`,
            { x: 10, y: 5, size: 7, font: fontReg, color: rgb(0.5, 0.5, 0.55) }
          );

        } catch (imgErr) {
          console.warn(`[JPGToPDFService] Error embedding ${file.originalname}:`, imgErr.message);
          const page = pdfDoc.addPage([612, 792]);
          page.drawRectangle({ x: 0, y: 742, width: 612, height: 50, color: rgb(0.95, 0.6, 0.1) });
          page.drawText(`Image Error: ${file.originalname}`, {
            x: 40, y: 758, size: 13, font, color: rgb(1, 1, 1)
          });
          page.drawText(`Could not embed image: ${imgErr.message.substring(0, 80)}`, {
            x: 40, y: 700, size: 11, font: fontReg, color: rgb(0.4, 0.2, 0)
          });
          page.drawText(`Page ${i + 1} of ${files.length}`, {
            x: 40, y: 670, size: 10, font: fontReg, color: rgb(0.5, 0.5, 0.5)
          });
        }
      }
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new JPGToPDFService();
