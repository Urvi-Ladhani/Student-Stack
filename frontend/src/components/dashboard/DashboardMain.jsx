import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../../config';
import { 
  Flame, Trophy, CheckCircle2, Clock, Code2, 
  Briefcase, Activity, Calendar, AlertCircle, 
  BookOpen, ChevronRight
} from 'lucide-react';

const DashboardMain = ({ userName = "Student" }) => {
  const [tasks, setTasks] = useState([]);
  const [dsaProblems, setDsaProblems] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [dsaTopics, setDsaTopics] = useState([]);
  const [internships, setInternships] = useState([]);
  const [profile, setProfile] = useState(null);
  const [studyStats, setStudyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch all core modules in parallel
      const [tasksRes, dsaRes, rmRes, intRes, profRes, studyStatsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tasks`, { headers }),
        fetch(`${API_BASE_URL}/api/dsa/problems`, { headers }),
        fetch(`${API_BASE_URL}/api/dsa/roadmaps`, { headers }),
        fetch(`${API_BASE_URL}/api/internships`, { headers }),
        fetch(`${API_BASE_URL}/api/auth/profile`, { headers }),
        fetch(`${API_BASE_URL}/api/study-sessions/stats`, { headers })
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (dsaRes.ok) setDsaProblems(await dsaRes.json());
      
      let rms = [];
      if (rmRes.ok) {
        rms = await rmRes.json();
        setRoadmaps(rms);
      }
      if (intRes.ok) setInternships(await intRes.json());
      if (profRes.ok) setProfile(await profRes.json());
      if (studyStatsRes.ok) setStudyStats(await studyStatsRes.json());

      // Secondary fetch: If roadmaps exist and one is active, fetch its topics
      const activeRm = rms.find(r => r.isActive);
      if (activeRm) {
        const topicsRes = await fetch(`${API_BASE_URL}/api/dsa/topics/${activeRm._id}`, { headers });
        if (topicsRes.ok) setDsaTopics(await topicsRes.json());
      } else {
        setDsaTopics([]);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for custom event triggers to refresh dynamically
    window.addEventListener('dashboard-data-updated', fetchDashboardData);
    window.addEventListener('study-session-logged', fetchDashboardData);

    return () => {
      window.removeEventListener('dashboard-data-updated', fetchDashboardData);
      window.removeEventListener('study-session-logged', fetchDashboardData);
    };
  }, []);

  // Timezone-robust helpers using midnight date-parsing and string checks
  const isTaskToday = (deadline) => {
    if (!deadline) return false;
    const deadlineDateStr = deadline.split('T')[0];
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayDateStr = `${y}-${m}-${d}`;
    return deadlineDateStr === todayDateStr;
  };

  const isTaskOverdue = (deadline) => {
    if (!deadline) return false;
    const deadlineDateStr = deadline.split('T')[0];
    const [dy, dm, dd] = deadlineDateStr.split('-').map(Number);
    const today = new Date();
    const todayLocalMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueLocalMidnight = new Date(dy, dm - 1, dd);
    return dueLocalMidnight < todayLocalMidnight;
  };

  // --- RE-CALCULATING DYNAMIC DATA ---
  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'done' && !t.isArchived), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'done'), [tasks]);

  const overdueTasks = useMemo(() => {
    return activeTasks.filter(t => isTaskOverdue(t.deadline));
  }, [activeTasks]);

  const todaysTasks = useMemo(() => {
    return activeTasks
      .filter(t => isTaskToday(t.deadline))
      .sort((a, b) => {
        const p = { critical: 4, high: 3, medium: 2, low: 1 };
        return p[b.priority] - p[a.priority];
      });
  }, [activeTasks]);

  // Greeting Message Parser
  const greetingText = useMemo(() => {
    const hr = new Date().getHours();
    const nameToDisplay = profile?.name || userName || 'Student';
    const firstName = nameToDisplay.trim().split(' ')[0];
    
    if (hr >= 5 && hr < 12) return `Good Morning, ${firstName}`;
    if (hr >= 12 && hr < 17) return `Good Afternoon, ${firstName}`;
    if (hr >= 17 && hr < 21) return `Good Evening, ${firstName}`;
    return `Good Night, ${firstName}`;
  }, [profile, userName]);

  // Today's Focus Directives
  const todaysFocus = useMemo(() => {
    const todayStr = new Date().toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    // 1. Check for scheduled interviews today or tomorrow
    const upcomingInterview = internships.flatMap(i => (i.interviews || []).map(int => ({ ...int, company: i.company, role: i.role })))
      .find(int => int.outcome === 'Scheduled' && (new Date(int.date).toDateString() === todayStr || new Date(int.date).toDateString() === tomorrowStr));

    if (upcomingInterview) {
      const isToday = new Date(upcomingInterview.date).toDateString() === todayStr;
      const timeStr = new Date(upcomingInterview.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      return {
        text: `Interview ${isToday ? 'Today' : 'Tomorrow'} at ${timeStr} with ${upcomingInterview.company} (${upcomingInterview.role})`,
        icon: Briefcase
      };
    }

    // 2. Check for tasks due today
    if (todaysTasks.length > 0) {
      return {
        text: `You have ${todaysTasks.length} task${todaysTasks.length > 1 ? 's' : ''} due today.`,
        icon: CheckCircle2
      };
    }

    // 3. Check for incomplete roadmap (strictly active roadmaps only)
    const activeRm = roadmaps.find(r => r.isActive);
    if (activeRm) {
      const totalProblems = dsaProblems.filter(p => p.topicId && dsaTopics.some(t => t._id === p.topicId)).length;
      const solvedProblems = dsaProblems.filter(p => p.status === 'solved' && p.topicId && dsaTopics.some(t => t._id === p.topicId)).length;
      const pct = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;
      
      if (pct < 100) {
        return {
          text: `Complete your "${activeRm.name}" roadmap.`,
          icon: Code2
        };
      }
    }

    return {
      text: "No pending work today",
      icon: Trophy
    };
  }, [internships, todaysTasks, roadmaps, dsaProblems, dsaTopics]);

  // Statistics Calculation
  const statsMetrics = useMemo(() => {
    const streakDays = studyStats?.studyStreak ?? profile?.stats?.studyStreak ?? 0;
    const dsaSolvedCount = dsaProblems.filter(p => p.status === 'solved').length;
    
    // Tasks completed today
    const todayStr = new Date().toDateString();
    const tasksDoneToday = completedTasks.filter(t => t.updatedAt && new Date(t.updatedAt).toDateString() === todayStr).length;

    const studyHoursToday = studyStats?.todaysHours ?? '0.0';

    return {
      streak: `${streakDays} Day${streakDays !== 1 ? 's' : ''}`,
      dsaSolved: dsaSolvedCount,
      tasksDone: tasksDoneToday,
      studyHours: `${studyHoursToday}h`
    };
  }, [profile, dsaProblems, completedTasks, studyStats]);

  // Task Timeline format helper
  const getFormattedTime = (task) => {
    const d = new Date(task.deadline);
    if (d.getHours() === 0 && d.getMinutes() === 0) {
      if (task.priority === 'critical') return '09:00';
      if (task.priority === 'high') return '13:00';
      if (task.priority === 'medium') return '16:00';
      return '19:00';
    }
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const timelineTasks = useMemo(() => {
    return [...todaysTasks].sort((a, b) => {
      return getFormattedTime(a).localeCompare(getFormattedTime(b));
    });
  }, [todaysTasks]);

  // DSA Roadmap Widget details (only if active)
  const dsaProgressData = useMemo(() => {
    if (roadmaps.length === 0) return null;
    const activeRm = roadmaps.find(r => r.isActive);
    if (!activeRm) return null; // Only render if user actively selected/started a roadmap!
    
    const completedTopicsCount = dsaTopics.filter(t => t.status === 'completed').length;
    const totalTopicsCount = dsaTopics.length;
    const topicPct = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;
    const solvedProblemsCount = dsaProblems.filter(p => p.status === 'solved' && p.topicId && dsaTopics.some(t => t._id === p.topicId)).length;
    const currentTopic = dsaTopics.find(t => t.status === 'in_progress') || dsaTopics.find(t => t.status === 'not_started') || { name: 'Done! 🎉' };

    return {
      roadmapName: activeRm.name,
      completedTopics: completedTopicsCount,
      totalTopics: totalTopicsCount,
      problemsSolved: solvedProblemsCount,
      percentage: topicPct,
      currentTopicName: currentTopic.name
    };
  }, [roadmaps, dsaTopics, dsaProblems]);

  // Active internship applications stats (hides if zero records)
  const internshipStats = useMemo(() => {
    if (internships.length === 0) return null;
    
    const inProgress = internships.filter(i => ['applied', 'oa', 'interview'].includes(i.status)).length;
    const interviewsCount = internships.filter(i => i.status === 'interview').length;
    const oasCount = internships.filter(i => i.status === 'oa').length;
    const offersCount = internships.filter(i => i.status === 'offer').length;

    return {
      inProgress,
      interviewsCount,
      oasCount,
      offersCount
    };
  }, [internships]);

  // Combined live activity timeline
  const recentActivities = useMemo(() => {
    const activities = [];
    
    dsaProblems.filter(p => p.status === 'solved').forEach(p => {
      activities.push({
        id: `dsa-${p._id}`,
        icon: Code2,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        text: `Solved "${p.title}"`,
        desc: p.platform,
        date: new Date(p.solvedAt || p.updatedAt)
      });
    });

    tasks.filter(t => t.status === 'done').forEach(t => {
      activities.push({
        id: `task-${t._id}`,
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        text: `Completed "${t.title}"`,
        desc: t.category,
        date: new Date(t.updatedAt)
      });
    });

    if (profile?.studySessions) {
      profile.studySessions.forEach((s, idx) => {
        activities.push({
          id: `study-${idx}`,
          icon: Clock,
          color: 'text-purple-400',
          bg: 'bg-purple-500/10',
          text: `Finished Focus Session`,
          desc: `${s.minutes} minutes logged`,
          date: new Date(s.date)
        });
      });
    }

    internships.forEach(i => {
      activities.push({
        id: `intern-${i._id}`,
        icon: Briefcase,
        color: 'text-pink-400',
        bg: 'bg-pink-500/10',
        text: `Applied to ${i.company}`,
        desc: i.role,
        date: new Date(i.appliedAt || i.createdAt)
      });
    });

    return activities
      .sort((a, b) => b.date - a.date)
      .slice(0, 4);
  }, [tasks, dsaProblems, internships, profile]);

  // Loading Skeletons
  if (loading) {
    return (
      <div className="w-full space-y-6 pb-12 animate-pulse">
        <div className="sticky top-0 z-20 pt-3 pb-3 px-5 -mx-5 mb-6 light-glass rounded-b-2xl h-20 flex flex-col justify-center gap-2">
          <div className="w-40 h-5 bg-white/10 rounded-lg"></div>
          <div className="w-56 h-3 bg-white/5 rounded-lg"></div>
        </div>
        <div className="space-y-3">
          <div className="w-20 h-3.5 bg-white/5 rounded-lg"></div>
          <div className="w-full h-20 bg-white/5 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl light-glass flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-xl"></div>
              <div className="w-12 h-4 bg-white/10 rounded-md"></div>
              <div className="w-16 h-2.5 bg-white/5 rounded-md"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-56 bg-white/5 rounded-2xl"></div>
          <div className="h-56 bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const FocusIcon = todaysFocus.icon;

  const formatActivityDate = (date) => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();
    if (isToday) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' + 
           date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full space-y-6 pb-12">
      
      {/* SECTION 1: Daily Brief Header */}
      <div className="sticky top-0 z-20 pt-3 pb-3 px-5 -mx-5 mb-6 light-glass rounded-none rounded-b-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1 drop-shadow-md">
          {greetingText}
        </h1>
        <div className="flex items-center gap-3.5 text-xs font-medium">
          <span className="text-white/50">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <span className="w-1 h-1 rounded-full bg-white/10"></span>
          <div className="flex gap-2.5 text-blue-300/80 drop-shadow-sm">
            <span>{todaysTasks.length} tasks due today</span>
            <span className="text-white/10">•</span>
            <span className={overdueTasks.length > 0 ? "text-rose-400 font-semibold" : "text-white/30"}>{overdueTasks.length} overdue</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Today's Focus Card */}
      <section>
        <h2 className="text-[10px] font-bold text-white/40 tracking-wider uppercase mb-2.5 drop-shadow-sm">Today's Focus</h2>
        <div className="p-4.5 rounded-2xl light-glass hover-lift-scale shadow-lg flex items-center gap-4 border border-white/5">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-blue-400 shrink-0 shadow-inner">
            <FocusIcon className="w-5 h-5 drop-shadow-md" />
          </div>
          <div>
            <h3 className="text-white/90 font-bold text-sm mb-0.5">Priority Directive</h3>
            <p className="text-xs text-white/70 font-medium leading-relaxed">{todaysFocus.text}</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Streak & Momentum */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Study Streak", value: statsMetrics.streak, icon: Flame, path: '/study-sessions' },
          { label: "DSA Solved", value: statsMetrics.dsaSolved, icon: Code2, path: '/dsa' },
          { label: "Tasks Done", value: statsMetrics.tasksDone, icon: CheckCircle2, path: '/tasks' },
          { label: "Study Hours", value: statsMetrics.studyHours, icon: Clock, path: '/study-sessions' }
        ].map((stat, i) => {
          const StatIcon = stat.icon;
          return (
            <div 
              key={i} 
              onClick={() => window.location.href = stat.path}
              className="p-4 flex flex-col justify-center items-center text-center shadow-lg light-glass border border-white/5 hover:border-blue-500/20 hover-lift-scale cursor-pointer transition-all"
            >
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-blue-400 mb-2.5 shadow-inner">
                <StatIcon className="w-4 h-4 drop-shadow-sm" />
              </div>
              <h4 className="text-xl font-bold text-white mb-0.5 drop-shadow-sm">{stat.value}</h4>
              <p className="text-[9px] text-white/40 font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          );
        })}
      </section>

      {/* SECTION 4: Timeline & DSA Progress (Side-by-Side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tasks Timeline Widget */}
        <section className="p-5 light-glass hover-lift-scale shadow-xl flex flex-col min-h-[260px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-white/95 flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Tasks Timeline
            </h3>
          </div>
          <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {timelineTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <p className="text-white/30 text-xs italic">Nothing scheduled today.</p>
              </div>
            ) : (
              timelineTasks.map((task) => {
                const isOverdue = isTaskOverdue(task.deadline);
                const time = getFormattedTime(task);
                return (
                  <div key={task._id} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-default">
                    <span className="text-xs font-bold font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)] shrink-0 w-12">{time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/95 truncate">{task.title}</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isOverdue ? 'bg-red-500/20 text-red-300 border border-red-500/20' : 'bg-white/10 text-white/60'
                    }`}>
                      {isOverdue ? 'Overdue' : 'Today'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* DSA Progress Widget */}
        <section className="p-5 light-glass hover-lift-scale shadow-xl flex flex-col min-h-[260px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-white/95 flex items-center gap-2 uppercase tracking-wider">
              <Code2 className="w-3.5 h-3.5 text-blue-400" /> DSA Progress
            </h3>
          </div>
          
          {dsaProgressData ? (
            <div className="space-y-3.5 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Current Roadmap</h4>
                <p className="text-sm font-bold text-white mb-1.5">{dsaProgressData.roadmapName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 my-1">
                <div className="p-2.5 bg-white/5 rounded-xl text-center">
                  <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Topics Completed</p>
                  <p className="text-xs font-extrabold text-blue-300">{dsaProgressData.completedTopics} / {dsaProgressData.totalTopics}</p>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl text-center">
                  <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Problems Solved</p>
                  <p className="text-xs font-extrabold text-emerald-300">{dsaProgressData.problemsSolved} Solved</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1 font-medium">
                  <span className="text-white/50">Overall Completion</span>
                  <span className="text-blue-400 font-bold">{dsaProgressData.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)] transition-all duration-1000"
                    style={{ width: `${dsaProgressData.percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-1.5">
                <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block mb-0.5">Active Study Topic</span>
                <p className="text-xs font-semibold text-white/90 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  {dsaProgressData.currentTopicName}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-white/30 text-xs italic">
              <span>No active roadmap.</span>
              <span className="text-[10px] text-white/20 mt-1">Activate a roadmap in DSA OS to track your progress here.</span>
            </div>
          )}
        </section>

      </div>

      {/* SECTION 5: Active Applications (Full Width) */}
      {internshipStats && (
        <section className="p-5 light-glass hover-lift-scale shadow-xl w-full">
          <h3 className="text-xs font-semibold text-white/95 flex items-center gap-2 mb-4 uppercase tracking-wider">
            <Briefcase className="w-3.5 h-3.5 text-purple-400" /> Active Applications
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <span className="text-lg font-bold text-blue-400 mb-0.5 drop-shadow-sm">{internshipStats.inProgress}</span>
              <span className="text-[8px] text-white/45 uppercase tracking-wider font-semibold">In Progress</span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <span className="text-lg font-bold text-orange-400 mb-0.5 drop-shadow-sm">{internshipStats.oasCount}</span>
              <span className="text-[8px] text-white/45 uppercase tracking-wider font-semibold">Pending OA</span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <span className="text-lg font-bold text-purple-400 mb-0.5 drop-shadow-sm">{internshipStats.interviewsCount}</span>
              <span className="text-[8px] text-white/45 uppercase tracking-wider font-semibold">Interviews</span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <span className="text-lg font-bold text-emerald-400 mb-0.5 drop-shadow-sm">{internshipStats.offersCount}</span>
              <span className="text-[8px] text-white/45 uppercase tracking-wider font-semibold">Offers</span>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6: Recent Activity Timeline Widget (Full Width) */}
      <section className="p-5 light-glass hover-lift-scale shadow-xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-semibold text-white/95 flex items-center gap-2 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-orange-400" /> Recent Activity
          </h3>
        </div>
        
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-white/40 text-xs text-center py-6">No recent activity.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {recentActivities.map(act => {
                const ActIcon = act.icon;
                return (
                  <div key={act.id} className="flex gap-2.5 items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div className={`w-7.5 h-7.5 rounded-full ${act.bg} flex items-center justify-center shrink-0`}>
                      <ActIcon className={`w-3.5 h-3.5 ${act.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white/90 font-medium truncate">{act.text}</p>
                      <p className="text-[10px] text-white/40">{act.desc}</p>
                    </div>
                    <span className="text-[9px] text-white/30 font-medium font-mono shrink-0">
                      {formatActivityDate(act.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardMain;