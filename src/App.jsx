import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolsGrid from './components/ToolsGrid';
import ToolWorkspace from './components/ToolWorkspace';
import Pricing from './components/Pricing';
import ContactUs from './components/ContactUs';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [theme, setTheme] = useState('light');
  const [currentView, setCurrentView] = useState('home');
  const [activeTool, setActiveTool] = useState(null);

  // Sync theme with DOM documentElement attributes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSelectTool = (tool) => {
    setActiveTool(tool);
    setCurrentView(tool.id);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setActiveTool(null);
  };

  const handleSetViewFromNav = (viewName) => {
    if (viewName === 'home') {
      handleBackToHome();
    } else if (viewName === 'contact') {
      setCurrentView('contact');
    } else if (viewName.startsWith('tool-')) {
      const toolId = viewName;
      let title = 'PDF Tool';
      let desc = 'Work with PDF files easily and securely.';
      
      if (toolId === 'tool-merge') {
        title = 'Merge PDF';
        desc = 'Combine PDFs in the order you want with the easiest PDF merger available.';
      } else if (toolId === 'tool-split') {
        title = 'Split PDF';
        desc = 'Separate one page or a whole set for easy conversion into independent PDF files.';
      } else if (toolId === 'tool-compress') {
        title = 'Compress PDF';
        desc = 'Reduce file size while optimizing for maximal PDF quality.';
      } else if (toolId === 'tool-pdftoword') {
        title = 'PDF to Word';
        desc = 'Easily convert your PDF files into easy to edit DOC and DOCX documents.';
      } else if (toolId === 'tool-pdftoexcel') {
        title = 'PDF to Excel';
        desc = 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.';
      } else if (toolId === 'tool-wordtopdf') {
        title = 'Word to PDF';
        desc = 'Make DOC and DOCX files easy to read by converting them to PDF.';
      } else if (toolId === 'tool-exceltopdf') {
        title = 'Excel to PDF';
        desc = 'Make EXCEL spreadsheets easy to read by converting them to PDF.';
      } else if (toolId === 'tool-organize') {
        title = 'Organize PDF';
        desc = 'Sort, add, delete, or rotate PDF pages in a document at your convenience.';
      } else if (toolId === 'tool-protect') {
        title = 'Protect PDF';
        desc = 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.';
      } else if (toolId === 'tool-unlock') {
        title = 'Unlock PDF';
        desc = 'Remove PDF password security, giving you the freedom to use your files as you want.';
      } else if (toolId === 'tool-aisummarizer') {
        title = 'AI Summarizer';
        desc = 'Summarize documents using AI, extract key highlights, answers, and summaries in seconds.';
      }

      setActiveTool({ id: toolId, title, desc });
      setCurrentView(toolId);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        currentView={currentView}
        setView={handleSetViewFromNav}
      />
      
      <main className="main-content">
        {currentView === 'home' ? (
          <>
            <Hero />
            <ToolsGrid onSelectTool={handleSelectTool} />
            <Pricing onContactSales={() => setCurrentView('contact')} />
          </>
        ) : currentView === 'contact' ? (
          <ContactUs onBack={handleBackToHome} />
        ) : (
          activeTool && (
            <ToolWorkspace 
              tool={activeTool} 
              onBack={handleBackToHome} 
            />
          )
        )}
      </main>

      <Footer setView={handleSetViewFromNav} />
    </div>
  );
}

export default App;
