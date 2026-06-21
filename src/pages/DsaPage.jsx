import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DsaRightPanel from '../components/dsa/DsaRightPanel';
import { 
  Code2, Layers, ChevronRight, Play, CheckCircle2, 
  Circle, X, Search, Filter as FilterIcon, RefreshCcw, Activity,
  Target, Trophy, GitBranch, BrainCircuit, LayoutGrid, ArrowDownUp, ChevronDown,
  AlertTriangle, Plus
} from 'lucide-react';

// ==========================================
// 1. DATA LAYER
// ==========================================
const useDSA = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [topics, setTopics] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [rmRes, probRes] = await Promise.all([
        fetch('http://localhost:5000/api/dsa/roadmaps', { headers }),
        fetch('http://localhost:5000/api/dsa/problems', { headers })
      ]);

      let dbRoadmaps = [];
      if (rmRes.ok) dbRoadmaps = await rmRes.json();
      if (probRes.ok) setProblems(await probRes.json());

      if (dbRoadmaps.length > 0) {
        setRoadmaps(dbRoadmaps);
        const topRes = await fetch(`http://localhost:5000/api/dsa/topics/${dbRoadmaps[0]._id}`, { headers });
        if (topRes.ok) setTopics(await topRes.json());
      } else {
        // FRONTEND MOCK DATA
        setRoadmaps([
          { _id: 'mock_r1', name: 'NeetCode 150', type: 'system', totalTopics: 15 },
          { _id: 'mock_r2', name: 'Striver A2Z', type: 'system', totalTopics: 22 },
          { _id: 'mock_r3', name: 'Blind 75', type: 'system', totalTopics: 10 }
        ]);
        setTopics([
          { _id: 'mock_t1', name: 'Arrays & Hashing', problemCount: 12 },
          { _id: 'mock_t2', name: 'Two Pointers', problemCount: 8 },
          { _id: 'mock_t3', name: 'Sliding Window', problemCount: 6 },
          { _id: 'mock_t4', name: 'Dynamic Programming', problemCount: 20 }
        ]);
      }
    } catch (error) {
      console.error("Error fetching DSA data:", error);
    } finally {
      setLoading(false);
    }
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

  const logAttempt = async (problemId, attemptData) => execute(`/problems/${problemId}/attempt`, 'POST', attemptData);

  useEffect(() => { fetchData(); }, []);

  return { roadmaps, topics, problems, loading, logAttempt };
};

