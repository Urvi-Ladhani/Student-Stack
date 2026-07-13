import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import InternshipRightPanel from '../components/InternshipRightPanel';
import { 
  Briefcase, Plus, Activity, Clock, FileText, Code, X, 
  MapPin, DollarSign, ExternalLink, Trash2, UploadCloud,
  CheckCircle2, Sparkles, Target, Calendar, AlertCircle, AlertTriangle, PlaySquare, ChevronDown
} from 'lucide-react';

const KANBAN_COLUMNS = [
  { 
    id: 'applied_pipeline', 
    title: 'Applied / Pipeline', 
    stages: ['wishlist', 'applied'], 
    color: 'border-blue-500 bg-blue-500',
    defaultStage: 'applied'
  },
  { 
    id: 'in_progress', 
    title: 'In Progress (OA & Interview)', 
    stages: ['oa', 'interview'], 
    color: 'border-amber-500 bg-amber-500',
    defaultStage: 'interview'
  },
  { 
    id: 'decisions', 
    title: 'Decisions (Offer & Outcomes)', 
    stages: ['offer', 'rejected'], 
    color: 'border-emerald-500 bg-emerald-500',
    defaultStage: 'offer'
  }
];

const TECH_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'rust', 'go', 'golang', 'ruby', 'php', 'swift', 'kotlin',
  'react', 'angular', 'vue', 'next.js', 'nextjs', 'nuxt', 'svelte', 'remix', 'solidjs', 'jquery', 'bootstrap', 'tailwindcss',
  'node.js', 'nodejs', 'express', 'django', 'flask', 'fastapi', 'spring boot', 'laravel', 'nest.js', 'nestjs', 'asp.net',
  'mongodb', 'postgresql', 'postgres', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'firebase', 'supabase',
  'docker', 'kubernetes', 'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'vercel', 'netlify', 'heroku',
  'git', 'github', 'gitlab', 'ci/cd', 'jenkins', 'actions', 'graphql', 'rest api', 'restful', 'grpc', 'websockets', 'oauth',
  'html', 'css', 'sass', 'redux', 'zustand', 'mobx', 'prisma', 'sequelize', 'mongoose', 'webpack', 'vite', 'npm', 'yarn',
  'data structures', 'algorithms', 'system design', 'microservices', 'serverless', 'unit testing', 'jest', 'cypress', 'mocha'
];

