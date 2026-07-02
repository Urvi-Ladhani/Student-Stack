import React from 'react';
import { 
  Command, LayoutDashboard, CheckSquare, Code2, 
  BookOpen, Briefcase, Timer, Plus, LogOut, FileText 
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const DashboardLayout = ({ children, user, onLogout, rightPanelContent }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-full h-screen flex overflow-hidden font-sans relative text-slate-50">
      
      {/* Subtle Global Tint: Reduced to 20% so the mountain is clearly visible, 
        but text remains readable.
      */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none z-0"></div>

      {/* 1. LEFT SIDEBAR (Apple-Tier Glass) */}
      <aside className="relative z-20 w-[240px] h-screen bg-black/30 backdrop-blur-[40px] border-r border-white/10 flex flex-col justify-between p-5 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
        <div className="space-y-8">
          
          <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="p-1.5 rounded-lg bg-white/10 border border-white/20 shadow-inner">
              <Command className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-bold tracking-wide text-md text-white drop-shadow-md">Student Stack</span>
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 py-2.5 rounded-xl text-xs font-semibold transition-all group backdrop-blur-md shadow-lg shadow-blue-900/20">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Quick Action
          </button>

          <nav className="space-y-1.5">
            {[
              { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
              { label: 'Task OS', icon: CheckSquare, path: '/tasks' }, 
              { label: 'DSA OS', icon: Code2, path: '/dsa' },
              { label: 'Notes OS', icon: BookOpen, path: '/notes' },
              { label: 'PDF OS', icon: FileText, path: '/notes/pdf' },
              { label: 'Internship OS', icon: Briefcase, path: '/internships' },
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-medium transition-all text-left ${
                  isActive(item.path) 
                    ? 'bg-white/10 text-white border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.2)] font-semibold' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive(item.path) ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : ''}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl flex items-center gap-3 shadow-lg">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
              <Timer className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider drop-shadow-sm">Session Active</p>
              <p className="text-sm font-semibold font-mono text-white/90">00:45:12</p>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Disconnect Space
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto px-8 pt-6 pb-12">
        {/* Adjusted the ambient glow to sit behind the glass */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        
        <div className="w-full max-w-5xl mx-auto relative z-20">
          {children}
        </div>
      </main>

      {/* 3. RIGHT CONTEXT PANEL (Apple-Tier Glass) */}
      <aside className="relative z-20 w-[320px] h-screen bg-black/30 backdrop-blur-[40px] border-l border-white/10 p-6 shrink-0 flex flex-col gap-6 overflow-y-auto hidden xl:flex shadow-[-4px_0_24px_rgba(0,0,0,0.4)]">
        {rightPanelContent ? (
          rightPanelContent
        ) : (
          <div className="text-center text-white/40 text-xs mt-10">
            No contextual data available.
          </div>
        )}
      </aside>

    </div>
  );
};

export default DashboardLayout;