import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import NotesRightPanel from '../components/NotesRightPanel';
import { 
  Search, Grid, List, Plus, Clock, TerminalSquare, 
  BookOpen, Briefcase, CheckSquare, MoreVertical, 
  X, Save, Folder, ChevronDown, PenTool, FileText, 
  LayoutGrid, UploadCloud
} from 'lucide-react';

// ==========================================
// 🛡️ CUSTOM NATIVE CANVAS (No Excalidraw Crashes)
// ==========================================
const NativeCanvas = ({ initialData, onChange }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (initialData && initialData.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = initialData;
    } else {
      ctx.fillStyle = '#121212'; // Dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [initialData]);

  const startDrawing = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = '#34d399'; // Emerald green marker
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      onChange(canvasRef.current.toDataURL()); // Save as Base64 image
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center justify-between text-white/50 text-xs font-bold uppercase tracking-widest">
        <span>Native Drawing Board</span>
        <span>Draw with Mouse/Trackpad</span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={900} 
        height={600} 
        onMouseDown={startDrawing} 
        onMouseMove={draw} 
        onMouseUp={stopDrawing} 
        onMouseOut={stopDrawing}
        className="w-full h-[600px] rounded-2xl border border-white/10 cursor-crosshair shadow-inner"
      />
    </div>
  );
};

// ==========================================
// CUSTOM GLASS DROPDOWN
// ==========================================
const GlassDropdown = ({ value, options, onChange, icon: Icon, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const safeOptions = Array.isArray(options) ? options : [];
  const selectedOption = safeOptions.find(o => o.value === value);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white/80 hover:bg-white/10 transition-all shadow-lg">
        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-400" />}
        <span className="max-w-[120px] truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="w-3 h-3 text-white/40 ml-2" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full mt-2 left-0 min-w-[180px] bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
            {safeOptions.map(opt => (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`px-4 py-2.5 text-xs cursor-pointer transition-colors ${value === opt.value ? 'bg-indigo-500/20 text-indigo-400 font-bold border-l-2 border-indigo-500' : 'text-white/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent'}`}>
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// DATA ENGINE
// ==========================================
const useNotes = () => {
  const [workspace, setWorkspace] = useState({ folders: [], tags: [], notes: [] });
  const [loading, setLoading] = useState(true);

  const fetchWorkspace = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/notes/workspace', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setWorkspace({
          folders: Array.isArray(data.folders) ? data.folders : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          notes: Array.isArray(data.notes) ? data.notes : [],
        });
      }
    } catch (error) { console.error("Error:", error); } 
    finally { setLoading(false); }
  };

  const saveNote = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const url = data._id ? `http://localhost:5000/api/notes/${data._id}` : 'http://localhost:5000/api/notes';
      const method = data._id ? 'PUT' : 'POST';
      
      const payload = { ...data };
      if (!payload.folderId || payload.folderId === "") payload.folderId = null;
      
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify(payload) 
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(`❌ Backend Error: ${err.message}`);
        return;
      }
      fetchWorkspace();
    } catch (err) { alert("❌ Network Error: Server is down."); }
  };

  const createFolder = async (name) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notes/folders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name, parentId: null }) });
      fetchWorkspace();
    } catch (err) { alert("❌ Network Error"); }
  };

  useEffect(() => { fetchWorkspace(); }, []);
  return { workspace, loading, saveNote, createFolder };
};

const getModuleBadge = (moduleName) => {
  switch(moduleName) {
    case 'DSA': return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"><TerminalSquare className="w-3 h-3"/> DSA</span>;
    case 'Task': return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20"><CheckSquare className="w-3 h-3"/> TASK</span>;
    case 'Internship': return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20"><Briefcase className="w-3 h-3"/> INTERN</span>;
    default: return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-white/5 text-white/50 border border-white/10"><BookOpen className="w-3 h-3"/> GENERAL</span>;
  }
};

