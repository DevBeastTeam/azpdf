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
        // 1. Try Python3 with pypdf (Industry standard AES-256 encryption)
        $pyCode = 'import sys; from pypdf import PdfReader, PdfWriter;
in_f, out_f, pw = sys.argv[1], sys.argv[2], sys.argv[3];
r = PdfReader(in_f);
w = PdfWriter();
for p in r.pages: w.add_page(p);
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
        // 1. Try Python3 with pypdf (Handles AES-256, AES-128, RC4)
        $pyCode = 'import sys; from pypdf import PdfReader, PdfWriter;
in_f, out_f, pw = sys.argv[1], sys.argv[2], sys.argv[3];
r = PdfReader(in_f);
if r.is_encrypted:
    res = r.decrypt(pw);
    if res == 0:
        print("INCORRECT_PASSWORD");
        sys.exit(2);
w = PdfWriter();
for p in r.pages: w.add_page(p);
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

        // 2. Fallback to Ghostscript
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

        if (self::runGhostscript($gsArgs) && file_exists($outputFile) && filesize($outputFile) > 0) {
            return ['success' => true];
        }

        return ['success' => false, 'error' => 'Incorrect password or unable to unlock this PDF.'];
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
}
