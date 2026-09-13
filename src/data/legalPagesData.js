export const defaultPrivacyPolicy = {
  title: 'Privacy Policy',
  lastUpdated: 'Last updated: July 20, 2026 · We value your privacy and are committed to protecting your personal data.',
  contactEmail: 'privacy@ilovepdf.com',
  highlights: [
    { id: 1, label: '256-Bit Encryption', desc: 'All uploads are SSL encrypted in transit' },
    { id: 2, label: 'Auto File Delete', desc: 'Files deleted within 2 hours of processing' },
    { id: 3, label: 'No Selling Data', desc: 'We never sell your personal data to third parties' },
    { id: 4, label: 'Full Transparency', desc: 'Clear information about what data we collect' }
  ],
  sections: [
    {
      id: 1,
      title: '1. Information We Collect',
      body: `We collect the following types of information when you use iLovePDF:

• Account Information: Name, email address, and password when you register for an account.
• Usage Data: Pages processed, tools used, file sizes, and timestamps — used to improve our service.
• Uploaded Files: Temporarily stored only during processing. Files are permanently deleted within 2 hours.
• Device & Browser Data: IP address, browser type, operating system — used for security and analytics.
• Payment Information: Processed securely by our payment provider (Stripe). We do not store card details.`
    },
    {
      id: 2,
      title: '2. How We Use Your Information',
      body: `Your information is used exclusively for:

• Providing and improving our PDF processing services.
• Processing transactions and managing your subscription.
• Sending account-related communications (receipts, security alerts).
• Analyzing aggregate usage data to enhance performance (never individual file content).
• Complying with legal obligations and preventing fraud.`
    },
    {
      id: 3,
      title: '3. Information Sharing',
      body: `We do not sell, trade, or share your personal data with third parties except:

• Service Providers: Trusted partners (e.g. payment processors, cloud infrastructure) who assist in our operations under strict confidentiality agreements.
• Legal Requirements: When required by law, court order, or governmental authority.
• Business Transfers: In the event of a merger or acquisition, with equivalent privacy protections.`
    },
    {
      id: 4,
      title: '4. Data Security',
      body: `We implement industry-standard security measures including:

• 256-bit SSL/TLS encryption for all data transmissions.
• Automatic deletion of uploaded files within 2 hours of processing.
• Access controls limiting staff access to personal data.
• Regular security audits and vulnerability assessments.

No method of transmission or storage is 100% secure. In the event of a data breach affecting your rights, we will notify you within 72 hours as required by GDPR.`
    },
    {
      id: 5,
      title: '5. Cookies & Tracking',
      body: `We use cookies to:

• Keep you logged in to your account (session cookies).
• Remember your language and display preferences.
• Analyze usage patterns through anonymized analytics (Google Analytics with IP anonymization enabled).

You can disable cookies through your browser settings, but some features may not function correctly. We do not use cookies for advertising or cross-site tracking.`
    },
    {
      id: 6,
      title: '6. Your Rights & Contact',
      body: `Under applicable data protection laws (including GDPR and CCPA), you have the right to:

• Access, correct, or delete your personal data.
• Restrict or object to our processing of your personal data.
• Request data portability.
• Withdraw consent at any time where processing was based on consent.`
    }
  ]
};

export const defaultTermsAndConditions = {
  title: 'Terms and Conditions',
  lastUpdated: 'Last updated: July 20, 2026 · Effective immediately',
  contactEmail: 'legal@ilovepdf.com',
  sections: [
    {
      id: 1,
      title: '1. Acceptance of Terms',
      body: `By accessing or using iLovePDF ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service. These terms apply to all users including visitors, free users, and premium subscribers.`
    },
    {
      id: 2,
      title: '2. Description of Service',
      body: `iLovePDF provides online PDF processing tools including but not limited to: merging, splitting, compressing, converting, rotating, watermarking, protecting, and extracting text from PDF documents. The Service is provided "as is" and may be updated or modified at any time without prior notice.`
    },
    {
      id: 3,
      title: '3. User Responsibilities',
      body: `You are solely responsible for the files you upload and process through the Service. You agree not to upload files that contain illegal content, malware, copyrighted materials you do not own, or any content that violates applicable laws. You are responsible for maintaining the confidentiality of your account credentials.`
    },
    {
      id: 4,
      title: '4. Intellectual Property',
      body: `All content, design, code, logos, and trademarks on iLovePDF are the exclusive property of iLovePDF. You may not copy, reproduce, distribute, or create derivative works from our Service without express written permission. Your uploaded files remain your intellectual property — we do not claim ownership.`
    },
    {
      id: 5,
      title: '5. Data Retention & File Deletion',
      body: `Uploaded files are automatically and permanently deleted from our servers within 2 hours of processing. We do not store, share, or sell your file content. Premium accounts with cloud storage retain files as per their plan settings, which can be managed in the account dashboard.`
    },
    {
      id: 6,
      title: '6. Disclaimer of Warranties',
      body: `The Service is provided without any warranty of any kind, express or implied. iLovePDF does not guarantee uninterrupted service availability, accuracy of processing results, or fitness for a particular purpose. Use of the Service is at your own risk.`
    },
    {
      id: 7,
      title: '7. Limitation of Liability',
      body: `iLovePDF shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of the Service. In no event shall our total liability exceed the amount paid by you to iLovePDF in the 12 months prior to the claim.`
    },
    {
      id: 8,
      title: '8. Governing Law & Changes',
      body: `These Terms shall be governed by applicable laws. We reserve the right to update these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms. We will notify registered users of significant changes via email.`
    }
  ]
};

