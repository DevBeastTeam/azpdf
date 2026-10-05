<?php
// backend/index.php
// Main entrypoint and router for azPDF PHP Backend

// Handle PHP built-in server static files
if (php_sapi_name() === 'cli-server') {
    $filePath = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (is_file($filePath)) {
        return false;
    }
}

// Global CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept');
header('Access-Control-Expose-Headers: Content-Disposition, Content-Length');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load Controllers & Helpers
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/controllers/AdminController.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/ContactController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/PaddleController.php';
require_once __DIR__ . '/controllers/PdfController.php';

// Parse Path and Method
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Normalize URI
$path = rtrim($uri, '/');
if ($path === '') $path = '/';

// ── Health Check ────────────────────────────────────────────────────────────
if ($path === '/api/health' && $method === 'GET') {
    Response::json([
        'status' => 'ok',
        'message' => 'azPDF PHP Backend is running!',
        'engine' => 'PHP ' . PHP_VERSION,
        'timestamp' => date('c')
    ]);
}

// ── Admin Endpoints ─────────────────────────────────────────────────────────
if ($path === '/api/admin/data' && $method === 'GET') {
    AdminController::getData();
}

if ($path === '/api/admin/site-content' && $method === 'POST') {
    AdminController::updateSiteContent();
}

if ($path === '/api/admin/users' && $method === 'POST') {
    AdminController::updateUsers();
}

if ($path === '/api/admin/tools' && $method === 'POST') {
    AdminController::updateTools();
}

if ($path === '/api/admin/menu-tool' && $method === 'POST') {
    AdminController::updateMenuTool();
}

if ($path === '/api/admin/legal-content' && $method === 'POST') {
    AdminController::updateLegalContent();
}

if ($path === '/api/admin/settings' && $method === 'POST') {
    AdminController::updateSettings();
}

if ($path === '/api/admin/files' && $method === 'POST') {
    AdminController::updateFiles();
}

if ($path === '/api/admin/conversion' && $method === 'POST') {
    AdminController::recordConversion();
}

if ($path === '/api/admin/format-data' && $method === 'POST') {
    AdminController::formatAllData();
}

// ── Contact Messages Endpoints ──────────────────────────────────────────────
if ($path === '/api/contact' && $method === 'POST') {
    ContactController::submit();
}

if ($path === '/api/admin/contact-messages' && $method === 'GET') {
    ContactController::getMessages();
}

if (preg_match('#^/api/admin/contact-messages/(\d+)$#', $path, $matches)) {
    $msgId = (int) $matches[1];
    if ($method === 'PATCH') {
        ContactController::updateStatus($msgId);
    } elseif ($method === 'DELETE') {
        ContactController::delete($msgId);
    }
}

if (preg_match('#^/api/admin/contact-messages/(\d+)/reply$#', $path, $matches) && $method === 'POST') {
    ContactController::reply((int) $matches[1]);
}

// ── Auth Endpoints ──────────────────────────────────────────────────────────
if ($path === '/api/auth/login' && $method === 'POST') {
    AuthController::login();
}

if ($path === '/api/auth/signup' && $method === 'POST') {
    AuthController::signup();
}

// ── User Endpoints ──────────────────────────────────────────────────────────
if ($path === '/api/user/profile' && $method === 'POST') {
    UserController::updateProfile();
}

if ($path === '/api/user/billing' && $method === 'POST') {
    UserController::updateBilling();
}

if ($path === '/api/user/payment-method' && $method === 'POST') {
    UserController::updatePaymentMethod();
}

if ($path === '/api/user/invoices' && $method === 'GET') {
    UserController::getInvoices();
}

if ($path === '/api/support/ticket' && $method === 'POST') {
    UserController::submitTicket();
}

// ── Paddle Payment Gateway Endpoints ────────────────────────────────────────
if (str_starts_with($path, '/api/paddle')) {
    PaddleController::handle();
}

// ── PDF Tools Endpoints ─────────────────────────────────────────────────────
if ($path === '/api/merge' && $method === 'POST') {
    PdfController::mergePdfs();
}

if ($path === '/api/split' && $method === 'POST') {
    PdfController::splitPdf();
}

if ($path === '/api/compress' && $method === 'POST') {
    PdfController::compressPdf();
}

if ($path === '/api/jpg-to-pdf' && $method === 'POST') {
    PdfController::jpgToPdf();
}

if ($path === '/api/pdf-to-jpg' && $method === 'POST') {
    PdfController::pdfToJpg();
}

if ($path === '/api/rotate' && $method === 'POST') {
    PdfController::rotatePdf();
}

if ($path === '/api/watermark' && $method === 'POST') {
    PdfController::watermarkPdf();
}

if ($path === '/api/protect' && $method === 'POST') {
    PdfController::protectPdf();
}

if ($path === '/api/unlock' && $method === 'POST') {
    PdfController::unlockPdf();
}

if ($path === '/api/pdf-to-txt' && $method === 'POST') {
    PdfController::pdfToTxt();
}

if ($path === '/api/pdf-to-word' && $method === 'POST') {
    PdfController::pdfToWord();
}

if ($path === '/api/word-to-pdf' && $method === 'POST') {
    PdfController::wordToPdf();
}

if ($path === '/api/excel-to-pdf' && $method === 'POST') {
    PdfController::excelToPdf();
}

if ($path === '/api/pdf-to-excel' && $method === 'POST') {
    PdfController::pdfToExcel();
}

if ($path === '/api/ppt-to-pdf' && $method === 'POST') {
    PdfController::pptToPdf();
}

if ($path === '/api/pdf-to-ppt' && $method === 'POST') {
    PdfController::pdfToPpt();
}

if ($path === '/api/organize' && $method === 'POST') {
    PdfController::organizePdf();
}

if ($path === '/api/ai-summarizer' && $method === 'POST') {
    PdfController::aiSummarizer();
}

if ($path === '/api/translate' && $method === 'POST') {
    PdfController::translatePdf();
}

if ($path === '/api/pdf-to-markdown' && $method === 'POST') {
    PdfController::pdfToMarkdown();
}

if ($path === '/api/edit-pdf' && $method === 'POST') {
    PdfController::editPdf();
}

if ($path === '/api/sign-pdf' && $method === 'POST') {
    PdfController::signPdf();
}

if ($path === '/api/html-to-pdf' && $method === 'POST') {
    PdfController::htmlToPdf();
}

if ($path === '/api/pdf-to-pdfa' && $method === 'POST') {
    PdfController::pdfToPdfa();
}

if ($path === '/api/repair' && $method === 'POST') {
    PdfController::repairPdf();
}

if ($path === '/api/page-numbers' && $method === 'POST') {
    PdfController::pageNumbers();
}

if ($path === '/api/scan-to-pdf' && $method === 'POST') {
    PdfController::scanPdf();
}

if ($path === '/api/ocr' && $method === 'POST') {
    PdfController::ocrPdf();
}

if ($path === '/api/compare' && $method === 'POST') {
    PdfController::comparePdfs();
}

if ($path === '/api/redact' && $method === 'POST') {
    PdfController::redactPdf();
}

if ($path === '/api/crop' && $method === 'POST') {
    PdfController::cropPdf();
}

if ($path === '/api/forms' && $method === 'POST') {
    PdfController::pdfForms();
}

// ── 404 Route ───────────────────────────────────────────────────────────────
Response::error("Route {$method} {$path} not found on azPDF PHP Backend", 404);