// Reusable custom Glassmorphic Dropdown component
const GlassDropdown = ({ value, options = [], onChange, icon: Icon, placeholder = 'Select option', fullWidth = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'min-w-[140px]'}`}>
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
        className="flex items-center justify-between gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white/80 hover:bg-black/60 transition-all shadow-lg backdrop-blur-md w-full"
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/40 shrink-0 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full mt-1.5 left-0 w-full bg-[#161616]/95 backdrop-blur-3xl border border-white/15 rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden max-h-[220px] overflow-y-auto scrollbar-thin">
            {options.map(opt => (
              <div 
                key={opt.value} 
                onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }} 
                className={`px-4 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                  value === opt.value 
                    ? 'bg-indigo-500/20 text-indigo-400 font-bold border-l-2 border-indigo-500' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                }`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const STAGE_OPTIONS = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'oa', label: 'OA Round' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' }
];

const WORK_TYPE_OPTIONS = [
  { value: 'Remote', label: 'Remote' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'On-site', label: 'On-site' }
];

const OA_PLATFORM_OPTIONS = [
  { value: 'HackerRank', label: 'HackerRank' },
  { value: 'CodeSignal', label: 'CodeSignal' },
  { value: 'LeetCode', label: 'LeetCode' },
  { value: 'Codility', label: 'Codility' },
  { value: 'Other', label: 'Other Platform' }
];

const OA_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Passed', label: 'Passed' },
  { value: 'Failed', label: 'Failed' }
];

const INTERVIEW_OUTCOME_OPTIONS = [
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Passed', label: 'Passed' },
  { value: 'Failed', label: 'Failed' }
];

const InternshipPage = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Resumes states
  const [resumes, setResumes] = useState([]);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeVersionName, setResumeVersionName] = useState('');

  // Form state
  const [formData, setFormData] = useState({ 
    company: '', 
    role: '', 
    status: 'wishlist',
    location: 'Not specified',
    workType: 'Remote',
    stipend: 'Not specified',
    jobLink: '',
    jobDescription: ''
  });
  
  // Selected job details modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'ats' | 'prep'
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    role: '',
    company: '',
    workType: '',
    location: '',
    stipend: '',
    jobLink: '',
    jobDescription: ''
  });

  // ATS scanner state
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [skillsProfile, setSkillsProfile] = useState(() => {
    return localStorage.getItem('user_skills_profile') || 'React, Node.js, Express, MongoDB, JavaScript, Python, HTML, CSS, Git';
  });

  // Prep form inputs
  const [newOAPlatform, setNewOAPlatform] = useState('HackerRank');
  const [newOADate, setNewOADate] = useState('');
  const [newOATimeLimit, setNewOATimeLimit] = useState('');
  
  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundDate, setNewRoundDate] = useState('');
  const [newRoundNotes, setNewRoundNotes] = useState('');

  const [newChecklistItem, setNewChecklistItem] = useState('');

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

  const fetchResumes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/resumes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResumes(data);
      }
    } catch (error) {
      console.error("Failed to fetch resumes", error);
    }
  };

  useEffect(() => {
    fetchInternships();
    fetchResumes();
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
        setFormData({ 
          company: '', 
          role: '', 
          status: 'wishlist',
          location: 'Not specified',
          workType: 'Remote',
          stipend: 'Not specified',
          jobLink: '',
          jobDescription: ''
        });
        fetchInternships();
      }
    } catch (error) {
      console.error("Failed to add internship", error);
    }
  };

  // 3. UNIFIED UPDATE HELPERS (Persist to DB & sync state)
  const updateJobDetails = async (jobId, fieldsToUpdate) => {
    // Optimistic UI updates
    setInternships(prev => prev.map(app => 
      app._id === jobId ? { ...app, ...fieldsToUpdate } : app
    ));
    if (selectedJob && selectedJob._id === jobId) {
      setSelectedJob(prev => ({ ...prev, ...fieldsToUpdate }));
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/internships/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fieldsToUpdate)
      });
      if (res.ok) {
        const data = await res.json();
        // Set final updated state from server response
        setInternships(prev => prev.map(app => 
          app._id === jobId ? data : app
        ));
        if (selectedJob && selectedJob._id === jobId) {
          setSelectedJob(data);
        }
      } else {
        fetchInternships();
      }
    } catch (error) {
      console.error("Failed to update internship details", error);
      fetchInternships();
    }
  };

  // 4. DRAG AND DROP LOGIC (UPDATE STATUS)
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('cardId', id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropColumn = (e, targetColumnId) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    const column = KANBAN_COLUMNS.find(col => col.id === targetColumnId);
    if (column) {
      updateJobDetails(cardId, { status: column.defaultStage });
    }
  };

  // 5. DELETE APPLICATION
  const handleDeleteApplication = async (jobId) => {
    if (!confirm("Are you sure you want to permanently delete this application?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/internships/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedJob(null);
        fetchInternships();
      }
    } catch (error) {
      console.error("Failed to delete application", error);
    }
  };

  // 6. RESUME UPLOAD AND DELETE HANDLERS
  const handleUploadResume = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('resume-file-input');
    if (!fileInput || !fileInput.files[0]) return alert("Please select a PDF file");
    
    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') return alert("Only PDF files are allowed!");

    const formDataObj = new FormData();
    formDataObj.append('resumeFile', file);
    formDataObj.append('versionName', resumeVersionName || file.name.replace('.pdf', ''));

    setUploadingResume(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/resumes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataObj
      });
      if (res.ok) {
        setResumeVersionName('');
        fileInput.value = '';
        fetchResumes();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to upload resume");
      }
    } catch (error) {
      console.error("Failed to upload resume", error);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/resumes/${resumeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchResumes();
      } else {
        alert("Failed to delete resume");
      }
    } catch (error) {
      console.error("Failed to delete resume", error);
    }
  };

  // 7. ATS SCANNER CORE SIMULATION
  const handleATSScan = async () => {
    if (!selectedResumeId) return alert("Please select a resume version first.");
    const resume = resumes.find(r => r._id === selectedResumeId);
    if (!resume) return;

    setScanning(true);
    
    // Simulate scanner latency
    setTimeout(() => {
      try {
        const jd = (selectedJob.jobDescription || '').toLowerCase();
        const userSkills = skillsProfile.toLowerCase().split(',').map(s => s.trim()).filter(s => s.length > 0);

        // Find keywords present in Job Description securely without regex issues
        const jobKeywords = TECH_KEYWORDS.filter(kw => {
          const kwClean = kw.toLowerCase();
          const escapedKw = kwClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          try {
            const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
            return regex.test(jd);
          } catch (e) {
            return jd.includes(kwClean);
          }
        });

        // Find overlaps
        const matched = jobKeywords.filter(kw => {
          const kwClean = kw.toLowerCase();
          return userSkills.some(skill => skill.includes(kwClean) || kwClean.includes(skill));
        });

        const missing = jobKeywords.filter(kw => {
          const kwClean = kw.toLowerCase();
          return !userSkills.some(skill => skill.includes(kwClean) || kwClean.includes(skill));
        });

        // Calculate score
        const basePercentage = jobKeywords.length === 0 ? 0.8 : matched.length / jobKeywords.length;
        const calculatedScore = Math.max(35, Math.min(100, Math.round(basePercentage * 65) + 35));

        // Persist to database
        updateJobDetails(selectedJob._id, {
          atsScore: calculatedScore,
          missingKeywords: missing,
          resumeUsed: resume.versionName
        });
      } catch (err) {
        console.error("ATS calculation error", err);
      } finally {
        setScanning(false);
      }
    }, 1200);
  };

  const saveSkillsProfile = (val) => {
    setSkillsProfile(val);
    localStorage.setItem('user_skills_profile', val);
  };

  // 8. PREP HUB LOGIC: OA, INTERVIEWS & CHECKLISTS
  const handleAddOA = () => {
    if (!newOADate) return alert("Please select a date for the OA");
    const newOA = {
      platform: newOAPlatform,
      date: new Date(newOADate),
      timeLimit: newOATimeLimit || 'Not specified',
      status: 'Pending'
    };
    const updatedOAs = [...(selectedJob.onlineAssessments || []), newOA];
    updateJobDetails(selectedJob._id, { onlineAssessments: updatedOAs });
    
    // Reset inputs
    setNewOADate('');
    setNewOATimeLimit('');
  };

  const handleUpdateOAStatus = (index, status) => {
    const updatedOAs = selectedJob.onlineAssessments.map((oa, idx) => 
      idx === index ? { ...oa, status } : oa
    );
    updateJobDetails(selectedJob._id, { onlineAssessments: updatedOAs });
  };

  const handleRemoveOA = (index) => {
    const updatedOAs = selectedJob.onlineAssessments.filter((_, idx) => idx !== index);
    updateJobDetails(selectedJob._id, { onlineAssessments: updatedOAs });
  };

  const handleAddInterviewRound = () => {
    if (!newRoundName || !newRoundDate) return alert("Please enter round name and date");
    const newRound = {
      round: newRoundName,
      date: new Date(newRoundDate),
      notes: newRoundNotes,
      outcome: 'Scheduled'
    };
    const updatedInterviews = [...(selectedJob.interviews || []), newRound];
    updateJobDetails(selectedJob._id, { interviews: updatedInterviews });

    // Reset inputs
    setNewRoundName('');
    setNewRoundDate('');
    setNewRoundNotes('');
  };

  const handleUpdateInterviewOutcome = (index, outcome) => {
    const updatedInterviews = selectedJob.interviews.map((item, idx) => 
      idx === index ? { ...item, outcome } : item
    );
    updateJobDetails(selectedJob._id, { interviews: updatedInterviews });
  };

  const handleRemoveInterview = (index) => {
    const updatedInterviews = selectedJob.interviews.filter((_, idx) => idx !== index);
    updateJobDetails(selectedJob._id, { interviews: updatedInterviews });
  };

  const handleToggleChecklist = (index) => {
    const updatedChecklist = selectedJob.prepChecklist.map((item, idx) => 
      idx === index ? { ...item, checked: !item.checked } : item
    );
    updateJobDetails(selectedJob._id, { prepChecklist: updatedChecklist });
  };

  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItem = { text: newChecklistItem.trim(), checked: false };
    const updatedChecklist = [...(selectedJob.prepChecklist || []), newItem];
    updateJobDetails(selectedJob._id, { prepChecklist: updatedChecklist });
    setNewChecklistItem('');
  };

  const handleRemoveChecklistItem = (index) => {
    const updatedChecklist = selectedJob.prepChecklist.filter((_, idx) => idx !== index);
    updateJobDetails(selectedJob._id, { prepChecklist: updatedChecklist });
  };

  const handleAutoGenerateChecklist = () => {
    const role = selectedJob.role.toLowerCase();
    const company = selectedJob.company;
    const items = [];
    
    if (role.includes('front') || role.includes('react') || role.includes('ui') || role.includes('web') || role.includes('css') || role.includes('html')) {
      items.push("Review CSS Flexbox, Grid, & responsive viewports");
      items.push("Study React state models & render loops (useEffect, useMemo, useCallback)");
      items.push("Understand JS Event Loop, Closures, Promises, and prototype inheritance");
      items.push("Practice Frontend System Design (rendering patterns, client-side caching)");
    } else if (role.includes('back') || role.includes('node') || role.includes('django') || role.includes('python') || role.includes('db') || role.includes('sql') || role.includes('api') || role.includes('server')) {
      items.push("Review database scaling, indices, transactions, and SQL vs NoSQL structures");
      items.push("Understand RESTful APIs, GraphQL endpoints, and gRPC contracts");
      items.push("Practice backend designs (load balancing, caching with Redis, message brokers)");
      items.push("Review JWT token models and session cookies");
    } else {
      items.push("Practice standard LeetCode data structure patterns (sliding window, two pointers)");
      items.push("Understand space and time complexity bounds (Big O notation) for key algorithms");
      items.push("Prepare structured STAR-format stories for behavioral rounds");
    }
    
    items.push(`Research ${company}'s products, services, and engineering philosophy`);
    items.push("Prepare intelligent questions to ask the interview panel");

    const finalChecklist = items.map(text => ({ text, checked: false }));
    updateJobDetails(selectedJob._id, { prepChecklist: finalChecklist });
  };

  // Metrics Calculation
  const totalApplied = internships.length;
  const interviewing = internships.filter(i => i.status === 'interview').length;
  const offers = internships.filter(i => i.status === 'offer').length;
  
  const responseRate = totalApplied === 0 ? '0%' : Math.round(((totalApplied - internships.filter(i => i.status === 'wishlist' || i.status === 'applied').length) / totalApplied) * 100) + '%';
  const interviewRate = totalApplied === 0 ? '0%' : Math.round((interviewing / totalApplied) * 100) + '%';
  const offerRate = totalApplied === 0 ? '0%' : Math.round((offers / totalApplied) * 100) + '%';

  // Build options list for resume versions dropdown
  const resumeDropdownOptions = [
    { value: '', label: '-- Choose Resume PDF --' },
    ...resumes.map(r => ({ value: r._id, label: r.versionName }))
  ];

  if (loading) return <DashboardLayout><div className="w-full h-full flex items-center justify-center text-white/50 animate-pulse">Loading Pipeline...</div></DashboardLayout>;

  return (
    <DashboardLayout rightPanelContent={<InternshipRightPanel internships={internships} />}>
      <div className="w-full h-full flex flex-col gap-6 animate-in fade-in overflow-hidden pb-6">
        
        {/* HEADER (Only keeps the Add Application button) */}
        <div className="w-full flex justify-end shrink-0 z-20">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>

        {/* MAIN SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-8 relative pb-20">

          {/* DRAG AND DROP KANBAN BOARD */}
          <div className="w-full flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 px-2">
              <Activity className="w-5 h-5 text-indigo-400 animate-pulse" /> Pipeline Kanban
            </h2>
            
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 px-2 select-none">
              {KANBAN_COLUMNS.map((column) => {
                const columnApps = internships.filter(app => column.stages.includes(app.status));
                
                return (
                  <div 
                    key={column.id} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropColumn(e, column.id)}
                    className="w-full h-[550px] bg-black/20 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col overflow-hidden transition-all hover:bg-black/30"
                  >
                    {/* Header with stage color underline */}
                    <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between sticky top-0 z-10">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full border ${column.color}`}></div>
                        <span className="text-sm font-bold text-white/90">{column.title}</span>
                      </div>
                      <span className="text-xs font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{columnApps.length}</span>
                    </div>
                    
                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-hide">
                      {columnApps.length > 0 ? (
                        columnApps.map(app => (
                          <div 
                            key={app._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, app._id)}
                            onClick={() => { 
                              setSelectedJob(app); 
                              setActiveTab('details'); 
                              setIsEditing(false);
                              setEditForm({
                                role: app.role || '',
                                company: app.company || '',
                                workType: app.workType || 'Remote',
                                location: app.location || 'Not specified',
                                stipend: app.stipend || 'Not specified',
                                jobLink: app.jobLink || '',
                                jobDescription: app.jobDescription || ''
                              });
                            }}
                            className="bg-black/50 hover:bg-black/70 border border-white/10 hover:border-indigo-500/50 rounded-xl p-3.5 shadow-lg cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5 relative group"
                          >
                            {/* Card header */}
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider truncate max-w-[130px]">{app.company}</span>
                              
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 capitalize">
                                {app.status === 'wishlist' ? 'Wishlist' : 
                                 app.status === 'applied' ? 'Applied' :
                                 app.status === 'oa' ? 'OA Round' :
                                 app.status === 'interview' ? 'Interview' :
                                 app.status === 'offer' ? 'Offer' : 'Rejected'}
                              </span>
                            </div>
                            
                            {/* Role title */}
                            <h4 className="text-xs font-bold text-white mb-2 leading-tight line-clamp-1">{app.role}</h4>
                            
                            {/* Meta pills */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {app.workType && app.workType !== 'Not specified' && (
                                <span className="text-[9px] font-medium bg-white/5 border border-white/5 text-white/70 px-1.5 py-0.5 rounded-md">
                                  {app.workType}
                                </span>
                              )}
                              {app.location && app.location !== 'Not specified' && (
                                <span className="text-[9px] font-medium bg-white/5 border border-white/5 text-white/60 px-1.5 py-0.5 rounded-md truncate max-w-[110px]" title={app.location}>
                                  {app.location.split(',')[0]}
                                </span>
                              )}
                              {app.stipend && app.stipend !== 'Not specified' && (
                                <span className="text-[9px] font-medium bg-white/5 border border-white/5 text-indigo-300 px-1.5 py-0.5 rounded-md font-mono">
                                  {app.stipend}
                                </span>
                              )}
                              {app.atsScore && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  app.atsScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                                  app.atsScore >= 60 ? 'bg-yellow-500/10 text-yellow-400' :
                                  'bg-rose-500/10 text-rose-400'
                                }`}>
                                  ATS {app.atsScore}%
                                </span>
                              )}
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[9px] text-white/30">
                              <span className="flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                                <Clock className="w-3 h-3 text-white/20 group-hover:text-indigo-400" /> Click for Prep OS
                              </span>

                              {/* Alert states */}
                              <div className="flex items-center gap-1.5">
                                {app.onlineAssessments?.some(oa => oa.status === 'Pending') && (
                                  <span className="flex h-2 w-2 relative" title="OA Pending">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                  </span>
                                )}
                                {app.interviews?.some(i => i.outcome === 'Scheduled') && (
                                  <span className="flex h-2 w-2 relative" title="Interview Scheduled">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20 text-white/20 text-xs italic border border-dashed border-white/5 rounded-xl m-1">
                          Drop applications here
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* DYNAMIC ROW IN THE BODY */}
          <div className="w-full px-2">
            
            {/* FILE RESUME MANAGER */}
            <div className="w-full flex flex-col gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" /> Resume Versions
              </h2>
              
              <div className="bg-black/30 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-xl flex flex-col justify-between h-[320px]">
                
                {/* Upload Form */}
                <form onSubmit={handleUploadResume} className="flex gap-2 items-end shrink-0 mb-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-white/50 font-bold mb-1 block uppercase">Version Name</label>
                    <input 
                      type="text" 
                      value={resumeVersionName} 
                      onChange={(e) => setResumeVersionName(e.target.value)} 
                      placeholder="e.g. Backend Dev Resume" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 placeholder-white/20" 
                    />
                  </div>
                  <div>
                    <input 
                      id="resume-file-input" 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && !resumeVersionName) {
                          setResumeVersionName(file.name.replace('.pdf', ''));
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('resume-file-input').click()}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all h-[34px] flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                  <button 
                    type="submit" 
                    disabled={uploadingResume}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-[0_0_10px_rgba(99,102,241,0.3)] h-[34px]"
                  >
                    {uploadingResume ? '...' : 'Upload'}
                  </button>
                </form>

                {/* Resumes List */}
                <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2">
                  {resumes.length > 0 ? (
                    resumes.map((resume) => (
                      <div key={resume._id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">{resume.versionName}</p>
                            <p className="text-[9px] text-white/40">Uploaded {new Date(resume.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a 
                            href={`http://localhost:5000${resume.fileUrl}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                            title="View PDF"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button 
                            onClick={() => handleDeleteResume(resume._id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 hover:text-rose-300 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-white/20 text-xs italic border border-dashed border-white/5 rounded-xl">
                      No resumes uploaded. Upload a resume version to analyze match rates.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ADD APPLICATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="w-[500px] bg-[#121212] backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Track Application Manual Entry</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddApplication} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 font-bold mb-1 block">Company Name</label>
                  <input required type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} placeholder="Google, Stripe" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-400 placeholder-white/20" />
                </div>
                
                <div>
                  <label className="text-xs text-white/50 font-bold mb-1 block">Role</label>
                  <input required type="text" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} placeholder="Software Engineer Intern" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-400 placeholder-white/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 font-bold mb-1 block">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="San Francisco, CA" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-400 placeholder-white/20" />
                </div>
                
                <div>
                  <label className="text-xs text-white/50 font-bold mb-1 block">Stipend</label>
                  <input type="text" value={formData.stipend} onChange={(e) => setFormData({...formData, stipend: e.target.value})} placeholder="$50/hr or Unpaid" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-400 placeholder-white/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 font-bold mb-1 block">Work Type</label>
                  <GlassDropdown 
                    value={formData.workType} 
                    options={WORK_TYPE_OPTIONS} 
                    onChange={(val) => setFormData({...formData, workType: val})} 
                    fullWidth 
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 font-bold mb-1 block">Current Stage</label>
                  <GlassDropdown 
                    value={formData.status} 
                    options={STAGE_OPTIONS} 
                    onChange={(val) => setFormData({...formData, status: val})} 
                    fullWidth 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 font-bold mb-1 block">Job Posting URL (Optional)</label>
                <input type="url" value={formData.jobLink} onChange={(e) => setFormData({...formData, jobLink: e.target.value})} placeholder="https://linkedin.com/..." className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-400 placeholder-white/20" />
              </div>



              <button type="submit" className="w-full mt-2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-lg transition-colors">
                Save Application
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED JOB WORKSPACE MODAL (Tabbed Interface) */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in p-4">
          <div className="w-full max-w-[850px] h-[85vh] bg-[#121212] backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header section with Glass details (editable) */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5">
              {isEditing ? (
                <div className="flex flex-col gap-2 w-full max-w-[500px]">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Company Name</label>
                    <input 
                      type="text" 
                      value={editForm.company} 
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} 
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Job Role / Title</label>
                    <input 
                      type="text" 
                      value={editForm.role} 
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} 
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 w-full font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <span>{selectedJob.company}</span>
                    <span>•</span>
                    <span>{selectedJob.status.toUpperCase()}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white leading-tight">{selectedJob.role}</h2>
                </div>
              )}
              <div className="flex items-center gap-3 shrink-0">
                {isEditing ? (
                  <>
                    <button 
                      onClick={async () => {
                        await updateJobDetails(selectedJob._id, editForm);
                        setIsEditing(false);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          role: selectedJob.role || '',
                          company: selectedJob.company || '',
                          workType: selectedJob.workType || 'Remote',
                          location: selectedJob.location || 'Not specified',
                          stipend: selectedJob.stipend || 'Not specified',
                          jobLink: selectedJob.jobLink || '',
                          jobDescription: selectedJob.jobDescription || ''
                        });
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setEditForm({
                        role: selectedJob.role || '',
                        company: selectedJob.company || '',
                        workType: selectedJob.workType || 'Remote',
                        location: selectedJob.location || 'Not specified',
                        stipend: selectedJob.stipend || 'Not specified',
                        jobLink: selectedJob.jobLink || '',
                        jobDescription: selectedJob.jobDescription || ''
                      });
                      setIsEditing(true);
                    }}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                  >
                    Edit Details
                  </button>
                )}
                <button 
                  onClick={() => handleDeleteApplication(selectedJob._id)}
                  className="text-rose-400/70 hover:text-rose-400 transition-colors bg-white/5 hover:bg-rose-500/10 p-2 rounded-full border border-white/10 hover:border-rose-500/20"
                  title="Delete Application"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedJob(null)} 
                  className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full border border-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TAB SELECTOR HEADER */}
            <div className="bg-white/5 px-6 border-b border-white/10 flex gap-4">
              <button 
                onClick={() => setActiveTab('details')}
                className={`py-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'details' ? 'border-indigo-400 text-white' : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                Overview & Description
              </button>
              <button 
                onClick={() => setActiveTab('ats')}
                className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'ats' ? 'border-indigo-400 text-white' : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                <Target className="w-3.5 h-3.5" /> ATS Matcher
              </button>
              <button 
                onClick={() => setActiveTab('prep')}
                className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'prep' ? 'border-indigo-400 text-white' : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Prep Hub
              </button>
            </div>

            {/* TAB BODIES */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              
              {/* TAB 1: DETAILS */}
              {activeTab === 'details' && (
                <div className="flex flex-col gap-5 h-full">
                  
                  {/* Spacious 3-column parameters layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                    
                    {/* Status selection widget */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[84px]">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Status Stage</span>
                      <div className="mt-1">
                        <GlassDropdown 
                          value={isEditing ? editForm.status || selectedJob.status : selectedJob.status} 
                          options={STAGE_OPTIONS} 
                          onChange={(val) => {
                            if (isEditing) {
                              setEditForm({ ...editForm, status: val });
                            } else {
                              updateJobDetails(selectedJob._id, { status: val });
                            }
                          }} 
                          fullWidth 
                        />
                      </div>
                    </div>

                    {/* Work type display widget */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[84px]">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Work Type</span>
                      {isEditing ? (
                        <div className="mt-1">
                          <GlassDropdown 
                            value={editForm.workType} 
                            options={WORK_TYPE_OPTIONS} 
                            onChange={(val) => setEditForm({ ...editForm, workType: val })} 
                            fullWidth 
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-white font-bold mt-1.5">{selectedJob.workType || 'Not specified'}</span>
                      )}
                    </div>

                    {/* ATS match score display widget */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[84px] overflow-hidden">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">ATS Score</span>
                      <span className={`text-xs font-extrabold w-fit px-3 py-1 mt-1 rounded-full ${
                        selectedJob.atsScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        selectedJob.atsScore >= 60 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        selectedJob.atsScore ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-white/30 bg-white/5'
                      }`}>
                        {selectedJob.atsScore ? `${selectedJob.atsScore}%` : 'Not Scanned'}
                      </span>
                    </div>

                    {/* Location display widget */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[84px] md:col-span-2 overflow-hidden">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Location</span>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.location} 
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} 
                          className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 w-full mt-1"
                        />
                      ) : (
                        <span className="text-sm text-white font-bold flex items-center gap-2 mt-1.5 truncate" title={selectedJob.location}>
                          <MapPin className="w-4 h-4 text-indigo-400 shrink-0" /> {selectedJob.location || 'Not specified'}
                        </span>
                      )}
                    </div>

                    {/* Stipend display widget */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[84px] overflow-hidden">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Stipend</span>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editForm.stipend} 
                          onChange={(e) => setEditForm({ ...editForm, stipend: e.target.value })} 
                          className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 w-full font-mono mt-1"
                        />
                      ) : (
                        <span className="text-sm text-emerald-400 font-bold font-mono truncate mt-1.5" title={selectedJob.stipend}>
                          {selectedJob.stipend || 'Not specified'}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Job Posting actions Row (If link exists or editing) */}
                  {isEditing ? (
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-1 w-full shrink-0">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Job Posting URL</span>
                      <input 
                        type="url" 
                        value={editForm.jobLink} 
                        onChange={(e) => setEditForm({ ...editForm, jobLink: e.target.value })} 
                        placeholder="https://linkedin.com/jobs/view/..." 
                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 w-full"
                      />
                    </div>
                  ) : (
                    selectedJob.jobLink && (
                      <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 flex items-center justify-between shrink-0">
                        <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Source posting URL:</span>
                        <a 
                          href={selectedJob.jobLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all animate-pulse"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Original Listing
                        </a>
                      </div>
                    )
                  )}

                 </div>
              )}

              {/* TAB 2: ATS SCANNER & OPTIMIZER */}
              {activeTab === 'ats' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Skill profile editor and resume selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 border border-white/5 p-5 rounded-2xl">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] text-white/50 font-bold uppercase tracking-widest">1. Select Resume Version</label>
                      <GlassDropdown 
                        value={selectedResumeId} 
                        options={resumeDropdownOptions} 
                        onChange={(val) => setSelectedResumeId(val)} 
                        fullWidth 
                      />
                      <p className="text-[9px] text-white/30 italic">Upload resumes in the Resume versions section below the board.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] text-white/50 font-bold uppercase tracking-widest">2. Core Skills Profile (For ATS scan)</label>
                      <input 
                        type="text"
                        value={skillsProfile}
                        onChange={(e) => saveSkillsProfile(e.target.value)}
                        placeholder="React, Node.js, Express, MongoDB, JavaScript, Python"
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 placeholder-white/20 h-[38px]"
                      />
                      <p className="text-[9px] text-white/30 italic">List your skills (comma separated) to check matching keywords in job description.</p>
                    </div>

                    <button 
                      onClick={handleATSScan}
                      disabled={scanning || !selectedResumeId}
                      className="md:col-span-2 mt-2 w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                    >
                      {scanning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Parsing & Matching Keywords against Job description...
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4" /> Run ATS Scanner Simulator
                        </>
                      )}
                    </button>
                  </div>

                  {/* SCAN RESULT AREA - VISUALLY ENHANCED */}
                  {selectedJob.atsScore !== null && selectedJob.atsScore !== undefined && (
                    <div className="flex flex-col md:flex-row gap-6 bg-white/5 border border-white/5 p-6 rounded-2xl animate-in fade-in relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none"></div>

                      {/* Circular Gauge & Quality Level */}
                      <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-3 border-b md:border-b-0 md:border-r border-white/15">
                        <div className="relative w-36 h-36 flex items-center justify-center">
                          <svg viewBox="0 0 144 144" className="w-36 h-36 transform -rotate-90">
                            <circle cx="72" cy="72" r="62" stroke="rgba(255,255,255,0.03)" strokeWidth="10" fill="transparent" />
                            <circle cx="72" cy="72" r="62" 
                              stroke={selectedJob.atsScore >= 80 ? "#10b981" : selectedJob.atsScore >= 60 ? "#f59e0b" : "#ef4444"} 
                              strokeWidth="10" 
                              fill="transparent" 
                              strokeDasharray="389.5" 
                              strokeDashoffset={389.5 - (389.5 * selectedJob.atsScore) / 100}
                              strokeLinecap="round"
                              className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-extrabold text-white leading-none">{selectedJob.atsScore}%</span>
                            <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mt-1.5">Match score</p>
                          </div>
                        </div>
                        
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mt-5 border ${
                          selectedJob.atsScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          selectedJob.atsScore >= 60 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {selectedJob.atsScore >= 80 ? "Excellent Fit" : 
                           selectedJob.atsScore >= 60 ? "Good Fit" : 
                           "Action Required"}
                        </span>
                      </div>

                      {/* Keyword lists & Recommendations */}
                      <div className="w-full md:w-2/3 flex flex-col gap-5 justify-between">
                        
                        {/* Selected Resume profile summary card */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[8px] text-white/30 uppercase tracking-wider block font-bold">Scanned Version</span>
                              <span className="text-xs font-bold text-white/95">{selectedJob.resumeUsed}</span>
                            </div>
                          </div>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">Checked</span>
                        </div>

                        {/* Keyword status splits */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Matched Keywords
                            </h4>
                            <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto scrollbar-thin pr-1">
                              {TECH_KEYWORDS.filter(kw => {
                                const jdClean = (selectedJob.jobDescription || '').toLowerCase();
                                const kwClean = kw.toLowerCase();
                                const escapedKw = kwClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                                const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
                                const userSkills = skillsProfile.toLowerCase().split(',').map(s => s.trim());
                                const existsInJd = regex.test(jdClean) || jdClean.includes(kwClean);
                                return existsInJd && userSkills.some(skill => skill.includes(kwClean) || kwClean.includes(skill));
                              }).map(kw => (
                                <span key={kw} className="text-[9px] font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-md capitalize">{kw}</span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-extrabold text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4" /> Missing Keywords
                            </h4>
                            <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto scrollbar-thin pr-1">
                              {selectedJob.missingKeywords && selectedJob.missingKeywords.length > 0 ? (
                                selectedJob.missingKeywords.map(kw => (
                                  <span key={kw} className="text-[9px] font-bold text-rose-400 bg-rose-500/5 border border-rose-500/10 px-2 py-0.5 rounded-md capitalize">{kw}</span>
                                ))
                              ) : (
                                <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% matched!
                                </div>
                              )}
                            </div>
                          </div>
                        </div>



                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: PREP HUB */}
              {activeTab === 'prep' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Online Assessments & Interviews Section - Fitted beautifully with full vertical height */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                    
                    {/* OA LOGGER */}
                    <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 min-h-[420px] h-[420px]">
                      <div>
                        <h3 className="text-sm font-bold text-blue-400">
                          Online Assessments (OA)
                        </h3>
                        <p className="text-[10px] text-white/40 mt-0.5">Log cognitive & technical assessments.</p>
                      </div>
                      
                      {/* Log form */}
                      <div className="flex flex-col gap-2.5 bg-black/20 border border-white/5 p-4 rounded-xl shrink-0">
                        <div className="grid grid-cols-2 gap-2.5 items-center">
                          <GlassDropdown 
                            value={newOAPlatform} 
                            options={OA_PLATFORM_OPTIONS} 
                            onChange={(val) => setNewOAPlatform(val)} 
                            fullWidth 
                          />
                          <input 
                            type="text" 
                            value={newOATimeLimit}
                            onChange={(e) => setNewOATimeLimit(e.target.value)}
                            placeholder="Limit (e.g. 90m)" 
                            className="w-full min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 placeholder-white/20 h-[38px]" 
                          />
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="date" 
                            value={newOADate}
                            onChange={(e) => setNewOADate(e.target.value)}
                            className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer [color-scheme:dark] h-[34px]" 
                          />
                          <button 
                            type="button"
                            onClick={handleAddOA}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors h-[34px] shrink-0 whitespace-nowrap min-w-[90px]"
                          >
                            Add OA
                          </button>
                        </div>
                      </div>

                      {/* OA List */}
                      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-2.5 pr-1">
                        {selectedJob.onlineAssessments && selectedJob.onlineAssessments.length > 0 ? (
                          selectedJob.onlineAssessments.map((oa, index) => (
                            <div key={index} className="bg-black/30 border border-white/5 rounded-xl p-3.5 flex items-center justify-between text-xs hover:border-white/10 transition-all shrink-0">
                              <div className="min-w-0 flex-1 pr-2">
                                <span className="font-bold text-white block truncate">{oa.platform}</span>
                                <span className="text-[10px] text-white/40 block mt-0.5">Date: {new Date(oa.date).toLocaleDateString()} | Limit: {oa.timeLimit}</span>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0">
                                <GlassDropdown 
                                  value={oa.status} 
                                  options={OA_STATUS_OPTIONS} 
                                  onChange={(val) => handleUpdateOAStatus(index, val)} 
                                />
                                <button 
                                  onClick={() => handleRemoveOA(index)}
                                  className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-white/30 hover:text-rose-400 rounded transition-colors border border-white/5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-white/30 text-center py-10 italic border border-dashed border-white/5 rounded-xl flex-1 flex items-center justify-center">
                            No Online Assessments logged yet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* INTERVIEW ROUND LOGGER */}
                    <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 min-h-[420px] h-[420px]">
                      <div>
                        <h3 className="text-sm font-bold text-blue-400">
                          Interview Rounds
                        </h3>
                        <p className="text-[10px] text-white/40 mt-0.5">Log scheduled interviews and feedback details.</p>
                      </div>
                      
                      {/* Log form */}
                      <div className="flex flex-col gap-2.5 bg-black/20 border border-white/5 p-4 rounded-xl shrink-0">
                        <div className="grid grid-cols-2 gap-2.5">
                          <input 
                            type="text" 
                            value={newRoundName}
                            onChange={(e) => setNewRoundName(e.target.value)}
                            placeholder="Round (e.g. System Design)" 
                            className="w-full min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 placeholder-white/20 h-[34px]" 
                          />
                          <input 
                            type="date" 
                            value={newRoundDate}
                            onChange={(e) => setNewRoundDate(e.target.value)}
                            className="w-full min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer [color-scheme:dark] h-[34px]" 
                          />
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newRoundNotes}
                            onChange={(e) => setNewRoundNotes(e.target.value)}
                            placeholder="Round questions or notes..." 
                            className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 placeholder-white/20 h-[34px]" 
                          />
                          <button 
                            type="button"
                            onClick={handleAddInterviewRound}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors h-[34px] shrink-0 whitespace-nowrap min-w-[90px]"
                          >
                            Add Round
                          </button>
                        </div>
                      </div>

                      {/* Interviews List */}
                      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-2.5 pr-1">
                        {selectedJob.interviews && selectedJob.interviews.length > 0 ? (
                          selectedJob.interviews.map((round, index) => (
                            <div key={index} className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-start justify-between text-xs hover:border-white/10 transition-all shrink-0">
                              <div className="flex-1 min-w-0 pr-2">
                                <span className="font-bold text-white block truncate">{round.round}</span>
                                <span className="text-[9px] text-white/40 block mt-0.5">Date: {new Date(round.date).toLocaleDateString()}</span>
                                {round.notes && <p className="text-[9px] text-white/50 bg-white/5 p-2 rounded mt-1.5 leading-normal italic font-medium">{round.notes}</p>}
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0">
                                <GlassDropdown 
                                  value={round.outcome} 
                                  options={INTERVIEW_OUTCOME_OPTIONS} 
                                  onChange={(val) => handleUpdateInterviewOutcome(index, val)} 
                                />
                                <button 
                                  onClick={() => handleRemoveInterview(index)}
                                  className="p-1.5 bg-white/5 hover:bg-rose-500/20 text-white/30 hover:text-rose-400 rounded transition-colors border border-white/5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-white/30 text-center py-10 italic border border-dashed border-white/5 rounded-xl flex-1 flex items-center justify-center">
                            No interview rounds scheduled yet.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* Footer with basic buttons */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
              <button 
                onClick={() => setSelectedJob(null)} 
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors border border-white/10"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default InternshipPage;