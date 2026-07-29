import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import DashboardLayout from '../components/DashboardLayout';
import DsaRightPanel from '../components/dsa/DsaRightPanel';
import { 
  Code2, Layers, ChevronRight, Play, CheckCircle2, 
  Circle, X, BarChart2, Trophy, GitBranch, BrainCircuit, 
  LayoutGrid, ArrowDownUp, Plus, Library, BookOpen, Link2, 
  RefreshCcw, Database, Star, Clock, Calendar, Timer, 
  ExternalLink, TrendingUp, Target, Award, History, Edit3, CalendarPlus,
  Zap, Cpu 
} from 'lucide-react';

// ==========================================
// 1. DATA HOOK & ENGINE
// ==========================================
const useDSA = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [topics, setTopics] = useState([]);
  const [problems, setProblems] = useState([]);
  const [syncProfile, setSyncProfile] = useState({ leetcode: '', codeforces: '', geeksforgeeks: '', lastSyncAt: null });
  const [syncStats, setSyncStats] = useState({ leetcode: 0, codeforces: 0, gfg: 0 });
  const [platformStates, setPlatformStates] = useState({ leetcode: 'Idle', codeforces: 'Idle', geeksforgeeks: 'Idle' });
  
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [contestHistory, setContestHistory] = useState([]);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncPaused, setSyncPaused] = useState(false);
  const [currentSyncPlatform, setCurrentSyncPlatform] = useState(null);

  useEffect(() => {
    const progressListener = (event) => {
      if (event.data && event.data.type === "SYNC_PROGRESS_UPDATE") {
        setCurrentSyncPlatform(event.data.platform);
        setSyncPaused(event.data.isPaused);
      }
    };
    window.addEventListener("message", progressListener);
    return () => window.removeEventListener("message", progressListener);
  }, []);

  // --- DAILY CHALLENGE ENGINE ---
  // --- DAILY CHALLENGE ENGINE (WITH LOCALSTORAGE LOCK) ---
  const generateChallenges = (allProblems) => {
    if (!allProblems || allProblems.length === 0) return;
    
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const unsolved = allProblems.filter(p => p.status !== 'solved');
    const easyPool = unsolved.filter(p => p.difficulty === 'easy');
    const medHardPool = unsolved.filter(p => p.difficulty === 'medium' || p.difficulty === 'hard');
    const solvedPool = allProblems.filter(p => p.status === 'solved');
    
    const quests = [
      { ...(pickRandom(easyPool) || pickRandom(unsolved) || pickRandom(allProblems)), questType: 'Easy Warm-up', questIcon: '☕', targetTime: '15 Minutes' },
      { ...(pickRandom(medHardPool) || pickRandom(unsolved) || pickRandom(allProblems)), questType: 'Weekly Boss Challenge', questIcon: '🐉', targetTime: '45 Minutes' },
      { ...(pickRandom(solvedPool) || pickRandom(allProblems)), questType: 'Revision Challenge', questIcon: '🧠', targetTime: '20 Minutes' }
    ].filter(c => c && c._id); 
    
    // Lock them into local storage
    localStorage.setItem('daily_quests_date', new Date().toDateString());
    localStorage.setItem('daily_quests_ids', JSON.stringify(quests.map(q => q._id)));
    setDailyChallenges(quests);
  };

  // 🔥 THE MAGIC SYNC LISTENER
  // Every time 'problems' updates (like when you tab back and fetchData runs), this checks the lock!
  useEffect(() => {
    if (problems.length === 0) return;

    const todayStr = new Date().toDateString();
    const savedDate = localStorage.getItem('daily_quests_date');
    const savedIds = JSON.parse(localStorage.getItem('daily_quests_ids') || '[]');

    // If we have locked quests for today, hydrate them with the FRESH database stats!
    if (savedDate === todayStr && savedIds.length === 3) {
      const restored = savedIds.map((id, index) => {
        // Find the absolute freshest version of this problem from the DB
        const freshProb = problems.find(p => p._id === id);
        if (!freshProb) return null;
        
        return {
          ...freshProb,
          questType: ['Easy Warm-up', 'Weekly Boss Challenge', 'Revision Challenge'][index],
          questIcon: ['☕', '🐉', '🧠'][index],
          targetTime: ['15 Minutes', '45 Minutes', '20 Minutes'][index]
        };
      }).filter(Boolean);

      if (restored.length === 3) {
        setDailyChallenges(restored);
        return;
      }
    }

    // If no quests are locked for today, generate new ones
    generateChallenges(problems);
  }, [problems]);

  const replaceChallenge = (index) => {
    const unsolved = problems.filter(p => p.status !== 'solved');
    if (unsolved.length === 0) return;
    
    const updated = [...dailyChallenges];
    const newProb = unsolved[Math.floor(Math.random() * unsolved.length)];
    updated[index] = { ...newProb, questType: 'Swapped Challenge', questIcon: '🎲', targetTime: '30 Minutes', status: 'pending' };
    
    // Update the lock
    localStorage.setItem('daily_quests_ids', JSON.stringify(updated.map(q => q._id)));
    setDailyChallenges(updated);
  };

  

  const skipChallenge = (index) => {
    const updated = [...dailyChallenges];
    updated[index].status = 'skipped';
    setDailyChallenges(updated);
  };

  // 🔥 THE NEW STOPWATCH FUNCTION (Pop-up Safe)
  const startQuestTimer = (challenge) => {
    console.log("🚀 Starting Quest Timer for:", challenge.title);
    if (!localStorage.getItem(`quest_start_${challenge._id}`)) {
      localStorage.setItem(`quest_start_${challenge._id}`, Date.now());
    }
  };

  // --- FETCHERS ---
  const fetchLiveContests = async () => {
    try {
      const res = await fetch('https://codeforces.com/api/contest.list');
      if (res.ok) {
        const data = await res.json();
        const liveContests = data.result
          .filter(c => c.phase === 'BEFORE')
          .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
          .slice(0, 5)
          .map((c, index) => {
            const startDate = new Date(c.startTimeSeconds * 1000);
            return {
              id: `live-${index}`,
              name: c.name,
              platform: 'Codeforces',
              url: `https://codeforces.com/contests/${c.id}`,
              rawDate: startDate.toISOString(),
              date: startDate.toLocaleString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              duration: (c.durationSeconds / 3600).toFixed(1) + ' hours',
              color: 'blue'
            };
          });
        setUpcomingContests(liveContests);
      }
    } catch (err) { console.error("Error fetching live contests:", err); }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      let rmRes = await fetch(`${API_BASE_URL}/api/dsa/roadmaps`, { headers });
      let dbRoadmaps = await rmRes.json();
      if (dbRoadmaps.length === 0) {
        await fetch(`${API_BASE_URL}/api/dsa/seed-defaults`, { method: 'POST', headers });
        rmRes = await fetch(`${API_BASE_URL}/api/dsa/roadmaps`, { headers });
        dbRoadmaps = await rmRes.json();
      }
      setRoadmaps(dbRoadmaps);

      if (dbRoadmaps.length > 0) {
        const topRes = await fetch(`${API_BASE_URL}/api/dsa/topics/${dbRoadmaps[0]._id}`, { headers });
        if (topRes.ok) setTopics(await topRes.json());
      }

      const probRes = await fetch(`${API_BASE_URL}/api/dsa/problems`, { headers });
      if (probRes.ok) {
        const pData = await probRes.json();
        setProblems(pData); 
        // 🔥 FIX: We removed the messy setDailyChallenges block from here. 
        // We will let a dedicated useEffect handle it below!
      }

      const histRes = await fetch(`${API_BASE_URL}/api/dsa/contests`, { headers });
      if (histRes.ok) setContestHistory(await histRes.json());

      const syncRes = await fetch(`${API_BASE_URL}/api/dsa/sync-profile`, { headers });
      if (syncRes.ok) {
        const profile = await syncRes.json();
        setSyncProfile({ 
          leetcode: profile.leetcode || '', 
          codeforces: profile.codeforces || '', 
          geeksforgeeks: profile.geeksforgeeks || '',
          lastSyncAt: profile.lastSyncAt || null
        });
        if (profile.rawStats) setSyncStats(profile.rawStats);
      }

    } catch (error) { console.error("Error fetching data:", error); } 
    finally { setLoading(false); }
  };

  const execute = async (url, method, body = null) => {
    try {
      const token = localStorage.getItem('token');
      const options = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch(`${API_BASE_URL}/api/dsa${url}`, options);
      if (res.ok) { 
        fetchData(); 
        window.dispatchEvent(new Event('dashboard-data-updated'));
        return true; 
      }
      return false;
    } catch (err) { return false; }
  };

  const toggleProblem = async (problem) => {
    const newOutcome = problem.status === 'solved' ? 'unsolved' : 'solved';
    await execute(`/problems/${problem._id}/attempt`, 'POST', { outcome: newOutcome, confidenceRating: 3, timeTakenMinutes: 0 });
  };

  const toggleStar = async (problem) => { 
    await execute(`/problems/${problem._id}/star`, 'PUT'); 
  };

  const handleReview = async (problem, rating) => {
    await execute(`/problems/${problem._id}/attempt`, 'POST', { outcome: 'solved', confidenceRating: rating, timeTakenMinutes: 0 });
  };

  // --- CALENDAR INTEGRATION ---
  const handleAddToCalendar = async (contest) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: `🏆 ${contest.platform} Contest: ${contest.name}`,
          description: `Duration: ${contest.duration}\nLink: ${contest.url}`,
          deadline: new Date(contest.rawDate),
          category: 'DSA',     
          priority: 'high',    
          status: 'todo'       
        })
      });
      
      if (res.ok) {
        alert(`Successfully added ${contest.name} to your Task Calendar!`);
        window.dispatchEvent(new Event('dashboard-data-updated'));
      } else {
        const errorData = await res.json();
        alert(`Failed: ${errorData.message}`);
      }
    } catch (err) { console.error("Calendar Add Error:", err); }
  };
  
  const saveSyncProfile = async (data) => {
    const success = await execute('/sync-profile', 'POST', data);
    if (success) { 
      // Do not auto-trigger heist on silent save if verification just succeeded.
      // The calling code handles the flow.
      return true; 
    }
    return false;
  };

  // --- EXTENSION DETECTOR ---
  const checkExtensionAvailable = () => {
    return new Promise((resolve) => {
      const hasTag = document.documentElement.getAttribute('data-studentstack-extension-active') === 'true';
      if (!hasTag) {
        resolve(false);
        return;
      }
      
      const pongListener = (event) => {
        if (event.data && event.data.type === "PONG_STUDENTSTACK_EXTENSION") {
          window.removeEventListener("message", pongListener);
          clearTimeout(timeoutId);
          resolve(true);
        }
      };
      window.addEventListener("message", pongListener);
      
      const timeoutId = setTimeout(() => {
        window.removeEventListener("message", pongListener);
        resolve(false);
      }, 1000);
      
      window.postMessage({ type: "PING_STUDENTSTACK_EXTENSION" }, "*");
    });
  };

  // --- FULL UNIFIED SYNC PIPELINE ---
  const triggerAutoSync = async (handles, isSilent = false) => {
    const token = localStorage.getItem('token');
    
    // Check if extension is active
    const hasExtensionTag = document.documentElement.getAttribute('data-studentstack-extension-active') === 'true';
    const isAvailable = await checkExtensionAvailable();
    
    if (!isAvailable) {
      setIsSyncing(false);
      const newState = {};
      if (handles.leetcode) newState.leetcode = hasExtensionTag ? "SyncFailed" : "ExtensionRequired";
      if (handles.codeforces) newState.codeforces = hasExtensionTag ? "SyncFailed" : "ExtensionRequired";
      if (handles.geeksforgeeks) newState.geeksforgeeks = hasExtensionTag ? "SyncFailed" : "ExtensionRequired";
      setPlatformStates(prev => ({ ...prev, ...newState }));
      
      if (!isSilent) {
        alert(hasExtensionTag 
          ? "Unable to communicate with the StudentStack extension." 
          : "StudentStack Sync Extension is required for automatic platform synchronization."
        );
      }
      return false;
    }

    setIsSyncing(true); 
    
    const initialStates = {};
    if (handles.leetcode) initialStates.leetcode = 'Verifying';
    if (handles.codeforces) initialStates.codeforces = 'Verifying';
    if (handles.geeksforgeeks) initialStates.geeksforgeeks = 'Verifying';
    setPlatformStates(prev => ({ ...prev, ...initialStates }));

    // Safety timeout of 30 seconds
    const syncTimeoutId = setTimeout(() => {
      window.removeEventListener("message", listener);
      setIsSyncing(false);
      setCurrentSyncPlatform(null);
      setSyncPaused(false);
      
      const timeoutStates = {};
      if (handles.leetcode && platformStates.leetcode === 'Verifying') timeoutStates.leetcode = 'SyncFailed';
      if (handles.codeforces && platformStates.codeforces === 'Verifying') timeoutStates.codeforces = 'SyncFailed';
      if (handles.geeksforgeeks && platformStates.geeksforgeeks === 'Verifying') timeoutStates.geeksforgeeks = 'SyncFailed';
      setPlatformStates(prev => ({ ...prev, ...timeoutStates }));
      
      if (!isSilent) alert("Sync Timed Out: The extension is not responding.");
    }, 30000);

    window.postMessage({ 
      type: "START_LEETCODE_SYNC", 
      token: token, 
      handles: handles,
      baseUrl: window.location.origin
    }, "*");

    const listener = async function(event) {
      if (event.data.type === "SYNC_SUCCESS" || event.data.type === "SYNC_ERROR") {
        clearTimeout(syncTimeoutId);
        window.removeEventListener("message", listener);
        setIsSyncing(false);
        setCurrentSyncPlatform(null);
        setSyncPaused(false);

        const results = event.data.platformStatuses || {};
        const finalStates = {};
        if (handles.leetcode) {
          finalStates.leetcode = (results.leetcode === "Connected") ? "Connected" : "SyncFailed";
        }
        if (handles.codeforces) {
          finalStates.codeforces = (results.codeforces === "Connected") ? "Connected" : "SyncFailed";
        }
        if (handles.geeksforgeeks) {
          finalStates.geeksforgeeks = (results.geeksforgeeks === "Connected") ? "Connected" : "SyncFailed";
        }
        setPlatformStates(prev => ({ ...prev, ...finalStates }));
        
        if (event.data.type === "SYNC_SUCCESS") {
          try {
            await fetch(`${API_BASE_URL}/api/dsa/contests/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
          } catch (err) { console.error("Contest sync failed", err); }
          
          setSyncProfile(prev => ({ ...prev, lastSyncAt: new Date().toISOString() }));
          fetchData(); 
          window.dispatchEvent(new Event('dashboard-data-updated'));
          
          if (!isSilent) alert(`Auto-Sync Complete! Verified ${event.data.count} solutions and updated Contest History.`);
        } else {
          if (!isSilent) alert("Sync Failed: " + event.data.message);
        }
      }
    };
    window.addEventListener("message", listener);
    return true;
  };

  const fetchTopicsForRoadmap = async (roadmapId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/dsa/topics/${roadmapId}`, { headers: { 'Authorization': `Bearer ${token}` }});
    if (res.ok) setTopics(await res.json());
  };

  useEffect(() => { 
    fetchData(); 
    fetchLiveContests(); 
    
    // Blast token to Extension with correct origin
    const token = localStorage.getItem('token');
    if (token) {
      window.postMessage({ type: "SAVE_EXTENSION_TOKEN", token: token, backendUrl: window.location.origin }, "*");
    }
  }, []);

  useEffect(() => {
    const handleTabFocus = () => {
      console.log("Welcome back! Fetching live stats from LeetCode submission...");
      fetchData();
    };
    window.addEventListener('focus', handleTabFocus);
    return () => window.removeEventListener('focus', handleTabFocus);
  }, []);

  useEffect(() => {
    if (syncProfile.leetcode || syncProfile.codeforces || syncProfile.geeksforgeeks) {
      triggerAutoSync(syncProfile, true); 
    }
  }, [syncProfile.leetcode, syncProfile.codeforces, syncProfile.geeksforgeeks]);

  useEffect(() => {
    const initialConnectedStates = {};
    if (syncProfile.leetcode) initialConnectedStates.leetcode = 'Connected';
    if (syncProfile.codeforces) initialConnectedStates.codeforces = 'Connected';
    if (syncProfile.geeksforgeeks) initialConnectedStates.geeksforgeeks = 'Connected';
    setPlatformStates(prev => ({ ...prev, ...initialConnectedStates }));
  }, [syncProfile]);

  return { 
    roadmaps, topics, problems, syncProfile, syncStats, loading, isSyncing, 
    upcomingContests, contestHistory, dailyChallenges,
    replaceChallenge, skipChallenge, toggleProblem, toggleStar, 
    handleReview, fetchTopicsForRoadmap, saveSyncProfile, 
    triggerAutoSync, handleAddToCalendar, 
    startQuestTimer,
    platformStates, setPlatformStates, checkExtensionAvailable,
    syncPaused, setSyncPaused, currentSyncPlatform, setCurrentSyncPlatform
  };
}; // <-- This is the end of useDSA()

// ==========================================
// 2. UI PANELS
// ==========================================

const AnalyticsPanel = ({ problems, syncStats, contestHistory }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const solvedCount = problems.filter(p => p.status === 'solved').length;
  const totalProblems = problems.length > 0 ? problems.length : 438; 
  const rawPercent = (solvedCount / totalProblems) * 100;
  const displayPercent = rawPercent > 0 && rawPercent < 1 ? rawPercent.toFixed(1) : Math.floor(rawPercent);
  const barWidth = solvedCount > 0 ? Math.max(rawPercent, 1.5) : 0;

  const currentYear = new Date().getFullYear();
  const activeYears = new Set([currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4]);
  problems.forEach(p => { if (p.attempts) p.attempts.forEach(a => activeYears.add(new Date(a.date).getFullYear())); });
  const yearsArray = Array.from(activeYears).sort((a, b) => b - a);

  let submissionsInYear = 0;
  problems.forEach(p => { 
    if (p.attempts) {
      p.attempts.forEach(a => { 
        if (new Date(a.date).getFullYear() === selectedYear) submissionsInYear++; 
      });
    }
  });

  const generateHeatmapForYear = (year) => {
    const today = new Date(); 
    const monthsData = [];
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthName = new Date(year, monthIndex, 1).toLocaleString('default', { month: 'short' });
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
      
      const weeks = []; 
      let currentWeek = Array(firstDayOfWeek).fill(null);
      
      for (let d = 1; d <= daysInMonth; d++) {
        const currentDate = new Date(year, monthIndex, d); 
        let activityLevel = 0;
        
        if (currentDate <= today) {
          problems.forEach(p => { 
            if (p.attempts) {
              p.attempts.forEach(attempt => {
                const aDate = new Date(attempt.date);
                if (aDate.getFullYear() === year && aDate.getMonth() === monthIndex && aDate.getDate() === d) {
                  activityLevel++;
                }
              });
            }
          });
        }
        
        currentWeek.push({ date: currentDate.toDateString(), level: activityLevel });
        if (currentWeek.length === 7) { 
          weeks.push(currentWeek); 
          currentWeek = []; 
        }
      }
      
      if (currentWeek.length > 0 && currentWeek.length < 7) { 
        while (currentWeek.length < 7) currentWeek.push(null); 
        weeks.push(currentWeek); 
      }
      monthsData.push({ name: monthName, weeks });
    }
    return monthsData;
  };

  const heatmapMonths = generateHeatmapForYear(selectedYear);
  
  const getActivityColor = (level) => {
    if (level === 0) return 'bg-[#161b22] border-white/5';   
    if (level === 1) return 'bg-[#0969da] border-[#0969da]'; 
    if (level === 2) return 'bg-[#54aeff] border-[#54aeff]'; 
    if (level >= 3) return 'bg-[#b6e3ff] border-[#b6e3ff]';  
  };

  return (
    <div className="flex flex-col gap-6 mt-4 animate-in fade-in slide-in-from-top-4">
      
      {/* Total Score Card */}
      <div className="p-6 shadow-xl flex items-center justify-between light-glass hover-lift-scale">
        <div className="w-1/2 flex flex-col justify-center">
          <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">Total Score</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{solvedCount}</span>
            <span className="text-sm font-bold text-white/40">/ {totalProblems} Solved</span>
          </div>
        </div>
        <div className="w-1/2 flex flex-col items-end gap-2">
          <span className="text-sm font-bold text-blue-400">{displayPercent}% Completed</span>
          <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${barWidth}%` }}></div>
          </div>
        </div>
      </div>

      {/* Heatmap Card */}
      <div className="p-6 flex flex-col light-glass hover-lift-scale shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">{submissionsInYear} submissions in {selectedYear}</h3>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))} 
            className="bg-white/5 border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-white/10 transition-all"
          >
            {yearsArray.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="w-full overflow-x-auto scrollbar-hide pb-2">
          <div className="min-w-max flex gap-4"> 
            {heatmapMonths.map((month, mIndex) => (
              <div key={mIndex} className="flex flex-col items-center">
                <div className="flex gap-[3px] mb-2">
                  {month.weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-[3px]">
                      {week.map((day, dIndex) => {
                        if (!day) return <div key={`empty-${dIndex}`} className="w-3 h-3 rounded-[3px] opacity-0"></div>;
                        return (
                          <div 
                            key={day.date} 
                            title={`${day.date}: ${day.level} problems solved`} 
                            className={`w-3 h-3 rounded-[3px] border transition-colors hover:border-white/40 cursor-pointer ${getActivityColor(day.level)}`}
                          ></div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-white/40 font-medium">{month.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global Sync Cards */}
      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-widest pl-2">Global Lifetime Sync</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 flex flex-col items-center justify-center gap-2 light-glass hover-lift-scale shadow">
            <span className="text-3xl font-extrabold text-blue-400">{syncStats.leetcode}</span>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">LeetCode</span>
          </div>
          <div className="p-5 flex flex-col items-center justify-center gap-2 light-glass hover-lift-scale shadow">
            <span className="text-3xl font-extrabold text-blue-400">{syncStats.codeforces}</span>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Codeforces</span>
          </div>
          <div className="p-5 flex flex-col items-center justify-center gap-2 light-glass hover-lift-scale shadow">
            <span className="text-3xl font-extrabold text-blue-400">{syncStats.gfg}</span>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">GeeksForGeeks</span>
          </div>
          <div className="p-5 flex flex-col items-center justify-center gap-2 light-glass hover-lift-scale shadow">
            <span className="text-3xl font-extrabold text-blue-400">{contestHistory?.length || 0}</span>
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Contests</span>
          </div>
        </div>
      </div>
      
    </div>
  );
};

const ContestHubPanel = ({ upcomingContests, contestHistory, handleAddToCalendar }) => {
  const maxRating = contestHistory.length > 0 ? Math.max(...contestHistory.map(c => c.newRating || 0)) : 0;
  const avgRank = contestHistory.length > 0 ? Math.floor(contestHistory.reduce((acc, c) => acc + (c.rank || 0), 0) / contestHistory.length) : 0;

  return (
    <div className="flex flex-col gap-6 mt-4 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Analytics Banner */}
      <div className="grid grid-cols-3 gap-6">
        <div className="p-5 flex flex-col items-center justify-center gap-1 shadow-lg light-glass hover-lift-scale">
          <TrendingUp className="w-6 h-6 text-emerald-400 mb-1" />
          <span className="text-2xl font-extrabold text-white">{maxRating || 'N/A'}</span>
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Max Rating</span>
        </div>
        <div className="p-5 flex flex-col items-center justify-center gap-1 shadow-lg light-glass hover-lift-scale">
          <Target className="w-6 h-6 text-blue-400 mb-1" />
          <span className="text-2xl font-extrabold text-white">{contestHistory.length}</span>
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Contests Logged</span>
        </div>
        <div className="p-5 flex flex-col items-center justify-center gap-1 shadow-lg light-glass hover-lift-scale">
          <Award className="w-6 h-6 text-amber-400 mb-1" />
          <span className="text-2xl font-extrabold text-white">{avgRank ? `Top ${avgRank}` : 'N/A'}</span>
          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Average Rank</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upcoming Contests */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 pl-2">
            <Calendar className="w-4 h-4 text-white/50" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Upcoming Calendar</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {upcomingContests.length === 0 ? (
              <div className="p-4 rounded-2xl text-center text-white/50 text-xs light-glass">
                Scanning Codeforces for live contests...
              </div>
            ) : (
              upcomingContests.map(contest => (
                <div key={contest.id} className="p-4 shadow-lg hover-lift-scale group light-glass">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider mb-1 text-blue-400">
                        {contest.platform}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{contest.name}</h4>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleAddToCalendar(contest)}
                        title="Add to your Task Calendar"
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors text-white/60"
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>

                      <a href={contest.url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <ExternalLink className="w-4 h-4 text-white/60" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-white/50">
                    <div className="flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> {contest.date}</div>
                    <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {contest.duration}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between pl-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-white/50" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">History & Post-Mortem</h3>
            </div>
          </div>

          <div className="p-1 shadow-lg overflow-hidden min-h-[300px] light-glass">
            {contestHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full pt-16 text-white/40">
                <Database className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No contest history found.</p>
                <p className="text-xs mt-1">Check your Sync Engine tab to ensure handles are linked.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/40">
                    <th className="p-4 font-bold">Contest</th>
                    <th className="p-4 font-bold">Platform</th>
                    <th className="p-4 font-bold">Rank</th>
                    <th className="p-4 font-bold">Delta</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {contestHistory.map(history => (
                    <tr key={history._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{history.contestName}</span>
                          <span className="text-[10px] text-white/40">{new Date(history.date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-white/80">{history.platform}</td>
                      <td className="p-4 font-medium text-white/80">#{history.rank}</td>
                      <td className="p-4">
                        <span className={`font-bold ${history.ratingChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {history.ratingChange > 0 ? `+${history.ratingChange}` : history.ratingChange}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper to safely extract stats from the DB string
const extractStats = (notes) => {
  let runtime = "N/A", memory = "N/A";
  if (!notes) return { runtime, memory };
  
  const rMatch = notes.match(/Runtime:\s*([^,]+)/i);
  const mMatch = notes.match(/Memory:\s*(.+)/i); // Grabs everything after Memory:
  
  if (rMatch) runtime = rMatch[1].trim();
  if (mMatch) memory = mMatch[1].trim();
  
  return { runtime, memory };
};

/// ==========================================
// DAILY CHALLENGE PANEL & REPORT
// ==========================================

// Helper to check if it was actually solved TODAY
const isQuestCompletedToday = (challenge) => {
  if (challenge.status === 'skipped') return true; // Treat skipped as completed for board clearing
  if (!challenge.attempts || challenge.attempts.length === 0) return false;
  
  const lastAttempt = challenge.attempts[challenge.attempts.length - 1];
  const attemptDate = new Date(lastAttempt.date).toDateString();
  const todayStr = new Date().toDateString();
  
  return attemptDate === todayStr && lastAttempt.outcome === 'solved';
};

const DailyChallengePanel = ({ dailyChallenges, replaceChallenge, skipChallenge, toggleStar, startQuestTimer }) => {
  
  // 🔥 FIX: Now uses the Today check instead of generic status
  const isBoardCleared = dailyChallenges.length === 3 && dailyChallenges.every(c => isQuestCompletedToday(c));
  const completedTodayChallenges = dailyChallenges.filter(c => isQuestCompletedToday(c) && c.status !== 'skipped');

  return (
    <div className="max-w-5xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4 w-full">
      
      {/* 🏆 THE DAILY POST-MATCH REPORT */}
      {isBoardCleared && (
        <div className="mb-8 p-6 strong-glass shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <Trophy className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">Arena Cleared!</h2>
              <p className="text-indigo-200/70 font-medium">Daily post-match report generated.</p>
            </div>
          </div>

          {completedTodayChallenges.length === 0 ? (
            <div className="p-4 rounded-xl text-center text-white/50 text-sm light-glass">
              You skipped all challenges today. Rest up and hit the arena tomorrow!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {completedTodayChallenges.map((c, i) => {
                const lastAttempt = c.attempts?.[c.attempts.length - 1];
                const { runtime, memory } = extractStats(lastAttempt?.notes);
                return (
                  <div key={i} className="p-4 flex flex-col gap-3 light-glass shadow">
                    <span className="text-xs font-bold text-white/70 truncate">{c.title}</span>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-emerald-400"><Zap className="w-4 h-4" /><span className="text-sm font-bold">{runtime}</span></div>
                      <div className="flex items-center gap-1.5 text-blue-400"><Cpu className="w-4 h-4" /><span className="text-sm font-bold">{memory}</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* HEADER */}
      {!isBoardCleared && (
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Target className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Today's Arena</h2>
            <p className="text-sm text-white/50">Your personalized daily quests. Extension will auto-track your time on submit.</p>
          </div>
        </div>
      )}

      {/* THE 3 QUEST CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dailyChallenges.map((challenge, index) => {
          
          if (challenge.status === 'skipped') {
            return (
              <div key={index} className="p-6 flex flex-col items-center justify-center min-h-[300px] light-glass">
                <span className="text-white/20 mb-2 font-bold uppercase tracking-widest text-[10px]">Skipped</span>
                {!isBoardCleared && <button onClick={() => replaceChallenge(index)} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Generate New</button>}
              </div>
            );
          }

          // 🔥 FIX: Check if it was solved TODAY, not just ever!
          if (isQuestCompletedToday(challenge)) {
            const lastAttempt = challenge.attempts?.[challenge.attempts.length - 1];
            const { runtime, memory } = extractStats(lastAttempt?.notes);

            let timeTakenDisplay = "N/A";
            const startTime = localStorage.getItem(`quest_start_${challenge._id}`);
            
            if (startTime) {
              let endTime = localStorage.getItem(`quest_end_${challenge._id}`);
              if (!endTime) {
                endTime = Date.now().toString();
                localStorage.setItem(`quest_end_${challenge._id}`, endTime);
              }
              
              const diffMs = parseInt(endTime) - parseInt(startTime);
              const diffMins = Math.floor(diffMs / 60000);
              const diffSecs = Math.floor((diffMs % 60000) / 1000);
              timeTakenDisplay = diffMins > 0 ? `${diffMins}m ${diffSecs}s` : `${diffSecs}s`;
            }

            return (
              <div key={index} className="p-6 flex flex-col relative overflow-hidden group shadow-[0_0_20px_rgba(52,211,153,0.15)] light-glass border-emerald-500/30">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                    {challenge.questIcon} {challenge.questType}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 min-h-[56px]">{challenge.title}</h3>
                
                <div className="grid grid-cols-3 gap-2 mt-auto mb-4">
                  <div className="p-2 rounded-xl bg-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Time</span>
                    <span className="text-xs font-extrabold text-emerald-400">{timeTakenDisplay}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Speed</span>
                    <span className="text-xs font-extrabold text-emerald-400">{runtime}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest mb-1 flex items-center gap-1"><Cpu className="w-3 h-3" /> Space</span>
                    <span className="text-xs font-extrabold text-emerald-400">{memory}</span>
                  </div>
                </div>

                <div className="w-full py-3 rounded-xl bg-emerald-500/15 text-emerald-400 text-sm font-bold flex justify-center items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Quest Completed
                </div>
              </div>
            );
          }

          // ACTIVE PENDING CARD
          return (
            <div key={index} className="p-6 flex flex-col relative overflow-hidden group hover-lift-scale transition-all light-glass shadow-lg">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 flex items-center gap-1">
                  {challenge.questIcon} {challenge.questType}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 min-h-[56px]">{challenge.title}</h3>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${challenge.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10' : challenge.difficulty === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'}`}>
                  {challenge.difficulty}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-blue-400 bg-blue-500/10">
                  {challenge.platform}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-indigo-400 bg-indigo-500/10 flex items-center gap-1">
                  <Timer className="w-3 h-3" /> {challenge.targetTime}
                </span>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <a 
                  href={challenge.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => startQuestTimer(challenge)}
                  className="w-full py-3 glass-btn-primary flex justify-center items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current text-white/80" /> Solve Now
                </a>
                
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <button onClick={() => replaceChallenge(index)} className="py-2 glass-btn-secondary text-[9px] flex justify-center items-center gap-1"><RefreshCcw className="w-3 h-3 text-indigo-400" /> Replace</button>
                  <button onClick={() => toggleStar(challenge)} className="py-2 glass-btn-secondary text-[9px] flex justify-center items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> Revision</button>
                  <button onClick={() => skipChallenge(index)} className="py-2 glass-btn-secondary text-[9px] flex justify-center items-center gap-1"><X className="w-3 h-3 text-red-400" /> Skip</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
const renderStatusBadge = (status, onRetry) => {
  switch (status) {
    case 'Verifying':
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
          Verifying...
        </span>
      );
    case 'Connected':
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          Connected
        </span>
      );
    case 'Invalid':
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">
          Invalid Username
        </span>
      );
    case 'SyncFailed':
      return (
        <span className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">
            Sync Failed
          </span>
          {onRetry && (
            <button 
              type="button" 
              onClick={onRetry} 
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline"
            >
              Retry
            </button>
          )}
        </span>
      );
    case 'ExtensionRequired':
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
          Extension Required
        </span>
      );
    default:
      return null;
  }
};

const ExtensionInstructionsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md strong-glass p-6 border border-white/10 shadow-2xl relative rounded-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-400" /> Setup StudentStack Sync Extension
        </h3>
        <p className="text-xs text-white/60 mb-4 leading-relaxed">
          The StudentStack Sync Engine requires a companion Chrome extension to securely sync your submissions and bypass platform restrictions.
        </p>
        
        <div className="space-y-4 text-xs">
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">1</span>
            <div>
              <p className="font-semibold text-white mb-0.5">Locate the Extension Folder</p>
              <p className="text-white/40">The extension is located inside your project directory at <code className="bg-white/5 px-1 py-0.5 rounded text-[10px]">student-stack-extension</code>.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">2</span>
            <div>
              <p className="font-semibold text-white mb-0.5">Open Chrome Extensions Settings</p>
              <p className="text-white/40">Go to <code className="bg-white/5 px-1 py-0.5 rounded text-[10px]">chrome://extensions</code> in your address bar and enable <b>Developer mode</b> in the top right.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">3</span>
            <div>
              <p className="font-semibold text-white mb-0.5">Load Unpacked Extension</p>
              <p className="text-white/40">Click <b>Load unpacked</b> in the top left and select the <code className="bg-white/5 px-1 py-0.5 rounded text-[10px]">student-stack-extension</code> directory.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-5 py-2 glass-btn-primary text-xs font-bold"
          >
            Done, I've loaded it!
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================
const DsaPage = () => {
  const { 
    roadmaps, topics, problems, syncProfile, syncStats, loading, isSyncing, 
    upcomingContests, contestHistory, dailyChallenges,
    replaceChallenge, skipChallenge, toggleProblem, toggleStar, 
    fetchTopicsForRoadmap, saveSyncProfile, triggerAutoSync, handleAddToCalendar,
    startQuestTimer,
    platformStates, setPlatformStates, checkExtensionAvailable,
    syncPaused, currentSyncPlatform
  } = useDSA();

  const handlePauseSync = () => {
    window.postMessage({ type: "PAUSE_STUDENTSTACK_SYNC" }, "*");
  };
  const handleResumeSync = () => {
    window.postMessage({ type: "RESUME_STUDENTSTACK_SYNC" }, "*");
  };
  const handleStopSync = () => {
    window.postMessage({ type: "STOP_STUDENTSTACK_SYNC" }, "*");
  };
  
  const [activeTab, setActiveTab] = useState('roadmaps'); 
  const [roadmapView, setRoadmapView] = useState('library'); 
  const [activeRoadmapId, setActiveRoadmapId] = useState(null);
  const [activeTopicId, setActiveTopicId] = useState(null); 
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [localSyncParams, setLocalSyncParams] = useState({ leetcode: '', codeforces: '', geeksforgeeks: '' });
  const [isEditingSync, setIsEditingSync] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  useEffect(() => { 
    if (roadmaps.length > 0 && !activeRoadmapId) setActiveRoadmapId(roadmaps[0]._id); 
  }, [roadmaps]);
  
  useEffect(() => { 
    setLocalSyncParams({ leetcode: syncProfile.leetcode, codeforces: syncProfile.codeforces, geeksforgeeks: syncProfile.geeksforgeeks }); 
  }, [syncProfile]);

  const activeRoadmap = roadmaps.find(r => r._id === activeRoadmapId);
  const activeTopic = topics.find(t => t._id === activeTopicId);
  const systemRoadmaps = roadmaps.filter(r => r.type === 'system');

  const handleRoadmapSwitch = (id) => { 
    setActiveRoadmapId(id); 
    setActiveTopicId(null); 
    fetchTopicsForRoadmap(id); 
    setRoadmapView('workspace'); 
  };
  
  const handleSaveCredentials = async (e) => { 
    e.preventDefault(); 
    
    // Check extension
    const hasExtensionTag = document.documentElement.getAttribute('data-studentstack-extension-active') === 'true';
    const isAvailable = await checkExtensionAvailable();
    
    if (!isAvailable) {
      const errorMsg = hasExtensionTag 
        ? "Unable to communicate with the StudentStack extension." 
        : "StudentStack Sync Extension is required for automatic platform synchronization.";
      
      const newState = {};
      if (localSyncParams.leetcode) newState.leetcode = hasExtensionTag ? "SyncFailed" : "ExtensionRequired";
      if (localSyncParams.codeforces) newState.codeforces = hasExtensionTag ? "SyncFailed" : "ExtensionRequired";
      if (localSyncParams.geeksforgeeks) newState.geeksforgeeks = hasExtensionTag ? "SyncFailed" : "ExtensionRequired";
      setPlatformStates(prev => ({ ...prev, ...newState }));
      
      alert(errorMsg);
      setShowExtensionModal(true);
      return;
    }
    
    // Set verifying states for platforms being updated
    const verStates = {};
    if (localSyncParams.leetcode) verStates.leetcode = 'Verifying';
    if (localSyncParams.codeforces) verStates.codeforces = 'Verifying';
    if (localSyncParams.geeksforgeeks) verStates.geeksforgeeks = 'Verifying';
    setPlatformStates(prev => ({ ...prev, ...verStates }));

    // Send verification request to extension
    const verifyPromise = new Promise((resolve) => {
      const respListener = (event) => {
        if (event.data && event.data.type === "VERIFY_HANDLES_RESPONSE") {
          window.removeEventListener("message", respListener);
          resolve(event.data.results);
        }
      };
      window.addEventListener("message", respListener);
      
      setTimeout(() => {
        window.removeEventListener("message", respListener);
        resolve(null);
      }, 15000);
      
      window.postMessage({ type: "VERIFY_STUDENTSTACK_HANDLES", handles: localSyncParams }, "*");
    });

    const verificationResults = await verifyPromise;
    if (!verificationResults) {
      alert("Verification timed out. Please check that the extension is loaded and active.");
      const resetStates = {};
      if (localSyncParams.leetcode) resetStates.leetcode = 'SyncFailed';
      if (localSyncParams.codeforces) resetStates.codeforces = 'SyncFailed';
      if (localSyncParams.geeksforgeeks) resetStates.geeksforgeeks = 'SyncFailed';
      setPlatformStates(prev => ({ ...prev, ...resetStates }));
      return;
    }

    let allValid = true;
    const nextStates = {};

    if (localSyncParams.leetcode) {
      if (verificationResults.leetcode?.valid) {
        nextStates.leetcode = 'Connected';
      } else {
        nextStates.leetcode = 'Invalid';
        allValid = false;
      }
    } else {
      nextStates.leetcode = 'Idle';
    }

    if (localSyncParams.codeforces) {
      if (verificationResults.codeforces?.valid) {
        nextStates.codeforces = 'Connected';
      } else {
        nextStates.codeforces = 'Invalid';
        allValid = false;
      }
    } else {
      nextStates.codeforces = 'Idle';
    }

    if (localSyncParams.geeksforgeeks) {
      if (verificationResults.geeksforgeeks?.valid) {
        nextStates.geeksforgeeks = 'Connected';
      } else {
        nextStates.geeksforgeeks = 'Invalid';
        allValid = false;
      }
    } else {
      nextStates.geeksforgeeks = 'Idle';
    }

    setPlatformStates(prev => ({ ...prev, ...nextStates }));

    if (!allValid) {
      alert("One or more usernames could not be verified. Please correct invalid profiles.");
      return;
    }

    const success = await saveSyncProfile(localSyncParams); 
    if (success) {
      setIsEditingSync(false);
      triggerAutoSync(localSyncParams, false);
    } else {
      alert("Error saving sync credentials.");
    }
  };

  const getPlatformStyle = (platform) => {
    switch(platform) {
      case 'LeetCode': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Codeforces': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'GeeksForGeeks': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-white/60 bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse">
          Loading OS...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout rightPanelContent={<DsaRightPanel problems={problems} />}>
      <div className="w-full flex flex-col h-full min-h-screen pb-24">
        {/* TOP COMMAND BOARD */}
        <div className="sticky top-0 z-30 px-6 py-4 -mx-6 rounded-b-2xl mb-6 flex flex-col gap-4 light-glass shadow-md">
          <div className="flex items-center justify-between w-full">
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 shadow-inner overflow-x-auto scrollbar-hide max-w-full">
              {[ 
                { id: 'roadmaps', label: 'Roadmaps', icon: GitBranch }, 
                { id: 'analytics', label: 'Analytics', icon: BarChart2 }, 
                { id: 'contests', label: 'Contest Hub', icon: Trophy }, 
                { id: 'arena', label: `Daily Arena`, icon: Target }, 
                { id: 'sync', label: 'Sync Engine', icon: RefreshCcw } 
              ].map(v => (
                <button 
                  key={v.id} 
                  onClick={() => { 
                    setActiveTab(v.id); 
                    if (v.id === 'roadmaps') setRoadmapView('library'); 
                  }} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${activeTab === v.id ? 'bg-white/10 text-white shadow border border-white/5' : 'text-white/40 hover:text-white/80'}`}
                >
                  <v.icon className="w-4 h-4" /> {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TABS RENDER */}
        {activeTab === 'analytics' && <AnalyticsPanel problems={problems} syncStats={syncStats} contestHistory={contestHistory} />}
        {activeTab === 'contests' && <ContestHubPanel upcomingContests={upcomingContests} contestHistory={contestHistory} handleAddToCalendar={handleAddToCalendar} />}
        {activeTab === 'arena' && <DailyChallengePanel dailyChallenges={dailyChallenges} replaceChallenge={replaceChallenge} skipChallenge={skipChallenge} toggleStar={toggleStar} startQuestTimer={startQuestTimer} />}

        {/* ROADMAPS TAB - LIBRARY VIEW */}
        {activeTab === 'roadmaps' && roadmapView === 'library' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
             {systemRoadmaps.map(rm => (
               <div 
                 key={rm._id} 
                 onClick={() => handleRoadmapSwitch(rm._id)} 
                 className="p-5 hover-lift-scale cursor-pointer transition-all light-glass shadow-xl"
               >
                 <div className="flex justify-between items-start mb-6">
                   <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
                     <BookOpen className="w-5 h-5 text-blue-400" />
                   </div>
                 </div>
                 <h3 className="text-lg font-bold text-white mb-1">{rm.name}</h3>
                 <p className="text-xs text-white/40">{rm.totalTopics} Modules • Pre-loaded</p>
               </div>
             ))}
           </div>
         )}

        {/* ROADMAPS TAB - WORKSPACE VIEW */}
        {activeTab === 'roadmaps' && roadmapView === 'workspace' && (
           <div className="flex flex-col gap-6 animate-in fade-in">
             <div className="flex items-center justify-between mb-2">
               <div>
                 <h2 className="text-2xl font-bold text-white">{activeRoadmap?.name}</h2>
                 <p className="text-sm text-white/50">{activeTopicId ? activeTopic?.name : 'Select a module to view problems.'}</p>
               </div>
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setShowStarredOnly(!showStarredOnly)} 
                   className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${showStarredOnly ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}
                 >
                   <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-amber-400' : ''}`} /> Starred
                 </button>
                 <button 
                   onClick={() => {setRoadmapView('library'); setShowStarredOnly(false);}} 
                   className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-bold"
                 >
                   <ArrowDownUp className="w-4 h-4 rotate-90" /> Back to Roadmaps
                 </button>
               </div>
             </div>

             {!activeTopicId ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {topics.map(topic => {
                   const topicProbs = problems.filter(p => p.topicId === topic._id && (!showStarredOnly || p.isStarred));
                   if (showStarredOnly && topicProbs.length === 0) return null;
                   const solved = topicProbs.filter(p => p.status === 'solved').length;
                   const progress = topicProbs.length > 0 ? (solved / topicProbs.length) * 100 : 0;
                   return (
                     <div 
                       key={topic._id} 
                       onClick={() => setActiveTopicId(topic._id)} 
                       className="p-4 cursor-pointer group light-glass hover-lift-scale shadow"
                     >
                       <div className="flex justify-between items-start mb-4">
                         <h3 className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{topic.name}</h3>
                         <span className="text-[10px] font-bold text-white/50">{solved}/{topicProbs.length}</span>
                       </div>
                       <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
                       </div>
                     </div>
                   )
                 })}
               </div>
             ) : (
               <div className="space-y-3">
                 <button 
                   onClick={() => setActiveTopicId(null)} 
                   className="mb-2 text-xs font-bold text-white/50 hover:text-white flex items-center gap-1"
                 >
                   <ChevronRight className="w-3 h-3 rotate-180" /> Back to Modules
                 </button>
                 {problems.filter(p => p.topicId === activeTopicId && (!showStarredOnly || p.isStarred)).map(p => (
                   <div key={p._id} className="grid grid-cols-12 gap-4 p-4 items-center group hover-lift-scale transition-all light-glass shadow-sm">
                     <div className="col-span-1 flex justify-center">
                       <button onClick={() => toggleProblem(p)} className="hover:scale-110 transition-transform">
                         {p.status === 'solved' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> : <Circle className="w-5 h-5 text-white/20 hover:text-emerald-400/50" />}
                       </button>
                     </div>
                     <div className="col-span-5 flex items-center gap-3">
                       <a href={p.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white/90 hover:text-blue-400 truncate">{p.title}</a>
                       <button onClick={() => toggleStar(p)} className="focus:outline-none transition-transform hover:scale-110 shrink-0">
                         <Star className={`w-4 h-4 transition-colors ${p.isStarred ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-white/20 hover:text-amber-400/50'}`} />
                       </button>
                     </div>
                     <div className="col-span-3">
                       <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPlatformStyle(p.platform)}`}>{p.platform}</span>
                     </div>
                     <div className="col-span-3">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${p.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : p.difficulty === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>{p.difficulty}</span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
         )}

        {/* SYNC ENGINE TAB UI */}
        {activeTab === 'sync' && (
          <div className="max-w-2xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-8 strong-glass shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Database className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Sync Engine</h2>
                  <p className="text-sm text-white/50">Your multi-platform data pipeline.</p>
                </div>
              </div>

              {(!syncProfile.leetcode && !syncProfile.codeforces && !syncProfile.geeksforgeeks) || isEditingSync ? (
                <form onSubmit={handleSaveCredentials} className="space-y-6">
                  {!document.documentElement.getAttribute('data-studentstack-extension-active') && (
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-6 flex justify-between items-center animate-in fade-in duration-300">
                      <div>
                        <p className="text-xs text-purple-200 font-semibold">StudentStack Sync Extension Required</p>
                        <p className="text-[10px] text-purple-300/70 mt-0.5 font-medium">Install the companion extension to enable automatic progress syncing.</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowExtensionModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-[10px] hover:bg-purple-500/30 transition-all shrink-0"
                      >
                        Setup Extension
                      </button>
                    </div>
                  )}
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
                    <p className="text-sm text-blue-200 font-medium">Connect your handles once. The Sync Engine will automatically verify your progress silently in the background.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">LeetCode Username</label>
                    <input 
                      type="text" 
                      value={localSyncParams.leetcode} 
                      onChange={(e) => setLocalSyncParams({...localSyncParams, leetcode: e.target.value})} 
                      className="w-full glass-input px-4 py-3 text-sm" 
                      placeholder="e.g. urvicf" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">Codeforces Handle</label>
                    <input 
                      type="text" 
                      value={localSyncParams.codeforces} 
                      onChange={(e) => setLocalSyncParams({...localSyncParams, codeforces: e.target.value})} 
                      className="w-full glass-input px-4 py-3 text-sm" 
                      placeholder="e.g. tourist" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">GeeksForGeeks Handle</label>
                    <input 
                      type="text" 
                      value={localSyncParams.geeksforgeeks} 
                      onChange={(e) => setLocalSyncParams({...localSyncParams, geeksforgeeks: e.target.value})} 
                      className="w-full glass-input px-4 py-3 text-sm" 
                      placeholder="e.g. urvi123" 
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                    {syncProfile.leetcode || syncProfile.codeforces || syncProfile.geeksforgeeks ? (
                      <button type="button" onClick={() => setIsEditingSync(false)} className="px-6 py-3 rounded-xl hover:bg-white/5 text-white/50 text-sm font-bold transition-all">Cancel</button>
                    ) : null}
                    <button type="submit" className="px-6 py-3 glass-btn-primary text-sm font-bold">Lock & Sync Data</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {!document.documentElement.getAttribute('data-studentstack-extension-active') && (
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex justify-between items-center animate-in fade-in duration-300">
                      <div>
                        <p className="text-xs text-purple-200 font-semibold">StudentStack Sync Extension Offline</p>
                        <p className="text-[10px] text-purple-300/70 mt-0.5 font-medium">Please enable or setup the companion extension to resume syncing.</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowExtensionModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-[10px] hover:bg-purple-500/30 transition-all shrink-0"
                      >
                        Setup Extension
                      </button>
                    </div>
                  )}

                  <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${isSyncing ? (syncPaused ? 'bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-blue-400 animate-ping shadow-[0_0_10px_rgba(96,165,250,0.8)]') : 'bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]'}`}></div>
                      <div>
                        <h3 className="text-lg font-bold text-blue-400">
                          {isSyncing ? (syncPaused ? "Sync Paused" : `Syncing ${currentSyncPlatform || "Platform"}...`) : "Auto-Sync Active"}
                        </h3>
                        <p className="text-xs text-blue-400/60 font-medium mt-1">
                          {isSyncing 
                            ? (syncPaused ? "Sync process is paused by user." : `Fetching solved solutions from ${currentSyncPlatform || "platforms"}...`) 
                            : `Last synced: ${syncProfile.lastSyncAt ? new Date(syncProfile.lastSyncAt).toLocaleString() : 'Just now'}`}
                        </p>
                      </div>
                    </div>
                    
                    {isSyncing ? (
                      <div className="flex items-center gap-2">
                        {syncPaused ? (
                          <button 
                            type="button"
                            onClick={handleResumeSync}
                            className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all"
                          >
                            Resume Sync
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={handlePauseSync}
                            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all"
                          >
                            Pause Sync
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={handleStopSync}
                          className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-bold transition-all"
                        >
                          Cancel/Stop
                        </button>
                      </div>
                    ) : (
                      isSyncing && <RefreshCcw className="w-5 h-5 text-blue-400 animate-spin" />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* LeetCode Card */}
                    <div className="p-4 flex flex-col gap-2 light-glass shadow-sm hover-lift-scale relative group overflow-hidden">
                      <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">LeetCode</span>
                      <span className="text-sm font-medium text-white truncate">{syncProfile.leetcode || 'Not Linked'}</span>
                      {syncProfile.leetcode && (
                        <div className="mt-1">
                          {renderStatusBadge(platformStates.leetcode, () => triggerAutoSync(syncProfile, false))}
                        </div>
                      )}
                    </div>
                    {/* Codeforces Card */}
                    <div className="p-4 flex flex-col gap-2 light-glass shadow-sm hover-lift-scale relative group overflow-hidden">
                      <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Codeforces</span>
                      <span className="text-sm font-medium text-white truncate">{syncProfile.codeforces || 'Not Linked'}</span>
                      {syncProfile.codeforces && (
                        <div className="mt-1">
                          {renderStatusBadge(platformStates.codeforces, () => triggerAutoSync(syncProfile, false))}
                        </div>
                      )}
                    </div>
                    {/* GeeksForGeeks Card */}
                    <div className="p-4 flex flex-col gap-2 light-glass shadow-sm hover-lift-scale relative group overflow-hidden">
                      <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">GFG</span>
                      <span className="text-sm font-medium text-white truncate">{syncProfile.geeksforgeeks || 'Not Linked'}</span>
                      {syncProfile.geeksforgeeks && (
                        <div className="mt-1">
                          {renderStatusBadge(platformStates.geeksforgeeks, () => triggerAutoSync(syncProfile, false))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                    <button onClick={() => setIsEditingSync(true)} className="text-xs font-bold text-white/40 hover:text-white transition-colors">Edit Credentials</button>
                    <button 
                      onClick={() => triggerAutoSync(syncProfile, false)} 
                      disabled={isSyncing} 
                      className="px-6 py-2.5 glass-btn-secondary text-xs flex items-center gap-2"
                    >
                      <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> Force Manual Sync
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      <ExtensionInstructionsModal isOpen={showExtensionModal} onClose={() => setShowExtensionModal(false)} />
    </DashboardLayout>
  );
};
export default DsaPage;