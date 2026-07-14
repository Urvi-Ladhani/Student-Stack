import React, { useState, useEffect } from 'react';
import { 
  Command, LayoutDashboard, CheckSquare, Code2, 
  BookOpen, Briefcase, Timer, Plus, LogOut, X, Sparkles, Clock, Play, CheckCircle2
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const DashboardLayout = ({ children, user, onLogout, rightPanelContent }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  // Command Center Modal & Timer States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('focus'); // 'focus' | 'jot'
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Quick Jot States
  const [jotType, setJotType] = useState('task'); // 'task' | 'note'
  const [jotTitle, setJotTitle] = useState('');

  // Custom dialog box modal state
  const [dialogState, setDialogState] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const handleDialogClose = () => {
    const type = dialogState.type;
    setDialogState({ isOpen: false, title: '', message: '', type: 'success' });
    if (type === 'task' && window.location.pathname === '/tasks') {
      window.location.reload();
    } else if (type === 'note' && window.location.pathname === '/notes') {
      window.location.reload();
    }
  };

  // Sync Focus Session with localStorage to persist across route navigation
  useEffect(() => {
    const checkFocusSession = () => {
      const endTime = localStorage.getItem('focus_session_end');
      const name = localStorage.getItem('focus_session_name') || 'Deep Work';
      
      if (endTime) {
        const remaining = Math.max(0, Math.floor((parseInt(endTime) - Date.now()) / 1000));
        if (remaining > 0) {
          setTimeLeft(remaining);
          setSessionName(name);
          setSessionActive(true);
          return;
        }
      }
      setSessionActive(false);
      setTimeLeft(0);
    };

    checkFocusSession();
    const timerInterval = setInterval(checkFocusSession, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  const startFocusSession = (durationMinutes, name) => {
    const durationMs = durationMinutes * 60 * 1000;
    const endTimestamp = Date.now() + durationMs;
    localStorage.setItem('focus_session_end', endTimestamp.toString());
    localStorage.setItem('focus_session_name', name || 'Deep Work');
    setSessionName(name || 'Deep Work');
    setTimeLeft(durationMinutes * 60);
    setSessionActive(true);
    setIsModalOpen(false);
  };

  const stopFocusSession = () => {
    localStorage.removeItem('focus_session_end');
    localStorage.removeItem('focus_session_name');
    setSessionActive(false);
    setTimeLeft(0);
  };

  const handleQuickJotSubmit = async (e) => {
    e.preventDefault();
    if (!jotTitle.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      };

      if (jotType === 'task') {
        const res = await fetch('http://localhost:5000/api/tasks', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: jotTitle,
            category: 'Academic',
            priority: 'medium',
            deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            estimatedMinutes: 30
          })
        });
        if (res.ok) {
          setDialogState({
            isOpen: true,
            title: 'Task Created',
            message: 'Your task has been added successfully to your roadmap.',
            type: 'task'
          });
        }
      } else {
        const res = await fetch('http://localhost:5000/api/notes', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: jotTitle,
            content: 'Instant note recorded from Quick Action.',
            sourceModule: 'General',
            editorMode: 'text'
          })
        });
        if (res.ok) {
          setDialogState({
            isOpen: true,
            title: 'Note Recorded',
            message: 'Your instant note has been added successfully to your library.',
            type: 'note'
          });
        }
      }
      setJotTitle('');
      setIsModalOpen(false);
    } catch (err) {
      console.error("Quick action save error:", err);
      setDialogState({
        isOpen: true,
        title: 'Connection Error',
        message: 'Could not connect to the database. Please try again.',
        type: 'error'
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-screen flex overflow-hidden font-sans relative text-slate-50">
      
      {/* Subtle Global Tint */}
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

          <button 
            onClick={() => {
              setIsModalOpen(true);
              if (!sessionActive) {
                setSessionName('');
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 py-2.5 rounded-xl text-xs font-semibold transition-all group backdrop-blur-md shadow-lg shadow-blue-900/20"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Quick Action
          </button>

          <nav className="space-y-1.5">
            {[
              { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
              { label: 'Task OS', icon: CheckSquare, path: '/tasks' }, 
              { label: 'DSA OS', icon: Code2, path: '/dsa' },
              { label: 'Notes OS', icon: BookOpen, path: '/notes' },
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
          
          {/* Active Study Session Countdown */}
          {sessionActive ? (
            <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl flex items-center justify-between shadow-lg group/timer">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30 shrink-0">
                  <Timer className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider drop-shadow-sm truncate">{sessionName}</p>
                  <p className="text-sm font-semibold font-mono text-white/90">{formatTime(timeLeft)}</p>
                </div>
              </div>
              <button 
                onClick={stopFocusSession}
                title="Cancel Session"
                className="p-1 rounded bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover/timer:opacity-100 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl flex items-center gap-3 shadow-lg">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <Timer className="w-4 h-4 text-white/30" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider drop-shadow-sm">Focus Arena</p>
                <p className="text-xs font-semibold text-white/50">Ready to start</p>
              </div>
            </div>
          )}

          <button 
            onClick={onLogout || (() => {
              localStorage.clear();
              window.location.href = '/login';
            })}
            className="w-full flex items-center gap-3 px-3 py-3 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto px-8 pt-6 pb-12">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="w-full max-w-5xl mx-auto relative z-20">
          {children}
        </div>
      </main>

      {/* 3. RIGHT CONTEXT PANEL */}
      <aside className="relative z-20 w-[320px] h-screen bg-black/30 backdrop-blur-[40px] border-l border-white/10 p-6 shrink-0 flex flex-col gap-6 overflow-y-auto hidden xl:flex shadow-[-4px_0_24px_rgba(0,0,0,0.4)]">
        {rightPanelContent ? (
          rightPanelContent
        ) : (
          <div className="text-center text-white/40 text-xs mt-10">
            No contextual data available.
          </div>
        )}
      </aside>

      {/* COMMAND CENTER QUICK ACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-black/40 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" /> Command Center
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switched */}
            <div className="flex border-b border-white/10 mb-6">
              <button 
                onClick={() => setActiveTab('focus')}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'focus' ? 'border-blue-400 text-blue-300' : 'border-transparent text-white/40 hover:text-white/80'}`}
              >
                Focus Timer
              </button>
              <button 
                onClick={() => setActiveTab('jot')}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'jot' ? 'border-blue-400 text-blue-300' : 'border-transparent text-white/40 hover:text-white/80'}`}
              >
                Quick Jot
              </button>
            </div>

            {activeTab === 'focus' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Session Name</label>
                  <input 
                    type="text" 
                    value={sessionName} 
                    onChange={(e) => setSessionName(e.target.value)} 
                    placeholder="e.g. DSA Practice, Math Revision..." 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Duration</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '25 Min', val: 25 },
                      { label: '45 Min', val: 45 },
                      { label: '60 Min', val: 60 },
                    ].map(btn => (
                      <button 
                        key={btn.val}
                        onClick={() => startFocusSession(btn.val, sessionName || 'Deep Work')}
                        className="py-3 rounded-xl bg-white/5 hover:bg-blue-500/20 hover:text-blue-300 border border-white/10 hover:border-blue-500/30 text-xs font-bold transition-all flex flex-col items-center justify-center gap-1"
                      >
                        <Clock className="w-4 h-4 text-blue-400" />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickJotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Jot Down a Idea / Task</label>
                  <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 mb-4">
                    <button 
                      type="button"
                      onClick={() => setJotType('task')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${jotType === 'task' ? 'bg-white/10 text-white border border-white/5 shadow' : 'text-white/40'}`}
                    >
                      Quick Task
                    </button>
                    <button 
                      type="button"
                      onClick={() => setJotType('note')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${jotType === 'note' ? 'bg-white/10 text-white border border-white/5 shadow' : 'text-white/40'}`}
                    >
                      Quick Note
                    </button>
                  </div>

                  <input 
                    type="text" 
                    required
                    value={jotTitle} 
                    onChange={(e) => setJotTitle(e.target.value)} 
                    placeholder={jotType === 'task' ? "I need to complete..." : "Write quick note title..."} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 mt-2 rounded-xl bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 hover:bg-blue-500/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Save Instance
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DIALOG BOX OVERLAY */}
      {dialogState.isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xs bg-black/40 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl text-white text-center flex flex-col items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
              dialogState.type === 'error' 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              {dialogState.type === 'error' ? (
                <X className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h4 className="text-md font-bold text-white mb-1">{dialogState.title}</h4>
              <p className="text-xs text-white/60 leading-normal">{dialogState.message}</p>
            </div>
            <button 
              onClick={handleDialogClose}
              className="w-full py-2.5 rounded-xl bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 hover:bg-blue-500/30 transition-all text-xs"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout;