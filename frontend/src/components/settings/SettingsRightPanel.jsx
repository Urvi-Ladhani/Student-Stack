import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

const SettingsRightPanel = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch (err) {
      console.error("Right settings panel profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    window.addEventListener('dashboard-data-updated', fetchProfile);
    return () => {
      window.removeEventListener('dashboard-data-updated', fetchProfile);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-white/5 rounded-2xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Account Summary Card */}
      <div className="p-4.5 rounded-2xl light-glass border border-white/5 shadow-md text-center flex flex-col items-center gap-3.5">
        <div className="relative">
          {profile?.avatar ? (
            <img 
              src={profile.avatar} 
              alt={profile.name} 
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-400/40 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-500/15 border-2 border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xl shadow-inner">
              {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'S'}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 p-1 bg-blue-500 rounded-full text-white border border-slate-950">
            <Shield className="w-3.5 h-3.5" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white leading-snug">{profile?.name || 'Student'}</h3>
          <p className="text-[10px] text-white/40 leading-none mt-1 truncate max-w-[240px]">{profile?.email}</p>
        </div>
      </div>

    </div>
  );
};

export default SettingsRightPanel;
