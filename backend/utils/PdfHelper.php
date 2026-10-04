<?php
// backend/utils/PdfHelper.php

require_once __DIR__ . '/../vendor/autoload.php';

use setasign\Fpdi\Fpdi;
use Smalot\PdfParser\Parser;

class ExtendedFpdi extends Fpdi {
    protected float $angle = 0;
    protected array $extGStates = [];

    public function rotate(float $angle, float $x = -1, float $y = -1): void {
        if ($x == -1) $x = $this->x;
        if ($y == -1) $y = $this->y;
        if ($this->angle != 0) {
            $this->_out('Q');
        }
        $this->angle = $angle;
        if ($angle != 0) {
            $rad = $angle * M_PI / 180;
            $c = cos($rad);
            $s = sin($rad);
            $cx = $x * $this->k;
            $cy = ($this->h - $y) * $this->k;
            $this->_out(sprintf('q %.5F %.5F %.5F %.5F %.2F %.2F cm 1 0 0 1 %.2F %.2F cm', $c, $s, -$s, $c, $cx, $cy, -$cx, -$cy));
        }
    }

    public function setAlpha(float $alpha): void {
        // Set alpha state
        $gsId = count($this->extGStates) + 1;
        $this->extGStates[$gsId] = sprintf('/ca %.3F /CA %.3F', $alpha, $alpha);
        $this->_out(sprintf('/GS%d gs', $gsId));
    }

    public function _enddoc(): void {
        if (!empty($this->extGStates)) {
            $this->_newobj();
            $this->_put('<<');
            foreach ($this->extGStates as $id => $val) {
                $this->_put(sprintf('/GS%d << /Type /ExtGState %s >>', $id, $val));
            }
            $this->_put('>>');
            $this->_put('endobj');
        }
        parent::_enddoc();
    }

    public function _endpage(): void {
        if ($this->angle != 0) {
            $this->angle = 0;
            $this->_out('Q');
        }
        parent::_endpage();
    }
}

class PdfHelper {
    public static function createPdf(): ExtendedFpdi {
        $pdf = new ExtendedFpdi();
        $pdf->SetAutoPageBreak(true, 15);
        return $pdf;
    }

