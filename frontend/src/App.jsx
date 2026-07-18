import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import DashboardLayout from './components/DashboardLayout'; 
import DashboardMain from './components/dashboard/DashboardMain'; 
import DashboardRightPanel from './components/dashboard/DashboardRightPanel';
import Taskspage from './pages/Taskspage'; 
import AuthPage from './components/auth/authpage'; 
import DsaPage from './pages/DsaPage';
import OnboardingPage from './components/OnboardingPage';
import NotesPage from './pages/NotesPage';
import PdfAnnotatorPage from './pages/PdfAnnotatorPage';
import InternshipPage from './pages/InternshipPage';
import SettingsPage from './pages/SettingsPage';
import SettingsRightPanel from './components/settings/SettingsRightPanel';
import { X, CheckCircle2 } from 'lucide-react';

function App() {
  const getValidToken = () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken || storedToken === 'null' || storedToken === 'undefined') return null;
    return storedToken;
  };

  const getValidUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser || storedUser === 'null' || storedUser === 'undefined') return null;
      return JSON.parse(storedUser);
    } catch (e) {
      return null;
    }
  };

  const [token, setToken] = useState(getValidToken());
  const [user, setUser] = useState(getValidUser());
  const [globalDialog, setGlobalDialog] = useState({ isOpen: false, message: '', type: 'success' });

  // Hook global window.alert to render our premium glass dialog instead
  useEffect(() => {
    window.alert = (message) => {
      const isError = /error|fail|invalid|incorrect|upload a pdf|❌/i.test(message);
      setGlobalDialog({
        isOpen: true,
        message,
        type: isError ? 'error' : 'success'
      });
    };
  }, []);

  const handleAuthSuccess = (receivedToken, receivedUser) => {
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  // --- WORKSPACE LAYOUT (Dashboard Only) ---
  const Workspace = () => (
    <DashboardLayout 
      user={user} 
      onLogout={handleLogout}
      rightPanelContent={<DashboardRightPanel />} 
    >
      <DashboardMain userName={user?.name || 'Student'} />
    </DashboardLayout>
  );
  return (
    <BrowserRouter>
      <div 
        className="w-full min-h-screen text-white font-sans bg-cover bg-center bg-fixed bg-no-repeat"
        style={{ backgroundImage: "url('/mountain-bg.jpg')" }}
      >
        <Routes>
          <Route 
            path="/onboarding" 
            element={token ? <Navigate to="/dashboard" replace /> : <OnboardingPage />} 
          />

          <Route 
            path="/" 
            element={<Navigate to="/onboarding" replace />} 
          />

          {/* 2. AUTH PAGES */}
          <Route 
            path="/login" 
            element={!token ? <AuthPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/dashboard" replace />} 
          />
          <Route 
            path="/signup" 
            element={!token ? <AuthPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/dashboard" replace />} 
          />

          {/* 3. PROTECTED ROUTES */}
          <Route 
            path="/dashboard" 
            element={token ? <Workspace /> : <Navigate to="/login" replace />} 
          />
          
          <Route 
            path="/tasks" 
            element={token ? <Taskspage /> : <Navigate to="/login" replace />} 
          />

          <Route 
            path="/dsa" 
            element={token ? <DsaPage /> : <Navigate to="/login" replace />} 
          />

          <Route 
            path="/notes"
            element={token ? <NotesPage /> : <Navigate to="/login" replace />}
          />

          <Route 
            path="/notes/pdf"
            element={token ? <PdfAnnotatorPage /> : <Navigate to="/login" replace />}
          />
          <Route 
            path="/internships"
            element={token ? <InternshipPage /> : <Navigate to="/login" replace />}
          />
          <Route 
            path="/settings" 
            element={token ? (
              <DashboardLayout 
                user={user} 
                onLogout={handleLogout}
                rightPanelContent={<SettingsRightPanel />}
              >
                <SettingsPage user={user} onUserUpdate={(updatedUser) => {
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                  setUser(updatedUser);
                  window.dispatchEvent(new Event('dashboard-data-updated'));
                }} onLogout={handleLogout} />
              </DashboardLayout>
            ) : <Navigate to="/login" replace />}
          />
        </Routes>
      </div>

      {globalDialog.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xs strong-glass p-6 text-white text-center flex flex-col items-center gap-4 border border-white/10 shadow-2xl rounded-2xl">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
              globalDialog.type === 'error' 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              {globalDialog.type === 'error' ? (
                <X className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h4 className="text-md font-bold text-white mb-1">
                {globalDialog.type === 'error' ? 'Notice' : 'Success!'}
              </h4>
              <p className="text-xs text-white/70 leading-normal">{globalDialog.message}</p>
            </div>
            <button 
              onClick={() => setGlobalDialog({ isOpen: false, message: '', type: 'success' })}
              className="w-full py-2.5 glass-btn-primary text-xs font-semibold rounded-xl"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;