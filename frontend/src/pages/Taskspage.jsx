import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import TaskRightPanel from '../components/tasks/TaskRightpanel';
import { API_BASE_URL } from '../config';
import { 
  Plus, LayoutList, Kanban, CalendarDays, AlertTriangle, 
  Clock, Tag, MoreHorizontal, Play, X, ChevronLeft, ChevronRight,
  Edit2, Copy, Trash2, Archive, CheckSquare, CheckCircle2, RotateCcw,
  Search, Filter as FilterIcon, ArrowDownUp, ChevronDown, Sun, Loader2
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
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const execute = async (url, method, body = null) => {
    try {
      const token = localStorage.getItem('token');
      const options = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
      if (body) options.body = JSON.stringify(body);
      
      const res = await fetch(`${API_BASE_URL}/api/tasks${url}`, options);
      if (res.ok) { 
        fetchTasks(); 
        window.dispatchEvent(new Event('dashboard-data-updated'));
        return true; 
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Backend Error: ${errData.message || res.statusText}`);
        return false;
      }
    } catch (error) {
      console.error("Action error:", error);
      alert("Network Error: Could not reach the server.");
      return false;
    }
  };

  // Fixed: Wait for backend BEFORE closing modal. No fake optimistic UI here.
  const addTask = async (taskData) => await execute('', 'POST', taskData);
  const editTask = async (id, taskData) => await execute(`/${id}`, 'PATCH', taskData);
  
  const archiveTask = async (id) => execute(`/${id}`, 'PATCH', { isArchived: true });
  const unarchiveTask = async (id) => execute(`/${id}`, 'PATCH', { isArchived: false });
  const duplicateTask = async (task) => {
    const { _id, createdAt, updatedAt, status, ...copyData } = task;
    return execute('', 'POST', { ...copyData, title: `${task.title} (Copy)`, status: 'todo' });
  };
  
  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t._id !== id));
    execute(`/${id}`, 'DELETE');
  };
  const bulkDelete = async (ids) => {
    setTasks(prev => prev.filter(t => !ids.includes(t._id)));
    execute('/bulk-delete', 'POST', { taskIds: ids }); 
  };
  
  const bulkComplete = async (ids) => execute('/bulk-complete', 'POST', { taskIds: ids });

  const updateTaskStatus = async (taskId, newStatus) => {
    setTasks(prevTasks => prevTasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update task');
      window.dispatchEvent(new Event('dashboard-data-updated'));
    } catch (error) {
      console.error("Error updating status:", error);
      fetchTasks();
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  return { tasks, loading, addTask, editTask, deleteTask, archiveTask, unarchiveTask, duplicateTask, bulkComplete, bulkDelete, updateTaskStatus, refreshTasks: fetchTasks };
};

// ==========================================
// 2. UNIVERSAL GLASS DROPDOWN
// ==========================================
const GlassDropdown = ({ value, options, onChange, icon: Icon, fullWidth = false, variant = "default" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeOption = options.find(o => o.value === value) || options[0];

  const buttonStyles = {
    default: "bg-black/40 border border-white/10 text-white/70 hover:text-white hover:bg-black/60",
    modal: "bg-black/40 border border-white/10 text-white hover:border-blue-500/50",
    status: "bg-black/40 border border-white/10 text-white/70 hover:text-white hover:bg-black/60 font-bold uppercase tracking-wider text-[10px]"
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <button type="button" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs transition-all outline-none ${buttonStyles[variant]} ${fullWidth ? 'w-full' : ''}`}>
        <div className="flex items-center gap-2">{Icon && <Icon className="w-3.5 h-3.5" />}{activeOption.label}</div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>
          <div className="absolute left-0 top-full mt-1 min-w-[120px] w-full bg-black/80 backdrop-blur-3xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 py-1 animate-in fade-in slide-in-from-top-1">
            {options.map(opt => (
              <button key={opt.value} type="button" onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${value === opt.value ? 'bg-blue-500/20 text-blue-300' : 'text-white/70 hover:bg-white/10 hover:text-white'} ${variant === 'status' ? 'uppercase text-[10px] tracking-wider' : ''}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// 3. REUSABLE TASK MODAL
// ==========================================
const TaskModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    title: '', category: 'Academic', priority: 'medium', deadline: '', estimatedMinutes: 30
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [{ value: 'Academic', label: 'Academic' }, { value: 'DSA', label: 'DSA' }, { value: 'Internship', label: 'Internship' }, { value: 'Personal', label: 'Personal' }, { value: 'Project', label: 'Project' }];
  const priorities = [{ value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }];

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '' });
    } else {
      setFormData({ title: '', category: 'Academic', priority: 'medium', deadline: '', estimatedMinutes: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      estimatedMinutes: Number(formData.estimatedMinutes) || 30
    };

    const success = await onSave(payload);
    setIsSubmitting(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md strong-glass p-7 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white drop-shadow-sm">{initialData ? 'Edit Task' : 'Create New Task'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Task Title</label>
            <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full glass-input px-4 py-3 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Category</label>
              <GlassDropdown fullWidth variant="modal" value={formData.category} options={categories} onChange={(v) => setFormData({...formData, category: v})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Priority</label>
              <GlassDropdown fullWidth variant="modal" value={formData.priority} options={priorities} onChange={(v) => setFormData({...formData, priority: v})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Deadline</label>
              <input type="date" required value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} className="w-full glass-input px-4 py-3 text-sm cursor-pointer [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Est. Minutes</label>
              <input type="number" min="5" value={formData.estimatedMinutes} onChange={(e) => setFormData({...formData, estimatedMinutes: e.target.value})} placeholder="30" className="w-full glass-input px-4 py-3 text-sm" />
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-white/5 flex gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 glass-btn-secondary text-sm disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 glass-btn-primary text-sm disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PriorityBadge = ({ priority }) => {
  const colors = { critical: "bg-red-500/20 text-red-300 border-red-500/30", high: "bg-amber-500/20 text-amber-300 border-amber-500/30", medium: "bg-blue-500/20 text-blue-300 border-blue-500/30", low: "bg-white/10 text-white/60 border-white/10" };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[priority]}`}>{priority}</span>;
};

// ==========================================
// 4. MAIN PAGE COMPONENT
// ==========================================
const Taskspage = () => {
  const { tasks, loading, addTask, editTask, deleteTask, archiveTask, unarchiveTask, duplicateTask, bulkComplete, bulkDelete, updateTaskStatus } = useTasks();
  
  const [view, setView] = useState('board');
  const [modalState, setModalState] = useState({ isOpen: false, data: null });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('deadline-asc');

  // Helpers
  const isTaskOverdue = (task) => {
    if (!task.deadline) return false;
    const d = new Date(task.deadline);
    if (isNaN(d.getTime())) return false;
    d.setHours(23, 59, 59, 999);
    return d < new Date() && task.status !== 'done';
  };

  const isTaskToday = (task) => {
    if (!task.deadline) return false;
    const d = new Date(task.deadline);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  // Processing
  const processedTasks = useMemo(() => {
    let result = tasks.filter(t => !t.isArchived);

    if (searchQuery) result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (categoryFilter !== 'All') result = result.filter(t => t.category === categoryFilter);
    
    result.sort((a, b) => {
      if (sortBy === 'deadline-asc') return new Date(a.deadline) - new Date(b.deadline);
      if (sortBy === 'deadline-desc') return new Date(b.deadline) - new Date(a.deadline);
      if (sortBy === 'priority') {
        const p = { critical: 4, high: 3, medium: 2, low: 1 };
        return p[b.priority] - p[a.priority];
      }
      return 0;
    });
    
    return result;
  }, [tasks, searchQuery, categoryFilter, sortBy]);

  const activeTasks = processedTasks.filter(t => !isTaskOverdue(t));
  const overdueTasks = processedTasks.filter(isTaskOverdue);
  const archivedTasks = tasks.filter(t => t.isArchived);
  
  const todaysTasks = processedTasks.filter(t => isTaskToday(t) && t.status !== 'done').sort((a, b) => {
    const p = { critical: 4, high: 3, medium: 2, low: 1 };
    return p[b.priority] - p[a.priority];
  });

  const toggleSelect = (id) => setSelectedTasks(prev => prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]);
  const handleBulkComplete = async () => { await bulkComplete(selectedTasks); setSelectedTasks([]); };
  const handleBulkDelete = async () => { await bulkDelete(selectedTasks); setSelectedTasks([]); };

  // Drag and Drop
  const handleDragStart = (e, taskId) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('taskId', taskId); setTimeout(() => { e.target.classList.add('opacity-40'); }, 0); };
  const handleDragEnd = (e) => e.target.classList.remove('opacity-40');
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      const task = tasks.find(t => t._id === taskId);
      if (task && task.status !== newStatus) updateTaskStatus(taskId, newStatus);
    }
  };

  const safeYear = currentDate?.getFullYear() || new Date().getFullYear();
  const safeMonth = currentDate?.getMonth() || new Date().getMonth();
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
  const daysInMonth = getDaysInMonth(safeYear, safeMonth);
  const firstDay = getFirstDayOfMonth(safeYear, safeMonth);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) return <DashboardLayout><div className="w-full h-full flex items-center justify-center text-white font-mono mt-10 animate-pulse">Loading OS Data...</div></DashboardLayout>;

  const renderContextMenu = (task) => (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === task._id ? null : task._id); }} className="text-white/30 hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
      {activeDropdown === task._id && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }}></div>
          <div className="absolute right-0 top-6 w-36 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 py-1 animate-in fade-in">
            {task.status === 'done' ? (
              <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task._id, 'todo'); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/10 flex items-center gap-2"><RotateCcw className="w-3 h-3" /> Mark Undone</button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task._id, 'done'); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/10 flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Mark Done</button>
            )}
            <button onClick={(e) => { e.stopPropagation(); setModalState({ isOpen: true, data: task }); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/10 flex items-center gap-2"><Edit2 className="w-3 h-3" /> Edit</button>
            <button onClick={(e) => { e.stopPropagation(); duplicateTask(task); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/10 flex items-center gap-2"><Copy className="w-3 h-3" /> Duplicate</button>
            <button onClick={(e) => { e.stopPropagation(); archiveTask(task._id); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/10 flex items-center gap-2"><Archive className="w-3 h-3" /> Archive</button>
            <div className="border-t border-white/10 my-1"></div>
            <button onClick={(e) => { e.stopPropagation(); deleteTask(task._id); setActiveDropdown(null); }} className="w-full text-left px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 flex items-center gap-2"><Trash2 className="w-3 h-3" /> Delete</button>
          </div>
        </>
      )}
    </div>
  );

  const TaskCard = ({ task, hFull = false }) => {
    const isSelected = selectedTasks.includes(task._id);
    return (
      <div 
        draggable onDragStart={(e) => handleDragStart(e, task._id)} onDragEnd={handleDragEnd}
        className={`relative p-4 cursor-grab active:cursor-grabbing group w-full hover-lift-scale light-glass ${hFull ? 'h-full flex flex-col justify-between' : ''} ${isSelected ? 'shadow-[0_0_15px_rgba(59,130,246,0.25)]' : ''} ${activeDropdown === task._id ? 'z-50' : 'z-10'}`}
      >
        <div>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); toggleSelect(task._id); }} className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/30 opacity-0 group-hover:opacity-100'}`}>
                {isSelected && <CheckSquare className="w-3 h-3" />}
              </button>
              <PriorityBadge priority={task.priority} />
            </div>
            {renderContextMenu(task)}
          </div>
          <h4 className={`font-medium text-sm mb-2 ${task.status === 'done' ? 'text-white/50 line-through' : 'text-white'}`}>{task.title}</h4>
          <div className="flex items-center gap-3 text-xs text-white/40 mb-4"><span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {task.category}</span></div>
        </div>
        
        <div className="pt-3 border-t border-white/5 flex justify-between items-center">
          <GlassDropdown variant="status" value={task.status} options={[{value: 'todo', label: 'To Do'}, {value: 'in_progress', label: 'In Progress'}, {value: 'done', label: 'Done'}]} onChange={(v) => updateTaskStatus(task._id, v)} />
          {task.status !== 'done' && (
            <button onClick={(e) => { e.stopPropagation(); alert(`Starting Study Session for: ${task.title}`); }} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1.5 rounded-lg transition-colors border border-emerald-500/20">
              <Play className="w-3 h-3" /> Session
            </button>
          )}
        </div>
      </div>
    );
  };

  const TaskListItem = ({ task }) => (
    <div className={`flex items-center justify-between p-4 group relative hover-lift-scale light-glass shadow ${activeDropdown === task._id ? 'z-50' : 'z-10'}`}>
      <div className="flex items-center gap-5">
        <GlassDropdown variant="status" value={task.status} options={[{value: 'todo', label: 'To Do'}, {value: 'in_progress', label: 'In Progress'}, {value: 'done', label: 'Done'}]} onChange={(v) => updateTaskStatus(task._id, v)} />
        <div>
          <h4 className={`text-sm font-medium ${task.status === 'done' ? 'text-white/40 line-through' : 'text-white'}`}>{task.title}</h4>
          <div className="flex items-center gap-4 text-xs text-white/40 mt-1.5">
            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {task.category}</span>
            {task.deadline && (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(task.deadline).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <PriorityBadge priority={task.priority} />
        {renderContextMenu(task)}
      </div>
    </div>
  );

  return (
    <DashboardLayout rightPanelContent={<TaskRightPanel tasks={tasks.filter(t => !t.isArchived)} />}>
      <div className="w-full flex flex-col h-full relative" onClick={() => setActiveDropdown(null)}>
        
        {/* COMMAND BOARD & FILTERS */}
        <div className="sticky top-0 z-30 px-6 py-4 -mx-6 rounded-b-2xl mb-6 flex flex-col gap-4 light-glass shadow-md">
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 shadow-inner overflow-x-auto scrollbar-hide max-w-full">
              {[{ id: 'today', icon: Sun, label: 'Today' }, { id: 'list', icon: LayoutList, label: 'List' }, { id: 'board', icon: Kanban, label: 'Board' }, { id: 'calendar', icon: CalendarDays, label: 'Calendar' }].map(v => (
                <button key={v.id} onClick={() => setView(v.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${view === v.id ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}>
                  <v.icon className="w-4 h-4" /> {v.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setView('archived')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${view === 'archived' ? 'bg-white/10 text-white shadow' : 'bg-white/5 border border-white/10 text-white/45 hover:text-white/80'}`}>
                <Archive className="w-4 h-4" />
              </button>
              <button onClick={() => setModalState({ isOpen: true, data: null })} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold glass-btn-primary shadow-lg shrink-0">
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>
          </div>

          {view !== 'archived' && view !== 'calendar' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-20 w-full">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full glass-input pl-9 pr-4 py-2 text-xs" />
              </div>
              <div className="w-full sm:w-40"><GlassDropdown icon={FilterIcon} value={categoryFilter} options={[{value: 'All', label: 'All Categories'}, {value: 'Academic', label: 'Academic'}, {value: 'DSA', label: 'DSA'}, {value: 'Internship', label: 'Internship'}, {value: 'Personal', label: 'Personal'}]} onChange={setCategoryFilter} /></div>
              <div className="w-full sm:w-44"><GlassDropdown icon={ArrowDownUp} value={sortBy} options={[{value: 'deadline-asc', label: 'Earliest Deadline'}, {value: 'deadline-desc', label: 'Latest Deadline'}, {value: 'priority', label: 'Highest Priority'}]} onChange={setSortBy} /></div>
            </div>
          )}
        </div>

        {/* WORKSPACE: TODAY VIEW */}
        {view === 'today' && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-24 scrollbar-hide">
            <div className="flex items-center gap-3 text-blue-300 mb-2">
              <Sun className="w-6 h-6" />
              <h2 className="text-xl font-bold tracking-wide">Your Focus Today</h2>
            </div>
            {todaysTasks.length === 0 ? (
              <div className="text-center text-white/40 mt-10 p-10 light-glass rounded-2xl">
                <p>No pending tasks due today. Enjoy your day!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaysTasks.map(task => <TaskCard key={task._id} task={task} />)}
              </div>
            )}
          </div>
        )}

        {/* WORKSPACE: LIST VIEW */}
        {view === 'list' && (
          <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-24 scrollbar-hide">
            <div className="flex flex-col gap-3">
              {activeTasks.length === 0 && <div className="text-center text-white/40 mt-10">No tasks match your filters.</div>}
              {activeTasks.map(task => <TaskListItem key={task._id} task={task} />)}
            </div>
            {overdueTasks.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 text-white/60 mb-4 font-semibold text-sm tracking-wide"><AlertTriangle className="w-4 h-4 text-blue-400" /> Overdue Tasks</div>
                <div className="flex flex-col gap-3">{overdueTasks.map(task => <TaskListItem key={task._id} task={task} />)}</div>
              </div>
            )}
          </div>
        )}

        {/* WORKSPACE: BOARD VIEW */}
        {view === 'board' && (
          <div className="flex-1 flex flex-col min-h-0 pb-10">
            <div className="flex flex-col md:flex-row gap-6 h-[72vh] md:h-[75vh] overflow-y-auto md:overflow-y-hidden overflow-x-auto pb-4">
              {['todo', 'in_progress', 'done'].map(status => (
                <div key={status} className="flex-1 min-w-[280px] md:min-w-[300px] flex flex-col gap-4 h-auto md:h-full">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">{status.replace('_', ' ')}</h3>
                    <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/60 font-mono shadow-inner">{activeTasks.filter(t => t.status === status).length}</span>
                  </div>
                  <div className="flex-1 rounded-2xl p-3 flex flex-col gap-3 min-h-[300px] md:min-h-0 md:h-full overflow-y-auto scroll-smooth custom-scrollbar light-glass shadow-inner" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}>
                    {activeTasks.filter(t => t.status === status).length > 0 ? (
                      activeTasks.filter(t => t.status === status).map(task => <TaskCard key={task._id} task={task} />)
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-white/20 text-xs italic border border-dashed border-white/5 rounded-xl py-10">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {overdueTasks.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/5 shrink-0">
                <div className="flex items-center gap-2 text-white/60 mb-3 font-semibold text-xs tracking-wide"><AlertTriangle className="w-4 h-4 text-blue-400" /> Overdue Tasks</div>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">{overdueTasks.map(task => <div key={task._id} className="min-w-[280px] max-w-[280px] flex"><TaskCard task={task} hFull={true} /></div>)}</div>
              </div>
            )}
          </div>
        )}

        {/* WORKSPACE: CALENDAR VIEW */}
        {view === 'calendar' && (
          <div className="flex-1 flex flex-col light-glass p-6 overflow-y-auto scrollbar-hide pb-24 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white drop-shadow-md">{monthNames[safeMonth]} {safeYear}</h2>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold">Today</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setCurrentDate(new Date(safeYear, safeMonth - 1, 1))} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => setCurrentDate(new Date(safeYear, safeMonth + 1, 1))} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-4 mb-4">
              {dayNames.map(day => (<div key={day} className="text-center text-xs font-bold uppercase tracking-wider text-white/40">{day}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-3 flex-1 auto-rows-fr">
              {Array.from({ length: firstDay || 0 }).map((_, i) => (<div key={`blank-${i}`} className="min-h-[60px] sm:min-h-[100px] rounded-xl bg-white/5 border border-white/5 opacity-50"></div>))}
              {Array.from({ length: daysInMonth || 0 }).map((_, i) => {
                const dayNumber = i + 1;
                const isToday = new Date().getDate() === dayNumber && new Date().getMonth() === safeMonth && new Date().getFullYear() === safeYear;
                const dayTasks = [...activeTasks, ...overdueTasks].filter(t => {
                  if (!t.deadline) return false;
                  const d = new Date(t.deadline);
                  if (isNaN(d.getTime())) return false; 
                  return d.getDate() === dayNumber && d.getMonth() === safeMonth && d.getFullYear() === safeYear;
                });
                
                return (
                  <div key={`day-${dayNumber}`} className={`min-h-[60px] sm:min-h-[120px] rounded-xl p-1.5 sm:p-2 transition-all light-glass hover-lift-scale ${isToday ? 'shadow-[0_0_15px_rgba(59,130,246,0.2)] border-blue-500/30' : ''}`}>
                    <div className="flex justify-end mb-1"><span className={`flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-semibold ${isToday ? 'bg-blue-500 text-white shadow-md' : 'text-white/60'}`}>{dayNumber}</span></div>
                    
                    {/* Full task text list on desktop/tablet */}
                    <div className="hidden sm:flex flex-col gap-1.5 overflow-y-auto max-h-[80px] scrollbar-hide">
                      {dayTasks.map(task => (
                        <div key={task._id} className="px-2 py-1.5 rounded-md bg-white/5 border border-white/5 text-[10px] leading-tight font-medium truncate transition-colors cursor-pointer">{task.title}</div>
                      ))}
                    </div>

                    {/* Dot indicators on small mobile viewports */}
                    <div className="flex sm:hidden flex-wrap justify-center gap-1 mt-1">
                      {dayTasks.slice(0, 3).map(task => (
                        <div key={task._id} className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      ))}
                      {dayTasks.length > 3 && <span className="text-[8px] text-white/40 font-bold leading-none">+</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WORKSPACE: ARCHIVED VIEW */}
        {view === 'archived' && (
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-24 scrollbar-hide">
            {archivedTasks.length === 0 ? <div className="text-center text-white/40 mt-10">No archived tasks found.</div> : archivedTasks.map(task => (
                <div key={task._id} className="flex items-center justify-between p-4 light-glass opacity-75">
                  <div>
                    <h4 className="text-sm font-medium text-white/60">{task.title}</h4>
                    <span className="flex items-center gap-1 text-xs text-white/40 mt-1.5"><Tag className="w-3 h-3" /> {task.category}</span>
                  </div>
                  <button onClick={() => unarchiveTask(task._id)} className="flex items-center gap-2 px-3 py-1.5 glass-btn-secondary text-xs">
                    <RotateCcw className="w-3 h-3" /> Restore Task
                  </button>
                </div>
            ))}
          </div>
        )}
      </div>

      {/* BULK ACTIONS */}
      {selectedTasks.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-3 strong-glass shadow-2xl animate-in slide-in-from-bottom-10 fade-in">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-sm">{selectedTasks.length}</div>
          <span className="text-white/80 text-sm font-semibold pr-4 border-r border-white/5">Tasks Selected</span>
          <button onClick={handleBulkComplete} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/25 text-emerald-300 hover:bg-emerald-500/40 border border-emerald-500/30 transition-all flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Complete</button>
          <button onClick={handleBulkDelete} className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/25 text-red-300 hover:bg-red-500/40 border border-red-500/30 transition-all flex items-center gap-2"><Trash2 className="w-4 h-4"/> Delete</button>
          <button onClick={() => setSelectedTasks([])} className="p-2 ml-2 rounded-lg hover:bg-white/10 text-white/50 transition-all"><X className="w-4 h-4"/></button>
        </div>
      )}

      <TaskModal isOpen={modalState.isOpen} onClose={() => setModalState({ isOpen: false, data: null })} initialData={modalState.data} onSave={(data) => modalState.data ? editTask(modalState.data._id, data) : addTask(data)} />
    </DashboardLayout>
  );
};

export default Taskspage;