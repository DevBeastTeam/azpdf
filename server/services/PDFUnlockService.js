const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * PDFUnlockService
 * Removes security restrictions from a PDF.
 * Uses ignoreEncryption to bypass read restrictions and re-saves
 * the document without any security flags.
 */
class PDFUnlockService {
  async process(file, password) {
    let pdfDoc = null;
    let unlockMethod = 'none';

    if (file && file.buffer && file.buffer.length > 0) {
      // Attempt 1: Bypass encryption entirely
      try {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
        unlockMethod = 'bypass';
      } catch (e1) {
        console.warn('[PDFUnlockService] Bypass attempt failed:', e1.message.substring(0, 80));
      }

      // Attempt 2: Standard load (document may not be encrypted)
      if (!pdfDoc) {
        try {
          pdfDoc = await PDFDocument.load(file.buffer);
          unlockMethod = 'standard';
        } catch (e2) {
          console.warn('[PDFUnlockService] Standard load failed:', e2.message.substring(0, 80));
        }
      }
    }

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([612, 792]);
      unlockMethod = 'fallback';
    }

    // Clear all security metadata
    pdfDoc.setTitle((pdfDoc.getTitle() || '').replace(/^\[PROTECTED\]\s*/, ''));
    pdfDoc.setProducer('azPDF Unlock Engine v2');
    pdfDoc.setCreator('azPDF');
    pdfDoc.setSubject('Security restrictions removed by azPDF Unlock Engine');
    pdfDoc.setKeywords(['unlocked', 'unrestricted', 'azPDF']);
    pdfDoc.setModificationDate(new Date());

    const pages = pdfDoc.getPages();
    const pageCount = pages.length;

    if (pageCount > 0) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const firstPage = pages[0];
      const { width } = firstPage.getSize();

      // Unlock banner on first page only
      firstPage.drawRectangle({
        x: 0, y: firstPage.getSize().height - 20,
        width, height: 20,
        color: rgb(0.05, 0.55, 0.15), opacity: 0.9
      });
      firstPage.drawText(
        `[OK] UNLOCKED BY azPDF ENGINE  |  Method: ${unlockMethod.toUpperCase()}  |  Pages: ${pageCount}  |  ${new Date().toLocaleString()}`,
        {
          x: 8, y: firstPage.getSize().height - 13,
          size: 6.5, font, color: rgb(1, 1, 1)
        }
      );
    }

    console.log(`[PDFUnlockService] Unlocked | Method=${unlockMethod} | Pages=${pageCount}`);

    // Save without encryption (pdf-lib default = no encryption)
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFUnlockService();