// ==========================================
// 2. ATTEMPT LOGGER MODAL
// ==========================================
const AttemptModal = ({ isOpen, onClose, onSave, problem }) => {
  const [formData, setFormData] = useState({ outcome: 'solved', confidenceRating: 3, timeTakenMinutes: 20, notes: '' });

  if (!isOpen || !problem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(problem._id, formData);
    onClose();
  };

  const activeStyles = {
    solved: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]',
    partial: 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]',
    failed: 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.2)]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-black/40 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white drop-shadow-sm">Log Attempt</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="mb-6 p-4 rounded-xl bg-black/30 border border-white/5">
          <h4 className="text-sm font-medium text-white mb-1">{problem.title}</h4>
          <p className="text-xs text-white/40">{problem.platform} • {problem.difficulty}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Outcome</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ id: 'solved', label: 'Solved' }, { id: 'partial', label: 'Partial' }, { id: 'failed', label: 'Failed' }].map(opt => (
                <button
                  key={opt.id} type="button" onClick={() => setFormData({...formData, outcome: opt.id})}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    formData.outcome === opt.id ? activeStyles[opt.id] : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 flex items-center justify-between">
              Confidence Level <span className="text-blue-400 normal-case tracking-normal">(Drives Revision)</span>
            </label>
            <div className="flex justify-between items-center bg-black/40 border border-white/10 rounded-xl p-2">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num} type="button" onClick={() => setFormData({...formData, confidenceRating: num})}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                    formData.confidenceRating === num ? 'bg-blue-500 text-white shadow-lg scale-110' : 'text-white/40 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Time Taken (min)</label>
            <input type="number" required min="1" value={formData.timeTakenMinutes} onChange={(e) => setFormData({...formData, timeTakenMinutes: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all" />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="submit" className="w-full py-3 rounded-xl bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 hover:bg-blue-500/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              Save & Calculate Revision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN PAGE
// ==========================================
const DsaPage = () => {
  const { roadmaps, topics, problems, loading, logAttempt } = useDSA();
  
  const [activeTab, setActiveTab] = useState('roadmaps'); 
  const [activeRoadmapId, setActiveRoadmapId] = useState(null);
  const [activeTopicId, setActiveTopicId] = useState(null); 
  const [attemptModalState, setAttemptModalState] = useState({ isOpen: false, problem: null });

  useEffect(() => {
    if (roadmaps.length > 0 && !activeRoadmapId) setActiveRoadmapId(roadmaps[0]._id);
  }, [roadmaps]);

  const activeRoadmap = roadmaps.find(r => r._id === activeRoadmapId);
  const activeTopic = topics.find(t => t._id === activeTopicId);
  const topicProblems = problems.filter(p => p.topicId === activeTopicId);

  const getPlatformStyle = (platform) => {
    switch(platform) {
      case 'LeetCode': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Codeforces': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'GeeksForGeeks': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-white/60 bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return <DashboardLayout><div className="w-full h-full flex items-center justify-center text-white/50 font-mono animate-pulse">Loading OS Data...</div></DashboardLayout>;
  }

  const renderRoadmaps = () => (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-24 scrollbar-hide animate-in fade-in">
      {/* TOPIC GRID */}
      {!activeTopicId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map(topic => {
            const topicProbs = problems.filter(p => p.topicId === topic._id);
            const solved = topicProbs.filter(p => p.status === 'solved').length;
            const progress = (topic.problemCount || topicProbs.length) > 0 ? (solved / (topic.problemCount || topicProbs.length)) * 100 : 0;

            return (
              <div 
                key={topic._id} 
                onClick={() => setActiveTopicId(topic._id)}
                className="p-4 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg hover:bg-black/40 transition-all group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{topic.name}</h3>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/10 text-[10px] font-bold text-white/60">
                    {solved} / {topic.problemCount || topicProbs.length || 0}
                  </div>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* PROBLEM MATRIX */
        <div className="flex flex-col h-full animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-4 px-2">
            <button onClick={() => setActiveTopicId(null)} className="text-white/40 hover:text-blue-400 transition-colors">{activeRoadmap?.name}</button>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <span className="text-blue-300">{activeTopic?.name}</span>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            {/* Minimal Headers */}
            <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <div className="col-span-1 text-center">Sts</div>
              <div className="col-span-5">Problem</div>
              <div className="col-span-2">Platform</div>
              <div className="col-span-2">Difficulty</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            {topicProblems.length === 0 ? (
              <div className="text-center text-white/40 mt-10">No problems added to this module yet.</div>
            ) : (
              topicProblems.map(problem => (
                <div key={problem._id} className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg hover:bg-black/40 transition-all items-center group">
                  <div className="col-span-1 flex justify-center">
                    {problem.status === 'solved' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> : 
                     problem.status === 'attempted' ? <Activity className="w-5 h-5 text-amber-400" /> : 
                     <Circle className="w-5 h-5 text-white/20" />}
                  </div>
                  <div className="col-span-5 flex flex-col">
                    <a href={problem.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white/90 hover:text-blue-300 transition-colors truncate">
                      {problem.title}
                    </a>
                    {problem.patterns?.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {problem.patterns.map((pat, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">{pat}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                     <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPlatformStyle(problem.platform)}`}>
                      {problem.platform}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      problem.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                      problem.difficulty === 'medium' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                      'text-red-400 bg-red-500/10 border border-red-500/20'
                    }`}>{problem.difficulty}</span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button 
                      onClick={() => setAttemptModalState({ isOpen: true, problem })}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-[10px] font-bold tracking-wider transition-all uppercase flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                    >
                      <Play className="w-3 h-3" /> Log
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderPatterns = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in">
      {['Sliding Window', 'Two Pointers', 'Binary Search', 'Dynamic Programming', 'Graphs (BFS/DFS)', 'Backtracking', 'Heaps', 'Tries'].map((pat, i) => (
        <div key={i} className="p-4 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg hover:bg-black/40 transition-all cursor-pointer group">
          <h3 className="text-sm font-medium text-white mb-4 group-hover:text-purple-300 transition-colors">{pat}</h3>
          <div className="flex justify-between items-end mb-2">
            <span className="text-xl font-bold text-white drop-shadow-md">0<span className="text-xs text-white/40 font-normal">/15</span></span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">0% Mastery</span>
          </div>
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-purple-500 rounded-full w-0"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReadiness = () => (
    <div className="animate-in fade-in space-y-4 pb-10">
      <div className="p-6 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow-md mb-1">Overall Readiness</h2>
          <p className="text-xs text-white/60 max-w-md">Based on solved problems, revision performance, and confidence ratings.</p>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-3xl font-bold text-emerald-400 drop-shadow-md">73%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg">
          <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-2 mb-4 uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" /> Strong Areas
          </h3>
          <div className="space-y-4">
            {['Arrays & Hashing', 'Two Pointers', 'Linked Lists'].map((t, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] mb-1 font-semibold text-white/80 uppercase tracking-wider"><span>{t}</span><span className="text-emerald-400">85%+</span></div>
                <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-emerald-500 rounded-full w-[85%]"></div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg">
          <h3 className="text-xs font-bold text-red-400 flex items-center gap-2 mb-4 uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3" /> Needs Work
          </h3>
          <div className="space-y-4">
            {['Dynamic Programming', 'Graphs', 'Tries'].map((t, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px] mb-1 font-semibold text-white/80 uppercase tracking-wider"><span>{t}</span><span className="text-red-400">Under 40%</span></div>
                <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-red-500 rounded-full w-[35%]"></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout rightPanelContent={<DsaRightPanel problems={problems} />}>
      <div className="w-full flex flex-col h-full min-h-screen pb-24" onClick={() => {}}>
        
        {/* COMMAND BOARD (Identical to Task OS) */}
        <div className="sticky top-0 z-30 bg-black/20 backdrop-blur-2xl px-6 py-4 -mx-6 border-b border-white/10 shadow-lg shadow-black/20 rounded-b-2xl mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 shadow-inner">
              {[
                { id: 'roadmaps', label: 'Roadmaps', icon: GitBranch },
                { id: 'patterns', label: 'Patterns', icon: LayoutGrid },
                { id: 'readiness', label: 'Readiness', icon: BrainCircuit },
                { id: 'contests', label: 'Contests', icon: Trophy }
              ].map(v => (
                <button 
                  key={v.id} onClick={() => setActiveTab(v.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === v.id ? 'bg-white/10 text-white shadow border border-white/5' : 'text-white/40 hover:text-white/80'}`}
                >
                  <v.icon className="w-4 h-4" /> {v.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-black/40 border border-white/10 text-white/40 hover:text-white/80 shadow-inner">
                <RefreshCcw className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                <Plus className="w-4 h-4" /> Add Problem
              </button>
            </div>
          </div>

          {/* Filters / Secondary Navigation Row */}
          {activeTab === 'roadmaps' && (
            <div className="flex items-center gap-3 z-20">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {roadmaps.map(rm => (
                  <button
                    key={rm._id}
                    onClick={() => { setActiveRoadmapId(rm._id); setActiveTopicId(null); }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all border whitespace-nowrap ${
                      activeRoadmapId === rm._id 
                        ? 'bg-white/10 text-white border-white/20 shadow-sm' 
                        : 'bg-black/40 text-white/50 border-white/10 hover:text-white hover:bg-white/5 shadow-inner'
                    }`}
                  >
                    {rm.name}
                  </button>
                ))}
                <button className="px-4 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white/50 hover:text-white border-dashed text-xs font-semibold flex items-center gap-1 shadow-inner">
                  <Plus className="w-3 h-3" /> Custom
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TAB RENDERING */}
        {activeTab === 'roadmaps' && renderRoadmaps()}
        {activeTab === 'patterns' && renderPatterns()}
        {activeTab === 'readiness' && renderReadiness()}
        {activeTab === 'contests' && (
           <div className="text-center text-white/40 mt-10">Contest sync integration coming soon.</div>
        )}

      </div>

      <AttemptModal 
        isOpen={attemptModalState.isOpen} 
        problem={attemptModalState.problem} 
        onClose={() => setAttemptModalState({ isOpen: false, problem: null })} 
        onSave={logAttempt} 
      />
    </DashboardLayout>
  );
};

export default DsaPage;