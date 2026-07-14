import React from 'react';
import { BarChart2, Target } from 'lucide-react';

const DsaRightPanel = ({ problems }) => {
  const getPlatformStats = (platform) => {
    const platformProbs = problems.filter(p => p.platform === platform);
    return {
      solved: platformProbs.filter(p => p.status === 'solved').length,
      total: platformProbs.length || 0 
    };
  };

  const lc = getPlatformStats('LeetCode');
  const cf = getPlatformStats('Codeforces');
  const gfg = getPlatformStats('GeeksForGeeks');

  const getDiffStats = (diff) => {
    const diffProbs = problems.filter(p => p.difficulty === diff);
    return {
      solved: diffProbs.filter(p => p.status === 'solved').length,
      total: diffProbs.length || 0
    };
  };

  const easy = getDiffStats('easy');
  const med = getDiffStats('medium');
  const hard = getDiffStats('hard');

  return (
    <div className="p-6 h-full flex flex-col gap-10 overflow-y-auto scrollbar-hide w-full">
      
      {/* =========================================
          PLATFORM STATS (Sidebar-Optimized)
          ========================================= */}
      <div className="w-full">
        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2 mb-6">
          <BarChart2 className="w-4 h-4" /> Platform Stats
        </h3>
        
        <div className="flex flex-col gap-4 w-full">
          
          {/* LeetCode */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-blue-500/30 transition-all w-full group">
            {/* min-w-0 forces flexbox to respect truncation, stopping the overflow! */}
            <div className="flex flex-col gap-1 min-w-0 pr-2">
              <span className="text-xs font-extrabold text-white/70 uppercase tracking-wide truncate group-hover:text-blue-400 transition-colors">LeetCode</span>
              <span className="text-[10px] font-bold text-white/40 whitespace-nowrap">{lc.solved} / {lc.total} Solved</span>
            </div>
            {/* Scaled down to w-13 h-13 so it fits perfectly in the sidebar */}
            <div className="w-12 h-12 shrink-0 rounded-full border-[3px] border-blue-500/20 flex items-center justify-center font-bold text-lg text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.1)]">
              {lc.solved}
            </div>
          </div>

          {/* Codeforces */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-blue-500/30 transition-all w-full group">
            <div className="flex flex-col gap-1 min-w-0 pr-2">
              <span className="text-xs font-extrabold text-white/70 uppercase tracking-wide truncate group-hover:text-blue-400 transition-colors">Codeforces</span>
              <span className="text-[10px] font-bold text-white/40 whitespace-nowrap">{cf.solved} / {cf.total} Solved</span>
            </div>
            <div className="w-12 h-12 shrink-0 rounded-full border-[3px] border-blue-500/20 flex items-center justify-center font-bold text-lg text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.1)]">
              {cf.solved}
            </div>
          </div>

          {/* GeeksForGeeks */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-blue-500/30 transition-all w-full group">
            <div className="flex flex-col gap-1 min-w-0 pr-2">
              <span className="text-xs font-extrabold text-white/70 uppercase tracking-normal truncate group-hover:text-blue-400 transition-colors">GeeksForGeeks</span>
              <span className="text-[10px] font-bold text-white/40 whitespace-nowrap">{gfg.solved} / {gfg.total} Solved</span>
            </div>
            <div className="w-12 h-12 shrink-0 rounded-full border-[3px] border-blue-500/20 flex items-center justify-center font-bold text-lg text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.1)]">
              {gfg.solved}
            </div>
          </div>

        </div>
      </div>

      {/* =========================================
          DIFFICULTY STATS
          ========================================= */}
      <div className="w-full">
        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2 mb-6">
          <Target className="w-4 h-4" /> Difficulty
        </h3>
        
        <div className="flex flex-col gap-6 w-full">
          {/* Easy */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-emerald-400">Easy</span>
              <span className="text-white/80">{easy.solved} <span className="text-white/40">/ {easy.total}</span></span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${easy.total ? (easy.solved / easy.total) * 100 : 0}%` }}></div>
            </div>
          </div>

          {/* Medium */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-amber-400">Medium</span>
              <span className="text-white/80">{med.solved} <span className="text-white/40">/ {med.total}</span></span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${med.total ? (med.solved / med.total) * 100 : 0}%` }}></div>
            </div>
          </div>

          {/* Hard */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-red-400">Hard</span>
              <span className="text-white/80">{hard.solved} <span className="text-white/40">/ {hard.total}</span></span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{ width: `${hard.total ? (hard.solved / hard.total) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DsaRightPanel;