export const defaultSecurityPage = {
  title: 'Security & Data Protection',
  lastUpdated: 'Last updated: August 2026 · Built to meet enterprise-grade security standards',
  contactEmail: 'security@azpdf.com',
  badges: [
    { id: 1, title: '256-Bit SSL/TLS', desc: 'Bank-grade HTTPS encryption in transit' },
    { id: 2, title: 'Auto 2-Hour Purge', desc: 'Files irreversibly deleted after processing' },
    { id: 3, title: 'GDPR & CCPA Compliant', desc: 'Full compliance with global privacy regulations' },
    { id: 4, title: 'ISO 27001 Certified', desc: 'Information security management audited standards' }
  ],
  sections: [
    {
      id: 1,
      title: '1. End-to-End File Encryption',
      body: `Every document uploaded to our platform is encrypted during transfer using 256-bit Hypertext Transfer Protocol Secure (HTTPS) with TLS 1.3 protocol. At rest, documents are stored in encrypted partitions with isolated access barriers. Only automated processing worker routines interact with file data.`
    },
    {
      id: 2,
      title: '2. Strict 2-Hour Auto Deletion Policy',
      body: `Privacy is our foundational principle. Any document you upload, convert, merge, or process is automatically, permanently, and irreversibly deleted from our processing servers within 2 hours. We do not inspect, retain, or create backup copies of your uploaded documents.`
    },
    {
      id: 3,
      title: '3. Zero Third-Party Sharing',
      body: `We never sell, monetize, train machine learning models on, or transfer your document contents to any external party. All conversions (including PDF to Word, OCR, and compression) are executed on our own managed infrastructure with zero external telemetry.`
    },
    {
      id: 4,
      title: '4. Infrastructure & Vulnerability Management',
      body: `Our servers are hosted in SOC 2 Type II and ISO 27001 certified data centers with 24/7 biometric physical security, redundant network failovers, automated DDoS mitigation, and continuous penetration testing.`
    }
  ]
};

export const defaultAboutUs = {
  title: 'About azPDF',
  tagline: 'Empowering Millions Worldwide to Work with PDFs Effortlessly',
  mission: 'Our mission is to simplify document workflows for students, professionals, and enterprises around the globe by providing lightning-fast, secure, and intuitive PDF tools accessible from any device.',
  stats: [
    { id: 1, value: '100M+', label: 'Files Processed' },
    { id: 2, value: '99.99%', label: 'Uptime Reliability' },
    { id: 3, value: '180+', label: 'Countries Supported' },
    { id: 4, value: '100%', label: 'Free & Privacy-First' }
  ],
  story: `Founded with a simple belief: working with PDFs should not require expensive software or cumbersome installations. We built azPDF to deliver desktop-grade PDF power directly in your browser. Whether you are merging legal contracts, compressing school assignments, or converting spreadsheets, azPDF gives you instant results with zero hassle.`,
  values: [
    { id: 1, title: 'Privacy First', desc: 'Your files belong to you. We automatically purge all data within 2 hours of processing.' },
    { id: 2, title: 'Lightning Speed', desc: 'State-of-the-art WebAssembly and distributed cloud workers process large documents in seconds.' },
    { id: 3, title: 'Accessible to Everyone', desc: 'No installations, no confusing interfaces. Simple, accessible PDF tools on mobile, tablet, and desktop.' },
    { id: 4, title: 'Continuous Innovation', desc: 'Regularly updated with cutting-edge tools including AI summarization, optical character recognition (OCR), and digital signing.' }
  ]
};