    public static function extractPdfText(string $filePath): string {
        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($filePath);
            return $pdf->getText();
        } catch (Throwable $e) {
            return '';
        }
    }

    public static function extractDocxText(string $filePath): string {
        try {
            $zip = new ZipArchive();
            if ($zip->open($filePath) === true) {
                $xml = $zip->getFromName('word/document.xml');
                $zip->close();
                if ($xml) {
                    $paragraphs = [];
                    if (preg_match_all('#<w:p[^>]*>(.*?)</w:p>#s', $xml, $pMatches)) {
                        foreach ($pMatches[1] as $pXml) {
                            if (preg_match_all('#<w:t[^>]*>(.*?)</w:t>#s', $pXml, $tMatches)) {
                                $line = implode('', $tMatches[1]);
                                $line = html_entity_decode($line, ENT_QUOTES, 'UTF-8');
                                $trimmed = trim($line);
                                if ($trimmed !== '') {
                                    $paragraphs[] = $trimmed;
                                }
                            }
                        }
                    }
                    if (!empty($paragraphs)) {
                        return implode("\n\n", $paragraphs);
                    }
                    $clean = strip_tags(str_replace(['</w:p>', '</w:tr>'], ["\n\n", "\n"], $xml));
                    return trim(html_entity_decode($clean, ENT_QUOTES, 'UTF-8'));
                }
            }
        } catch (Throwable $e) {}
        return '';
    }

    public static function extractXlsxText(string $filePath): array {
        $rows = [];
        try {
            $zip = new ZipArchive();
            if ($zip->open($filePath) === true) {
                $sharedStrings = [];
                $stringsXml = $zip->getFromName('xl/sharedStrings.xml');
                if ($stringsXml) {
                    $xmlObj = simplexml_load_string($stringsXml);
                    if ($xmlObj && isset($xmlObj->si)) {
                        foreach ($xmlObj->si as $val) {
                            if (isset($val->t)) {
                                $sharedStrings[] = (string) $val->t;
                            } elseif (isset($val->r)) {
                                $str = '';
                                foreach ($val->r as $r) {
                                    $str .= (string) ($r->t ?? '');
                                }
                                $sharedStrings[] = $str;
                            } else {
                                $sharedStrings[] = '';
                            }
                        }
                    }
                }

                // Locate sheet XMLs
                $sheetFiles = [];
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $name = $zip->getNameIndex($i);
                    if (preg_match('#xl/worksheets/sheet[0-9]+\.xml#i', $name)) {
                        $sheetFiles[] = $name;
                    }
                }
                natsort($sheetFiles);
                if (empty($sheetFiles)) {
                    $sheetFiles[] = 'xl/worksheets/sheet1.xml';
                }

                foreach ($sheetFiles as $sf) {
                    $sheetXml = $zip->getFromName($sf);
                    if (!$sheetXml) continue;

                    $sheetObj = simplexml_load_string($sheetXml);
                    if ($sheetObj && isset($sheetObj->sheetData->row)) {
                        foreach ($sheetObj->sheetData->row as $r) {
                            $rowMap = [];
                            $maxCol = -1;
                            foreach ($r->c as $c) {
                                $ref = (string) $c['r'];
                                $colIdx = 0;
                                if (preg_match('/^([A-Z]+)(\d+)$/i', $ref, $m)) {
                                    $colStr = strtoupper($m[1]);
                                    $cIdx = 0;
                                    $cLen = strlen($colStr);
                                    for ($ci = 0; $ci < $cLen; $ci++) {
                                        $cIdx = $cIdx * 26 + (ord($colStr[$ci]) - 64);
                                    }
                                    $colIdx = $cIdx - 1;
                                } else {
                                    $colIdx = $maxCol + 1;
                                }
                                if ($colIdx > $maxCol) $maxCol = $colIdx;

                                $type = (string) $c['t'];
                                $cellVal = '';

                                if ($type === 's') {
                                    $sIdx = (int) $c->v;
                                    $cellVal = $sharedStrings[$sIdx] ?? '';
                                } elseif ($type === 'inlineStr') {
                                    if (isset($c->is->t)) {
                                        $cellVal = (string) $c->is->t;
                                    } elseif (isset($c->is->r)) {
                                        $str = '';
                                        foreach ($c->is->r as $rItem) {
                                            $str .= (string) ($rItem->t ?? '');
                                        }
                                        $cellVal = $str;
                                    }
                                } elseif ($type === 'b') {
                                    $cellVal = ((string) $c->v === '1') ? 'TRUE' : 'FALSE';
                                } elseif (isset($c->v)) {
                                    $cellVal = (string) $c->v;
                                }
                                $rowMap[$colIdx] = trim($cellVal);
                            }

                            if ($maxCol >= 0) {
                                $row = [];
                                for ($ci = 0; $ci <= $maxCol; $ci++) {
                                    $row[$ci] = $rowMap[$ci] ?? '';
                                }
                                if (!empty(array_filter($row, fn($x) => trim((string)$x) !== ''))) {
                                    $rows[] = $row;
                                }
                            }
                        }
                    }
                    if (!empty($rows)) {
                        break; // Stop at first non-empty sheet
                    }
                }
                $zip->close();
            } else {
                // Fallback for CSV / TSV / text spreadsheets
                if (($handle = @fopen($filePath, 'r')) !== false) {
                    $firstLine = fgets($handle);
                    rewind($handle);
                    $sep = (substr_count($firstLine, "\t") > substr_count($firstLine, ',')) ? "\t" : 
                           ((substr_count($firstLine, ';') > substr_count($firstLine, ',')) ? ';' : ',');
                    while (($data = fgetcsv($handle, 4096, $sep)) !== false) {
                        if (!empty(array_filter($data, fn($v) => trim((string)$v) !== ''))) {
                            $rows[] = array_map('trim', $data);
                        }
                    }
                    fclose($handle);
                }
            }
        } catch (Throwable $e) {}
        return $rows;
    }

    public static function extractPptxText(string $filePath): string {
        $text = [];
        try {
            $zip = new ZipArchive();
            if ($zip->open($filePath) === true) {
                for ($i = 1; $i <= 50; $i++) {
                    $slide = $zip->getFromName("ppt/slides/slide{$i}.xml");
                    if ($slide) {
                        $slideText = strip_tags(str_replace(['</a:p>', '</p:sp>'], ["\n", "\n\n"], $slide));
                        $text[] = "--- Slide {$i} ---\n" . trim(html_entity_decode($slideText, ENT_QUOTES, 'UTF-8'));
                    } else {
                        break;
                    }
                }
                $zip->close();
            }
        } catch (Throwable $e) {}
        return implode("\n\n", $text);
    }

    public static function runGhostscript(array $args): bool {
        $tempCopies = [];
        $sanitizedArgs = [];

        foreach ($args as $arg) {
            // Any positional input file outside /tmp needs to be mirrored to /tmp so Ghostscript sandbox can read it
            if (is_string($arg) && !str_starts_with($arg, '-') && file_exists($arg)) {
                $real = realpath($arg) ?: $arg;
                if (!str_starts_with($real, '/tmp')) {
                    $tmpIn = tempnam('/tmp', 'gsin_') . '.pdf';
                    if (copy($real, $tmpIn)) {
                        $tempCopies[] = $tmpIn;
                        $sanitizedArgs[] = $tmpIn;
                        continue;
                    }
                }
            }
            $sanitizedArgs[] = $arg;
        }

        $cmd = 'gs ' . implode(' ', array_map('escapeshellarg', $sanitizedArgs)) . ' 2>&1';
        exec($cmd, $out, $code);

        foreach ($tempCopies as $tmp) {
            @unlink($tmp);
        }

        $outStr = implode("\n", $out);
        if (str_contains($outStr, '**** Error:') || str_contains($outStr, 'Cannot decrypt') || str_contains($outStr, 'Password did not work') || str_contains($outStr, 'No pages will be processed')) {
            return false;
        }

        return $code === 0;
    }

    public static function encryptPdf(string $inputFile, string $outputFile, string $password): bool {
        if (!file_exists($inputFile) || filesize($inputFile) < 10) {
            return false;
        }

        // 1. Try Python3 with pypdf (Industry standard AES-256 encryption, preserving all pages and document structure)
        $pyCode = 'import sys; from pypdf import PdfReader, PdfWriter;
in_f, out_f, pw = sys.argv[1], sys.argv[2], sys.argv[3];
r = PdfReader(in_f);
if len(r.pages) == 0: sys.exit(1);
w = PdfWriter();
w.append(r);
w.encrypt(user_password=pw, owner_password=pw + "_azowner", algorithm="AES-256");
with open(out_f, "wb") as f: w.write(f);
';
        $cmd = 'python3 -c ' . escapeshellarg($pyCode) . ' '
            . escapeshellarg($inputFile) . ' '
            . escapeshellarg($outputFile) . ' '
            . escapeshellarg($password) . ' 2>&1';
        
        exec($cmd, $out, $code);
        if ($code === 0 && file_exists($outputFile) && filesize($outputFile) > 0) {
            return true;
        }

        // 2. Fallback to Ghostscript with 128-bit key (Revision 3)
        $ownerPw = hash('sha256', $password . '_azpdf_owner_key');
        $gsArgs = [
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.7',
            '-dEncryptionR=3',
            '-dKeyLength=128',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            "-sUserPassword={$password}",
            "-sOwnerPassword={$ownerPw}",
            "-sOutputFile={$outputFile}",
            $inputFile
        ];

        return self::runGhostscript($gsArgs) && file_exists($outputFile) && filesize($outputFile) > 0;
    }

    public static function decryptPdf(string $inputFile, string $outputFile, string $password): array {
        if (!file_exists($inputFile) || filesize($inputFile) < 10) {
            return ['success' => false, 'error' => 'The uploaded PDF file is empty or invalid.'];
        }

        // 1. Try Python3 with pypdf (Handles AES-256, AES-128, RC4)
        $pyCode = 'import sys; from pypdf import PdfReader, PdfWriter;
in_f, out_f, pw = sys.argv[1], sys.argv[2], sys.argv[3];
r = PdfReader(in_f);
if r.is_encrypted:
    res = r.decrypt(pw);
    if res == 0:
        print("INCORRECT_PASSWORD");
        sys.exit(2);
if len(r.pages) == 0:
    print("EMPTY_PAGES");
    sys.exit(3);
w = PdfWriter();
w.append(r);
with open(out_f, "wb") as f: w.write(f);
';
        $cmd = 'python3 -c ' . escapeshellarg($pyCode) . ' '
            . escapeshellarg($inputFile) . ' '
            . escapeshellarg($outputFile) . ' '
            . escapeshellarg($password) . ' 2>&1';
        
        exec($cmd, $out, $code);
        $outStr = implode("\n", $out);
        if ($code === 2 || str_contains($outStr, 'INCORRECT_PASSWORD')) {
            return ['success' => false, 'error' => 'Incorrect password. Please verify and try again.'];
        }
        if ($code === 0 && file_exists($outputFile) && filesize($outputFile) > 0) {
            return ['success' => true];
        }

        // 2. Fallback to Ghostscript ONLY if not a wrong password
        $gsArgs = [
            '-sDEVICE=pdfwrite',
            '-dCompatibilityLevel=1.7',
            '-dNOPAUSE',
            '-dQUIET',
            '-dBATCH',
            "-sPDFPassword={$password}",
            "-sOutputFile={$outputFile}",
            $inputFile
        ];

        if (self::runGhostscript($gsArgs) && file_exists($outputFile) && filesize($outputFile) > 500) {
            $checkCmd = 'python3 -c "from pypdf import PdfReader; r = PdfReader(\"' . addslashes($outputFile) . '\"); print(len(r.pages))" 2>/dev/null';
            $pageCount = (int)trim(shell_exec($checkCmd) ?? '0');
            if ($pageCount > 0) {
                return ['success' => true];
            }
        }

        return ['success' => false, 'error' => 'Incorrect password or unable to unlock this PDF.'];
    }

    public static function rotatePdfPages(string $inputFile, string $outputFile, int $defaultAngle, array $pageRotations = []): bool {
        // 1. Try Python3 with pypdf (Lossless, lightning fast dictionary rotation for all PDF versions)
        $pyCode = 'import sys, json; from pypdf import PdfReader, PdfWriter;
in_f, out_f, def_angle, rots_str = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4];
rots = json.loads(rots_str) if rots_str else {};
r = PdfReader(in_f);
w = PdfWriter();
for idx, page in enumerate(r.pages):
    p_num = str(idx + 1);
    ang = int(rots.get(p_num, def_angle));
    if ang % 360 != 0:
        page.rotate(ang);
    w.add_page(page);
