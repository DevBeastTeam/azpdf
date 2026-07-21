const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfController = require('./controllers/pdfController');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer to use in-memory buffer storage (max 50MB per request)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'iLovePDF Node.js Backend is running!' });
});

app.post('/api/merge', upload.array('files'), pdfController.mergePdfs);
app.post('/api/split', upload.array('files'), pdfController.splitPdf);
app.post('/api/compress', upload.array('files'), pdfController.compressPdf);
app.post('/api/jpg-to-pdf', upload.array('files'), pdfController.jpgToPdf);
app.post('/api/rotate', upload.array('files'), pdfController.rotatePdf);
app.post('/api/watermark', upload.array('files'), pdfController.watermarkPdf);
app.post('/api/protect', upload.array('files'), pdfController.protectPdf);
app.post('/api/pdf-to-txt', upload.array('files'), pdfController.pdfToTxt);
app.post('/api/pdf-to-word', upload.array('files'), pdfController.pdfToTxt); // Text export fallback for word
app.post('/api/pdf-to-ppt', upload.array('files'), pdfController.pdfToPpt);
app.post('/api/pdf-to-excel', upload.array('files'), pdfController.pdfToExcel);
app.post('/api/word-to-pdf', upload.array('files'), pdfController.wordToPdf);
app.post('/api/ppt-to-pdf', upload.array('files'), pdfController.pptToPdf);
app.post('/api/excel-to-pdf', upload.array('files'), pdfController.excelToPdf);
app.post('/api/organize', upload.array('files'), pdfController.organizePdf);
app.post('/api/unlock', upload.array('files'), pdfController.unlockPdf);
app.post('/api/ai-summarizer', upload.array('files'), pdfController.aiSummarizer);
app.post('/api/translate', upload.array('files'), pdfController.translatePdf);
app.post('/api/pdf-to-markdown', upload.array('files'), pdfController.pdfToMarkdown);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
});

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`iLovePDF Node.js Backend running on http://localhost:${PORT}`);
  console.log(`=================================`);
});
