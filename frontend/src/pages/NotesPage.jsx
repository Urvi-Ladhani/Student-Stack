import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Search, Filter, Grid, List, Plus, Clock, 
  TerminalSquare, BookOpen, Briefcase, CheckSquare, 
  MoreVertical, X, Edit3, Send, Save
} from 'lucide-react';

// ==========================================
// 1. DATA ENGINE
// ==========================================
const useNotes = () => {
  const [workspace, setWorkspace] = useState({ folders: [], tags: [], notes: [] });
  const [loading, setLoading] = useState(true);

  const fetchWorkspace = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/notes/workspace', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setWorkspace(await res.json());
    } catch (error) { console.error("Error:", error); } 
    finally { setLoading(false); }
  };

  const createNote = async (data) => {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:5000/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    fetchWorkspace();
  };

  useEffect(() => { fetchWorkspace(); }, []);
  return { workspace, loading, createNote, fetchWorkspace };
};

// ==========================================
// 2. HELPER COMPONENTS
// ==========================================
const getModuleBadge = (moduleName) => {
  switch(moduleName) {
    case 'DSA': return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"><TerminalSquare className="w-3 h-3"/> DSA</span>;
    case 'Task': return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"><CheckSquare className="w-3 h-3"/> TASK</span>;
    case 'Internship': return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20"><Briefcase className="w-3 h-3"/> INTERN</span>;
    default: return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-white/50 border border-white/10"><BookOpen className="w-3 h-3"/> GENERAL</span>;
  }
};