with open(out_f, "wb") as f: w.write(f);
';
        $cmd = 'python3 -c ' . escapeshellarg($pyCode) . ' '
            . escapeshellarg($inputFile) . ' '
            . escapeshellarg($outputFile) . ' '
            . escapeshellarg((string) $defaultAngle) . ' '
            . escapeshellarg(!empty($pageRotations) ? json_encode($pageRotations) : '{}') . ' 2>&1';

        exec($cmd, $out, $code);
        if ($code === 0 && file_exists($outputFile) && filesize($outputFile) > 0) {
            return true;
        }

        // 2. Fallback to FPDI / FPDF
        try {
            $pdf = self::createPdf();
            $pageCount = $pdf->setSourceFile($inputFile);
            for ($p = 1; $p <= $pageCount; $p++) {
                $tpl = $pdf->importPage($p);
                $size = $pdf->getTemplateSize($tpl);
                $curAngle = isset($pageRotations[$p]) 
                    ? ((int) $pageRotations[$p] % 360 + 360) % 360 
                    : (isset($pageRotations[(string)$p]) ? ((int) $pageRotations[(string)$p] % 360 + 360) % 360 : $defaultAngle);

                $w = $size['width'];
                $h = $size['height'];
                if ($curAngle % 180 !== 0) {
                    $orientation = ($h > $w) ? 'L' : 'P';
                    $pdf->AddPage($orientation, [$h, $w]);
                    $pdf->rotate($curAngle, $h / 2, $w / 2);
                    $pdf->useTemplate($tpl, ($h - $w) / 2, ($w - $h) / 2);
                    $pdf->rotate(0);
                } else {
                    $orientation = ($w > $h) ? 'L' : 'P';
                    $pdf->AddPage($orientation, [$w, $h]);
                    if ($curAngle === 180) {
                        $pdf->rotate(180, $w / 2, $h / 2);
                    }
                    $pdf->useTemplate($tpl);
                    $pdf->rotate(0);
                }
            }
            $pdf->Output('F', $outputFile);
            return file_exists($outputFile) && filesize($outputFile) > 0;
        } catch (Throwable $e) {
            return false;
        }
    }

    public static function createDocxFromText(string $text, string $title = 'Converted Document'): string {
        $tempZip = tempnam(sys_get_temp_dir(), 'docx_') . '.docx';
        $zip = new ZipArchive();
        if ($zip->open($tempZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>');

            $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>');

            $paragraphs = explode("\n", $text);
            $pXml = '';
            foreach ($paragraphs as $p) {
                $cleanP = htmlspecialchars(trim($p), ENT_XML1, 'UTF-8');
                if ($cleanP !== '') {
                    $pXml .= "<w:p><w:r><w:t>{$cleanP}</w:t></w:r></w:p>";
                } else {
                    $pXml .= "<w:p/>";
                }
            }

            $documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>' . $pXml . '<w:sectPr/></w:body>
</w:document>';

            $zip->addFromString('word/document.xml', $documentXml);
            $zip->close();
            return file_get_contents($tempZip);
        }
        return '';
    }

    public static function createPptxFromSlides(array $slides): string {
        $tempZip = tempnam(sys_get_temp_dir(), 'pptx_') . '.pptx';
        $zip = new ZipArchive();
        if ($zip->open($tempZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $zip->addFromString('[Content_Types].xml',
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>');
            $zip->addFromString('_rels/.rels',
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>');

            $rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slide1.xml"/>
</Relationships>';
            $zip->addFromString('ppt/_rels/presentation.xml.rels', $rels);

            $slideList = [];
            $numSlides = max(1, count($slides));
            for ($i = 0; $i < $numSlides; $i++) {
                $slideId = $i + 1;
                $content = $slides[$i] ?? 'Slide ' . $slideId;
                $content = str_replace(["\r\n", "\r"], "\n", (string) $content);
                $lines = array_filter(array_map('trim', explode("\n", $content)), fn($l) => $l !== '');
                if (empty($lines)) $lines = ['Slide ' . $slideId];

                $textBody = '';
                foreach ($lines as $idx => $line) {
                    $clean = htmlspecialchars(mb_substr($line, 0, 300), ENT_XML1, 'UTF-8');
                    $size = $idx === 0 ? 2800 : 1800;
                    $bold = $idx === 0 ? '1' : '0';
                    $textBody .= "<a:p><a:pPr lvl=\"0\"/><a:r><a:rPr lang=\"en-US\" sz=\"{$size}\" b=\"{$bold}\"/><a:t>{$clean}</a:t></a:r><a:endParaRPr lang=\"en-US\" sz=\"1200\"/></a:p>";
                }

                $slideXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    <p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="457200" y="457200"/><a:ext cx="8229600" cy="609600"/></a:xfrm></p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="3200" b="1"/><a:t>Slide ' . $slideId . '</a:t></a:r></a:p></p:txBody>
    </p:sp>
    <p:sp><p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="457200" y="1143000"/><a:ext cx="8229600" cy="5029200"/></a:xfrm></p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/>' . $textBody . '</p:txBody>
    </p:sp>
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>';

                $zip->addFromString("ppt/slides/slide{$slideId}.xml", $slideXml);
                $slideList[] = $slideId;
                if ($i >= 50) break; // safety cap
            }

            $sldIdLst = '';
            $sldIdMap = '';
            foreach ($slideList as $i => $sid) {
                $rid = "rId{$sid}";
                $sldIdLst .= "<p:sldId id=\"256\" r:id=\"{$rid}\"/>";
                $sldIdMap .= "<Relationship Id=\"{$rid}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide\" Target=\"slides/slide{$sid}.xml\"/>";
            }

            $presentationXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdM"/></p:sldMasterIdLst>
  <p:sldIdLst>' . $sldIdLst . '</p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>';
            $zip->addFromString('ppt/presentation.xml', $presentationXml);

            $presRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdM" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ' . $sldIdMap . '
</Relationships>';
            $zip->addFromString('ppt/_rels/presentation.xml.rels', $presRels);

            // Minimal slide master so PowerPoint can open the file.
            $zip->addFromString('ppt/slideMasters/slideMaster1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></p:bgPr></p:bg><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rIdL"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>');
            $zip->addFromString('ppt/slideMasters/_rels/slideMaster1.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdL" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>');
            $zip->addFromString('ppt/slideLayouts/slideLayout1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>');

            $zip->close();
            return file_get_contents($tempZip);
        }
        return '';
    }

    public static function cropPdf(string $inputFile, string $outputFile, float $top, float $bottom, float $left, float $right, string $scope = 'all'): bool {
        if (!file_exists($inputFile) || filesize($inputFile) < 10) return false;
        
        $top = max(0, min($top, 250));
        $bottom = max(0, min($bottom, 250));
        $left = max(0, min($left, 250));
        $right = max(0, min($right, 250));

        // 1. Try Python3 with pypdf (Lossless, perfect precision for all PDF versions)
        $pyCode = 'import sys; from pypdf import PdfReader, PdfWriter;
in_f, out_f = sys.argv[1], sys.argv[2];
top, bottom, left, right = float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), float(sys.argv[6]);
scope = sys.argv[7] if len(sys.argv) > 7 else "all";
r = PdfReader(in_f);
w = PdfWriter();
for idx, p in enumerate(r.pages):
    if scope == "first" and idx > 0:
        w.add_page(p);
        continue;
    w_pt = float(p.mediabox.width);
    h_pt = float(p.mediabox.height);
    eff_l = min(left, max(0.0, (w_pt - 20.0) / 2.0));
    eff_r = min(right, max(0.0, (w_pt - 20.0) / 2.0));
    eff_t = min(top, max(0.0, (h_pt - 20.0) / 2.0));
    eff_b = min(bottom, max(0.0, (h_pt - 20.0) / 2.0));
    p.mediabox.left += eff_l;
    p.mediabox.bottom += eff_b;
    p.mediabox.right -= eff_r;
    p.mediabox.top -= eff_t;
    p.cropbox.left = p.mediabox.left;
    p.cropbox.bottom = p.mediabox.bottom;
    p.cropbox.right = p.mediabox.right;
    p.cropbox.top = p.mediabox.top;
    w.add_page(p);
with open(out_f, "wb") as f: w.write(f);
';
        $cmd = 'python3 -c ' . escapeshellarg($pyCode) . ' '
            . escapeshellarg($inputFile) . ' '
            . escapeshellarg($outputFile) . ' '
            . escapeshellarg((string) $top) . ' '
            . escapeshellarg((string) $bottom) . ' '
            . escapeshellarg((string) $left) . ' '
            . escapeshellarg((string) $right) . ' '
            . escapeshellarg($scope) . ' 2>&1';
        
        exec($cmd, $out, $code);
        if ($code === 0 && file_exists($outputFile) && filesize($outputFile) > 50) {
            return true;
        }

        // 2. Fallback to Ghostscript normalization + FPDI
        try {
            $repaired = tempnam('/tmp', 'crop_norm_') . '.pdf';
            $gsArgs = [
                '-sDEVICE=pdfwrite',
                '-dCompatibilityLevel=1.4',
                '-dNOPAUSE',
                '-dQUIET',
                '-dBATCH',
                "-sOutputFile={$repaired}",
                $inputFile
            ];
            $hasNorm = self::runGhostscript($gsArgs) && file_exists($repaired) && filesize($repaired) > 0;
            $src = $hasNorm ? $repaired : $inputFile;

            $pdf = self::createPdf();
            $pageCount = $pdf->setSourceFile($src);
            for ($p = 1; $p <= $pageCount; $p++) {
                $tpl = $pdf->importPage($p);
                $size = $pdf->getTemplateSize($tpl);
                $cw = $size['width'];
                $ch = $size['height'];
                if ($scope === 'first' && $p > 1) {
                    $pdf->AddPage(($cw >= $ch) ? 'L' : 'P', [$cw, $ch]);
                    $pdf->useTemplate($tpl);
                } else {
                    $effLeft = min($left, max(0.0, ($cw - 20) / 2));
                    $effRight = min($right, max(0.0, ($cw - 20) / 2));
                    $effTop = min($top, max(0.0, ($ch - 20) / 2));
                    $effBottom = min($bottom, max(0.0, ($ch - 20) / 2));
                    $newW = max(20, $cw - ($effLeft + $effRight));
                    $newH = max(20, $ch - ($effTop + $effBottom));
                    $orientation = ($newW >= $newH) ? 'L' : 'P';
                    $pdf->AddPage($orientation, [$newW, $newH]);
                    $pdf->useTemplate($tpl, -$effLeft, -$effTop, $cw, $ch);
                }
            }
            $pdf->Output('F', $outputFile);
            if ($hasNorm) @unlink($repaired);
            return file_exists($outputFile) && filesize($outputFile) > 50;
        } catch (Throwable $e) {
            return false;
        }
    }

    public static function generatePdfForm(string $inputFile, string $outputFile, array $options = []): bool {
        if (!file_exists($inputFile) || filesize($inputFile) < 10) return false;

        $preset = $options['preset'] ?? 'contact';
        $placement = $options['placement'] ?? 'append';
        $title = !empty($options['title']) ? $options['title'] : 'Fillable Form Document';
        $incSig = $options['includeSignature'] ?? true;
        $incCb = $options['includeCheckbox'] ?? true;
        $incDate = $options['includeDate'] ?? true;
        $incEmail = $options['includeEmail'] ?? true;
        $incPhone = $options['includePhone'] ?? true;

        try {
            $repaired = tempnam('/tmp', 'form_norm_') . '.pdf';
            $gsArgs = [
                '-sDEVICE=pdfwrite',
                '-dCompatibilityLevel=1.4',
                '-dNOPAUSE',
                '-dQUIET',
                '-dBATCH',
                "-sOutputFile={$repaired}",
                $inputFile
            ];
            $hasNorm = self::runGhostscript($gsArgs) && file_exists($repaired) && filesize($repaired) > 0;
            $src = $hasNorm ? $repaired : $inputFile;

            $pdf = self::createPdf();
            $pageCount = $pdf->setSourceFile($src);

            if ($placement === 'overlay_first') {
                for ($p = 1; $p <= $pageCount; $p++) {
                    $tpl = $pdf->importPage($p);
                    $size = $pdf->getTemplateSize($tpl);
                    $pdf->AddPage(($size['width'] >= $size['height']) ? 'L' : 'P', [$size['width'], $size['height']]);
                    $pdf->useTemplate($tpl);
                    if ($p === 1) {
                        self::renderFormBlock($pdf, $title, $preset, $incSig, $incCb, $incDate, $incEmail, $incPhone, 15, max(15, $size['height'] - 80), $size['width'] - 30);
                    }
                }
            } elseif ($placement === 'overlay_last') {
                for ($p = 1; $p <= $pageCount; $p++) {
                    $tpl = $pdf->importPage($p);
                    $size = $pdf->getTemplateSize($tpl);
                    $pdf->AddPage(($size['width'] >= $size['height']) ? 'L' : 'P', [$size['width'], $size['height']]);
                    $pdf->useTemplate($tpl);
                    if ($p === $pageCount) {
                        self::renderFormBlock($pdf, $title, $preset, $incSig, $incCb, $incDate, $incEmail, $incPhone, 15, max(15, $size['height'] - 80), $size['width'] - 30);
                    }
                }
            } else {
                // Default: 'append' as a dedicated pristine form sheet
                for ($p = 1; $p <= $pageCount; $p++) {
                    $tpl = $pdf->importPage($p);
                    $size = $pdf->getTemplateSize($tpl);
                    $pdf->AddPage(($size['width'] >= $size['height']) ? 'L' : 'P', [$size['width'], $size['height']]);
                    $pdf->useTemplate($tpl);
                }

                // Add dedicated full-page form sheet
                $pdf->AddPage('P', 'A4');
                self::renderDedicatedFormPage($pdf, $title, $preset, $incSig, $incCb, $incDate, $incEmail, $incPhone);
            }

            $pdf->Output('F', $outputFile);
            if ($hasNorm) @unlink($repaired);
            return file_exists($outputFile) && filesize($outputFile) > 50;
        } catch (Throwable $e) {
            return false;
        }
    }

    public static function renderDedicatedFormPage($pdf, string $title, string $preset, bool $incSig, bool $incCb, bool $incDate, bool $incEmail, bool $incPhone): void {
        $pdf->SetAutoPageBreak(false);
        $w = 210;
        
        // Header Banner
        $pdf->SetFillColor(248, 250, 252);
        $pdf->Rect(0, 0, $w, 36, 'F');
        
        $pdf->SetFillColor(229, 36, 36);
        $pdf->Rect(0, 36, $w, 2, 'F');

        $pdf->SetXY(20, 10);
        $pdf->SetFont('Helvetica', 'B', 15);
        $pdf->SetTextColor(30, 41, 59);
        $safeTitle = iconv('UTF-8', 'windows-1252//TRANSLIT', $title) ?: 'Fillable Information & Form Fields';
        $pdf->Cell(170, 8, $safeTitle, 0, 1, 'L');

        $pdf->SetXY(20, 19);
        $pdf->SetFont('Helvetica', '', 8.5);
        $pdf->SetTextColor(100, 116, 139);
        $subtitle = 'Please fill out the information fields below accurately. Retain a signed copy for your documentation.';
        $pdf->Cell(170, 6, $subtitle, 0, 1, 'L');

        $y = 48;

        // Build list of fields based on preset & flags
        $fields = [];
        if ($preset === 'approval') {
            $fields[] = ['Approver Full Name', 'e.g. John Doe, Lead Auditor'];
            $fields[] = ['Department / Division', 'e.g. Operations & Compliance'];
            if ($incEmail) $fields[] = ['Official Email', 'name@organization.com'];
            if ($incDate) $fields[] = ['Approval Date', 'YYYY-MM-DD'];
            $fields[] = ['Reference Code / PO #', 'Optional internal identifier'];
        } elseif ($preset === 'agreement') {
            $fields[] = ['Authorized Representative', 'Full legal name'];
            $fields[] = ['Company / Entity Name', 'Registered legal entity'];
            if ($incEmail) $fields[] = ['Business Email', 'partner@domain.com'];
            if ($incPhone) $fields[] = ['Telephone Number', '+1 (555) 000-0000'];
            if ($incDate) $fields[] = ['Effective Date', 'YYYY-MM-DD'];
        } else {
            // Default contact / registration
            $fields[] = ['Full Name', 'Enter applicant / recipient legal name'];
            if ($incEmail) $fields[] = ['Email Address', 'user@example.com'];
            if ($incPhone) $fields[] = ['Phone Number', '+1 (555) 000-0000'];
            $fields[] = ['Company / Organization', 'Company or Institute'];
            if ($incDate) $fields[] = ['Submission Date', 'YYYY-MM-DD'];
        }

        foreach ($fields as $f) {
            [$label, $placeholder] = $f;
            $pdf->SetFont('Helvetica', 'B', 8.5);
            $pdf->SetTextColor(51, 65, 85);
            $pdf->SetXY(20, $y);
            $pdf->Cell(170, 5, $label, 0, 1);
            $y += 5.5;

            // Box for field input
            $pdf->SetFillColor(255, 255, 255);
            $pdf->SetDrawColor(203, 213, 225);
            $pdf->SetLineWidth(0.3);
            $pdf->Rect(20, $y, 170, 9, 'DF');

            // Placeholder hint in light gray
            $pdf->SetFont('Helvetica', 'I', 7.5);
            $pdf->SetTextColor(160, 174, 192);
            $pdf->SetXY(23, $y + 1.8);
            $pdf->Cell(164, 5, $placeholder, 0, 0);

            $y += 13;
        }

        // Checkbox Section
        if ($incCb) {
            $y += 2;
            $pdf->SetFillColor(255, 255, 255);
            $pdf->SetDrawColor(148, 163, 184);
            $pdf->SetLineWidth(0.4);
            $pdf->Rect(20, $y + 0.5, 4.5, 4.5, 'D');

            $pdf->SetFont('Helvetica', '', 8);
            $pdf->SetTextColor(71, 85, 105);
            $pdf->SetXY(27, $y);
            $cbText = ($preset === 'approval') 
                ? 'I have reviewed the attached document and confirm this submission is formally approved.'
                : 'I hereby confirm that the information provided in this document is authentic and accurate.';
            $pdf->MultiCell(163, 4.5, $cbText, 0, 'L');
            $y += 12;
        }

        // Signature and Date Box
        if ($incSig && $y < 235) {
            $y += 4;
            $pdf->SetFillColor(250, 250, 252);
            $pdf->SetDrawColor(226, 232, 240);
            $pdf->SetLineWidth(0.4);
            $pdf->Rect(20, $y, 170, 34, 'DF');

            $pdf->SetDrawColor(229, 36, 36);
            $pdf->SetLineWidth(0.8);
            $pdf->Line(20, $y, 20, $y + 34);

            $pdf->SetFont('Helvetica', 'B', 8.5);
            $pdf->SetTextColor(30, 41, 59);
            $pdf->SetXY(25, $y + 4);
            $pdf->Cell(80, 5, 'Authorized Signature', 0, 0);
            $pdf->SetXY(115, $y + 4);
            $pdf->Cell(70, 5, 'Date Signed', 0, 1);

            $pdf->SetDrawColor(180, 190, 205);
            $pdf->SetLineWidth(0.3);
            $pdf->Line(25, $y + 24, 105, $y + 24);
            $pdf->Line(115, $y + 24, 185, $y + 24);

            $pdf->SetFont('Helvetica', 'I', 7);
            $pdf->SetTextColor(148, 163, 184);
            $pdf->SetXY(25, $y + 26);
            $pdf->Cell(80, 4, 'Sign above the line (digital or physical sign-off)', 0, 0);
            $pdf->SetXY(115, $y + 26);
            $pdf->Cell(70, 4, 'YYYY-MM-DD', 0, 0);
        }
    }

    public static function renderFormBlock($pdf, string $title, string $preset, bool $incSig, bool $incCb, bool $incDate, bool $incEmail, bool $incPhone, float $x, float $y, float $width): void {
        $pdf->SetFillColor(255, 255, 255);
        $pdf->SetDrawColor(220, 226, 235);
        $pdf->SetLineWidth(0.4);
        $cardH = 65;
        $pdf->Rect($x, $y, $width, $cardH, 'DF');

        // Top accent
        $pdf->SetFillColor(229, 36, 36);
        $pdf->Rect($x, $y, $width, 1.5, 'F');

        $pdf->SetXY($x + 5, $y + 4);
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->SetTextColor(30, 41, 59);
        $safeTitle = iconv('UTF-8', 'windows-1252//TRANSLIT', $title) ?: 'Fillable Information & Form Fields';
        $pdf->Cell($width - 10, 5, $safeTitle, 0, 1);

        $colW = ($width - 15) / 2;
        $curY = $y + 12;

        $pdf->SetFont('Helvetica', 'B', 7.5);
        $pdf->SetTextColor(71, 85, 105);

        // Row 1
        $pdf->SetXY($x + 5, $curY);
        $pdf->Cell($colW, 4, 'Full Name:', 0, 0);
        $pdf->SetDrawColor(203, 213, 225);
        $pdf->Line($x + 24, $curY + 3.5, $x + 5 + $colW, $curY + 3.5);

        $pdf->SetXY($x + 10 + $colW, $curY);
        $pdf->Cell($colW, 4, 'Email / Phone:', 0, 0);
        $pdf->Line($x + 10 + $colW + 24, $curY + 3.5, $x + 10 + ($colW * 2), $curY + 3.5);

        // Row 2
        $curY += 10;
        $pdf->SetXY($x + 5, $curY);
        $pdf->Cell($colW, 4, 'Organization:', 0, 0);
        $pdf->Line($x + 26, $curY + 3.5, $x + 5 + $colW, $curY + 3.5);

        $pdf->SetXY($x + 10 + $colW, $curY);
        $pdf->Cell($colW, 4, 'Date:', 0, 0);
        $pdf->Line($x + 10 + $colW + 14, $curY + 3.5, $x + 10 + ($colW * 2), $curY + 3.5);

        // Row 3: Signature
        $curY += 10;
        $pdf->SetXY($x + 5, $curY);
        $pdf->Cell($colW, 4, 'Signature:', 0, 0);
        $pdf->Line($x + 24, $curY + 12, $x + 5 + $colW, $curY + 12);

        if ($incCb) {
            $pdf->Rect($x + 10 + $colW, $curY + 1, 3.5, 3.5, 'D');
            $pdf->SetFont('Helvetica', '', 7);
            $pdf->SetXY($x + 15 + $colW, $curY);
            $pdf->Cell($colW - 5, 5, 'Verified & Confirmed True', 0, 0);
        }
    }
}

