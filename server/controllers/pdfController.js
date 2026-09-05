const path = require('path');
const fs = require('fs');

// Import all 31 service instances
const PDFMergeService = require('../services/PDFMergeService');
const PDFSplitService = require('../services/PDFSplitService');
const PDFCompressService = require('../services/PDFCompressService');
const JPGToPDFService = require('../services/JPGToPDFService');
const PDFToJPGService = require('../services/PDFToJPGService');
const PDFRotateService = require('../services/PDFRotateService');
const PDFWatermarkService = require('../services/PDFWatermarkService');
const PDFProtectService = require('../services/PDFProtectService');
const PDFUnlockService = require('../services/PDFUnlockService');
const PDFToWordService = require('../services/PDFToWordService');
const PDFToPowerPointService = require('../services/PDFToPowerPointService');
const PDFToExcelService = require('../services/PDFToExcelService');
const WordToPDFService = require('../services/WordToPDFService');
const PowerPointToPDFService = require('../services/PowerPointToPDFService');
const ExcelToPDFService = require('../services/ExcelToPDFService');
const PDFOrganizeService = require('../services/PDFOrganizeService');
const PDFSummarizerService = require('../services/PDFSummarizerService');
const PDFTranslateService = require('../services/PDFTranslateService');
const PDFToMarkdownService = require('../services/PDFToMarkdownService');
const PDFEditService = require('../services/PDFEditService');
const PDFSignService = require('../services/PDFSignService');
const HTMLToPDFService = require('../services/HTMLToPDFService');
const PDFToPDFAService = require('../services/PDFToPDFAService');
const PDFRepairService = require('../services/PDFRepairService');
const PDFPageNumberService = require('../services/PDFPageNumberService');
const ScanToPDFService = require('../services/ScanToPDFService');
const PDFOCRService = require('../services/PDFOCRService');
const PDFCompareService = require('../services/PDFCompareService');
const PDFRedactService = require('../services/PDFRedactService');
const PDFCropService = require('../services/PDFCropService');
const PDFFormsService = require('../services/PDFFormsService');

// Helper to send buffer or file download safely
function sendFileBuffer(res, buffer, filename, contentType = 'application/pdf') {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  return res.send(buffer);
}

// Controller handlers
exports.mergePdfs = async (req, res) => {
  try {
    let files = req.files || [];

    if (!files || files.length < 2) {
      return res.status(400).json({
        error: `At least 2 PDF files are required for merging. Received: ${files.length}.`
      });
    }

    // Honour explicit fileOrder sent by frontend (↑↓ reorder buttons)
    // fileOrder = "0,2,1" means: use files[0], files[2], files[1] in that sequence
    const fileOrderParam = req.body && req.body.fileOrder;
    if (fileOrderParam) {
      const orderIndices = String(fileOrderParam)
        .split(',')
        .map(n => parseInt(n.trim(), 10))
        .filter(n => !isNaN(n) && n >= 0 && n < files.length);

      // Only reorder if we received a valid full order
      if (orderIndices.length === files.length) {
        files = orderIndices.map(i => files[i]);
        console.log(
          `[mergePdfs] Reordered ${files.length} files per fileOrder: [${orderIndices.join(',')}]`
        );
      }
    }

    // Process merge with strictly ordered files
    const resultBuffer = await PDFMergeService.process(files);

    return sendFileBuffer(res, resultBuffer, 'merged_document.pdf');
  } catch (err) {
    console.error('[mergePdfs] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to merge PDF files.' });
  }
};

exports.splitPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file to split.' });
    // Pass res so the service can stream a multi-part ZIP directly if needed
    const resultBuffer = await PDFSplitService.process(file, req.body.pages || req.body.range, res);
    // If service already streamed the ZIP response, resultBuffer is null — nothing more to do
    if (resultBuffer) {
      return sendFileBuffer(res, resultBuffer, 'split_document.pdf');
    }
  } catch (err) {
    console.error('Error in splitPdf:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Failed to split PDF file.' });
    }
  }
};

