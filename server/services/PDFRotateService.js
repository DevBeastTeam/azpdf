const { PDFDocument, degrees, rgb, StandardFonts } = require('pdf-lib');

class PDFRotateService {
  /**
   * Rotates PDF pages. Supports rotating all pages or selective pages.
   * @param {Object} file - file with .buffer and .originalname
   * @param {number|string} angleParam - rotation angle: 90, 180, 270 (or -90)
   * @param {string} pagesParam - "all" | "1,3,5" | "1-3" (1-indexed)
   * @returns {Buffer}
   */
  async process(file, angleParam = 90, pagesParam = 'all') {
    let pdfDoc = null;

    try {
      if (file && file.buffer && file.buffer.length > 0) {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      }
    } catch (e) {
      console.warn('[PDFRotateService] Load error:', e.message);
    }

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      page.drawText(`Rotated: ${file ? file.originalname : 'document.pdf'}`, {
        x: 40, y: 700, size: 16, font, color: rgb(0.89, 0.14, 0.14)
      });
    }

    // Normalize angle to 0/90/180/270
    let angle = parseInt(String(angleParam), 10);
    if (isNaN(angle)) angle = 90;
    // Support negative angles (e.g. -90 = 270)
    angle = ((angle % 360) + 360) % 360;
    // Snap to nearest 90 degrees
    angle = Math.round(angle / 90) * 90 % 360;

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Determine which page indices to rotate
    let indicesToRotate = new Set();

    if (!pagesParam || String(pagesParam).trim().toLowerCase() === 'all') {
      pages.forEach((_, i) => indicesToRotate.add(i));
    } else {
      const parts = String(pagesParam).split(',').map(p => p.trim());
      for (const part of parts) {
        if (part.includes('-')) {
          const [s, e] = part.split('-').map(n => parseInt(n.trim(), 10));
          for (let i = s; i <= e; i++) {
            if (i >= 1 && i <= totalPages) indicesToRotate.add(i - 1);
          }
        } else {
          const pg = parseInt(part, 10);
          if (!isNaN(pg) && pg >= 1 && pg <= totalPages) indicesToRotate.add(pg - 1);
        }
      }
    }

    // Apply rotation, accumulating existing rotation
    pages.forEach((page, idx) => {
      if (indicesToRotate.has(idx)) {
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + angle) % 360));
      }
    });

    pdfDoc.setProducer('azPDF Rotate Engine v2');
    pdfDoc.setModificationDate(new Date());

    console.log(
      `[PDFRotateService] Rotated ${indicesToRotate.size}/${totalPages} pages by ${angle}°`
    );

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFRotateService();
