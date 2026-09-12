const http = require('http');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function createSamplePdf(title = 'Sample Document') {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(title, { x: 50, y: 700, size: 18, font });
  page.drawText('This is a test document for live backend verification.', { x: 50, y: 660, size: 12, font });
  page.drawText('Confidential keyword to redact: secret data 12345.', { x: 50, y: 630, size: 12, font });
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

function createSamplePng() {
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
}

function sendMultipart(path, fields = {}, files = []) {
  return new Promise((resolve, reject) => {
    const boundary = '----VerifyBoundary' + Date.now();
    const parts = [];

    for (const [key, val] of Object.entries(fields)) {
      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`
      ));
    }

    for (const file of files) {
      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.field || 'files'}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType || 'application/octet-stream'}\r\n\r\n`
      ));
      parts.push(file.buffer);
      parts.push(Buffer.from('\r\n'));
    }

    parts.push(Buffer.from(`--${boundary}--\r\n`));
    const fullBody = Buffer.concat(parts);

    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length
      }
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer: Buffer.concat(chunks)
        });
      });
    });

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function run() {
  console.log('Testing all 32 PDF Processing Endpoints...');
  const pdf1 = await createSamplePdf('Doc 1');
  const pdf2 = await createSamplePdf('Doc 2');
  const png = createSamplePng();

  const endpoints = [
    { name: 'merge', path: '/api/merge', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }, { filename: '2.pdf', buffer: pdf2 }] },
    { name: 'split', path: '/api/split', fields: { pages: '1' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'compress', path: '/api/compress', fields: { compression: 'recommended' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'jpg-to-pdf', path: '/api/jpg-to-pdf', fields: {}, files: [{ filename: 'img.png', buffer: png, contentType: 'image/png' }] },
    { name: 'pdf-to-jpg', path: '/api/pdf-to-jpg', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'rotate', path: '/api/rotate', fields: { angle: '90' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'watermark', path: '/api/watermark', fields: { text: 'SAMPLE' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'protect', path: '/api/protect', fields: { password: '123' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'unlock', path: '/api/unlock', fields: { password: '123' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'pdf-to-txt', path: '/api/pdf-to-txt', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'pdf-to-word', path: '/api/pdf-to-word', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'pdf-to-ppt', path: '/api/pdf-to-ppt', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'pdf-to-excel', path: '/api/pdf-to-excel', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'word-to-pdf', path: '/api/word-to-pdf', fields: {}, files: [{ filename: 'doc.docx', buffer: Buffer.from('fake docx content') }] },
    { name: 'ppt-to-pdf', path: '/api/ppt-to-pdf', fields: {}, files: [{ filename: 'pres.pptx', buffer: Buffer.from('fake pptx') }] },
    { name: 'excel-to-pdf', path: '/api/excel-to-pdf', fields: {}, files: [{ filename: 'sheet.xlsx', buffer: Buffer.from('fake xlsx') }] },
    { name: 'organize', path: '/api/organize', fields: { pageOrder: '1' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'ai-summarizer', path: '/api/ai-summarizer', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'translate', path: '/api/translate', fields: { language: 'Urdu' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'pdf-to-markdown', path: '/api/pdf-to-markdown', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'edit-pdf', path: '/api/edit-pdf', fields: { annotation: 'Approved' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'sign-pdf', path: '/api/sign-pdf', fields: { signer: 'Admin' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'html-to-pdf', path: '/api/html-to-pdf', fields: { html: '<h1>Hello World</h1>' }, files: [] },
    { name: 'pdf-to-pdfa', path: '/api/pdf-to-pdfa', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'repair', path: '/api/repair', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'page-numbers', path: '/api/page-numbers', fields: { position: 'bottom-center' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'scan-to-pdf', path: '/api/scan-to-pdf', fields: {}, files: [{ filename: 'scan.png', buffer: png, contentType: 'image/png' }] },
    { name: 'ocr', path: '/api/ocr', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'compare', path: '/api/compare', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }, { filename: '2.pdf', buffer: pdf2 }] },
    { name: 'redact', path: '/api/redact', fields: { terms: 'secret' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'crop', path: '/api/crop', fields: { marginTop: '10' }, files: [{ filename: '1.pdf', buffer: pdf1 }] },
    { name: 'forms', path: '/api/forms', fields: {}, files: [{ filename: '1.pdf', buffer: pdf1 }] },
  ];

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const res = await sendMultipart(ep.path, ep.fields, ep.files);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`✅ [${res.statusCode}] ${ep.name} -> returned ${res.buffer.length} bytes`);
        passed++;
      } else {
        console.log(`❌ [${res.statusCode}] ${ep.name} -> ${res.buffer.toString('utf8').slice(0, 100)}`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ FAIL ${ep.name} -> ${e.message}`);
      failed++;
    }
  }

  console.log(`\n=================================`);
  console.log(`Total: ${endpoints.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`=================================`);
}

run();