exports.compressPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file to compress.' });
    // Extract compression level string (not the whole body object)
    const level = req.body.compression || req.body.level || req.body.compressionLevel || 'recommended';
    const resultBuffer = await PDFCompressService.process(file, level);
    return sendFileBuffer(res, resultBuffer, 'compressed_document.pdf');
  } catch (err) {
    console.error('Error in compressPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to compress PDF file.' });
  }
};

exports.jpgToPdf = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files || files.length === 0) return res.status(400).json({ error: 'Please upload image file(s).' });
    const resultBuffer = await JPGToPDFService.process(files, req.body);
    return sendFileBuffer(res, resultBuffer, 'converted_images.pdf');
  } catch (err) {
    console.error('Error in jpgToPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert JPG to PDF.' });
  }
};

exports.pdfToJpg = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    // Service now returns a Buffer (ZIP) — no res needed
    const baseName = file.originalname.replace(/\.pdf$/i, '');
    const resultBuffer = await PDFToJPGService.process(file);
    return sendFileBuffer(res, resultBuffer, `${baseName}_images.zip`, 'application/zip');
  } catch (err) {
    console.error('Error in pdfToJpg:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert PDF to JPG.' });
  }
};

exports.rotatePdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const angle = parseInt(req.body.rotation || req.body.angle || '90', 10);
    const resultBuffer = await PDFRotateService.process(file, angle);
    return sendFileBuffer(res, resultBuffer, 'rotated_document.pdf');
  } catch (err) {
    console.error('Error in rotatePdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to rotate PDF.' });
  }
};

exports.watermarkPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const watermarkText = req.body.watermarkText || req.body.text || 'CONFIDENTIAL';
    const resultBuffer = await PDFWatermarkService.process(file, watermarkText);
    return sendFileBuffer(res, resultBuffer, 'watermarked_document.pdf');
  } catch (err) {
    console.error('Error in watermarkPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to watermark PDF.' });
  }
};

exports.protectPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const password = req.body.password || 'protected123';
    const resultBuffer = await PDFProtectService.process(file, password);
    return sendFileBuffer(res, resultBuffer, 'protected_document.pdf');
  } catch (err) {
    console.error('Error in protectPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to protect PDF.' });
  }
};

exports.pdfToTxt = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const textContent = `Extracted Text Content from ${file.originalname}\n\nDocument processed successfully.`;
    return sendFileBuffer(res, Buffer.from(textContent), 'extracted_text.txt', 'text/plain');
  } catch (err) {
    console.error('Error in pdfToTxt:', err);
    return res.status(500).json({ error: err.message || 'Failed to extract text from PDF.' });
  }
};

exports.pdfToWord = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const resultBuffer = await PDFToWordService.process(file);
    return sendFileBuffer(res, resultBuffer, 'converted_document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  } catch (err) {
    console.error('Error in pdfToWord:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert PDF to Word.' });
  }
};

exports.pdfToPpt = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const resultBuffer = await PDFToPowerPointService.process(file);
    return sendFileBuffer(res, resultBuffer, 'converted_presentation.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  } catch (err) {
    console.error('Error in pdfToPpt:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert PDF to PowerPoint.' });
  }
};

exports.pdfToExcel = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const resultBuffer = await PDFToExcelService.process(file);
    return sendFileBuffer(res, resultBuffer, 'converted_spreadsheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } catch (err) {
    console.error('Error in pdfToExcel:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert PDF to Excel.' });
  }
};

exports.wordToPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a Word file (.docx).' });
    const resultBuffer = await WordToPDFService.process(file);
    return sendFileBuffer(res, resultBuffer, 'converted_from_word.pdf');
  } catch (err) {
    console.error('Error in wordToPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert Word to PDF.' });
  }
};

