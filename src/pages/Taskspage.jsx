import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import TaskRightPanel from '../components/tasks/TaskRightPanel';
import { 
  Plus, LayoutList, Kanban, CalendarDays, Filter, 
  ArrowDownUp, AlertTriangle, Clock, Tag, MoreHorizontal, Play
} from 'lucide-react';

// ==========================================
// 1. DATA LAYER (Embedded custom hook)
// ==========================================
const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    // Optimistic UI update: instantly change it on screen so it feels blazing fast
    setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update task');
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert if the server fails
      fetchTasks(); 
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return { tasks, loading, updateTaskStatus, refreshTasks: fetchTasks };
};

// ==========================================
// 2. UI COMPONENTS (Glassmorphic)
// ==========================================
const PriorityBadge = ({ priority }) => {
  const colors = {
    critical: "bg-red-500/20 text-red-300 border-red-500/30",
    high: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    low: "bg-white/10 text-white/60 border-white/10"
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const TaskCard = ({ task, onStatusChange }) => {
  const deadline = new Date(task.deadline);
  const isOverdue = deadline < new Date() && task.status !== 'done';

  return (
    <div className="p-4 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-xl shadow-black/20 hover:border-white/20 hover:bg-black/30 transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-3">
        <PriorityBadge priority={task.priority} />
        <button className="text-white/30 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      <h4 className="text-white font-medium text-sm mb-2 drop-shadow-sm">{task.title}</h4>
      
      <div className="flex items-center gap-3 text-xs text-white/40 mb-4">
        <span className="flex items-center gap-1">
          <Tag className="w-3 h-3" /> {task.category}
        </span>
        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]' : ''}`}>
          <Clock className="w-3 h-3" /> 
          {isOverdue ? 'Overdue' : 'Due ' + deadline.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="pt-3 border-t border-white/10 flex justify-between items-center">
        <select 
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="bg-black/40 text-white/70 text-[10px] uppercase font-bold px-2 py-1 rounded border border-white/10 outline-none cursor-pointer"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </select>
        
        {task.status !== 'done' && (
          <button className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded transition-colors border border-emerald-500/20">
            <Play className="w-3 h-3" /> Session
          </button>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN PAGE COMPONENT
// ==========================================
const Taskspage = () => {
  const [view, setView] = useState('board');
  const { tasks, loading, updateTaskStatus } = useTasks();

  const overdueCount = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'done').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white font-mono mt-10 text-center animate-pulse p-4 bg-black/20 border border-white/10 rounded-xl backdrop-blur-md">
            Loading OS Data...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout rightPanelContent={<TaskRightPanel tasks={tasks} />}>
      <div className="w-full flex flex-col h-full min-h-screen">
        
        {/* COMMAND BOARD */}
        <div className="sticky top-0 z-30 bg-black/20 backdrop-blur-2xl px-6 py-4 -mx-6 border-b border-white/10 shadow-lg shadow-black/20 rounded-b-2xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 shadow-inner">
              {[
                { id: 'list', icon: LayoutList, label: 'List' },
                { id: 'board', icon: Kanban, label: 'Board' },
                { id: 'timeline', icon: CalendarDays, label: 'Timeline' }
              ].map(v => (
                <button 
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    view === v.id ? 'bg-white/10 text-white shadow border border-white/5' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  <v.icon className="w-4 h-4" /> {v.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>
          </div>
        </div>

        {/* OVERDUE ALERT BAND */}
        {overdueCount > 0 && (
          <div className="mb-6 w-full p-3 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-xl flex items-center justify-between cursor-pointer hover:bg-red-500/30 transition-colors shadow-lg shadow-red-900/20">
            <div className="flex items-center gap-3 text-red-300">
              <AlertTriangle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
              <span className="text-sm font-bold tracking-wide">You have {overdueCount} overdue {overdueCount === 1 ? 'task' : 'tasks'}</span>
            </div>
          </div>
        )}

        {/* MAIN WORKSPACE: BOARD VIEW */}
        {view === 'board' && (
          <div className="flex-1 flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
            {['todo', 'in_progress', 'blocked', 'done'].map(status => (
              <div key={status} className="flex-1 min-w-[300px] flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider drop-shadow-sm">
                    {status.replace('_', ' ')}
                  </h3>
                  <span className="w-6 h-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-xs text-white/60 font-mono shadow-inner">
                    {tasks.filter(t => t.status === status).length}
                  </span>
                </div>
                
                <div className="flex-1 rounded-2xl bg-black/10 border border-white/5 p-3 flex flex-col gap-3 min-h-[500px]">
                  {tasks.filter(t => t.status === status).map(task => (
                    <TaskCard key={task._id} task={task} onStatusChange={updateTaskStatus} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Taskspage;