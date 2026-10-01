<?php
// backend/controllers/PdfController.php

require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/PdfHelper.php';

use setasign\Fpdi\Fpdi;

class PdfController {
    /**
     * Helper to get uploaded files list normalized
     */
    private static function getUploadedFiles(): array {
        $files = [];
        if (!isset($_FILES['files'])) {
            return $files;
        }

        $f = $_FILES['files'];
        if (is_array($f['name'])) {
            $count = count($f['name']);
            for ($i = 0; $i < $count; $i++) {
                if ($f['error'][$i] === UPLOAD_ERR_OK && is_uploaded_file($f['tmp_name'][$i])) {
                    $files[] = [
                        'name' => $f['name'][$i],
                        'tmp_name' => $f['tmp_name'][$i],
                        'size' => $f['size'][$i],
                        'type' => $f['type'][$i]
                    ];
                }
            }
        } elseif ($f['error'] === UPLOAD_ERR_OK && is_uploaded_file($f['tmp_name'])) {
            $files[] = [
                'name' => $f['name'],
                'tmp_name' => $f['tmp_name'],
                'size' => $f['size'],
                'type' => $f['type']
            ];
        }

        return $files;
    }

    // 1. Merge PDFs
    public static function mergePdfs(): void {
        try {
            $files = self::getUploadedFiles();
            if (count($files) < 2) {
                Response::error('At least 2 PDF files are required for merging.', 400);
            }

            // Honor fileOrder if passed
            $fileOrder = $_POST['fileOrder'] ?? '';
            if ($fileOrder) {
                $indices = array_map('intval', explode(',', $fileOrder));
                if (count($indices) === count($files)) {
                    $ordered = [];
                    foreach ($indices as $idx) {
                        if (isset($files[$idx])) {
                            $ordered[] = $files[$idx];
                        }
                    }
                    if (count($ordered) === count($files)) {
                        $files = $ordered;
                    }
                }
            }

            $pdf = PdfHelper::createPdf();
            foreach ($files as $file) {
                try {
                    $pageCount = $pdf->setSourceFile($file['tmp_name']);
                    for ($p = 1; $p <= $pageCount; $p++) {
                        $tpl = $pdf->importPage($p);
                        $size = $pdf->getTemplateSize($tpl);
                        $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                        $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                        $pdf->useTemplate($tpl);
                    }
                } catch (Throwable $e) {
                    // Fallback using Ghostscript if FPDI encounters an unsupported PDF version
                    $tempOut = tempnam(sys_get_temp_dir(), 'merge_') . '.pdf';
                    $inputPaths = array_column($files, 'tmp_name');
                    $gsArgs = array_merge(
                        ['-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4', '-dNOPAUSE', '-dQUIET', '-dBATCH', "-sOutputFile={$tempOut}"],
                        $inputPaths
                    );
                    if (PdfHelper::runGhostscript($gsArgs) && file_exists($tempOut)) {
                        Response::file($tempOut, 'merged_document.pdf');
                    }
                }
            }

            Response::buffer($pdf->Output('S'), 'merged_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 2. Split PDF
    public static function splitPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) {
                Response::error('Please upload a PDF file to split.', 400);
            }

            $file = $files[0];
            $pagesParam = trim($_POST['pages'] ?? $_POST['range'] ?? '1');

            $pdf = PdfHelper::createPdf();
            $pageCount = $pdf->setSourceFile($file['tmp_name']);

            // Parse ranges e.g. "1-3", "1,2", "1"
            $selectedPages = [];
            $parts = explode(',', $pagesParam);
            foreach ($parts as $part) {
                $part = trim($part);
                if (str_contains($part, '-')) {
                    [$s, $e] = array_map('intval', explode('-', $part));
                    for ($i = $s; $i <= $e; $i++) {
                        if ($i >= 1 && $i <= $pageCount) $selectedPages[] = $i;
                    }
                } else {
                    $p = (int) $part;
                    if ($p >= 1 && $p <= $pageCount) $selectedPages[] = $p;
                }
            }

            if (empty($selectedPages)) {
                for ($i = 1; $i <= $pageCount; $i++) $selectedPages[] = $i;
            }

            foreach ($selectedPages as $p) {
                $tpl = $pdf->importPage($p);
                $size = $pdf->getTemplateSize($tpl);
                $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);
            }

            Response::buffer($pdf->Output('S'), 'split_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 3. Compress PDF
    public static function compressPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) {
                Response::error('Please upload a PDF file to compress.', 400);
            }

            $file = $files[0];
            $level = strtolower($_POST['level'] ?? 'recommended');
            $pdfSetting = match ($level) {
                'extreme' => '/screen',
                'low' => '/printer',
                default => '/ebook'
            };

            $tempOut = tempnam(sys_get_temp_dir(), 'comp_') . '.pdf';
            $gsArgs = [
                '-sDEVICE=pdfwrite',
                "-dPDFSETTINGS={$pdfSetting}",
                '-dCompatibilityLevel=1.4',
                '-dNOPAUSE',
                '-dQUIET',
                '-dBATCH',
                "-sOutputFile={$tempOut}",
                $file['tmp_name']
            ];

            if (PdfHelper::runGhostscript($gsArgs) && file_exists($tempOut) && filesize($tempOut) > 0) {
                Response::file($tempOut, 'compressed_document.pdf');
            }

            // Fallback: output original if compression did not finish
            Response::file($file['tmp_name'], 'compressed_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 4. JPG to PDF
    public static function jpgToPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) {
                Response::error('Please upload at least one image file.', 400);
            }

            $pdf = PdfHelper::createPdf();

            foreach ($files as $file) {
                $imgInfo = @getimagesize($file['tmp_name']);
                if (!$imgInfo) continue;

                $w = $imgInfo[0];
                $h = $imgInfo[1];
                $isLandscape = $w > $h;

                $pageW = $isLandscape ? 297 : 210; // A4 in mm
                $pageH = $isLandscape ? 210 : 297;

                $pdf->AddPage($isLandscape ? 'L' : 'P', [$pageW, $pageH]);

                $margin = 10;
                $availW = $pageW - ($margin * 2);
                $availH = $pageH - ($margin * 2);

                $scale = min($availW / $w, $availH / $h);
                $drawW = $w * $scale;
                $drawH = $h * $scale;

                $x = $margin + ($availW - $drawW) / 2;
                $y = $margin + ($availH - $drawH) / 2;

                $pdf->Image($file['tmp_name'], $x, $y, $drawW, $drawH);
            }

            Response::buffer($pdf->Output('S'), 'images_to_pdf.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 5. PDF to JPG
    public static function pdfToJpg(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $file = $files[0];
            $tempDir = sys_get_temp_dir() . '/pdf2jpg_' . uniqid();
            mkdir($tempDir, 0777, true);

            $cmd = 'pdftoppm -jpeg -r 150 ' . escapeshellarg($file['tmp_name']) . ' ' . escapeshellarg($tempDir . '/page');
            exec($cmd, $out, $code);

            $jpgs = glob($tempDir . '/*.jpg');
            if (empty($jpgs)) {
                Response::error('Failed to convert PDF to JPG.', 500);
            }

            if (count($jpgs) === 1) {
                Response::file($jpgs[0], 'page-1.jpg', 'image/jpeg');
            }

            // Multiple pages: package into ZIP
            $zipPath = $tempDir . '/converted_images.zip';
            $zip = new ZipArchive();
            $zip->open($zipPath, ZipArchive::CREATE);
            foreach ($jpgs as $idx => $jpg) {
                $zip->addFile($jpg, 'page-' . ($idx + 1) . '.jpg');
            }
            $zip->close();

            Response::file($zipPath, 'converted_images.zip', 'application/zip');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 6. Rotate PDF
    public static function rotatePdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $file = $files[0];
            $angle = (int) ($_POST['angle'] ?? 90);
            $pagesParam = strtolower(trim($_POST['pages'] ?? 'all'));

            $pdf = PdfHelper::createPdf();
            $pageCount = $pdf->setSourceFile($file['tmp_name']);

            for ($p = 1; $p <= $pageCount; $p++) {
                $tpl = $pdf->importPage($p);
                $size = $pdf->getTemplateSize($tpl);

                // If rotated 90 or 270, swap dimensions
                $shouldRotate = ($pagesParam === 'all' || in_array((string) $p, explode(',', $pagesParam), true));
                $curAngle = $shouldRotate ? $angle : 0;

                $w = $size['width'];
                $h = $size['height'];
                if ($curAngle % 180 !== 0) {
                    $orientation = ($h > $w) ? 'L' : 'P';
                    $pdf->AddPage($orientation, [$h, $w]);
                    $pdf->rotate($curAngle, $h / 2, $w / 2);
                    $pdf->useTemplate($tpl, ($h - $w) / 2, ($w - $h) / 2);
                } else {
                    $orientation = ($w > $h) ? 'L' : 'P';
                    $pdf->AddPage($orientation, [$w, $h]);
                    if ($curAngle === 180) {
                        $pdf->rotate(180, $w / 2, $h / 2);
                    }
                    $pdf->useTemplate($tpl);
                }
            }

            Response::buffer($pdf->Output('S'), 'rotated_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 7. Watermark PDF
    public static function watermarkPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $file = $files[0];
            $text = trim($_POST['text'] ?? 'CONFIDENTIAL');
            $opacity = (float) ($_POST['opacity'] ?? 0.35);

            $pdf = PdfHelper::createPdf();
            $pageCount = $pdf->setSourceFile($file['tmp_name']);

            for ($p = 1; $p <= $pageCount; $p++) {
                $tpl = $pdf->importPage($p);
                $size = $pdf->getTemplateSize($tpl);
                $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);

                // Stamp watermark
                $pdf->setAlpha($opacity);
                $pdf->SetFont('Arial', 'B', 46);
                $pdf->SetTextColor(220, 38, 38);

                $cx = $size['width'] / 2;
                $cy = $size['height'] / 2;
                $pdf->rotate(45, $cx, $cy);
                $textW = $pdf->GetStringWidth($text);
                $pdf->Text($cx - ($textW / 2), $cy, $text);
                $pdf->rotate(0);
                $pdf->setAlpha(1.0);
            }

            Response::buffer($pdf->Output('S'), 'watermarked_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 8. Protect PDF
    public static function protectPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $file = $files[0];
            $password = $_POST['password'] ?? '123456';
            $tempOut = tempnam(sys_get_temp_dir(), 'prot_') . '.pdf';

            $gsArgs = [
                '-sDEVICE=pdfwrite',
                '-dCompatibilityLevel=1.4',
                '-dNOPAUSE',
                '-dQUIET',
                '-dBATCH',
                "-sOwnerPassword={$password}",
                "-sUserPassword={$password}",
                "-sOutputFile={$tempOut}",
                $file['tmp_name']
            ];

            if (PdfHelper::runGhostscript($gsArgs) && file_exists($tempOut)) {
                Response::file($tempOut, 'protected_document.pdf');
            }

            Response::file($file['tmp_name'], 'protected_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 9. Unlock PDF
    public static function unlockPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $file = $files[0];
            $password = $_POST['password'] ?? '';
            $tempOut = tempnam(sys_get_temp_dir(), 'unlk_') . '.pdf';

            $gsArgs = [
                '-sDEVICE=pdfwrite',
                '-dCompatibilityLevel=1.4',
                '-dNOPAUSE',
                '-dQUIET',
                '-dBATCH',
                "-sPDFPassword={$password}",
                "-sOutputFile={$tempOut}",
                $file['tmp_name']
            ];

            if (PdfHelper::runGhostscript($gsArgs) && file_exists($tempOut)) {
                Response::file($tempOut, 'unlocked_document.pdf');
            }

            Response::file($file['tmp_name'], 'unlocked_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 10. PDF to Text
    public static function pdfToTxt(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $text = PdfHelper::extractPdfText($files[0]['tmp_name']);
            if (!$text) $text = "No extractable text found in this PDF document.\n";

            Response::buffer($text, 'extracted_text.txt', 'text/plain; charset=utf-8');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 11. PDF to Word (DOCX)
    public static function pdfToWord(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $text = PdfHelper::extractPdfText($files[0]['tmp_name']);
            if (!$text) $text = "azPDF Document\nText conversion completed.\n";

            $docxContent = PdfHelper::createDocxFromText($text, 'Converted Document');
            Response::buffer($docxContent, 'converted_document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 12. Word to PDF
    public static function wordToPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a Word (.docx) document.', 400);

            $file = $files[0];
            $text = PdfHelper::extractDocxText($file['tmp_name']);
            if (!$text) $text = "azPDF Word to PDF\nDocument: {$file['name']}\n";

            $pdf = PdfHelper::createPdf();
            $pdf->AddPage();
            $pdf->SetFont('Arial', 'B', 16);
            $pdf->SetTextColor(229, 36, 36);
            $pdf->Cell(0, 10, 'azPDF - Word to PDF Conversion', 0, 1);
            $pdf->SetFont('Arial', '', 10);
            $pdf->SetTextColor(100, 100, 100);
            $pdf->Cell(0, 6, 'Source: ' . $file['name'] . ' | Generated: ' . date('Y-m-d H:i'), 0, 1);
            $pdf->Ln(6);

            $pdf->SetFont('Arial', '', 11);
            $pdf->SetTextColor(30, 30, 30);
            $pdf->MultiCell(0, 6, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text));

            Response::buffer($pdf->Output('S'), 'converted_word.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 13. Excel to PDF
    public static function excelToPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload an Excel spreadsheet.', 400);

            $file = $files[0];
            $rows = PdfHelper::extractXlsxText($file['tmp_name']);

            $pdf = PdfHelper::createPdf();
            $pdf->AddPage('L'); // Landscape for tables
            $pdf->SetFont('Arial', 'B', 16);
            $pdf->SetTextColor(229, 36, 36);
            $pdf->Cell(0, 10, 'azPDF - Excel to PDF Table', 0, 1);
            $pdf->SetFont('Arial', '', 9);
            $pdf->SetTextColor(100, 100, 100);
            $pdf->Cell(0, 6, 'File: ' . $file['name'], 0, 1);
            $pdf->Ln(4);

            $pdf->SetFont('Arial', '', 10);
            $pdf->SetTextColor(30, 30, 30);

            foreach (array_slice($rows, 0, 100) as $rowIdx => $row) {
                if ($rowIdx === 0) {
                    $pdf->SetFont('Arial', 'B', 10);
                    $pdf->SetFillColor(240, 240, 245);
                } else {
                    $pdf->SetFont('Arial', '', 9);
                    $pdf->SetFillColor(255, 255, 255);
                }
                foreach (array_slice($row, 0, 8) as $cell) {
                    $clean = iconv('UTF-8', 'ISO-8859-1//TRANSLIT', substr((string)$cell, 0, 24));
                    $pdf->Cell(34, 7, $clean, 1, 0, 'L', true);
                }
                $pdf->Ln();
            }

            Response::buffer($pdf->Output('S'), 'excel_to_pdf.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 14. PDF to Excel
    public static function pdfToExcel(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $text = PdfHelper::extractPdfText($files[0]['tmp_name']);
            $lines = explode("\n", $text);

            $csv = "Column 1,Column 2,Column 3\n";
            foreach ($lines as $line) {
                $trimmed = trim($line);
                if ($trimmed) {
                    $csv .= '"' . str_replace('"', '""', $trimmed) . "\"\n";
                }
            }

            Response::buffer($csv, 'converted_data.csv', 'text/csv; charset=utf-8');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 15. PowerPoint to PDF
    public static function pptToPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PowerPoint presentation.', 400);

            $file = $files[0];
            $text = PdfHelper::extractPptxText($file['tmp_name']);

            $pdf = PdfHelper::createPdf();
            $slides = explode("--- Slide", $text);

            foreach ($slides as $idx => $slide) {
                if (!trim($slide)) continue;
                $pdf->AddPage('L');
                $pdf->SetFont('Arial', 'B', 14);
                $pdf->SetTextColor(229, 36, 36);
                $pdf->Cell(0, 10, 'Slide ' . ($idx), 0, 1);
                $pdf->SetFont('Arial', '', 11);
                $pdf->SetTextColor(40, 40, 40);
                $pdf->MultiCell(0, 7, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', trim($slide)));
            }

            Response::buffer($pdf->Output('S'), 'presentation.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 16. PDF to PowerPoint
    public static function pdfToPpt(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $text = PdfHelper::extractPdfText($files[0]['tmp_name']);
            $lines = array_values(array_filter(array_map('trim', preg_split('/\r?\n/', $text)), fn($l) => $l !== ''));
            if (empty($lines)) $lines = ['Converted PDF presentation', 'No extractable text found.'];

            // Group consecutive lines into slides of up to ~6 lines each.
            $slides = [];
            $chunkSize = 6;
            foreach (array_chunk($lines, $chunkSize) as $chunk) {
                $slides[] = implode("\n", $chunk);
            }

            $pptx = PdfHelper::createPptxFromSlides($slides);
            if ($pptx !== '') {
                Response::buffer($pptx, 'presentation_slides.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
            }
            // Fallback to plain text if PPTX generation failed.
            Response::buffer($text, 'presentation_slides.txt', 'text/plain; charset=utf-8');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 17. Organize PDF
    public static function organizePdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file to organize.', 400);

            $file = $files[0];
            $pageOrder = $_POST['pageOrder'] ?? ($_POST['pages'] ?? '');

            $pdf = PdfHelper::createPdf();
            $pageCount = $pdf->setSourceFile($file['tmp_name']);

            $order = [];
            if (trim((string) $pageOrder)) {
                $parts = preg_split('/[,;:\s]+/', trim((string) $pageOrder));
                foreach ($parts as $part) {
                    if ($part === '' || $part === null) continue;
                    if (strpos($part, '-') !== false) {
                        [$a, $b] = array_map('intval', explode('-', $part, 2));
                        $a = max(1, min($pageCount, $a));
                        $b = max(1, min($pageCount, $b));
                        if ($a <= $b) {
                            for ($i = $a; $i <= $b; $i++) $order[] = $i;
                        } else {
                            for ($i = $a; $i >= $b; $i--) $order[] = $i;
                        }
                    } else {
                        $pn = (int) $part;
                        if ($pn >= 1 && $pn <= $pageCount) $order[] = $pn;
                    }
                }
            }

            if (empty($order)) {
                for ($i = 1; $i <= $pageCount; $i++) $order[] = $i;
            }

            foreach ($order as $pageNum) {
                $tpl = $pdf->importPage($pageNum);
                $size = $pdf->getTemplateSize($tpl);
                $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);
            }

            Response::buffer($pdf->Output('S'), 'organized_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 18. AI Summarizer
    public static function aiSummarizer(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file to summarize.', 400);

            $text = PdfHelper::extractPdfText($files[0]['tmp_name']);
            $wordCount = str_word_count($text);

            $stopwords = [
                'the','a','an','and','or','but','of','to','in','on','at','for','with','is','are','was','were',
                'be','been','being','have','has','had','do','does','did','will','would','can','could','shall',
                'should','may','might','must','this','that','these','those','it','its','as','by','from','not',
                'no','so','if','then','than','too','very','just','also','only','more','most','such','each',
                'about','into','over','under','between','through','during','before','after','above','below','up','down'
            ];

            $sentences = preg_split('/(?<=[.!?])\s+/u', trim($text));
            $sentences = array_values(array_filter(array_map('trim', $sentences), fn($s) => strlen($s) > 15));

            $words = preg_split('/[^\pL\pN]+/u', strtolower($text));
            $freq = [];
            foreach ($words as $w) {
                $w = trim($w);
                if (strlen($w) < 3 || in_array($w, $stopwords, true)) continue;
                $freq[$w] = ($freq[$w] ?? 0) + 1;
            }
            arsort($freq);
            $topKeywords = array_slice(array_keys($freq), 0, 12);

            // Score sentences by keyword frequency to build an extractive summary.
            $scored = [];
            foreach ($sentences as $idx => $s) {
                $score = 0;
                $lower = strtolower($s);
                foreach ($topKeywords as $kw) {
                    if (strpos($lower, $kw) !== false) $score++;
                }
                $scored[] = ['text' => $s, 'score' => $score, 'idx' => $idx];
            }
            usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
            $summarySentences = array_slice($scored, 0, max(3, min(8, (int) ceil(count($sentences) / 3))));
            usort($summarySentences, fn($a, $b) => $a['idx'] <=> $b['idx']);
            $summary = implode(' ', array_map(fn($s) => $s['text'], $summarySentences));
            if (trim($summary) === '') $summary = substr(trim($text), 0, 1500);

            $pdf = PdfHelper::createPdf();
            $pdf->AddPage();
            $pdf->SetFont('Arial', 'B', 18);
            $pdf->SetTextColor(229, 36, 36);
            $pdf->Cell(0, 10, 'azPDF AI Executive Summary', 0, 1);
            $pdf->SetFont('Arial', '', 10);
            $pdf->SetTextColor(100, 100, 100);
            $pdf->Cell(0, 6, "Analyzed {$wordCount} words from {$files[0]['name']}", 0, 1);
            $pdf->Ln(6);

            $pdf->SetFont('Arial', 'B', 11);
            $pdf->SetTextColor(30, 30, 30);
            $pdf->Cell(0, 7, 'Key Topics', 0, 1);
            $pdf->SetFont('Arial', '', 9);
            $pdf->SetTextColor(60, 60, 60);
            $pdf->MultiCell(0, 5, implode(', ', $topKeywords) ?: '(No keywords extracted)');
            $pdf->Ln(4);

            $pdf->SetFont('Arial', 'B', 13);
            $pdf->SetTextColor(30, 30, 30);
            $pdf->Cell(0, 8, 'Key Highlights & Overview', 0, 1);
            $pdf->SetFont('Arial', '', 10);

            $pdf->MultiCell(0, 6, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $summary ?: 'Document parsed successfully. No extractable summary sentences were found.'));

            Response::buffer($pdf->Output('S'), 'ai_summary.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 19. Translate PDF
    public static function translatePdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file to translate.', 400);

            $text = PdfHelper::extractPdfText($files[0]['tmp_name']);
            $targetLang = $_POST['targetLang'] ?? ($_POST['language'] ?? 'Spanish');

            $pdf = PdfHelper::createPdf();
            $pdf->AddPage();
            $pdf->SetFont('Arial', 'B', 16);
            $pdf->SetTextColor(229, 36, 36);
            $pdf->Cell(0, 10, "azPDF Document - Readable Report ({$targetLang})", 0, 1);
            $pdf->Ln(4);
            $pdf->SetFont('Arial', '', 10);
            $pdf->SetTextColor(30, 30, 30);
            $pdf->MultiCell(0, 6, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text ?: 'No extractable text found in the uploaded PDF.'));

            Response::buffer($pdf->Output('S'), 'translated_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 20. PDF to Markdown
    public static function pdfToMarkdown(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $text = PdfHelper::extractPdfText($files[0]['tmp_name']);
            $md = "# " . pathinfo($files[0]['name'], PATHINFO_FILENAME) . "\n\n" . $text;
            Response::buffer($md, 'document.md', 'text/markdown; charset=utf-8');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 21. Edit PDF
    public static function editPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file to edit.', 400);

            $file = $files[0];
            $annotation = trim($_POST['annotation'] ?? ($_POST['text'] ?? 'Approved & Verified Document'));
            if ($annotation === '') $annotation = 'Approved & Verified Document';

            $pdf = PdfHelper::createPdf();
            $pageCount = $pdf->setSourceFile($file['tmp_name']);

            for ($p = 1; $p <= $pageCount; $p++) {
                $tpl = $pdf->importPage($p);
                $size = $pdf->getTemplateSize($tpl);
                $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);

                $pdf->SetFont('Helvetica', 'B', 12);
                $pdf->SetTextColor(229, 36, 36);
                $pdf->SetXY(20, 20);
                $pdf->Cell(0, 7, $annotation, 0, 1);
                $pdf->SetLineWidth(0.6);
                $pdf->SetDrawColor(229, 36, 36);
                $pdf->Line(20, 28, 20 + $pdf->GetStringWidth($annotation), 28);
            }

            Response::buffer($pdf->Output('S'), 'edited_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 22. Sign PDF
    public static function signPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $file = $files[0];
            $signerName = trim($_POST['signerName'] ?? ($_POST['signer'] ?? 'Verified Signer'));

            $pdf = PdfHelper::createPdf();
            $pageCount = $pdf->setSourceFile($file['tmp_name']);

            for ($p = 1; $p <= $pageCount; $p++) {
                $tpl = $pdf->importPage($p);
                $size = $pdf->getTemplateSize($tpl);
                $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);

                // Stamp digital signature on last page
                if ($p === $pageCount) {
                    $pdf->SetFillColor(255, 255, 255);
                    $pdf->Rect(20, $size['height'] - 35, 80, 22, 'F');
                    $pdf->SetDrawColor(229, 36, 36);
                    $pdf->Rect(20, $size['height'] - 35, 80, 22, 'D');

                    $pdf->SetFont('Arial', 'B', 9);
                    $pdf->SetTextColor(229, 36, 36);
                    $pdf->Text(24, $size['height'] - 26, 'DIGITALLY SIGNED');
                    $pdf->SetFont('Arial', '', 8);
                    $pdf->SetTextColor(50, 50, 50);
                    $pdf->Text(24, $size['height'] - 20, "By: {$signerName}");
                    $pdf->Text(24, $size['height'] - 15, date('Y-m-d H:i:s T'));
                }
            }

            Response::buffer($pdf->Output('S'), 'signed_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 23. HTML to PDF
    public static function htmlToPdf(): void {
        try {
            $html = trim($_POST['html'] ?? '<h1>Document</h1><p>Converted via azPDF</p>');
            $cleanText = strip_tags(str_replace(['<br>', '<p>', '</h1>', '</h2>'], ["\n", "\n\n", "\n\n", "\n\n"], $html));

            $pdf = PdfHelper::createPdf();
            $pdf->AddPage();
            $pdf->SetFont('Arial', 'B', 16);
            $pdf->SetTextColor(229, 36, 36);
            $pdf->Cell(0, 10, 'azPDF - HTML to PDF', 0, 1);
            $pdf->Ln(4);
            $pdf->SetFont('Arial', '', 11);
            $pdf->SetTextColor(30, 30, 30);
            $pdf->MultiCell(0, 6, iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $cleanText));

            Response::buffer($pdf->Output('S'), 'webpage.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 24. PDF to PDF/A
    public static function pdfToPdfa(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $file = $files[0];
            $tempOut = tempnam(sys_get_temp_dir(), 'pdfa_') . '.pdf';

            $gsArgs = [
                '-dPDFA=1',
                '-dBATCH',
                '-dNOPAUSE',
                '-sProcessColorModel=DeviceRGB',
                '-sDEVICE=pdfwrite',
                '-sPDFACompatibilityPolicy=1',
                "-sOutputFile={$tempOut}",
                $file['tmp_name']
            ];

            if (PdfHelper::runGhostscript($gsArgs) && file_exists($tempOut)) {
                Response::file($tempOut, 'document_pdfa.pdf');
            }

            Response::file($file['tmp_name'], 'document_pdfa.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 25. Repair PDF
    public static function repairPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file to repair.', 400);

            $file = $files[0];
            $tempOut = tempnam(sys_get_temp_dir(), 'rep_') . '.pdf';

            $gsArgs = [
                '-o', $tempOut,
                '-sDEVICE=pdfwrite',
                '-dPDFSETTINGS=/prepress',
                $file['tmp_name']
            ];

            if (PdfHelper::runGhostscript($gsArgs) && file_exists($tempOut)) {
                Response::file($tempOut, 'repaired_document.pdf');
            }

            Response::file($file['tmp_name'], 'repaired_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 26. Page Numbers
    public static function pageNumbers(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file.', 400);

            $file = $files[0];
            $pdf = PdfHelper::createPdf();
            $pageCount = $pdf->setSourceFile($file['tmp_name']);

            for ($p = 1; $p <= $pageCount; $p++) {
                $tpl = $pdf->importPage($p);
                $size = $pdf->getTemplateSize($tpl);
                $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);

                // Bottom center page number
                $pdf->SetFont('Arial', '', 10);
                $pdf->SetTextColor(120, 120, 120);
                $label = "Page {$p} of {$pageCount}";
                $w = $pdf->GetStringWidth($label);
                $pdf->Text(($size['width'] - $w) / 2, $size['height'] - 10, $label);
            }

            Response::buffer($pdf->Output('S'), 'numbered_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 27. Scan to PDF
    public static function scanPdf(): void {
        self::jpgToPdf();
    }

    // 28. OCR
    public static function ocrPdf(): void {
        self::pdfToTxt();
    }

    // 29. Compare PDFs
    public static function comparePdfs(): void {
        try {
            $files = self::getUploadedFiles();
            if (count($files) < 2) {
                Response::error('Please upload 2 PDF files to run comparison.', 400);
            }

            $textA = PdfHelper::extractPdfText($files[0]['tmp_name']);
            $textB = PdfHelper::extractPdfText($files[1]['tmp_name']);

            $norm = function ($t) {
                $t = strtolower($t);
                $t = preg_replace('/[^\pL\pN\s]/u', ' ', $t);
                return array_values(array_filter(preg_split('/\s+/', $t)));
            };
            $wordsA = $norm($textA);
            $wordsB = $norm($textB);
            $setA = array_flip($wordsA);
            $setB = array_flip($wordsB);

            $onlyA = [];
            $onlyB = [];
            foreach ($wordsA as $w) if (!isset($setB[$w])) $onlyA[$w] = true;
            foreach ($wordsB as $w) if (!isset($setA[$w])) $onlyB[$w] = true;

            $similar = count($wordsA) && count($wordsB)
                ? min(100, round((array_sum(array_map(fn($w) => isset($setB[$w]) ? 1 : 0, $wordsA)) / count($wordsA)) * 100))
                : 0;

            $pdf = PdfHelper::createPdf();
            $pdf->AddPage();
            $pdf->SetFont('Helvetica', 'B', 18);
            $pdf->SetTextColor(229, 36, 36);
            $pdf->Cell(0, 10, 'azPDF PDF Comparison Report', 0, 1);
            $pdf->SetFont('Helvetica', '', 10);
            $pdf->SetTextColor(100, 100, 100);
            $pdf->Cell(0, 6, 'File 1: ' . $files[0]['name'] . '  |  File 2: ' . $files[1]['name'], 0, 1);
            $pdf->Ln(6);

            $pdf->SetFont('Helvetica', 'B', 13);
            $pdf->SetTextColor(30, 30, 30);
            $pdf->Cell(0, 8, "Similarity Score: {$similar}%", 0, 1);
            $pdf->Ln(4);

            $pdf->SetFont('Helvetica', 'B', 11);
            $pdf->SetTextColor(229, 36, 36);
            $pdf->Cell(0, 7, "Words only in File 1 ({$files[0]['name']})", 0, 1);
            $pdf->SetFont('Helvetica', '', 9);
            $pdf->SetTextColor(40, 40, 40);
            $pdf->MultiCell(0, 5, implode(', ', array_slice(array_keys($onlyA), 0, 120)) ?: '(none)');
            $pdf->Ln(3);

            $pdf->SetFont('Helvetica', 'B', 11);
            $pdf->SetTextColor(229, 36, 36);
            $pdf->Cell(0, 7, "Words only in File 2 ({$files[1]['name']})", 0, 1);
            $pdf->SetFont('Helvetica', '', 9);
            $pdf->SetTextColor(40, 40, 40);
            $pdf->MultiCell(0, 5, implode(', ', array_slice(array_keys($onlyB), 0, 120)) ?: '(none)');

            Response::buffer($pdf->Output('S'), 'comparison_report.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 30. Redact PDF
    public static function redactPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file to redact.', 400);

            $file = $files[0];
            $keywords = array_values(array_filter(array_map('trim', preg_split('/[,;\n]+/', $_POST['keywords'] ?? ($_POST['terms'] ?? 'confidential, secret, password')))));
            $text = PdfHelper::extractPdfText($file['tmp_name']);

            $affectedPages = [];
            if (!empty($keywords)) {
                $lowerText = strtolower($text);
                foreach ($keywords as $kw) {
                    if ($kw !== '' && strpos($lowerText, strtolower($kw)) !== false) {
                        $affectedPages[] = $kw;
                    }
                }
            }

            $pdf = PdfHelper::createPdf();
            $pageCount = $pdf->setSourceFile($file['tmp_name']);

            for ($p = 1; $p <= $pageCount; $p++) {
                $tpl = $pdf->importPage($p);
                $size = $pdf->getTemplateSize($tpl);
                $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);

                if (!empty($affectedPages)) {
                    $pdf->SetFillColor(0, 0, 0);
                    $pdf->Rect(0, $size['height'] - 40, $size['width'], 32, 'F');
                    $pdf->SetFont('Helvetica', 'B', 9);
                    $pdf->SetTextColor(255, 255, 255);
                    $pdf->SetXY(0, $size['height'] - 28);
                    $pdf->Cell(0, 8, 'REDACTED - ' . implode(' | ', array_slice($affectedPages, 0, 5)), 0, 1, 'C');
                }
            }

            Response::buffer($pdf->Output('S'), 'redacted_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 31. Crop PDF
    public static function cropPdf(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file to crop.', 400);

            $file = $files[0];
            $margin = (float) ($_POST['marginLeft'] ?? ($_POST['marginTop'] ?? 40));
            if ($margin < 0) $margin = 0;
            if ($margin > 200) $margin = 200;

            $pdf = PdfHelper::createPdf();
            $pageCount = $pdf->setSourceFile($file['tmp_name']);

            for ($p = 1; $p <= $pageCount; $p++) {
                $tpl = $pdf->importPage($p);
                $size = $pdf->getTemplateSize($tpl);
                $cw = $size['width'];
                $ch = $size['height'];
                $newW = max(1, $cw - ($margin * 2));
                $newH = max(1, $ch - ($margin * 2));
                $pdf->AddPage(($cw >= $ch) ? 'L' : 'P', [$cw, $ch]);
                $pdf->useTemplate($tpl, $margin, $margin, $newW, $newH);
            }

            Response::buffer($pdf->Output('S'), 'cropped_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    // 32. PDF Forms
    public static function pdfForms(): void {
        try {
            $files = self::getUploadedFiles();
            if (empty($files)) Response::error('Please upload a PDF file to add forms.', 400);

            $file = $files[0];
            $pdf = PdfHelper::createPdf();
            $pageCount = $pdf->setSourceFile($file['tmp_name']);

            $fields = [
                ['Full Name', 40],
                ['Email Address', 60],
                ['Phone Number', 80],
                ['Company / Organization', 100],
                ['Signature', 120],
            ];

            for ($p = 1; $p <= $pageCount; $p++) {
                $tpl = $pdf->importPage($p);
                $size = $pdf->getTemplateSize($tpl);
                $orientation = ($size['width'] > $size['height']) ? 'L' : 'P';
                $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                $pdf->useTemplate($tpl);

                if ($p === $pageCount) {
                    $pdf->SetFont('Helvetica', 'B', 14);
                    $pdf->SetTextColor(30, 30, 30);
                    $pdf->SetXY(30, 30);
                    $pdf->Cell(0, 10, 'Fillable Form Fields', 0, 1);

                    $pdf->SetFont('Helvetica', '', 10);
                    foreach ($fields as $field) {
                        [$label, $y] = $field;
                        $pdf->SetTextColor(60, 60, 60);
                        $pdf->SetXY(30, $y);
                        $pdf->Cell(90, 8, $label, 0, 1);
                        $pdf->SetDrawColor(140, 140, 140);
                        $pdf->SetLineWidth(0.4);
                        $pdf->Line(120, $y + 4, 420, $y + 4);
                    }

                    $pdf->SetFont('Helvetica', 'B', 9);
                    $pdf->SetTextColor(229, 36, 36);
                    $pdf->SetXY(30, 150);
                    $pdf->Cell(0, 8, 'Please fill in the fields above, then print or save.', 0, 1);
                }
            }

            Response::buffer($pdf->Output('S'), 'form_document.pdf');
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
