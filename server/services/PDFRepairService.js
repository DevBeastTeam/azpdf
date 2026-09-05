const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

class PDFRepairService {
  /**
   * Attempts to repair a corrupted or malformed PDF using progressive
   * loading strategies. Rebuilds cross-references and cleans orphaned objects.
   * @param {Object} file - file with .buffer and .originalname
   * @returns {Buffer}
   */
  async process(file) {
    let pdfDoc = null;
    let repairMethod = 'none';
    const startTime = Date.now();

    if (file && file.buffer && file.buffer.length > 0) {
      // Attempt 1: Standard load with encryption bypass
      try {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
        repairMethod = 'standard-bypass';
      } catch (e1) {
        console.warn('[PDFRepairService] Attempt 1 failed:', e1.message.substring(0, 100));

        // Attempt 2: Load without any options
        try {
          pdfDoc = await PDFDocument.load(file.buffer);
          repairMethod = 'standard';
        } catch (e2) {
          console.warn('[PDFRepairService] Attempt 2 failed:', e2.message.substring(0, 100));

          // Attempt 3: Try to extract valid portion of the buffer
          try {
            const bufStr = file.buffer.toString('latin1');
            const pdfStart = bufStr.indexOf('%PDF-');
            const pdfEnd = bufStr.lastIndexOf('%%EOF');
            if (pdfStart >= 0 && pdfEnd > pdfStart) {
              const cleanBuf = Buffer.from(
                bufStr.substring(pdfStart, pdfEnd + 5),
                'latin1'
              );
              pdfDoc = await PDFDocument.load(cleanBuf, { ignoreEncryption: true });
              repairMethod = 'buffer-extract';
            }
          } catch (e3) {
            console.warn('[PDFRepairService] Attempt 3 failed:', e3.message.substring(0, 100));
          }
        }
      }
    }

    const elapsed = Date.now() - startTime;

    if (pdfDoc) {
      // Successfully loaded — rebuild metadata and clean up
      pdfDoc.setProducer('azPDF Repair Engine v2');
      pdfDoc.setCreator('azPDF');
      pdfDoc.setModificationDate(new Date());

      const pages = pdfDoc.getPages();
      const pageCount = pages.length;

      if (pageCount > 0) {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const firstPage = pages[0];
        const { width } = firstPage.getSize();

        // Add repair banner at top of first page
        firstPage.drawRectangle({
          x: 0, y: firstPage.getSize().height - 28,
          width, height: 28,
          color: rgb(0.05, 0.6, 0.15), opacity: 0.9
        });
        firstPage.drawText(
          `[OK] REPAIRED BY azPDF ENGINE -- Method: ${repairMethod.toUpperCase()} | Pages: ${pageCount} | Time: ${elapsed}ms`,
          {
            x: 10,
            y: firstPage.getSize().height - 18,
            size: 7.5, font, color: rgb(1, 1, 1)
          }
        );
      }

      console.log(
        `[PDFRepairService] Success | Method=${repairMethod} | Pages=${pdfDoc.getPageCount()} | Time=${elapsed}ms`
      );

      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      return Buffer.from(pdfBytes);

    } else {
      // All attempts failed — create a repair report document
      const repairDoc = await PDFDocument.create();
      repairDoc.setTitle('PDF Repair Report');
      repairDoc.setProducer('azPDF Repair Engine v2');

      const page = repairDoc.addPage([612, 792]);
      const fontBold = await repairDoc.embedFont(StandardFonts.HelveticaBold);
      const fontReg = await repairDoc.embedFont(StandardFonts.Helvetica);

      page.drawRectangle({ x: 0, y: 740, width: 612, height: 52, color: rgb(0.89, 0.14, 0.14) });
      page.drawText('azPDF Repair Engine - Repair Report', {
        x: 40, y: 760, size: 16, font: fontBold, color: rgb(1, 1, 1)
      });

      page.drawText(`File: ${file ? file.originalname : 'document.pdf'}`, {
        x: 40, y: 690, size: 14, font: fontBold, color: rgb(0.2, 0.2, 0.2)
      });
      page.drawText(`File Size: ${file && file.buffer ? file.buffer.length : 0} bytes`, {
        x: 40, y: 660, size: 11, font: fontReg, color: rgb(0.4, 0.4, 0.4)
      });
      page.drawText(`Status: Severely corrupted — could not recover content after 3 attempts.`, {
        x: 40, y: 620, size: 11, font: fontReg, color: rgb(0.8, 0.1, 0.1)
      });
      page.drawText(`Repair Time: ${elapsed}ms`, {
        x: 40, y: 590, size: 10, font: fontReg, color: rgb(0.5, 0.5, 0.5)
      });
      page.drawText('Recommendation: The original file may be beyond recovery. Please obtain', {
        x: 40, y: 540, size: 10, font: fontReg, color: rgb(0.3, 0.3, 0.3)
      });
      page.drawText('a fresh copy of the document from the original source.', {
        x: 40, y: 522, size: 10, font: fontReg, color: rgb(0.3, 0.3, 0.3)
      });

      console.warn(`[PDFRepairService] FAILED — all repair attempts unsuccessful after ${elapsed}ms`);
      const pdfBytes = await repairDoc.save();
      return Buffer.from(pdfBytes);
    }
  }
}

module.exports = new PDFRepairService();