// ==========================================
// 3. MAIN UI COMPONENT
// ==========================================
const NotesPage = () => {
  const { workspace, loading, createNote, fetchWorkspace } = useNotes();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick Capture State
  const [quickCaptureText, setQuickCaptureText] = useState('');

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState({ title: '', content: '', sourceModule: 'General' });

  const handleQuickCapture = async (e) => {
    e.preventDefault();
    if (!quickCaptureText.trim()) return;
    await createNote({ title: 'Quick Draft', content: quickCaptureText, sourceModule: 'General' });
    setQuickCaptureText('');
  };

  const handleSaveAndClose = async () => {
    // Save to database
    await createNote({ 
        title: editorData.title || 'Untitled Note', 
        content: editorData.content, 
        sourceModule: editorData.sourceModule 
    });
    
    // Reset and Close
    setIsEditorOpen(false);
    setEditorData({ title: '', content: '', sourceModule: 'General' });
  };

  if (loading) return <DashboardLayout><div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse">Booting Knowledge Base...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="w-full h-full flex gap-6 animate-in fade-in slide-in-from-bottom-4 relative">
        
        {/* ============================== */}
        {/* LEFT/MAIN AREA: SEARCH & NOTES */}
        {/* ============================== */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Section 1: Search + Filters Bar */}
          <div className="w-full h-16 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg flex items-center px-4 gap-4 sticky top-0 z-20">
            <div className="flex-1 flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl px-4 py-2 focus-within:border-indigo-500/50 transition-colors">
              <Search className="w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Search notes, concepts, or tags..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-white/30"
              />
            </div>
            <button className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold transition-all flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}><Grid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/80'}`}><List className="w-4 h-4" /></button>
            </div>
            
            {/* Open Blank Editor Button */}
            <button 
              onClick={() => {
                setEditorData({ title: '', content: '', sourceModule: 'General' });
                setIsEditorOpen(true);
              }} 
              className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Note
            </button>
          </div>

          {/* Section 2: Notes Grid/List (Topic Clusters Removed as requested) */}
          <div className={`flex-1 overflow-y-auto pb-24 scrollbar-hide mt-2 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-3'}`}>
            {workspace.notes.length === 0 ? (
              <div className="col-span-full h-64 flex flex-col items-center justify-center text-white/30 border border-dashed border-white/10 rounded-3xl">
                <BookOpen className="w-10 h-10 mb-3 opacity-50" />
                <p>Knowledge base empty. Start capturing.</p>
              </div>
            ) : (
              workspace.notes.map(note => (
                <div 
                  key={note._id} 
                  // In the future, clicking this will load the specific note into the editor instead of a blank one
                  onClick={() => {
                    setEditorData(note);
                    setIsEditorOpen(true);
                  }} 
                  className={`p-5 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl hover:border-indigo-500/30 transition-all cursor-pointer group flex flex-col shadow-lg ${viewMode === 'list' ? 'flex-row items-center justify-between p-4' : 'h-64'}`}
                >
                  <div className={`flex justify-between items-start mb-4 ${viewMode === 'list' ? 'mb-0 w-1/3' : ''}`}>
                    {getModuleBadge(note.sourceModule)}
                    <button className="text-white/20 hover:text-white/80 transition-colors"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                  
                  <h3 className={`text-lg font-bold text-white group-hover:text-indigo-300 transition-colors ${viewMode === 'list' ? 'w-1/3 truncate' : 'mb-2 line-clamp-2'}`}>{note.title}</h3>
                  
                  {viewMode === 'grid' && (
                    <p className="text-sm text-white/40 line-clamp-3 mb-4 flex-1">
                      {note.content || "No content provided yet..."}
                    </p>
                  )}

                  <div className={`flex items-center justify-between mt-auto ${viewMode === 'list' ? 'w-1/3' : ''}`}>
                    <div className="flex gap-1.5 overflow-hidden">
                      {note.tags?.map(t => <span key={t._id} className="w-2 h-2 rounded-full bg-emerald-500"></span>)}
                    </div>
                    <span className="text-[10px] font-medium text-white/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(note.lastEditedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ============================== */}
        {/* RIGHT PANEL: QUICK CAPTURE ONLY */}
        {/* ============================== */}
        <div className="w-80 hidden lg:flex flex-col gap-6 sticky top-0 h-full">
          {/* Quick Capture Box (Heatmap Removed as requested) */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Edit3 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Capture</h3>
            </div>
            <form onSubmit={handleQuickCapture} className="relative">
              <textarea 
                value={quickCaptureText}
                onChange={(e) => setQuickCaptureText(e.target.value)}
                placeholder="Dump a quick thought, link, or note here..."
                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 resize-none outline-none focus:border-indigo-500/50 transition-colors"
              />
              <button type="submit" disabled={!quickCaptureText.trim()} className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-indigo-500 text-white disabled:opacity-50 disabled:bg-white/10 transition-colors">
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* ============================== */}
        {/* FULL EDITOR MODAL */}
        {/* ============================== */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full md:w-3/4 lg:w-2/3 h-full bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
              
              {/* THE NEW EDITOR HEADER WITH SAVE BUTTON & TAG PICKER */}
              <div className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-4">
                  {/* User-Selectable Tag Dropdown */}
                  <select 
                    value={editorData.sourceModule}
                    onChange={(e) => setEditorData({...editorData, sourceModule: e.target.value})}
                    className="bg-black/60 border border-white/10 text-white/80 text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value="General">General Note</option>
                    <option value="DSA">DSA Tracker</option>
                    <option value="Task">Task Deliverable</option>
                    <option value="Internship">Internship / Interview</option>
                  </select>
                  <span className="text-[10px] text-white/30 font-medium border-l border-white/10 pl-4 uppercase tracking-widest">
                    Drafting Mode
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* The Explicit Save Button */}
                  <button 
                    onClick={handleSaveAndClose} 
                    className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save & Close
                  </button>
                  
                  {/* The Close Without Saving Button */}
                  <button 
                    onClick={() => setIsEditorOpen(false)} 
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 lg:p-20 scrollbar-hide">
                <input 
                  type="text" 
                  value={editorData.title}
                  onChange={(e) => setEditorData({...editorData, title: e.target.value})}
                  placeholder="Note Title" 
                  className="w-full bg-transparent text-4xl font-extrabold text-white placeholder-white/20 border-none outline-none mb-6"
                />
                
                {/* Text Area */}
                <textarea 
                  value={editorData.content}
                  onChange={(e) => setEditorData({...editorData, content: e.target.value})}
                  placeholder="Press '/' for commands, or start writing..."
                  className="w-full h-[600px] bg-transparent text-base text-white/80 placeholder-white/20 border-none outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default NotesPage;