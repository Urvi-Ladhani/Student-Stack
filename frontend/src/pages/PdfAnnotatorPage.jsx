import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Folder, FileText, Download, BookOpen, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:5002';

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
    if (window.confirm("Are you sure you want to delete this draft?")) {
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

      const res = await fetch(`${API_BASE}/api/notes/upload-pdf`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ PDF annotation saved successfully!\nNote ID: ${data.note._id}`);
        // 🔥 2. REDIRECTS TO NOTES PAGE AFTER SAVING
        navigate('/notes');
      } else {
        const error = await res.json();
        alert(`❌ Failed to save. Error: ${error.error || 'Unknown error'}`);
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
    <div className="w-full h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden animate-in fade-in">

      {/* 🔝 TOP NAVIGATION BAR */}
      <div className="h-16 shrink-0 bg-black/80 border-b border-white/10 backdrop-blur-xl flex items-center justify-between px-6 z-50 shadow-lg">
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
              className="bg-transparent border-none outline-none text-sm font-bold text-white placeholder-white/30 w-64 focus:border-b focus:border-indigo-500 transition-colors"
            />
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

        <div className="flex items-center gap-3">
          {/* 🔥 3. DELETE BUTTON INSTALLED */}
          {pdfUrl && (
            <button onClick={handleDeleteDraft} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors" title="Delete Draft">
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button onClick={handleDownload} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Download Original PDF">
            <Download className="w-4 h-4" />
          </button>

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

      {/* 📄 MAIN CONTENT AREA */}
      <div className="flex-1 w-full flex overflow-hidden">
        {!pdfUrl ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#121212]">
            <div className="border-2 border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm shadow-2xl p-12 flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <BookOpen className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Pro Study Mode</h2>
              <p className="text-sm text-white/40 mb-8 max-w-md text-center">
                Upload your PDF. Read on the left, type your notes on the right.
              </p>
              <label className="px-8 py-3 bg-indigo-500 text-white font-bold rounded-xl cursor-pointer hover:bg-indigo-600 transition-transform shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                Choose PDF File
                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex w-full h-full">
            {/* 🔥 4. IFRAME FOR RELIABLE PDF RENDERING */}
            <div className="w-2/3 h-full border-r border-white/10 bg-white flex flex-col group relative">
              <iframe 
                src={`${pdfUrl}#toolbar=0`}
                type="application/pdf"
                className="w-full h-full"
                title="PDF Viewer"
              />
              {/* Open in New Tab Button */}
              <a href={pdfUrl} target="_blank" rel="noreferrer" download className="absolute top-3 right-3 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">Open Full Screen ↗</a>
            </div>

            {/* RIGHT SIDE: Digital Notepad */}
            <div className="w-1/3 h-full bg-[#0a0a0a] flex flex-col">
              <div className="p-4 border-b border-white/10 bg-black/40 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white/80">Study Notes</span>
              </div>
              <textarea
                value={typedNotes}
                onChange={(e) => setTypedNotes(e.target.value)}
                placeholder="Type your notes, key takeaways, or important formulas here..."
                className="flex-1 w-full bg-transparent p-6 text-white/90 outline-none resize-none placeholder-white/20 leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfAnnotatorPage;