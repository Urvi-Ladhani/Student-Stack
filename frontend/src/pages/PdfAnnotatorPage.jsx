import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Folder, FileText, Download, BookOpen, Trash2 } from 'lucide-react';

const PdfAnnotatorPage = () => {
  const navigate = useNavigate();
  
  const [pdfUrl, setPdfUrl] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [noteTitle, setNoteTitle] = useState('Untitled Notes');
  const [notePath, setNotePath] = useState('General Notebook');
  
  const [typedNotes, setTypedNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setRawFile(file);
      
      // 🔥 NEW: Converts PDF to Base64 to bypass Chrome's security blocks
      const reader = new FileReader();
      reader.onload = (event) => {
        setPdfUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  // 🔥 1. CLEARS THE CURRENT PDF (DELETE OPTION)
  const handleDeleteDraft = () => {
    if(window.confirm("Are you sure you want to delete this draft?")) {
      setPdfUrl(null);
      setRawFile(null);
      setTypedNotes('');
      setNoteTitle('Untitled Notes');
    }
  };

  const handleSaveToBackend = async () => {
    if (!rawFile) return alert("Upload a PDF first!");
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('pdfFile', rawFile);
      formData.append('title', noteTitle);
      formData.append('path', notePath);
      formData.append('notes', typedNotes);

      const res = await fetch('http://localhost:5000/api/notes/upload-pdf', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
      });

      if (res.ok) {
        // 🔥 2. REDIRECTS TO NOTES PAGE AFTER SAVING
        navigate('/notes'); 
      } else {
        alert("❌ Failed to save. Ensure backend is running.");
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
    link.click();
  };

  return (
    <div className="w-full h-screen bg-[#040712]/30 text-white flex flex-col font-sans overflow-hidden animate-in fade-in p-6 gap-6 box-border">
      
      {/* 🔝 TOP NAVIGATION BAR */}
      <div className="h-20 shrink-0 flex items-center justify-between px-6 z-50 shadow-lg strong-glass">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/notes')} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex flex-col gap-1">
            <input 
              type="text" 
              value={noteTitle} 
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Enter Title..."
              className="bg-transparent border-none outline-none text-sm font-bold text-white placeholder-white/30 w-64"
            />
            <div className="flex items-center gap-1 text-white/40">
              <Folder className="w-3 h-3 text-blue-400" />
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

        <div className="flex items-center gap-3">
          {/* 🔥 3. DELETE BUTTON INSTALLED */}
          {pdfUrl && (
            <button onClick={handleDeleteDraft} className="w-9 h-9 rounded-xl flex items-center justify-center glass-btn-danger" title="Delete Draft">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          <button onClick={handleDownload} className="w-9 h-9 rounded-xl flex items-center justify-center glass-btn-secondary" title="Download Original PDF">
            <Download className="w-4 h-4" />
          </button>
          
          <button 
            onClick={handleSaveToBackend} 
            disabled={isSaving}
            className="px-5 py-2.5 glass-btn-primary"
          >
            <Save className="w-4 h-4" /> 
            {isSaving ? 'Saving...' : 'Save to Notebook'}
          </button>
        </div>
      </div>

      {/* 📄 MAIN CONTENT AREA */}
      <div className="flex-1 w-full flex overflow-hidden gap-6">
        {!pdfUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="p-12 flex flex-col items-center strong-glass shadow-2xl">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <BookOpen className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Pro Study Mode</h2>
                <p className="text-sm text-white/40 mb-8 max-w-md text-center font-medium">
                  Upload your PDF. Read on the left, type your notes on the right. 
                </p>
                <label className="px-8 py-3 glass-btn-primary font-bold shadow-lg cursor-pointer">
                  Choose PDF File
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
                </label>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex w-full h-full gap-6">
            {/* 🔥 4. HEAVY-DUTY OBJECT TAG TO FORCE BROWSER TO RENDER PDF */}
            <div className="w-2/3 h-full bg-white/5 rounded-3xl overflow-hidden border border-white/5 shadow-lg">
              <object data={`${pdfUrl}#toolbar=0`} type="application/pdf" className="w-full h-full">
                 <div className="flex flex-col items-center justify-center h-full text-white/80">
                    <p className="mb-4">Your browser is blocking the PDF preview.</p>
                    <a href={pdfUrl} target="_blank" rel="noreferrer" className="px-4 py-2 glass-btn-primary">Open PDF in New Tab</a>
                 </div>
              </object>
            </div>

            {/* RIGHT SIDE: Digital Notepad */}
            <div className="w-1/3 h-full flex flex-col strong-glass shadow-lg">
              <div className="p-4 border-b border-white/5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Study Notes</span>
              </div>
              <textarea 
                value={typedNotes}
                onChange={(e) => setTypedNotes(e.target.value)}
                placeholder="Type your notes, key takeaways, or important formulas here..."
                className="flex-1 w-full bg-transparent p-6 text-white/90 outline-none resize-none placeholder-white/20 leading-relaxed text-sm font-medium"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfAnnotatorPage;