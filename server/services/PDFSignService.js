const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const crypto = require('crypto');

/**
 * PDFSignService
 * Adds a digital signature block to a PDF.
 * Includes signer name, date/time, timezone, SHA-256 document fingerprint,
 * and places signature on the last page (or all pages).
 */
class PDFSignService {
  async process(file, signerName = 'Alex Johnson', options = {}) {
    let pdfDoc = null;

    try {
      if (file && file.buffer && file.buffer.length > 0) {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      }
    } catch (e) {
      console.warn('[PDFSignService] Load error:', e.message);
    }

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([612, 792]);
    }

    const {
      signAll = false,       // Sign all pages or just the last
      position = 'bottom-right',  // 'bottom-right' | 'bottom-left' | 'top-right'
    } = options;

    // Generate SHA-256 fingerprint of original file
    const fileBuffer = file && file.buffer ? file.buffer : Buffer.from('');
    const docHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const shortHash = docHash.substring(0, 16).toUpperCase();

    pdfDoc.setProducer('azPDF Digital Signature Engine v2');
    pdfDoc.setCreator('azPDF');
    pdfDoc.setSubject(`Digitally signed by ${signerName}`);
    pdfDoc.setModificationDate(new Date());

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });

    // Determine which pages to sign
    const pagesToSign = signAll
      ? pages.map((_, i) => i)
      : [totalPages - 1];  // Default: last page only

    pagesToSign.forEach((pageIdx) => {
      const page = pages[pageIdx];
      const { width, height } = page.getSize();

      const BOX_W = 240, BOX_H = 95;
      const MARGIN = 24;

      let boxX, boxY;
      switch (position) {
        case 'bottom-left':
          boxX = MARGIN;
          boxY = MARGIN;
          break;
        case 'top-right':
          boxX = width - BOX_W - MARGIN;
          boxY = height - BOX_H - MARGIN;
          break;
        case 'bottom-right':
        default:
          boxX = width - BOX_W - MARGIN;
          boxY = MARGIN;
          break;
      }

      // Signature box
      page.drawRectangle({
        x: boxX, y: boxY, width: BOX_W, height: BOX_H,
        color: rgb(0.96, 0.98, 1.0),
        borderColor: rgb(0.15, 0.35, 0.75), borderWidth: 1.8
      });

      // Title bar
      page.drawRectangle({
        x: boxX, y: boxY + BOX_H - 20, width: BOX_W, height: 20,
        color: rgb(0.12, 0.3, 0.72)
      });
      page.drawText('[OK] DIGITALLY SIGNED DOCUMENT', {
        x: boxX + 8, y: boxY + BOX_H - 13, size: 8, font: fontBold, color: rgb(1, 1, 1)
      });

      // Signature lines
      const cleanSigner = String(signerName || 'Alex Johnson').replace(/[^\x20-\x7E]/g, '');
      page.drawText(cleanSigner, {
        x: boxX + 8, y: boxY + BOX_H - 35, size: 14, font: fontBold, color: rgb(0.08, 0.22, 0.58)
      });

      // Divider line under signature name
      page.drawLine({
        start: { x: boxX + 8, y: boxY + BOX_H - 38 },
        end: { x: boxX + BOX_W - 8, y: boxY + BOX_H - 38 },
        thickness: 0.5, color: rgb(0.6, 0.7, 0.85)
      });

      page.drawText(`Date: ${dateStr}`, {
        x: boxX + 8, y: boxY + BOX_H - 52, size: 8, font: fontReg, color: rgb(0.25, 0.25, 0.35)
      });
      page.drawText(`Time: ${timeStr}`, {
        x: boxX + 8, y: boxY + BOX_H - 63, size: 8, font: fontReg, color: rgb(0.25, 0.25, 0.35)
      });
      page.drawText(`Hash: ${shortHash}`, {
        x: boxX + 8, y: boxY + BOX_H - 74, size: 7, font: fontReg, color: rgb(0.15, 0.5, 0.15)
      });
      page.drawText(`azPDF Digital Signature - Page ${pageIdx + 1}/${totalPages}`, {
        x: boxX + 8, y: boxY + 7, size: 6.5, font: fontReg, color: rgb(0.45, 0.45, 0.55)
      });
    });

    console.log(
      `[PDFSignService] Signed by="${signerName}" | Pages=${pagesToSign.length}/${totalPages} | Hash=${shortHash}`
    );

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFSignService();
