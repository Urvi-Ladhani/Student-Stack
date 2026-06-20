import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Taskspage from './pages/Taskspage';
import AuthPage from './components/auth/authpage'; 

function App() {
  // Pull existing session states directly from local persistence layers
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  // Unified callback to execute when backend issues authentication tokens
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

  // --------------------------------------------------------
  // WORKSPACE COMPONENT (Protected Route Layout)
  // --------------------------------------------------------
  const Workspace = () => (
    <div className="w-full min-h-screen p-6 bg-[#040712]">
      <div className="max-w-6xl mx-auto flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
        <div>
          <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase">Active Space</p>
          {/* Note: Changed fullName to name to match your database schema */}
          <h2 className="text-xl font-bold text-white m-0">Welcome back, {user?.name || 'Student'}</h2>
        </div>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 text-xs font-semibold transition-all"
        >
          Disconnect Workspace
        </button>
      </div>
      
      {/* Core Content Pages Mount Here */}
      <div className="max-w-6xl mx-auto">
        <Taskspage />
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <div className="w-full min-h-screen bg-[#040712] text-white font-sans">
        <Routes>
          {/* 1. Base URL Redirection */}
          <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />

          {/* 2. Public Auth Routes (Redirects to dashboard if already logged in) */}
          <Route 
            path="/login" 
            element={!token ? <AuthPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/dashboard" replace />} 
          />
          <Route 
            path="/signup" 
            element={!token ? <AuthPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/dashboard" replace />} 
          />

          {/* 3. Protected Dashboard Route (Redirects to login if NOT logged in) */}
          <Route 
            path="/dashboard" 
            element={token ? <Workspace /> : <Navigate to="/login" replace />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;