import React from 'react';
import { AlertCircle, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';

const TaskRightPanel = ({ tasks = [] }) => {
  // 1. Priority Breakdown (excluding done)
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const criticalCount = activeTasks.filter(t => t.priority === 'critical').length;
  const highCount = activeTasks.filter(t => t.priority === 'high').length;
  const medCount = activeTasks.filter(t => t.priority === 'medium').length;
  const lowCount = activeTasks.filter(t => t.priority === 'low').length;

  // 2. Upcoming Deadlines Math (Top 5)
  const getUpcomingTasks = () => {
    const pendingWithDeadlines = activeTasks.filter(t => t.deadline);
    
    // Sort by nearest deadline
    pendingWithDeadlines.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    return pendingWithDeadlines.slice(0, 5); // Take Top 5
  };

  const getDaysRemaining = (deadline) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(deadline);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d Overdue`, color: 'text-red-400' };
    if (diffDays === 0) return { text: 'Due Today', color: 'text-amber-400' };
    if (diffDays === 1) return { text: 'Due Tomorrow', color: 'text-blue-400' };
    return { text: `In ${diffDays} days`, color: 'text-white/60' };
  };

  const upcomingTasks = getUpcomingTasks();

  return (
    <div className="flex flex-col gap-6 h-full">
      
      {/* Priority Summary */}
      <div className="p-5 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertCircle className="w-3 h-3 text-blue-400" /> Priority Breakdown
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.15)]">{criticalCount}</span>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">Critical</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.15)]">{highCount}</span>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">High</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.15)]">{medCount}</span>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">Medium</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-white/60 drop-shadow-[0_0_8px_rgba(255,255,255,0.05)]">{lowCount}</span>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">Low</span>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="p-5 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20 flex-1">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
          <CalendarDays className="w-3 h-3 text-blue-400" /> Top 5 Deadlines
        </h3>
        
        <div className="flex flex-col gap-3">
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-6 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
              <p className="text-xs text-white/40">No upcoming deadlines. You're all clear!</p>
            </div>
          ) : (
            upcomingTasks.map(task => {
              const countdown = getDaysRemaining(task.deadline);
              return (
                <div key={task._id} className="p-3 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-2">
                  <h4 className="text-xs font-medium text-white/90 truncate">{task.title}</h4>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/40 uppercase tracking-wider">{task.category}</span>
                    <span className={`flex items-center gap-1 font-semibold ${countdown.color}`}>
                      <Clock className="w-3 h-3" /> {countdown.text}
                    </span>
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

export default TaskRightPanel;