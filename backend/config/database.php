<?php
// backend/config/database.php

class Database {
    private static ?PDO $pdo = null;

    public static function getConnection(): PDO {
        if (self::$pdo === null) {
            $dbPath = __DIR__ . '/../database.db';
            $uploadsDir = __DIR__ . '/../uploads';
            if (!is_dir($uploadsDir)) {
                @mkdir($uploadsDir, 0755, true);
            }
            $isNew = !file_exists($dbPath);

            self::$pdo = new PDO('sqlite:' . $dbPath);
            self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            self::$pdo->exec('PRAGMA journal_mode = WAL;');

            self::initDatabase();
        }
        return self::$pdo;
    }

    public static function query(string $sql, array $params = []): array {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function run(string $sql, array $params = []): array {
        $stmt = self::getConnection()->prepare($sql);
        $stmt->execute($params);
        return [
            'id' => self::getConnection()->lastInsertId(),
            'changes' => $stmt->rowCount()
        ];
    }

    public static function syncUsersToJson(): void {
        $jsonDbPath = __DIR__ . '/../db.json';
        if (!file_exists($jsonDbPath)) return;
        try {
            $allUsers = self::query('SELECT id, name, email, plan, joinDate, status, files, avatar, phone, bio, password FROM users ORDER BY id DESC');
            $fullDb = json_decode(file_get_contents($jsonDbPath), true) ?? [];
            $fullDb['usersData'] = $allUsers;
            file_put_contents($jsonDbPath, json_encode($fullDb, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } catch (Throwable $e) {}
    }

    private static function initDatabase(): void {
        $pdo = self::$pdo;

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT,
                plan TEXT,
                joinDate TEXT,
                status TEXT,
                files INTEGER,
                avatar TEXT
            );

            CREATE TABLE IF NOT EXISTS recent_files (
                id INTEGER PRIMARY KEY,
                name TEXT,
                tool TEXT,
                size TEXT,
                date TEXT,
                pages INTEGER,
                status TEXT
            );

            CREATE TABLE IF NOT EXISTS tools_config (
                tool_id TEXT PRIMARY KEY,
                enabled INTEGER,
                maxFileSizeMb INTEGER
            );

            CREATE TABLE IF NOT EXISTS system_settings (
                id INTEGER PRIMARY KEY,
                maintenanceMode INTEGER,
                autoCleanupHours INTEGER,
                maxStoragePoolGb INTEGER,
                monthlyPremiumPrice REAL,
                monthlyBusinessPrice REAL,
                autoCleanupEnabled INTEGER
            );

            CREATE TABLE IF NOT EXISTS site_content (
                key TEXT PRIMARY KEY,
                val TEXT
            );

            CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT,
                company TEXT,
                team_size TEXT,
                phone TEXT,
                subject TEXT,
                message TEXT,
                status TEXT DEFAULT 'Unread',
                reply_text TEXT,
                replied_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS paddle_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                txn_id TEXT UNIQUE,
                user_id INTEGER DEFAULT 1,
                plan_id TEXT,
                plan_name TEXT,
                amount REAL,
                currency TEXT DEFAULT 'USD',
                customer_name TEXT,
                customer_email TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                user_id INTEGER DEFAULT 1,
                date TEXT,
                amount TEXT,
                plan TEXT,
                status TEXT DEFAULT 'Paid',
                downloadUrl TEXT DEFAULT '#',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS conversion_stats (
                id INTEGER PRIMARY KEY,
                total_conversions INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS daily_conversions (
                date TEXT PRIMARY KEY,
                count INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS blogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT UNIQUE NOT NULL,
                excerpt TEXT,
                content TEXT NOT NULL,
                category TEXT DEFAULT 'Tutorials',
                author TEXT DEFAULT 'Technical Team',
                image TEXT,
                read_time TEXT DEFAULT '4 min read',
                tags TEXT,
                status TEXT DEFAULT 'Published',
                created_at TEXT,
                updated_at TEXT
            );
        ");

        // Seed blogs table if empty
        $blogCountStmt = $pdo->query("SELECT COUNT(*) FROM blogs");
        if ((int) $blogCountStmt->fetchColumn() === 0) {
            $defaultBlogs = [
                [
                    'title' => 'How to Compress Large PDF Files Without Losing Print Quality',
                    'slug' => 'how-to-compress-large-pdf-files',
                    'excerpt' => 'Learn the difference between lossless image optimization and DPI downsampling to achieve maximum PDF compression ratios.',
                    'content' => "PDF file sizes often balloon due to high-resolution embedded images, redundant font definitions, and uncompressed stream objects.\n\nIn this comprehensive guide, we explain how our automated compression algorithm reduces file size by up to 80% while keeping text razor-sharp and images crisp for presentations and print.\n\n### Why Compress PDFs?\n- Fast email sharing without attachment size limit errors\n- Reduced cloud hosting bandwidth and storage costs\n- Instant browser load times for web visitors\n\nTry our free online Compress PDF tool today to optimize your documents effortlessly.",
                    'category' => 'Tutorials',
                    'author' => 'Technical Team',
                    'image' => 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80',
                    'read_time' => '4 min read',
                    'tags' => 'PDF, Compression, Optimization, Speed',
                    'status' => 'Published',
                    'created_at' => '2026-08-28 10:00:00'
                ],
                [
                    'title' => 'Top 5 PDF Security Best Practices for Remote Teams',
                    'slug' => 'pdf-security-best-practices-remote-teams',
                    'excerpt' => 'Protect sensitive invoices, contracts, and business plans with password encryption, redaction, and access revocation.',
                    'content' => "Working remotely requires heightened vigilance when sharing confidential documents across team members and external stakeholders.\n\n### 1. Always Encrypt Sensitive Contracts\nNever email sensitive spreadsheets or payroll summaries without AES-256 password encryption.\n\n### 2. Permanently Redact Personal Information\nBlack highlighter marks can be bypassed in primitive PDF viewers. Use true destructive redaction to purge SSNs and tax IDs.\n\n### 3. Apply Visual and Forensic Watermarks\nMarking documents with 'CONFIDENTIAL - FOR REVIEW ONLY' prevents unauthorized disclosure and leakages.\n\n### 4. Verify Digital Signatures\nEnsure document integrity by checking cryptographic digital signatures before accepting partner agreements.\n\n### 5. Automated File Purging\nChoose cloud platforms like azPDF that strictly enforce automatic file deletion within 2 hours.",
                    'category' => 'Security',
                    'author' => 'Security Officer',
                    'image' => 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
                    'read_time' => '5 min read',
                    'tags' => 'Security, Encryption, Remote Work, Privacy',
                    'status' => 'Published',
                    'created_at' => '2026-08-14 14:30:00'
                ],
                [
                    'title' => 'Introducing AI PDF Summarizer & Multi-Language Document Translation',
                    'slug' => 'ai-pdf-summarizer-and-translation',
                    'excerpt' => 'Extract executive summaries, action items, and translate 50+ languages directly from any scanned or digital PDF document.',
                    'content' => "We are thrilled to launch our new AI Summarizer and Document Translator! Powered by state-of-the-art language models, you can now parse 100-page reports into bullet points in under 5 seconds.\n\n### Key Capabilities:\n- **Instant TL;DR**: Get high-level executive summaries without manual reading\n- **Action Items Extraction**: Detect deliverables, deadlines, and responsible owners\n- **50+ Languages**: Translate French, Spanish, German, Urdu, Arabic, Chinese with flawless syntax\n- **Preserve Formatting**: Output neatly formatted documents ready for presentation",
                    'category' => 'Productivity',
                    'author' => 'Product Team',
                    'image' => 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
                    'read_time' => '3 min read',
                    'tags' => 'AI, Translation, Summarizer, Productivity',
                    'status' => 'Published',
                    'created_at' => '2026-07-30 09:15:00'
                ],
                [
                    'title' => 'Why Automatic File Purging is Essential for Document Privacy',
                    'slug' => 'why-automatic-file-purging-is-essential',
                    'excerpt' => 'A look inside our privacy-by-design architecture and why we permanently wipe processed files within 2 hours.',
                    'content' => "Cloud storage is convenient, but permanent retention of customer documents creates unnecessary data liability and compliance risks.\n\nDiscover why azPDF strictly enforces a 2-hour automated deletion protocol for all processed files. Zero residual cache, zero unauthorized backups, and full peace of mind for enterprises worldwide.",
                    'category' => 'Company Updates',
                    'author' => 'Privacy Team',
                    'image' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
                    'read_time' => '3 min read',
                    'tags' => 'Privacy, Compliance, GDPR, Architecture',
                    'status' => 'Published',
                    'created_at' => '2026-07-12 16:45:00'
                ]
            ];

            $blogInsert = $pdo->prepare("INSERT INTO blogs (title, slug, excerpt, content, category, author, image, read_time, tags, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($defaultBlogs as $b) {
                $blogInsert->execute([
                    $b['title'], $b['slug'], $b['excerpt'], $b['content'],
                    $b['category'], $b['author'], $b['image'], $b['read_time'],
                    $b['tags'], $b['status'], $b['created_at'], $b['created_at']
                ]);
            }
        }

        // Seed conversion_stats if empty
        $statsStmt = $pdo->query("SELECT COUNT(*) FROM conversion_stats");
        $statsCount = (int) $statsStmt->fetchColumn();
        if ($statsCount === 0) {
            $pdo->exec("INSERT INTO conversion_stats (id, total_conversions) VALUES (1, 10)");
            $today = date('Y-m-d');
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            $twoDaysAgo = date('Y-m-d', strtotime('-2 days'));
            $threeDaysAgo = date('Y-m-d', strtotime('-3 days'));
            $pdo->prepare("INSERT OR IGNORE INTO daily_conversions (date, count) VALUES (?, ?)")->execute([$threeDaysAgo, 2]);
            $pdo->prepare("INSERT OR IGNORE INTO daily_conversions (date, count) VALUES (?, ?)")->execute([$twoDaysAgo, 3]);
            $pdo->prepare("INSERT OR IGNORE INTO daily_conversions (date, count) VALUES (?, ?)")->execute([$yesterday, 3]);
            $pdo->prepare("INSERT OR IGNORE INTO daily_conversions (date, count) VALUES (?, ?)")->execute([$today, 2]);
        }

        // Ensure phone and bio columns exist in users table
        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN phone TEXT");
        } catch (Throwable $e) {}
        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN bio TEXT");
        } catch (Throwable $e) {}

        // Seed only if database is brand new
        $jsonDbPath = __DIR__ . '/../db.json';
        if ($isNew && file_exists($jsonDbPath)) {
            $jsonContent = file_get_contents($jsonDbPath);
            $seed = json_decode($jsonContent, true);

            if (!empty($seed['usersData'])) {
                $userStmt = $pdo->prepare("INSERT OR IGNORE INTO users (id, name, email, plan, joinDate, status, files, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($seed['usersData'] as $u) {
                    $userStmt->execute([
                        $u['id'], $u['name'], $u['email'], $u['plan'] ?? 'FREE',
                        $u['joinDate'] ?? date('Y-m-d'), $u['status'] ?? 'Active',
                        $u['files'] ?? 0, $u['avatar'] ?? 'U'
                    ]);
                }
            }

            if (!empty($seed['recentFiles'])) {
                $fileStmt = $pdo->prepare("INSERT OR IGNORE INTO recent_files (id, name, tool, size, date, pages, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
                foreach ($seed['recentFiles'] as $f) {
                    $fileStmt->execute([
                        $f['id'], $f['name'], $f['tool'], $f['size'],
                        $f['date'] ?? date('Y-m-d'), $f['pages'] ?? 1, $f['status'] ?? 'Completed'
                    ]);
                }
            }

            if (!empty($seed['toolsConfig'])) {
                $toolStmt = $pdo->prepare("INSERT OR IGNORE INTO tools_config (tool_id, enabled, maxFileSizeMb) VALUES (?, ?, ?)");
                foreach ($seed['toolsConfig'] as $tId => $cfg) {
                    $toolStmt->execute([$tId, !empty($cfg['enabled']) ? 1 : 0, $cfg['maxFileSizeMb'] ?? 50]);
                }
            }

            if (!empty($seed['systemSettings'])) {
                $s = $seed['systemSettings'];
                $setStmt = $pdo->prepare("INSERT OR IGNORE INTO system_settings (id, maintenanceMode, autoCleanupHours, maxStoragePoolGb, monthlyPremiumPrice, monthlyBusinessPrice, autoCleanupEnabled) VALUES (1, ?, ?, ?, ?, ?, ?)");
                $setStmt->execute([
                    !empty($s['maintenanceMode']) ? 1 : 0,
                    $s['autoCleanupHours'] ?? 2,
                    $s['maxStoragePoolGb'] ?? 50,
                    $s['monthlyPremiumPrice'] ?? 6.00,
                    $s['monthlyBusinessPrice'] ?? 12.00,
                    !empty($s['autoCleanupEnabled']) ? 1 : 0
                ]);
            }

            if (!empty($seed['siteContent'])) {
                $contentStmt = $pdo->prepare("INSERT OR IGNORE INTO site_content (key, val) VALUES (?, ?)");
                foreach ($seed['siteContent'] as $key => $val) {
                    $valStr = is_array($val) ? json_encode($val) : (string) $val;
                    $contentStmt->execute([$key, $valStr]);
                }
            }
        }
    }
}
