import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DsaRightPanel from '../components/dsa/DsaRightPanel';
import { 
  Code2, Layers, ChevronRight, Play, CheckCircle2, 
  Circle, X, Activity, Trophy, GitBranch, BrainCircuit, 
  LayoutGrid, ArrowDownUp, Plus, Library, BookOpen, Link2, RefreshCcw, Database
} from 'lucide-react';

const useDSA = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [topics, setTopics] = useState([]);
  const [problems, setProblems] = useState([]);
  const [syncProfile, setSyncProfile] = useState({ leetcode: '', codeforces: '', geeksforgeeks: '' });
  const [loading, setLoading] = useState(true);

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

      // Fetch Saved Sync Profile
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

  const logAttempt = async (problemId, data) => execute(`/problems/${problemId}/attempt`, 'POST', data);
  const createRoadmap = async (data) => execute('/roadmaps', 'POST', data);
  const createProblem = async (data) => execute('/problems', 'POST', data);
  
  const saveSyncProfile = async (data) => {
    const success = await execute('/sync-profile', 'POST', data);
    if (success) alert("Credentials saved permanently to database.");
  };

  const fetchTopicsForRoadmap = async (roadmapId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/dsa/topics/${roadmapId}`, { headers: { 'Authorization': `Bearer ${token}` }});
    if (res.ok) setTopics(await res.json());
  };

  useEffect(() => { fetchData(); }, []);

  return { roadmaps, topics, problems, syncProfile, loading, logAttempt, createRoadmap, createProblem, fetchTopicsForRoadmap, saveSyncProfile };
};

// ... [AttemptModal, CreateRoadmapModal, AddProblemModal identical to previous] ...
const AttemptModal = ({ isOpen, onClose, onSave, problem }) => {
  const [formData, setFormData] = useState({ outcome: 'solved', confidenceRating: 3, timeTakenMinutes: 20, notes: '' });
  if (!isOpen || !problem) return null;
  const handleSubmit = async (e) => { e.preventDefault(); await onSave(problem._id, formData); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-black/40 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between mb-6"><h3 className="text-xl font-bold text-white">Log Attempt</h3><button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50"><X className="w-5 h-5" /></button></div>
        <div className="mb-6 p-4 rounded-xl bg-black/30 border border-white/5"><h4 className="text-sm font-medium text-white mb-1">{problem.title}</h4><p className="text-xs text-white/40">{problem.platform} • {problem.difficulty}</p></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">{[{ id: 'solved', label: 'Solved' }, { id: 'partial', label: 'Partial' }, { id: 'failed', label: 'Failed' }].map(opt => (<button key={opt.id} type="button" onClick={() => setFormData({...formData, outcome: opt.id})} className={`py-2 rounded-xl text-xs font-bold border ${formData.outcome === opt.id ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-black/40 border-white/10 text-white/40'}`}>{opt.label}</button>))}</div>
          <input type="number" required min="1" value={formData.timeTakenMinutes} onChange={(e) => setFormData({...formData, timeTakenMinutes: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
          <button type="submit" className="w-full py-3 rounded-xl bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">Save</button>
        </form>
      </div>
    </div>
  );
};

const DsaPage = () => {
  const { roadmaps, topics, problems, syncProfile, loading, logAttempt, fetchTopicsForRoadmap, saveSyncProfile } = useDSA();
  
  const [activeTab, setActiveTab] = useState('roadmaps'); 
  const [roadmapView, setRoadmapView] = useState('library'); 
  const [activeRoadmapId, setActiveRoadmapId] = useState(null);
  const [activeTopicId, setActiveTopicId] = useState(null); 
  
  const [attemptModalState, setAttemptModalState] = useState({ isOpen: false, problem: null });
  const [localSyncParams, setLocalSyncParams] = useState({ leetcode: '', codeforces: '', geeksforgeeks: '' });

  useEffect(() => {
    if (roadmaps.length > 0 && !activeRoadmapId) setActiveRoadmapId(roadmaps[0]._id);
  }, [roadmaps]);

  useEffect(() => {
    setLocalSyncParams(syncProfile);
  }, [syncProfile]);

  const activeRoadmap = roadmaps.find(r => r._id === activeRoadmapId);
  const activeTopic = topics.find(t => t._id === activeTopicId);
  const topicProblems = problems.filter(p => p.topicId === activeTopicId);
  const systemRoadmaps = roadmaps.filter(r => r.type === 'system');

  const handleRoadmapSwitch = (id) => {
    setActiveRoadmapId(id); setActiveTopicId(null); fetchTopicsForRoadmap(id); setRoadmapView('workspace');
  };

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    saveSyncProfile(localSyncParams);
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
                { id: 'patterns', label: 'Patterns', icon: LayoutGrid },
                { id: 'contests', label: 'Contests', icon: Trophy },
                { id: 'sync', label: 'Sync Engine', icon: RefreshCcw } // <-- SEPARATED SYNC TAB
              ].map(v => (
                <button key={v.id} onClick={() => { setActiveTab(v.id); if (v.id === 'roadmaps') setRoadmapView('library'); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold ${activeTab === v.id ? 'bg-white/10 text-white shadow border border-white/5' : 'text-white/40 hover:text-white/80'}`}><v.icon className="w-4 h-4" /> {v.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ROADMAPS RENDERER */}
        {activeTab === 'roadmaps' && roadmapView === 'library' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
             {systemRoadmaps.map(rm => (
               <div key={rm._id} onClick={() => handleRoadmapSwitch(rm._id)} className="p-5 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-xl hover:border-blue-500/50 cursor-pointer transition-all">
                 <h3 className="text-lg font-bold text-white mb-1">{rm.name}</h3>
                 <p className="text-xs text-white/40">{rm.totalTopics} Modules • Pre-loaded</p>
               </div>
             ))}
           </div>
        )}

        {/* WORKSPACE RENDERER */}
        {activeTab === 'roadmaps' && roadmapView === 'workspace' && (
           <div className="flex flex-col gap-6 animate-in fade-in">
             {!activeTopicId ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {topics.map(topic => (
                   <div key={topic._id} onClick={() => setActiveTopicId(topic._id)} className="p-4 rounded-xl bg-black/30 border border-white/10 shadow-lg hover:bg-black/40 cursor-pointer">
                     <h3 className="text-sm font-medium text-white mb-4">{topic.name}</h3>
                   </div>
                 ))}
               </div>
             ) : (
               <div>
                 <button onClick={() => setActiveTopicId(null)} className="mb-4 text-xs font-bold text-white/50 hover:text-white">← Back to Topics</button>
                 <div className="space-y-3">
                   {topicProblems.map(p => (
                     <div key={p._id} className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-black/30 border border-white/10 items-center">
                       <div className="col-span-5"><a href={p.url} target="_blank" rel="noreferrer" className="text-sm text-white/90 hover:text-blue-400">{p.title}</a></div>
                       <div className="col-span-3 text-xs text-white/50">{p.platform}</div>
                       <div className="col-span-2 text-xs text-emerald-400">{p.difficulty}</div>
                       <div className="col-span-2 flex justify-end"><button onClick={() => setAttemptModalState({isOpen: true, problem: p})} className="text-xs text-blue-400">Log</button></div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
        )}

        {/* ==========================================
            NEW: DEDICATED SYNC TAB 
            ========================================== */}
        {activeTab === 'sync' && (
          <div className="max-w-2xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-8 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Database className="w-8 h-8 text-blue-400" />
                </div>
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
                <div>
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">GeeksForGeeks Handle</label>
                  <input type="text" value={localSyncParams.geeksforgeeks} onChange={(e) => setLocalSyncParams({...localSyncParams, geeksforgeeks: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-sm text-white outline-none" placeholder="e.g. urvi123" />
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-white/40">Status: {syncProfile.leetcode ? 'Connected' : 'Not Connected'}</span>
                  <button type="submit" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all">Save Credentials</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      <AttemptModal isOpen={attemptModalState.isOpen} problem={attemptModalState.problem} onClose={() => setAttemptModalState({isOpen: false, problem: null})} onSave={logAttempt} />
    </DashboardLayout>
  );
};
export default DsaPage;