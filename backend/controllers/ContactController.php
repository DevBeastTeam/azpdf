<?php
// backend/controllers/ContactController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class ContactController {
    public static function submit(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $senderName = trim($input['fullName'] ?? $input['name'] ?? 'Valued User');
            $email = trim($input['email'] ?? '');
            $company = trim($input['company'] ?? '');
            $teamSize = trim($input['teamSize'] ?? '');
            $phone = trim($input['phone'] ?? '');
            $subject = trim($input['subject'] ?? "Inquiry from {$senderName}");
            $message = trim($input['message'] ?? '');

            if (!$email || !$message) {
                Response::error('Email and message are required fields.', 400);
            }

            $res = Database::run(
                "INSERT INTO contact_messages (name, email, company, team_size, phone, subject, message, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Unread', datetime('now'))",
                [$senderName, $email, $company, $teamSize, $phone, $subject, $message]
            );

            Response::json([
                'success' => true,
                'message' => 'Thank you! Your message has been received and our team will get back to you shortly.',
                'id' => $res['id']
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function getMessages(): void {
        try {
            $messages = Database::query('SELECT * FROM contact_messages ORDER BY id DESC');
            Response::json(['success' => true, 'messages' => $messages]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function updateStatus(int $id): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $status = $input['status'] ?? 'Read';
            Database::run('UPDATE contact_messages SET status = ? WHERE id = ?', [$status, $id]);
            Response::json(['success' => true, 'message' => "Status updated to {$status}"]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function delete(int $id): void {
        try {
            Database::run('DELETE FROM contact_messages WHERE id = ?', [$id]);
            Response::json(['success' => true, 'message' => 'Message deleted successfully.']);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function reply(int $id): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $to = trim($input['to'] ?? '');
            $subject = trim($input['subject'] ?? 'Response to your azPDF inquiry');
            $replyText = trim($input['replyText'] ?? '');
            $senderName = trim($input['senderName'] ?? 'Valued Customer');

            if (!$to || !$replyText) {
                Response::error('Recipient email and reply text are required.', 400);
            }

            // Save reply to database
            Database::run(
                "UPDATE contact_messages SET status = 'Replied', reply_text = ?, replied_at = datetime('now') WHERE id = ?",
                [$replyText, $id]
            );

            // Attempt email dispatch via mail() or fallback
            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "From: azPDF Support <support@azpdf.com>\r\n";

            $htmlContent = "
                <div style='font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;'>
                    <h2 style='color: #e52424;'>azPDF Customer Support</h2>
                    <p>Hello <strong>" . htmlspecialchars($senderName) . "</strong>,</p>
                    <p>Thank you for getting in touch with us. Here is our response:</p>
                    <div style='background-color: #f8fafc; border-left: 4px solid #e52424; padding: 14px; margin: 16px 0; white-space: pre-wrap;'>" . htmlspecialchars($replyText) . "</div>
                    <p style='color: #64748b; font-size: 13px;'>If you have any further questions, feel free to reply directly to this email.</p>
                </div>
            ";

            @mail($to, $subject, $htmlContent, $headers);

            Response::json([
                'success' => true,
                'message' => "Email reply successfully sent to {$to}!",
                'replyText' => $replyText,
                'repliedAt' => date('c')
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
