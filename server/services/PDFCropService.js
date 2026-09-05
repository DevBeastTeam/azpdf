const { PDFDocument } = require('pdf-lib');

/**
 * PDFCropService
 * Crops PDF pages by setting MediaBox and CropBox.
 * Supports custom margins on all sides or preset crop modes.
 */
class PDFCropService {
  async process(file, cropOptions = {}) {
    let pdfDoc = null;

    try {
      if (file && file.buffer && file.buffer.length > 0) {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      }
    } catch (e) {
      console.warn('[PDFCropService] Load error:', e.message);
    }

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([612, 792]);
    }

    pdfDoc.setProducer('azPDF Crop Engine v2');
    pdfDoc.setModificationDate(new Date());

    const {
      marginTop = 40,
      marginBottom = 40,
      marginLeft = 40,
      marginRight = 40,
      mode = 'custom',       // 'custom' | 'tight' | 'standard' | 'wide'
      pages: pagesParam = 'all',
    } = cropOptions;

    const allPages = pdfDoc.getPages();
    const totalPages = allPages.length;

    // Preset modes
    let mT = Number(marginTop) || 40;
    let mB = Number(marginBottom) || 40;
    let mL = Number(marginLeft) || 40;
    let mR = Number(marginRight) || 40;

    switch (String(mode).toLowerCase()) {
      case 'tight':   mT = 10; mB = 10; mL = 10; mR = 10; break;
      case 'standard': mT = 40; mB = 40; mL = 50; mR = 50; break;
      case 'wide':    mT = 72; mB = 72; mL = 72; mR = 72; break; // 1-inch margins
      default: break;
    }

    // Determine which pages to crop
    let pagesToCrop = new Set(allPages.map((_, i) => i));
    if (pagesParam && String(pagesParam).toLowerCase() !== 'all') {
      pagesToCrop = new Set();
      String(pagesParam).split(',').forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
          const [s, e] = part.split('-').map(n => parseInt(n, 10));
          for (let i = s; i <= e; i++) {
            if (i >= 1 && i <= totalPages) pagesToCrop.add(i - 1);
          }
        } else {
          const pg = parseInt(part, 10);
          if (!isNaN(pg) && pg >= 1 && pg <= totalPages) pagesToCrop.add(pg - 1);
        }
      });
    }

    allPages.forEach((page, idx) => {
      if (!pagesToCrop.has(idx)) return;
      const { width, height } = page.getSize();

      // Ensure margins don't exceed page size
      const safeML = Math.min(mL, width / 4);
      const safeMR = Math.min(mR, width / 4);
      const safeMT = Math.min(mT, height / 4);
      const safeMB = Math.min(mB, height / 4);

      const cropX = safeML;
      const cropY = safeMB;
      const cropW = Math.max(10, width - safeML - safeMR);
      const cropH = Math.max(10, height - safeMT - safeMB);

      page.setMediaBox(cropX, cropY, cropW, cropH);
      page.setCropBox(cropX, cropY, cropW, cropH);
    });

    console.log(
      `[PDFCropService] Cropped ${pagesToCrop.size}/${totalPages} pages | Mode=${mode} | Margins: T${mT} B${mB} L${mL} R${mR}`
    );

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFCropService();
