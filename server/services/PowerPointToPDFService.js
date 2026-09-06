const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const JSZip = require('jszip');

class PowerPointToPDFService {
  /**
   * Converts Microsoft PowerPoint (.pptx) presentation to PDF.
   * Extracts the actual slide XML, slide titles, body paragraphs, and bullet points
   * from the PPTX package and renders each slide onto a landscape PDF page.
   * @param {Object} file - multer file object with .buffer and .originalname
   * @returns {Promise<Buffer>} - rendered PDF document
   */
  async process(file) {
    const originalName = file ? file.originalname : 'presentation.pptx';
    const baseName = originalName.replace(/\.pptx?$/i, '');

    const extractedSlides = [];

    if (file && file.buffer && file.buffer.length > 0) {
      try {
        const zip = await JSZip.loadAsync(file.buffer);
        // Find all slide XML files inside the PPTX archive
        const slideKeys = Object.keys(zip.files)
          .filter(k => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
          .sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
            const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
            return numA - numB;
          });

        for (const slideKey of slideKeys) {
          const xmlContent = await zip.files[slideKey].async('text');
          const slideData = this._parseSlideXml(xmlContent);
          if (slideData.paragraphs.length > 0 || slideData.title) {
            extractedSlides.push(slideData);
          }
        }
      } catch (err) {
        console.warn('[PowerPointToPDFService] Could not parse PPTX structure:', err.message);
      }
    }

