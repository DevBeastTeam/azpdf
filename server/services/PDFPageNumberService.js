const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * PDFPageNumberService
 * Adds page numbers to every page of a PDF.
 * Supports multiple positions and number formats.
 */
class PDFPageNumberService {
  async process(file, position = 'bottom-center', format = 'numeric', startFrom = 1, prefix = '') {
    let pdfDoc = null;

    try {
      if (file && file.buffer && file.buffer.length > 0) {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      }
    } catch (e) {
      console.warn('[PDFPageNumberService] Load error:', e.message);
    }

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([612, 792]);
    }

    pdfDoc.setProducer('azPDF PageNumber Engine v2');
    pdfDoc.setModificationDate(new Date());

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    const startNum = parseInt(String(startFrom), 10) || 1;
    const pfx = String(prefix || '');

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const pageNum = startNum + index;

      // Format the page number
      let numStr;
      switch (String(format).toLowerCase()) {
        case 'roman':
          numStr = this._toRoman(pageNum);
          break;
        case 'roman-lower':
          numStr = this._toRoman(pageNum).toLowerCase();
          break;
        case 'letter':
          numStr = String.fromCharCode(64 + pageNum); // A, B, C...
          break;
        case 'total':
          numStr = `${pageNum} / ${totalPages}`;
          break;
        default:
          numStr = String(pageNum);
      }

      const pageText = pfx ? `${pfx} ${numStr}` : numStr;
      const fontSize = 10;
      const textWidth = font.widthOfTextAtSize(pageText, fontSize);
      const margin = 22;

      let posX, posY;
      const pos = String(position).toLowerCase();

      switch (pos) {
        case 'bottom-left':
          posX = margin;
          posY = margin;
          break;
        case 'bottom-right':
          posX = width - textWidth - margin;
          posY = margin;
          break;
        case 'top-center':
          posX = (width - textWidth) / 2;
          posY = height - margin;
          break;
        case 'top-left':
          posX = margin;
          posY = height - margin;
          break;
        case 'top-right':
          posX = width - textWidth - margin;
          posY = height - margin;
          break;
        case 'bottom-center':
        default:
          posX = (width - textWidth) / 2;
          posY = margin;
          break;
      }

      // Draw subtle background pill for readability
      page.drawRectangle({
        x: posX - 6, y: posY - 3, width: textWidth + 12, height: fontSize + 8,
        color: rgb(0.95, 0.95, 0.97), opacity: 0.75,
        borderColor: rgb(0.75, 0.75, 0.82), borderWidth: 0.5
      });

      page.drawText(pageText, {
        x: posX, y: posY + 1,
        size: fontSize, font,
        color: rgb(0.25, 0.25, 0.3)
      });
    });

    console.log(
      `[PDFPageNumberService] Numbered ${totalPages} pages | Position=${position} | Format=${format} | Start=${startFrom}`
    );

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }

  /** Convert integer to Roman numerals */
  _toRoman(num) {
    if (num <= 0 || num > 3999) return String(num);
    const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
    let result = '';
    for (let i = 0; i < vals.length; i++) {
      while (num >= vals[i]) {
        result += syms[i];
        num -= vals[i];
      }
    }
    return result;
  }
}

module.exports = new PDFPageNumberService();
