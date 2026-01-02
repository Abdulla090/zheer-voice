import React from 'react';

interface HeaderProps {
  onOpenSettings: () => void;
  hasKey: boolean;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, hasKey }) => {
  return (
    <header className="flex flex-col items-center justify-center py-8 px-4 text-center border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 font-kurdish relative">
      
      <button 
        onClick={onOpenSettings}
        className={`absolute top-4 right-4 md:right-8 p-2 rounded-full transition-all duration-300 border ${
            hasKey 
            ? 'bg-slate-800 text-slate-400 border-white/10 hover:text-white hover:border-soran-500/50' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse hover:bg-rose-500/20'
        }`}
        title="API Key Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 19l-1 1-1-1-2-2-1 1-1-1-2-2-1 1-1-1-2-2-1 1-1-1-2-2-1 1-1-1-2-2 1 1 1 2 1 2 3.757 1 6 6 0 117.743-5.743z" />
        </svg>
      </button>

      <div className="flex items-center space-x-3 space-x-reverse mb-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-soran-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-soran-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div className="flex flex-col">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white via-soran-200 to-soran-400 font-kurdish tracking-wide leading-tight">
            ژیر ساز ڤۆیس
            </h1>
            <span className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">ZHEER SAZ VOICE</span>
        </div>
      </div>
      <p className="text-slate-400 text-sm md:text-base max-w-xl font-light leading-7 mt-2">
        زیرەکترین سیستەمی خوێندنەوەی دەق بۆ کوردی سۆرانی بە تەکنەلۆژیای <span className="text-soran-400 font-medium font-sans">Gemini 3 Pro</span>
      </p>
    </header>
  );
};

export default Header;