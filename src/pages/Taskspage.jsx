import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import TaskRightPanel from '../components/tasks/TaskRightPanel';
import { 
  Plus, LayoutList, Kanban, CalendarDays, Filter, 
  ArrowDownUp, AlertTriangle, Clock, Tag, MoreHorizontal, Play, X, ChevronLeft, ChevronRight
} from 'lucide-react';

// ==========================================
// 1. DATA LAYER
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

  const addTask = async (taskData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) throw new Error('Failed to create task');
      fetchTasks();
      return true;
    } catch (error) {
      console.error("Error creating task:", error);
      return false;
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    // Optimistic UI update for immediate snapping
    setTasks(prevTasks => prevTasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    
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
      fetchTasks(); // Revert on failure
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  return { tasks, loading, addTask, updateTaskStatus, refreshTasks: fetchTasks };
};

// ==========================================
// 2. ADD TASK MODAL
// ==========================================
const AddTaskModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    title: '', category: 'Academic', priority: 'medium', deadline: '', estimatedMinutes: 30
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onAdd(formData);
    if (success) {
      setFormData({ title: '', category: 'Academic', priority: 'medium', deadline: '', estimatedMinutes: 30 });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-black/40 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white drop-shadow-sm">Create New Task</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Task Title</label>
            <input 
              type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:border-blue-500/50 outline-none transition-all"
              placeholder="e.g., Master Sliding Window..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all cursor-pointer">
                <option value="Academic">Academic</option>
                <option value="DSA">DSA</option>
                <option value="Internship">Internship</option>
                <option value="Personal">Personal</option>
                <option value="Project">Project</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all cursor-pointer">
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Deadline</label>
              <input type="date" required value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all cursor-pointer [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Est. Minutes</label>
              <input type="number" min="5" value={formData.estimatedMinutes} onChange={(e) => setFormData({...formData, estimatedMinutes: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all" />
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-white/10 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 font-semibold hover:bg-white/10 hover:text-white transition-all border border-transparent">Cancel</button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 hover:bg-blue-500/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. UI COMPONENTS 
// ==========================================
const PriorityBadge = ({ priority }) => {
  const colors = {
    critical: "bg-red-500/20 text-red-300 border-red-500/30",
    high: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    low: "bg-white/10 text-white/60 border-white/10"
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[priority]}`}>{priority}</span>;
};

// ==========================================
// 4. MAIN PAGE COMPONENT
// ==========================================
const Taskspage = () => {
  const [view, setView] = useState('board');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { tasks, loading, addTask, updateTaskStatus } = useTasks();
  
  // DRAG AND DROP STATE
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // CALENDAR STATE
  const [currentDate, setCurrentDate] = useState(new Date());

  const overdueCount = tasks.filter(t => {
    const d = new Date(t.deadline);
    d.setHours(23, 59, 59, 999);
    return d < new Date() && t.status !== 'done';
  }).length;

  const handleStartSession = (task) => {
    if (task.status === 'todo') updateTaskStatus(task._id, 'in_progress');
    alert(`Starting Study Session for: ${task.title}`);
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    // Required for Firefox
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId); 
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedTaskId) {
      // Find the task to see if it actually changed status
      const task = tasks.find(t => t._id === draggedTaskId);
      if (task && task.status !== newStatus) {
        updateTaskStatus(draggedTaskId, newStatus);
      }
    }
    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

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
                { id: 'calendar', icon: CalendarDays, label: 'Calendar' }
              ].map(v => (
                <button 
                  key={v.id} onClick={() => setView(v.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === v.id ? 'bg-white/10 text-white shadow border border-white/5' : 'text-white/40 hover:text-white/80'}`}
                >
                  <v.icon className="w-4 h-4" /> {v.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>
          </div>
        </div>

        {/* OVERDUE ALERT BAND */}
        {overdueCount > 0 && (
          <div className="mb-6 w-full p-3 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-xl flex items-center justify-between shadow-lg shadow-red-900/20">
            <div className="flex items-center gap-3 text-red-300">
              <AlertTriangle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
              <span className="text-sm font-bold tracking-wide">You have {overdueCount} overdue {overdueCount === 1 ? 'task' : 'tasks'}</span>
            </div>
          </div>
        )}

        {/* WORKSPACE: LIST VIEW */}
        {view === 'list' && (
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-8 scrollbar-hide">
            {tasks.length === 0 && <div className="text-center text-white/40 mt-10">No tasks found. Add one above!</div>}
            {tasks.map(task => (
              <div key={task._id} className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl shadow-lg hover:bg-black/30 transition-all group">
                <div className="flex items-center gap-5">
                  <select value={task.status} onChange={(e) => updateTaskStatus(task._id, e.target.value)} className="bg-black/40 text-white/70 text-[10px] uppercase font-bold px-2 py-1.5 rounded border border-white/10 outline-none cursor-pointer">
                    <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option>
                  </select>
                  <div>
                    <h4 className={`text-sm font-medium ${task.status === 'done' ? 'text-white/40 line-through' : 'text-white'}`}>{task.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-white/40 mt-1.5">
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {task.category}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(task.deadline).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WORKSPACE: BOARD VIEW (NOW WITH DRAG AND DROP) */}
        {view === 'board' && (
          <div className="flex-1 flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
            {['todo', 'in_progress', 'done'].map(status => (
              <div 
                key={status} 
                className="flex-1 min-w-[300px] flex flex-col gap-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider drop-shadow-sm">{status.replace('_', ' ')}</h3>
                  <span className="w-6 h-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-xs text-white/60 font-mono shadow-inner">
                    {tasks.filter(t => t.status === status).length}
                  </span>
                </div>
                
                {/* DROP ZONE */}
                <div 
                  className={`flex-1 rounded-2xl p-3 flex flex-col gap-3 min-h-[500px] transition-all duration-200 ${
                    draggedTaskId ? 'bg-black/20 border border-white/10 border-dashed' : 'bg-black/10 border border-white/5'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  {tasks.filter(t => t.status === status).map(task => (
                    <div 
                      key={task._id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      onDragEnd={handleDragEnd}
                      className={`p-4 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-xl hover:border-white/30 transition-all cursor-grab active:cursor-grabbing ${
                        draggedTaskId === task._id ? 'opacity-50 scale-95 shadow-none' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3"><PriorityBadge priority={task.priority} /></div>
                      <h4 className={`font-medium text-sm mb-2 ${task.status === 'done' ? 'text-white/50 line-through' : 'text-white'}`}>{task.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-white/40 mb-4"><span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {task.category}</span></div>
                      <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                        <select 
                          value={task.status} 
                          onChange={(e) => updateTaskStatus(task._id, e.target.value)} 
                          className="bg-black/40 text-white/70 text-[10px] uppercase font-bold px-2 py-1 rounded border border-white/10 outline-none cursor-pointer"
                          onClick={(e) => e.stopPropagation()} // Prevents dragging when clicking dropdown
                        >
                          <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option>
                        </select>
                        {task.status !== 'done' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStartSession(task); }} 
                            className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded transition-colors border border-emerald-500/20"
                          >
                            <Play className="w-3 h-3" /> Session
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Empty state hint */}
                  {tasks.filter(t => t.status === status).length === 0 && (
                     <div className="w-full h-full flex flex-col items-center justify-center text-white/20 text-xs uppercase tracking-widest font-bold mt-10">
                       {draggedTaskId ? 'Drop Here' : 'Empty'}
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WORKSPACE: FULL GRID CALENDAR VIEW */}
        {view === 'calendar' && (
          <div className="flex-1 flex flex-col bg-black/20 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl p-6 overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white drop-shadow-md">
                  {monthNames[month]} {year}
                </h2>
                <button onClick={goToToday} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold">
                  Today
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 rounded-xl bg-black/40 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors shadow-inner">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextMonth} className="p-2 rounded-xl bg-black/40 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors shadow-inner">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-4 mb-4">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-bold uppercase tracking-wider text-white/40">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-3 flex-1 auto-rows-fr">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-[100px] rounded-xl bg-black/10 border border-white/5 opacity-50"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNumber = i + 1;
                const isToday = new Date().getDate() === dayNumber && new Date().getMonth() === month && new Date().getFullYear() === year;
                const dayTasks = tasks.filter(t => {
                  const d = new Date(t.deadline);
                  return d.getDate() === dayNumber && d.getMonth() === month && d.getFullYear() === year;
                });

                return (
                  <div key={`day-${dayNumber}`} className={`min-h-[120px] rounded-xl p-2 border transition-all ${
                    isToday ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-black/30 border-white/5 hover:border-white/20'
                  }`}>
                    <div className="flex justify-end mb-1">
                      <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                        isToday ? 'bg-blue-500 text-white shadow-md' : 'text-white/60'
                      }`}>
                        {dayNumber}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[80px] scrollbar-hide">
                      {dayTasks.map(task => (
                        <div key={task._id} className={`px-2 py-1.5 rounded-md border text-[10px] leading-tight font-medium truncate shadow-sm transition-colors cursor-pointer ${
                          task.status === 'done' 
                            ? 'bg-black/40 border-white/5 text-white/30 line-through' 
                            : task.priority === 'critical' ? 'bg-red-500/20 border-red-500/30 text-red-200'
                            : task.priority === 'high' ? 'bg-amber-500/20 border-amber-500/30 text-amber-200'
                            : 'bg-white/10 border-white/10 text-white/80'
                        }`}>
                          {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AddTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={addTask} />
    </DashboardLayout>
  );
};

export default Taskspage;