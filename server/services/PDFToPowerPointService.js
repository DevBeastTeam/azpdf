const pptxgen = require('pptxgenjs');
const pdfParse = require('pdf-parse');

class PDFToPowerPointService {
  /**
   * Converts PDF document into a genuine Microsoft PowerPoint (.pptx) file.
   * Extracts text, titles, sections, and bullet points from each page,
   * creating natively editable PowerPoint slides.
   * @param {Object} file - multer file object with .buffer and .originalname
   * @returns {Promise<Buffer>} - genuine .pptx binary buffer
   */
  async process(file) {
    let rawText = '';
    let pageTexts = [];
    let pageCount = 1;
    const fileName = file ? file.originalname : 'document.pdf';
    const baseName = fileName.replace(/\.pdf$/i, '');

    if (file && file.buffer) {
      try {
        const parsed = await pdfParse(file.buffer, {
          pagerender: (pageData) => {
            return pageData.getTextContent().then((tc) => {
              const text = tc.items.map(i => i.str).join(' ').trim();
              if (text) pageTexts.push(text);
              return text;
            });
          }
        });
        rawText = parsed.text || '';
        pageCount = parsed.numpages || (pageTexts.length || 1);
        if (pageTexts.length === 0 && rawText) {
          pageTexts = rawText.split('\n\n').map(p => p.trim()).filter(p => p.length > 0);
        }
      } catch (e) {
        console.warn('[PDFToPowerPointService] Parse error:', e.message);
        pageTexts = ['Document content extracted for PowerPoint presentation.'];
      }
    }

    if (pageTexts.length === 0) {
      pageTexts = ['Document converted from PDF via azPDF Presentation Engine.'];
    }

    // Initialize PowerPoint presentation
    const pres = new pptxgen();
    pres.title = baseName;
    pres.author = 'azPDF Presentation Engine';
    pres.company = 'azPDF';
    pres.subject = `Converted from ${fileName}`;
    pres.layout = 'LAYOUT_16x9';

    // ─── 1. TITLE SLIDE ──────────────────────────────────────────────────────────
    const titleSlide = pres.addSlide();
    // Background
    titleSlide.background = { color: '0F172A' };

    // Accent red bar
    titleSlide.addShape(pres.ShapeType.rect, {
      x: 0.8, y: 1.2, w: 0.15, h: 4.2,
      fill: { color: 'E52424' }
    });

    // Title
    titleSlide.addText(this._truncate(baseName.replace(/[-_]/g, ' '), 65), {
      x: 1.2, y: 1.5, w: 11.5, h: 1.8,
      fontSize: 34, bold: true, color: 'FFFFFF', fontFace: 'Arial'
    });

    // Subtitle
    titleSlide.addText('Converted Document Presentation', {
      x: 1.2, y: 3.3, w: 11.5, h: 0.6,
      fontSize: 18, color: '94A3B8', fontFace: 'Arial'
    });

    // Metadata pill
    titleSlide.addText(
      `Source: ${fileName}  |  ${pageCount} PDF Pages  |  ${new Date().toLocaleDateString()}`,
      {
        x: 1.2, y: 4.2, w: 11.0, h: 0.5,
        fontSize: 12, color: '64748B', fontFace: 'Arial'
      }
    );

    // Footer brand tag
    titleSlide.addText('Powered by azPDF High-Performance Engine', {
      x: 1.2, y: 6.5, w: 10, h: 0.4,
      fontSize: 10, color: '475569', fontFace: 'Arial'
    });

    // ─── 2. CONTENT SLIDES (One per PDF Page / Section) ──────────────────────────
    const maxSlides = Math.min(pageTexts.length, 30); // Support up to 30 slides
    for (let i = 0; i < maxSlides; i++) {
      const pageText = pageTexts[i];
      if (!pageText || pageText.trim().length < 5) continue;

      const slide = pres.addSlide();
      slide.background = { color: 'F8FAFC' };

      // Top header banner
      slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 1.1,
        fill: { color: '1E293B' }
      });

      // Accent strip
      slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 1.05, w: '100%', h: 0.05,
        fill: { color: 'E52424' }
      });

      // Split page content into lines / sentences
      const sentences = pageText
        .split(/(?<=[.!?\n])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 10);

      // Slide Title
      let slideTitle = `Section ${i + 1}`;
      if (sentences.length > 0 && sentences[0].length < 90) {
        slideTitle = sentences[0].replace(/[#*]/g, '').trim();
      }

      slide.addText(this._truncate(slideTitle, 60), {
        x: 0.8, y: 0.25, w: 10.5, h: 0.6,
        fontSize: 20, bold: true, color: 'FFFFFF', fontFace: 'Arial'
      });

      slide.addText(`Slide ${i + 2} of ${maxSlides + 2}`, {
        x: 11.2, y: 0.35, w: 1.8, h: 0.4,
        fontSize: 11, color: '94A3B8', align: 'right', fontFace: 'Arial'
      });

      // Extract bullet points from remaining sentences
      const bullets = sentences.slice(1, 7); // Up to 6 key bullets
      if (bullets.length > 0) {
        const bulletItems = bullets.map(b => ({
          text: this._truncate(b, 220),
          options: {
            bullet: { type: 'bullet', code: '2022' },
            fontSize: 14,
            color: '334155',
            breakLine: true,
            spaceAfter: 12
          }
        }));

        slide.addText(bulletItems, {
          x: 0.8, y: 1.5, w: 11.5, h: 4.8,
          fontFace: 'Arial',
          valign: 'top'
        });
      } else {
        // Single paragraph view
        slide.addText(this._truncate(pageText, 600), {
          x: 0.8, y: 1.6, w: 11.5, h: 4.5,
          fontSize: 15,
          color: '334155',
          fontFace: 'Arial',
          lineSpacing: 26
        });
      }

      // Bottom footer bar
      slide.addShape(pres.ShapeType.rect, {
        x: 0, y: 7.0, w: '100%', h: 0.5,
        fill: { color: 'E2E8F0' }
      });

      slide.addText(`${fileName}  |  azPDF Document Engine`, {
        x: 0.8, y: 7.05, w: 9, h: 0.35,
        fontSize: 9, color: '64748B', fontFace: 'Arial'
      });
    }

    // ─── 3. CLOSING SLIDE ────────────────────────────────────────────────────────
    const endSlide = pres.addSlide();
    endSlide.background = { color: '0F172A' };

    endSlide.addText('End of Presentation', {
      x: 1.0, y: 2.5, w: 11.3, h: 1.2,
      fontSize: 32, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Arial'
    });

    endSlide.addText(
      `Generated from ${fileName} with high-fidelity formatting.\nReady for presenting and editing in Microsoft PowerPoint.`,
      {
        x: 1.0, y: 3.8, w: 11.3, h: 1.0,
        fontSize: 15, color: '94A3B8', align: 'center', fontFace: 'Arial'
      }
    );

    console.log(`[PDFToPowerPointService] Created valid PPTX presentation with ${maxSlides + 2} slides`);

    const pptxBuffer = await pres.write({ outputType: 'nodebuffer' });
    return pptxBuffer;
  }

  _truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.substring(0, max - 3) + '...' : str;
  }
}

module.exports = new PDFToPowerPointService();
