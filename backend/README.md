# azPDF PHP Backend

Complete standalone PHP backend for azPDF, fully replacing the previous Node.js server.

## 🚀 Features

- **Database:** SQLite3 via PDO (`backend/database.db`) with automatic table creation and `db.json` sync.
- **Engines:**
  - `setasign/fpdf` & `setasign/fpdi` for advanced PDF generation, rotation, watermarking, and page manipulations.
  - `smalot/pdfparser` for extracting text from PDFs.
  - Ghostscript integration (`gs`) for fast PDF compression, PDF/A, and PDF repair.
  - `pdftoppm` for high-resolution PDF-to-image extraction.
  - Native `ZipArchive` for real `.docx` (Word), `.xlsx` (Excel), and multi-file ZIP generation.
- **Security:** Full CORS configuration with exposed `Content-Disposition` headers for seamless browser downloads.

## 📁 Directory Structure

```
backend/
├── config/
│   └── database.php          # PDO SQLite connection & schema initialization
├── controllers/
│   ├── AdminController.php   # Data, settings, site content, and tools management
│   ├── AuthController.php    # User login & signup
│   ├── ContactController.php # Contact form submissions & email replies
│   ├── UserController.php    # Profiles, billing, invoices & tickets
│   └── PdfController.php     # 31 PDF processing tool handlers
├── utils/
│   ├── PdfHelper.php         # Extended FPDI with rotation, alpha & text extraction
│   └── Response.php          # JSON & file streaming download responses
├── database.db               # SQLite database
├── db.json                   # JSON database fallback/sync
├── index.php                 # Master router and entrypoint
└── .htaccess                 # Apache mod_rewrite rules
```

## 🛠️ How to Run

### Development Mode (Concurrent with Vite)
From the project root:
```bash
npm run dev
```
This runs Vite on `http://localhost:5173` and the PHP Backend on `http://localhost:5000`.

### PHP Server Only
```bash
npm run dev:server
# or
php -S 0.0.0.0:5000 backend/index.php
```

### Production with Apache / Nginx
Point the web server root to the `backend/` directory or proxy `/api/` to `http://127.0.0.1:5000`.
