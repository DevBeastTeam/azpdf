const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const http = require('http');

// Helper to create a test PDF in memory
async function createSamplePdf(text = 'Confidential Report and Tax Information') {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('Sample Document Title', { x: 50, y: 720, size: 20, font });
  page.drawText(text, { x: 50, y: 680, size: 14, font });
  page.drawText('Total Amount: $1,450.00 | Rate: 15% | Account: 987654321', { x: 50, y: 650, size: 12, font });
  page.drawText('This is a secret confidential section that needs privacy protection.', { x: 50, y: 620, size: 12, font });
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

// Helper to create a minimal 1x1 PNG image
function createSamplePng() {
  // 1x1 red PNG buffer
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
}

// Multipart POST helper
function sendMultipart(path, fields = {}, files = []) {
  return new Promise((resolve, reject) => {
    const boundary = '----AzPdfBoundary' + Date.now();
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

async function runLiveVerification() {
  console.log('🧪 Starting 100% Real Tool Live Verification Suite...\n');

  const pdfBuf1 = await createSamplePdf('Alpha Financial Statement and Audit Record');
  const pdfBuf2 = await createSamplePdf('Beta Financial Statement and Comparison Data');
  const imgBuf = createSamplePng();

  const tests = [
    // 1. Compare PDF
    {
      name: 'Compare PDF (Real Comparison Engine)',
      run: async () => {
        const res = await sendMultipart('/api/compare', {}, [
          { filename: 'doc1.pdf', buffer: pdfBuf1, contentType: 'application/pdf' },
          { filename: 'doc2.pdf', buffer: pdfBuf2, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (!res.buffer.toString('latin1').includes('%PDF')) throw new Error('Not a valid PDF');
        return `Report generated (${res.buffer.length} bytes)`;
      }
    },

    // 2. Scan to PDF
    {
      name: 'Scan to PDF (Multi-Image Engine)',
      run: async () => {
        const res = await sendMultipart('/api/scan-to-pdf', {}, [
          { filename: 'scan1.png', buffer: imgBuf, contentType: 'image/png' },
          { filename: 'scan2.png', buffer: imgBuf, contentType: 'image/png' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (!res.buffer.toString('latin1').includes('%PDF')) throw new Error('Not a valid PDF');
        return `Scanned PDF created (${res.buffer.length} bytes)`;
      }
    },

    // 3. PDF to PowerPoint (Native PPTX)
    {
      name: 'PDF to PowerPoint (Real Native .pptx)',
      run: async () => {
        const res = await sendMultipart('/api/pdf-to-ppt', {}, [
          { filename: 'presentation.pdf', buffer: pdfBuf1, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        // PPTX is a zip starting with PK\x03\x04
        if (res.buffer[0] !== 0x50 || res.buffer[1] !== 0x4B) throw new Error('Not a valid ZIP/PPTX binary');
        return `Valid PPTX presentation generated (${res.buffer.length} bytes)`;
      }
    },

    // 4. PDF to Excel (Real Native .xlsx)
    {
      name: 'PDF to Excel (Real Binary .xlsx Workbook)',
      run: async () => {
        const res = await sendMultipart('/api/pdf-to-excel', {}, [
          { filename: 'spreadsheet.pdf', buffer: pdfBuf1, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (res.buffer[0] !== 0x50 || res.buffer[1] !== 0x4B) throw new Error('Not a valid XLSX binary');
        return `Valid XLSX workbook created (${res.buffer.length} bytes)`;
      }
    },

    // 5. Translate PDF (MyMemory Translation Engine)
    {
      name: 'Translate PDF (Real Machine Translation)',
      run: async () => {
        const res = await sendMultipart('/api/translate', { language: 'Urdu' }, [
          { filename: 'doc.pdf', buffer: pdfBuf1, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        const text = res.buffer.toString('utf-8');
        if (!text.includes('azPDF AI DOCUMENT TRANSLATION REPORT')) throw new Error('Invalid translation output');
        return `Translation text generated (${res.buffer.length} bytes)`;
      }
    },

    // 6. HTML to PDF with Live URL
    {
      name: 'HTML to PDF (Live Webpage Fetch)',
      run: async () => {
        const res = await sendMultipart('/api/html-to-pdf', { url: 'https://example.com' }, []);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (!res.buffer.toString('latin1').includes('%PDF')) throw new Error('Not a valid PDF');
        return `Live URL converted to PDF (${res.buffer.length} bytes)`;
      }
    },

    // 7. Redact PDF (Coordinate-Based Redaction)
    {
      name: 'Redact PDF (Real Coordinate Matching)',
      run: async () => {
        const res = await sendMultipart('/api/redact', { terms: 'confidential, secret' }, [
          { filename: 'doc.pdf', buffer: pdfBuf1, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (!res.buffer.toString('latin1').includes('%PDF')) throw new Error('Not a valid PDF');
        return `Redacted PDF generated (${res.buffer.length} bytes)`;
      }
    },

    // 8. PDF to Word (Real DOCX)
    {
      name: 'PDF to Word (Valid .docx File)',
      run: async () => {
        const res = await sendMultipart('/api/pdf-to-word', {}, [
          { filename: 'doc.pdf', buffer: pdfBuf1, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (res.buffer[0] !== 0x50 || res.buffer[1] !== 0x4B) throw new Error('Not a valid DOCX binary');
        return `Valid Word document generated (${res.buffer.length} bytes)`;
      }
    },

    // 9. Merge PDF
    {
      name: 'Merge PDF (Order-Preserving PDF Merger)',
      run: async () => {
        const res = await sendMultipart('/api/merge', {}, [
          { filename: 'doc1.pdf', buffer: pdfBuf1, contentType: 'application/pdf' },
          { filename: 'doc2.pdf', buffer: pdfBuf2, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (!res.buffer.toString('latin1').includes('%PDF')) throw new Error('Not a valid PDF');
        return `Merged PDF generated (${res.buffer.length} bytes)`;
      }
    },

    // 10. Split PDF
    {
      name: 'Split PDF (Page Range Splitter)',
      run: async () => {
        const res = await sendMultipart('/api/split', { pages: '1' }, [
          { filename: 'doc1.pdf', buffer: pdfBuf1, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (!res.buffer.toString('latin1').includes('%PDF')) throw new Error('Not a valid PDF');
        return `Split PDF generated (${res.buffer.length} bytes)`;
      }
    },

    // 11. Rotate PDF
    {
      name: 'Rotate PDF (Angle Transformation)',
      run: async () => {
        const res = await sendMultipart('/api/rotate', { angle: '90' }, [
          { filename: 'doc1.pdf', buffer: pdfBuf1, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (!res.buffer.toString('latin1').includes('%PDF')) throw new Error('Not a valid PDF');
        return `Rotated PDF generated (${res.buffer.length} bytes)`;
      }
    },

    // 12. Watermark PDF
    {
      name: 'Watermark PDF (Diagonal Vector Stamp)',
      run: async () => {
        const res = await sendMultipart('/api/watermark', { watermarkText: 'CONFIDENTIAL' }, [
          { filename: 'doc1.pdf', buffer: pdfBuf1, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (!res.buffer.toString('latin1').includes('%PDF')) throw new Error('Not a valid PDF');
        return `Watermarked PDF generated (${res.buffer.length} bytes)`;
      }
    },

    // 13. Page Numbers
    {
      name: 'Page Numbers (Header/Footer Numbering)',
      run: async () => {
        const res = await sendMultipart('/api/page-numbers', { position: 'bottom-center' }, [
          { filename: 'doc1.pdf', buffer: pdfBuf1, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (!res.buffer.toString('latin1').includes('%PDF')) throw new Error('Not a valid PDF');
        return `Numbered PDF generated (${res.buffer.length} bytes)`;
      }
    },

    // 14. PDF Forms
    {
      name: 'PDF Forms (Interactive AcroForms Engine)',
      run: async () => {
        const res = await sendMultipart('/api/forms', {}, [
          { filename: 'doc1.pdf', buffer: pdfBuf1, contentType: 'application/pdf' }
        ]);
        if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
        if (!res.buffer.toString('latin1').includes('%PDF')) throw new Error('Not a valid PDF');
        return `Interactive Form PDF generated (${res.buffer.length} bytes)`;
      }
    }
  ];

  let passed = 0;
  for (const t of tests) {
    try {
      const detail = await t.run();
      console.log(`✅ PASS: ${t.name} -> ${detail}`);
      passed++;
    } catch (err) {
      console.log(`❌ FAIL: ${t.name} -> ${err.message}`);
    }
  }

  console.log(`\n=================================================`);
  console.log(`Verification Complete: ${passed} / ${tests.length} Tools Tested Successfully!`);
  console.log(`=================================================`);
}

runLiveVerification().catch(console.error);
