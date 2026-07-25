import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, Send, CheckCircle2, FileText, Timer } from 'lucide-react';

const NotesRightPanel = ({ createNote }) => {
  const navigate = useNavigate();
  const [quickCaptureText, setQuickCaptureText] = useState('');
  const [status, setStatus] = useState('idle');

  const handleQuickCapture = async (e) => {
    e.preventDefault();
    if (!quickCaptureText.trim()) return;
    
    // createNote now returns true/false based on backend success!
    const success = await createNote({ 
        title: 'Quick Draft', 
        content: quickCaptureText, 
        sourceModule: 'General',
        tags: ['#QuickCapture'],
        folderId: null
    });
    
    if (success) {
      setQuickCaptureText('');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      <button
        onClick={() => navigate('/study-sessions?module=Notes OS')}
        className="w-full py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/15 backdrop-blur-xl shadow-lg flex items-center justify-center gap-2 text-xs font-bold text-purple-300 transition-all shrink-0"
      >
        <Timer className="w-4 h-4 text-purple-400" /> Start Notes Study Session
      </button>

      {/* 🔥 NEW: GLASSMORPHISM PDF ANNOTATOR LAUNCHER */}
      <button 
        onClick={() => navigate('/notes/pdf')}
        className="w-full p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/10 backdrop-blur-xl shadow-lg flex flex-col items-center justify-center gap-3 transition-all group"
      >
        <div className="p-3 bg-indigo-500/20 rounded-full group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]">
          <FileText className="w-6 h-6 text-indigo-400" />
        </div>
        <span className="font-bold text-sm text-indigo-100 tracking-wider">PDF Annotator OS</span>
      </button>

      {/* EXISTING: QUICK CAPTURE */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 backdrop-blur-xl shadow-lg relative overflow-hidden">
        
        <div className={`absolute inset-0 bg-emerald-500/20 backdrop-blur-md transition-opacity duration-300 flex items-center justify-center ${status === 'success' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
            <span className="text-xs font-bold uppercase tracking-widest">Saved!</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Edit3 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Capture</h3>
        </div>
        <form onSubmit={handleQuickCapture} className="relative">
          <textarea 
            value={quickCaptureText}
            onChange={(e) => setQuickCaptureText(e.target.value)}
            placeholder="Dump a quick thought..."
            className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 resize-none outline-none focus:border-indigo-500/50 transition-colors"
          />
          <button type="submit" disabled={!quickCaptureText.trim()} className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-indigo-500 text-white disabled:opacity-50 disabled:bg-white/10 transition-colors">
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default NotesRightPanel;