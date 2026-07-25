import React from 'react';
import { Calendar, CheckCircle, Timer } from 'lucide-react';

const InternshipRightPanel = ({ internships = [] }) => {
  // Extract all upcoming events from the internships array
  const upcomingEvents = [];
  let pendingOAsCount = 0;
  let scheduledInterviewsCount = 0;
  
  internships.forEach(app => {
    if (app.onlineAssessments) {
      app.onlineAssessments.forEach(oa => {
        if (oa.status === 'Pending') {
          pendingOAsCount++;
          upcomingEvents.push({ 
            company: app.company, 
            title: `${oa.platform} OA`, 
            date: new Date(oa.date), 
            type: 'OA' 
          });
        }
      });
    }
    if (app.interviews) {
      app.interviews.forEach(interview => {
        if (interview.outcome === 'Scheduled') {
          scheduledInterviewsCount++;
          upcomingEvents.push({ 
            company: app.company, 
            title: interview.round, 
            date: new Date(interview.date), 
            type: 'Interview' 
          });
        }
      });
    }
  });

  // Sort by closest date
  upcomingEvents.sort((a, b) => a.date - b.date);

  return (
    <div className="flex flex-col gap-6 h-full text-white">
      
      <button
        onClick={() => window.location.href = '/study-sessions?module=Internship OS'}
        className="w-full py-3 glass-btn-primary text-xs font-bold flex items-center justify-center gap-2 shrink-0"
      >
        <Timer className="w-4 h-4 text-blue-300" /> Start Internship Prep Session
      </button>

      {/* Active OAs - Stacked, formatted with clean centered earlier layout */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center shrink-0">
        <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Active OAs</span>
        <span className="text-3xl font-extrabold text-blue-400 mt-1 drop-shadow-[0_0_8px_rgba(96,165,250,0.15)]">{pendingOAsCount}</span>
      </div>

      {/* Interviews - Stacked, formatted with clean centered earlier layout */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center shrink-0">
        <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Interviews</span>
        <span className="text-3xl font-extrabold text-blue-400 mt-1 drop-shadow-[0_0_8px_rgba(96,165,250,0.15)]">{scheduledInterviewsCount}</span>
      </div>

      {/* Upcoming Deadlines Widget (Fills remaining height) */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex-1 flex flex-col min-h-0">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-blue-400" /> Upcoming Deadlines
        </h3>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 flex flex-col gap-3">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, idx) => (
              <div key={idx} className="flex flex-col gap-1.5 bg-black/20 p-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-white break-words flex-1">{event.company}</p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 text-blue-400 bg-blue-500/10 border border-blue-500/20 font-mono">
                    {event.date.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                    event.type === 'OA' ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  }`}>
                    {event.type}
                  </span>
                  <p className="text-[10px] text-white/50 break-words flex-1">{event.title}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-white/20 flex flex-col items-center justify-center gap-2 flex-1">
              <CheckCircle className="w-8 h-8 text-white/5" />
              <p className="text-xs">No upcoming tasks.</p>
              <p className="text-[9px] text-white/30">Select or drop a card to wishlist/applied to begin!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default InternshipRightPanel;