    // Fallback if PPTX contains no readable slides
    if (extractedSlides.length === 0) {
      extractedSlides.push({
        title: baseName.replace(/[-_]/g, ' '),
        paragraphs: ['Document converted from PowerPoint presentation.']
      });
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(baseName);
    pdfDoc.setProducer('azPDF PowerPoint→PDF Engine v2');
    pdfDoc.setCreator('azPDF');
    pdfDoc.setCreationDate(new Date());

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Standard 16:9 Presentation Dimensions: 720 x 405 (at 72 dpi)
    const SLIDE_W = 720, SLIDE_H = 405;
    const MARGIN = 40;

    const cleanText = (str) => String(str || '')
      .replace(/[—–]/g, '-')
      .replace(/[^\x20-\x7E\t\r\n]/g, ' ')
      .trim();

    const wrapText = (text, font, size, maxW) => {
      const words = String(text).split(' ');
      const lines = [];
      let cur = '';
      for (const word of words) {
        const test = cur ? `${cur} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) <= maxW) {
          cur = test;
        } else {
          if (cur) lines.push(cur);
          cur = word;
        }
      }
      if (cur) lines.push(cur);
      return lines;
    };

    extractedSlides.forEach((slide, idx) => {
      const page = pdfDoc.addPage([SLIDE_W, SLIDE_H]);
      const isTitleSlide = idx === 0;

      if (isTitleSlide) {
        // Dark Navy Elegant Theme for Slide 1
        page.drawRectangle({ x: 0, y: 0, width: SLIDE_W, height: SLIDE_H, color: rgb(0.06, 0.09, 0.16) });

        // Red Accent Strip
        page.drawRectangle({ x: MARGIN, y: SLIDE_H - 120, width: 8, height: 160, color: rgb(0.89, 0.14, 0.14) });

        const mainTitle = cleanText(slide.title || baseName);
        const titleLines = wrapText(mainTitle, fontBold, 26, SLIDE_W - MARGIN * 2 - 40);
        let titleY = SLIDE_H - 140;
        titleLines.slice(0, 3).forEach(line => {
          page.drawText(line, { x: MARGIN + 25, y: titleY, size: 26, font: fontBold, color: rgb(1, 1, 1) });
          titleY -= 32;
        });

        // Subtitle / Body on title slide
        let bodyY = titleY - 15;
        slide.paragraphs.slice(0, 3).forEach(para => {
          const cleaned = cleanText(para);
          if (cleaned) {
            const lines = wrapText(cleaned, fontReg, 13, SLIDE_W - MARGIN * 2 - 40);
            lines.slice(0, 2).forEach(l => {
              page.drawText(l, { x: MARGIN + 25, y: bodyY, size: 13, font: fontReg, color: rgb(0.7, 0.75, 0.85) });
              bodyY -= 18;
            });
            bodyY -= 6;
          }
        });

        // Footer
        page.drawText(
          `${originalName}  |  Slide 1 of ${extractedSlides.length}  |  azPDF PowerPoint Engine`,
          { x: MARGIN + 25, y: 22, size: 9, font: fontReg, color: rgb(0.4, 0.45, 0.55) }
        );

      } else {
        // Light Minimal Modern Theme for Content Slides
        page.drawRectangle({ x: 0, y: 0, width: SLIDE_W, height: SLIDE_H, color: rgb(0.98, 0.98, 1.0) });

        // Header Banner
        page.drawRectangle({ x: 0, y: SLIDE_H - 65, width: SLIDE_W, height: 65, color: rgb(0.12, 0.16, 0.25) });
        page.drawRectangle({ x: 0, y: SLIDE_H - 68, width: SLIDE_W, height: 3, color: rgb(0.89, 0.14, 0.14) });

        const slideTitle = cleanText(slide.title || `Section ${idx + 1}`);
        page.drawText(slideTitle, {
          x: MARGIN, y: SLIDE_H - 42, size: 18, font: fontBold, color: rgb(1, 1, 1),
          maxWidth: SLIDE_W - MARGIN * 2 - 80
        });

        // Slide Number
        page.drawText(`${idx + 1}`, {
          x: SLIDE_W - MARGIN - 15, y: SLIDE_H - 42, size: 13, font: fontBold, color: rgb(0.8, 0.85, 0.95)
        });

        // Body bullet points / text
        let curY = SLIDE_H - 100;
        const maxParas = Math.min(slide.paragraphs.length, 8);

        for (let pIdx = 0; pIdx < maxParas; pIdx++) {
          const paraText = cleanText(slide.paragraphs[pIdx]);
          if (!paraText || curY < 50) continue;

          // Bullet indicator
          page.drawCircle({ x: MARGIN + 6, y: curY + 4, size: 3, color: rgb(0.89, 0.14, 0.14) });

          const lines = wrapText(paraText, fontReg, 12, SLIDE_W - MARGIN * 2 - 24);
          lines.forEach(l => {
            if (curY >= 50) {
              page.drawText(l, { x: MARGIN + 18, y: curY, size: 12, font: fontReg, color: rgb(0.18, 0.22, 0.3) });
              curY -= 18;
            }
          });
          curY -= 6;
        }

        // Bottom footer
        page.drawRectangle({ x: 0, y: 0, width: SLIDE_W, height: 24, color: rgb(0.92, 0.93, 0.96) });
        page.drawText(
          `${originalName}  |  Slide ${idx + 1} of ${extractedSlides.length}  |  azPDF Presentation Converter`,
          { x: MARGIN, y: 7, size: 8, font: fontReg, color: rgb(0.45, 0.5, 0.6) }
        );
      }
    });

    console.log(`[PowerPointToPDFService] Converted ${extractedSlides.length} actual slides from ${originalName}`);

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }

  /**
   * Parses slide XML extracting paragraphs and text runs (<a:t>)
   */
  _parseSlideXml(xml) {
    const paragraphs = [];
    let title = '';

    // Match all paragraphs <a:p>...</a:p>
    const pMatches = xml.match(/<a:p\b[^>]*>[\s\S]*?<\/a:p>/gi) || [];

    for (const pXml of pMatches) {
      // Find all text runs <a:t>...</a:t>
      const tMatches = pXml.match(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/gi) || [];
      const text = tMatches
        .map(t => t.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean)
        .join(' ');

      if (text.length > 0) {
        if (!title && text.length < 80) {
          title = text;
        } else {
          paragraphs.push(text);
        }
      }
    }

    return { title, paragraphs };
  }
}

module.exports = new PowerPointToPDFService();
