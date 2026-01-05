
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
    hasKey: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hasKey }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-900 text-slate-100 font-kurdish selection:bg-soran-500/30 overflow-hidden relative" dir="rtl">

            {/* Background Animated Blobs (Global) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 fixed">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-soran-500/10 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
                {/* Mobile Header / Top Bar for API Key */}
                <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 lg:px-8">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden text-slate-400 p-2 hover:bg-white/5 rounded-lg"
                    >
                        <Menu />
                    </button>

                    <div className="flex-1 lg:flex-none"></div>

                    {/* API Key Status / Settings */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/settings"
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-2 ${hasKey
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 animate-pulse'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            {hasKey ? 'کلیلی API کارایە' : 'کلیل دابنێ (API Key)'}
                        </Link>
                        {/* User Avatar Placeholder */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-white/10"></div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
