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
                    $clean = strip_tags(str_replace(['</w:p>', '</w:tr>'], ["\n", "\n"], $xml));
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
                    foreach ($xmlObj->si as $val) {
                        $sharedStrings[] = (string) ($val->t ?? ($val->r ? $val->r->t : ''));
                    }
                }

                $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
                $zip->close();

                if ($sheetXml) {
                    $sheetObj = simplexml_load_string($sheetXml);
                    foreach ($sheetObj->sheetData->row as $r) {
                        $row = [];
                        foreach ($r->c as $c) {
                            $type = (string) $c['t'];
                            $val = (string) $c->v;
                            if ($type === 's' && isset($sharedStrings[(int) $val])) {
                                $row[] = $sharedStrings[(int) $val];
                            } else {
                                $row[] = $val;
                            }
                        }
                        if (!empty($row)) {
                            $rows[] = $row;
                        }
                    }
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
        $cmd = 'gs ' . implode(' ', array_map('escapeshellarg', $args)) . ' 2>&1';
        exec($cmd, $out, $code);
        return $code === 0;
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
