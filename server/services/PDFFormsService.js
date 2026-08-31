const { PDFDocument, StandardFonts } = require('pdf-lib');

class PDFFormsService {
  async process(file) {
    let pdfDoc = null;
    try {
      if (file && file.buffer) {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      }
    } catch (e) {}

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([612, 792]);
    }

    try {
      const form = pdfDoc.getForm();
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      if (firstPage) {
        const nameField = form.createTextField('user.fullname');
        nameField.setText('Enter your full name');
        nameField.addToPage(firstPage, { x: 50, y: 200, width: 250, height: 25, font });

        const subscribeCheckbox = form.createCheckBox('user.subscribe');
        subscribeCheckbox.check();
        subscribeCheckbox.addToPage(firstPage, { x: 50, y: 150, width: 15, height: 15 });

        firstPage.drawText('Check here to subscribe to newsletter updates', { x: 75, y: 153, size: 10, font });
      }
    } catch (err) {
      console.warn('[PDFFormsService] Form generation warning:', err.message);
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFFormsService();