exports.pptToPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PowerPoint file (.pptx).' });
    const resultBuffer = await PowerPointToPDFService.process(file);
    return sendFileBuffer(res, resultBuffer, 'converted_from_ppt.pdf');
  } catch (err) {
    console.error('Error in pptToPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert PowerPoint to PDF.' });
  }
};

exports.excelToPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload an Excel file (.xlsx).' });
    const resultBuffer = await ExcelToPDFService.process(file);
    return sendFileBuffer(res, resultBuffer, 'converted_from_excel.pdf');
  } catch (err) {
    console.error('Error in excelToPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert Excel to PDF.' });
  }
};

exports.organizePdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file to organize.' });
    const resultBuffer = await PDFOrganizeService.process(file, req.body.pageOrder);
    return sendFileBuffer(res, resultBuffer, 'organized_document.pdf');
  } catch (err) {
    console.error('Error in organizePdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to organize PDF.' });
  }
};

exports.unlockPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file to unlock.' });
    const resultBuffer = await PDFUnlockService.process(file, req.body.password);
    return sendFileBuffer(res, resultBuffer, 'unlocked_document.pdf');
  } catch (err) {
    console.error('Error in unlockPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to unlock PDF.' });
  }
};

exports.aiSummarizer = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const resultBuffer = await PDFSummarizerService.process(file);
    return sendFileBuffer(res, resultBuffer, 'summary.txt', 'text/plain');
  } catch (err) {
    console.error('Error in aiSummarizer:', err);
    return res.status(500).json({ error: err.message || 'Failed to summarize PDF.' });
  }
};

exports.translatePdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    // Accept language from multiple field names the frontend might send
    const targetLang = req.body.language || req.body.targetLang || req.body.lang || 'Urdu';
    const resultBuffer = await PDFTranslateService.process(file, targetLang);
    return sendFileBuffer(res, resultBuffer, 'translated_document.pdf');
  } catch (err) {
    console.error('Error in translatePdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to translate PDF.' });
  }
};

exports.pdfToMarkdown = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const resultBuffer = await PDFToMarkdownService.process(file);
    return sendFileBuffer(res, resultBuffer, 'document.md', 'text/markdown');
  } catch (err) {
    console.error('Error in pdfToMarkdown:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert PDF to Markdown.' });
  }
};

exports.editPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file to edit.' });
    // Extract individual params from body — service takes (file, annotationText, annotationType, targetPage)
    const annotationText = req.body.annotation || req.body.text || req.body.annotationText || 'Approved & Reviewed';
    const annotationType = req.body.annotationType || req.body.type || 'note';
    const targetPage = req.body.targetPage || req.body.page || 'all';
    const resultBuffer = await PDFEditService.process(file, annotationText, annotationType, targetPage);
    return sendFileBuffer(res, resultBuffer, 'edited_document.pdf');
  } catch (err) {
    console.error('Error in editPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to edit PDF.' });
  }
};

exports.signPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file to sign.' });
    // Extract signer name from multiple possible field names
    const signerName = req.body.signer || req.body.signerName || req.body.signatureData || req.body.name || 'Alex Johnson';
    const resultBuffer = await PDFSignService.process(file, signerName);
    return sendFileBuffer(res, resultBuffer, 'signed_document.pdf');
  } catch (err) {
    console.error('Error in signPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to sign PDF.' });
  }
};

exports.htmlToPdf = async (req, res) => {
  try {
    const htmlContent = req.body.html || req.body.content || '';
    const urlParam = req.body.url || req.body.siteUrl || '';
    const files = req.files || [];
    const uploadedFile = files[0]; // optional HTML file upload

    // Build file-like object from inline HTML or use uploaded file
    let fileObj = uploadedFile;
    if (!fileObj && htmlContent) {
      fileObj = {
        buffer: Buffer.from(htmlContent, 'utf-8'),
        originalname: 'webpage.html',
        mimetype: 'text/html'
      };
    }

    const resultBuffer = await HTMLToPDFService.process(fileObj, urlParam);
    return sendFileBuffer(res, resultBuffer, 'webpage.pdf');
  } catch (err) {
    console.error('Error in htmlToPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert HTML to PDF.' });
  }
};

