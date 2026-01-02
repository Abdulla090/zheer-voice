import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string;
  usageCount: number;
  requestCountToday: number;
  requestCountMinute: number;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentKey, 
  usageCount,
  requestCountToday,
  requestCountMinute
}) => {
  const [inputKey, setInputKey] = useState(currentKey);
  const [timeLeft, setTimeLeft] = useState('');

  // Update countdown to next UTC midnight (Approximate API reset time)
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}h ${minutes}m`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setInputKey(currentKey);
  }, [currentKey, isOpen]);

  if (!isOpen) return null;

  // Limits (Free Tier Estimates)
  const LIMIT_RPM = 15;
  const LIMIT_RPD = 1500;

  const rpmPercent = Math.min((requestCountMinute / LIMIT_RPM) * 100, 100);
  const rpdPercent = Math.min((requestCountToday / LIMIT_RPD) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-slate-800 rounded-2xl shadow-2xl border border-white/10 w-full max-w-lg overflow-hidden transform transition-all scale-100 font-kurdish"
        dir="rtl"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-soran-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ڕێکخستنی هەژمار و API
          </h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            بۆ بەکارهێنانی ئەم بەرنامەیە، پێویستە کلیلی تایبەتی خۆت (Gemini API Key) داخڵ بکەیت.
          </p>

          <div className="space-y-6">
            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">API Key ـی خۆت لێرە بنووسە</label>
              <div className="flex gap-2">
                <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-soran-500 focus:ring-1 focus:ring-soran-500 font-sans text-left"
                    dir="ltr"
                />
              </div>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-soran-400 hover:text-soran-300 mt-2 inline-block hover:underline"
              >
                کلیلی نوێ دروست بکە (Google AI Studio) &rarr;
              </a>
            </div>

            {/* Quota Tracker */}
            <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-200">بەدواداچوونی بەکارهێنان (خەمڵێنراو)</h3>
                    <span className="text-xs text-slate-400 font-sans">{usageCount.toLocaleString()} chars total</span>
                </div>

                {/* RPM Tracker */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">داواکاری لە خولەکێکدا (RPM)</span>
                        <span className={`font-mono ${requestCountMinute >= LIMIT_RPM ? 'text-rose-400' : 'text-slate-300'}`}>
                            {requestCountMinute} / {LIMIT_RPM}
                        </span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${rpmPercent > 90 ? 'bg-rose-500' : 'bg-soran-500'}`} 
                            style={{ width: `${rpmPercent}%` }}
                        ></div>
                    </div>
                </div>

                {/* RPD Tracker */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">داواکاری ئەمڕۆ (RPD)</span>
                        <span className={`font-mono ${requestCountToday >= LIMIT_RPD ? 'text-rose-400' : 'text-slate-300'}`}>
                            {requestCountToday} / {LIMIT_RPD}
                        </span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${rpdPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${rpdPercent}%` }}
                        ></div>
                    </div>
                </div>

                {/* Reset Timer */}
                <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-slate-400">نوێبوونەوەی کۆتا دوای: <span className="text-white font-mono">{timeLeft}</span></span>
                </div>

                <div className="text-[10px] text-slate-500 leading-4 mt-2">
                    تێبینی: ئەم ئامارانە تەنها لەم ئامێرەدا هەڵدەگیرێن. سنوورەکان بۆ پلانی بێبەرامبەر (Free Tier) دانراون. ئەگەر پلانی پارەت هەیە، ئەم سنوورانە پشتگوێ بخە.
                </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 flex gap-3 justify-end border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            داخستن
          </button>
          <button
            onClick={() => onSave(inputKey)}
            disabled={!inputKey}
            className="px-6 py-2 rounded-lg bg-soran-600 hover:bg-soran-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors shadow-lg shadow-soran-500/20"
          >
            تۆمارکردن
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;