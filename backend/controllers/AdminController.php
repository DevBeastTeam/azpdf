<?php
// backend/controllers/AdminController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class AdminController {
    public static function getData(): void {
        try {
            $users = Database::query('SELECT * FROM users ORDER BY id DESC');
            $files = Database::query('SELECT * FROM recent_files ORDER BY id DESC');
            $toolsRows = Database::query('SELECT * FROM tools_config');
            $settingsRows = Database::query('SELECT * FROM system_settings WHERE id = 1');
            $contentRows = Database::query('SELECT * FROM site_content');
            $contactMessages = Database::query('SELECT * FROM contact_messages ORDER BY id DESC');

            $toolsConfig = [];
            foreach ($toolsRows as $row) {
                $toolsConfig[$row['tool_id']] = [
                    'enabled' => (int) $row['enabled'] === 1,
                    'maxFileSizeMb' => (int) $row['maxFileSizeMb']
                ];
            }

            $s = $settingsRows[0] ?? null;
            $systemSettings = $s ? [
                'maintenanceMode' => (int) ($s['maintenanceMode'] ?? 0) === 1,
                'autoCleanupHours' => (int) ($s['autoCleanupHours'] ?? 2),
                'maxStoragePoolGb' => (int) ($s['maxStoragePoolGb'] ?? 50),
                'monthlyPremiumPrice' => (float) ($s['monthlyPremiumPrice'] ?? 6.00),
                'monthlyBusinessPrice' => (float) ($s['monthlyBusinessPrice'] ?? 12.00),
                'autoCleanupEnabled' => (int) ($s['autoCleanupEnabled'] ?? 1) === 1
            ] : [
                'maintenanceMode' => false,
                'autoCleanupHours' => 2,
                'maxStoragePoolGb' => 50,
                'monthlyPremiumPrice' => 6.00,
                'monthlyBusinessPrice' => 12.00,
                'autoCleanupEnabled' => true
            ];

            $siteContent = [];
            foreach ($contentRows as $row) {
                $val = $row['val'];
                if (is_string($val) && (str_starts_with($val, '[') || str_starts_with($val, '{'))) {
                    $decoded = json_decode($val, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $val = $decoded;
                    }
                }
                $siteContent[$row['key']] = $val;
            }

            $statsRows = Database::query('SELECT total_conversions FROM conversion_stats WHERE id = 1');
            $totalConversions = isset($statsRows[0]['total_conversions']) ? (int) $statsRows[0]['total_conversions'] : 0;
            $dailyRows = Database::query('SELECT date, count FROM daily_conversions ORDER BY date ASC');
            $dailyMap = [];
            foreach ($dailyRows as $r) {
                $dailyMap[$r['date']] = (int) $r['count'];
            }

            Response::json([
                'usersData' => $users,
                'recentFiles' => $files,
                'toolsConfig' => (object) $toolsConfig,
                'systemSettings' => $systemSettings,
                'siteContent' => (object) $siteContent,
                'contactMessages' => $contactMessages,
                'conversionStats' => [
                    'totalConversions' => $totalConversions,
                    'dailyConversions' => $dailyMap
                ]
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function updateSiteContent(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            foreach ($input as $key => $val) {
                $valStr = is_array($val) ? json_encode($val) : (string) $val;
                Database::run(
                    'INSERT INTO site_content (key, val) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET val = excluded.val',
                    [$key, $valStr]
                );
            }

            self::syncJsonDb('siteContent', $input);
            Response::json(['success' => true]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function updateUsers(): void {
        try {
            $usersList = json_decode(file_get_contents('php://input'), true) ?? [];
            Database::run('DELETE FROM users');
            foreach ($usersList as $u) {
                Database::run(
                    'INSERT INTO users (id, name, email, plan, joinDate, status, files, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $u['id'] ?? time(),
                        $u['name'] ?? '',
                        $u['email'] ?? '',
                        $u['plan'] ?? 'FREE',
                        $u['joinDate'] ?? date('Y-m-d'),
                        $u['status'] ?? 'Active',
                        $u['files'] ?? 0,
                        $u['avatar'] ?? 'U'
                    ]
                );
            }
            Response::json(['success' => true]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function updateTools(): void {
        try {
            $toolsConfig = json_decode(file_get_contents('php://input'), true) ?? [];
            foreach ($toolsConfig as $toolId => $config) {
                $enabled = !empty($config['enabled']) ? 1 : 0;
                $maxSize = $config['maxFileSizeMb'] ?? 50;
                Database::run(
                    'INSERT INTO tools_config (tool_id, enabled, maxFileSizeMb) VALUES (?, ?, ?) ON CONFLICT(tool_id) DO UPDATE SET enabled = excluded.enabled, maxFileSizeMb = excluded.maxFileSizeMb',
                    [$toolId, $enabled, $maxSize]
                );
            }
            Response::json(['success' => true]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function updateMenuTool(): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $toolId = $data['toolId'] ?? null;
            $updates = $data['updates'] ?? [];

            if (!$toolId) {
                Response::error('toolId is required', 400);
            }

            $rows = Database::query('SELECT val FROM site_content WHERE key = ?', ['toolsInformation']);
            $toolsInformation = [];
            if (!empty($rows[0]['val'])) {
                $toolsInformation = json_decode($rows[0]['val'], true) ?? [];
            }

            $toolsInformation[$toolId] = array_merge($toolsInformation[$toolId] ?? [], $updates);

            Database::run(
                'INSERT INTO site_content (key, val) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET val = excluded.val',
                ['toolsInformation', json_encode($toolsInformation)]
            );

            if (isset($updates['toolActive'])) {
                $isEnabled = $updates['toolActive'] ? 1 : 0;
                Database::run(
                    'INSERT INTO tools_config (tool_id, enabled, maxFileSizeMb) VALUES (?, ?, 50) ON CONFLICT(tool_id) DO UPDATE SET enabled = excluded.enabled',
                    [$toolId, $isEnabled]
                );
            }

            // Sync json db
            $jsonDbPath = __DIR__ . '/../db.json';
            if (file_exists($jsonDbPath)) {
                $fullDb = json_decode(file_get_contents($jsonDbPath), true) ?? [];
                if (!isset($fullDb['siteContent'])) $fullDb['siteContent'] = [];
                $fullDb['siteContent']['toolsInformation'] = $toolsInformation;
                if (isset($updates['toolActive'])) {
                    if (!isset($fullDb['toolsConfig'])) $fullDb['toolsConfig'] = [];
                    $fullDb['toolsConfig'][$toolId] = [
                        'enabled' => !empty($updates['toolActive']),
                        'maxFileSizeMb' => $fullDb['toolsConfig'][$toolId]['maxFileSizeMb'] ?? 50
                    ];
                }
                file_put_contents($jsonDbPath, json_encode($fullDb, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            }

            Response::json([
                'success' => true,
                'toolId' => $toolId,
                'updatedInfo' => $toolsInformation[$toolId],
                'toolsInformation' => $toolsInformation
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function updateLegalContent(): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $type = $data['type'] ?? null;
            $content = $data['content'] ?? [];

            $validTypes = ['privacyPolicy', 'termsAndConditions', 'securityPage', 'aboutUs', 'blogPage', 'pressPage'];
            if (!$type || !in_array($type, $validTypes, true)) {
                Response::error('Valid type (' . implode(', ', $validTypes) . ') is required', 400);
            }

            $valStr = json_encode($content);
            Database::run(
                'INSERT INTO site_content (key, val) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET val = excluded.val',
                [$type, $valStr]
            );

            self::syncJsonDb('siteContent.' . $type, $content);
            Response::json(['success' => true, 'type' => $type, 'content' => $content]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function updateSettings(): void {
        try {
            $s = json_decode(file_get_contents('php://input'), true) ?? [];
            Database::run(
                'INSERT INTO system_settings (id, maintenanceMode, autoCleanupHours, maxStoragePoolGb, monthlyPremiumPrice, monthlyBusinessPrice, autoCleanupEnabled) VALUES (1, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET maintenanceMode = excluded.maintenanceMode, autoCleanupHours = excluded.autoCleanupHours, maxStoragePoolGb = excluded.maxStoragePoolGb, monthlyPremiumPrice = excluded.monthlyPremiumPrice, monthlyBusinessPrice = excluded.monthlyBusinessPrice, autoCleanupEnabled = excluded.autoCleanupEnabled',
                [
                    !empty($s['maintenanceMode']) ? 1 : 0,
                    $s['autoCleanupHours'] ?? 2,
                    $s['maxStoragePoolGb'] ?? 50,
                    $s['monthlyPremiumPrice'] ?? 6.00,
                    $s['monthlyBusinessPrice'] ?? 12.00,
                    !empty($s['autoCleanupEnabled']) ? 1 : 0
                ]
            );
            Response::json(['success' => true]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function updateFiles(): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $file = $data['file'] ?? null;
            $files = $data['files'] ?? null;
            $users = $data['users'] ?? null;

            if ($file) {
                Database::run(
                    'INSERT OR IGNORE INTO recent_files (id, name, tool, size, date, pages, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [$file['id'], $file['name'], $file['tool'], $file['size'], $file['date'], $file['pages'], $file['status']]
                );
                // Permanent conversion counter increment (+1) - never drops on deletion
                Database::run('INSERT INTO conversion_stats (id, total_conversions) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET total_conversions = total_conversions + 1');
                $convDate = !empty($file['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $file['date']) ? $file['date'] : date('Y-m-d');
                Database::run('INSERT INTO daily_conversions (date, count) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET count = count + 1', [$convDate]);

                $allFiles = Database::query('SELECT * FROM recent_files ORDER BY id DESC');
                self::syncJsonDb('recentFiles', $allFiles);
            }

            if (isset($data['files']) && is_array($data['files'])) {
                Database::run('DELETE FROM recent_files');
                foreach ($data['files'] as $f) {
                    Database::run(
                        'INSERT INTO recent_files (id, name, tool, size, date, pages, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [$f['id'], $f['name'], $f['tool'], $f['size'], $f['date'] ?? date('Y-m-d'), $f['pages'] ?? 1, $f['status'] ?? 'Completed']
                    );
                }
                self::syncJsonDb('recentFiles', $data['files']);
                // NOTE: When files are deleted, conversion_stats and daily_conversions remain UNCHANGED!
            }

            if ($users && is_array($users)) {
                foreach ($users as $u) {
                    Database::run(
                        'INSERT INTO users (id, name, email, plan, joinDate, status, files, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET files = excluded.files',
                        [$u['id'], $u['name'], $u['email'], $u['plan'], $u['joinDate'], $u['status'], $u['files'], $u['avatar']]
                    );
                }
            }

            Response::json(['success' => true]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function recordConversion(): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $convDate = !empty($data['date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date']) ? $data['date'] : date('Y-m-d');

            Database::run('INSERT INTO conversion_stats (id, total_conversions) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET total_conversions = total_conversions + 1');
            Database::run('INSERT INTO daily_conversions (date, count) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET count = count + 1', [$convDate]);

            $statsRows = Database::query('SELECT total_conversions FROM conversion_stats WHERE id = 1');
            $dailyRows = Database::query('SELECT date, count FROM daily_conversions ORDER BY date ASC');
            $dailyMap = [];
            foreach ($dailyRows as $r) {
                $dailyMap[$r['date']] = (int) $r['count'];
            }

            $conversionStats = [
                'totalConversions' => (int) ($statsRows[0]['total_conversions'] ?? 0),
                'dailyConversions' => $dailyMap
            ];

            self::syncJsonDb('conversionStats', $conversionStats);
            Response::json(['success' => true, 'conversionStats' => $conversionStats]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function formatAllData(): void {
        try {
            // Delete all user accounts
            Database::run('DELETE FROM users');
            // Delete all recent converted files
            Database::run('DELETE FROM recent_files');
            // Reset lifetime conversion counter to zero (0)
            Database::run('INSERT INTO conversion_stats (id, total_conversions) VALUES (1, 0) ON CONFLICT(id) DO UPDATE SET total_conversions = 0');
            // Delete all daily conversion charts records
            Database::run('DELETE FROM daily_conversions');
            // Clear contact messages
            Database::run('DELETE FROM contact_messages');
            // Clear invoices & transactions
            Database::run('DELETE FROM invoices');
            Database::run('DELETE FROM paddle_transactions');

            // Sync db.json
            $jsonDbPath = __DIR__ . '/../db.json';
            if (file_exists($jsonDbPath)) {
                $fullDb = json_decode(file_get_contents($jsonDbPath), true) ?? [];
                $fullDb['usersData'] = [];
                $fullDb['recentFiles'] = [];
                $fullDb['conversionStats'] = [
                    'totalConversions' => 0,
                    'dailyConversions' => []
                ];
                file_put_contents($jsonDbPath, json_encode($fullDb, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            }

            Response::json([
                'success' => true,
                'message' => 'All platform data formatted successfully.',
                'conversionStats' => [
                    'totalConversions' => 0,
                    'dailyConversions' => []
                ]
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    private static function syncJsonDb(string $path, $value): void {
        $jsonDbPath = __DIR__ . '/../db.json';
        if (!file_exists($jsonDbPath)) return;
        try {
            $fullDb = json_decode(file_get_contents($jsonDbPath), true) ?? [];
            if ($path === 'siteContent') {
                $fullDb['siteContent'] = $value;
            } elseif (str_starts_with($path, 'siteContent.')) {
                $subKey = substr($path, 12);
                if (!isset($fullDb['siteContent'])) $fullDb['siteContent'] = [];
                $fullDb['siteContent'][$subKey] = $value;
            } else {
                $fullDb[$path] = $value;
            }
            file_put_contents($jsonDbPath, json_encode($fullDb, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } catch (Throwable $e) {
            // Ignore json sync error
        }
    }

    public static function getPdfStats(): void {
        try {
            $range = $_GET['range'] ?? '7d';

            $allFiles = Database::query('SELECT * FROM recent_files ORDER BY id DESC');
            $totalFiles = count($allFiles);

            // Filter by date range
            $cutoff = '';
            if ($range === '7d') {
                $cutoff = date('Y-m-d', strtotime('-7 days'));
            } elseif ($range === '30d') {
                $cutoff = date('Y-m-d', strtotime('-30 days'));
            } elseif ($range === '90d') {
                $cutoff = date('Y-m-d', strtotime('-90 days'));
            }

            $filteredFiles = $allFiles;
            if ($cutoff) {
                $filteredFiles = array_filter($allFiles, function($f) use ($cutoff) {
                    return $f['date'] >= $cutoff;
                });
            }

            // Count by month (simplified)
            $monthlyCounts = [0, 0, 0, 0, 0, 0];
            foreach ($filteredFiles as $f) {
                $monthIdx = 0; // Simplified month indexing
                if (isset($monthlyCounts[$monthIdx])) {
                    $monthlyCounts[$monthIdx]++;
                }
            }

            Response::json(['success' => true, 'stats' => [
                'totalFiles' => $totalFiles,
                'recentFiles' => count($filteredFiles),
                'monthlyCounts' => $monthlyCounts
            ]]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

}
