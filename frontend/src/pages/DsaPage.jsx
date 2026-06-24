import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DsaRightPanel from '../components/dsa/DsaRightPanel';
import { 
  Code2, Layers, ChevronRight, Play, CheckCircle2, 
  Circle, X, BarChart2, Trophy, GitBranch, BrainCircuit, 
  LayoutGrid, ArrowDownUp, Plus, Library, BookOpen, Link2, RefreshCcw, Database
} from 'lucide-react';

// ==========================================
// 1. DATA HOOK
// ==========================================
const useDSA = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [topics, setTopics] = useState([]);
  const [problems, setProblems] = useState([]);
  const [syncProfile, setSyncProfile] = useState({ leetcode: '', codeforces: '', geeksforgeeks: '' });
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

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
        setSyncProfile({ leetcode: profile.leetcode || '', codeforces: profile.codeforces || '', geeksforgeeks: profile.geeksforgeeks || '' });
      }

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

  const saveSyncProfile = async (data) => {
    const success = await execute('/sync-profile', 'POST', data);
    if (success) alert("Credentials saved permanently to database.");
  };

  // ----------------------------------------------------
  // EXTENSION TRIGGER: Replaces the old auto-sync API
  // ----------------------------------------------------
  // Change the function definition to accept 'handles'
  const triggerAutoSync = async (handles) => { 
    const token = localStorage.getItem('token');
    
    setIsSyncing(true); 

    window.postMessage({ 
      type: "START_LEETCODE_SYNC", 
      token: token,
      handles: handles // Pass it right here!
    }, "*");

    window.addEventListener("message", function listener(event) {
      if (event.data.type === "SYNC_SUCCESS") {
        setIsSyncing(false); 
        alert(`Massive W! Checked ${event.data.count} problems from your history.`);
        fetchData(); 
        window.removeEventListener("message", listener);
      } 
      else if (event.data.type === "SYNC_ERROR") {
        setIsSyncing(false); 
        alert("Sync Failed: " + event.data.message);
        window.removeEventListener("message", listener);
      }
    });
  };

  const fetchTopicsForRoadmap = async (roadmapId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/dsa/topics/${roadmapId}`, { headers: { 'Authorization': `Bearer ${token}` }});
    if (res.ok) setTopics(await res.json());
  };

  useEffect(() => { fetchData(); }, []);

  return { roadmaps, topics, problems, syncProfile, loading, isSyncing, toggleProblem, fetchTopicsForRoadmap, saveSyncProfile, triggerAutoSync };
};

// ==========================================
// 2. ANALYTICS & HEATMAP COMPONENT 
// ==========================================
const AnalyticsPanel = ({ problems }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const solvedCount = problems.filter(p => p.status === 'solved').length;
  // Fallback to 438 if problems array hasn't loaded yet
  const totalProblems = problems.length > 0 ? problems.length : 438; 
  
  const rawPercent = (solvedCount / totalProblems) * 100;
  const displayPercent = rawPercent > 0 && rawPercent < 1 ? rawPercent.toFixed(1) : Math.floor(rawPercent);
  const barWidth = solvedCount > 0 ? Math.max(rawPercent, 1.5) : 0;

  const currentYear = new Date().getFullYear();
  const activeYears = new Set([currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4]);
  problems.forEach(p => {
    if (p.attempts) {
      p.attempts.forEach(a => activeYears.add(new Date(a.date).getFullYear()));
    }
  });
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
      
      {/* TOTAL SCORE BANNER - Exact Match to Screenshot */}
      <div className="p-6 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-between">
        <div className="w-1/2 flex flex-col justify-center">
          <h3 className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1">
            Total Score
          </h3>
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

      {/* HEATMAP CALENDAR */}
      <div className="p-6 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {submissionsInYear} submissions in {selectedYear}
          </h3>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-black/40 border border-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:border-white/30 transition-all"
          >
            {yearsArray.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
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

        <div className="flex items-center justify-end gap-1.5 text-[10px] text-white/40 mt-4 pt-4 border-t border-white/5">
          Less 
          <span className="w-3 h-3 rounded-[3px] border border-white/5 bg-[#161b22] ml-1"></span>
          <span className="w-3 h-3 rounded-[3px] bg-[#0969da]"></span>
          <span className="w-3 h-3 rounded-[3px] bg-[#54aeff]"></span>
          <span className="w-3 h-3 rounded-[3px] bg-[#b6e3ff] mr-1"></span> 
          More
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================
const DsaPage = () => {
  const { roadmaps, topics, problems, syncProfile, loading, isSyncing, toggleProblem, fetchTopicsForRoadmap, saveSyncProfile, triggerAutoSync } = useDSA();
  
  const [activeTab, setActiveTab] = useState('roadmaps'); 
  const [roadmapView, setRoadmapView] = useState('library'); 
  const [activeRoadmapId, setActiveRoadmapId] = useState(null);
  const [activeTopicId, setActiveTopicId] = useState(null); 
  const [localSyncParams, setLocalSyncParams] = useState({ leetcode: '', codeforces: '', geeksforgeeks: '' });

  useEffect(() => { if (roadmaps.length > 0 && !activeRoadmapId) setActiveRoadmapId(roadmaps[0]._id); }, [roadmaps]);
  useEffect(() => { setLocalSyncParams(syncProfile); }, [syncProfile]);

  const activeRoadmap = roadmaps.find(r => r._id === activeRoadmapId);
  const activeTopic = topics.find(t => t._id === activeTopicId);
  const topicProblems = problems.filter(p => p.topicId === activeTopicId);
  const systemRoadmaps = roadmaps.filter(r => r.type === 'system');

  const handleRoadmapSwitch = (id) => { setActiveRoadmapId(id); setActiveTopicId(null); fetchTopicsForRoadmap(id); setRoadmapView('workspace'); };
  const handleSaveCredentials = (e) => { e.preventDefault(); saveSyncProfile(localSyncParams); };

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
                { id: 'patterns', label: 'Patterns', icon: LayoutGrid }, 
                { id: 'sync', label: 'Sync Engine', icon: RefreshCcw } 
              ].map(v => (
                <button 
                  key={v.id} 
                  onClick={() => { setActiveTab(v.id); if (v.id === 'roadmaps') setRoadmapView('library'); }} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold ${activeTab === v.id ? 'bg-white/10 text-white shadow border border-white/5' : 'text-white/40 hover:text-white/80'}`}
                >
                  <v.icon className="w-4 h-4" /> {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ==========================================
            ANALYTICS TAB
            ========================================== */}
        {activeTab === 'analytics' && (
          <AnalyticsPanel problems={problems} />
        )}

        {/* ==========================================
            ROADMAPS TAB
            ========================================== */}
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

        {activeTab === 'roadmaps' && roadmapView === 'workspace' && (
           <div className="flex flex-col gap-6 animate-in fade-in">
             
             {/* Dynamic Header & Back Button */}
             <div className="flex items-center justify-between mb-2">
               <div>
                 <h2 className="text-2xl font-bold text-white">{activeRoadmap?.name}</h2>
                 <p className="text-sm text-white/50">{activeTopicId ? activeTopic?.name : 'Select a module to view problems.'}</p>
               </div>
               <button onClick={() => setRoadmapView('library')} className="px-4 py-2 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 transition-all text-xs font-bold flex items-center gap-2 border border-white/10">
                 <ArrowDownUp className="w-4 h-4 rotate-90" /> Back to Roadmaps
               </button>
             </div>

             {!activeTopicId ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {topics.map(topic => {
                   const topicProbs = problems.filter(p => p.topicId === topic._id);
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
                 {topicProblems.map(p => (
                   <div key={p._id} className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-black/30 border border-white/10 items-center group hover:bg-black/40 transition-all">
                     
                     <div className="col-span-1 flex justify-center">
                       <button onClick={() => toggleProblem(p)} className="hover:scale-110 transition-transform">
                         {p.status === 'solved' ? 
                           <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> : 
                           <Circle className="w-5 h-5 text-white/20 hover:text-emerald-400/50" />
                         }
                       </button>
                     </div>

                     <div className="col-span-5"><a href={p.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white/90 hover:text-blue-400 truncate block">{p.title}</a></div>
                     <div className="col-span-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPlatformStyle(p.platform)}`}>{p.platform}</span></div>
                     <div className="col-span-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${p.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : p.difficulty === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>{p.difficulty}</span></div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

        {/* ==========================================
            SYNC ENGINE TAB
            ========================================== */}
        {activeTab === 'sync' && (
          <div className="max-w-2xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-8 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Database className="w-8 h-8 text-blue-400" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Platform Credentials</h2>
                  <p className="text-sm text-white/50">Save your usernames once. Our auto-sync engine will verify your solved problems continuously.</p>
                </div>
              </div>

              <form onSubmit={handleSaveCredentials} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">LeetCode Username</label>
                  <input type="text" value={localSyncParams.leetcode} onChange={(e) => setLocalSyncParams({...localSyncParams, leetcode: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none" placeholder="e.g. urvicf" />
                </div>
                <div>
                  <label className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">Codeforces Handle</label>
                  <input type="text" value={localSyncParams.codeforces} onChange={(e) => setLocalSyncParams({...localSyncParams, codeforces: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none" placeholder="e.g. tourist" />
                </div>
                {/* NEW: GeeksForGeeks Field */}
                <div>
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">GeeksForGeeks Handle</label>
                  <input type="text" value={localSyncParams.geeksforgeeks} onChange={(e) => setLocalSyncParams({...localSyncParams, geeksforgeeks: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none" placeholder="e.g. urvi123" />
                </div>
                
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-white/40">Status: {syncProfile.leetcode ? 'Connected' : 'Not Connected'}</span>
                  <div className="flex gap-3">
                    <button type="submit" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all">Save Credentials</button>
                    {/* NEW: Dynamic Loading Button */}
                    <button 
                      type="button" 
                      onClick={() => triggerAutoSync(localSyncParams)} 
                      disabled={isSyncing}
                      className={`px-6 py-3 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all ${
                        isSyncing 
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-not-allowed' 
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      <RefreshCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
                      {isSyncing ? 'Heist in Progress...' : 'Run Sync Now'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};
export default DsaPage;