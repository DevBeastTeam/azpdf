<?php
// backend/config/database.php

class Database {
    private static ?PDO $pdo = null;

    public static function getConnection(): PDO {
        if (self::$pdo === null) {
            $dbPath = __DIR__ . '/../database.db';
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
        ");

        // Seed if users is empty
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $count = (int) $stmt->fetchColumn();

        $jsonDbPath = __DIR__ . '/../db.json';
        if ($count === 0 && file_exists($jsonDbPath)) {
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
