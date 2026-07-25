import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  Timer, Clock, Play, Pause, Square, Sparkles, 
  Calendar as CalendarIcon, Filter, Layers, CheckCircle2, 
  Star, Award, BookOpen, Code2, CheckSquare, Briefcase, 
  Maximize2, Minimize2, X, Plus, ChevronRight, BarChart3, 
  List, Grid, Zap, Shield, RotateCcw, AlertCircle, Heart, Sliders
} from 'lucide-react';

const StudySessionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Tab mode: 'arena' (Active/Setup) | 'history'
  const [activeTab, setActiveTab] = useState('arena');

  // History view mode: 'timeline' | 'calendar' | 'cards' | 'stats'
  const [historyView, setHistoryView] = useState('timeline');

  // Filters for History
  const [historyPeriod, setHistoryPeriod] = useState('all'); // 'today'|'week'|'month'|'year'|'all'
  const [historyModuleFilter, setHistoryModuleFilter] = useState('All');
  const [historyTopicSearch, setHistoryTopicSearch] = useState('');

  // Setup Options & External Linked Data
  const [availableTasks, setAvailableTasks] = useState([]);
  const [availableNotes, setAvailableNotes] = useState([]);
  const [availableRoadmaps, setAvailableRoadmaps] = useState([]);
  const [availableInternships, setAvailableInternships] = useState([]);
  const [userSettings, setUserSettings] = useState(null);

  // Setup Form State
  const [sessionMode, setSessionMode] = useState('timer'); // 'stopwatch' | 'timer'
  const [selectedDuration, setSelectedDuration] = useState(25); // minutes
  const [customDuration, setCustomDuration] = useState('');
  const [selectedModule, setSelectedModule] = useState('Custom Study');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedNote, setSelectedNote] = useState('');
  const [selectedRoadmap, setSelectedRoadmap] = useState('');
  const [selectedInternship, setSelectedInternship] = useState('');

  // Active Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0); // for timer mode
  const [timerTargetSeconds, setTimerTargetSeconds] = useState(1500); // 25 min default
  const [startTimeStamp, setStartTimeStamp] = useState(null);

  // Focus Mode Overlay State
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionForm, setCompletionForm] = useState({
    completedStatus: 'Yes', // 'Yes' | 'Partially' | 'No'
    notes: '',
    mood: 5,
    difficulty: 3
  });

  // Scheduled Session Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    module: 'Custom Study',
    topic: '',
    goal: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    durationMinutes: 30
  });

  // Selected Detail Modal (for Calendar / History click)
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);

  // Backend Data States
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Play notification chime using Web Audio API
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.log("Notification audio chime played", e);
    }
  };

  // Fetch all background linkable resources & user settings
  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [tRes, nRes, rRes, iRes, profRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tasks`, { headers }),
        fetch(`${API_BASE_URL}/api/notes/workspace`, { headers }),
        fetch(`${API_BASE_URL}/api/dsa/roadmaps`, { headers }),
        fetch(`${API_BASE_URL}/api/internships`, { headers }),
        fetch(`${API_BASE_URL}/api/auth/profile`, { headers })
      ]);

      if (tRes.ok) {
        const tasks = await tRes.json();
        setAvailableTasks(tasks.filter(t => t.status !== 'done'));
      }
      if (nRes.ok) {
        const workspace = await nRes.json();
        setAvailableNotes(workspace.notes || []);
      }
      if (rRes.ok) setAvailableRoadmaps(await rRes.json());
      if (iRes.ok) setAvailableInternships(await iRes.json());
      if (profRes.ok) {
        const user = await profRes.json();
        const ssSettings = user.settings?.studySessionSettings || {};
        setUserSettings(ssSettings);
        if (ssSettings.defaultSessionType) setSessionMode(ssSettings.defaultSessionType);
        if (ssSettings.defaultTimerDuration) setSelectedDuration(ssSettings.defaultTimerDuration);
        if (ssSettings.enableFocusModeByDefault) setIsFocusMode(ssSettings.enableFocusModeByDefault);
      }
    } catch (err) {
      console.error("Error fetching study resources:", err);
    }
  };

  // Fetch Study Sessions & Stats from backend
  const fetchSessionsAndStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [sessRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/study-sessions`, { headers }),
        fetch(`${API_BASE_URL}/api/study-sessions/stats`, { headers })
      ]);

      if (sessRes.ok) setSessions(await sessRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error("Error loading study sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchSessionsAndStats();
  }, []);

  // Smart Connection auto-hydration from navigation state or URL params
  useEffect(() => {
    const state = location.state || {};
    const searchParams = new URLSearchParams(location.search);

    const modeParam = searchParams.get('mode');
    const actionParam = searchParams.get('action');

    if (modeParam === 'stopwatch' || modeParam === 'timer') {
      setSessionMode(modeParam);
    }
    if (actionParam === 'schedule') {
      setShowScheduleModal(true);
    }

    // Smart attachments from state or params
    const smartModule = state.module || searchParams.get('module');
    const smartTopic = state.topic || searchParams.get('topic');
    const smartGoal = state.goal || searchParams.get('goal');
    const smartTaskId = state.taskId || searchParams.get('taskId');
    const smartNoteId = state.noteId || searchParams.get('noteId');
    const smartRoadmapId = state.roadmapId || searchParams.get('roadmapId');
    const smartInternshipId = state.internshipId || searchParams.get('internshipId');

    if (smartModule) setSelectedModule(smartModule);
    if (smartTopic) setSelectedTopic(smartTopic);
    if (smartGoal) setSelectedGoal(smartGoal);
    if (smartTaskId) setSelectedTask(smartTaskId);
    if (smartNoteId) setSelectedNote(smartNoteId);
    if (smartRoadmapId) setSelectedRoadmap(smartRoadmapId);
    if (smartInternshipId) setSelectedInternship(smartInternshipId);
  }, [location]);

  // Sync Active Session with localStorage & continuous high-precision wall-clock timer
  useEffect(() => {
    const checkActiveSession = () => {
      const status = localStorage.getItem('study_arena_status');
      if (!status) {
        setIsSessionActive(false);
        return;
      }

      const mode = localStorage.getItem('study_arena_mode') || 'timer';
      const mod = localStorage.getItem('study_arena_module') || 'Custom Study';
      const top = localStorage.getItem('study_arena_topic') || '';
      const gol = localStorage.getItem('study_arena_goal') || '';
      const durSec = parseInt(localStorage.getItem('study_arena_duration')) || 1500;
      const startMs = parseInt(localStorage.getItem('study_arena_start_ms')) || Date.now();

      setSelectedModule(mod);
      setSelectedTopic(top);
      setSelectedGoal(gol);
      setSessionMode(mode);
      setTimerTargetSeconds(durSec);
      setStartTimeStamp(startMs);

      if (status === 'running') {
        setIsSessionActive(true);
        setIsPaused(false);

        if (mode === 'stopwatch') {
          const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
          setSecondsElapsed(elapsed);
        } else {
          // Timer mode countdown
          const endMs = parseInt(localStorage.getItem('study_arena_end_ms')) || (startMs + durSec * 1000);
          const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
          const elapsed = durSec - remaining;
          
          setSecondsElapsed(elapsed);
          setSecondsRemaining(remaining);

          // Check if timer finished!
          if (remaining <= 0) {
            localStorage.setItem('study_arena_status', 'completed');
            setIsPaused(true);
            playNotificationSound();
            if (userSettings?.desktopNotification && Notification.permission === 'granted') {
              new Notification("Study Session Completed!", {
                body: `Great job! Your study session for "${gol || top || mod}" has ended.`,
                icon: '/icon.png'
              });
            }
            setShowCompletionModal(true);
          }
        }
      } else if (status === 'paused') {
        setIsSessionActive(true);
        setIsPaused(true);
        const elapsed = parseInt(localStorage.getItem('study_arena_elapsed')) || 0;
        setSecondsElapsed(elapsed);
        if (mode === 'timer') {
          const rem = Math.max(0, durSec - elapsed);
          setSecondsRemaining(rem);
        }
      }
    };

    checkActiveSession();
    const timerInterval = setInterval(checkActiveSession, 500);
    return () => clearInterval(timerInterval);
  }, [userSettings]);

  // Handle Request Notification Permission
  useEffect(() => {
    if (userSettings?.desktopNotification && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [userSettings]);

  // Controls: Start Session
  const handleStartSession = () => {
    let durationMins = selectedDuration;
    if (selectedDuration === 'custom') {
      durationMins = parseInt(customDuration) || 25;
    }
    const durationSecs = durationMins * 60;
    const nowMs = Date.now();
    const endMs = nowMs + durationSecs * 1000;

    localStorage.setItem('study_arena_status', 'running');
    localStorage.setItem('study_arena_mode', sessionMode);
    localStorage.setItem('study_arena_module', selectedModule);
    localStorage.setItem('study_arena_topic', selectedTopic);
    localStorage.setItem('study_arena_goal', selectedGoal);
    localStorage.setItem('study_arena_duration', durationSecs.toString());
    localStorage.setItem('study_arena_start_ms', nowMs.toString());
    localStorage.setItem('study_arena_end_ms', endMs.toString());
    localStorage.setItem('study_arena_elapsed', '0');

    setIsSessionActive(true);
    setIsPaused(false);
    setSecondsElapsed(0);
    setTimerTargetSeconds(durationSecs);
    setSecondsRemaining(durationSecs);
  };

  // Controls: Pause Session
  const handlePauseSession = () => {
    localStorage.setItem('study_arena_status', 'paused');
    localStorage.setItem('study_arena_elapsed', secondsElapsed.toString());
    setIsPaused(true);
  };

  // Controls: Resume Session
  const handleResumeSession = () => {
    const nowMs = Date.now();
    if (sessionMode === 'stopwatch') {
      const adjustedStartMs = nowMs - (secondsElapsed * 1000);
      localStorage.setItem('study_arena_start_ms', adjustedStartMs.toString());
    } else {
      const remainingSecs = timerTargetSeconds - secondsElapsed;
      const newEndMs = nowMs + remainingSecs * 1000;
      localStorage.setItem('study_arena_end_ms', newEndMs.toString());
    }
    localStorage.setItem('study_arena_status', 'running');
    setIsPaused(false);
  };

  // Controls: Stop & Open Completion Modal
  const handleStopSession = () => {
    localStorage.setItem('study_arena_status', 'paused');
    localStorage.setItem('study_arena_elapsed', secondsElapsed.toString());
    setIsPaused(true);
    setShowCompletionModal(true);
  };

  // Submit Completed Session to Backend
  const handleSaveCompletedSession = async (e) => {
    if (e) e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const mod = localStorage.getItem('study_arena_module') || selectedModule;
      const top = localStorage.getItem('study_arena_topic') || selectedTopic;
      const gol = localStorage.getItem('study_arena_goal') || selectedGoal;
      const mode = localStorage.getItem('study_arena_mode') || sessionMode;
      const durSecs = secondsElapsed;

      // Automatically calculate completion status
      let calculatedStatus = 'Yes';
      if (mode === 'timer') {
        const target = timerTargetSeconds;
        if (durSecs >= target - 5) { // completed (allowing a 5-sec buffer)
          calculatedStatus = 'Yes';
        } else if (durSecs > 15) { // studied some portion
          calculatedStatus = 'Partially';
        } else { // practically no time spent
          calculatedStatus = 'No';
        }
      } else { // stopwatch mode
        if (durSecs >= 60) { // studied for at least a minute
          calculatedStatus = 'Yes';
        } else if (durSecs > 15) { // studied some portion
          calculatedStatus = 'Partially';
        } else {
          calculatedStatus = 'No';
        }
      }

      const payload = {
        module: mod,
        topic: top,
        goal: gol,
        duration: durSecs,
        mode,
        targetDuration: timerTargetSeconds,
        completionStatus: calculatedStatus,
        status: calculatedStatus === 'No' ? 'abandoned' : 'completed',
        notes: completionForm.notes,
        mood: 5,
        difficulty: 3,
        relatedTask: selectedTask || null,
        relatedNote: selectedNote || null,
        relatedRoadmap: selectedRoadmap || null,
        relatedInternship: selectedInternship || null
      };

      const res = await fetch(`${API_BASE_URL}/api/study-sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Clear active session storage
        localStorage.removeItem('study_arena_status');
        localStorage.removeItem('study_arena_mode');
        localStorage.removeItem('study_arena_module');
        localStorage.removeItem('study_arena_topic');
        localStorage.removeItem('study_arena_goal');
        localStorage.removeItem('study_arena_duration');
        localStorage.removeItem('study_arena_start_ms');
        localStorage.removeItem('study_arena_end_ms');
        localStorage.removeItem('study_arena_elapsed');

        setIsSessionActive(false);
        setIsPaused(false);
        setSecondsElapsed(0);
        setShowCompletionModal(false);
        setIsFocusMode(false);

        // Notify dashboard & fetch updated stats
        window.dispatchEvent(new Event('study-session-logged'));
        window.dispatchEvent(new Event('dashboard-data-updated'));
        fetchSessionsAndStats();
      }
    } catch (err) {
      console.error("Error saving completed study session:", err);
    }
  };

  // Submit Scheduled Session
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const scheduledDateTime = new Date(`${scheduleForm.date}T${scheduleForm.time}`);

      const payload = {
        module: scheduleForm.module,
        topic: scheduleForm.topic,
        goal: scheduleForm.goal,
        isScheduled: true,
        scheduledDate: scheduledDateTime,
        scheduledDurationMinutes: Number(scheduleForm.durationMinutes),
        status: 'scheduled',
        mode: 'timer',
        targetDuration: Number(scheduleForm.durationMinutes) * 60
      };

      const res = await fetch(`${API_BASE_URL}/api/study-sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowScheduleModal(false);
        setScheduleForm({
          module: 'Custom Study',
          topic: '',
          goal: '',
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          durationMinutes: 30
        });
        fetchSessionsAndStats();
        window.dispatchEvent(new Event('dashboard-data-updated'));
      }
    } catch (err) {
      console.error("Error creating scheduled session:", err);
    }
  };

  // Format seconds into HH:MM:SS or MM:SS
  const formatTimeDisplay = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered Sessions for Study History
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      // Period filter
      if (historyPeriod !== 'all') {
        const sessDate = new Date(s.createdAt || s.scheduledDate);
        const now = new Date();
        if (historyPeriod === 'today') {
          if (sessDate.toDateString() !== now.toDateString()) return false;
        } else if (historyPeriod === 'week') {
          const diffDays = Math.floor((now - sessDate) / (1000 * 60 * 60 * 24));
          if (diffDays > 7) return false;
        } else if (historyPeriod === 'month') {
          if (sessDate.getMonth() !== now.getMonth() || sessDate.getFullYear() !== now.getFullYear()) return false;
        } else if (historyPeriod === 'year') {
          if (sessDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // Module filter
      if (historyModuleFilter !== 'All' && s.module !== historyModuleFilter) {
        return false;
      }

      // Topic Search filter
      if (historyTopicSearch.trim() !== '') {
        const query = historyTopicSearch.toLowerCase();
        const topMatch = (s.topic || '').toLowerCase().includes(query);
        const goalMatch = (s.goal || '').toLowerCase().includes(query);
        if (!topMatch && !goalMatch) return false;
      }

      return true;
    });
  }, [sessions, historyPeriod, historyModuleFilter, historyTopicSearch]);

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse pb-16">
        <div className="h-16 bg-white/10 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-[300px] bg-white/5 rounded-2xl md:col-span-2"></div>
          <div className="h-[300px] bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-20 relative font-sans text-slate-50">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 light-glass rounded-2xl shadow-xl border border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Timer className="w-6 h-6 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
            Study Sessions
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Central focus arena, history tracking, and deep study analytics.
          </p>
        </div>

        {/* Tab Mode Switcher */}
        <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('arena')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'arena'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Session Arena
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> History & Reports
          </button>
        </div>
      </div>

      {/* QUICK STATS CARDS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl light-glass border border-white/5 shadow flex flex-col justify-center items-center text-center hover-lift-scale">
          <span className="text-2xl font-extrabold text-blue-300 drop-shadow">{stats?.todaysHours || '0.0'}h</span>
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mt-1">Today's Hours</span>
        </div>
        <div className="p-4 rounded-2xl light-glass border border-white/5 shadow flex flex-col justify-center items-center text-center hover-lift-scale">
          <span className="text-2xl font-extrabold text-emerald-300 drop-shadow">{stats?.weeklyHours || '0.0'}h</span>
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mt-1">This Week</span>
        </div>
        <div className="p-4 rounded-2xl light-glass border border-white/5 shadow flex flex-col justify-center items-center text-center hover-lift-scale">
          <span className="text-2xl font-extrabold text-amber-300 drop-shadow">{stats?.studyStreak || 0} Days</span>
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mt-1">Current Streak</span>
        </div>
        <div className="p-4 rounded-2xl light-glass border border-white/5 shadow flex flex-col justify-center items-center text-center hover-lift-scale">
          <span className="text-2xl font-extrabold text-purple-300 drop-shadow">{stats?.sessionsCompleted || 0}</span>
          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mt-1">Completed Sessions</span>
        </div>
      </div>

      {/* =========================================
          TAB 1: SESSION ARENA & SETUP
          ========================================= */}
      {activeTab === 'arena' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* MAIN TIMER / ARENA PANEL (Col Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ARENA CONTAINER */}
            <div className="p-8 rounded-3xl strong-glass border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[420px]">
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none"></div>

              {/* Status Header */}
              <div className="flex items-center gap-2 mb-6">
                <span className={`w-2.5 h-2.5 rounded-full ${isSessionActive ? (isPaused ? 'bg-orange-400' : 'bg-emerald-400 animate-ping') : 'bg-white/30'}`}></span>
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                  {isSessionActive ? (isPaused ? 'Session Paused' : `${sessionMode.toUpperCase()} RUNNING`) : 'Arena Ready'}
                </span>
              </div>

              {/* Active Topic & Goal Metadata */}
              {isSessionActive && (
                <div className="mb-6 space-y-1 animate-in fade-in">
                  <div className="inline-block px-3 py-1 bg-blue-500/15 border border-blue-500/30 rounded-full text-xs font-bold text-blue-300 mb-2">
                    {selectedModule} {selectedTopic ? `• ${selectedTopic}` : ''}
                  </div>
                  {selectedGoal && (
                    <h2 className="text-lg font-bold text-white max-w-md mx-auto leading-snug">
                      "{selectedGoal}"
                    </h2>
                  )}
                </div>
              )}

              {/* Real-time Timer Counter Display */}
              <div className="my-6">
                <div className="text-6xl sm:text-7xl font-mono text-white tracking-widest font-extralight drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                  {sessionMode === 'timer'
                    ? formatTimeDisplay(secondsRemaining)
                    : formatTimeDisplay(secondsElapsed)}
                </div>
                <div className="text-[11px] text-white/40 uppercase font-semibold tracking-widest mt-3">
                  {sessionMode === 'timer' ? `Elapsed: ${formatTimeDisplay(secondsElapsed)}` : 'Stopwatch Mode'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                {!isSessionActive ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleStartSession}
                      className="px-8 py-3.5 rounded-2xl glass-btn-primary font-bold text-sm flex items-center gap-2 shadow-xl hover-lift-scale"
                    >
                      <Play className="w-4 h-4 fill-white" /> Start Session
                    </button>

                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-5 py-3.5 rounded-2xl glass-btn-secondary text-xs font-bold flex items-center gap-2"
                    >
                      <CalendarIcon className="w-4 h-4 text-emerald-400" /> Schedule
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {isPaused ? (
                      <button
                        onClick={handleResumeSession}
                        className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/35 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow transition-all"
                      >
                        <Play className="w-4 h-4 fill-emerald-300" /> Resume
                      </button>
                    ) : (
                      <button
                        onClick={handlePauseSession}
                        className="px-6 py-3 bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/35 text-orange-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow transition-all"
                      >
                        <Pause className="w-4 h-4 fill-orange-300" /> Pause
                      </button>
                    )}

                    <button
                      onClick={handleStopSession}
                      className="px-6 py-3 bg-red-500/20 border border-red-500/30 hover:bg-red-500/35 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow transition-all"
                    >
                      <Square className="w-4 h-4 fill-red-300" /> End Session
                    </button>

                    <button
                      onClick={() => setIsFocusMode(true)}
                      className="px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow transition-all"
                      title="Enter distraction-free focus mode"
                    >
                      <Maximize2 className="w-4 h-4 text-blue-400" /> Focus Mode
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* QUICK PRESETS & SETUP CONTROLS */}
            {!isSessionActive && (
              <div className="p-6 rounded-2xl light-glass border border-white/5 shadow-xl space-y-5">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" /> Session Mode & Duration
                </h3>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSessionMode('timer')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      sessionMode === 'timer'
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow'
                        : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    <Timer className="w-4 h-4" /> Timer Mode (Countdown)
                  </button>
                  <button
                    onClick={() => setSessionMode('stopwatch')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      sessionMode === 'stopwatch'
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow'
                        : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4" /> Stopwatch Mode (Countup)
                  </button>
                </div>

                {/* Duration Presets for Timer Mode */}
                {sessionMode === 'timer' && (
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Duration Presets</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {[15, 25, 30, 45, 60, 90].map(mins => (
                        <button
                          key={mins}
                          onClick={() => setSelectedDuration(mins)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            selectedDuration === mins
                              ? 'bg-blue-500 text-white border-blue-400 shadow-md'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {mins} min
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedDuration('custom')}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedDuration === 'custom'
                            ? 'bg-blue-500 text-white border-blue-400 shadow-md'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        Custom
                      </button>
                    </div>

                    {selectedDuration === 'custom' && (
                      <div className="mt-3">
                        <input
                          type="number"
                          value={customDuration}
                          onChange={e => setCustomDuration(e.target.value)}
                          placeholder="Enter custom duration in minutes..."
                          className="w-full glass-input px-4 py-2.5 text-xs text-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* SIDEBAR SETUP & SMART CONNECTIONS (Col Span 1) */}
          <div className="space-y-6">
            
            <div className="p-6 rounded-2xl light-glass border border-white/5 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Session Setup & Context
              </h3>

              {/* Module Selector */}
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Target Module</label>
                <select
                  disabled={isSessionActive}
                  value={selectedModule}
                  onChange={e => setSelectedModule(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 text-xs text-white bg-slate-950 outline-none"
                >
                  {['Task OS', 'DSA OS', 'Notes OS', 'Internship OS', 'Dashboard', 'Custom Study'].map(mod => (
                    <option key={mod} value={mod} className="bg-slate-900">{mod}</option>
                  ))}
                </select>
              </div>

              {/* Topic Input */}
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Topic / Subject</label>
                <input
                  type="text"
                  disabled={isSessionActive}
                  value={selectedTopic}
                  onChange={e => setSelectedTopic(e.target.value)}
                  placeholder="e.g. Sliding Window, DBMS..."
                  className="w-full glass-input px-4 py-2.5 text-xs text-white"
                />
              </div>

              {/* Session Goal Input */}
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Session Goal</label>
                <input
                  type="text"
                  disabled={isSessionActive}
                  value={selectedGoal}
                  onChange={e => setSelectedGoal(e.target.value)}
                  placeholder="e.g. Finish Binary Search problems..."
                  className="w-full glass-input px-4 py-2.5 text-xs text-white"
                />
              </div>

              {/* Optional Smart Attachment Dropdowns */}
              {!isSessionActive && (
                <div className="pt-2 border-t border-white/5 space-y-3">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Smart Attachments</p>

                  {/* Task Attachment */}
                  {availableTasks.length > 0 && (
                    <div>
                      <label className="block text-[10px] text-white/50 mb-1 flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-emerald-400" /> Link Task
                      </label>
                      <select
                        value={selectedTask}
                        onChange={e => setSelectedTask(e.target.value)}
                        className="w-full glass-input px-3 py-2 text-[11px] text-white bg-slate-950 outline-none"
                      >
                        <option value="" className="bg-slate-900">None</option>
                        {availableTasks.map(t => (
                          <option key={t._id} value={t._id} className="bg-slate-900">{t.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Note Attachment */}
                  {availableNotes.length > 0 && (
                    <div>
                      <label className="block text-[10px] text-white/50 mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-purple-400" /> Link Note
                      </label>
                      <select
                        value={selectedNote}
                        onChange={e => setSelectedNote(e.target.value)}
                        className="w-full glass-input px-3 py-2 text-[11px] text-white bg-slate-950 outline-none"
                      >
                        <option value="" className="bg-slate-900">None</option>
                        {availableNotes.map(n => (
                          <option key={n._id} value={n._id} className="bg-slate-900">{n.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Roadmap Attachment */}
                  {availableRoadmaps.length > 0 && (
                    <div>
                      <label className="block text-[10px] text-white/50 mb-1 flex items-center gap-1.5">
                        <Code2 className="w-3 h-3 text-blue-400" /> Link DSA Roadmap
                      </label>
                      <select
                        value={selectedRoadmap}
                        onChange={e => setSelectedRoadmap(e.target.value)}
                        className="w-full glass-input px-3 py-2 text-[11px] text-white bg-slate-950 outline-none"
                      >
                        <option value="" className="bg-slate-900">None</option>
                        {availableRoadmaps.map(r => (
                          <option key={r._id} value={r._id} className="bg-slate-900">{r.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Internship Attachment */}
                  {availableInternships.length > 0 && (
                    <div>
                      <label className="block text-[10px] text-white/50 mb-1 flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-pink-400" /> Link Internship
                      </label>
                      <select
                        value={selectedInternship}
                        onChange={e => setSelectedInternship(e.target.value)}
                        className="w-full glass-input px-3 py-2 text-[11px] text-white bg-slate-950 outline-none"
                      >
                        <option value="" className="bg-slate-900">None</option>
                        {availableInternships.map(i => (
                          <option key={i._id} value={i._id} className="bg-slate-900">{i.company} ({i.role})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* =========================================
          TAB 2: HISTORY & REPORTS MODE
          ========================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          
          {/* FILTER BAR & VIEW SWITCHER */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 p-4 rounded-2xl light-glass border border-white/5 shadow">
            
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Period dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/40 uppercase">Period:</span>
                <select
                  value={historyPeriod}
                  onChange={e => setHistoryPeriod(e.target.value)}
                  className="glass-input px-3 py-1.5 text-xs text-white bg-slate-950 outline-none"
                >
                  <option value="all" className="bg-slate-900">All Time</option>
                  <option value="today" className="bg-slate-900">Today</option>
                  <option value="week" className="bg-slate-900">This Week</option>
                  <option value="month" className="bg-slate-900">This Month</option>
                  <option value="year" className="bg-slate-900">This Year</option>
                </select>
              </div>

              {/* Module dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/40 uppercase">Module:</span>
                <select
                  value={historyModuleFilter}
                  onChange={e => setHistoryModuleFilter(e.target.value)}
                  className="glass-input px-3 py-1.5 text-xs text-white bg-slate-950 outline-none"
                >
                  {['All', 'Task OS', 'DSA OS', 'Notes OS', 'Internship OS', 'Dashboard', 'Custom Study'].map(m => (
                    <option key={m} value={m} className="bg-slate-900">{m}</option>
                  ))}
                </select>
              </div>

              {/* Search Topic */}
              <input
                type="text"
                value={historyTopicSearch}
                onChange={e => setHistoryTopicSearch(e.target.value)}
                placeholder="Filter topic / goal..."
                className="glass-input px-3 py-1.5 text-xs text-white w-40"
              />
            </div>

            {/* View Modes */}
            <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => setHistoryView('timeline')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  historyView === 'timeline' ? 'bg-blue-500/20 text-blue-300' : 'text-white/50 hover:text-white'
                }`}
                title="Timeline View"
              >
                <List className="w-4 h-4" /> <span className="hidden sm:inline">Timeline</span>
              </button>

              <button
                onClick={() => setHistoryView('cards')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  historyView === 'cards' ? 'bg-blue-500/20 text-blue-300' : 'text-white/50 hover:text-white'
                }`}
                title="Cards View"
              >
                <Grid className="w-4 h-4" /> <span className="hidden sm:inline">Cards</span>
              </button>

              <button
                onClick={() => setHistoryView('stats')}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  historyView === 'stats' ? 'bg-blue-500/20 text-blue-300' : 'text-white/50 hover:text-white'
                }`}
                title="Statistics View"
              >
                <BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">Stats</span>
              </button>
            </div>

          </div>

          {/* VIEW CONTENT */}
          
          {/* 1. TIMELINE VIEW */}
          {historyView === 'timeline' && (
            <div className="p-6 rounded-2xl light-glass border border-white/5 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Study Sessions Timeline</h3>

              {filteredSessions.length === 0 ? (
                <p className="text-center text-white/40 text-xs py-10 italic">No study sessions logged for the selected filters.</p>
              ) : (
                <div className="space-y-3">
                  {filteredSessions.map(sess => (
                    <div
                      key={sess._id}
                      onClick={() => setSelectedSessionDetail(sess)}
                      className="p-4 rounded-xl light-glass hover:bg-white/5 transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-white/5"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {Math.round((sess.duration || 0) / 60)}m
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            {sess.module} {sess.topic ? `• ${sess.topic}` : ''}
                            {sess.isScheduled && (
                              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">Scheduled</span>
                            )}
                          </p>
                          <p className="text-xs text-white/50 mt-0.5">{sess.goal || 'No explicit goal set'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs shrink-0 self-end sm:self-auto">
                        <div className="flex items-center gap-1 text-amber-300 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-300" /> {sess.mood || 5}
                        </div>
                        <span className="text-white/30">•</span>
                        <span className="text-white/40 font-mono text-[11px]">
                          {new Date(sess.createdAt || sess.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. CARDS VIEW */}
          {historyView === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.length === 0 ? (
                <div className="col-span-full p-10 text-center text-white/40 text-xs light-glass rounded-2xl">
                  No sessions matching criteria.
                </div>
              ) : (
                filteredSessions.map(sess => (
                  <div
                    key={sess._id}
                    onClick={() => setSelectedSessionDetail(sess)}
                    className="p-5 rounded-2xl light-glass border border-white/5 shadow hover-lift-scale cursor-pointer flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2.5 py-1 bg-blue-500/15 text-blue-300 border border-blue-500/25 text-[10px] font-bold rounded-lg uppercase">
                          {sess.module}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {Math.round((sess.duration || 0) / 60)} Minutes
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-1 truncate">{sess.topic || 'General Session'}</h4>
                      <p className="text-xs text-white/60 line-clamp-2">{sess.goal || sess.notes || 'No description added.'}</p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-white/40">
                      <span>{new Date(sess.createdAt || sess.scheduledDate).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1 text-amber-300">
                        <Star className="w-3 h-3 fill-amber-300" /> {sess.mood || 5} / 5
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. DETAILED STATISTICS VIEW */}
          {historyView === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-6 rounded-2xl light-glass border border-white/5 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Calculated Study Metrics</h3>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/60">Total Lifetime Hours</span>
                    <span className="font-bold text-white">{stats?.totalLifetimeHours || '0.0'}h</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/60">Average Session Length</span>
                    <span className="font-bold text-white">{stats?.averageSessionLengthMinutes || 0} Minutes</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/60">Longest Session</span>
                    <span className="font-bold text-emerald-400">{stats?.longestSessionMinutes || 0} Minutes</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-white/60">Longest Study Streak</span>
                    <span className="font-bold text-orange-400">{stats?.longestStreak || 0} Days</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl light-glass border border-white/5 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Module & Topic Focus Breakdown</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Most Studied Module</p>
                    <p className="text-base font-extrabold text-blue-400">{stats?.mostStudiedModule || 'None'}</p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Most Studied Topic</p>
                    <p className="text-base font-extrabold text-purple-400">{stats?.mostStudiedTopic || 'None'}</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* =========================================
          FULLSCREEN FOCUS MODE OVERLAY
          ========================================= */}
      {isFocusMode && (
        <div className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-white animate-in fade-in">
          
          <button
            onClick={() => setIsFocusMode(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Exit Focus Mode"
          >
            <Minimize2 className="w-6 h-6" />
          </button>

          <div className="max-w-xl text-center space-y-8">
            <div>
              <span className="px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest border border-blue-500/30">
                Distraction-Free Focus Arena
              </span>
              <h2 className="text-2xl font-bold mt-4 text-white">
                {selectedGoal || selectedTopic || selectedModule}
              </h2>
            </div>

            <div className="text-7xl sm:text-8xl font-mono tracking-widest font-extralight text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              {sessionMode === 'timer' ? formatTimeDisplay(secondsRemaining) : formatTimeDisplay(secondsElapsed)}
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
              {isPaused ? (
                <button
                  onClick={handleResumeSession}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white text-sm shadow-xl flex items-center gap-2"
                >
                  <Play className="w-5 h-5 fill-white" /> Resume
                </button>
              ) : (
                <button
                  onClick={handlePauseSession}
                  className="px-8 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 font-bold text-white text-sm shadow-xl flex items-center gap-2"
                >
                  <Pause className="w-5 h-5 fill-white" /> Pause
                </button>
              )}

              <button
                onClick={handleStopSession}
                className="px-8 py-3.5 rounded-2xl bg-red-500/30 border border-red-500/40 hover:bg-red-500/40 text-red-300 font-bold text-sm shadow-xl flex items-center gap-2"
              >
                <Square className="w-5 h-5 fill-red-300" /> End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          SESSION COMPLETION MODAL
          ========================================= */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md strong-glass p-7 text-white space-y-6 border border-white/10 shadow-2xl rounded-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> Session Summary
              </h3>
              <button onClick={() => setShowCompletionModal(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompletedSession} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Session Notes (optional)</label>
                <textarea
                  value={completionForm.notes}
                  onChange={e => setCompletionForm({ ...completionForm, notes: e.target.value })}
                  placeholder="Record key takeaways..."
                  rows="3"
                  className="w-full glass-input px-4 py-2.5 text-xs text-white resize-none"
                ></textarea>
              </div>

              <button type="submit" className="w-full py-3.5 glass-btn-primary font-bold text-xs mt-2 shadow-lg">
                Save & Complete Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          CREATE SCHEDULED SESSION MODAL
          ========================================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md strong-glass p-7 text-white space-y-6 border border-white/10 shadow-2xl rounded-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-400" /> Schedule Study Session
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Module</label>
                <select
                  value={scheduleForm.module}
                  onChange={e => setScheduleForm({ ...scheduleForm, module: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 text-xs text-white bg-slate-950 outline-none"
                >
                  {['Task OS', 'DSA OS', 'Notes OS', 'Internship OS', 'Dashboard', 'Custom Study'].map(mod => (
                    <option key={mod} value={mod} className="bg-slate-900">{mod}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Topic</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.topic}
                  onChange={e => setScheduleForm({ ...scheduleForm, topic: e.target.value })}
                  placeholder="e.g. Graph Algorithms"
                  className="w-full glass-input px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.date}
                    onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs text-white bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.time}
                    onChange={e => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className="w-full glass-input px-3 py-2 text-xs text-white bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  value={scheduleForm.durationMinutes}
                  onChange={e => setScheduleForm({ ...scheduleForm, durationMinutes: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 text-xs text-white"
                />
              </div>

              <button type="submit" className="w-full py-3.5 glass-btn-primary font-bold text-xs mt-2 shadow-lg">
                Create Scheduled Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          SESSION DETAILS MODAL
          ========================================= */}
      {selectedSessionDetail && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md strong-glass p-7 text-white space-y-5 border border-white/10 shadow-2xl rounded-3xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-400" /> Session Details
              </h3>
              <button onClick={() => setSelectedSessionDetail(null)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-white/50">Module:</span>
                <span className="font-bold text-white">{selectedSessionDetail.module}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/50">Topic:</span>
                <span className="font-bold text-white">{selectedSessionDetail.topic || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/50">Goal:</span>
                <span className="font-bold text-white">{selectedSessionDetail.goal || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/50">Duration:</span>
                <span className="font-bold text-emerald-400">
                  {selectedSessionDetail.isScheduled ? `${selectedSessionDetail.scheduledDurationMinutes || 30} mins` : `${Math.round((selectedSessionDetail.duration || 0) / 60)} mins`}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/50">Date:</span>
                <span className="font-bold text-white">
                  {new Date(selectedSessionDetail.createdAt || selectedSessionDetail.scheduledDate).toLocaleString()}
                </span>
              </div>

              {selectedSessionDetail.notes && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-white/40 uppercase text-[10px] font-bold block mb-1">Notes:</span>
                  <p className="text-white/80 bg-white/5 p-3 rounded-xl">{selectedSessionDetail.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedSessionDetail(null)}
              className="w-full py-2.5 glass-btn-secondary text-xs font-bold rounded-xl mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudySessionsPage;