// ==========================================
// MAIN UI COMPONENT
// ==========================================
const NotesPage = () => {
  const { workspace, loading, saveNote, createFolder } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [folderModal, setFolderModal] = useState({ isOpen: false, name: '' });

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState({ _id: null, title: '', content: '', sourceModule: 'General', tags: [], folderId: '', editorMode: 'text' });
  const [tagInput, setTagInput] = useState('');

  const safeNotes = Array.isArray(workspace.notes) ? workspace.notes : [];
  const safeFolders = Array.isArray(workspace.folders) ? workspace.folders : [];
  const safeEditorTags = Array.isArray(editorData.tags) ? editorData.tags : [];

  const handleSaveAndClose = async () => {
    await saveNote({ 
        _id: editorData._id,
        title: editorData.title || 'Untitled Note', 
        content: editorData.content || '', 
        sourceModule: editorData.sourceModule || 'General',
        tags: safeEditorTags,
        folderId: editorData.folderId || null,
        editorMode: editorData.editorMode || 'text'
    });
    setIsEditorOpen(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => setEditorData({ ...editorData, content: reader.result });
      reader.readAsDataURL(file);
    } else alert("Please upload a valid PDF file.");
  };

  const addTag = (tagToAdd) => {
    if (!tagToAdd.trim()) return;
    if (safeEditorTags.includes(tagToAdd)) return;
    setEditorData({ ...editorData, tags: [...safeEditorTags, tagToAdd.trim()] });
    setTagInput('');
  };

  const displayedNotes = safeNotes.filter(note => {
    if (activeFolderId) return note.folderId === activeFolderId;
    return true; 
  });

  const folderOptions = [{ label: 'No Notebook', value: '' }, ...safeFolders.map(f => ({ label: f.name, value: f._id }))];
  const moduleOptions = [
    { label: 'General Note', value: 'General' },
    { label: 'DSA Tracker', value: 'DSA' },
    { label: 'Task Deliverable', value: 'Task' },
    { label: 'Internship', value: 'Internship' }
  ];

  if (loading) return <DashboardLayout><div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse">Booting Knowledge Base...</div></DashboardLayout>;

  return (
    <DashboardLayout rightPanelContent={<NotesRightPanel createNote={saveNote} />}>
      <div className="w-full h-full flex flex-col gap-6 animate-in fade-in relative">
        
        {/* TOP BAR */}
        <div className="w-full h-16 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg flex items-center px-4 gap-4 shrink-0">
          <div className="flex-1 flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl px-4 py-2 focus-within:border-indigo-500/50 transition-colors">
            <Search className="w-4 h-4 text-white/40" />
            <input type="text" autoComplete="off" placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-white/30" />
          </div>
          <button onClick={() => { setEditorData({ _id: null, title: '', content: '', sourceModule: 'General', tags: [], folderId: activeFolderId || '', editorMode: 'text' }); setIsEditorOpen(true); }} className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>

        {/* MAIN GRID */}
        <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
          <div className="w-64 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 sticky top-0 z-10">
              <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2"><BookOpen className="w-4 h-4" /> Notebooks</h2>
              <button onClick={() => setFolderModal({ isOpen: true, name: '' })} className="w-6 h-6 hover:bg-white/10 rounded-md text-white/50 hover:text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 scrollbar-hide space-y-1">
              <button onClick={() => setActiveFolderId(null)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all mb-2 ${activeFolderId === null ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:bg-white/5'}`}>
                <LayoutGrid className="w-4 h-4" /> All Notes
              </button>
              <div className="h-px w-full bg-white/5 mb-2"></div>
              {safeFolders.map(folder => (
                <div key={folder._id} onClick={() => setActiveFolderId(folder._id)} className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer text-sm transition-all group ${activeFolderId === folder._id ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'hover:bg-white/5 text-white/70'}`}>
                  <div className="flex items-center gap-2 flex-1">
                    <Folder className={`w-4 h-4 ${activeFolderId === folder._id ? 'text-indigo-400' : 'text-indigo-400/70'}`} />
                    <span className="font-medium truncate">{folder.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setEditorData({ _id: null, title: '', content: '', sourceModule: 'General', tags: [], folderId: folder._id, editorMode: 'text' }); setIsEditorOpen(true); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md"><Plus className="w-3 h-3 text-white/50 hover:text-white" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide grid grid-cols-1 xl:grid-cols-2 gap-6 pb-24 content-start">
            {displayedNotes.map(note => (
              <div key={note._id} onClick={() => { setEditorData({ _id: note._id, title: note.title, content: note.content, sourceModule: note.sourceModule, tags: Array.isArray(note.tags) ? note.tags : [], folderId: note.folderId || '', editorMode: note.editorMode || 'text' }); setIsEditorOpen(true); }} className="h-64 p-5 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl hover:border-indigo-500/30 cursor-pointer group flex flex-col shadow-lg relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5">
                  {(note.editorMode || 'text') === 'canvas' ? <PenTool className="w-40 h-40" /> : (note.editorMode || 'text') === 'pdf' ? <FileText className="w-40 h-40" /> : <BookOpen className="w-40 h-40" />}
                </div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  {getModuleBadge(note.sourceModule)}
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{note.editorMode || 'text'}</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 mb-2 line-clamp-2 relative z-10">{note.title}</h3>
                <p className="text-sm text-white/40 line-clamp-3 mb-4 flex-1 relative z-10 overflow-hidden">
                  {(note.editorMode || 'text') === 'text' ? note.content : `[${(note.editorMode || 'text').toUpperCase()} DATA SAVED]`}
                </p>
                <div className="flex items-center justify-between mt-auto relative z-10">
                  <span className="text-[10px] font-medium text-white/30 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(note.lastEditedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EDITOR MODAL */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-5xl h-[90vh] bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95">
              
              <div className="h-20 shrink-0 border-b border-white/10 px-8 flex items-center justify-between bg-white/5">
                <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10 shadow-inner">
                  <button onClick={() => setEditorData({...editorData, editorMode: 'text'})} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${editorData.editorMode === 'text' ? 'bg-indigo-500 text-white shadow-md' : 'text-white/50 hover:text-white'}`}><BookOpen className="w-3.5 h-3.5" /> Text</button>
                  <button onClick={() => setEditorData({...editorData, editorMode: 'canvas'})} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${editorData.editorMode === 'canvas' ? 'bg-emerald-500 text-white shadow-md' : 'text-white/50 hover:text-white'}`}><PenTool className="w-3.5 h-3.5" /> Canvas</button>
                  <button onClick={() => setEditorData({...editorData, editorMode: 'pdf'})} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${editorData.editorMode === 'pdf' ? 'bg-red-500 text-white shadow-md' : 'text-white/50 hover:text-white'}`}><FileText className="w-3.5 h-3.5" /> PDF</button>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={handleSaveAndClose} className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2"><Save className="w-4 h-4" /> Save Note</button>
                  <button onClick={() => setIsEditorOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/50"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="px-8 py-5 border-b border-white/5 flex items-center gap-6 bg-black/20 shrink-0">
                <input type="text" autoComplete="off" value={editorData.title} onChange={(e) => setEditorData({...editorData, title: e.target.value})} placeholder="Note Title..." className="flex-1 bg-transparent text-3xl font-extrabold text-white placeholder-white/20 border-none outline-none" />
                <div className="flex items-center gap-3">
                  <GlassDropdown icon={Folder} value={editorData.folderId} options={folderOptions} onChange={(val) => setEditorData({...editorData, folderId: val})} placeholder="Select Notebook" />
                  <GlassDropdown icon={Briefcase} value={editorData.sourceModule} options={moduleOptions} onChange={(val) => setEditorData({...editorData, sourceModule: val})} placeholder="Select Module" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 relative bg-white/[0.02]">
                
                {editorData.editorMode === 'text' && (
                  <div className="max-w-4xl mx-auto flex flex-col gap-6">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {safeEditorTags.map((tag, idx) => (<span key={idx} className="px-3 py-1 rounded-md text-xs font-bold bg-white/10 text-white flex items-center gap-2 border border-white/10">{tag} <button onClick={() => setEditorData({...editorData, tags: editorData.tags.filter(t => t !== tag)})} className="hover:text-red-400"><X className="w-3 h-3"/></button></span>))}
                      </div>
                      <input type="text" autoComplete="off" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if(e.key==='Enter') { e.preventDefault(); addTag(tagInput); } }} placeholder="Type a custom tag and press Enter..." className="w-full bg-transparent border-none outline-none text-sm text-white/70 placeholder-white/30" />
                    </div>
                    <textarea value={editorData.content} onChange={(e) => setEditorData({...editorData, content: e.target.value})} placeholder="Start writing your thoughts here..." className="w-full min-h-[500px] bg-transparent text-lg text-white/90 placeholder-white/20 border-none outline-none resize-none leading-relaxed" />
                  </div>
                )}

                {/* 🔥 Custom Native Canvas Active */}
                {editorData.editorMode === 'canvas' && (
                  <NativeCanvas 
                    initialData={editorData.content} 
                    onChange={(base64Data) => setEditorData({...editorData, content: base64Data})} 
                  />
                )}

                {editorData.editorMode === 'pdf' && (
                  <div className="w-full h-[600px] flex flex-col gap-4">
                    {!editorData.content || !editorData.content.startsWith('data:application/pdf') ? (
                      <div className="w-full h-full border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-white/40 bg-black/20 hover:bg-white/5 cursor-pointer relative">
                        <UploadCloud className="w-12 h-12 mb-4 text-red-400" />
                        <h3 className="text-xl font-bold text-white mb-2">Upload PDF</h3>
                        <input type="file" accept="application/pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-white relative">
                        <button onClick={() => setEditorData({...editorData, content: ''})} className="absolute top-4 right-6 z-10 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow-lg">Remove PDF</button>
                        <embed src={editorData.content} type="application/pdf" width="100%" height="100%" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {folderModal.isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-[400px] bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Folder className="w-4 h-4 text-indigo-400" /> Create Notebook</h3>
                <button onClick={() => setFolderModal({ isOpen: false, name: '' })} className="text-white/50 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createFolder(folderModal.name); setFolderModal({isOpen: false, name: ''}); }} className="p-6 flex flex-col gap-4">
                <input autoFocus type="text" value={folderModal.name} onChange={(e) => setFolderModal({...folderModal, name: e.target.value})} placeholder="Notebook Name..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50" />
                <button type="submit" disabled={!folderModal.name.trim()} className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold">Create</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default NotesPage;