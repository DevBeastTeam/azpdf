import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { 
  MergePdfIcon, SplitPdfIcon, CompressPdfIcon, PdfToWordIcon, 
  PdfToPowerpointIcon, PdfToExcelIcon, WordToPdfIcon, PowerpointToPdfIcon, 
  ExcelToPdfIcon, EditPdfIcon, PdfToJpgIcon, JpgToPdfIcon, 
  SignPdfIcon, WatermarkIcon, RotatePdfIcon, HtmlToPdfIcon, 
  UnlockPdfIcon, ProtectPdfIcon, OrganizePdfIcon, PdfToPdfaIcon, 
  RepairPdfIcon, PageNumbersIcon, ScanPdfIcon, OcrPdfIcon, 
  ComparePdfIcon, RedactPdfIcon, CropPdfIcon, PdfFormsIcon, 
  AiSummarizerIcon, TranslatePdfIcon, PdfToMarkdownIcon 
} from './Icons';

const toolsData = [
  {
    id: 'tool-merge',
    title: 'Merge PDF',
    desc: 'Combine PDFs in the order you want with the easiest PDF merger available.',
    category: 'organize',
    isWorkflow: true,
    colorClass: 'cat-organize',
    icon: MergePdfIcon
  },
  {
    id: 'tool-split',
    title: 'Split PDF',
    desc: 'Separate one page or a whole set for easy conversion into independent PDF files.',
    category: 'organize',
    isWorkflow: true,
    colorClass: 'cat-organize',
    icon: SplitPdfIcon
  },
  {
    id: 'tool-compress',
    title: 'Compress PDF',
    desc: 'Reduce file size while optimizing for maximal PDF quality.',
    category: 'optimize',
    isWorkflow: true,
    colorClass: 'cat-optimize',
    icon: CompressPdfIcon
  },
  {
    id: 'tool-pdftoword',
    title: 'PDF to Word',
    desc: 'Easily convert your PDF files into easy to edit DOC and DOCX documents. The converted WORD document is almost 100% accurate.',
    category: 'convert',
    isWorkflow: true,
    colorClass: 'cat-from-pdf',
    icon: PdfToWordIcon
  },
  {
    id: 'tool-pdftopowerpoint',
    title: 'PDF to PowerPoint',
    desc: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.',
    category: 'convert',
    isWorkflow: false,
    colorClass: 'cat-from-pdf',
    icon: PdfToPowerpointIcon
  },
  {
    id: 'tool-pdftoexcel',
    title: 'PDF to Excel',
    desc: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.',
    category: 'convert',
    isWorkflow: false,
    colorClass: 'cat-from-pdf',
    icon: PdfToExcelIcon
  },
  {
    id: 'tool-wordtopdf',
    title: 'Word to PDF',
    desc: 'Make DOC and DOCX files easy to read by converting them to PDF.',
    category: 'convert',
    isWorkflow: false,
    colorClass: 'cat-to-pdf',
    icon: WordToPdfIcon
  },
  {
    id: 'tool-powerpointtopdf',
    title: 'PowerPoint to PDF',
    desc: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.',
    category: 'convert',
    isWorkflow: false,
    colorClass: 'cat-to-pdf',
    icon: PowerpointToPdfIcon
  },
  {
    id: 'tool-exceltopdf',
    title: 'Excel to PDF',
    desc: 'Make EXCEL spreadsheets easy to read by converting them to PDF.',
    category: 'convert',
    isWorkflow: false,
    colorClass: 'cat-to-pdf',
    icon: ExcelToPdfIcon
  },
  {
    id: 'tool-edit',
    title: 'Edit PDF',
    desc: 'Add text, images, shapes or freehand annotations to a PDF document. Edit the size, font, and color of the added content.',
    category: 'edit',
    isWorkflow: true,
    colorClass: 'cat-edit',
    icon: EditPdfIcon
  },
  {
    id: 'tool-pdftojpg',
    title: 'PDF to JPG',
    desc: 'Convert each PDF page into a JPG or extract all images contained in a PDF.',
    category: 'convert',
    isWorkflow: false,
    colorClass: 'cat-from-pdf',
    icon: PdfToJpgIcon
  },
  {
    id: 'tool-jpgtopdf',
    title: 'JPG to PDF',
    desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.',
    category: 'convert',
    isWorkflow: false,
    colorClass: 'cat-to-pdf',
    icon: JpgToPdfIcon
  },
  {
    id: 'tool-sign',
    title: 'Sign PDF',
    desc: 'Sign yourself or request electronic signatures from others.',
    category: 'security',
    isWorkflow: true,
    colorClass: 'cat-security',
    icon: SignPdfIcon
  },
  {
    id: 'tool-watermark',
    title: 'Watermark',
    desc: 'Stamp an image or text over your PDF in seconds. Choose the typography, transparency and position.',
    category: 'edit',
    isWorkflow: false,
    colorClass: 'cat-edit',
    icon: WatermarkIcon
  },
  {
    id: 'tool-rotate',
    title: 'Rotate PDF',
    desc: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!',
    category: 'edit',
    isWorkflow: false,
    colorClass: 'cat-edit',
    icon: RotatePdfIcon
  },
  {
    id: 'tool-htmltopdf',
    title: 'HTML to PDF',
    desc: 'Convert webpages in HTML to PDF. Copy and paste the URL of the page you want and convert it to PDF with a click.',
    category: 'convert',
    isWorkflow: false,
    colorClass: 'cat-to-pdf',
    icon: HtmlToPdfIcon
  },
  {
    id: 'tool-unlock',
    title: 'Unlock PDF',
    desc: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.',
    category: 'security',
    isWorkflow: false,
    colorClass: 'cat-security',
    icon: UnlockPdfIcon
  },
  {
    id: 'tool-protect',
    title: 'Protect PDF',
    desc: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.',
    category: 'security',
    isWorkflow: false,
    colorClass: 'cat-security',
    icon: ProtectPdfIcon
  },
  {
    id: 'tool-organize',
    title: 'Organize PDF',
    desc: 'Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience.',
    category: 'organize',
    isWorkflow: false,
    colorClass: 'cat-organize',
    icon: OrganizePdfIcon
  },
  {
    id: 'tool-pdfa',
    title: 'PDF to PDF/A',
    desc: 'Transform your PDF to PDF/A, the ISO-standardized version of PDF for long-term archiving. Your PDF will preserve formatting when accessed in the future.',
    category: 'convert',
    isWorkflow: false,
    colorClass: 'cat-from-pdf',
    icon: PdfToPdfaIcon
  },
  {
    id: 'tool-repair',
    title: 'Repair PDF',
    desc: 'Repair a damaged PDF and recover data from corrupt PDF. Fix PDF files with our Repair tool.',
    category: 'optimize',
    isWorkflow: false,
    colorClass: 'cat-optimize',
    icon: RepairPdfIcon
  },
  {
    id: 'tool-pagenumber',
    title: 'Page numbers',
    desc: 'Add page numbers into PDFs with ease. Choose your positions, dimensions, typography.',
    category: 'edit',
    isWorkflow: false,
    colorClass: 'cat-edit',
    icon: PageNumbersIcon
  },
  {
    id: 'tool-scan',
    title: 'Scan to PDF',
    desc: 'Capture document scans from your mobile device and send them instantly to your browser.',
    category: 'organize',
    isWorkflow: false,
    colorClass: 'cat-organize',
    icon: ScanPdfIcon
  },
  {
    id: 'tool-ocr',
    title: 'OCR PDF',
    desc: 'Easily convert scanned PDF into searchable and selectable documents.',
    category: 'optimize',
    isWorkflow: false,
    colorClass: 'cat-optimize',
    icon: OcrPdfIcon
  },
  {
    id: 'tool-compare',
    title: 'Compare PDF',
    desc: 'Show a side-by-side document comparison and easily spot changes between different file versions.',
    category: 'security',
    isWorkflow: false,
    colorClass: 'cat-security',
    icon: ComparePdfIcon
  },
  {
    id: 'tool-redact',
    title: 'Redact PDF',
    desc: 'Redact text and graphics to permanently remove sensitive information from a PDF.',
    category: 'security',
    isWorkflow: false,
    colorClass: 'cat-security',
    icon: RedactPdfIcon
  },
  {
    id: 'tool-crop',
    title: 'Crop PDF',
    desc: 'Crop margins of PDF documents or select specific areas, then apply the changes to one page or the whole document.',
    category: 'edit',
    isWorkflow: false,
    colorClass: 'cat-edit',
    icon: CropPdfIcon
  },
  {
    id: 'tool-forms',
    title: 'PDF Forms',
    desc: 'Detect form fields automatically, create interactive fillable PDFs, or fill PDF forms yourself. Add text fields, checkboxes, multiple choice fields, and lists.',
    category: 'edit',
    isWorkflow: false,
    colorClass: 'cat-edit',
    icon: PdfFormsIcon
  },
  {
    id: 'tool-aisummarizer',
    title: 'AI Summarizer',
    desc: 'Quickly generate concise summaries from articles, paragraphs, and essays, providing clear and precise key points in seconds.',
    category: 'intelligence',
    isWorkflow: true,
    colorClass: 'cat-intelligence',
    icon: AiSummarizerIcon
  },
  {
    id: 'tool-translate',
    title: 'Translate PDF',
    desc: 'Translate PDF files into multiple languages instantly using AI-powered translations.',
    category: 'intelligence',
    isWorkflow: false,
    colorClass: 'cat-intelligence',
    icon: TranslatePdfIcon
  },
  {
    id: 'tool-markdown',
    title: 'PDF to Markdown',
    desc: 'Convert rich PDFs to structural Markdown formatting for clean editing.',
    category: 'intelligence',
    isWorkflow: false,
    colorClass: 'cat-intelligence',
    icon: PdfToMarkdownIcon
  }
];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'organize', label: 'Organize PDF' },
  { id: 'optimize', label: 'Optimize PDF' },
  { id: 'convert', label: 'Convert PDF' },
  { id: 'edit', label: 'Edit PDF' },
  { id: 'security', label: 'PDF Security' },
  { id: 'intelligence', label: 'PDF Intelligence' }
];

export default function ToolsGrid({ onSelectTool }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    return toolsData.filter(tool => {
      // Category filter
      let matchesCategory = true;
      if (activeCategory === 'workflows') {
        matchesCategory = tool.isWorkflow;
      } else if (activeCategory !== 'all') {
        if (activeCategory === 'convert') {
          matchesCategory = tool.category === 'convert';
        } else {
          matchesCategory = tool.category === activeCategory;
        }
      }

      // Search filter
      const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tool.desc.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div>
      {/* Search Bar */}
      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          placeholder="Search PDF tools..." 
          className="search-input" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Category Tabs */}
      <div className="filter-bar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`filter-tag ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="tools-grid">
        {filteredTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <div 
              key={tool.id} 
              className={`tool-card ${tool.colorClass}`}
              onClick={() => onSelectTool(tool)}
              style={{ cursor: 'pointer' }}
            >
              <div className="tool-card-icon">
                <IconComponent style={{ width: '100%', height: '100%' }} />
              </div>
              <h3 className="tool-card-title">{tool.title}</h3>
              <p className="tool-card-desc">{tool.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
