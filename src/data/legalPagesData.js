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
      body: `These Terms shall be governed by the laws of Spain. We reserve the right to update these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms. We will notify registered users of significant changes via email.`
    }
  ]
};
