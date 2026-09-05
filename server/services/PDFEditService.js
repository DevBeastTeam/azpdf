const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * PDFEditService
 * Adds annotations to a PDF document.
 * Supports multiple annotation types: note, highlight, stamp, review.
 */
class PDFEditService {
  async process(file, annotationText = 'Approved & Reviewed', annotationType = 'note', targetPage = 'all') {
    let pdfDoc = null;

    try {
      if (file && file.buffer && file.buffer.length > 0) {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      }
    } catch (e) {
      console.warn('[PDFEditService] Load error:', e.message);
    }

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([612, 792]);
    }

    pdfDoc.setProducer('azPDF Edit Engine v2');
    pdfDoc.setModificationDate(new Date());

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Determine which pages to annotate
    let pageIndicesToAnnotate = [];
    if (targetPage === 'all') {
      pageIndicesToAnnotate = pages.map((_, i) => i);
    } else if (targetPage === 'first') {
      pageIndicesToAnnotate = [0];
    } else if (targetPage === 'last') {
      pageIndicesToAnnotate = [totalPages - 1];
    } else {
      const pNum = parseInt(String(targetPage), 10);
      if (!isNaN(pNum) && pNum >= 1 && pNum <= totalPages) {
        pageIndicesToAnnotate = [pNum - 1];
      } else {
        pageIndicesToAnnotate = [0];
      }
    }

    pageIndicesToAnnotate.forEach((pageIdx) => {
      const page = pages[pageIdx];
      const { width, height } = page.getSize();
      const type = String(annotationType).toLowerCase();

      if (type === 'stamp') {
        // STAMP: Large diagonal watermark-style stamp
        page.drawRectangle({
          x: width / 2 - 120, y: height / 2 - 25, width: 240, height: 50,
          color: rgb(0.95, 0.95, 0.1), borderColor: rgb(0.8, 0.6, 0), borderWidth: 2,
          opacity: 0.85
        });
        page.drawText(annotationText.toUpperCase().substring(0, 20), {
          x: width / 2 - 110, y: height / 2 - 6, size: 18, font: fontBold,
          color: rgb(0.6, 0.3, 0), opacity: 0.9
        });

      } else if (type === 'highlight') {
        // HIGHLIGHT: Yellow highlight strip across middle third of page
        page.drawRectangle({
          x: 30, y: height / 2 - 15, width: width - 60, height: 24,
          color: rgb(1, 0.95, 0.2), opacity: 0.45
        });
        page.drawText(`Highlighted: ${annotationText.substring(0, 60)}`, {
          x: 38, y: height / 2 - 4, size: 9, font: fontReg,
          color: rgb(0.3, 0.2, 0), opacity: 0.85
        });

      } else if (type === 'review') {
        // REVIEW: Top banner annotation
        page.drawRectangle({
          x: 0, y: height - 36, width, height: 36,
          color: rgb(0.1, 0.4, 0.85), opacity: 0.88
        });
        page.drawText('UNDER REVIEW', {
          x: 14, y: height - 22, size: 11, font: fontBold, color: rgb(1, 1, 1)
        });
        page.drawText(`${annotationText.substring(0, 70)}  |  ${new Date().toLocaleDateString()}`, {
          x: 130, y: height - 22, size: 9, font: fontReg, color: rgb(0.85, 0.9, 1)
        });

      } else {
        // NOTE (default): Bottom sticky-note style annotation
        const noteW = Math.min(380, width - 60);
        const noteH = 44;
        const cleanAnnotation = String(annotationText || '').replace(/[^\x20-\x7E]/g, ' ');
        page.drawRectangle({
          x: 30, y: 24, width: noteW, height: noteH,
          color: rgb(1, 0.97, 0.7),
          borderColor: rgb(0.8, 0.75, 0.15), borderWidth: 1.2
        });
        page.drawText('[NOTE] ANNOTATION', {
          x: 40, y: noteH + 10, size: 8, font: fontBold, color: rgb(0.5, 0.4, 0)
        });
        page.drawText(cleanAnnotation.substring(0, 65), {
          x: 40, y: 48, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1)
        });
        page.drawText(`Page ${pageIdx + 1}/${totalPages}  |  ${new Date().toLocaleString()}  |  azPDF Editor`, {
          x: 40, y: 30, size: 7.5, font: fontReg, color: rgb(0.5, 0.4, 0.1)
        });
      }
    });

    console.log(`[PDFEditService] Annotated ${pageIndicesToAnnotate.length}/${totalPages} pages | Type=${annotationType}`);

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFEditService();
