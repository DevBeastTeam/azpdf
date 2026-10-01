<?php
// backend/utils/Response.php

class Response {
    public static function json($data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $status = 400): void {
        self::json(['error' => $message, 'success' => false], $status);
    }

    public static function file(string $filePath, string $filename, string $contentType = 'application/pdf'): void {
        if (!file_exists($filePath)) {
            self::error('Generated file not found', 500);
        }

        while (ob_get_level()) {
            ob_end_clean();
        }

        header('Content-Type: ' . $contentType);
        header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"');
        header('Content-Length: ' . filesize($filePath));
        header('Access-Control-Expose-Headers: Content-Disposition');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');

        readfile($filePath);
        exit;
    }

    public static function buffer(string $buffer, string $filename, string $contentType = 'application/pdf'): void {
        while (ob_get_level()) {
            ob_end_clean();
        }

        header('Content-Type: ' . $contentType);
        header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"');
        header('Content-Length: ' . strlen($buffer));
        header('Access-Control-Expose-Headers: Content-Disposition');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');

        echo $buffer;
        exit;
    }
}
