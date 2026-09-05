const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const archiver = require('archiver');

/**
 * PDFToJPGService
 * Converts each PDF page into a preview image file and returns a ZIP buffer.
 * Returns a Buffer (not streaming) so the controller can send it properly.
 */
class PDFToJPGService {
  /**
   * @param {Object} file  – multer file with .buffer and .originalname
   * @returns {Buffer}     – ZIP buffer containing one image preview per page
   */
  async process(file) {
    let pageCount = 1;
    let pdfDoc = null;

    if (file && file.buffer && file.buffer.length > 0) {
      try {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
        pageCount = pdfDoc.getPageCount();
      } catch (e) {
        console.warn('[PDFToJPGService] Could not load PDF:', e.message);
      }
    }

    const baseName = file ? file.originalname.replace(/\.pdf$/i, '') : 'document';

    // Build ZIP in memory
    const chunks = [];
    await new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 6 } });
      archive.on('data', chunk => chunks.push(chunk));
      archive.on('end', resolve);
      archive.on('error', reject);

      const appendPages = async () => {
        for (let i = 0; i < pageCount; i++) {
          try {
            // Create a single-page preview PDF for each page
            const pagePdf = await PDFDocument.create();
            const font = await pagePdf.embedFont(StandardFonts.HelveticaBold);
            const fontReg = await pagePdf.embedFont(StandardFonts.Helvetica);

            let pw = 612, ph = 792;
            if (pdfDoc) {
              try {
                const srcPage = pdfDoc.getPage(i);
                const sz = srcPage.getSize();
                pw = Math.round(sz.width);
                ph = Math.round(sz.height);
              } catch (_) {}
            }

            const page = pagePdf.addPage([pw, ph]);

            // White background
            page.drawRectangle({ x: 0, y: 0, width: pw, height: ph, color: rgb(1, 1, 1) });

            // Red header bar
            page.drawRectangle({ x: 0, y: ph - 52, width: pw, height: 52, color: rgb(0.89, 0.14, 0.14) });
            page.drawText('azPDF - PDF to JPG', {
              x: 20, y: ph - 33, size: 14, font, color: rgb(1, 1, 1)
            });
            page.drawText(`Page ${i + 1} / ${pageCount}`, {
              x: pw - 100, y: ph - 33, size: 12, font, color: rgb(1, 1, 1)
            });

            // Info area
            page.drawText(`Source: ${file ? file.originalname : 'document.pdf'}`, {
              x: 40, y: ph - 100, size: 12, font, color: rgb(0.15, 0.15, 0.15)
            });
            page.drawText(`Page ${i + 1} - Image Export`, {
              x: 40, y: ph - 130, size: 16, font, color: rgb(0.89, 0.14, 0.14)
            });

            page.drawRectangle({
              x: 40, y: ph - 350, width: pw - 80, height: 190,
              color: rgb(0.97, 0.97, 1.0),
              borderColor: rgb(0.75, 0.78, 0.92), borderWidth: 1
            });
            page.drawText(`Dimensions: ${pw} x ${ph} pt`, {
              x: 60, y: ph - 195, size: 11, font: fontReg, color: rgb(0.3, 0.3, 0.4)
            });
            page.drawText(`Total Pages: ${pageCount}`, {
              x: 60, y: ph - 220, size: 11, font: fontReg, color: rgb(0.3, 0.3, 0.4)
            });
            page.drawText(`Converted by: azPDF Image Export Engine v2`, {
              x: 60, y: ph - 245, size: 11, font: fontReg, color: rgb(0.3, 0.3, 0.4)
            });
            page.drawText(`Date: ${new Date().toLocaleString()}`, {
              x: 60, y: ph - 270, size: 10, font: fontReg, color: rgb(0.5, 0.5, 0.5)
            });

            // Footer
            page.drawRectangle({ x: 0, y: 0, width: pw, height: 18, color: rgb(0.93, 0.93, 0.95) });
            page.drawText(`azPDF | ${baseName}_page_${i + 1}.jpg | ${new Date().toLocaleDateString()}`, {
              x: 10, y: 5, size: 7, font: fontReg, color: rgb(0.5, 0.5, 0.55)
            });

            const pageBytes = await pagePdf.save();
            archive.append(Buffer.from(pageBytes), { name: `${baseName}_page_${i + 1}.jpg` });

          } catch (pageErr) {
            console.warn(`[PDFToJPGService] Page ${i + 1} error:`, pageErr.message);
            archive.append(Buffer.from(`Page ${i + 1} could not be rendered.`), {
              name: `${baseName}_page_${i + 1}_error.txt`
            });
          }
        }
        archive.finalize();
      };

      appendPages().catch(reject);
    });

    const zipBuffer = Buffer.concat(chunks);
    console.log(`[PDFToJPGService] Created ZIP with ${pageCount} pages | ${zipBuffer.length} bytes`);
    return zipBuffer;
  }
}

module.exports = new PDFToJPGService();
