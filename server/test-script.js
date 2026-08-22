const express = require('express');
const pdfController = require('./controllers/pdfController');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

async function testAll() {
  console.log('--- 1. Testing PDF Controller Functions ---');
  const expectedFunctions = [
    'mergePdfs', 'splitPdf', 'compressPdf', 'jpgToPdf', 'pdfToJpg',
    'rotatePdf', 'watermarkPdf', 'protectPdf', 'pdfToTxt', 'pdfToWord',
    'pdfToPpt', 'pdfToExcel', 'wordToPdf', 'pptToPdf', 'excelToPdf',
    'organizePdf', 'unlockPdf', 'aiSummarizer', 'translatePdf', 'pdfToMarkdown',
    'editPdf', 'signPdf', 'htmlToPdf', 'pdfToPdfa', 'repairPdf',
    'pageNumbers', 'scanPdf', 'ocrPdf', 'comparePdfs', 'redactPdf',
    'cropPdf', 'pdfForms'
  ];

  let missing = [];
  for (const fn of expectedFunctions) {
    if (typeof pdfController[fn] !== 'function') {
      missing.push(fn);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing controller functions:', missing);
  } else {
    console.log(`✅ All ${expectedFunctions.length} PDF controller functions exist and are exported correctly!`);
  }

  console.log('\n--- 2. Testing SQLite Database Connection ---');
  const dbPath = path.join(__dirname, 'database.db');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Database connection error:', err);
    } else {
      console.log('✅ SQLite Database connected successfully.');
    }
  });

  db.all('SELECT name FROM sqlite_master WHERE type=\'table\'', [], (err, tables) => {
    if (err) {
      console.error('❌ Table query error:', err);
    } else {
      console.log('✅ Found database tables:', tables.map(t => t.name));
    }
    db.close();
  });
}

testAll();
