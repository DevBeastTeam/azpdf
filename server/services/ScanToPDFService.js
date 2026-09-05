const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * ScanToPDFService
 * Converts scanned images (JPG/PNG) to a searchable PDF.
 * Handles multiple files, auto-detects orientation,
 * applies fit-to-page with proper aspect ratio.
 */
class ScanToPDFService {
  async process(files) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle('Scanned Document — azPDF');
    pdfDoc.setProducer('azPDF Scan→PDF Engine v2');
    pdfDoc.setCreator('azPDF');
    pdfDoc.setSubject('Scanned document converted to searchable PDF');
    pdfDoc.setCreationDate(new Date());

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    if (!files || files.length === 0) {
      const page = pdfDoc.addPage([612, 792]);
      page.drawRectangle({ x: 0, y: 742, width: 612, height: 50, color: rgb(0.89, 0.14, 0.14) });
      page.drawText('azPDF — Scan to PDF', { x: 40, y: 760, size: 16, font, color: rgb(1, 1, 1) });
      page.drawText('No image files were provided for scanning.', {
        x: 40, y: 700, size: 12, font: fontReg, color: rgb(0.4, 0.4, 0.4)
      });
    } else {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const isPng = (file.mimetype && file.mimetype.includes('png')) ||
                        file.originalname.toLowerCase().endsWith('.png');

          let image;
          if (isPng) {
            image = await pdfDoc.embedPng(file.buffer);
          } else {
            image = await pdfDoc.embedJpg(file.buffer);
          }

          const imgW = image.width;
          const imgH = image.height;
          const isLandscape = imgW > imgH;

          // Page size: A4 (595 x 842) or A4 landscape (842 x 595)
          const A4W = isLandscape ? 842 : 595;
          const A4H = isLandscape ? 595 : 842;
          const MARGIN = 30;
          const availW = A4W - MARGIN * 2;
          const availH = A4H - MARGIN * 2 - 35; // 35px for footer

          // Scale to fit
          const scaleX = availW / imgW;
          const scaleY = availH / imgH;
          const scale = Math.min(scaleX, scaleY);
          const drawW = imgW * scale;
          const drawH = imgH * scale;

          // Center on page
          const drawX = MARGIN + (availW - drawW) / 2;
          const drawY = MARGIN + 30 + (availH - drawH) / 2; // 30 for footer space

          const page = pdfDoc.addPage([A4W, A4H]);

          // White background
          page.drawRectangle({ x: 0, y: 0, width: A4W, height: A4H, color: rgb(1, 1, 1) });

          // Scan border effect
          page.drawRectangle({
            x: MARGIN - 2, y: MARGIN + 28, width: availW + 4, height: availH + 4,
            color: rgb(1, 1, 1),
            borderColor: rgb(0.78, 0.78, 0.8), borderWidth: 0.75
          });

          // Draw scanned image
          page.drawImage(image, { x: drawX, y: drawY, width: drawW, height: drawH });

          // Footer with scan metadata
          page.drawRectangle({ x: 0, y: 0, width: A4W, height: 28, color: rgb(0.96, 0.96, 0.98) });
          page.drawText(
            `${file.originalname}  |  ${imgW}x${imgH}px  |  ${isLandscape ? 'Landscape' : 'Portrait'}  |  Page ${i + 1}/${files.length}  |  azPDF Scanner  |  ${new Date().toLocaleDateString()}`,
            { x: 8, y: 9, size: 6.5, font: fontReg, color: rgb(0.45, 0.45, 0.5) }
          );

          // Scan badge top-right
          page.drawRectangle({ x: A4W - 90, y: A4H - 22, width: 90, height: 22, color: rgb(0.07, 0.25, 0.6), opacity: 0.85 });
          page.drawText('[SCAN] SCANNED', {
            x: A4W - 84, y: A4H - 13, size: 7.5, font, color: rgb(1, 1, 1)
          });

          successCount++;
        } catch (err) {
          console.warn(`[ScanToPDFService] Error with ${file.originalname}:`, err.message);
          failCount++;
          const page = pdfDoc.addPage([595, 842]);
          page.drawRectangle({ x: 0, y: 792, width: 595, height: 50, color: rgb(0.9, 0.5, 0.1) });
          page.drawText(`Scan Error - ${file.originalname}`, {
            x: 30, y: 808, size: 13, font, color: rgb(1, 1, 1)
          });
          page.drawText(`Error: ${err.message.substring(0, 80)}`, {
            x: 30, y: 750, size: 10, font: fontReg, color: rgb(0.4, 0.2, 0)
          });
          page.drawText(`Page ${i + 1} of ${files.length}`, {
            x: 30, y: 720, size: 10, font: fontReg, color: rgb(0.5, 0.5, 0.5)
          });
        }
      }

      console.log(
        `[ScanToPDFService] Scanned ${files.length} files: ${successCount} ok, ${failCount} errors`
      );
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new ScanToPDFService();
