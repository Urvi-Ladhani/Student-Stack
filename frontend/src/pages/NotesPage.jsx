import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import NotesRightPanel from '../components/NotesRightPanel';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { 
  Search, Plus, Clock, TerminalSquare, BookOpen, Briefcase, 
  CheckSquare, X, Save, Folder, ChevronDown, PenTool, FileText, 
  LayoutGrid, UploadCloud, PlaySquare, Code, BookMarked, Link as LinkIcon, Tag
} from 'lucide-react';

const SMART_TAGS = ['Revision', 'Important', 'Interview', 'Exam', 'Assignment'];

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <div className="p-10 text-red-500 bg-black">Crash Prevented. Refresh Page.</div>;
    return this.props.children;
  }
}

const GlassDropdown = ({ value, options, onChange, icon: Icon, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = (Array.isArray(options) ? options : []).find(o => o.value === value);
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white/80 hover:bg-white/10 transition-all shadow-lg backdrop-blur-md">
        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-400" />}
        <span className="max-w-[120px] truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="w-3 h-3 text-white/40 ml-2" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full mt-2 left-0 min-w-[180px] bg-[#1a1a1a]/80 backdrop-blur-3xl border border-white/20 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
            {(Array.isArray(options) ? options : []).map(opt => (
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

const useNotes = () => {
  const [workspace, setWorkspace] = useState({ folders: [], tags: [], notes: [] });
  const [loading, setLoading] = useState(true);

  const fetchWorkspace = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/notes/workspace', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setWorkspace({ folders: data.folders || [], tags: data.tags || [], notes: data.notes || [] });
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
      if (!payload._id) delete payload._id;
      if (!payload.folderId || payload.folderId === "") delete payload.folderId;
      
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!res.ok) return alert(`❌ Server Error (500)`);
      await fetchWorkspace();
      return true;
    } catch (err) { alert("❌ Network Error"); return false;}
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

const NotesPage = () => {
  const { workspace, loading, saveNote, createFolder } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [folderModal, setFolderModal] = useState({ isOpen: false, name: '' });
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState({ _id: null, title: '', content: '', sourceModule: 'General', tags: [], attachments: [], folderId: '', editorMode: 'text' });
  const [tagInput, setTagInput] = useState('');
  const [attachmentInput, setAttachmentInput] = useState('');

  const safeNotes = Array.isArray(workspace.notes) ? workspace.notes : [];
  const safeFolders = Array.isArray(workspace.folders) ? workspace.folders : [];
  const safeEditorTags = Array.isArray(editorData.tags) ? editorData.tags : [];
  const safeAttachments = Array.isArray(editorData.attachments) ? editorData.attachments : [];

  const displayedNotes = safeNotes.filter(note => {
    const matchesFolder = activeFolderId ? note.folderId === activeFolderId : true;
    const matchesSearch = searchQuery 
      ? (note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (note.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) 
      : true;
    return matchesFolder && matchesSearch;
  });

  const handleSaveAndClose = async () => {
    const success = await saveNote({ 
        _id: editorData._id, title: editorData.title || 'Untitled Note', content: editorData.content || '', 
        sourceModule: editorData.sourceModule || 'General', tags: safeEditorTags, attachments: safeAttachments,
        folderId: editorData.folderId || null, editorMode: editorData.editorMode || 'text'
    });
    if(success) setIsEditorOpen(false);
  };

  const handleAddAttachment = (e) => {
    if(e.key === 'Enter' && attachmentInput.trim()) {
      const url = attachmentInput.trim();
      let attachmentType = 'link'; let title = 'Web Link';
      
      if(url.includes('youtube.com') || url.includes('youtu.be')) { attachmentType = 'youtube'; title = 'YouTube Video'; }
      else if(url.includes('leetcode.com')) { attachmentType = 'leetcode'; title = 'LeetCode Problem'; }
      else if(url.includes('geeksforgeeks.org')) { attachmentType = 'gfg'; title = 'GFG Article'; }
      else if(url.match(/\.(jpeg|jpg|gif|png)$/)) { attachmentType = 'image'; title = 'Image File'; }
      else if(url.match(/\.(pdf)$/)) { attachmentType = 'pdf'; title = 'PDF Document'; }

      setEditorData({...editorData, attachments: [...safeAttachments, { attachmentType, url, title }]});
      setAttachmentInput('');
    }
  };

  const removeAttachment = (index) => {
    const newAtt = [...safeAttachments];
    newAtt.splice(index, 1);
    setEditorData({...editorData, attachments: newAtt});
  };

  const toggleSmartTag = (tag) => {
    if(safeEditorTags.includes(tag)) setEditorData({...editorData, tags: safeEditorTags.filter(t => t !== tag)});
    else setEditorData({...editorData, tags: [...safeEditorTags, tag]});
  };

  const addCustomTag = (e) => {
    if(e.key === 'Enter' && tagInput.trim() && !safeEditorTags.includes(tagInput.trim())) {
      setEditorData({...editorData, tags: [...safeEditorTags, tagInput.trim()]});
      setTagInput('');
    }
  };

  const folderOptions = [{ label: 'No Notebook', value: '' }, ...safeFolders.map(f => ({ label: f.name, value: f._id }))];
  const moduleOptions = [{ label: 'General', value: 'General' }, { label: 'DSA', value: 'DSA' }, { label: 'Task', value: 'Task' }, { label: 'Internship', value: 'Internship' }];

  if (loading) return <DashboardLayout><div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse">Booting Knowledge Base...</div></DashboardLayout>;

  return (
    <ErrorBoundary>
      {/* 🚀 Wrapper Fragment to allow modals to sit outside the layout */}
      <>
        <DashboardLayout rightPanelContent={<NotesRightPanel createNote={saveNote} />}>
          <div className="w-full h-full flex flex-col gap-6 animate-in fade-in relative">
            
            <div className="w-full h-16 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg flex items-center px-4 gap-4 shrink-0">
              <div className="flex-1 flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl px-4 py-2 focus-within:border-indigo-500/50">
                <Search className="w-4 h-4 text-white/40" />
                <input type="text" placeholder="Search notes or tags..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-white/30" />
              </div>
              <button onClick={() => { setEditorData({ _id: null, title: '', content: '', sourceModule: 'General', tags: [], attachments: [], folderId: activeFolderId || '', editorMode: 'text' }); setIsEditorOpen(true); }} className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> New Note</button>
            </div>

            <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
              <div className="w-64 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg flex flex-col overflow-hidden shrink-0">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20"><h2 className="text-xs font-bold text-white/50 uppercase flex items-center gap-2"><BookOpen className="w-4 h-4" /> Notebooks</h2><button onClick={() => setFolderModal({ isOpen: true, name: '' })} className="hover:text-white text-white/50"><Plus className="w-4 h-4" /></button></div>
                <div className="flex-1 overflow-y-auto p-3 scrollbar-hide space-y-1">
                  <button onClick={() => setActiveFolderId(null)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all mb-2 ${activeFolderId === null ? 'bg-white/10 text-white font-bold' : 'text-white/50 hover:bg-white/5'}`}><LayoutGrid className="w-4 h-4" /> All Notes</button>
                  {safeFolders.map(folder => (
                    <div key={folder._id} onClick={() => setActiveFolderId(folder._id)} className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer text-sm transition-all ${activeFolderId === folder._id ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-white/70'}`}>
                      <div className="flex items-center gap-2"><Folder className="w-4 h-4" /> <span>{folder.name}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide grid grid-cols-1 xl:grid-cols-2 gap-6 pb-24 content-start">
                {displayedNotes.map(note => (
                  <div key={note._id} onClick={() => { setEditorData({ _id: note._id, title: note.title, content: note.content, sourceModule: note.sourceModule, tags: Array.isArray(note.tags) ? note.tags : [], attachments: Array.isArray(note.attachments) ? note.attachments : [], folderId: note.folderId || '', editorMode: note.editorMode || 'text' }); setIsEditorOpen(true); }} className="h-64 p-5 rounded-3xl bg-black/30 border border-white/10 backdrop-blur-xl hover:border-indigo-500/30 cursor-pointer flex flex-col shadow-lg overflow-hidden group">
                    <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{note.editorMode}</span></div>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{note.title}</h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Array.isArray(note.tags) && note.tags.slice(0,3).map(t => <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">{t}</span>)}
                    </div>
                    <p className="text-sm text-white/40 line-clamp-3 mb-4">{note.editorMode === 'text' ? note.content : '[CANVAS DATA]'}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </DashboardLayout>

        {/* ========================================== */}
        {/* 🔥 MODALS ARE NOW OUTSIDE THE LAYOUT SO THEY FLOAT ON TOP */}
        {/* ========================================== */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
            <div className="w-full max-w-6xl h-[85vh] bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
              
              <div className="h-20 shrink-0 border-b border-white/10 px-8 flex items-center justify-between bg-transparent">
                <div className="flex items-center bg-black/20 p-1 rounded-xl border border-white/10">
                  <button onClick={() => setEditorData({...editorData, editorMode: 'text'})} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${editorData.editorMode === 'text' ? 'bg-indigo-500 text-white shadow-md' : 'text-white/50 hover:text-white'}`}><BookOpen className="w-3.5 h-3.5" /> Text</button>
                  <button onClick={() => setEditorData({...editorData, editorMode: 'canvas'})} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${editorData.editorMode === 'canvas' ? 'bg-emerald-500 text-white shadow-md' : 'text-white/50 hover:text-white'}`}><PenTool className="w-3.5 h-3.5" /> Flowchart</button>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={handleSaveAndClose} className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold shadow-lg flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
                  <button onClick={() => setIsEditorOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white border border-white/10 hover:bg-red-500/20"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="px-8 py-5 border-b border-white/10 bg-transparent shrink-0 flex flex-col gap-4">
                <div className="flex items-center gap-6">
                  <input type="text" value={editorData.title} onChange={(e) => setEditorData({...editorData, title: e.target.value})} placeholder="Note Title..." className="flex-1 bg-transparent text-4xl font-extrabold text-white placeholder-white/40 border-none outline-none drop-shadow-md" />
                  <div className="flex gap-3">
                    <GlassDropdown icon={Folder} value={editorData.folderId} options={folderOptions} onChange={(val) => setEditorData({...editorData, folderId: val})} placeholder="Select Notebook" />
                    <GlassDropdown icon={Briefcase} value={editorData.sourceModule} options={moduleOptions} onChange={(val) => setEditorData({...editorData, sourceModule: val})} placeholder="Select Module" />
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-white/50" />
                  <div className="flex flex-wrap items-center gap-2">
                    {SMART_TAGS.map(tag => (
                      <button key={tag} onClick={() => toggleSmartTag(tag)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${safeEditorTags.includes(tag) ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-transparent text-white/60 border-white/20 hover:border-white/50'}`}>
                        {tag}
                      </button>
                    ))}
                    <div className="w-px h-4 bg-white/20 mx-2"></div>
                    {safeEditorTags.filter(t => !SMART_TAGS.includes(t)).map((customTag, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 flex items-center gap-2 drop-shadow-sm">
                        {customTag} <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={() => toggleSmartTag(customTag)}/>
                      </span>
                    ))}
                    <input type="text" value={tagInput} onChange={(e)=>setTagInput(e.target.value)} onKeyDown={addCustomTag} placeholder="+ Custom Tag..." className="bg-transparent border-b border-white/30 text-xs text-white placeholder-white/50 outline-none w-24 focus:border-indigo-400 transition-colors pb-1" />
                  </div>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 p-8 overflow-y-auto">
                  {editorData.editorMode === 'text' && (
                    <textarea value={editorData.content} onChange={(e) => setEditorData({...editorData, content: e.target.value})} placeholder="Start typing your notes here..." className="w-full min-h-[500px] bg-transparent text-lg text-white font-medium placeholder-white/30 border-none outline-none resize-none leading-relaxed drop-shadow-sm" />
                  )}
                  {editorData.editorMode === 'canvas' && (
                     <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl relative border border-white/10"><Tldraw /></div>
                  )}
                </div>

                <div className="w-80 border-l border-white/10 bg-white/5 p-6 flex flex-col shrink-0">
                  <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest mb-4 flex items-center gap-2 drop-shadow-sm"><LinkIcon className="w-4 h-4"/> Resources</h3>
                  
                  <div className="flex flex-col gap-3 mb-6 overflow-y-auto">
                    {safeAttachments.map((att, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors group flex items-start gap-3 backdrop-blur-md shadow-lg">
                        {att.attachmentType === 'youtube' ? <PlaySquare className="w-5 h-5 text-red-400 shrink-0" /> : 
                         att.attachmentType === 'leetcode' ? <Code className="w-5 h-5 text-orange-400 shrink-0" /> : 
                         att.attachmentType === 'gfg' ? <BookMarked className="w-5 h-5 text-green-400 shrink-0" /> : 
                         <FileText className="w-5 h-5 text-indigo-300 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate drop-shadow-sm">{att.title}</p>
                          <a href={att.url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-200 hover:text-white hover:underline truncate block transition-colors">{att.url}</a>
                        </div>
                        <button onClick={() => removeAttachment(idx)} className="text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3"/></button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/10">
                    <p className="text-[10px] text-white/60 mb-2 drop-shadow-sm">Paste a YouTube, LeetCode, or PDF link</p>
                    <input type="text" value={attachmentInput} onChange={(e)=>setAttachmentInput(e.target.value)} onKeyDown={handleAddAttachment} placeholder="Paste link and press Enter..." className="w-full bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-400 placeholder-white/40 shadow-inner" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {folderModal.isOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in">
            <div className="w-[400px] bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden p-6">
              <form onSubmit={(e) => { e.preventDefault(); createFolder(folderModal.name); setFolderModal({isOpen: false, name: ''}); }} className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white mb-2 drop-shadow-sm">Create Notebook</h3>
                <input autoFocus type="text" value={folderModal.name} onChange={(e) => setFolderModal({...folderModal, name: e.target.value})} placeholder="Notebook Name..." className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-400 placeholder-white/40 shadow-inner" />
                <button type="submit" disabled={!folderModal.name.trim()} className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold shadow-lg transition-colors">Create</button>
              </form>
            </div>
          </div>
        )}
      </>
    </ErrorBoundary>
  );
};

export default NotesPage;