export const defaultBlogPage = {
  title: 'The azPDF Blog',
  subtitle: 'Tips, tutorials, feature announcements, and best practices for modern document productivity.',
  categories: ['All', 'Tutorials', 'Security', 'Productivity', 'Company Updates'],
  posts: [
    {
      id: 1,
      title: 'How to Compress Large PDF Files Without Losing Print Quality',
      category: 'Tutorials',
      date: 'Aug 28, 2026',
      readTime: '4 min read',
      author: 'Technical Team',
      summary: 'Learn the difference between lossless image optimization and DPI downsampling to achieve maximum PDF compression ratios.',
      body: `PDF file sizes often balloon due to high-resolution embedded images, redundant font definitions, and uncompressed stream objects. In this comprehensive guide, we explain how our automated compression algorithm reduces file size by up to 80% while keeping text razor-sharp and images crisp for presentations and print.`
    },
    {
      id: 2,
      title: 'Top 5 PDF Security Best Practices for Remote Teams',
      category: 'Security',
      date: 'Aug 14, 2026',
      readTime: '5 min read',
      author: 'Security Officer',
      summary: 'Protect sensitive invoices, contracts, and business plans with password encryption, redaction, and access revocation.',
      body: `Working remotely requires heightened vigilance when sharing confidential documents. Never email sensitive spreadsheets without password encryption, verify that watermarks cannot be removed trivially, and always purge temporary files when sharing links.`
    },
    {
      id: 3,
      title: 'Introducing AI PDF Summarizer & Multi-Language Document Translation',
      category: 'Productivity',
      date: 'Jul 30, 2026',
      readTime: '3 min read',
      author: 'Product Team',
      summary: 'Extract executive summaries, action items, and translate 50+ languages directly from any scanned or digital PDF document.',
      body: `We are thrilled to launch our new AI Summarizer and Document Translator! Powered by state-of-the-art language models, you can now parse 100-page reports into bullet points in under 5 seconds, making document analysis faster than ever.`
    },
    {
      id: 4,
      title: 'Why Automatic File Purging is Essential for Document Privacy',
      category: 'Company Updates',
      date: 'Jul 12, 2026',
      readTime: '3 min read',
      author: 'Privacy Team',
      summary: 'A look inside our privacy-by-design architecture and why we permanently wipe processed files within 2 hours.',
      body: `Cloud storage is convenient, but permanent retention of customer documents creates unnecessary data liability. Discover why azPDF strictly enforces a 2-hour automated deletion protocol for all processed files.`
    }
  ]
};

export const defaultPressPage = {
  title: 'Press & Media Center',
  subtitle: 'Official news announcements, media resources, brand assets, and press inquiries for azPDF.',
  mediaContact: {
    email: 'press@azpdf.com',
    spokesperson: 'Media Relations Team',
    officeHours: 'Monday – Friday: 9:00 AM – 6:00 PM EST'
  },
  pressReleases: [
    {
      id: 1,
      date: 'August 15, 2026',
      title: 'azPDF Crosses 100 Million Documents Milestone with Industry-Leading Processing Speed',
      excerpt: 'azPDF announced today that its online PDF toolkit has processed over 100 million documents globally, backed by a 99.99% system uptime record.'
    },
    {
      id: 2,
      date: 'June 01, 2026',
      title: 'azPDF Rolls Out Next-Generation AI Document Processing Engine',
      excerpt: 'New AI features allow users to translate, extract tables, and summarize multi-page PDF documents instantaneously in the browser.'
    },
    {
      id: 3,
      date: 'March 10, 2026',
      title: 'azPDF Announces Comprehensive Enterprise Security & ISO Compliance Standards',
      excerpt: 'Platform enforces strict 2-hour automated data purge and 256-bit TLS 1.3 protocol encryption for all global users.'
    }
  ],
  brandAssets: [
    { id: 1, name: 'Primary azPDF Logo (Vector SVG & PNG)', format: 'SVG / PNG (High Res)', size: '2.4 MB' },
    { id: 2, name: 'Official Brand Color Guidelines & Typography Spec', format: 'PDF Document', size: '1.1 MB' },
    { id: 3, name: 'Product Screenshots & UI Mockups Suite', format: 'ZIP Archive', size: '18.6 MB' }
  ]
};
