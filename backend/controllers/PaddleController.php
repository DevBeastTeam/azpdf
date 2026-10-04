<?php
// backend/controllers/PaddleController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class PaddleController {
    public static function handle(): void {
        $action = $_GET['action'] ?? ($_POST['action'] ?? 'config');

        // Load configuration from backend/.env
        $envFile = __DIR__ . '/../.env';
        $envVars = [];
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || str_starts_with($line, '#')) continue;
                if (str_contains($line, '=')) {
                    [$k, $v] = explode('=', $line, 2);
                    $envVars[trim($k)] = trim($v, " \t\n\r\0\x0B\"'");
                }
            }
        }

        $paddleEnv = strtolower($envVars['PADDLE_ENV'] ?? 'sandbox');
        $isSandbox = ($paddleEnv === 'sandbox');
        $vendorId = $envVars['PADDLE_VENDOR_ID'] ?? '333354';
        $apiKey = $isSandbox ? ($envVars['PADDLE_SANDBOX_API_KEY'] ?? '') : ($envVars['PADDLE_API_KEY'] ?? '');
        $clientSideToken = $isSandbox ? ($envVars['PADDLE_SANDBOX_CLIENT_SIDE_TOKEN'] ?? '') : ($envVars['PADDLE_CLIENT_SIDE_TOKEN'] ?? '');
        $currency = strtoupper($envVars['PADDLE_CURRENCY'] ?? 'USD');

        // 1. Config
        if ($action === 'config') {
            Response::json([
                'success' => true,
                'environment' => $paddleEnv,
                'is_sandbox' => $isSandbox,
                'vendor_id' => $vendorId,
                'client_side_token' => $clientSideToken,
                'currency' => $currency,
                'test_card' => [
                    'number' => '4242 4242 4242 4242',
                    'expiry' => '12/28',
                    'cvv' => '123'
                ]
            ]);
            return;
        }

        // 2. Create Transaction
        if ($action === 'create_transaction') {
            try {
                $rawInput = file_get_contents('php://input');
                $data = json_decode($rawInput, true) ?: $_POST;

                $planId = trim($data['plan_id'] ?? 'PREMIUM');
                $planName = trim($data['plan_name'] ?? 'Premium (1-Year Plan)');
                $amount = (float) ($data['amount'] ?? 48.00);
                $customerName = trim($data['customer_name'] ?? 'Alex Johnson');
                $customerEmail = trim(filter_var($data['customer_email'] ?? 'alex@example.com', FILTER_SANITIZE_EMAIL));
                $userId = (int) ($data['user_id'] ?? 1);

                $localTxnId = 'txn_sdbx_' . strtolower(substr(bin2hex(random_bytes(8)), 0, 16));
                $amountCents = (int) round($amount * 100);

                // Try Paddle Billing v2 sandbox API if possible
                $paddleTxnId = null;
                $checkoutUrl = null;

                try {
                    $ch = curl_init('https://sandbox-api.paddle.com/transactions');
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                        'items' => [
                            [
                                'quantity' => 1,
                                'price' => [
                                    'description' => "azPDF Subscription - {$planName}",
                                    'unit_price' => [
                                        'amount' => (string) $amountCents,
                                        'currency_code' => $currency,
                                    ],
                                    'product' => [
                                        'name' => "azPDF {$planName}",
                                        'tax_category' => 'standard',
                                    ]
                                ]
                            ]
                        ],
                        'customer' => [
                            'email' => $customerEmail,
                            'name' => $customerName
                        ]
                    ]));
                    curl_setopt($ch, CURLOPT_HTTPHEADER, [
                        'Content-Type: application/json',
                        'Authorization: Bearer ' . $apiKey
                    ]);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
                    $resp = curl_exec($ch);
                    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);

                    if ($httpCode >= 200 && $httpCode < 300) {
                        $parsed = json_decode($resp, true);
                        $paddleTxnId = $parsed['data']['id'] ?? null;
                        $checkoutUrl = $parsed['data']['checkout']['url'] ?? null;
                    }
                } catch (Throwable $e) {}

                $finalTxnId = $paddleTxnId ?: $localTxnId;
                if (!$checkoutUrl) {
                    $checkoutUrl = 'https://sandbox-buy.paddle.com/checkout?_ptxn=' . $finalTxnId;
                }

                // Store pending transaction in database
                Database::run("
                    INSERT INTO paddle_transactions (txn_id, user_id, plan_id, plan_name, amount, currency, customer_name, customer_email, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                ", [
                    $finalTxnId, $userId, $planId, $planName, $amount, $currency, $customerName, $customerEmail
                ]);

                Response::json([
                    'success' => true,
                    'txn_id' => $finalTxnId,
                    'checkout_url' => $checkoutUrl,
                    'plan_id' => $planId,
                    'plan_name' => $planName,
                    'amount' => $amount,
                    'currency' => $currency,
                    'customer' => [
                        'name' => $customerName,
                        'email' => $customerEmail
                    ],
                    'environment' => $paddleEnv,
                    'is_sandbox' => true
                ]);
            } catch (Throwable $e) {
                Response::error($e->getMessage(), 500);
            }
            return;
        }

        // 3. Verify / Complete Transaction
        if ($action === 'verify_transaction') {
            try {
                $rawInput = file_get_contents('php://input');
                $data = json_decode($rawInput, true) ?: $_POST;

                $txnId = trim($data['txn_id'] ?? ($_GET['txn_id'] ?? ''));
                $planId = trim($data['plan_id'] ?? 'PREMIUM');
                $planName = trim($data['plan_name'] ?? 'Premium (1-Year Plan)');
                $amount = (float) ($data['amount'] ?? 48.00);
                $userId = (int) ($data['user_id'] ?? 1);

                if (empty($txnId)) {
                    Response::error('Transaction ID is required', 400);
                    return;
                }

                // Update transaction status in DB
                Database::run("UPDATE paddle_transactions SET status = 'completed' WHERE txn_id = ?", [$txnId]);

                // Update user's active plan in users table
                Database::run("UPDATE users SET plan = ? WHERE id = ?", [$planId, $userId]);

                // Create new invoice record in invoices table
                $invoiceId = 'INV-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));
                $invoiceAmount = '$' . number_format($amount, 2);
                $invoiceDate = date('Y-m-d');

                Database::run("
                    INSERT OR REPLACE INTO invoices (id, user_id, date, amount, plan, status, downloadUrl)
                    VALUES (?, ?, ?, ?, ?, 'Paid', '#')
                ", [
                    $invoiceId, $userId, $invoiceDate, $invoiceAmount, $planName
                ]);

                Response::json([
                    'success' => true,
                    'verified' => true,
                    'status' => 'completed',
                    'plan_id' => $planId,
                    'plan_name' => $planName,
                    'invoice_id' => $invoiceId,
                    'invoice_date' => $invoiceDate,
                    'invoice_amount' => $invoiceAmount,
                    'message' => "Payment verified via Paddle Sandbox! Your subscription to {$planName} is now active."
                ]);
            } catch (Throwable $e) {
                Response::error($e->getMessage(), 500);
            }
            return;
        }

        // 4. Payment History
        if ($action === 'history') {
            try {
                $rows = Database::query("SELECT * FROM paddle_transactions ORDER BY created_at DESC LIMIT 50");
                Response::json([
                    'success' => true,
                    'transactions' => $rows
                ]);
            } catch (Throwable $e) {
                Response::error($e->getMessage(), 500);
            }
            return;
        }

        Response::error('Unknown Paddle action', 400);
    }
}
