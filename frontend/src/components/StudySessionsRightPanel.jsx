import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { 
  BarChart2, Clock, Zap, CheckCircle2, Award, Calendar, Layers
} from 'lucide-react';

const StudySessionsRightPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`${API_BASE_URL}/api/study-sessions/stats`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error loading study sessions stats in right panel:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Listen to study session updates to sync stats instantly
    const handleUpdate = () => {
      fetchStats();
    };

    window.addEventListener('study-session-logged', handleUpdate);
    window.addEventListener('dashboard-data-updated', handleUpdate);

    return () => {
      window.removeEventListener('study-session-logged', handleUpdate);
      window.removeEventListener('dashboard-data-updated', handleUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="h-6 bg-white/5 rounded w-1/2"></div>
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded-xl"></div>
          <div className="h-16 bg-white/5 rounded-xl"></div>
          <div className="h-16 bg-white/5 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 font-sans text-slate-100">
      
      {/* Title */}
      <div>
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2 mb-1">
          <BarChart2 className="w-4 h-4 text-blue-400" /> Focus Analytics
        </h3>
        <p className="text-[11px] text-white/40">Real-time statistics of your learning blocks.</p>
      </div>

      {/* Grid of Stats Cards */}
      <div className="flex flex-col gap-3">
        
        {/* Today's Hours */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner hover:bg-white/[0.04] transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Today's Hours</p>
            <p className="text-lg font-extrabold text-white mt-0.5">{stats?.todaysHours || '0.0'}h</p>
          </div>
        </div>

        {/* Weekly Hours */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner hover:bg-white/[0.04] transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">This Week</p>
            <p className="text-lg font-extrabold text-white mt-0.5">{stats?.weeklyHours || '0.0'}h</p>
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner hover:bg-white/[0.04] transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Current Streak</p>
            <p className="text-lg font-extrabold text-white mt-0.5">{stats?.studyStreak || 0} Days</p>
          </div>
        </div>

        {/* Completed Sessions */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner hover:bg-white/[0.04] transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Completed Sessions</p>
            <p className="text-lg font-extrabold text-white mt-0.5">{stats?.sessionsCompleted || 0}</p>
          </div>
        </div>

        {/* Average Session Duration */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner hover:bg-white/[0.04] transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Average Duration</p>
            <p className="text-lg font-extrabold text-white mt-0.5">{stats?.averageSessionLengthMinutes || 0}m</p>
          </div>
        </div>

        {/* Most Studied Module */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner hover:bg-white/[0.04] transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Most Studied Module</p>
            <p className="text-sm font-extrabold text-white mt-0.5 truncate max-w-[180px]">{stats?.mostStudiedModule || 'None'}</p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default StudySessionsRightPanel;
