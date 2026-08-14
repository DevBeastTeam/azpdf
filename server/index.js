const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const pdfController = require('./controllers/pdfController');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Promisified SQLite queries
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Initialize SQLite schema and migrate defaults from db.json
async function initDatabase() {
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        plan TEXT,
        joinDate TEXT,
        status TEXT,
        files INTEGER,
        avatar TEXT
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS recent_files (
        id INTEGER PRIMARY KEY,
        name TEXT,
        tool TEXT,
        size TEXT,
        date TEXT,
        pages INTEGER,
        status TEXT
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS tools_config (
        tool_id TEXT PRIMARY KEY,
        enabled INTEGER,
        maxFileSizeMb INTEGER
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY,
        maintenanceMode INTEGER,
        autoCleanupHours INTEGER,
        maxStoragePoolGb INTEGER,
        monthlyPremiumPrice REAL,
        monthlyBusinessPrice REAL,
        autoCleanupEnabled INTEGER
      )
    `);

    const usersCount = await dbQuery('SELECT COUNT(*) as count FROM users');
    const jsonDbPath = path.join(__dirname, 'db.json');
    let seedData = null;
    if (fs.existsSync(jsonDbPath)) {
      try {
        seedData = JSON.parse(fs.readFileSync(jsonDbPath, 'utf8'));
      } catch (err) {
        console.warn('Could not parse db.json for seeding.');
      }
    }

    if (usersCount[0].count === 0 && seedData) {
      console.log('[SQLite3] Seeding users from db.json...');
      if (seedData.usersData) {
        for (const u of seedData.usersData) {
          await dbRun(
            'INSERT OR IGNORE INTO users (id, name, email, plan, joinDate, status, files, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [u.id, u.name, u.email, u.plan, u.joinDate, u.status, u.files, u.avatar]
          );
        }
      }

      console.log('[SQLite3] Seeding recent files from db.json...');
      if (seedData.recentFiles) {
        for (const f of seedData.recentFiles) {
          await dbRun(
            'INSERT OR IGNORE INTO recent_files (id, name, tool, size, date, pages, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [f.id, f.name, f.tool, f.size, f.date, f.pages, f.status]
          );
        }
      }

      console.log('[SQLite3] Seeding tools config from db.json...');
      if (seedData.toolsConfig) {
        for (const [tId, cfg] of Object.entries(seedData.toolsConfig)) {
          await dbRun(
            'INSERT OR IGNORE INTO tools_config (tool_id, enabled, maxFileSizeMb) VALUES (?, ?, ?)',
            [tId, cfg.enabled ? 1 : 0, cfg.maxFileSizeMb]
          );
        }
      }

      console.log('[SQLite3] Seeding system settings from db.json...');
      if (seedData.systemSettings) {
        const s = seedData.systemSettings;
        await dbRun(
          'INSERT OR IGNORE INTO system_settings (id, maintenanceMode, autoCleanupHours, maxStoragePoolGb, monthlyPremiumPrice, monthlyBusinessPrice, autoCleanupEnabled) VALUES (1, ?, ?, ?, ?, ?, ?)',
          [
            s.maintenanceMode ? 1 : 0,
            s.autoCleanupHours,
            s.maxStoragePoolGb,
            s.monthlyPremiumPrice,
            s.monthlyBusinessPrice,
            s.autoCleanupEnabled ? 1 : 0
          ]
        );
      }
      console.log('[SQLite3] Seeding complete.');
    }
  } catch (err) {
    console.error('[SQLite3] Error initializing database:', err);
  }
}

initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with exposed headers & JSON parsing
app.use(cors({
  exposedHeaders: ['Content-Disposition']
}));
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
app.get('/api/admin/data', async (req, res, next) => {
  try {
    const users = await dbQuery('SELECT * FROM users ORDER BY id DESC');
    const files = await dbQuery('SELECT * FROM recent_files ORDER BY id DESC');
    const toolsRows = await dbQuery('SELECT * FROM tools_config');
    const settingsRows = await dbQuery('SELECT * FROM system_settings WHERE id = 1');

    // Map tools config rows to object structure
    const toolsConfig = {};
    toolsRows.forEach(row => {
      toolsConfig[row.tool_id] = {
        enabled: row.enabled === 1,
        maxFileSizeMb: row.maxFileSizeMb
      };
    });

    // Map system settings row
    const systemSettings = settingsRows[0] ? {
      maintenanceMode: settingsRows[0].maintenanceMode === 1,
      autoCleanupHours: settingsRows[0].autoCleanupHours,
      maxStoragePoolGb: settingsRows[0].maxStoragePoolGb,
      monthlyPremiumPrice: settingsRows[0].monthlyPremiumPrice,
      monthlyBusinessPrice: settingsRows[0].monthlyBusinessPrice,
      autoCleanupEnabled: settingsRows[0].autoCleanupEnabled === 1
    } : {
      maintenanceMode: false,
      autoCleanupHours: 2,
      maxStoragePoolGb: 50,
      monthlyPremiumPrice: 6.00,
      monthlyBusinessPrice: 12.00,
      autoCleanupEnabled: true
    };

    res.json({
      usersData: users,
      recentFiles: files,
      toolsConfig,
      systemSettings
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/users', async (req, res, next) => {
  try {
    const usersList = req.body || [];
    
    // Rebuild users table: clear table and insert new rows
    await dbRun('DELETE FROM users');
    for (const u of usersList) {
      await dbRun(
        'INSERT INTO users (id, name, email, plan, joinDate, status, files, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.name, u.email, u.plan, u.joinDate, u.status, u.files, u.avatar]
      );
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/tools', async (req, res, next) => {
  try {
    const toolsConfig = req.body || {};
    
    for (const [tool_id, config] of Object.entries(toolsConfig)) {
      await dbRun(
        'INSERT INTO tools_config (tool_id, enabled, maxFileSizeMb) VALUES (?, ?, ?) ON CONFLICT(tool_id) DO UPDATE SET enabled = excluded.enabled, maxFileSizeMb = excluded.maxFileSizeMb',
        [tool_id, config.enabled ? 1 : 0, config.maxFileSizeMb]
      );
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/settings', async (req, res, next) => {
  try {
    const s = req.body || {};
    await dbRun(
      'INSERT INTO system_settings (id, maintenanceMode, autoCleanupHours, maxStoragePoolGb, monthlyPremiumPrice, monthlyBusinessPrice, autoCleanupEnabled) VALUES (1, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET maintenanceMode = excluded.maintenanceMode, autoCleanupHours = excluded.autoCleanupHours, maxStoragePoolGb = excluded.maxStoragePoolGb, monthlyPremiumPrice = excluded.monthlyPremiumPrice, monthlyBusinessPrice = excluded.monthlyBusinessPrice, autoCleanupEnabled = excluded.autoCleanupEnabled',
      [
        s.maintenanceMode ? 1 : 0,
        s.autoCleanupHours,
        s.maxStoragePoolGb,
        s.monthlyPremiumPrice,
        s.monthlyBusinessPrice,
        s.autoCleanupEnabled ? 1 : 0
      ]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

app.post('/api/admin/files', async (req, res, next) => {
  try {
    const { file, users } = req.body;
    
    if (file) {
      await dbRun(
        'INSERT OR IGNORE INTO recent_files (id, name, tool, size, date, pages, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [file.id, file.name, file.tool, file.size, file.date, file.pages, file.status]
      );
    }

    if (users) {
      for (const u of users) {
        await dbRun(
          'INSERT INTO users (id, name, email, plan, joinDate, status, files, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET files = excluded.files',
          [u.id, u.name, u.email, u.plan, u.joinDate, u.status, u.files, u.avatar]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Auth Endpoints (Login & Signup)
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const userRows = await dbQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (userRows.length > 0) {
      return res.json({ success: true, message: 'Login successful!', user: userRows[0] });
    }
    // Auto-create or return default logged in user if not found
    const newUser = {
      id: Date.now(),
      name: email.split('@')[0],
      email: email,
      plan: 'PREMIUM',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      files: 0,
      avatar: 'AJ'
    };
    await dbRun(
      'INSERT INTO users (id, name, email, plan, joinDate, status, files, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newUser.id, newUser.name, newUser.email, newUser.plan, newUser.joinDate, newUser.status, newUser.files, newUser.avatar]
    );
    res.json({ success: true, message: 'Login successful!', user: newUser });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const { name, email, password, plan } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const newUser = {
      id: Date.now(),
      name: name || email.split('@')[0],
      email: email,
      plan: plan || 'FREE',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      files: 0,
      avatar: (name ? name[0] : 'U').toUpperCase()
    };
    await dbRun(
      'INSERT INTO users (id, name, email, plan, joinDate, status, files, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [newUser.id, newUser.name, newUser.email, newUser.plan, newUser.joinDate, newUser.status, newUser.files, newUser.avatar]
    );
    res.json({ success: true, message: 'Account created successfully!', user: newUser });
  } catch (err) {
    next(err);
  }
});

// Billing & Invoices Endpoints
app.post('/api/user/billing', async (req, res, next) => {
  try {
    const { userId, plan, billingCycle, paymentMethod } = req.body;
    const price = plan === 'BUSINESS' ? (billingCycle === 'yearly' ? 8 : 10) : (plan === 'PREMIUM' ? (billingCycle === 'yearly' ? 4 : 6) : 0);
    
    // Update user plan in DB
    if (userId) {
      await dbRun('UPDATE users SET plan = ? WHERE id = ?', [plan, userId]);
    }
    
    res.json({
      success: true,
      message: `Successfully upgraded to ${plan} Plan!`,
      billing: {
        plan,
        price,
        billingCycle,
        paymentMethod: paymentMethod || 'Visa ending in 4242',
        nextBillingDate: '2026-09-14',
        status: 'Active'
      }
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/user/invoices', (req, res) => {
  res.json({
    success: true,
    invoices: [
      { id: 'INV-2026-001', date: '2026-08-01', amount: '$4.00', plan: 'Premium Yearly', status: 'Paid', downloadUrl: '#' },
      { id: 'INV-2026-002', date: '2026-07-01', amount: '$4.00', plan: 'Premium Yearly', status: 'Paid', downloadUrl: '#' },
      { id: 'INV-2026-003', date: '2026-06-01', amount: '$4.00', plan: 'Premium Yearly', status: 'Paid', downloadUrl: '#' },
    ]
  });
});

// Contact Us & Support Ticket Endpoints
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  console.log(`📩 New Contact Message from ${name} (${email}): ${subject}`);
  res.json({ success: true, message: 'Your message has been received! Our support team will get back to you within 24 hours.' });
});

app.post('/api/support/ticket', (req, res) => {
  const { category, issueDetails, userEmail } = req.body;
  console.log(`🎫 New Support Ticket created: [${category}] ${issueDetails}`);
  res.json({ success: true, ticketId: 'TICK-' + Math.floor(100000 + Math.random() * 900000), message: 'Support ticket submitted successfully.' });
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
