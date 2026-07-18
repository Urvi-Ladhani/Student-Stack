import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import NotesRightPanel from '../components/NotesRightPanel';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { 
  Search, Plus, Clock, TerminalSquare, BookOpen, Briefcase, 
  CheckSquare, X, Save, Folder, ChevronDown, PenTool, FileText, 
  LayoutGrid, UploadCloud, PlaySquare, Code, BookMarked, Link as LinkIcon, Tag, Trash2, ExternalLink
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

  const deleteNote = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchWorkspace(); 
      } else {
        alert("❌ Failed to delete note from database.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Network Error");
    }
  };

  const createFolder = async (name) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notes/folders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name, parentId: null }) });
      fetchWorkspace();
    } catch (err) { alert("❌ Network Error"); }
  };

  useEffect(() => { fetchWorkspace(); }, []);
  return { workspace, loading, saveNote, deleteNote, createFolder }; 
};

const NotesPage = () => {
  const { workspace, loading, saveNote, deleteNote, createFolder } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [folderModal, setFolderModal] = useState({ isOpen: false, name: '' });
  
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, noteId: null });
  
  // 🔥 UPDATE 1: Switched to useRef so the canvas engine doesn't get lost on save
  const canvasEditorRef = useRef(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState({ _id: null, title: '', content: '', sourceModule: 'General', tags: [], attachments: [], folderId: '', editorMode: 'text', fileUrl: '' });
  
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
    let finalContent = editorData.content;
    
    // 🔥 UPDATE 2: Crash-proof wrapper to extract Tldraw data safely
    if (editorData.editorMode === 'canvas' && canvasEditorRef.current) {
       try {
          let snapshot = null;
          // Handles different minor versions of Tldraw just in case
          if (typeof canvasEditorRef.current.getSnapshot === 'function') {
              snapshot = canvasEditorRef.current.getSnapshot();
          } else if (canvasEditorRef.current.store && typeof canvasEditorRef.current.store.getSnapshot === 'function') {
              snapshot = canvasEditorRef.current.store.getSnapshot();
          }
          
          if (snapshot) {
              finalContent = JSON.stringify(snapshot);
          }
       } catch (err) {
          console.error("Canvas saving error:", err);
       }
    }

    const success = await saveNote({ 
        _id: editorData._id, title: editorData.title || 'Untitled Note', content: finalContent || '', 
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
      <>
        <DashboardLayout rightPanelContent={<NotesRightPanel createNote={saveNote} />}>
          <div className="w-full h-full flex flex-col gap-6 animate-in fade-in relative">
            
            <div className="w-full h-16 flex items-center px-4 gap-4 shrink-0 light-glass shadow">
              <div className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                <Search className="w-4 h-4 text-white/40" />
                <input type="text" placeholder="Search notes or tags..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-white/30" />
              </div>
              <button onClick={() => { setEditorData({ _id: null, title: '', content: '', sourceModule: 'General', tags: [], attachments: [], folderId: activeFolderId || '', editorMode: 'text', fileUrl: '' }); canvasEditorRef.current = null; setIsEditorOpen(true); }} className="px-5 py-2.5 rounded-xl text-xs font-bold glass-btn-primary"><Plus className="w-4 h-4" /> New Note</button>
            </div>

            <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
              <div className="w-64 flex flex-col overflow-hidden shrink-0 light-glass shadow">
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]"><h2 className="text-xs font-bold text-white/50 uppercase flex items-center gap-2"><BookOpen className="w-4 h-4" /> Notebooks</h2><button onClick={() => setFolderModal({ isOpen: true, name: '' })} className="hover:text-white text-white/50"><Plus className="w-4 h-4" /></button></div>
                <div className="flex-1 overflow-y-auto p-3 scrollbar-hide space-y-1">
                  <button onClick={() => setActiveFolderId(null)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all mb-2 hover-lift-scale ${activeFolderId === null ? 'bg-white/10 text-white font-bold shadow' : 'text-white/50 hover:bg-white/5'}`}><LayoutGrid className="w-4 h-4" /> All Notes</button>
                  {safeFolders.map(folder => (
                    <div key={folder._id} onClick={() => setActiveFolderId(folder._id)} className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer text-sm transition-all hover-lift-scale ${activeFolderId === folder._id ? 'bg-white/10 text-white font-bold shadow' : 'hover:bg-white/5 text-white/70'}`}>
                      <div className="flex items-center gap-2"><Folder className="w-4 h-4" /> <span>{folder.name}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide grid grid-cols-1 xl:grid-cols-2 gap-6 pb-24 content-start">
                {displayedNotes.map(note => (
                  <div key={note._id} className="h-64 p-5 flex flex-col shadow hover-lift-scale overflow-hidden group relative light-glass">
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, noteId: note._id }); }} 
                      className="absolute top-4 right-4 p-2 bg-white/5 text-white/40 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-400 z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div 
                      className="flex-1 cursor-pointer flex flex-col"
                      onClick={() => { setEditorData({ _id: note._id, title: note.title, content: note.content, sourceModule: note.sourceModule, tags: Array.isArray(note.tags) ? note.tags : [], attachments: Array.isArray(note.attachments) ? note.attachments : [], folderId: note.folderId || '', editorMode: note.editorMode || 'text', fileUrl: note.fileUrl || '' }); canvasEditorRef.current = null; setIsEditorOpen(true); }}
                    >
                      <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{note.editorMode}</span></div>
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{note.title}</h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {Array.isArray(note.tags) && note.tags.slice(0,3).map(t => <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">{t}</span>)}
                      </div>
                      
                      {note.editorMode === 'pdf' ? (
                        <p className="text-xs text-white/40 italic flex items-center gap-2 mt-4"><FileText className="w-4 h-4 text-indigo-400/50" /> PDF Document Uploaded</p>
                      ) : note.editorMode === 'text' ? (
                        <p className="text-sm text-white/40 line-clamp-3 mb-4">{note.content}</p>
                      ) : (
                        <p className="text-xs text-white/40 italic flex items-center gap-2 mt-4"><PenTool className="w-4 h-4 text-blue-400/50" /> Canvas Whiteboard Drawing</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </DashboardLayout>

        {isEditorOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
            <div className="w-full max-w-6xl h-[85vh] strong-glass shadow-2xl flex flex-col overflow-hidden">
              
              <div className="h-20 shrink-0 border-b border-white/5 px-8 flex items-center justify-between bg-transparent">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button onClick={() => setEditorData({...editorData, editorMode: 'text'})} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${editorData.editorMode === 'text' ? 'bg-white/15 text-white shadow' : 'text-white/50 hover:text-white'}`}><BookOpen className="w-3.5 h-3.5" /> Text</button>
                  <button onClick={() => setEditorData({...editorData, editorMode: 'canvas'})} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${editorData.editorMode === 'canvas' ? 'bg-white/15 text-white shadow' : 'text-white/50 hover:text-white'}`}><PenTool className="w-3.5 h-3.5" /> Flowchart</button>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={handleSaveAndClose} className="px-6 py-2.5 rounded-xl text-sm font-bold glass-btn-primary"><Save className="w-4 h-4" /> Save</button>
                  <button onClick={() => setIsEditorOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl glass-btn-danger"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="px-8 py-5 border-b border-white/5 bg-transparent shrink-0 flex flex-col gap-4">
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
                  {editorData.editorMode === 'pdf' ? (
                     <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
                        <FileText className="w-16 h-16 text-indigo-500/50 mb-4" />
                        <p>This is a PDF Document.</p>
                        
                        {editorData.fileUrl && (
                          <a 
                            href={`http://localhost:5000${editorData.fileUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-6 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" /> Open Full PDF
                          </a>
                        )}

                        <p className="text-sm mt-8 text-white/30">Your typed notes alongside this PDF are saved below:</p>
                        <div className="mt-2 p-4 bg-black/30 rounded-xl border border-white/10 w-3/4 text-white/80 whitespace-pre-wrap">
                          {editorData.content || 'No notes typed for this PDF.'}
                        </div>
                     </div>
                  ) : editorData.editorMode === 'text' ? (
                    <textarea value={editorData.content} onChange={(e) => setEditorData({...editorData, content: e.target.value})} placeholder="Start typing your notes here..." className="w-full min-h-[500px] bg-transparent text-lg text-white font-medium placeholder-white/30 border-none outline-none resize-none leading-relaxed drop-shadow-sm" />
                  ) : (
                     <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl relative border border-white/10 bg-white">
                        <Tldraw 
                          onMount={(editor) => {
                             canvasEditorRef.current = editor; // Connects the ref directly to the Tldraw engine
                             if (editorData.content && editorData.content.trim() !== '') {
                                try {
                                   const parsed = JSON.parse(editorData.content);
                                   if (typeof editor.loadSnapshot === 'function') {
                                       editor.loadSnapshot(parsed);
                                   } else if (editor.store && typeof editor.store.loadSnapshot === 'function') {
                                       editor.store.loadSnapshot(parsed);
                                   }
                                } catch(e) {
                                   console.log("Could not parse old canvas data, starting fresh.");
                                }
                             }
                          }}
                        />
                     </div>
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

                  <div className="mt-auto pt-4 border-t border-white/5">
                    <p className="text-[10px] text-white/60 mb-2 drop-shadow-sm">Paste a YouTube, LeetCode, or PDF link</p>
                    <input type="text" value={attachmentInput} onChange={(e)=>setAttachmentInput(e.target.value)} onKeyDown={handleAddAttachment} placeholder="Paste link and press Enter..." className="w-full glass-input px-3 py-2 text-xs placeholder-white/40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 UPDATE 3: Fully Theme-Matched Indigo Delete Modal */}
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in">
            <div className="w-[400px] strong-glass shadow-2xl p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Note?</h3>
              <p className="text-sm text-white/50 mb-6">This action cannot be undone. This note will be permanently removed from your database.</p>
              
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setDeleteConfirm({isOpen: false, noteId: null})} 
                  className="flex-1 py-3 glass-btn-secondary text-sm font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { deleteNote(deleteConfirm.noteId); setDeleteConfirm({isOpen: false, noteId: null}); }} 
                  className="flex-1 py-3 glass-btn-primary text-sm font-bold"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {folderModal.isOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in">
            <div className="w-[400px] strong-glass shadow-2xl p-6">
              <form onSubmit={(e) => { e.preventDefault(); createFolder(folderModal.name); setFolderModal({isOpen: false, name: ''}); }} className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white mb-2 drop-shadow-sm">Create Notebook</h3>
                <input autoFocus type="text" value={folderModal.name} onChange={(e) => setFolderModal({...folderModal, name: e.target.value})} placeholder="Notebook Name..." className="w-full glass-input px-4 py-3 text-white" />
                <button type="submit" disabled={!folderModal.name.trim()} className="w-full py-3 glass-btn-primary font-bold">Create</button>
              </form>
            </div>
          </div>
        )}
      </>
    </ErrorBoundary>
  );
};

export default NotesPage;