const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');

/**
 * PDFWatermarkService
 * Adds text watermarks to PDF with full control over position,
 * opacity, color, font size, and rotation.
 */
class PDFWatermarkService {
  async process(file, watermarkText = 'CONFIDENTIAL', options = {}) {
    let pdfDoc = null;

    try {
      if (file && file.buffer && file.buffer.length > 0) {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      }
    } catch (e) {
      console.warn('[PDFWatermarkService] Load error:', e.message);
    }

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([612, 792]);
    }

    pdfDoc.setProducer('azPDF Watermark Engine v2');
    pdfDoc.setModificationDate(new Date());

    // Options
    const {
      position = 'diagonal',     // 'diagonal' | 'center' | 'header' | 'footer' | 'top-right' | 'bottom-left'
      opacity = 0.35,
      fontSize = null,            // null = auto-size
      colorR = 0.85, colorG = 0.15, colorB = 0.15,
      rotation = null,            // null = position-based default
    } = options;

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const text = String(watermarkText).substring(0, 60);

    pages.forEach((page) => {
      const { width, height } = page.getSize();

      let drawX, drawY, angle, size;
      const textOpacity = Math.min(1, Math.max(0.05, Number(opacity) || 0.35));
      const color = rgb(
        Math.min(1, Math.max(0, Number(colorR) || 0.85)),
        Math.min(1, Math.max(0, Number(colorG) || 0.15)),
        Math.min(1, Math.max(0, Number(colorB) || 0.15))
      );

      switch (position) {
        case 'header': {
          size = fontSize || 14;
          const textW = font.widthOfTextAtSize(text, size);
          drawX = Math.max(10, (width - textW) / 2);
          drawY = height - 20;
          angle = rotation !== null ? Number(rotation) : 0;
          break;
        }
        case 'footer': {
          size = fontSize || 14;
          const textW = font.widthOfTextAtSize(text, size);
          drawX = Math.max(10, (width - textW) / 2);
          drawY = 8;
          angle = rotation !== null ? Number(rotation) : 0;
          break;
        }
        case 'top-right': {
          size = fontSize || 12;
          const textW = font.widthOfTextAtSize(text, size);
          drawX = width - textW - 20;
          drawY = height - 20;
          angle = rotation !== null ? Number(rotation) : 0;
          break;
        }
        case 'bottom-left': {
          size = fontSize || 12;
          drawX = 20;
          drawY = 12;
          angle = rotation !== null ? Number(rotation) : 0;
          break;
        }
        case 'center': {
          size = fontSize || 36;
          const textW = font.widthOfTextAtSize(text, size);
          const textH = font.heightAtSize(size);
          drawX = Math.max(10, (width - textW) / 2);
          drawY = Math.max(10, (height - textH) / 2);
          angle = rotation !== null ? Number(rotation) : 0;
          break;
        }
        case 'diagonal':
        default: {
          size = fontSize || this._autoFontSize(text, font, width, height);
          const textW = font.widthOfTextAtSize(text, size);
          const textH = font.heightAtSize(size);
          drawX = Math.max(10, (width - textW) / 2);
          drawY = Math.max(10, (height - textH) / 2);
          angle = rotation !== null ? Number(rotation) : 45;
          break;
        }
      }

      page.drawText(text, {
        x: drawX,
        y: drawY,
        size,
        font,
        color,
        opacity: textOpacity,
        rotate: degrees(angle)
      });
    });

    console.log(
      `[PDFWatermarkService] Watermarked ${pages.length} pages | Text="${text}" | Position=${position} | Opacity=${opacity}`
    );

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }

  /** Calculate font size to fill ~60% of the diagonal */
  _autoFontSize(text, font, width, height) {
    const diagonal = Math.sqrt(width * width + height * height);
    const targetWidth = diagonal * 0.6;
    let size = 42;
    while (size > 8 && font.widthOfTextAtSize(text, size) > targetWidth) {
      size -= 2;
    }
    return size;
  }
}

module.exports = new PDFWatermarkService();
