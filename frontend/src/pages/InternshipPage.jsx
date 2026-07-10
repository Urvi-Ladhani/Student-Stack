import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import InternshipRightPanel from '../components/InternshipRightPanel';
import { 
  Briefcase, Plus, Activity, Clock, FileText, Code, X, 
  MapPin, DollarSign, ExternalLink // 🟢 Added new icons for the details modal
} from 'lucide-react';

const KANBAN_STAGES = [
  { id: 'wishlist', title: 'Wishlist', color: 'bg-white/20' },
  { id: 'applied', title: 'Applied', color: 'bg-blue-500' },
  { id: 'oa', title: 'OA Round', color: 'bg-orange-500' },
  { id: 'interview', title: 'Interview', color: 'bg-purple-500' },
  { id: 'offer', title: 'Offer', color: 'bg-emerald-500' },
  { id: 'rejected', title: 'Rejected', color: 'bg-red-500' }
];

const InternshipPage = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ company: '', role: '', status: 'wishlist' });
  
  // 🟢 NEW STATE: Tracks which job card was double-clicked
  const [selectedJob, setSelectedJob] = useState(null);

  // 1. FETCH DATA FROM MONGODB
  const fetchInternships = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/internships', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInternships(data);
      }
    } catch (error) {
      console.error("Failed to fetch internships", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  // 2. CREATE NEW APPLICATION
  const handleAddApplication = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/internships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ company: '', role: '', status: 'wishlist' });
        fetchInternships(); // Refresh board
      }
    } catch (error) {
      console.error("Failed to add internship", error);
    }
  };

  // 3. DRAG AND DROP LOGIC (UPDATE STATUS)
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('cardId', id);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Required to allow dropping
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    
    // Optimistic UI Update (Updates screen instantly before DB finishes)
    setInternships(prev => prev.map(app => 
      app._id === cardId ? { ...app, status: newStatus } : app
    ));

    // Send update to MongoDB
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/internships/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error("Failed to update status", error);
      fetchInternships(); // Revert on failure
    }
  };

  // 4. DYNAMIC METRICS CALCULATION
  const totalApplied = internships.length;
  const interviewing = internships.filter(i => i.status === 'interview').length;
  const offers = internships.filter(i => i.status === 'offer').length;
  
  const responseRate = totalApplied === 0 ? '0%' : Math.round(((totalApplied - internships.filter(i => i.status === 'wishlist' || i.status === 'applied').length) / totalApplied) * 100) + '%';
  const interviewRate = totalApplied === 0 ? '0%' : Math.round((interviewing / totalApplied) * 100) + '%';
  const offerRate = totalApplied === 0 ? '0%' : Math.round((offers / totalApplied) * 100) + '%';

  if (loading) return <DashboardLayout><div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse">Loading Pipeline...</div></DashboardLayout>;

  return (
    <DashboardLayout rightPanelContent={<InternshipRightPanel internships={internships} />}>
      <div className="w-full h-full flex flex-col gap-6 animate-in fade-in overflow-hidden pb-6">
        
        {/* HEADER */}
        <div className="w-full h-20 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-xl shadow-lg flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
              <Briefcase className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Internship OS</h1>
              <p className="text-xs text-white/50">Your career operations command center.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>

        {/* MAIN SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-8 relative pb-20">
          
          {/* DYNAMIC APPLICATION METRICS */}
          <div className="sticky top-0 z-30 w-full grid grid-cols-4 gap-4 bg-[#050505]/90 backdrop-blur-xl py-2 border-b border-white/10">
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Total Tracked</span>
              <span className="text-2xl font-extrabold text-white mt-1">{totalApplied}</span>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Response Rate</span>
              <span className="text-2xl font-extrabold text-blue-400 mt-1">{responseRate}</span>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Interview Rate</span>
              <span className="text-2xl font-extrabold text-purple-400 mt-1">{interviewRate}</span>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Offer Rate</span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-1">{offerRate}</span>
            </div>
          </div>

          {/* DRAG AND DROP KANBAN BOARD */}
          <div className="w-full flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 px-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Pipeline Kanban
            </h2>
            
            <div className="w-full flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2">
              {KANBAN_STAGES.map((stage) => {
                const columnApps = internships.filter(app => app.status === stage.id);
                
                return (
                  <div 
                    key={stage.id} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.id)}
                    className="min-w-[280px] w-[280px] h-[500px] bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden transition-colors hover:bg-white/10"
                  >
                    <div className="p-3 border-b border-white/10 bg-black/40 flex items-center justify-between sticky top-0 z-10">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                        <span className="text-sm font-bold text-white/80">{stage.title}</span>
                      </div>
                      <span className="text-xs font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-md">{columnApps.length}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-hide">
                      {columnApps.map(app => (
                        <div 
                          key={app._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app._id)}
                          // 🟢 THE DOUBLE CLICK TRIGGER
                          onDoubleClick={() => setSelectedJob(app)}
                          // Added select-none so double clicking doesn't highlight the text
                          className="bg-black/60 border border-white/10 rounded-xl p-3 shadow-lg cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-colors select-none"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-white/40 uppercase">{app.company}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-2 leading-tight">{app.role}</h4>
                          <p className="text-[10px] text-white/50 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Double-click for details
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* BOTTOM SECTIONS */}
          <div className="w-full flex flex-col gap-4 px-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-400" /> Online Assessments Tracker
            </h2>
            <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-6 text-center text-white/50 text-sm">
               No OA data yet. Log an assessment to see it here.
            </div>
          </div>

          <div className="w-full flex flex-col gap-4 px-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" /> Resume Versions
            </h2>
             <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-6 text-center text-white/50 text-sm">
               No resumes uploaded. Connect the Resume Manager to view them here.
            </div>
          </div>

        </div>
      </div>

      {/* ADD APPLICATION MODAL (Existing) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in">
          <div className="w-[400px] bg-[#121212] backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Track Application</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddApplication} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-white/50 font-bold mb-1 block">Company Name</label>
                <input required type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} placeholder="e.g. Google, Stripe" className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-400 placeholder-white/40" />
              </div>
              
              <div>
                <label className="text-xs text-white/50 font-bold mb-1 block">Role</label>
                <input required type="text" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} placeholder="e.g. SWE Intern" className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-400 placeholder-white/40" />
              </div>

              <div>
                <label className="text-xs text-white/50 font-bold mb-1 block">Current Stage</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-400 appearance-none">
                  <option value="wishlist">Wishlist</option>
                  <option value="applied">Applied</option>
                  <option value="oa">OA Round</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <button type="submit" className="w-full mt-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-lg transition-colors">
                Save Application
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 NEW: JOB DETAILS FULL MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in p-4">
          <div className="w-full max-w-[700px] max-h-[85vh] bg-[#121212] backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5">
              <div>
                <h2 className="text-2xl font-extrabold text-white leading-tight mb-1">{selectedJob.role}</h2>
                <h3 className="text-lg font-medium text-indigo-400">{selectedJob.company}</h3>
              </div>
              <button 
                onClick={() => setSelectedJob(null)} 
                className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badges Grid */}
            <div className="px-6 pt-5 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full text-sm font-semibold">
                <Briefcase className="w-4 h-4" /> {selectedJob.workType || 'Not specified'}
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-sm font-semibold">
                <MapPin className="w-4 h-4" /> {selectedJob.location || 'Not specified'}
              </div>
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full text-sm font-semibold">
                <DollarSign className="w-4 h-4" /> {selectedJob.stipend || 'Not specified'}
              </div>
            </div>

            {/* Scrollable Description */}
            <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
              <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Job Description</h4>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line font-medium">
                {selectedJob.jobDescription || "No description captured for this listing. Apply directly via the link below."}
              </p>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/10 bg-black/40 flex justify-between items-center">
              {selectedJob.jobLink ? (
                <a 
                  href={selectedJob.jobLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-bold transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> View Original Posting
                </a>
              ) : (
                <span className="text-sm text-white/30 italic">Manually added (No URL)</span>
              )}
              
              <button 
                onClick={() => setSelectedJob(null)} 
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default InternshipPage;