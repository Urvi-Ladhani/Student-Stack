import React from 'react';
import { Play, AlertCircle, Calendar } from 'lucide-react';

const TaskRightPanel = ({ tasks = [] }) => {
  const criticalCount = tasks.filter(t => t.priority === 'critical' && t.status !== 'done').length;
  const highCount = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
  const medCount = tasks.filter(t => t.priority === 'medium' && t.status !== 'done').length;
  const lowCount = tasks.filter(t => t.priority === 'low' && t.status !== 'done').length;

  return (
    <div className="flex flex-col gap-6 h-full">
      
      {/* Priority Summary */}
      <div className="p-5 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertCircle className="w-3 h-3 text-amber-400" /> Priority Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-red-400 drop-shadow-sm">{criticalCount}</span>
            <span className="text-[10px] text-white/50 uppercase">Critical</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-amber-400 drop-shadow-sm">{highCount}</span>
            <span className="text-[10px] text-white/50 uppercase">High</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-blue-400 drop-shadow-sm">{medCount}</span>
            <span className="text-[10px] text-white/50 uppercase">Medium</span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white/60 drop-shadow-sm">{lowCount}</span>
            <span className="text-[10px] text-white/50 uppercase">Low</span>
          </div>
        </div>
      </div>

      {/* Today's Study Plan Placeholder */}
      <div className="p-5 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Play className="w-3 h-3 text-emerald-400" /> Today's Study Plan
        </h3>
        <p className="text-xs text-white/40 text-center py-4">No tasks linked to study sessions today.</p>
      </div>

    </div>
  );
};

export default TaskRightPanel;