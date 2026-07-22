import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Sliders, Link, AlertTriangle, 
  Upload, Trash2, Eye, EyeOff, Save, ShieldAlert,
  LogOut, CheckCircle2, X, Timer
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const SettingsPage = ({ user, onUserUpdate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // 1. Profile & Account states
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    university: '',
    degree: '',
    graduationYear: '',
    bio: '',
    avatar: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');

  // 2. Password states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // 3. Connected Accounts states
  const [connectedProvider, setConnectedProvider] = useState('Email & Password');

  // 4. Preferences & Study Sessions states
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    defaultStudySessionDuration: 25,
    defaultDashboardModule: 'Tasks',
    defaultLandingPage: '/dashboard',
    overdueTaskAlert: true,
    revisionDue: true,
    applicationDeadline: true
  });

  const [studySettings, setStudySettings] = useState({
    defaultSessionType: 'timer',
    defaultTimerDuration: 25,
    breakReminder: true,
    breakReminderMinutes: 5,
    autoStartNextSession: false,
    playSoundOnCompletion: true,
    desktopNotification: true,
    showTimerInDashboard: true,
    autoSaveSession: true,
    enableFocusModeByDefault: false,
    weeklyStudyGoalHours: 20,
    dailyStudyGoalHours: 4,
    timezone: 'UTC'
  });

  // 5. Danger zone modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Fetch fresh user profile on mount
  useEffect(() => {
    const fetchFreshProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const freshUser = await res.json();
          
          setProfileData({
            name: freshUser.name || '',
            email: freshUser.email || '',
            university: freshUser.university || '',
            degree: freshUser.degree || '',
            graduationYear: freshUser.graduationYear || '',
            bio: freshUser.bio || '',
            avatar: freshUser.avatar || ''
          });
          setAvatarPreview(freshUser.avatar || '');

          setConnectedProvider(freshUser.isGoogleConnected ? 'Google connected' : 'Email & Password');

          const settings = freshUser.settings || {};
          setPreferences({
            theme: settings.theme || 'dark',
            language: settings.language || 'en',
            timezone: settings.timezone || 'UTC',
            dateFormat: settings.dateFormat || 'MM/DD/YYYY',
            defaultStudySessionDuration: settings.defaultStudySessionDuration || 25,
            defaultDashboardModule: settings.defaultDashboardModule || 'Tasks',
            defaultLandingPage: settings.defaultLandingPage || '/dashboard',
            overdueTaskAlert: settings.notificationPreferences?.overdueTaskAlert ?? true,
            revisionDue: settings.notificationPreferences?.revisionDue ?? true,
            applicationDeadline: settings.notificationPreferences?.applicationDeadline ?? true
          });

          const ss = settings.studySessionSettings || {};
          setStudySettings({
            defaultSessionType: ss.defaultSessionType || 'timer',
            defaultTimerDuration: ss.defaultTimerDuration || 25,
            breakReminder: ss.breakReminder ?? true,
            breakReminderMinutes: ss.breakReminderMinutes || 5,
            autoStartNextSession: ss.autoStartNextSession ?? false,
            playSoundOnCompletion: ss.playSoundOnCompletion ?? true,
            desktopNotification: ss.desktopNotification ?? true,
            showTimerInDashboard: ss.showTimerInDashboard ?? true,
            autoSaveSession: ss.autoSaveSession ?? true,
            enableFocusModeByDefault: ss.enableFocusModeByDefault ?? false,
            weeklyStudyGoalHours: ss.weeklyStudyGoalHours || 20,
            dailyStudyGoalHours: ss.dailyStudyGoalHours || 4,
            timezone: ss.timezone || 'UTC'
          });
        }
      } catch (err) {
        console.error("Failed to load user settings profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFreshProfile();
  }, []);

  // Prompt before navigating away on unsaved edits
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Image upload handling
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Type validation
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Unsupported format. Please upload JPG, PNG, or WEBP.', 'error');
      return;
    }

    // Size check: limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be smaller than 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setProfileData(prev => ({ ...prev, avatar: reader.result }));
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setProfileData(prev => ({ ...prev, avatar: '' }));
    setIsDirty(true);
  };

  // Profile Save
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.name,
          university: profileData.university,
          degree: profileData.degree,
          graduationYear: profileData.graduationYear,
          bio: profileData.bio,
          avatar: profileData.avatar
        })
      });

      if (res.ok) {
        const data = await res.json();
        onUserUpdate(data.user);
        setIsDirty(false);
        showToast('Profile settings saved successfully.');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Preferences Save
  const handlePreferencesSave = async () => {
    setSaveLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          settings: {
            theme: preferences.theme,
            language: preferences.language,
            timezone: preferences.timezone,
            dateFormat: preferences.dateFormat,
            defaultStudySessionDuration: preferences.defaultStudySessionDuration,
            defaultDashboardModule: preferences.defaultDashboardModule,
            defaultLandingPage: preferences.defaultLandingPage,
            notificationPreferences: {
              overdueTaskAlert: preferences.overdueTaskAlert,
              revisionDue: preferences.revisionDue,
              applicationDeadline: preferences.applicationDeadline
            },
            studySessionSettings: studySettings
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        onUserUpdate(data.user);
        setIsDirty(false);
        showToast('System preferences saved successfully.');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to save preferences.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Password Update Save
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassError("Passwords do not match.");
      return;
    }

    // Min length and number regex
    if (passwordData.newPassword.length < 6 || !/\d/.test(passwordData.newPassword)) {
      setPassError("New password must be at least 6 characters and contain a number.");
      return;
    }

    setSaveLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (res.ok) {
        setPassSuccess("Password updated successfully.");
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showToast('Password changed.');
      } else {
        const err = await res.json();
        setPassError(err.message || 'Incorrect password.');
      }
    } catch (err) {
      setPassError('Connection error.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Logout all devices
  const handleLogoutAllDevices = async () => {
    if (!window.confirm("This will log you out from all other devices. Proceed?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auth/logout-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast("Logged out of all sessions. Re-authenticating this device...");
        setTimeout(() => {
          onLogout();
        }, 1500);
      } else {
        showToast("Failed to terminate other sessions.", 'error');
      }
    } catch (err) {
      showToast("Connection error.", 'error');
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert("Please type 'DELETE' to confirm deletion.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Account deleted. We are sorry to see you go!");
        onLogout();
      } else {
        showToast("Account deletion failed.", 'error');
      }
    } catch (err) {
      showToast("Connection error.", 'error');
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="w-full h-full flex flex-col gap-6 animate-pulse p-6">
        <div className="h-10 w-48 bg-white/10 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-[200px] bg-white/5 rounded-2xl md:col-span-1"></div>
          <div className="h-[400px] bg-white/5 rounded-2xl md:col-span-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-screen pb-24 relative">
      


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT TAB BAR */}
        <aside className="lg:col-span-1 flex flex-col gap-2 p-1.5 rounded-2xl light-glass border border-white/5 shadow-xl">
          {[
            { id: 'profile', label: 'Profile & Account', icon: User },
            { id: 'security', label: 'Security OS', icon: Lock },
            { id: 'preferences', label: 'Preferences', icon: Sliders },
            { id: 'studySessions', label: 'Study Sessions', icon: Timer }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (isDirty) {
                  if (!window.confirm("You have unsaved changes. Discard them?")) return;
                  setIsDirty(false);
                }
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all hover-lift-scale text-left ${
                activeTab === tab.id 
                  ? 'bg-white/10 text-white shadow border border-white/5' 
                  : 'text-white/55 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className={`w-4.5 h-4.5 ${tab.color || 'text-blue-400'}`} />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* RIGHT ACTIVE TAB SCREEN */}
        <main className="lg:col-span-3 p-6 rounded-2xl light-glass border border-white/5 shadow-2xl">
          
          {/* TAB 1: PROFILE & ACCOUNT */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              
              {/* Profile Image Row */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5">
                <div className="relative">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar Preview" 
                      className="w-24 h-24 rounded-full object-cover border-2 border-blue-400/35 shadow-xl bg-slate-900"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-500/15 border-2 border-blue-500/30 text-blue-400 flex items-center justify-center font-extrabold text-2xl shadow-inner">
                      {profileData.name ? profileData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'S'}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <label className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-300 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow">
                      <Upload className="w-4 h-4" /> Upload Avatar
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp" 
                        onChange={handleAvatarChange} 
                        className="hidden" 
                      />
                    </label>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-white/40">Supported formats: JPG, PNG, WEBP. Max size: 2MB.</p>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={profileData.name} 
                    onChange={e => { setProfileData({ ...profileData, name: e.target.value }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    disabled 
                    value={profileData.email} 
                    className="w-full glass-input px-4 py-3 text-sm text-white/40 bg-black/35 cursor-not-allowed border-white/5"
                    title="Changing emails requires system verification (read-only)"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">University / College</label>
                  <input 
                    type="text" 
                    value={profileData.university} 
                    onChange={e => { setProfileData({ ...profileData, university: e.target.value }); setIsDirty(true); }}
                    placeholder="Enter university name..."
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Degree Program</label>
                  <input 
                    type="text" 
                    value={profileData.degree} 
                    onChange={e => { setProfileData({ ...profileData, degree: e.target.value }); setIsDirty(true); }}
                    placeholder="e.g. Bachelor of Science"
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Graduation Year</label>
                  <input 
                    type="text" 
                    value={profileData.graduationYear} 
                    onChange={e => { setProfileData({ ...profileData, graduationYear: e.target.value }); setIsDirty(true); }}
                    placeholder="e.g. 2026"
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Short Bio (optional)</label>
                <textarea 
                  value={profileData.bio} 
                  onChange={e => { setProfileData({ ...profileData, bio: e.target.value }); setIsDirty(true); }}
                  placeholder="Jot down a quick bio..."
                  rows="3"
                  className="w-full glass-input px-4 py-3 text-sm text-white resize-none"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saveLoading}
                  className="px-6 py-3 glass-btn-primary text-xs flex items-center gap-2 font-bold shadow-lg"
                >
                  <Save className="w-4 h-4" /> {saveLoading ? 'Saving...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSave} className="space-y-6">
              
              <div className="border-b border-white/5 pb-4 mb-4">
                <h3 className="text-sm font-bold text-white mb-1">Update Password credentials</h3>
                <p className="text-xs text-white/40">Ensure your new password uses numbers and character combinations safely.</p>
              </div>

              {passError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2.5">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0" /> {passError}
                </div>
              )}
              {passSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2.5">
                  <CheckCircle2 className="w-4.5 h-4.5 shrink-0" /> {passSuccess}
                </div>
              )}

              <div className="space-y-4 max-w-md">
                
                {/* Current password */}
                {connectedProvider !== 'Google connected' && (
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showPass.current ? 'text' : 'password'} 
                        required 
                        value={passwordData.currentPassword}
                        onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full glass-input pl-4 pr-10 py-3 text-sm text-white"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPass.current ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* New password */}
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPass.new ? 'text' : 'password'} 
                      required 
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Min. 6 chars with a number..."
                      className="w-full glass-input pl-4 pr-10 py-3 text-sm text-white"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass({ ...showPass, new: !showPass.new })}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPass.new ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showPass.confirm ? 'text' : 'password'} 
                      required 
                      value={passwordData.confirmPassword}
                      onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full glass-input pl-4 pr-10 py-3 text-sm text-white"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPass.confirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saveLoading}
                  className="px-6 py-3 glass-btn-primary text-xs flex items-center gap-2 font-bold shadow-lg"
                >
                  <Save className="w-4 h-4" /> {saveLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SYSTEM & PRODUCTIVITY PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              
              <div className="border-b border-white/5 pb-4 mb-4">
                <h3 className="text-sm font-bold text-white mb-1">Preferences & Workspace</h3>
                <p className="text-xs text-white/40">Adjust application default settings, themes, and study session intervals.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Interface Theme</label>
                  <select 
                    value={preferences.theme} 
                    onChange={e => { setPreferences({ ...preferences, theme: e.target.value }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white bg-slate-950 outline-none"
                  >
                    <option value="dark" className="bg-slate-900">Dark Mode (Default)</option>
                    <option value="light" className="bg-slate-900" disabled>Light Mode (Coming Soon)</option>
                    <option value="system" className="bg-slate-900">System Defaults</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Language</label>
                  <select 
                    value={preferences.language} 
                    onChange={e => { setPreferences({ ...preferences, language: e.target.value }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white bg-slate-950 outline-none"
                  >
                    <option value="en" className="bg-slate-900">English (US)</option>
                    <option value="es" className="bg-slate-900" disabled>Español (Coming Soon)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Default Study Session (Min)</label>
                  <input 
                    type="number" 
                    value={preferences.defaultStudySessionDuration} 
                    onChange={e => { setPreferences({ ...preferences, defaultStudySessionDuration: Number(e.target.value) }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Default Landing Page</label>
                  <select 
                    value={preferences.defaultLandingPage} 
                    onChange={e => { setPreferences({ ...preferences, defaultLandingPage: e.target.value }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white bg-slate-950 outline-none"
                  >
                    <option value="/dashboard" className="bg-slate-900">Dashboard</option>
                    <option value="/tasks" className="bg-slate-900">Task OS</option>
                    <option value="/dsa" className="bg-slate-900">DSA OS</option>
                    <option value="/notes" className="bg-slate-900">Notes OS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Time Zone</label>
                  <input 
                    type="text" 
                    value={preferences.timezone} 
                    onChange={e => { setPreferences({ ...preferences, timezone: e.target.value }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Date Format</label>
                  <select 
                    value={preferences.dateFormat} 
                    onChange={e => { setPreferences({ ...preferences, dateFormat: e.target.value }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white bg-slate-950 outline-none"
                  >
                    <option value="MM/DD/YYYY" className="bg-slate-900">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY" className="bg-slate-900">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD" className="bg-slate-900">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Notification Preferences</label>
                <div className="space-y-2.5">
                  {[
                    { key: 'overdueTaskAlert', label: 'Overdue tasks warnings' },
                    { key: 'revisionDue', label: 'DSA Problem revision reminders' },
                    { key: 'applicationDeadline', label: 'Internship deadline notifications' }
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-3.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences[opt.key]}
                        onChange={e => { setPreferences({ ...preferences, [opt.key]: e.target.checked }); setIsDirty(true); }}
                        className="rounded bg-black/40 border-white/10 text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                      />
                      <span className="text-xs text-white/70 font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button 
                  onClick={handlePreferencesSave}
                  disabled={saveLoading}
                  className="px-6 py-3 glass-btn-primary text-xs flex items-center gap-2 font-bold shadow-lg"
                >
                  <Save className="w-4 h-4" /> {saveLoading ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
          </div>
          )}

          {/* TAB 4: STUDY SESSIONS CONFIGURATION */}
          {activeTab === 'studySessions' && (
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4 mb-4">
                <h3 className="text-sm font-bold text-white mb-1">Study Sessions Engine Configuration</h3>
                <p className="text-xs text-white/40">Configure default timers, study goals, notifications, break reminders, and focus mode.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Default Session Type</label>
                  <select
                    value={studySettings.defaultSessionType}
                    onChange={e => { setStudySettings({ ...studySettings, defaultSessionType: e.target.value }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white bg-slate-950 outline-none"
                  >
                    <option value="timer" className="bg-slate-900">Timer Mode (Countdown)</option>
                    <option value="stopwatch" className="bg-slate-900">Stopwatch Mode (Countup)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Default Timer Duration (Minutes)</label>
                  <input
                    type="number"
                    value={studySettings.defaultTimerDuration}
                    onChange={e => { setStudySettings({ ...studySettings, defaultTimerDuration: Number(e.target.value) }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Daily Study Goal (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={studySettings.dailyStudyGoalHours}
                    onChange={e => { setStudySettings({ ...studySettings, dailyStudyGoalHours: Number(e.target.value) }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Weekly Study Goal (Hours)</label>
                  <input
                    type="number"
                    step="1"
                    value={studySettings.weeklyStudyGoalHours}
                    onChange={e => { setStudySettings({ ...studySettings, weeklyStudyGoalHours: Number(e.target.value) }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Timezone</label>
                  <input
                    type="text"
                    value={studySettings.timezone}
                    onChange={e => { setStudySettings({ ...studySettings, timezone: e.target.value }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Break Reminder (Minutes)</label>
                  <input
                    type="number"
                    value={studySettings.breakReminderMinutes}
                    onChange={e => { setStudySettings({ ...studySettings, breakReminderMinutes: Number(e.target.value) }); setIsDirty(true); }}
                    className="w-full glass-input px-4 py-3 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Automation & Behavior Options</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'breakReminder', label: 'Enable Break Reminders' },
                    { key: 'autoStartNextSession', label: 'Auto-Start Next Session' },
                    { key: 'playSoundOnCompletion', label: 'Play Audio Sound on Completion' },
                    { key: 'desktopNotification', label: 'Send Desktop Notifications' },
                    { key: 'showTimerInDashboard', label: 'Show Active Session Timer in Dashboard' },
                    { key: 'autoSaveSession', label: 'Auto-Save Session History' },
                    { key: 'enableFocusModeByDefault', label: 'Enable Fullscreen Focus Mode by Default' }
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={studySettings[opt.key]}
                        onChange={e => { setStudySettings({ ...studySettings, [opt.key]: e.target.checked }); setIsDirty(true); }}
                        className="rounded bg-black/40 border-white/10 text-blue-500 focus:ring-0 w-4 h-4"
                      />
                      <span className="text-xs text-white/80 font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={handlePreferencesSave}
                  disabled={saveLoading}
                  className="px-6 py-3 glass-btn-primary text-xs flex items-center gap-2 font-bold shadow-lg"
                >
                  <Save className="w-4 h-4" /> {saveLoading ? 'Saving...' : 'Save Study Session Settings'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FLOATING TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[100001] flex items-center gap-2.5 px-4.5 py-3 rounded-xl strong-glass border shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          {toast.type === 'error' ? (
            <X className="w-4.5 h-4.5 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
          )}
          <span className="text-xs font-semibold text-white/90">{toast.message}</span>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;
