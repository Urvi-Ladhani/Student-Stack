import React from 'react';
import { Clock } from 'lucide-react';

const DsaRightPanel = ({ problems }) => {
  // 1. Get only solved problems and sort by date (newest first)
  const recentSolved = problems
    .filter(p => p.status === 'solved')
    .sort((a, b) => {
      const dateA = a.attempts?.length ? new Date(a.attempts[a.attempts.length - 1].date) : 0;
      const dateB = b.attempts?.length ? new Date(b.attempts[b.attempts.length - 1].date) : 0;
      return dateB - dateA;
    })
    .slice(0, 8); // Show last 8

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
        <Clock className="w-4 h-4" /> Recent Conquests
      </h3>
      
      <div className="flex flex-col gap-2">
        {recentSolved.length > 0 ? recentSolved.map(p => (
          <div key={p._id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center group">
            <span className="text-xs font-medium text-white/80 truncate max-w-[120px]">{p.title}</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Solved</span>
          </div>
        )) : (
          <p className="text-xs text-white/30 italic">No recent activity. Get syncing!</p>
        )}
      </div>
    </div>
  );
};

export default DsaRightPanel;