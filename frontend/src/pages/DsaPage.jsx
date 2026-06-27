import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DsaRightPanel from '../components/dsa/DsaRightPanel';
import { 
  Code2, Layers, ChevronRight, Play, CheckCircle2, 
  Circle, X, BarChart2, Trophy, GitBranch, BrainCircuit, 
  LayoutGrid, ArrowDownUp, Plus, Library, BookOpen, Link2, 
  RefreshCcw, Database, Star, Clock, Calendar, Timer, 
  ExternalLink, TrendingUp, Target, Award, History, Edit3, CalendarPlus
} from 'lucide-react';

// ==========================================
// 1. DATA HOOK
// ==========================================
const useDSA = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [topics, setTopics] = useState([]);
  const [problems, setProblems] = useState([]);
  const [syncProfile, setSyncProfile] = useState({ leetcode: '', codeforces: '', geeksforgeeks: '', lastSyncAt: null });
  const [syncStats, setSyncStats] = useState({ leetcode: 0, codeforces: 0, gfg: 0 });
  
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [contestHistory, setContestHistory] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetches Real Upcoming Contests from Codeforces API
  const fetchLiveContests = async () => {
    try {
      const res = await fetch('https://codeforces.com/api/contest.list');
      if (res.ok) {
        const data = await res.json();
        const liveContests = data.result
          .filter(c => c.phase === 'BEFORE') // Only future contests
          .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds) // Sort by soonest
          .slice(0, 5) // Grab next 5
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

      let rmRes = await fetch('http://localhost:5000/api/dsa/roadmaps', { headers });
      let dbRoadmaps = await rmRes.json();
      if (dbRoadmaps.length === 0) {
        await fetch('http://localhost:5000/api/dsa/seed-defaults', { method: 'POST', headers });
        rmRes = await fetch('http://localhost:5000/api/dsa/roadmaps', { headers });
        dbRoadmaps = await rmRes.json();
      }
      setRoadmaps(dbRoadmaps);

      if (dbRoadmaps.length > 0) {
        const topRes = await fetch(`http://localhost:5000/api/dsa/topics/${dbRoadmaps[0]._id}`, { headers });
        if (topRes.ok) setTopics(await topRes.json());
      }

      const probRes = await fetch('http://localhost:5000/api/dsa/problems', { headers });
      if (probRes.ok) setProblems(await probRes.json());

      const syncRes = await fetch('http://localhost:5000/api/dsa/sync-profile', { headers });
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

      const histRes = await fetch('http://localhost:5000/api/dsa/contests', { headers });
      if (histRes.ok) setContestHistory(await histRes.json());

    } catch (error) { console.error("Error fetching data:", error); } 
    finally { setLoading(false); }
  };

  const execute = async (url, method, body = null) => {
    try {
      const token = localStorage.getItem('token');
      const options = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch(`http://localhost:5000/api/dsa${url}`, options);
      if (res.ok) { fetchData(); return true; }
      return false;
    } catch (err) { return false; }
  };

  const toggleProblem = async (problem) => {
    const newOutcome = problem.status === 'solved' ? 'unsolved' : 'solved';
    await execute(`/problems/${problem._id}/attempt`, 'POST', { outcome: newOutcome, confidenceRating: 3, timeTakenMinutes: 0 });
  };

  const toggleStar = async (problem) => { await execute(`/problems/${problem._id}/star`, 'PUT'); };

  const handleReview = async (problem, rating) => {
    await execute(`/problems/${problem._id}/attempt`, 'POST', { outcome: 'solved', confidenceRating: rating, timeTakenMinutes: 0 });
  };

  // Connects Contest to Task Calendar
  const handleAddToCalendar = async (contest) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: `🏆 ${contest.platform} Contest: ${contest.name}`,
          description: `Duration: ${contest.duration}\nLink: ${contest.url}`,
          
          // 🔥 THE FIX: These 4 lines now perfectly match your Task.js Schema
          deadline: new Date(contest.rawDate), 
          category: 'DSA',     
          priority: 'high',    
          status: 'todo'       
        })
      });
      
      if (res.ok) {
        alert(`Successfully added ${contest.name} to your Task Calendar!`);
      } else {
        const errorData = await res.json();
        alert(`Failed: ${errorData.message}`);
      }
    } catch (err) { console.error("Calendar Add Error:", err); }
  };
  
  const saveSyncProfile = async (data) => {
    const success = await execute('/sync-profile', 'POST', data);
    if (success) { triggerAutoSync(data, true); return true; }
    return false;
  };

  // 🔥 UNIFIED AUTO-SYNC ENGINE (Problems + Contests together)
  const triggerAutoSync = async (handles, isSilent = false) => {
    const token = localStorage.getItem('token');
    setIsSyncing(true); 
    window.postMessage({ type: "START_LEETCODE_SYNC", token: token, handles: handles }, "*");

    const listener = async function(event) {
      if (event.data.type === "SYNC_SUCCESS") {
        window.removeEventListener("message", listener);
        
        // 🔥 THIS IS THE FIX: Instantly trigger the backend contest sync
        await execute('/contests/sync', 'POST'); 
        
        // Fetch all updated data (Problems + Contests) to reflect in UI
        fetchData(); 
        
        setIsSyncing(false); 
        if (!isSilent) alert(`Auto-Sync Complete! Verified ${event.data.count} solutions and updated Contest History.`);
      } 
      else if (event.data.type === "SYNC_ERROR") {
        window.removeEventListener("message", listener);
        setIsSyncing(false); 
        if (!isSilent) alert("Sync Failed: " + event.data.message);
      }
    };
    window.addEventListener("message", listener);
  };

  const fetchTopicsForRoadmap = async (roadmapId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/dsa/topics/${roadmapId}`, { headers: { 'Authorization': `Bearer ${token}` }});
    if (res.ok) setTopics(await res.json());
  };

  useEffect(() => { fetchData(); fetchLiveContests(); }, []);

  useEffect(() => {
    if (syncProfile.leetcode || syncProfile.codeforces || syncProfile.geeksforgeeks) {
      triggerAutoSync(syncProfile, true); 
    }
  }, [syncProfile.leetcode, syncProfile.codeforces, syncProfile.geeksforgeeks]);

  return { 
    roadmaps, topics, problems, syncProfile, syncStats, loading, isSyncing, 
    upcomingContests, contestHistory, 
    toggleProblem, toggleStar, handleReview, fetchTopicsForRoadmap, 
    saveSyncProfile, triggerAutoSync, handleAddToCalendar 
  };
};

// ==========================================
// 2. ANALYTICS PANEL
// ==========================================
const AnalyticsPanel = ({ problems, syncStats }) => {
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
  problems.forEach(p => { if (p.attempts) p.attempts.forEach(a => { if (new Date(a.date).getFullYear() === selectedYear) submissionsInYear++; }); });

  const generateHeatmapForYear = (year) => {
    const today = new Date(); const monthsData = [];
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthName = new Date(year, monthIndex, 1).toLocaleString('default', { month: 'short' });
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
      const weeks = []; let currentWeek = Array(firstDayOfWeek).fill(null);
      for (let d = 1; d <= daysInMonth; d++) {
        const currentDate = new Date(year, monthIndex, d); let activityLevel = 0;
        if (currentDate <= today) {
          problems.forEach(p => { if (p.attempts) p.attempts.forEach(attempt => {
            const aDate = new Date(attempt.date);
            if (aDate.getFullYear() === year && aDate.getMonth() === monthIndex && aDate.getDate() === d) activityLevel++;
          });});
        }
        currentWeek.push({ date: currentDate.toDateString(), level: activityLevel });
        if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
      }
      if (currentWeek.length > 0 && currentWeek.length < 7) { while (currentWeek.length < 7) currentWeek.push(null); weeks.push(currentWeek); }
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
      <div className="p-6 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-between">
        <div className="w-1/2 flex flex-col justify-center">
          <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">Total Score</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{solvedCount}</span>
            <span className="text-sm font-bold text-white/40">/ {totalProblems} Solved</span>
          </div>
        </div>
        <div className="w-1/2 flex flex-col items-end gap-2">
          <span className="text-sm font-bold text-blue-400">{displayPercent}% Completed</span>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${barWidth}%` }}></div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">{submissionsInYear} submissions in {selectedYear}</h3>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-black/40 border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-white/30 transition-all">
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
                        return (<div key={day.date} title={`${day.date}: ${day.level} problems solved`} className={`w-3 h-3 rounded-[3px] border transition-colors hover:border-white/40 cursor-pointer ${getActivityColor(day.level)}`}></div>);
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

      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-widest pl-2">Global Lifetime Sync</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-black/20 border border-amber-500/10 flex flex-col items-center justify-center gap-2 hover:border-amber-500/30 transition-all">
            <span className="text-3xl font-extrabold text-amber-400">{syncStats.leetcode}</span><span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">LeetCode</span>
          </div>
          <div className="p-5 rounded-2xl bg-black/20 border border-blue-500/10 flex flex-col items-center justify-center gap-2 hover:border-blue-500/30 transition-all">
            <span className="text-3xl font-extrabold text-blue-400">{syncStats.codeforces}</span><span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Codeforces</span>
          </div>
          <div className="p-5 rounded-2xl bg-black/20 border border-emerald-500/10 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/30 transition-all">
            <span className="text-3xl font-extrabold text-emerald-400">{syncStats.gfg}</span><span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">GeeksForGeeks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. CONTEST HUB PANEL
