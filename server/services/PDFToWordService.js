const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } = require('docx');

class PDFToWordService {
  /**
   * Converts PDF to Word (.docx) with intelligent heading detection,
   * paragraph grouping, bold detection, and page-break fidelity.
   * @param {Object} file - file with .buffer and .originalname
   * @returns {Buffer} - .docx file buffer
   */
  async process(file) {
    let rawText = '';
    let pageTexts = [];
    let pageCount = 1;

    if (file && file.buffer) {
      try {
        const parsed = await pdfParse(file.buffer, {
          // Extract page-by-page
          pagerender: (pageData) => {
            return pageData.getTextContent().then((textContent) => {
              const pageText = textContent.items.map(item => item.str).join(' ');
              pageTexts.push(pageText.trim());
              return pageText;
            });
          }
        });
        rawText = parsed.text || '';
        pageCount = parsed.numpages || 1;
        if (pageTexts.length === 0 && rawText) {
          pageTexts = [rawText];
        }
      } catch (err) {
        console.warn('[PDFToWordService] Parse error:', err.message);
        rawText = 'Document content could not be extracted.';
        pageTexts = [rawText];
      }
    }

    // Build document children
    const children = [];

    // Title
    children.push(
      new Paragraph({
        text: 'azPDF — Word Document Export',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Source: ${file ? file.originalname : 'document.pdf'} | Pages: ${pageCount} | Date: ${new Date().toLocaleDateString()}`,
            italics: true,
            size: 18,
            color: '888888',
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Process each page's text
    for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
      const pageText = pageTexts[pageIdx];
      if (!pageText) continue;

      // Split into lines and group into paragraphs
      const lines = pageText.split('\n').map(l => l.trim()).filter(Boolean);
      let buffer = [];

      for (const line of lines) {
        const isHeading = this._isHeading(line);
        const isSubHeading = this._isSubHeading(line);

        if (isHeading) {
          // Flush buffer
          if (buffer.length > 0) {
            children.push(this._makeParagraph(buffer.join(' ')));
            buffer = [];
          }
          children.push(new Paragraph({
            text: line,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 }
          }));
        } else if (isSubHeading) {
          if (buffer.length > 0) {
            children.push(this._makeParagraph(buffer.join(' ')));
            buffer = [];
          }
          children.push(new Paragraph({
            text: line,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 80 }
          }));
        } else if (line.length < 4) {
          // Short line = paragraph break signal
          if (buffer.length > 0) {
            children.push(this._makeParagraph(buffer.join(' ')));
            buffer = [];
          }
        } else {
          buffer.push(line);
        }
      }

      // Flush remaining buffer
      if (buffer.length > 0) {
        children.push(this._makeParagraph(buffer.join(' ')));
        buffer = [];
      }

      // Add page break between PDF pages (except after last page)
      if (pageIdx < pageTexts.length - 1) {
        children.push(new Paragraph({
          children: [new PageBreak()],
        }));
      }
    }

    const doc = new Document({
      creator: 'azPDF Export Engine',
      title: file ? file.originalname.replace(/\.pdf$/i, '') : 'Document',
      description: `Converted from PDF by azPDF on ${new Date().toISOString()}`,
      sections: [{ children }]
    });

    return await Packer.toBuffer(doc);
  }

  /** Heuristic: all caps, short, no special chars → Heading 1 */
  _isHeading(line) {
    return (
      line.length >= 3 &&
      line.length <= 80 &&
      line === line.toUpperCase() &&
      /^[A-Z0-9\s\-:.,&]+$/.test(line)
    );
  }

  /** Heuristic: ends with colon or starts with number. → Heading 2 */
  _isSubHeading(line) {
    return (
      line.length >= 3 &&
      line.length <= 100 &&
      (line.endsWith(':') || /^\d+\.\s+[A-Z]/.test(line))
    );
  }

  /** Create a normal paragraph with proper text run */
  _makeParagraph(text) {
    const isBold = text.startsWith('**') || text.toUpperCase() === text && text.length < 60;
    return new Paragraph({
      children: [
        new TextRun({
          text: text.replace(/^\*\*|\*\*$/g, '').trim(),
          size: 24,
          bold: isBold,
          font: 'Arial',
        })
      ],
      spacing: { after: 120 }
    });
  }
}

module.exports = new PDFToWordService();
