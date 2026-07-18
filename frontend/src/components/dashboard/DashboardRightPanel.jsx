import React, { useState, useEffect } from 'react';
import { Play, Square, Target, Calendar } from 'lucide-react';

const DashboardRightPanel = () => {
  const [tasks, setTasks] = useState([]);

  // Fetch real task data to power the deadlines and goals
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) setTasks(await response.json());
      } catch (error) {
        console.error("Failed to load right panel tasks", error);
      }
    };
    fetchTasks();
  }, []);

  // Calculate Urgent Deadlines (Top 3 nearest)
  const activeTasks = tasks.filter(t => t.status !== 'done' && !t.isArchived);
  const urgentTasks = activeTasks
    .filter(t => t.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  const getUrgencyBadge = (deadline) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(deadline);
    due.setHours(0,0,0,0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24)); 

    if (diffDays < 0) return <span className="text-[10px] font-bold px-2 py-1 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">Overdue</span>;
    if (diffDays === 0) return <span className="text-[10px] font-bold px-2 py-1 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20">Today</span>;
    if (diffDays === 1) return <span className="text-[10px] font-bold px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">Tomorrow</span>;
    return <span className="text-[10px] font-bold px-2 py-1 bg-white/5 text-white/60 rounded-lg border border-white/10">{diffDays} Days</span>;
  };

  // Calculate Weekly Goals (mocked total for now)
  const doneTasks = tasks.filter(t => t.status === 'done');
  const dsaDoneCount = doneTasks.filter(t => t.category === 'DSA').length;
  const studyMinutes = doneTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  
  const dsaTarget = 30;
  const hoursTarget = 40;
  const currentHours = (studyMinutes / 60).toFixed(1);

  return (
    <div className="h-full w-full flex flex-col gap-6">
      
      {/* SECTION: Active Study Session Widget */}
      <div className="p-5 relative overflow-hidden group shadow-lg light-glass hover-lift-scale">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full"></div>
        
        <h3 className="text-xs font-bold tracking-wider text-blue-400 uppercase mb-4">Active Session</h3>
        
        <div className="mb-4">
          <p className="text-sm text-white/80 font-medium mb-1">No Active Session</p>
          <p className="text-xs text-white/40">Start a timer from Task OS</p>
        </div>

        <div className="text-4xl font-mono text-white tracking-widest font-light mb-6 opacity-30">
          00<span className="text-white/30">:</span>00
        </div>

        <div className="flex gap-2 opacity-50 pointer-events-none">
          <button className="flex-1 glass-btn-secondary py-2.5 text-xs font-bold">
            <Play className="w-3 h-3 fill-white/60" /> Start
          </button>
        </div>
      </div>

      {/* SECTION: Upcoming Deadlines */}
      <div>
        <h3 className="text-xs font-bold tracking-wider text-white/40 uppercase mb-4 flex items-center gap-2">
          <Calendar className="w-3 h-3" /> Urgent Deadlines
        </h3>
        <div className="space-y-3">
          {urgentTasks.length === 0 ? (
            <p className="text-xs text-white/40 text-center py-4 light-glass shadow-inner">No upcoming deadlines.</p>
          ) : (
            urgentTasks.map(task => (
              <div key={task._id} className="p-3 flex justify-between items-center hover-lift-scale light-glass cursor-default shadow">
                <div className="truncate pr-3">
                  <p className="text-sm font-medium text-white/90 truncate">{task.title}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{task.category}</p>
                </div>
                <div className="shrink-0">
                  {getUrgencyBadge(task.deadline)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION: Weekly Goals Progress */}
      <div className="mt-auto pt-6 border-t border-white/[0.05]">
        <h3 className="text-xs font-bold tracking-wider text-white/40 uppercase mb-4 flex items-center gap-2">
          <Target className="w-3 h-3" /> Weekly Targets
        </h3>
        
        <div className="space-y-4">
          <div>
             <div className="flex justify-between text-xs mb-1">
               <span className="text-white/60">DSA Problems ({dsaDoneCount}/{dsaTarget})</span>
               <span className="text-blue-400 font-bold">{Math.min(100, Math.round((dsaDoneCount/dsaTarget)*100))}%</span>
             </div>
             <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, (dsaDoneCount/dsaTarget)*100)}%` }}
                ></div>
             </div>
          </div>
          <div>
             <div className="flex justify-between text-xs mb-1">
               <span className="text-white/60">Study Hours ({currentHours}/{hoursTarget}h)</span>
               <span className="text-purple-400 font-bold">{Math.min(100, Math.round((currentHours/hoursTarget)*100))}%</span>
             </div>
             <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, (currentHours/hoursTarget)*100)}%` }}
                ></div>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardRightPanel;