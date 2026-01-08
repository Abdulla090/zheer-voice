
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './src/components/Layout/Layout';
import HomePage from './src/pages/HomePage';
import TTSPage from './src/pages/TTSPage';
import STTPage from './src/pages/STTPage';
import OCRPage from './src/pages/OCRPage';
import GrammarPage from './src/pages/GrammarPage';
import HistoryPage from './src/pages/HistoryPage';
import TranslatePage from './src/pages/TranslatePage';
import SettingsPage from './src/pages/SettingsPage';
import VideoTranslatePage from './src/pages/VideoTranslatePage';


import { ToastProvider } from './src/components/Toast/ToastProvider';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');

  // Handle key changes (can be called from settings page via some trigger if needed, 
  // but for now we rely on a full page reload or layout state)
  // Actually, let's keep it simple: the header shows the status from localStorage.

  // Update apiKey manually if needed, or just let Layout read it.
  React.useEffect(() => {
    const handleStorage = () => setApiKey(localStorage.getItem('gemini_api_key') || '');
    window.addEventListener('storage', handleStorage);
    window.addEventListener('localStorageChange', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('localStorageChange', handleStorage);
    };
  }, []);

  return (
    <ToastProvider>
      <Router>
        <Layout hasKey={!!apiKey}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tts" element={<TTSPage />} />
            <Route path="/stt" element={<STTPage />} />
            <Route path="/ocr" element={<OCRPage />} />
            <Route path="/grammar" element={<GrammarPage />} />
            <Route path="/translate" element={<TranslatePage />} />
            <Route path="/video-translate" element={<VideoTranslatePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />

          </Routes>
        </Layout>
      </Router>
    </ToastProvider>
  );
};

export default App;