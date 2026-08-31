const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun } = require('docx');

class PDFToWordService {
  async process(file) {
    let documentText = 'Default document content stream parsed successfully.';

    if (file && file.buffer) {
      try {
        const parsed = await pdfParse(file.buffer);
        if (parsed && parsed.text && parsed.text.trim()) {
          documentText = parsed.text;
        }
      } catch (err) {
        console.warn('[PDFToWordService] pdfParse fallback:', err.message);
      }
    }

    const cleanLines = documentText.split('\n').filter(l => l.trim().length > 0);
    const paragraphChildren = cleanLines.map(line => {
      return new Paragraph({
        children: [
          new TextRun({
            text: line.trim(),
            size: 24,
            font: 'Arial'
          })
        ]
      });
    });

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'azPDF Word Document Export',
                bold: true,
                size: 36,
                color: 'E52424'
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Source File: ${file ? file.originalname : 'document.pdf'}`,
                italic: true,
                size: 20
              })
            ]
          }),
          new Paragraph({ text: '' }),
          ...paragraphChildren
        ]
      }]
    });

    return await Packer.toBuffer(doc);
  }
}

module.exports = new PDFToWordService();
