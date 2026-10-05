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

    public static function deleteUser(?int $id = null): void {
        try {
            if ($id === null) {
                $input = json_decode(file_get_contents('php://input'), true) ?? [];
                $id = isset($input['id']) ? (int) $input['id'] : (isset($_GET['id']) ? (int) $_GET['id'] : null);
            }

            if (!$id) {
                Response::error('User ID is required.', 400);
            }

            Database::run('DELETE FROM users WHERE id = ?', [$id]);
            Database::syncUsersToJson();

            Response::json(['success' => true, 'id' => $id, 'message' => 'User deleted successfully!']);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function deleteUsersBulk(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $ids = $input['ids'] ?? [];

            if (empty($ids) || !is_array($ids)) {
                Response::error('Valid list of user IDs is required.', 400);
            }

            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            Database::run("DELETE FROM users WHERE id IN ($placeholders)", array_map('intval', $ids));
            Database::syncUsersToJson();

            Response::json(['success' => true, 'deletedCount' => count($ids), 'message' => count($ids) . ' users deleted successfully!']);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function createUser(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $plan = $input['plan'] ?? 'Free';
            $status = $input['status'] ?? 'Active';
            $password = $input['password'] ?? '12345678';
            $files = (int) ($input['files'] ?? 0);

            if (!$name || !$email) {
                Response::error('Name and email are required.', 400);
            }

            $cleanEmail = strtolower($email);
            $existing = Database::query('SELECT id FROM users WHERE LOWER(email) = ?', [$cleanEmail]);
            if (!empty($existing)) {
                Response::error('This email is already registered.', 400);
            }

            $id = isset($input['id']) && is_numeric($input['id']) ? (int) $input['id'] : (int) (microtime(true) * 1000);
            $joinDate = $input['joinDate'] ?? date('M j, Y');
            $avatar = !empty($input['avatar']) ? $input['avatar'] : strtoupper(substr($name, 0, 2));

            Database::run(
                'INSERT INTO users (id, name, email, password, plan, joinDate, status, files, avatar, phone, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [$id, $name, $cleanEmail, $password, $plan, $joinDate, $status, $files, $avatar, $input['phone'] ?? '', $input['bio'] ?? '']
            );
            Database::syncUsersToJson();

            $newUser = [
                'id' => $id,
                'name' => $name,
                'email' => $cleanEmail,
                'plan' => $plan,
                'joinDate' => $joinDate,
                'status' => $status,
                'files' => $files,
                'avatar' => $avatar
            ];

            Response::json(['success' => true, 'user' => $newUser, 'message' => 'User created successfully!']);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function updateUser(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = $input['id'] ?? null;
            if (!$id) {
                Response::error('User ID is required.', 400);
            }

            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $plan = $input['plan'] ?? 'Free';
            $status = $input['status'] ?? 'Active';
            $files = isset($input['files']) ? (int) $input['files'] : 0;
            $avatar = !empty($input['avatar']) ? $input['avatar'] : strtoupper(substr($name, 0, 2));
            $phone = $input['phone'] ?? '';
            $bio = $input['bio'] ?? '';
            $password = !empty($input['password']) ? $input['password'] : null;

            if ($password) {
                Database::run(
                    'UPDATE users SET name = ?, email = ?, plan = ?, status = ?, files = ?, avatar = ?, phone = ?, bio = ?, password = ? WHERE id = ?',
                    [$name, strtolower($email), $plan, $status, $files, $avatar, $phone, $bio, $password, $id]
                );
            } else {
                Database::run(
                    'UPDATE users SET name = ?, email = ?, plan = ?, status = ?, files = ?, avatar = ?, phone = ?, bio = ? WHERE id = ?',
                    [$name, strtolower($email), $plan, $status, $files, $avatar, $phone, $bio, $id]
                );
            }

            Database::syncUsersToJson();

            Response::json(['success' => true, 'message' => 'User updated successfully!']);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function updateUsers(): void {
        try {
            $usersList = json_decode(file_get_contents('php://input'), true) ?? [];
            
            // Map existing passwords so we never overwrite/wipe them
            $existingUsers = Database::query('SELECT id, password FROM users');
            $passwordsMap = [];
            foreach ($existingUsers as $eu) {
                if (!empty($eu['password'])) {
                    $passwordsMap[$eu['id']] = $eu['password'];
                }
            }

            Database::run('DELETE FROM users');
            foreach ($usersList as $u) {
                $uid = $u['id'] ?? time();
                $pass = $u['password'] ?? ($passwordsMap[$uid] ?? null);
                Database::run(
                    'INSERT INTO users (id, name, email, password, plan, joinDate, status, files, avatar, phone, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        $uid,
                        $u['name'] ?? '',
                        $u['email'] ?? '',
                        $pass,
                        $u['plan'] ?? 'FREE',
                        $u['joinDate'] ?? date('Y-m-d'),
                        $u['status'] ?? 'Active',
                        $u['files'] ?? 0,
                        $u['avatar'] ?? 'U',
                        $u['phone'] ?? '',
                        $u['bio'] ?? ''
                    ]
                );
            }
            Database::syncUsersToJson();
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

    public static function seedDemoData(): void {
        try {
            $today = date('Y-m-d');
            $d1 = date('Y-m-d', strtotime('-1 day'));
            $d2 = date('Y-m-d', strtotime('-2 days'));
            $d3 = date('Y-m-d', strtotime('-3 days'));
            $d4 = date('Y-m-d', strtotime('-4 days'));
            $d5 = date('Y-m-d', strtotime('-5 days'));
            $d6 = date('Y-m-d', strtotime('-6 days'));
            $d7 = date('Y-m-d', strtotime('-7 days'));
            $d8 = date('Y-m-d', strtotime('-8 days'));
            $d9 = date('Y-m-d', strtotime('-9 days'));
            $d10 = date('Y-m-d', strtotime('-10 days'));

            $demoPassword = password_hash('password123', PASSWORD_BCRYPT);

            // Exactly 10 diverse users distributed across varying days
            // Today: 2, Day -1: 2, Day -2: 3, Day -3: 0, Day -4: 2, Day -5: 1 (Total: 10)
            $demoUsers = [
                [
                    'id' => 101,
                    'name' => 'Alex Morgan',
                    'email' => 'alex.morgan@azpdf.test',
                    'password' => $demoPassword,
                    'plan' => 'Premium',
                    'joinDate' => $today,
                    'status' => 'Active',
                    'files' => 14,
                    'avatar' => 'AM',
                    'phone' => '+1 (555) 234-5678',
                    'bio' => 'Senior UX Designer working extensively with design PDFs and vector assets.'
                ],
                [
                    'id' => 102,
                    'name' => 'Sophia Chen',
                    'email' => 'sophia.chen@azpdf.test',
                    'password' => $demoPassword,
                    'plan' => 'Business',
                    'joinDate' => $today,
                    'status' => 'Active',
                    'files' => 28,
                    'avatar' => 'SC',
                    'phone' => '+1 (555) 345-6789',
                    'bio' => 'Director of Operations handling batch invoice generation and client reports.'
                ],
                [
                    'id' => 103,
                    'name' => 'Marcus Vance',
                    'email' => 'marcus.vance@azpdf.test',
                    'password' => $demoPassword,
                    'plan' => 'Free',
                    'joinDate' => $d1,
                    'status' => 'Active',
                    'files' => 5,
                    'avatar' => 'MV',
                    'phone' => '+1 (555) 456-7890',
                    'bio' => 'Freelance copywriter converting client drafts and manuscripts.'
                ],
                [
                    'id' => 104,
                    'name' => 'Elena Rostova',
                    'email' => 'elena.rostova@azpdf.test',
                    'password' => $demoPassword,
                    'plan' => 'Premium',
                    'joinDate' => $d1,
                    'status' => 'Active',
                    'files' => 19,
                    'avatar' => 'ER',
                    'phone' => '+1 (555) 567-8901',
                    'bio' => 'Legal advisor protecting sensitive contract agreements and disclosures.'
                ],
                [
                    'id' => 105,
                    'name' => 'David Kim',
                    'email' => 'david.kim@azpdf.test',
                    'password' => $demoPassword,
                    'plan' => 'Business',
                    'joinDate' => $d2,
                    'status' => 'Active',
                    'files' => 42,
                    'avatar' => 'DK',
                    'phone' => '+1 (555) 678-9012',
                    'bio' => 'Data engineer managing high-volume document pipelines and OCR exports.'
                ],
                [
                    'id' => 106,
                    'name' => 'Aisha Patel',
                    'email' => 'aisha.patel@azpdf.test',
                    'password' => $demoPassword,
                    'plan' => 'Free',
                    'joinDate' => $d2,
                    'status' => 'Active',
                    'files' => 6,
                    'avatar' => 'AP',
                    'phone' => '+1 (555) 789-0123',
                    'bio' => 'Civil engineering consultant organizing project blueprints and schematics.'
                ],
                [
                    'id' => 107,
                    'name' => 'Liam O\'Connor',
                    'email' => 'liam.oconnor@azpdf.test',
                    'password' => $demoPassword,
                    'plan' => 'Premium',
                    'joinDate' => $d2,
                    'status' => 'Active',
                    'files' => 16,
                    'avatar' => 'LO',
                    'phone' => '+1 (555) 890-1234',
                    'bio' => 'Content director publishing digital magazines and whitepapers.'
                ],
                [
                    'id' => 108,
                    'name' => 'Zoe Zimmerman',
                    'email' => 'zoe.zimmerman@azpdf.test',
                    'password' => $demoPassword,
                    'plan' => 'Free',
                    'joinDate' => $d4,
                    'status' => 'Active',
                    'files' => 3,
                    'avatar' => 'ZZ',
                    'phone' => '+1 (555) 901-2345',
                    'bio' => 'Graduate researcher combining literature reviews and thesis chapters.'
                ],
                [
                    'id' => 109,
                    'name' => 'Gabriel Santos',
                    'email' => 'gabriel.santos@azpdf.test',
                    'password' => $demoPassword,
                    'plan' => 'Business',
                    'joinDate' => $d4,
                    'status' => 'Active',
                    'files' => 37,
                    'avatar' => 'GS',
                    'phone' => '+1 (555) 012-3456',
                    'bio' => 'Financial analyst converting Excel financial models and audit reports.'
                ],
                [
                    'id' => 110,
                    'name' => 'Maya Lin',
                    'email' => 'maya.lin@azpdf.test',
                    'password' => $demoPassword,
                    'plan' => 'Premium',
                    'joinDate' => $d5,
                    'status' => 'Active',
                    'files' => 22,
                    'avatar' => 'ML',
                    'phone' => '+1 (555) 123-4567',
                    'bio' => 'Product manager compiling release documentation and PRDs.'
                ]
            ];

            // 1. Populate users
            Database::run('DELETE FROM users');
            $userInsert = Database::getConnection()->prepare(
                'INSERT INTO users (id, name, email, password, plan, joinDate, status, files, avatar, phone, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            foreach ($demoUsers as $u) {
                $userInsert->execute([
                    $u['id'], $u['name'], $u['email'], $u['password'], $u['plan'],
                    $u['joinDate'], $u['status'], $u['files'], $u['avatar'],
                    $u['phone'], $u['bio']
                ]);
            }

            // 2. Populate recent files activity
            $demoFiles = [
                ['id' => 1, 'name' => 'Q3_Financial_Summary_2026.pdf', 'tool' => 'Compress PDF', 'size' => '2.4 MB', 'date' => $today, 'pages' => 14, 'status' => 'Completed'],
                ['id' => 2, 'name' => 'Client_NDA_Master_Execution.pdf', 'tool' => 'Protect PDF', 'size' => '1.1 MB', 'date' => $today, 'pages' => 8, 'status' => 'Completed'],
                ['id' => 3, 'name' => 'Product_Catalog_Fall2026.docx', 'tool' => 'Word to PDF', 'size' => '8.7 MB', 'date' => $today, 'pages' => 42, 'status' => 'Completed'],
                ['id' => 4, 'name' => 'Supplier_Tax_Declaration_Signed.pdf', 'tool' => 'Sign PDF', 'size' => '540 KB', 'date' => $today, 'pages' => 3, 'status' => 'Completed'],
                ['id' => 5, 'name' => 'Annual_Board_Performance_Deck.pptx', 'tool' => 'PowerPoint to PDF', 'size' => '15.2 MB', 'date' => $d1, 'pages' => 28, 'status' => 'Completed'],
                ['id' => 6, 'name' => 'Architectural_Master_Blueprints.pdf', 'tool' => 'Split PDF', 'size' => '18.5 MB', 'date' => $d1, 'pages' => 12, 'status' => 'Completed'],
                ['id' => 7, 'name' => 'Historical_Medical_Records_Scan.pdf', 'tool' => 'OCR PDF', 'size' => '6.3 MB', 'date' => $d2, 'pages' => 22, 'status' => 'Completed'],
                ['id' => 8, 'name' => 'Employee_Operations_Handbook_v3.pdf', 'tool' => 'Merge PDF', 'size' => '4.8 MB', 'date' => $d2, 'pages' => 35, 'status' => 'Completed'],
                ['id' => 9, 'name' => 'Consolidated_Audit_Schedule.xlsx', 'tool' => 'Excel to PDF', 'size' => '890 KB', 'date' => $d2, 'pages' => 5, 'status' => 'Completed'],
                ['id' => 10, 'name' => 'Global_Tech_Summit_Flyers.pdf', 'tool' => 'Rotate PDF', 'size' => '3.2 MB', 'date' => $d4, 'pages' => 6, 'status' => 'Completed'],
                ['id' => 11, 'name' => 'Vendor_Invoices_October_Batch.pdf', 'tool' => 'Organize PDF', 'size' => '1.9 MB', 'date' => $d4, 'pages' => 16, 'status' => 'Completed'],
                ['id' => 12, 'name' => 'Legal_Discovery_Evidence_Bundle.pdf', 'tool' => 'Watermark PDF', 'size' => '11.4 MB', 'date' => $d5, 'pages' => 64, 'status' => 'Completed']
            ];

            Database::run('DELETE FROM recent_files');
            $fileInsert = Database::getConnection()->prepare(
                'INSERT INTO recent_files (id, name, tool, size, date, pages, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            foreach ($demoFiles as $f) {
                $fileInsert->execute([
                    $f['id'], $f['name'], $f['tool'], $f['size'], $f['date'], $f['pages'], $f['status']
                ]);
            }

            // 3. Populate daily PDF conversions
            $dailyCounts = [
                $today => 14,
                $d1 => 9,
                $d2 => 18,
                $d3 => 6,
                $d4 => 12,
                $d5 => 8,
                $d6 => 15,
                $d7 => 7,
                $d8 => 11,
                $d9 => 5,
                $d10 => 16
            ];

            Database::run('DELETE FROM daily_conversions');
            $dcInsert = Database::getConnection()->prepare(
                'INSERT INTO daily_conversions (date, count) VALUES (?, ?)'
            );
            $totalConvs = 0;
            foreach ($dailyCounts as $date => $cnt) {
                $dcInsert->execute([$date, $cnt]);
                $totalConvs += $cnt;
            }
            $lifetimeConvs = $totalConvs + 42; // e.g. 154 total conversions
            Database::run(
                'INSERT INTO conversion_stats (id, total_conversions) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET total_conversions = excluded.total_conversions',
                [$lifetimeConvs]
            );

            // 4. Sync db.json
            self::syncJsonDb('recentFiles', $demoFiles);
            Database::syncUsersToJson();
            self::syncJsonDb('conversionStats', [
                'totalConversions' => $lifetimeConvs,
                'dailyConversions' => $dailyCounts
            ]);

            // 5. Fetch updated data
            $users = Database::query('SELECT * FROM users ORDER BY id ASC');
            $files = Database::query('SELECT * FROM recent_files ORDER BY id DESC');
            $dailyRows = Database::query('SELECT date, count FROM daily_conversions ORDER BY date ASC');
            $dailyMap = [];
            foreach ($dailyRows as $r) {
                $dailyMap[$r['date']] = (int) $r['count'];
            }

            Response::json([
                'success' => true,
                'message' => 'Demo data successfully seeded with 10 users and complete activity metrics!',
                'usersCount' => count($users),
                'filesCount' => count($files),
                'totalConversions' => $lifetimeConvs,
                'data' => [
                    'usersData' => $users,
                    'recentFiles' => $files,
                    'conversionStats' => [
                        'totalConversions' => $lifetimeConvs,
                        'dailyConversions' => $dailyMap
                    ]
                ]
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

}

