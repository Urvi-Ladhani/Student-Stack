import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, Square, BookOpen, Calendar, Clock } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const DashboardRightPanel = () => {
  const [tasks, setTasks] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Session states synced with localStorage
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [tasksRes, notesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tasks`, { headers }),
        fetch(`${API_BASE_URL}/api/notes/workspace`, { headers })
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (notesRes.ok) {
        const workspace = await notesRes.json();
        const notesList = workspace.notes || [];
        const sorted = notesList
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 3);
        setRecentNotes(sorted);
      }
    } catch (error) {
      console.error("Right panel fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Re-fetch on custom changes
    window.addEventListener('dashboard-data-updated', fetchData);
    window.addEventListener('study-session-logged', fetchData);

    return () => {
      window.removeEventListener('dashboard-data-updated', fetchData);
      window.removeEventListener('study-session-logged', fetchData);
    };
  }, []);

  // Sync Focus session from localStorage every 500ms
  useEffect(() => {
    const syncTimer = () => {
      const status = localStorage.getItem('focus_session_status');
      const name = localStorage.getItem('focus_session_name') || 'Deep Work';
      const initialDur = parseInt(localStorage.getItem('focus_session_duration')) || 1500;
      
      if (status === 'running') {
        const endTime = parseInt(localStorage.getItem('focus_session_end')) || 0;
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        
        if (remaining > 0) {
          setTimeLeft(remaining);
          setSessionName(name);
          setSessionActive(true);
          setIsPaused(false);
          setDuration(initialDur);
        } else {
          setSessionActive(false);
          setTimeLeft(0);
        }
      } else if (status === 'paused') {
        const remaining = parseInt(localStorage.getItem('focus_session_time_left')) || 0;
        setTimeLeft(remaining);
        setSessionName(name);
        setSessionActive(true);
        setIsPaused(true);
        setDuration(initialDur);
      } else {
        setSessionActive(false);
        setTimeLeft(0);
      }
    };

    syncTimer();
    const interval = setInterval(syncTimer, 500);
    return () => clearInterval(interval);
  }, []);

  // Timer controls
  const handlePause = () => {
    localStorage.setItem('focus_session_status', 'paused');
    localStorage.setItem('focus_session_time_left', timeLeft.toString());
    localStorage.removeItem('focus_session_end');
    setIsPaused(true);
  };

  const handleResume = () => {
    localStorage.setItem('focus_session_status', 'running');
    const newEnd = Date.now() + timeLeft * 1000;
    localStorage.setItem('focus_session_end', newEnd.toString());
    setIsPaused(false);
  };

  const handleEndSession = async () => {
    const elapsedSeconds = duration - timeLeft;
    const elapsedMinutes = Math.round(elapsedSeconds / 60);

    if (elapsedMinutes > 0) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_BASE_URL}/api/auth/study-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ minutes: elapsedMinutes })
        });
        window.dispatchEvent(new Event('study-session-logged'));
      } catch (err) {
        console.error("Error logging focus session:", err);
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timezone-robust helpers
  const getDaysDiff = (deadline) => {
    if (!deadline) return 0;
    const deadlineDateStr = deadline.split('T')[0];
    const [dy, dm, dd] = deadlineDateStr.split('-').map(Number);
    
    const today = new Date();
    const todayLocalMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueLocalMidnight = new Date(dy, dm - 1, dd);
    
    const diffTime = dueLocalMidnight - todayLocalMidnight;
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  // Urgent Deadlines calculations
  const urgentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'done' && !t.isArchived && t.deadline)
      .sort((a, b) => getDaysDiff(a.deadline) - getDaysDiff(b.deadline))
      .slice(0, 3);
  }, [tasks]);

  const getUrgencyBadge = (deadline) => {
    const diffDays = getDaysDiff(deadline);

    if (diffDays < 0) return <span className="text-[9px] font-bold px-2 py-1 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">Overdue</span>;
    if (diffDays === 0) return <span className="text-[9px] font-bold px-2 py-1 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20">Today</span>;
    if (diffDays === 1) return <span className="text-[9px] font-bold px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">Tomorrow</span>;
    return <span className="text-[9px] font-bold px-2 py-1 bg-white/5 text-white/60 rounded-lg border border-white/10">{diffDays} Days</span>;
  };

  return (
    <div className="h-full w-full flex flex-col gap-6">
      
      {/* SECTION: Active Study Session Widget */}
      <div 
        onClick={() => window.location.href = '/study-sessions'}
        className="p-5 relative overflow-hidden group shadow-lg light-glass hover-lift-scale cursor-pointer border border-white/5 hover:border-blue-500/30 transition-all"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full"></div>
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold tracking-wider text-blue-400 uppercase">Active Session</h3>
          <span className="text-[10px] font-bold text-blue-300 hover:underline flex items-center gap-1">
            Arena &rarr;
          </span>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-white/80 font-semibold mb-1 truncate">
            {sessionActive ? sessionName : 'No Active Session'}
          </p>
          <p className="text-xs text-white/45">
            {sessionActive ? (isPaused ? 'Session Paused' : 'Ticking down...') : 'Click to launch Focus Arena'}
          </p>
        </div>

        <div className="text-4xl font-mono text-white tracking-widest font-light mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
          {formatTime(timeLeft)}
        </div>

        {sessionActive ? (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {isPaused ? (
              <button 
                onClick={handleResume}
                className="flex-1 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/35 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-emerald-300" /> Resume
              </button>
            ) : (
              <button 
                onClick={handlePause}
                className="flex-1 px-4 py-2 bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/35 text-orange-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Pause className="w-3.5 h-3.5 fill-orange-300" /> Pause
              </button>
            )}
            <button 
              onClick={handleEndSession}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 hover:bg-red-500/35 text-red-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0"
              title="Stop and save focus hours"
            >
              <Square className="w-3.5 h-3.5 fill-red-300" /> End
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => window.location.href = '/study-sessions'}
              className="flex-1 glass-btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Launch Arena
            </button>
          </div>
        )}
      </div>

      {/* SECTION: Upcoming Deadlines (hides completely if empty) */}
      {urgentTasks.length > 0 && (
        <div>
          <h3 className="text-xs font-bold tracking-wider text-white/40 uppercase mb-4 flex items-center gap-2">
            <Calendar className="w-3 h-3 text-emerald-400" /> Urgent Deadlines
          </h3>
          <div className="space-y-3">
            {urgentTasks.map(task => (
              <div key={task._id} className="p-3 flex justify-between items-center hover-lift-scale light-glass cursor-default shadow border border-white/5">
                <div className="truncate pr-3">
                  <p className="text-sm font-semibold text-white/95 truncate">{task.title}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{task.category} • {task.priority}</p>
                </div>
                <div className="shrink-0">
                  {getUrgencyBadge(task.deadline)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: Recent Notes Widget (smart replacement for targets) */}
      <div className="mt-auto pt-6 border-t border-white/[0.05]">
        <h3 className="text-xs font-bold tracking-wider text-white/40 uppercase mb-4 flex items-center gap-2">
          <BookOpen className="w-3 h-3 text-indigo-400" /> Recent Notes
        </h3>
        
        <div className="space-y-3">
          {recentNotes.length === 0 ? (
            <div className="p-4 text-center light-glass rounded-xl">
              <p className="text-xs text-white/30 italic">No notes logged yet.</p>
            </div>
          ) : (
            recentNotes.map(note => (
              <div 
                key={note._id} 
                onClick={() => window.location.href = '/notes'}
                className="p-3 flex justify-between items-center hover-lift-scale light-glass cursor-pointer shadow hover:bg-white/5 border border-white/5"
              >
                <div className="truncate pr-3">
                  <p className="text-xs font-semibold text-white/90 truncate">{note.title}</p>
                  <p className="text-[9px] text-white/40 uppercase tracking-wider">
                    {note.editorMode === 'pdf' ? 'PDF Study Guide' : 'Rich Note'}
                  </p>
                </div>
                <span className="text-[9px] text-white/30 font-medium font-mono shrink-0">
                  {new Date(note.updatedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default DashboardRightPanel;