import React from 'react';
import { Target, Flame, RotateCcw, CheckCircle2, Code2, AlertCircle } from 'lucide-react';

const DsaRightPanel = ({ problems = [] }) => {
  // 1. Calculate Stats
  const solvedProblems = problems.filter(p => p.status === 'solved');
  const easyCount = solvedProblems.filter(p => p.difficulty === 'easy').length;
  const mediumCount = solvedProblems.filter(p => p.difficulty === 'medium').length;
  const hardCount = solvedProblems.filter(p => p.difficulty === 'hard').length;
  const totalSolved = solvedProblems.length;

  // 2. Calculate Revision Queue (What is due TODAY or OVERDUE)
  const getRevisionQueue = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return problems.filter(p => {
      if (p.status !== 'solved') return false; // Only review solved/attempted things
      if (!p.revisionSchedule?.nextRevisionDate) return false;
      
      const revDate = new Date(p.revisionSchedule.nextRevisionDate);
      return revDate <= today;
    }).sort((a, b) => new Date(a.revisionSchedule.nextRevisionDate) - new Date(b.revisionSchedule.nextRevisionDate));
  };

  const revisionQueue = getRevisionQueue();

  return (
    <div className="h-full w-full flex flex-col gap-6">
      
      {/* SECTION: Global Stats Widget */}
      <div className="p-5 rounded-3xl bg-black/20 border border-white/10 relative overflow-hidden group shadow-lg backdrop-blur-xl">
        <h3 className="text-xs font-bold tracking-wider text-white/50 uppercase mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-400" /> Mastery Stats
        </h3>
        
        <div className="flex items-end gap-3 mb-6">
          <span className="text-5xl font-bold text-white drop-shadow-md">{totalSolved}</span>
          <span className="text-xs text-white/50 font-medium uppercase tracking-wider mb-2">Total Solved</span>
        </div>

        <div className="space-y-3">
          {/* Easy */}
          <div>
             <div className="flex justify-between text-xs mb-1">
               <span className="text-emerald-400 font-semibold tracking-wide">Easy</span>
               <span className="text-white/80 font-mono">{easyCount}</span>
             </div>
             <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${totalSolved ? (easyCount/totalSolved)*100 : 0}%` }}></div>
             </div>
          </div>
          {/* Medium */}
          <div>
             <div className="flex justify-between text-xs mb-1">
               <span className="text-amber-400 font-semibold tracking-wide">Medium</span>
               <span className="text-white/80 font-mono">{mediumCount}</span>
             </div>
             <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-amber-500 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" style={{ width: `${totalSolved ? (mediumCount/totalSolved)*100 : 0}%` }}></div>
             </div>
          </div>
          {/* Hard */}
          <div>
             <div className="flex justify-between text-xs mb-1">
               <span className="text-red-400 font-semibold tracking-wide">Hard</span>
               <span className="text-white/80 font-mono">{hardCount}</span>
             </div>
             <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-red-500 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.5)]" style={{ width: `${totalSolved ? (hardCount/totalSolved)*100 : 0}%` }}></div>
             </div>
          </div>
        </div>
      </div>

      {/* SECTION: Spaced Repetition Queue */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold tracking-wider text-white/50 uppercase flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-purple-400" /> Daily Revision
          </h3>
          <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
            {revisionQueue.length} Due
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pb-6">
          {revisionQueue.length === 0 ? (
            <div className="p-6 rounded-2xl bg-black/20 border border-white/5 flex flex-col items-center justify-center text-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
              <p className="text-xs text-white/40">Your spaced repetition queue is clear for today.</p>
            </div>
          ) : (
            revisionQueue.map(problem => {
              const isOverdue = new Date(problem.revisionSchedule.nextRevisionDate).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
              return (
                <div key={problem._id} className="p-3 rounded-2xl bg-black/30 border border-white/10 hover:border-white/20 transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-white/90 truncate pr-2 group-hover:text-blue-300 transition-colors">{problem.title}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${
                      problem.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10' :
                      problem.difficulty === 'medium' ? 'text-amber-400 bg-amber-500/10' :
                      'text-red-400 bg-red-500/10'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/40">{problem.platform}</span>
                    {isOverdue ? (
                      <span className="flex items-center gap-1 text-red-400 font-bold"><AlertCircle className="w-3 h-3"/> Overdue</span>
                    ) : (
                      <span className="text-blue-400 font-medium">Due Today</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default DsaRightPanel;