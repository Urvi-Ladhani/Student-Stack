import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Command, Loader2 } from 'lucide-react';

const AuthPage = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine if we are on the login page based on the actual URL
  const isLogin = location.pathname === '/login';

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', university: '', branch: '', semester: '', targetRole: '' 
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Securely stops the browser from putting data in the URL
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const url = `http://localhost:5000${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Tell App.jsx about the successful login
      if (onAuthSuccess) {
        onAuthSuccess(data.token, data.user);
      } else {
        localStorage.setItem('token', data.token);
      }

      // Navigate to the dashboard
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 bg-cover bg-center font-sans"
      style={{ backgroundImage: "url('/mountain-bg.jpg')" }} 
    >
      <div className="w-full max-w-[480px] backdrop-blur-[48px] backdrop-saturate-[150%] bg-white/[0.04] border border-white/[0.15] rounded-[36px] p-10 shadow-[0_24px_64px_rgba(0,0,0,0.5)] relative z-10">
        
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="mb-6 flex justify-center p-4 rounded-3xl bg-white/[0.06] border border-white/10 shadow-inner">
            <Command className="w-8 h-8 text-white stroke-[1.5]" />
          </div>
          
          <h1 className="text-3xl font-semibold text-white drop-shadow-md tracking-tight mb-2">
            Student Stack
          </h1>
          
          <p className="text-sm text-white/60 font-medium tracking-wide">
            {isLogin ? 'Welcome back. Enter your details.' : 'Create your workspace profile.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required={!isLogin} className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="university" value={formData.university} onChange={handleChange} placeholder="University" className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all" />
                <input type="text" name="branch" value={formData.branch} onChange={handleChange} placeholder="Branch" className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="semester" value={formData.semester} onChange={handleChange} placeholder="Semester" className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all" />
                <input type="text" name="targetRole" value={formData.targetRole} onChange={handleChange} placeholder="Target Role" className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all" />
              </div>
            </div>
          )}

          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all" />
          
          <div className="relative">
            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Password" required className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all pr-12" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
              {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          </div>

          {error && (
            <div className="text-red-300 text-sm font-medium text-center bg-red-900/30 border border-red-500/20 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-white hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-2xl py-4 mt-6 transition-all shadow-[0_4px_14px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 active:scale-[0.98]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <>{isLogin ? 'Sign In' : 'Continue'}<ArrowRight className="w-4 h-4"/></>}
          </button>
        </form>

        <div className="mt-8 text-center pt-6">
          <p className="text-white/50 text-sm font-medium">
            {isLogin ? "Don't have an account? " : "Already registered? "}
            <button 
              type="button" 
              onClick={() => navigate(isLogin ? '/signup' : '/login')} 
              className="text-white hover:text-white/80 transition-colors ml-1 font-semibold"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;