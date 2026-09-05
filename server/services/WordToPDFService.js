const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * WordToPDFService
 * Converts Word documents to PDF.
 * Uses mammoth for real .docx text extraction if available,
 * with graceful fallback for unsupported formats.
 */
class WordToPDFService {
  async process(file) {
    const originalName = file ? file.originalname : 'document.docx';
    let extractedText = '';
    let extractionMethod = 'none';

    // Attempt real .docx text extraction with mammoth
    if (file && file.buffer) {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        if (result && result.value && result.value.trim()) {
          extractedText = result.value;
          extractionMethod = 'mammoth';
        }
      } catch (err) {
        console.warn('[WordToPDFService] mammoth error:', err.message);
        extractionMethod = 'fallback';
      }
    }

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(originalName.replace(/\.docx?$/i, ''));
    pdfDoc.setProducer('azPDF Word→PDF Engine v2');
    pdfDoc.setCreator('azPDF');
    pdfDoc.setCreationDate(new Date());

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const PAGE_W = 612, PAGE_H = 792;
    const MARGIN = 50, LINE_H = 16, FONT_SIZE = 11;
    const MAX_LINE_W = PAGE_W - MARGIN * 2;

    // Word-wrap helper
    const wrapText = (text, font, size, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let current = '';
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) <= maxWidth) {
          current = test;
        } else {
          if (current) lines.push(current);
          current = word;
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    const cleanText = (str) => String(str || '').replace(/[—–]/g, '-').replace(/[→⇒]/g, '->').replace(/[^\x20-\x7E\t\r\n]/g, ' ');

    // First page: header
    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: PAGE_H - 70, width: PAGE_W, height: 70, color: rgb(0.89, 0.14, 0.14) });
    page.drawText(cleanText('azPDF - Word to PDF Conversion'), {
      x: MARGIN, y: PAGE_H - 28, size: 16, font: fontBold, color: rgb(1, 1, 1)
    });
    page.drawText(cleanText(`Source: ${originalName}  |  Date: ${new Date().toLocaleDateString()}  |  Method: ${extractionMethod}`), {
      x: MARGIN, y: PAGE_H - 52, size: 9, font: fontRegular, color: rgb(1, 1, 0.8)
    });

    let curY = PAGE_H - 90;

    if (extractedText) {
      const paragraphs = extractedText.split('\n').filter(p => p.trim().length > 0);

      for (const para of paragraphs) {
        const isHeading =
          para.trim().length < 80 &&
          para.trim() === para.trim().toUpperCase() &&
          /^[A-Z0-9\s\-:.,]+$/.test(para.trim());

        const fontSize = isHeading ? 13 : FONT_SIZE;
        const font = isHeading ? fontBold : fontRegular;
        const color = isHeading ? rgb(0.89, 0.14, 0.14) : rgb(0.1, 0.1, 0.1);
        const lineSpacing = isHeading ? LINE_H + 4 : LINE_H;
        const paraSpacing = isHeading ? 10 : 6;

        const wrappedLines = wrapText(cleanText(para.trim()), font, fontSize, MAX_LINE_W);

        for (const wLine of wrappedLines) {
          if (curY < MARGIN + 30) {
            // New page
            page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            curY = PAGE_H - MARGIN;
          }
          page.drawText(cleanText(wLine), { x: MARGIN, y: curY, size: fontSize, font, color });
          curY -= lineSpacing;
        }
        curY -= paraSpacing;
      }
    } else {
      // Fallback display
      page.drawText(cleanText(`File: ${originalName}`), {
        x: MARGIN, y: curY, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.2)
      });
      curY -= 30;
      page.drawText(cleanText('Format: Microsoft Word (.docx) -> PDF'), {
        x: MARGIN, y: curY, size: 11, font: fontRegular, color: rgb(0.4, 0.4, 0.4)
      });
      curY -= 20;
      page.drawText(cleanText('Note: Text content could not be extracted from this document.'), {
        x: MARGIN, y: curY, size: 10, font: fontRegular, color: rgb(0.6, 0.3, 0)
      });
      curY -= 16;
      page.drawText(cleanText('The file may be password-protected, binary-only, or in an unsupported format.'), {
        x: MARGIN, y: curY, size: 10, font: fontRegular, color: rgb(0.6, 0.3, 0)
      });
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new WordToPDFService();
