import React from 'react';
import { Calendar, CheckCircle } from 'lucide-react';

const InternshipRightPanel = ({ internships = [] }) => {
  // Extract all upcoming events from the internships array
  const upcomingEvents = [];
  
  internships.forEach(app => {
    if (app.onlineAssessments) {
      app.onlineAssessments.forEach(oa => {
        if (oa.status === 'Pending') {
          upcomingEvents.push({ company: app.company, title: `${oa.platform} OA`, date: new Date(oa.date), type: 'OA' });
        }
      });
    }
    if (app.interviews) {
      app.interviews.forEach(interview => {
        if (interview.outcome === 'Scheduled') {
          upcomingEvents.push({ company: app.company, title: interview.round, date: new Date(interview.date), type: 'Interview' });
        }
      });
    }
  });

  // Sort by closest date
  upcomingEvents.sort((a, b) => a.date - b.date);

  return (
    <div className="w-full h-full p-6 flex flex-col gap-6 overflow-y-auto scrollbar-hide text-white">
      
      <div className="bg-black/20 border border-white/5 rounded-2xl p-5 shadow-lg">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" /> Upcoming Deadlines
        </h3>
        
        <div className="flex flex-col gap-3">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, idx) => (
              <div key={idx} className="flex items-start justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                <div>
                  <p className="text-sm font-bold text-white">{event.company}</p>
                  <p className="text-[10px] text-white/50">{event.title}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${event.type === 'OA' ? 'text-orange-400 bg-orange-400/10' : 'text-purple-400 bg-purple-400/10'}`}>
                  {event.date.toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-white/30 flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8 text-white/10" />
              <p className="text-xs">No upcoming deadlines.</p>
              <p className="text-[10px]">Time to apply to more jobs!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default InternshipRightPanel;