// ==========================================
const ContestHubPanel = ({ upcomingContests, contestHistory, handleAddToCalendar }) => {
  const maxRating = contestHistory.length > 0 ? Math.max(...contestHistory.map(c => c.newRating || 0)) : 0;
  const avgRank = contestHistory.length > 0 ? Math.floor(contestHistory.reduce((acc, c) => acc + (c.rank || 0), 0) / contestHistory.length) : 0;

  return (
    <div className="flex flex-col gap-6 mt-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center gap-1 shadow-lg">
          <TrendingUp className="w-6 h-6 text-emerald-400 mb-1" />
          <span className="text-2xl font-extrabold text-white">{maxRating || 'N/A'}</span>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Max Rating</span>
        </div>
        <div className="p-5 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center gap-1 shadow-lg">
          <Target className="w-6 h-6 text-blue-400 mb-1" />
          <span className="text-2xl font-extrabold text-white">{contestHistory.length}</span>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Contests Logged</span>
        </div>
        <div className="p-5 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center gap-1 shadow-lg">
          <Award className="w-6 h-6 text-amber-400 mb-1" />
          <span className="text-2xl font-extrabold text-white">{avgRank ? `Top ${avgRank}` : 'N/A'}</span>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Average Rank</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: UPCOMING LIVE CONTESTS */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 pl-2">
            <Calendar className="w-4 h-4 text-white/50" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming Calendar</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {upcomingContests.length === 0 ? (
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-center text-white/50 text-xs">
                Scanning Codeforces for live contests...
              </div>
            ) : (
              upcomingContests.map(contest => (
                <div key={contest.id} className="p-4 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg hover:border-white/20 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${contest.color === 'amber' ? 'text-amber-400' : contest.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`}>
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

        {/* RIGHT COLUMN: HISTORY */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between pl-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-white/50" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">History & Post-Mortem</h3>
            </div>
          </div>

          <div className="p-1 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg overflow-hidden min-h-[300px]">
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

// ==========================================
// 4. MAIN PAGE COMPONENT
// ==========================================
const DsaPage = () => {
  const { 
    roadmaps, topics, problems, syncProfile, syncStats, loading, isSyncing, 
    upcomingContests, contestHistory, 
    toggleProblem, toggleStar, handleReview, fetchTopicsForRoadmap, 
    saveSyncProfile, triggerAutoSync, handleAddToCalendar 
  } = useDSA();
  
  const [activeTab, setActiveTab] = useState('roadmaps'); 
  const [roadmapView, setRoadmapView] = useState('library'); 
  const [activeRoadmapId, setActiveRoadmapId] = useState(null);
  const [activeTopicId, setActiveTopicId] = useState(null); 
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [localSyncParams, setLocalSyncParams] = useState({ leetcode: '', codeforces: '', geeksforgeeks: '' });
  const [isEditingSync, setIsEditingSync] = useState(false);

  useEffect(() => { if (roadmaps.length > 0 && !activeRoadmapId) setActiveRoadmapId(roadmaps[0]._id); }, [roadmaps]);
  useEffect(() => { setLocalSyncParams({ leetcode: syncProfile.leetcode, codeforces: syncProfile.codeforces, geeksforgeeks: syncProfile.geeksforgeeks }); }, [syncProfile]);

  const activeRoadmap = roadmaps.find(r => r._id === activeRoadmapId);
  const activeTopic = topics.find(t => t._id === activeTopicId);
  const systemRoadmaps = roadmaps.filter(r => r.type === 'system');

  const today = new Date();
  const reviewQueue = problems.filter(p => p.status === 'solved' && p.revisionSchedule?.nextRevisionDate && new Date(p.revisionSchedule.nextRevisionDate) <= today);

  const handleRoadmapSwitch = (id) => { setActiveRoadmapId(id); setActiveTopicId(null); fetchTopicsForRoadmap(id); setRoadmapView('workspace'); };
  
  const handleSaveCredentials = async (e) => { e.preventDefault(); const success = await saveSyncProfile(localSyncParams); if (success) setIsEditingSync(false); };

  const getPlatformStyle = (platform) => {
    switch(platform) {
      case 'LeetCode': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Codeforces': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'GeeksForGeeks': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-white/60 bg-white/5 border-white/10';
    }
  };

  if (loading) return <DashboardLayout><div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse">Loading OS...</div></DashboardLayout>;

  return (
    <DashboardLayout rightPanelContent={<DsaRightPanel problems={problems} />}>
      <div className="w-full flex flex-col h-full min-h-screen pb-24">
        
        {/* TOP COMMAND BOARD */}
        <div className="sticky top-0 z-30 bg-black/20 backdrop-blur-2xl px-6 py-4 -mx-6 border-b border-white/10 shadow-lg mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
              {[ 
                { id: 'roadmaps', label: 'Roadmaps', icon: GitBranch }, 
                { id: 'analytics', label: 'Analytics', icon: BarChart2 }, 
                { id: 'contests', label: 'Contest Hub', icon: Trophy }, 
                { id: 'review', label: `Daily Review (${reviewQueue.length})`, icon: Clock }, 
                { id: 'sync', label: 'Sync Engine', icon: RefreshCcw } 
              ].map(v => (
                <button 
                  key={v.id} 
                  onClick={() => { setActiveTab(v.id); if (v.id === 'roadmaps') setRoadmapView('library'); }} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === v.id ? 'bg-white/10 text-white shadow border border-white/5' : 'text-white/40 hover:text-white/80'}`}
                >
                  <v.icon className={`w-4 h-4 ${v.id === 'review' && reviewQueue.length > 0 ? 'text-amber-400' : ''}`} /> {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TABS RENDER */}
        {activeTab === 'analytics' && <AnalyticsPanel problems={problems} syncStats={syncStats} />}
        {activeTab === 'contests' && <ContestHubPanel upcomingContests={upcomingContests} contestHistory={contestHistory} handleAddToCalendar={handleAddToCalendar} />}

        {/* ROADMAPS TAB - LIBRARY VIEW */}
        {activeTab === 'roadmaps' && roadmapView === 'library' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
             {systemRoadmaps.map(rm => (
               <div key={rm._id} onClick={() => handleRoadmapSwitch(rm._id)} className="p-5 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-xl hover:border-blue-500/50 cursor-pointer transition-all">
                 <div className="flex justify-between items-start mb-6"><div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><BookOpen className="w-5 h-5 text-blue-400" /></div></div>
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
                 <button onClick={() => setShowStarredOnly(!showStarredOnly)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${showStarredOnly ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                   <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-amber-400' : ''}`} /> Starred
                 </button>
                 <button onClick={() => {setRoadmapView('library'); setShowStarredOnly(false);}} className="px-4 py-2 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 transition-all text-xs font-bold flex items-center gap-2 border border-white/10">
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
                     <div key={topic._id} onClick={() => setActiveTopicId(topic._id)} className="p-4 rounded-xl bg-black/30 border border-white/10 shadow-lg hover:bg-black/40 cursor-pointer group">
                       <div className="flex justify-between items-start mb-4"><h3 className="text-sm font-medium text-white group-hover:text-blue-300">{topic.name}</h3><span className="text-[10px] font-bold text-white/50">{solved}/{topicProbs.length}</span></div>
                       <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div></div>
                     </div>
                   )
                 })}
               </div>
             ) : (
               <div className="space-y-3">
                 <button onClick={() => setActiveTopicId(null)} className="mb-2 text-xs font-bold text-white/50 hover:text-white flex items-center gap-1"><ChevronRight className="w-3 h-3 rotate-180" /> Back to Modules</button>
                 {problems.filter(p => p.topicId === activeTopicId && (!showStarredOnly || p.isStarred)).map(p => (
                   <div key={p._id} className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-black/30 border border-white/10 items-center group hover:bg-black/40 transition-all">
                     <div className="col-span-1 flex justify-center">
                       <button onClick={() => toggleProblem(p)} className="hover:scale-110 transition-transform">
                         {p.status === 'solved' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> : <Circle className="w-5 h-5 text-white/20 hover:text-emerald-400/50" />}
                       </button>
                     </div>
                     <div className="col-span-5 flex items-center gap-3">
                       <a href={p.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white/90 hover:text-blue-400 truncate">{p.title}</a>
                       <button onClick={() => toggleStar(p)} className="focus:outline-none transition-transform hover:scale-110 shrink-0"><Star className={`w-4 h-4 transition-colors ${p.isStarred ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-white/20 hover:text-amber-400/50'}`} /></button>
                     </div>
                     <div className="col-span-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPlatformStyle(p.platform)}`}>{p.platform}</span></div>
                     <div className="col-span-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${p.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : p.difficulty === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>{p.difficulty}</span></div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

        {/* DAILY REVIEW TAB */}
        {activeTab === 'review' && (
          <div className="max-w-4xl mx-auto mt-6 animate-in fade-in slide-in-from-bottom-4 w-full">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><BrainCircuit className="w-7 h-7 text-amber-400" /></div>
                <div><h2 className="text-2xl font-bold text-white mb-1">Spaced Repetition Queue</h2><p className="text-sm text-white/50">Problems due for memory reinforcement today.</p></div>
              </div>
              {reviewQueue.length === 0 ? (
                <div className="p-12 text-center border border-emerald-500/20 rounded-3xl bg-emerald-500/5 backdrop-blur-xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                  <h3 className="text-xl font-bold text-white mb-2">Memory Bank Secure</h3><p className="text-sm text-white/50">You have no pending revisions for today.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewQueue.map(p => (
                    <div key={p._id} className="p-5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between group hover:bg-black/40 transition-all">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <a href={p.url} target="_blank" rel="noreferrer" className="text-lg font-bold text-white hover:text-blue-400 transition-colors">{p.title}</a>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${p.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10' : p.difficulty === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10'}`}>{p.difficulty}</span>
                        </div>
                        <p className="text-xs text-white/40">Last reviewed: {p.attempts && p.attempts.length > 0 ? new Date(p.attempts[p.attempts.length-1].date).toLocaleDateString() : 'Never'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleReview(p, 1)} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-bold transition-all">Hard</button>
                        <button onClick={() => handleReview(p, 3)} className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-xs font-bold transition-all">Good</button>
                        <button onClick={() => handleReview(p, 5)} className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-bold transition-all">Easy</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🔥 THE ORIGINAL, RESTORED SYNC ENGINE TAB UI 🔥 */}
        {activeTab === 'sync' && (
          <div className="max-w-2xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-8 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-2xl">
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
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
                    <p className="text-sm text-blue-200">Connect your handles once. The Sync Engine will automatically verify your progress silently in the background.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">LeetCode Username</label>
                    <input type="text" value={localSyncParams.leetcode} onChange={(e) => setLocalSyncParams({...localSyncParams, leetcode: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none" placeholder="e.g. urvicf" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">Codeforces Handle</label>
                    <input type="text" value={localSyncParams.codeforces} onChange={(e) => setLocalSyncParams({...localSyncParams, codeforces: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none" placeholder="e.g. tourist" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">GeeksForGeeks Handle</label>
                    <input type="text" value={localSyncParams.geeksforgeeks} onChange={(e) => setLocalSyncParams({...localSyncParams, geeksforgeeks: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none" placeholder="e.g. urvi123" />
                  </div>
                  
                  <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                    {syncProfile.leetcode || syncProfile.codeforces ? (
                      <button type="button" onClick={() => setIsEditingSync(false)} className="px-6 py-3 rounded-xl hover:bg-white/5 text-white/50 text-sm font-bold transition-all">Cancel</button>
                    ) : null}
                    <button type="submit" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all">Lock & Sync Data</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                      <div>
                        <h3 className="text-lg font-bold text-emerald-400">Auto-Sync Active</h3>
                        <p className="text-xs text-emerald-400/60 font-medium mt-1">
                          {isSyncing ? "Background sync in progress..." : `Last synced: ${syncProfile.lastSyncAt ? new Date(syncProfile.lastSyncAt).toLocaleString() : 'Just now'}`}
                        </p>
                      </div>
                    </div>
                    {isSyncing && <RefreshCcw className="w-5 h-5 text-emerald-400 animate-spin" />}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">LeetCode</span>
                      <span className="text-sm font-medium text-white truncate">{syncProfile.leetcode || 'Not Linked'}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Codeforces</span>
                      <span className="text-sm font-medium text-white truncate">{syncProfile.codeforces || 'Not Linked'}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">GFG</span>
                      <span className="text-sm font-medium text-white truncate">{syncProfile.geeksforgeeks || 'Not Linked'}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                    <button onClick={() => setIsEditingSync(true)} className="text-xs font-bold text-white/40 hover:text-white transition-colors">Edit Credentials</button>
                    {/* THIS UNIFIED BUTTON SYNCS PROBLEMS AND CONTESTS */}
                    <button onClick={() => triggerAutoSync(syncProfile, false)} disabled={isSyncing} className={`px-6 py-2.5 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all ${isSyncing ? 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white border-white/10'}`}>
                      <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> Force Manual Sync
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};
export default DsaPage;