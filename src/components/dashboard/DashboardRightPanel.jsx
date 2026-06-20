import React from 'react';
import { Play, Square, Target, Calendar } from 'lucide-react';

const DashboardRightPanel = () => {
  return (
    <div className="h-full w-full flex flex-col gap-6">
      
      {/* SECTION: Active Study Session Widget */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-blue-900/20 to-transparent border border-blue-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full"></div>
        
        <h3 className="text-xs font-bold tracking-wider text-blue-400 uppercase mb-4">Active Session</h3>
        
        <div className="mb-4">
          <p className="text-sm text-white/80 font-medium mb-1">Studying Binary Trees</p>
          <p className="text-xs text-white/40">Goal: Solve 2 medium problems</p>
        </div>

        <div className="text-4xl font-mono text-white tracking-widest font-light mb-6">
          25<span className="text-white/30 animate-pulse">:</span>13
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-white hover:bg-white/90 text-black py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
            <Square className="w-3 h-3 fill-black" /> Pause
          </button>
          <button className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 py-2.5 rounded-xl text-xs font-bold transition-all">
            End
          </button>
        </div>
      </div>

      {/* SECTION: Upcoming Deadlines */}
      <div>
        <h3 className="text-xs font-bold tracking-wider text-white/40 uppercase mb-4">Urgent Deadlines</h3>
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-white/90">Google OA</p>
              <p className="text-[10px] text-white/40">Internship OS</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-orange-500/10 text-orange-400 rounded-lg">2 Days</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-white/90">DBMS Assignment</p>
              <p className="text-[10px] text-white/40">Task OS</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-red-500/10 text-red-400 rounded-lg">5 Hrs</span>
          </div>
        </div>
      </div>

      {/* SECTION: Weekly Goals Progress */}
      <div className="mt-auto pt-6 border-t border-white/[0.05]">
        <h3 className="text-xs font-bold tracking-wider text-white/40 uppercase mb-4">Weekly Targets</h3>
        
        <div className="space-y-4">
          <div>
             <div className="flex justify-between text-xs mb-1">
               <span className="text-white/60">Problems Goal (24/30)</span>
               <span className="text-blue-400 font-bold">80%</span>
             </div>
             <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[80%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
             </div>
          </div>
          <div>
             <div className="flex justify-between text-xs mb-1">
               <span className="text-white/60">Study Hours (32/40)</span>
               <span className="text-purple-400 font-bold">80%</span>
             </div>
             <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[80%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardRightPanel;