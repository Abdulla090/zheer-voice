
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
import ApiKeyModal from './components/ApiKeyModal';
import { ToastProvider } from './src/components/Toast/ToastProvider';

const App: React.FC = () => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowKeyModal(false);
  };

  return (
    <ToastProvider>
      <Router>
        <Layout onOpenSettings={() => setShowKeyModal(true)} hasKey={!!apiKey}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tts" element={<TTSPage />} />
            <Route path="/stt" element={<STTPage />} />
            <Route path="/ocr" element={<OCRPage />} />
            <Route path="/grammar" element={<GrammarPage />} />
            <Route path="/translate" element={<TranslatePage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>

          <ApiKeyModal
            isOpen={showKeyModal}
            onClose={() => setShowKeyModal(false)}
            onSave={handleSaveKey}
            currentKey={apiKey}
            usageCount={parseInt(localStorage.getItem('usage_count') || '0')}
            requestCountToday={parseInt(localStorage.getItem('usage_daily_requests') || '0')}
            requestCountMinute={0}
          />
        </Layout>
      </Router>
    </ToastProvider>
  );
};

export default App;