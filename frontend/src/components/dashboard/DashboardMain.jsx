import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, Trophy, CheckCircle2, Clock, Code2, 
  Briefcase, Activity, Calendar, AlertCircle, 
  ChevronRight, ArrowRight, BookOpen, Target
} from 'lucide-react';

const DashboardMain = ({ userName = "Urvi" }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real task data from MongoDB
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5002/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTasks(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load dashboard tasks", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // --- DATA PROCESSING MATH ---
  const { 
    activeTasks, overdueTasks, todaysTasks, completedTasks, 
    dsaCompleted, totalStudyHours, internshipTasks 
  } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const active = tasks.filter(t => t.status !== 'done' && !t.isArchived);
    const completed = tasks.filter(t => t.status === 'done');

    const overdue = active.filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      d.setHours(23, 59, 59, 999);
      return d < new Date();
    });

    const today = active.filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      const rightNow = new Date();
      return d.getDate() === rightNow.getDate() && d.getMonth() === rightNow.getMonth() && d.getFullYear() === rightNow.getFullYear();
    }).sort((a, b) => {
      const p = { critical: 4, high: 3, medium: 2, low: 1 };
      return p[b.priority] - p[a.priority];
    });

    // Stats calculations
    const dsaDone = completed.filter(t => t.category === 'DSA').length;
    const hours = completed.reduce((total, task) => total + (task.estimatedMinutes || 0), 0) / 60;
    const internships = active.filter(t => t.category === 'Internship');

    return { 
      activeTasks: active, 
      overdueTasks: overdue, 
      todaysTasks: today, 
      completedTasks: completed,
      dsaCompleted: dsaDone,
      totalStudyHours: hours.toFixed(1),
      internshipTasks: internships
    };
  }, [tasks]);

  // Icon mapping helper
  const getCategoryIcon = (category, isOverdue) => {
    if (isOverdue) return <AlertCircle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)] text-red-400" />;
    if (category === 'DSA') return <Code2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] text-blue-400" />;
    if (category === 'Internship') return <Briefcase className="w-5 h-5 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] text-purple-400" />;
    return <BookOpen className="w-5 h-5 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] text-emerald-400" />;
  };

  if (loading) return <div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse">Syncing Dashboard...</div>;

  return (
    <div className="w-full space-y-8 pb-12">
      
      {/* SECTION 1: Daily Brief Header */}
      <div className="sticky top-0 z-20 bg-black/20 backdrop-blur-2xl pt-4 pb-4 px-6 -mx-6 border-b border-white/10 shadow-lg shadow-black/20 rounded-b-2xl mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2 drop-shadow-md">
          Good Morning, {userName}
        </h1>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-white/60">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <span className="w-1 h-1 rounded-full bg-white/20"></span>
          <div className="flex gap-3 text-blue-300 drop-shadow-sm">
            <span>{todaysTasks.length} tasks due today</span>
            <span className="text-white/20">•</span>
            <span className={overdueTasks.length > 0 ? "text-red-400" : ""}>{overdueTasks.length} overdue</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Today's Focus Strip (Dynamically Generated) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/80 tracking-wide uppercase drop-shadow-sm">Today's Focus</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {todaysTasks.length === 0 && overdueTasks.length === 0 ? (
            <div className="min-w-[280px] p-5 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl snap-start flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2 opacity-50" />
              <p className="text-white/60 text-sm">All caught up for today!</p>
            </div>
          ) : (
            [...overdueTasks, ...todaysTasks].slice(0, 5).map(task => {
              const isOverdue = new Date(task.deadline).setHours(23,59,59,999) < new Date();
              return (
                <div key={task._id} className={`min-w-[280px] p-5 rounded-2xl bg-black/20 backdrop-blur-xl snap-start group cursor-pointer transition-all shadow-xl shadow-black/30 border ${
                  isOverdue ? 'border-red-400/20 hover:border-red-400/50 hover:bg-red-900/10' : 'border-blue-400/20 hover:border-blue-400/50 hover:bg-blue-900/10'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {getCategoryIcon(task.category, isOverdue)}
                    <span className={`text-xs font-bold uppercase tracking-wider ${isOverdue ? 'text-red-400' : 'text-blue-400'}`}>
                      {isOverdue ? 'OVERDUE' : task.category}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-1 truncate">{task.title}</h3>
                  <p className="text-xs text-white/50">{task.estimatedMinutes} mins • Priority: {task.priority}</p>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* SECTION 3: Streak & Momentum */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Study Streak", value: "3 Days", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/20" },
          { label: "DSA Solved", value: dsaCompleted, icon: Code2, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/20" },
          { label: "Tasks Done", value: completedTasks.length, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/20" },
          { label: "Study Hours", value: `${totalStudyHours}h`, icon: Clock, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/20" }
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-2xl bg-black/20 border border-white/10 backdrop-blur-xl flex flex-col justify-center items-center text-center shadow-lg hover:${stat.border} transition-colors`}>
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} mb-3 border border-white/5`}>
              <stat.icon className="w-5 h-5 drop-shadow-md" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-1 drop-shadow-sm">{stat.value}</h4>
            <p className="text-xs text-white/50 font-medium uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          <section className="p-6 rounded-3xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Tasks Timeline
              </h3>
            </div>
            <div className="space-y-3">
              {[...overdueTasks, ...todaysTasks].slice(0, 4).map((task) => {
                 const isOverdue = new Date(task.deadline).setHours(23,59,59,999) < new Date();
                 return (
                  <div key={task._id} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                    <div className="w-4 h-4 rounded border border-white/30 group-hover:border-emerald-400 transition-colors"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/90 truncate">{task.title}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      isOverdue ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/10 text-white/60 border border-white/5'
                    }`}>
                      {isOverdue ? 'Overdue' : 'Today'}
                    </span>
                  </div>
                 )
              })}
              {overdueTasks.length === 0 && todaysTasks.length === 0 && (
                <p className="text-white/40 text-xs text-center py-4">Timeline clear.</p>
              )}
            </div>
          </section>

          <section className="p-6 rounded-3xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20">
             <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-400" /> DSA Progress
              </h3>
              <span className="text-xs font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded-md">{dsaCompleted} Solved</span>
            </div>
            <div className="mb-4">
              <p className="text-xs text-white/50 mb-1">Overall Completion</p>
              <div className="w-full h-2 bg-black/40 rounded-full mt-3 overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-[15%] rounded-full shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          <section className="p-6 rounded-3xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
              <Briefcase className="w-4 h-4 text-purple-400" /> Active Applications
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-black/20 border border-white/5">
                <span className="text-2xl font-bold text-blue-400 mb-1 drop-shadow-sm">{internshipTasks.length}</span>
                <span className="text-[10px] text-white/50 uppercase tracking-wider">Pending Action</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-black/20 border border-white/5">
                <span className="text-2xl font-bold text-emerald-400 mb-1 drop-shadow-sm">0</span>
                <span className="text-[10px] text-white/50 uppercase tracking-wider">Offers</span>
              </div>
            </div>
          </section>

          <section className="p-6 rounded-3xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" /> Recent Activity
              </h3>
            </div>
            
            <div className="space-y-4">
              {completedTasks.slice(0,3).map(task => (
                <div key={task._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/90 font-medium truncate">Done: {task.title}</p>
                    <p className="text-xs text-white/40">{task.category}</p>
                  </div>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <p className="text-white/40 text-xs text-center py-4">No recent activity.</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default DashboardMain;