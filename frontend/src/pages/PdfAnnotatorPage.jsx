import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { 
  ArrowLeft, Save, PenTool, Download, Share2, Folder, FileText, MousePointer2
} from 'lucide-react';

const PdfAnnotatorPage = () => {
  const navigate = useNavigate();
  
  // 🔥 DYNAMIC FILE AND TEXT STATES
  const [pdfUrl, setPdfUrl] = useState(null);
  const [rawFile, setRawFile] = useState(null); // Keeps the actual file to send to the backend
  const [noteTitle, setNoteTitle] = useState('Untitled Notes');
  const [notePath, setNotePath] = useState('General Notebook'); // Now fully editable!
  
  // Toggles between scrolling the PDF and drawing on the glass canvas
  const [activeTool, setActiveTool] = useState('cursor'); 
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setRawFile(file); // Save the heavy file for the backend
      const fileUrl = URL.createObjectURL(file);
      setPdfUrl(fileUrl); // Save the URL for the frontend viewer
    }
  };

  // 🔥 THE MULTER BACKEND SAVE FUNCTION
  const handleSaveToBackend = async () => {
    if (!rawFile) return alert("Upload a PDF first!");
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // We use FormData because we are sending a physical file, not just JSON text
      const formData = new FormData();
      formData.append('pdfFile', rawFile);
      formData.append('title', noteTitle);
      formData.append('path', notePath);
      formData.append('editorMode', 'pdf');

      // Send to your backend (Make sure your Multer route is set up to receive this!)
      const res = await fetch('http://localhost:5000/api/notes/upload-pdf', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
      });

      if (res.ok) {
        alert("✅ PDF Saved Successfully to your Backend!");
      } else {
        alert("❌ Failed to save. Is Multer running on the backend?");
      }
    } catch (err) {
      console.error(err);
      alert("Network Error: Backend is unreachable.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${noteTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!pdfUrl) return;
    try {
      if (navigator.share) await navigator.share({ title: noteTitle, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="w-full h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden animate-in fade-in">
      
      {/* 🔝 TOP NAVIGATION BAR */}
      <div className="h-16 shrink-0 bg-black/80 border-b border-white/10 backdrop-blur-xl flex items-center justify-between px-6 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/notes')} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex flex-col gap-1">
            {/* 🔥 TITLE IS EDITABLE */}
            <input 
              type="text" 
              value={noteTitle} 
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Enter Title..."
              className="bg-transparent border-none outline-none text-sm font-bold text-white placeholder-white/30 w-64 focus:border-b focus:border-indigo-500 transition-colors"
            />
            {/* 🔥 PATH IS NOW FULLY EDITABLE */}
            <div className="flex items-center gap-1 text-white/40 focus-within:text-indigo-400 transition-colors">
              <Folder className="w-3 h-3" />
              <input 
                type="text" 
                value={notePath} 
                onChange={(e) => setNotePath(e.target.value)}
                placeholder="Semester / Subject / Topic"
                className="bg-transparent border-none outline-none text-[10px] placeholder-white/20 w-64"
              />
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner">
          <button 
            onClick={() => setActiveTool('cursor')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTool === 'cursor' ? 'bg-indigo-500/20 text-indigo-400 shadow-md' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
          >
            <MousePointer2 className="w-4 h-4" /> Scroll PDF
          </button>
          <div className="w-px h-5 bg-white/10 mx-1"></div>
          <button 
            onClick={() => setActiveTool('draw')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${activeTool === 'draw' ? 'bg-emerald-500/20 text-emerald-400 shadow-md' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
          >
            <PenTool className="w-4 h-4" /> Draw / Highlight
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleShare} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={handleDownload} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
          
          {/* 🔥 SAVES TO BACKEND */}
          <button 
            onClick={handleSaveToBackend} 
            disabled={isSaving}
            className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" /> 
            {isSaving ? 'Saving...' : 'Save to Notebook'}
          </button>
        </div>
      </div>

      {/* 📄 PDF RENDERER AREA */}
      <div className="flex-1 w-full bg-[#121212] flex items-center justify-center relative overflow-hidden">
        {!pdfUrl ? (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm shadow-2xl">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <FileText className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Upload a PDF to Start Annotating</h2>
            <p className="text-sm text-white/40 mb-8 max-w-md text-center">
              Upload your DBMS notes, LeetCode cheat sheets, or textbooks.
            </p>
            <label className="px-8 py-3 bg-indigo-500 text-white font-bold rounded-xl cursor-pointer hover:bg-indigo-600 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              Choose PDF File
              <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          <div className="w-full h-full relative flex">
            {/* BACKGROUND: The actual PDF viewer */}
            <div className="absolute inset-0 z-10">
              <embed src={`${pdfUrl}#toolbar=0&navpanes=0`} type="application/pdf" className="w-full h-full" />
            </div>

            {/* FOREGROUND: The Drawing Canvas. 
                BUG FIX: It now stays permanently rendered so drawings aren't deleted. 
                We just toggle 'pointer-events-none' so you can click through it to scroll! */}
            <div className={`absolute inset-0 z-20 transition-opacity duration-300 ${activeTool === 'cursor' ? 'pointer-events-none opacity-40' : 'pointer-events-auto opacity-100'}`}>
              <Tldraw transparent />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfAnnotatorPage;