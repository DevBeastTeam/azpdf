const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfController = require('./controllers/pdfController');

const dbPath = path.join(__dirname, 'db.json');

function readDb() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read database:', err);
    return {};
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write database:', err);
  }
}

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
app.post('/api/pdf-to-jpg', upload.array('files'), pdfController.pdfToJpg);
app.post('/api/rotate', upload.array('files'), pdfController.rotatePdf);
app.post('/api/watermark', upload.array('files'), pdfController.watermarkPdf);
app.post('/api/protect', upload.array('files'), pdfController.protectPdf);
app.post('/api/pdf-to-txt', upload.array('files'), pdfController.pdfToTxt);
app.post('/api/pdf-to-word', upload.array('files'), pdfController.pdfToWord);
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

// Additional tools endpoints
app.post('/api/edit-pdf', upload.array('files'), pdfController.editPdf);
app.post('/api/sign-pdf', upload.array('files'), pdfController.signPdf);
app.post('/api/html-to-pdf', upload.array('files'), pdfController.htmlToPdf);
app.post('/api/pdf-to-pdfa', upload.array('files'), pdfController.pdfToPdfa);
app.post('/api/repair', upload.array('files'), pdfController.repairPdf);
app.post('/api/page-numbers', upload.array('files'), pdfController.pageNumbers);
app.post('/api/scan-to-pdf', upload.array('files'), pdfController.scanPdf);
app.post('/api/ocr', upload.array('files'), pdfController.ocrPdf);
app.post('/api/compare', upload.array('files'), pdfController.comparePdfs);
app.post('/api/redact', upload.array('files'), pdfController.redactPdf);
app.post('/api/crop', upload.array('files'), pdfController.cropPdf);
app.post('/api/forms', upload.array('files'), pdfController.pdfForms);

// Database endpoints for Dashboard and Admin Panel
app.get('/api/admin/data', (req, res) => {
  res.json(readDb());
});

app.post('/api/admin/users', (req, res) => {
  const db = readDb();
  db.usersData = req.body;
  writeDb(db);
  res.json({ success: true });
});

app.post('/api/admin/tools', (req, res) => {
  const db = readDb();
  db.toolsConfig = req.body;
  writeDb(db);
  res.json({ success: true });
});

app.post('/api/admin/settings', (req, res) => {
  const db = readDb();
  db.systemSettings = req.body;
  writeDb(db);
  res.json({ success: true });
});

app.post('/api/admin/files', (req, res) => {
  const { file, users } = req.body;
  const db = readDb();
  db.recentFiles = [file, ...db.recentFiles];
  if (users) {
    db.usersData = users;
  }
  writeDb(db);
  res.json({ success: true });
});

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
