import React, { useState } from 'react';
import './App.css';
import Taskspage from './pages/Taskspage';
import AuthPage from './components/auth/authpage'; // Matches naming convention cleanly

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

  return (
    <div className="w-full min-h-screen bg-[#040712] text-white">
      {!token ? (
        // Render verified glass login screen layout when unauthenticated
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      ) : (
        // Seamlessly route into active workspace panels once logged in
        <div className="w-full min-h-screen p-6 bg-[#040712]">
          <div className="max-w-6xl mx-auto flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
            <div>
              <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase">Active Space</p>
              <h2 className="text-xl font-bold text-white m-0">Welcome back, {user?.fullName || 'Student'}</h2>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 text-xs font-semibold transition-all"
            >
              Disconnect Workspace
            </button>
          </div>
          
          {/* Your Core Content Pages Mount Here */}
          <div className="max-w-6xl mx-auto">
            <Taskspage />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;