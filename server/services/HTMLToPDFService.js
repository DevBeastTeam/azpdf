const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { URL } = require('url');

/**
 * HTMLToPDFService
 * Converts HTML files or webpage content to PDF.
 * Parses HTML tags, renders headings, paragraphs, lists, and links
 * with proper styling in the PDF output.
 */
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
    if (urlParam && this.isPrivateUrl(urlParam)) {
      throw new Error('Security Error: Access to internal/private network URLs is restricted (SSRF Protection).');
    }

    let htmlString = '<html><body><h1>azPDF HTML to PDF</h1><p>No content provided.</p></body></html>';
    let sourceInfo = 'Default template';

    if (file && file.buffer) {
      htmlString = file.buffer.toString('utf-8');
      sourceInfo = file.originalname;
    } else if (urlParam) {
      sourceInfo = urlParam;
      // Cannot fetch URL server-side without puppeteer/fetch, note it in output
      htmlString = `<html><body><h1>URL Conversion</h1><p>Source: ${urlParam}</p><p>Note: URL-based conversion requires browser rendering.</p></body></html>`;
    }

    // Parse HTML elements
    const elements = this._parseHTML(htmlString);
    const rawTitle = this._extract(htmlString, 'title') || this._extract(htmlString, 'h1') || 'HTML Document';
    const cleanText = (str) => String(str || '').replace(/[—–]/g, '-').replace(/[→⇒]/g, '->').replace(/[^\x20-\x7E\t\r\n]/g, ' ');
    const pageTitle = cleanText(rawTitle);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(pageTitle);
    pdfDoc.setProducer('azPDF HTML->PDF Engine v2');
    pdfDoc.setCreator('azPDF');
    pdfDoc.setSubject(`Converted from HTML: ${cleanText(sourceInfo)}`);
    pdfDoc.setCreationDate(new Date());

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const PAGE_W = 612, PAGE_H = 792;
    const MARGIN = 50;
    const MAX_W = PAGE_W - MARGIN * 2;

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);

    // Header bar
    page.drawRectangle({ x: 0, y: PAGE_H - 55, width: PAGE_W, height: 55, color: rgb(0.06, 0.12, 0.28) });
    page.drawText('azPDF - HTML to PDF Conversion', {
      x: MARGIN, y: PAGE_H - 24, size: 15, font: fontBold, color: rgb(1, 1, 1)
    });
    page.drawText(cleanText(`Source: ${sourceInfo}  |  ${new Date().toLocaleDateString()}  |  Elements: ${elements.length}`), {
      x: MARGIN, y: PAGE_H - 44, size: 8.5, font: fontReg, color: rgb(0.7, 0.8, 1)
    });

    let curY = PAGE_H - 75;

    const addPage = () => {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      page.drawRectangle({ x: 0, y: PAGE_H - 28, width: PAGE_W, height: 28, color: rgb(0.96, 0.96, 0.98) });
      page.drawText(`${pageTitle} (continued)`, {
        x: MARGIN, y: PAGE_H - 18, size: 9, font: fontBold, color: rgb(0.4, 0.4, 0.5)
      });
      curY = PAGE_H - 45;
    };

    const wrapLines = (text, font, size, maxW) => {
      const words = text.split(' ');
      const lines = [];
      let cur = '';
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (font.widthOfTextAtSize(test, size) <= maxW) {
          cur = test;
        } else {
          if (cur) lines.push(cur);
          cur = w;
        }
      }
      if (cur) lines.push(cur);
      return lines;
    };

    for (const el of elements) {
      if (curY < 60) addPage();

      switch (el.type) {
        case 'h1': {
          curY -= 8;
          const wrapped = wrapLines(cleanText(el.text), fontBold, 18, MAX_W);
          wrapped.forEach(line => {
            if (curY < 60) addPage();
            page.drawText(line, { x: MARGIN, y: curY, size: 18, font: fontBold, color: rgb(0.06, 0.12, 0.28) });
            curY -= 24;
          });
          // Underline
          page.drawLine({ start: { x: MARGIN, y: curY + 6 }, end: { x: PAGE_W - MARGIN, y: curY + 6 }, thickness: 1.5, color: rgb(0.06, 0.12, 0.28) });
          curY -= 10;
          break;
        }
        case 'h2': {
          curY -= 6;
          const wrapped = wrapLines(cleanText(el.text), fontBold, 14, MAX_W);
          wrapped.forEach(line => {
            if (curY < 60) addPage();
            page.drawText(line, { x: MARGIN, y: curY, size: 14, font: fontBold, color: rgb(0.15, 0.3, 0.6) });
            curY -= 20;
          });
          curY -= 4;
          break;
        }
        case 'h3': {
          curY -= 4;
          const wrapped = wrapLines(cleanText(el.text), fontBold, 12, MAX_W);
          wrapped.forEach(line => {
            if (curY < 60) addPage();
            page.drawText(line, { x: MARGIN, y: curY, size: 12, font: fontBold, color: rgb(0.2, 0.35, 0.6) });
            curY -= 17;
          });
          break;
        }
        case 'li': {
          page.drawCircle({ x: MARGIN + 6, y: curY + 4, size: 3, color: rgb(0.89, 0.14, 0.14) });
          const wrapped = wrapLines(cleanText(el.text), fontReg, 10.5, MAX_W - 20);
          wrapped.forEach((line, i) => {
            if (curY < 60) addPage();
            page.drawText(line, { x: MARGIN + 16, y: curY, size: 10.5, font: fontReg, color: rgb(0.1, 0.1, 0.2) });
            if (i < wrapped.length - 1) curY -= 15;
          });
          curY -= 16;
          break;
        }
        case 'blockquote': {
          page.drawRectangle({ x: MARGIN - 2, y: curY - el.text.split(' ').length * 0.2, width: 3, height: 18, color: rgb(0.6, 0.6, 0.8) });
          const wrapped = wrapLines(cleanText(el.text), fontReg, 10, MAX_W - 18);
          wrapped.forEach(line => {
            if (curY < 60) addPage();
            page.drawText(line, { x: MARGIN + 10, y: curY, size: 10, font: fontReg, color: rgb(0.35, 0.35, 0.5) });
            curY -= 14;
          });
          curY -= 4;
          break;
        }
        case 'hr': {
          if (curY < 70) addPage();
          page.drawLine({ start: { x: MARGIN, y: curY }, end: { x: PAGE_W - MARGIN, y: curY }, thickness: 0.75, color: rgb(0.75, 0.75, 0.8) });
          curY -= 14;
          break;
        }
        default: { // p, div, span, etc.
          if (!el.text.trim()) break;
          const wrapped = wrapLines(cleanText(el.text), fontReg, 11, MAX_W);
          wrapped.forEach(line => {
            if (curY < 60) addPage();
            page.drawText(line, { x: MARGIN, y: curY, size: 11, font: fontReg, color: rgb(0.1, 0.1, 0.15) });
            curY -= 16;
          });
          curY -= 6;
        }
      }
    }

    // Footer on all pages
    const totalPages = pdfDoc.getPageCount();
    pdfDoc.getPages().forEach((pg, i) => {
      const { width, height } = pg.getSize();
      pg.drawRectangle({ x: 0, y: 0, width, height: 22, color: rgb(0.95, 0.95, 0.97) });
      pg.drawText(
        cleanText(`azPDF HTML->PDF Engine  |  ${sourceInfo}  |  Page ${i + 1}/${totalPages}  |  ${new Date().toLocaleDateString()}`),
        { x: MARGIN, y: 7, size: 7, font: fontReg, color: rgb(0.5, 0.5, 0.55) }
      );
    });

    console.log(`[HTMLToPDFService] Source=${sourceInfo} | Elements=${elements.length} | Pages=${totalPages}`);

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return Buffer.from(pdfBytes);
  }

  /** Parse HTML into a list of typed element objects */
  _parseHTML(html) {
    const elements = [];
    // Remove script/style blocks
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');

    const tagRe = /<(h[1-6]|p|li|blockquote|div|span|hr|br|strong|b|em|i|a)([^>]*)>([\s\S]*?)<\/\1>|<(hr|br)\s*\/?>/gi;
    let match;
    while ((match = tagRe.exec(cleaned)) !== null) {
      const tag = (match[1] || match[4] || '').toLowerCase();
      const inner = (match[3] || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      if (tag === 'hr' || tag === 'br') {
        elements.push({ type: 'hr', text: '' });
      } else if (inner.length > 0) {
        const type = /^h[1-6]$/.test(tag) ? tag : tag === 'li' ? 'li' : tag === 'blockquote' ? 'blockquote' : 'p';
        elements.push({ type, text: inner });
      }
    }
    return elements.length > 0 ? elements : [{ type: 'p', text: cleaned.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000) }];
  }

  /** Extract content of a specific tag */
  _extract(html, tag) {
    const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)<\/${tag}>`, 'i'));
    return match ? match[1].trim() : null;
  }
}

module.exports = new HTMLToPDFService();
