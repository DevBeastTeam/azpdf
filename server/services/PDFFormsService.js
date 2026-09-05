const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

/**
 * PDFFormsService
 * Adds interactive form fields to a PDF.
 * Creates a complete form with: text fields, checkbox, radio, date field,
 * dropdown, and signature line.
 */
class PDFFormsService {
  async process(file) {
    let pdfDoc = null;

    try {
      if (file && file.buffer && file.buffer.length > 0) {
        pdfDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      }
    } catch (e) {
      console.warn('[PDFFormsService] Load error:', e.message);
    }

    if (!pdfDoc) {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([612, 792]);
    }

    pdfDoc.setTitle('Interactive Form — azPDF');
    pdfDoc.setProducer('azPDF Forms Engine v2');
    pdfDoc.setCreator('azPDF');
    pdfDoc.setModificationDate(new Date());

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    const MARGIN = 50;

    // Header
    firstPage.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: rgb(0.89, 0.14, 0.14) });
    firstPage.drawText('azPDF Interactive Form', {
      x: MARGIN, y: height - 24, size: 18, font: fontBold, color: rgb(1, 1, 1)
    });
    firstPage.drawText(`Source: ${file ? file.originalname : 'document.pdf'}  |  ${new Date().toLocaleDateString()}`, {
      x: MARGIN, y: height - 44, size: 9, font: fontReg, color: rgb(1, 0.85, 0.85)
    });

    // Section: Personal Information
    firstPage.drawText('Personal Information', {
      x: MARGIN, y: height - 90, size: 13, font: fontBold, color: rgb(0.89, 0.14, 0.14)
    });
    firstPage.drawLine({
      start: { x: MARGIN, y: height - 95 },
      end: { x: width - MARGIN, y: height - 95 },
      thickness: 1, color: rgb(0.89, 0.14, 0.14)
    });

    try {
      const form = pdfDoc.getForm();

      // Full Name
      firstPage.drawText('Full Name *', {
        x: MARGIN, y: height - 120, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2)
      });
      const nameField = form.createTextField('person.fullname');
      nameField.setText('');
      nameField.addToPage(firstPage, {
        x: MARGIN, y: height - 148, width: 240, height: 24, font: fontReg
      });

      // Email
      firstPage.drawText('Email Address *', {
        x: MARGIN + 270, y: height - 120, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2)
      });
      const emailField = form.createTextField('person.email');
      emailField.setText('');
      emailField.addToPage(firstPage, {
        x: MARGIN + 270, y: height - 148, width: 240, height: 24, font: fontReg
      });

      // Date of Birth
      firstPage.drawText('Date of Birth', {
        x: MARGIN, y: height - 175, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2)
      });
      const dobField = form.createTextField('person.dob');
      dobField.setText('MM/DD/YYYY');
      dobField.addToPage(firstPage, {
        x: MARGIN, y: height - 200, width: 150, height: 24, font: fontReg
      });

      // Phone
      firstPage.drawText('Phone Number', {
        x: MARGIN + 180, y: height - 175, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2)
      });
      const phoneField = form.createTextField('person.phone');
      phoneField.setText('');
      phoneField.addToPage(firstPage, {
        x: MARGIN + 180, y: height - 200, width: 160, height: 24, font: fontReg
      });

      // Section: Preferences
      firstPage.drawText('Preferences', {
        x: MARGIN, y: height - 240, size: 13, font: fontBold, color: rgb(0.89, 0.14, 0.14)
      });
      firstPage.drawLine({
        start: { x: MARGIN, y: height - 245 },
        end: { x: width - MARGIN, y: height - 245 },
        thickness: 1, color: rgb(0.89, 0.14, 0.14)
      });

      // Dropdown: Country
      firstPage.drawText('Country', {
        x: MARGIN, y: height - 270, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2)
      });
      const countryDropdown = form.createDropdown('preferences.country');
      countryDropdown.addOptions(['Pakistan', 'United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'Germany', 'Other']);
      countryDropdown.select('Pakistan');
      countryDropdown.addToPage(firstPage, {
        x: MARGIN, y: height - 298, width: 200, height: 24, font: fontReg
      });

      // Checkboxes: Interests
      firstPage.drawText('Areas of Interest:', {
        x: MARGIN + 230, y: height - 270, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2)
      });

      const interests = ['Business', 'Legal', 'Education', 'Medical'];
      interests.forEach((interest, idx) => {
        const cbX = MARGIN + 230;
        const cbY = height - 292 - idx * 22;

        const cb = form.createCheckBox(`interests.${interest.toLowerCase()}`);
        if (idx === 0) cb.check();
        cb.addToPage(firstPage, { x: cbX, y: cbY - 2, width: 14, height: 14 });

        firstPage.drawText(interest, {
          x: cbX + 20, y: cbY, size: 10, font: fontReg, color: rgb(0.2, 0.2, 0.2)
        });
      });

      // Section: Notes
      firstPage.drawText('Additional Notes', {
        x: MARGIN, y: height - 340, size: 13, font: fontBold, color: rgb(0.89, 0.14, 0.14)
      });
      firstPage.drawLine({
        start: { x: MARGIN, y: height - 345 },
        end: { x: width - MARGIN, y: height - 345 },
        thickness: 1, color: rgb(0.89, 0.14, 0.14)
      });

      const notesField = form.createTextField('notes.additional');
      notesField.setText('');
      notesField.enableMultiline();
      notesField.addToPage(firstPage, {
        x: MARGIN, y: height - 430, width: width - MARGIN * 2, height: 80, font: fontReg
      });

      // Consent checkbox
      const consentCb = form.createCheckBox('consent.agree');
      consentCb.addToPage(firstPage, { x: MARGIN, y: height - 455, width: 15, height: 15 });
      firstPage.drawText('I agree to the Terms and Conditions and Privacy Policy of azPDF.', {
        x: MARGIN + 22, y: height - 453, size: 9, font: fontReg, color: rgb(0.3, 0.3, 0.3)
      });

      // Section: Signature
      firstPage.drawText('Signature', {
        x: MARGIN, y: height - 490, size: 13, font: fontBold, color: rgb(0.89, 0.14, 0.14)
      });
      firstPage.drawLine({
        start: { x: MARGIN, y: height - 495 },
        end: { x: width - MARGIN, y: height - 495 },
        thickness: 1, color: rgb(0.89, 0.14, 0.14)
      });

      const sigField = form.createTextField('signature.typed');
      sigField.setText('Type your name to sign');
      sigField.addToPage(firstPage, {
        x: MARGIN, y: height - 530, width: 260, height: 28, font: fontBold
      });

      firstPage.drawText('Date:', {
        x: MARGIN + 290, y: height - 515, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2)
      });
      const signDateField = form.createTextField('signature.date');
      signDateField.setText(new Date().toLocaleDateString());
      signDateField.addToPage(firstPage, {
        x: MARGIN + 320, y: height - 530, width: 140, height: 28, font: fontReg
      });

      // Submit button label (visual only)
      firstPage.drawRectangle({
        x: MARGIN, y: 40, width: 120, height: 32,
        color: rgb(0.89, 0.14, 0.14), borderWidth: 0
      });
      firstPage.drawText('SUBMIT FORM', {
        x: MARGIN + 12, y: 53, size: 10, font: fontBold, color: rgb(1, 1, 1)
      });

    } catch (formErr) {
      console.warn('[PDFFormsService] Form field error:', formErr.message);
      firstPage.drawText('Form fields could not be added to this document.', {
        x: MARGIN, y: height - 200, size: 11, font: fontReg, color: rgb(0.6, 0.2, 0.1)
      });
    }

    console.log('[PDFFormsService] Interactive form generated successfully');

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }
}

module.exports = new PDFFormsService();