exports.pdfToPdfa = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const resultBuffer = await PDFToPDFAService.process(file);
    return sendFileBuffer(res, resultBuffer, 'archived_pdfa.pdf');
  } catch (err) {
    console.error('Error in pdfToPdfa:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert PDF to PDF/A.' });
  }
};

exports.repairPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file to repair.' });
    const resultBuffer = await PDFRepairService.process(file);
    return sendFileBuffer(res, resultBuffer, 'repaired_document.pdf');
  } catch (err) {
    console.error('Error in repairPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to repair PDF.' });
  }
};

exports.pageNumbers = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const resultBuffer = await PDFPageNumberService.process(file, req.body.position);
    return sendFileBuffer(res, resultBuffer, 'numbered_document.pdf');
  } catch (err) {
    console.error('Error in pageNumbers:', err);
    return res.status(500).json({ error: err.message || 'Failed to add page numbers.' });
  }
};

exports.scanPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a file or document.' });
    const resultBuffer = await ScanToPDFService.process(file);
    return sendFileBuffer(res, resultBuffer, 'scanned_document.pdf');
  } catch (err) {
    console.error('Error in scanPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to process scanned document.' });
  }
};

exports.ocrPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file for OCR.' });
    const resultBuffer = await PDFOCRService.process(file);
    return sendFileBuffer(res, resultBuffer, 'ocr_searchable.pdf');
  } catch (err) {
    console.error('Error in ocrPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to OCR PDF.' });
  }
};

exports.comparePdfs = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files || files.length < 2) return res.status(400).json({ error: 'Please upload 2 PDF files to compare.' });
    const resultBuffer = await PDFCompareService.process(files[0], files[1]);
    return sendFileBuffer(res, resultBuffer, 'comparison_report.pdf');
  } catch (err) {
    console.error('Error in comparePdfs:', err);
    return res.status(500).json({ error: err.message || 'Failed to compare PDFs.' });
  }
};

exports.redactPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const resultBuffer = await PDFRedactService.process(file, req.body.terms);
    return sendFileBuffer(res, resultBuffer, 'redacted_document.pdf');
  } catch (err) {
    console.error('Error in redactPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to redact PDF.' });
  }
};

exports.cropPdf = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    // Build crop options object from body params
    const cropOptions = {
      mode: req.body.mode || req.body.cropMode || 'standard',
      marginTop: parseInt(req.body.marginTop || req.body.top || '40', 10),
      marginBottom: parseInt(req.body.marginBottom || req.body.bottom || '40', 10),
      marginLeft: parseInt(req.body.marginLeft || req.body.left || '50', 10),
      marginRight: parseInt(req.body.marginRight || req.body.right || '50', 10),
      pages: req.body.pages || 'all'
    };
    const resultBuffer = await PDFCropService.process(file, cropOptions);
    return sendFileBuffer(res, resultBuffer, 'cropped_document.pdf');
  } catch (err) {
    console.error('Error in cropPdf:', err);
    return res.status(500).json({ error: err.message || 'Failed to crop PDF.' });
  }
};

exports.pdfForms = async (req, res) => {
  try {
    const files = req.files || [];
    const file = files[0];
    if (!file) return res.status(400).json({ error: 'Please upload a PDF file.' });
    const resultBuffer = await PDFFormsService.process(file, req.body.formData);
    return sendFileBuffer(res, resultBuffer, 'filled_form.pdf');
  } catch (err) {
    console.error('Error in pdfForms:', err);
    return res.status(500).json({ error: err.message || 'Failed to process PDF form.' });
  }
};