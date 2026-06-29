import React, { useState } from 'react';
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

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

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
          {/* 1. ONBOARDING PAGE (Landing Page) */}
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
          {/* Dashboard OS */}
          <Route 
            path="/dashboard" 
            element={token ? <Workspace /> : <Navigate to="/login" replace />} 
          />
          
          {/* Task OS */}
          <Route 
            path="/tasks" 
            element={token ? <Taskspage /> : <Navigate to="/login" replace />} 
          />

          <Route 
            path="/dsa" 
            element={token ? <DsaPage /> : <Navigate to="/login" replace />} 
          />

          <Route path="/notes"
           element={token ? <NotesPage />: <Navigate to="/login" replace />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;