const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { URL } = require('url');

class HTMLToPDFService {
  isPrivateUrl(urlString) {
    try {
      const parsed = new URL(urlString);
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return true;
      if (host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('169.254.')) return true;
      if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  async process(file, urlParam) {
    let htmlString = '<html><body><h1>azPDF HTML to PDF</h1></body></html>';
    
    if (urlParam && this.isPrivateUrl(urlParam)) {
      throw new Error('Security Error: Access to internal / private network URLs is restricted (SSRF Protection).');
    }

    if (file && file.buffer) {
      htmlString = file.buffer.toString('utf-8');
    }

    const titleMatch = htmlString.match(/<title>([^<]+)<\/title>/i) || htmlString.match(/<h1>([^<]+)<\/h1>/i);
    const pageTitle = titleMatch ? titleMatch[1] : 'Webpage Layout';

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText('HTML to PDF Conversion Report', { x: 50, y: 720, size: 24, font: fontBold, color: rgb(0.1, 0.5, 0.8) });
    page.drawText(`Source HTML Size: ${htmlString.length} bytes`, { x: 50, y: 690, size: 12, font: fontRegular });
    page.drawText(`Extracted Title: ${pageTitle}`, { x: 50, y: 660, size: 14, font: fontBold });

    page.drawRectangle({
      x: 50, y: 100, width: 512, height: 520,
      color: rgb(0.99, 0.99, 0.99),
      borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1
    });

    const lines = htmlString.replace(/<[^>]*>/g, ' ').replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim().substring(0, 500);
    const words = lines.split(' ');
    let currentLine = '';
    let yPos = 520;
    for (const word of words) {
      if (currentLine.length + word.length > 70) {
        page.drawText(currentLine, { x: 70, y: yPos, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
        currentLine = word + ' ';
        yPos -= 15;
        if (yPos < 120) break;
      } else {
        currentLine += word + ' ';
      }
    }
    if (yPos >= 120 && currentLine) {
      page.drawText(currentLine, { x: 70, y: yPos, size: 10, font: fontRegular });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

module.exports = new HTMLToPDFService();
