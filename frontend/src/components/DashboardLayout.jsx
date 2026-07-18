import React, { useState, useEffect } from 'react';
import { 
  Command, LayoutDashboard, CheckSquare, Code2, 
  BookOpen, Briefcase, Timer, Plus, LogOut, X, Sparkles, Clock, Play, CheckCircle2, Menu, ChevronLeft
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const DashboardLayout = ({ children, user, onLogout, rightPanelContent }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  // Command Center Modal & Timer States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('focus'); // 'focus' | 'jot'
  const [commandAction, setCommandAction] = useState(null); // null | 'task' | 'focus' | 'note' | 'dsa' | 'internship'
  const [dsaTopics, setDsaTopics] = useState([]);

  // Quick Action form states
  const [quickTask, setQuickTask] = useState({ title: '', priority: 'medium', category: 'Academic', estimatedMinutes: 30 });
  const [quickNote, setQuickNote] = useState({ title: '', content: '' });
  const [quickDsa, setQuickDsa] = useState({ title: '', url: '', difficulty: 'medium', platform: 'LeetCode', topicId: '' });
  const [quickInternship, setQuickInternship] = useState({ company: '', role: '', status: 'wishlist' });
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
    const checkFocusSession = async () => {
      const status = localStorage.getItem('focus_session_status');
      const name = localStorage.getItem('focus_session_name') || 'Deep Work';
      const duration = parseInt(localStorage.getItem('focus_session_duration')) || 1500;
      
      if (status === 'running') {
        const endTime = localStorage.getItem('focus_session_end');
        if (endTime) {
          const remaining = Math.max(0, Math.floor((parseInt(endTime) - Date.now()) / 1000));
          if (remaining > 0) {
            setTimeLeft(remaining);
            setSessionName(name);
            setSessionActive(true);
            return;
          } else {
            // Auto complete!
            localStorage.setItem('focus_session_status', 'completed');
            const elapsedMinutes = Math.round(duration / 60);
            if (elapsedMinutes > 0) {
              try {
                const token = localStorage.getItem('token');
                await fetch('http://localhost:5000/api/auth/study-session', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ minutes: elapsedMinutes })
                });
                window.dispatchEvent(new Event('study-session-logged'));
              } catch (err) {
                console.error("Error logging auto-completed focus session:", err);
              }
            }

            localStorage.removeItem('focus_session_status');
            localStorage.removeItem('focus_session_name');
            localStorage.removeItem('focus_session_end');
            localStorage.removeItem('focus_session_duration');
            localStorage.removeItem('focus_session_time_left');
            setSessionActive(false);
            setTimeLeft(0);

            setDialogState({
              isOpen: true,
              title: 'Session Complete!',
              message: `Congratulations! You completed the study session: "${name}". Your hours and streak are updated.`,
              type: 'success'
            });
            return;
          }
        }
      } else if (status === 'paused') {
        const remaining = parseInt(localStorage.getItem('focus_session_time_left')) || 0;
        setTimeLeft(remaining);
        setSessionName(name);
        setSessionActive(true);
        return;
      }
      setSessionActive(false);
      setTimeLeft(0);
    };

    checkFocusSession();
    const timerInterval = setInterval(checkFocusSession, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  const startFocusSession = (durationMinutes, name) => {
    const durationSeconds = durationMinutes * 60;
    const endTimestamp = Date.now() + durationSeconds * 1000;
    
    localStorage.setItem('focus_session_status', 'running');
    localStorage.setItem('focus_session_duration', durationSeconds.toString());
    localStorage.setItem('focus_session_end', endTimestamp.toString());
    localStorage.setItem('focus_session_name', name || 'Deep Work');
    
    setSessionName(name || 'Deep Work');
    setTimeLeft(durationSeconds);
    setSessionActive(true);
    setIsModalOpen(false);
  };

  const stopFocusSession = async () => {
    const status = localStorage.getItem('focus_session_status');
    const duration = parseInt(localStorage.getItem('focus_session_duration')) || 1500;
    
    let elapsedSeconds = 0;
    if (status === 'running') {
      const endTime = parseInt(localStorage.getItem('focus_session_end')) || 0;
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      elapsedSeconds = duration - remaining;
    } else if (status === 'paused') {
      const remaining = parseInt(localStorage.getItem('focus_session_time_left')) || 0;
      elapsedSeconds = duration - remaining;
    }

    const elapsedMinutes = Math.round(elapsedSeconds / 60);
    if (elapsedMinutes > 0) {
      try {
        const token = localStorage.getItem('token');
        await fetch('http://localhost:5000/api/auth/study-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ minutes: elapsedMinutes })
        });
        window.dispatchEvent(new Event('study-session-logged'));
      } catch (err) {
        console.error("Error logging stopped focus session:", err);
      }
    }

    localStorage.removeItem('focus_session_status');
    localStorage.removeItem('focus_session_name');
    localStorage.removeItem('focus_session_end');
    localStorage.removeItem('focus_session_duration');
    localStorage.removeItem('focus_session_time_left');
    setSessionActive(false);
    setTimeLeft(0);
  };

  // Fetch topics for DSA Quick Action selection list
  useEffect(() => {
    if (isModalOpen && commandAction === 'dsa') {
      const fetchTopics = async () => {
        try {
          const token = localStorage.getItem('token');
          const headers = { 'Authorization': `Bearer ${token}` };
          const rmRes = await fetch('http://localhost:5000/api/dsa/roadmaps', { headers });
          if (rmRes.ok) {
            const rms = await rmRes.json();
            if (rms.length > 0) {
              const topRes = await fetch(`http://localhost:5000/api/dsa/topics/${rms[0]._id}`, { headers });
              if (topRes.ok) {
                const tops = await topRes.json();
                setDsaTopics(tops);
                if (tops.length > 0) {
                  setQuickDsa(prev => ({ ...prev, topicId: tops[0]._id }));
                }
              }
            }
          }
        } catch (err) {
          console.error("Failed to load DSA topics for quick action", err);
        }
      };
      fetchTopics();
    }
  }, [isModalOpen, commandAction]);

  const handleQuickActionSubmit = async (e, type) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      };

      let res;
      if (type === 'task') {
        res = await fetch('http://localhost:5000/api/tasks', {
          method: 'POST',
          headers,
          body: JSON.stringify(quickTask)
        });
      } else if (type === 'note') {
        res = await fetch('http://localhost:5000/api/notes', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: quickNote.title,
            content: quickNote.content || 'Quick Note recorded.',
            editorMode: 'text'
          })
        });
      } else if (type === 'dsa') {
        if (!quickDsa.topicId) {
          alert("Please select a DSA topic.");
          return;
        }
        res = await fetch('http://localhost:5000/api/dsa/problems', {
          method: 'POST',
          headers,
          body: JSON.stringify(quickDsa)
        });
      } else if (type === 'internship') {
        res = await fetch('http://localhost:5000/api/internships', {
          method: 'POST',
          headers,
          body: JSON.stringify(quickInternship)
        });
      }

      if (res && res.ok) {
        setDialogState({
          isOpen: true,
          title: 'Success!',
          message: `Your ${type} has been added successfully.`,
          type: 'success'
        });
        
        // Reset states
        setQuickTask({ title: '', priority: 'medium', category: 'Academic', estimatedMinutes: 30 });
        setQuickNote({ title: '', content: '' });
        setQuickDsa({ title: '', url: '', difficulty: 'medium', platform: 'LeetCode', topicId: '' });
        setQuickInternship({ company: '', role: '', status: 'wishlist' });
        setCommandAction(null);
        setIsModalOpen(false);

        // Notify other widgets to refresh
        window.dispatchEvent(new Event('dashboard-data-updated'));
        
        // Force refresh for lists if we are on their respective page
        if (window.location.pathname === '/tasks') window.location.reload();
        if (window.location.pathname === '/notes') window.location.reload();
        if (window.location.pathname === '/dsa') window.location.reload();
        if (window.location.pathname === '/internships') window.location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Error: ${err.message || 'Operation failed'}`);
      }
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
    <div className="w-full h-screen flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 overflow-hidden font-sans relative text-slate-50 box-border bg-[#040712]/30">
      
      {/* Subtle Global Tint */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none z-0"></div>

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* MOBILE DRAWER SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] h-full flex flex-col justify-between p-6 shrink-0 shadow-2xl transition-transform duration-300 ease-in-out md:hidden strong-glass ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { navigate('/dashboard'); setIsMobileSidebarOpen(false); }}>
              <div className="p-1.5 rounded-lg bg-white/10 border border-white/20 shadow-inner">
                <Command className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-bold tracking-wide text-md text-white drop-shadow-md">Student Stack</span>
            </div>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1 text-white/50 hover:text-white md:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => {
              setIsMobileSidebarOpen(false);
              setIsModalOpen(true);
              if (!sessionActive) {
                setSessionName('');
              }
            }}
            className="w-full py-2.5 rounded-xl text-xs font-semibold glass-btn-primary group flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Quick Action
          </button>

          <nav className="space-y-2">
            {[
              { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
              { label: 'Task OS', icon: CheckSquare, path: '/tasks' }, 
              { label: 'DSA OS', icon: Code2, path: '/dsa' },
              { label: 'Notes OS', icon: BookOpen, path: '/notes' },
              { label: 'Internship OS', icon: Briefcase, path: '/internships' },
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => { navigate(item.path); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-all text-left hover-lift-scale ${
                  isActive(item.path) 
                    ? 'light-glass text-white font-semibold shadow-lg' 
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
          {sessionActive ? (
            <div className="p-3.5 rounded-xl light-glass flex items-center justify-between shadow-lg hover-lift-scale">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <div className="p-2 bg-emerald-500/15 rounded-lg shrink-0">
                  <Timer className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider truncate">{sessionName}</p>
                  <p className="text-sm font-semibold font-mono text-white/90">{formatTime(timeLeft)}</p>
                </div>
              </div>
              <button 
                onClick={stopFocusSession}
                className="p-1 rounded bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-all shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl light-glass flex items-center gap-3 shadow-lg hover-lift-scale">
              <div className="p-2 bg-white/5 rounded-lg shrink-0">
                <Timer className="w-4 h-4 text-white/30" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Focus Arena</p>
                <p className="text-xs font-semibold text-white/50">Ready</p>
              </div>
            </div>
          )}

          <button 
            onClick={onLogout || (() => {
              localStorage.clear();
              window.location.href = '/login';
            })}
            className="w-full px-3.5 py-3 text-red-400/80 glass-btn-danger text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* 1. LEFT SIDEBAR (Apple-Tier Glass - Collapsible for tablet/desktop) */}
      <aside className="strong-glass z-20 hidden md:flex md:w-[80px] lg:w-[240px] h-full flex-col justify-between p-4 lg:p-6 shrink-0 shadow-2xl transition-all duration-300">
        <div className="space-y-8 animate-in slide-in-from-left duration-500 flex flex-col md:items-center lg:items-stretch">
          
          <div className="flex items-center justify-center lg:justify-start gap-3 px-2 cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => navigate('/dashboard')}>
            <div className="p-1.5 rounded-lg bg-white/10 border border-white/20 shadow-inner">
              <Command className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-bold tracking-wide text-md text-white drop-shadow-md hidden lg:inline">Student Stack</span>
          </div>

          <button 
            onClick={() => {
              setIsModalOpen(true);
              if (!sessionActive) {
                setSessionName('');
              }
            }}
            className="w-full py-2.5 rounded-xl text-xs font-semibold glass-btn-primary group flex items-center justify-center gap-2"
            title="Quick Action"
          >
            <Plus className="w-4.5 h-4.5 group-hover:rotate-90 transition-transform shrink-0" />
            <span className="hidden lg:inline">Quick Action</span>
          </button>

          <nav className="space-y-2 w-full">
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
                className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-all hover-lift-scale ${
                  isActive(item.path) 
                    ? 'light-glass text-white font-semibold shadow-lg' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                title={item.label}
              >
                <item.icon className={`w-4.5 h-4.5 shrink-0 ${isActive(item.path) ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : ''}`} />
                <span className="hidden lg:inline truncate">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4 w-full flex flex-col md:items-center lg:items-stretch">
          
          {/* Active Study Session Countdown */}
          {sessionActive ? (
            <div className="p-3 rounded-xl light-glass flex items-center justify-center lg:justify-between shadow-lg group/timer hover-lift-scale w-full min-w-0 overflow-hidden" title={sessionName}>
              <div className="flex items-center justify-center lg:justify-start gap-2.5 min-w-0 flex-1 lg:pr-2">
                <div className="p-2 bg-emerald-500/15 rounded-lg shrink-0 animate-pulse" onClick={stopFocusSession} title="Stop Session">
                  <Timer className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1 hidden lg:block">
                  <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider truncate">{sessionName}</p>
                  <p className="text-xs font-semibold font-mono text-white/90">{formatTime(timeLeft)}</p>
                </div>
              </div>
              <button 
                onClick={stopFocusSession}
                title="Cancel Session"
                className="p-1 rounded bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover/timer:opacity-100 shrink-0 hidden lg:block"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl light-glass flex items-center justify-center lg:justify-start gap-2.5 shadow-lg hover-lift-scale w-full" title="Focus Arena">
              <div className="p-2 bg-white/5 rounded-lg shrink-0">
                <Timer className="w-4.5 h-4.5 text-white/30" />
              </div>
              <div className="hidden lg:block truncate">
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Focus Arena</p>
                <p className="text-[10px] font-semibold text-white/50">Ready</p>
              </div>
            </div>
          )}

          <button 
            onClick={onLogout || (() => {
              localStorage.clear();
              window.location.href = '/login';
            })}
            className="w-full py-3 text-red-400/80 glass-btn-danger text-xs font-semibold flex items-center justify-center gap-2"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5 shrink-0" />
            <span className="hidden lg:inline">Log Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="relative z-10 flex-1 h-full overflow-y-auto custom-scrollbar px-2 flex flex-col min-w-0">
        {/* Mobile Header Row */}
        <div className="flex items-center justify-between p-3.5 mb-4 -mx-2 bg-white/5 border-b border-white/5 backdrop-blur-md md:hidden rounded-b-xl z-30 shrink-0">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-xl bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-extrabold tracking-wide text-sm text-white flex items-center gap-2">
            <Command className="w-4 h-4 text-blue-400" /> Student Stack
          </span>
          <div className="w-9"></div>
        </div>

        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="w-full max-w-5xl mx-auto relative z-20 h-full flex flex-col">
          {children}
        </div>
      </main>

      {/* 3. RIGHT CONTEXT PANEL */}
      <aside className="strong-glass z-20 w-[320px] h-full p-6 shrink-0 flex flex-col gap-6 overflow-y-auto hidden xl:flex shadow-2xl custom-scrollbar">
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg strong-glass p-7 shadow-2xl text-white">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                {commandAction && (
                  <button 
                    onClick={() => setCommandAction(null)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors mr-1"
                    title="Back to shortcuts"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" /> 
                  {commandAction ? `Quick ${commandAction.charAt(0).toUpperCase() + commandAction.slice(1)}` : 'Command Center'}
                </h3>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setCommandAction(null); }} 
                className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shortcut Grid Screen */}
            {commandAction === null && (
              <div className="space-y-4">
                <p className="text-xs text-white/45 uppercase tracking-widest font-semibold mb-3">Shortcuts & Direct Actions</p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setCommandAction('task')}
                    className="p-4 rounded-xl light-glass text-left hover-lift-scale flex flex-col gap-3 group border border-white/5 hover:border-blue-500/20"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <CheckSquare className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Create Task</p>
                      <p className="text-[10px] text-white/40">Add a task to Task OS</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setCommandAction('focus')}
                    className="p-4 rounded-xl light-glass text-left hover-lift-scale flex flex-col gap-3 group border border-white/5 hover:border-emerald-500/20"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                      <Timer className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Start Study Session</p>
                      <p className="text-[10px] text-white/40">Launch focus arena timer</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setCommandAction('note')}
                    className="p-4 rounded-xl light-glass text-left hover-lift-scale flex flex-col gap-3 group border border-white/5 hover:border-purple-500/20"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                      <BookOpen className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Add Note</p>
                      <p className="text-[10px] text-white/40">Jot a quick note instantly</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setCommandAction('dsa')}
                    className="p-4 rounded-xl light-glass text-left hover-lift-scale flex flex-col gap-3 group border border-white/5 hover:border-orange-500/20"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20 transition-colors">
                      <Code2 className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Add DSA Problem</p>
                      <p className="text-[10px] text-white/40">Log a problem attempt</p>
                    </div>
                  </button>
                </div>

                <button 
                  onClick={() => setCommandAction('internship')}
                  className="w-full p-4 rounded-xl light-glass text-left hover-lift-scale flex items-center gap-4 group border border-white/5 hover:border-pink-500/20 mt-4"
                >
                  <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:bg-pink-500/20 transition-colors shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Add Internship Application</p>
                    <p className="text-[10px] text-white/40">Log a job, ATS details, or wishlist application</p>
                  </div>
                </button>
              </div>
            )}

            {/* CREATE TASK FORM */}
            {commandAction === 'task' && (
              <form onSubmit={(e) => handleQuickActionSubmit(e, 'task')} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Task Title</label>
                  <input 
                    type="text" 
                    required 
                    value={quickTask.title} 
                    onChange={e => setQuickTask({ ...quickTask, title: e.target.value })}
                    placeholder="Enter task title..." 
                    className="w-full glass-input px-4 py-3 text-sm text-white" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Category</label>
                    <select 
                      value={quickTask.category} 
                      onChange={e => setQuickTask({ ...quickTask, category: e.target.value })}
                      className="w-full glass-input px-4 py-3 text-sm text-white bg-black/60 outline-none"
                    >
                      {['Academic', 'DSA', 'Internship', 'Personal', 'Project'].map(cat => (
                        <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Priority</label>
                    <select 
                      value={quickTask.priority} 
                      onChange={e => setQuickTask({ ...quickTask, priority: e.target.value })}
                      className="w-full glass-input px-4 py-3 text-sm text-white bg-black/60 outline-none"
                    >
                      {['critical', 'high', 'medium', 'low'].map(prio => (
                        <option key={prio} value={prio} className="bg-slate-900 uppercase text-[10px]">{prio}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Est. Time (Minutes)</label>
                  <input 
                    type="number" 
                    required 
                    value={quickTask.estimatedMinutes} 
                    onChange={e => setQuickTask({ ...quickTask, estimatedMinutes: Number(e.target.value) })}
                    className="w-full glass-input px-4 py-3 text-sm text-white" 
                  />
                </div>
                <button type="submit" className="w-full py-3 glass-btn-primary mt-2">
                  <Plus className="w-4 h-4" /> Save Task
                </button>
              </form>
            )}

            {/* FOCUS TIMER FORM */}
            {commandAction === 'focus' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Session Topic / Name</label>
                  <input 
                    type="text" 
                    value={sessionName} 
                    onChange={(e) => setSessionName(e.target.value)} 
                    placeholder="e.g. DSA Revision, Deep Work..." 
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Duration</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: '25 Min', val: 25 },
                      { label: '45 Min', val: 45 },
                      { label: '60 Min', val: 60 },
                    ].map(btn => (
                      <button 
                        key={btn.val}
                        onClick={() => startFocusSession(btn.val, sessionName || 'Deep Work')}
                        className="py-3.5 rounded-xl glass-btn-secondary text-xs flex flex-col items-center justify-center gap-1.5"
                      >
                        <Clock className="w-4 h-4 text-blue-400" />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ADD NOTE FORM */}
            {commandAction === 'note' && (
              <form onSubmit={(e) => handleQuickActionSubmit(e, 'note')} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Note Title</label>
                  <input 
                    type="text" 
                    required 
                    value={quickNote.title} 
                    onChange={e => setQuickNote({ ...quickNote, title: e.target.value })}
                    placeholder="Enter note title..." 
                    className="w-full glass-input px-4 py-3 text-sm text-white" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Quick Jot / Content</label>
                  <textarea 
                    value={quickNote.content} 
                    onChange={e => setQuickNote({ ...quickNote, content: e.target.value })}
                    placeholder="Type notes detail..." 
                    rows="3"
                    className="w-full glass-input px-4 py-3 text-sm text-white resize-none"
                  ></textarea>
                </div>
                <button type="submit" className="w-full py-3 glass-btn-primary mt-2">
                  <Plus className="w-4 h-4" /> Save Note
                </button>
              </form>
            )}

            {/* ADD DSA PROBLEM FORM */}
            {commandAction === 'dsa' && (
              <form onSubmit={(e) => handleQuickActionSubmit(e, 'dsa')} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Problem Title</label>
                  <input 
                    type="text" 
                    required 
                    value={quickDsa.title} 
                    onChange={e => setQuickDsa({ ...quickDsa, title: e.target.value })}
                    placeholder="e.g. Two Sum" 
                    className="w-full glass-input px-4 py-3 text-sm text-white" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Problem Link / URL</label>
                  <input 
                    type="url" 
                    value={quickDsa.url} 
                    onChange={e => setQuickDsa({ ...quickDsa, url: e.target.value })}
                    placeholder="e.g. https://leetcode.com/problems/..." 
                    className="w-full glass-input px-4 py-3 text-sm text-white" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Difficulty</label>
                    <select 
                      value={quickDsa.difficulty} 
                      onChange={e => setQuickDsa({ ...quickDsa, difficulty: e.target.value })}
                      className="w-full glass-input px-4 py-3 text-sm text-white bg-slate-950 outline-none"
                    >
                      {['easy', 'medium', 'hard'].map(d => (
                        <option key={d} value={d} className="bg-slate-900">{d.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Platform</label>
                    <select 
                      value={quickDsa.platform} 
                      onChange={e => setQuickDsa({ ...quickDsa, platform: e.target.value })}
                      className="w-full glass-input px-4 py-3 text-sm text-white bg-slate-950 outline-none"
                    >
                      {['LeetCode', 'Codeforces', 'HackerRank', 'GeeksForGeeks', 'Other'].map(p => (
                        <option key={p} value={p} className="bg-slate-900">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Target Topic</label>
                  <select 
                    value={quickDsa.topicId} 
                    onChange={e => setQuickDsa({ ...quickDsa, topicId: e.target.value })}
                    className="w-full glass-input px-4 py-3 text-sm text-white bg-slate-950 outline-none"
                  >
                    {dsaTopics.length === 0 ? (
                      <option value="" className="bg-slate-900">Loading topics...</option>
                    ) : (
                      dsaTopics.map(t => (
                        <option key={t._id} value={t._id} className="bg-slate-900">{t.name}</option>
                      ))
                    )}
                  </select>
                </div>
                <button type="submit" className="w-full py-3 glass-btn-primary mt-2">
                  <Plus className="w-4 h-4" /> Save Problem
                </button>
              </form>
            )}

            {/* ADD INTERNSHIP APPLICATION FORM */}
            {commandAction === 'internship' && (
              <form onSubmit={(e) => handleQuickActionSubmit(e, 'internship')} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Company Name</label>
                  <input 
                    type="text" 
                    required 
                    value={quickInternship.company} 
                    onChange={e => setQuickInternship({ ...quickInternship, company: e.target.value })}
                    placeholder="e.g. Google" 
                    className="w-full glass-input px-4 py-3 text-sm text-white" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Role Name</label>
                  <input 
                    type="text" 
                    required 
                    value={quickInternship.role} 
                    onChange={e => setQuickInternship({ ...quickInternship, role: e.target.value })}
                    placeholder="e.g. Software Engineering Intern" 
                    className="w-full glass-input px-4 py-3 text-sm text-white" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Kanban Stage</label>
                  <select 
                    value={quickInternship.status} 
                    onChange={e => setQuickInternship({ ...quickInternship, status: e.target.value })}
                    className="w-full glass-input px-4 py-3 text-sm text-white bg-slate-950 outline-none"
                  >
                    {[
                      { value: 'wishlist', label: 'Wishlist' },
                      { value: 'applied', label: 'Applied' },
                      { value: 'oa', label: 'Online Assessment' },
                      { value: 'interview', label: 'Interview' },
                      { value: 'offer', label: 'Offer' }
                    ].map(st => (
                      <option key={st.value} value={st.value} className="bg-slate-900">{st.label}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-3 glass-btn-primary mt-2">
                  <Plus className="w-4 h-4" /> Save Application
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DIALOG BOX OVERLAY */}
      {dialogState.isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xs strong-glass p-6 text-white text-center flex flex-col items-center gap-4">
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
              className="w-full py-2.5 glass-btn-primary text-xs"
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