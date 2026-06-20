import React from 'react';
import { 
  Flame, Trophy, CheckCircle2, Clock, Code2, 
  Briefcase, Activity, Calendar, AlertCircle, 
  ChevronRight, ArrowRight, BookOpen, Target
} from 'lucide-react';

const DashboardMain = ({ userName = "Urvi" }) => {
  return (
    <div className="w-full space-y-8 pb-12">
      
      {/* SECTION 1: Daily Brief Header (Fixed the Black Hole) */}
      {/* Replaced bg-[#040712]/80 with proper high-blur glass */}
      <div className="sticky top-0 z-20 bg-black/20 backdrop-blur-2xl pt-4 pb-4 px-6 -mx-6 border-b border-white/10 shadow-lg shadow-black/20 rounded-b-2xl mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2 drop-shadow-md">
          Good Morning, {userName}
        </h1>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-white/60">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <span className="w-1 h-1 rounded-full bg-white/20"></span>
          <div className="flex gap-3 text-blue-300 drop-shadow-sm">
            <span>3 tasks due</span>
            <span className="text-white/20">•</span>
            <span>2 DSA scheduled</span>
            <span className="text-white/20">•</span>
            <span>1 interview tomorrow</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Today's Focus Strip */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/80 tracking-wide uppercase drop-shadow-sm">Today's Focus</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          
          <div className="min-w-[280px] p-5 rounded-2xl bg-black/20 border border-blue-400/20 backdrop-blur-xl snap-start group cursor-pointer hover:border-blue-400/50 hover:bg-blue-900/20 transition-all shadow-xl shadow-black/30">
            <div className="flex items-center gap-3 mb-3 text-blue-400">
              <AlertCircle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              <span className="text-xs font-bold uppercase tracking-wider">Priority Task</span>
            </div>
            <h3 className="text-white font-semibold mb-1">DBMS Normalization Assignment</h3>
            <p className="text-xs text-white/50">Due tonight at 11:59 PM</p>
          </div>
          
          <div className="min-w-[280px] p-5 rounded-2xl bg-black/20 border border-purple-400/20 backdrop-blur-xl snap-start group cursor-pointer hover:border-purple-400/50 hover:bg-purple-900/20 transition-all shadow-xl shadow-black/30">
            <div className="flex items-center gap-3 mb-3 text-purple-400">
              <Code2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
              <span className="text-xs font-bold uppercase tracking-wider">Problem of the Day</span>
            </div>
            <h3 className="text-white font-semibold mb-1">Search in Rotated Sorted Array</h3>
            <p className="text-xs text-white/50">Binary Search • Medium</p>
          </div>

          <div className="min-w-[280px] p-5 rounded-2xl bg-black/20 border border-emerald-400/20 backdrop-blur-xl snap-start group cursor-pointer hover:border-emerald-400/50 hover:bg-emerald-900/20 transition-all shadow-xl shadow-black/30">
            <div className="flex items-center gap-3 mb-3 text-emerald-400">
              <Briefcase className="w-5 h-5 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-xs font-bold uppercase tracking-wider">Upcoming Interview</span>
            </div>
            <h3 className="text-white font-semibold mb-1">Google OA Round</h3>
            <p className="text-xs text-white/50">Tomorrow, 10:00 AM</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Streak & Momentum */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Study Streak", value: "14 Days", icon: Flame, color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/20" },
          { label: "Problems (Week)", value: "24", icon: Code2, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/20" },
          { label: "Tasks (Week)", value: "18", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/20" },
          { label: "Study Hours", value: "32.5h", icon: Clock, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/20" }
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
              <button className="text-xs text-white/40 hover:text-white transition-colors">View All</button>
            </div>
            <div className="space-y-3">
              {[
                { title: "OS Chapter 4 Reading", time: "Overdue", type: "overdue" },
                { title: "Complete DBMS Schema", time: "Today, 5 PM", type: "today" },
                { title: "Apply for Microsoft SWE", time: "Today, 8 PM", type: "today" },
              ].map((task, i) => (
                <div key={i} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                  <div className="w-4 h-4 rounded border border-white/30 group-hover:border-emerald-400 transition-colors"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/90">{task.title}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                    task.type === 'overdue' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-white/10 text-white/60 border border-white/5'
                  }`}>
                    {task.time}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 rounded-3xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20">
             <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-400" /> DSA Progress
              </h3>
              <span className="text-xs font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2 py-1 rounded-md">68% Complete</span>
            </div>
            <div className="mb-4">
              <p className="text-xs text-white/50 mb-1">Current Topic</p>
              <p className="text-sm font-semibold text-white">Sliding Window & Two Pointers</p>
              <div className="w-full h-2 bg-black/40 rounded-full mt-3 overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-[68%] rounded-full shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>
              </div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-3">Recently Solved</p>
              <div className="flex gap-2">
                <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">Longest Substring</span>
                <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">3Sum</span>
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          <section className="p-6 rounded-3xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
              <Briefcase className="w-4 h-4 text-purple-400" /> Internship Pipeline
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "Wishlist", count: 12, color: "text-white/60" },
                { label: "Applied", count: 45, color: "text-blue-400" },
                { label: "OA", count: 4, color: "text-purple-400" },
                { label: "Interview", count: 2, color: "text-amber-400" },
                { label: "Offer", count: 1, color: "text-emerald-400" }
              ].map((stage, i) => (
                <div key={i} className="flex flex-col items-center text-center p-2 rounded-xl bg-black/20 border border-white/5">
                  <span className={`text-xl font-bold ${stage.color} mb-1 drop-shadow-sm`}>{stage.count}</span>
                  <span className="text-[9px] text-white/50 uppercase tracking-wider">{stage.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 rounded-3xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" /> Recent & Revisions
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-white/90 font-medium">Revision Due: DP Tabulation</p>
                  <p className="text-xs text-white/40">From Notes OS • 2 days overdue</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-white/90 font-medium">Completed: React Context API</p>
                  <p className="text-xs text-white/40">Task OS • 2 hours ago</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-white/90 font-medium">New Note: System Design Basics</p>
                  <p className="text-xs text-white/40">Notes OS • 5 hours ago</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default DashboardMain;