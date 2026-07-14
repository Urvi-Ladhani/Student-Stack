import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Command, Loader2, X } from 'lucide-react';

const AuthPage = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isLoginPath = location.pathname === '/login';

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', university: '', branch: '', semester: '', targetRole: '' 
  });

  // Google interactive chooser states
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);
  const [googleStep, setGoogleStep] = useState('choose'); // 'choose' | 'email' | 'name'
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError('');
    setLoading(true);

    const endpoint = isLoginPath ? '/api/auth/login' : '/api/auth/signup';
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

      if (onAuthSuccess) {
        onAuthSuccess(data.token, data.user);
      } else {
        localStorage.setItem('token', data.token);
      }

      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Google authentication submit
  const handleGoogleAuth = async (name, email) => {
    setLoading(true);
    setError('');
    setIsGoogleChooserOpen(false);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Google Authentication failed');
      }

      if (onAuthSuccess) {
        onAuthSuccess(data.token, data.user);
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      navigate('/dashboard');
    } catch (err) {
      console.error("Google verify error:", err);
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
            {isLoginPath ? 'Welcome back. Enter your details.' : 'Create your workspace profile.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginPath && (
            <div className="space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required={!isLoginPath} className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all" />
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <>{isLoginPath ? 'Sign In' : 'Continue'}<ArrowRight className="w-4 h-4"/></>}
          </button>
        </form>

        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="px-3 text-xs text-white/40 uppercase tracking-widest font-semibold font-mono">Or</span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>

        {/* Beautiful Custom Glassmorphic Google Button matching Theme */}
        <button 
          type="button" 
          onClick={() => {
            setIsGoogleChooserOpen(true);
            setGoogleStep('choose');
          }}
          className="w-full flex items-center justify-center gap-3 bg-black/40 border border-white/10 hover:bg-black/60 text-white font-semibold text-sm rounded-2xl py-4 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="mt-8 text-center pt-6">
          <p className="text-white/50 text-sm font-medium">
            {isLoginPath ? "Don't have an account? " : "Already registered? "}
            <button 
              type="button" 
              onClick={() => navigate(isLoginPath ? '/signup' : '/login')} 
              className="text-white hover:text-white/80 transition-colors ml-1 font-semibold"
            >
              {isLoginPath ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      {/* GOOGLE NATIVE SSO MODAL FRAMEWORK */}
      {isGoogleChooserOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-[450px] bg-white border border-[#dadce0] rounded-lg shadow-[0_2px_4px_rgba(0,0,0,0.08),0_24px_38px_rgba(0,0,0,0.04)] px-10 py-10 text-slate-800 font-sans flex flex-col justify-between min-h-[500px] relative">
            
            {/* Close button */}
            <button 
              onClick={() => setIsGoogleChooserOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            {googleStep === 'choose' ? (
              <div className="w-full flex-1 flex flex-col justify-between">
                <div>
                  {/* Google Logo */}
                  <div className="flex justify-center mb-6">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-medium text-slate-900 tracking-tight">Choose an account</h3>
                    <p className="text-sm text-slate-500 mt-1.5">
                      to continue to <span className="font-semibold text-slate-800">Student Stack</span>
                    </p>
                  </div>

                  {/* List of Accounts */}
                  <div className="border border-[#dadce0] rounded-lg overflow-hidden divide-y divide-[#dadce0] mb-6">
                    
                    {/* Account 1 */}
                    <button 
                      onClick={() => handleGoogleAuth('Urvi Ladhani', 'urvi.ladhani@gmail.com')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f7f8f9] transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white font-bold flex items-center justify-center text-xs shrink-0 select-none">
                        UL
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-semibold text-slate-800 block truncate leading-snug">Urvi Ladhani</span>
                        <span className="text-xs text-slate-500 block truncate leading-snug">urvi.ladhani@gmail.com</span>
                      </div>
                    </button>

                    {/* Account 2 */}
                    <button 
                      onClick={() => handleGoogleAuth('Guest User', 'guest.stack@gmail.com')}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f7f8f9] transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#5f6368] text-white font-bold flex items-center justify-center text-xs shrink-0 select-none">
                        GU
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-semibold text-slate-800 block truncate leading-snug">Guest User</span>
                        <span className="text-xs text-slate-500 block truncate leading-snug">guest.stack@gmail.com</span>
                      </div>
                    </button>

                    {/* Use Another Account */}
                    <button 
                      onClick={() => setGoogleStep('email')}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#f7f8f9] transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full border border-[#dadce0] text-slate-600 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <line x1="19" y1="8" x2="19" y2="14" />
                          <line x1="16" y1="11" x2="22" y2="11" />
                        </svg>
                      </div>
                      <span className="text-[13px] font-semibold text-[#1a73e8]">Use another account</span>
                    </button>

                  </div>
                </div>

                {/* Footer Terms */}
                <div>
                  <p className="text-[11px] text-slate-500 leading-normal text-left mb-6 select-none">
                    To continue, Google will share your name, email address, language preference, and profile picture with Student Stack. See Student Stack's <a href="#" onClick={(e) => e.preventDefault()} className="text-[#1a73e8] hover:underline">Privacy Policy</a> and <a href="#" onClick={(e) => e.preventDefault()} className="text-[#1a73e8] hover:underline">Terms of Service</a>.
                  </p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                    <select className="bg-transparent border-none outline-none cursor-pointer hover:bg-slate-100 p-1 rounded font-medium text-slate-600">
                      <option>English (United States)</option>
                      <option>Español</option>
                      <option>Français</option>
                    </select>
                    <div className="flex gap-4">
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Help</a>
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Privacy</a>
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Terms</a>
                    </div>
                  </div>
                </div>
              </div>
            ) : googleStep === 'email' ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (googleCustomEmail.trim()) {
                    setGoogleStep('name');
                  }
                }}
                className="w-full flex-1 flex flex-col justify-between"
              >
                <div>
                  {/* Google Logo */}
                  <div className="flex justify-center mb-6">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  </div>

                  <div className="text-center mb-8">
                    <h3 className="text-xl font-medium text-slate-900 tracking-tight">Sign in</h3>
                    <p className="text-sm text-slate-600 mt-2">with your Google Account</p>
                  </div>

                  {/* Input Block */}
                  <div className="space-y-6">
                    <div className="relative border border-[#dadce0] rounded px-3 py-2.5 focus-within:border-[#1a73e8] focus-within:border-2 transition-all">
                      <label className="block text-[10px] font-semibold text-[#1a73e8] uppercase tracking-wider mb-0.5">Email or phone</label>
                      <input 
                        type="email" 
                        required 
                        value={googleCustomEmail}
                        onChange={(e) => setGoogleCustomEmail(e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-800 outline-none border-none p-0 focus:ring-0"
                      />
                    </div>

                    <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-semibold text-[#1a73e8] hover:underline inline-block">Forgot email?</a>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-12">
                  <div className="flex justify-between items-center mb-6">
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-semibold text-[#1a73e8] hover:underline">Create account</a>
                    <button 
                      type="submit" 
                      className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-2 rounded text-sm font-semibold tracking-wide transition-colors"
                    >
                      Next
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                    <select className="bg-transparent border-none outline-none cursor-pointer hover:bg-slate-100 p-1 rounded font-medium text-slate-600">
                      <option>English (United States)</option>
                    </select>
                    <div className="flex gap-4">
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Help</a>
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Privacy</a>
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Terms</a>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (googleCustomName.trim()) {
                    handleGoogleAuth(googleCustomName, googleCustomEmail);
                  }
                }}
                className="w-full flex-1 flex flex-col justify-between"
              >
                <div>
                  {/* Google Logo */}
                  <div className="flex justify-center mb-6">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-medium text-slate-900 tracking-tight">Welcome</h3>
                    <div className="inline-flex items-center gap-1.5 border border-[#dadce0] rounded-full px-3 py-1 mt-2 text-xs font-semibold text-slate-600 hover:bg-[#f1f3f4] transition-colors cursor-pointer select-none" onClick={() => setGoogleStep('email')}>
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8" />
                        <path d="M8 12h8" />
                      </svg>
                      {googleCustomEmail}
                    </div>
                  </div>

                  {/* Input Block */}
                  <div className="space-y-6">
                    <div className="relative border border-[#dadce0] rounded px-3 py-2.5 focus-within:border-[#1a73e8] focus-within:border-2 transition-all">
                      <label className="block text-[10px] font-semibold text-[#1a73e8] uppercase tracking-wider mb-0.5">Your full name</label>
                      <input 
                        type="text" 
                        required 
                        value={googleCustomName}
                        onChange={(e) => setGoogleCustomName(e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-800 outline-none border-none p-0 focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-12">
                  <div className="flex justify-end items-center mb-6">
                    <button 
                      type="submit" 
                      className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-2 rounded text-sm font-semibold tracking-wide transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                    <select className="bg-transparent border-none outline-none cursor-pointer hover:bg-slate-100 p-1 rounded font-medium text-slate-600">
                      <option>English (United States)</option>
                    </select>
                    <div className="flex gap-4">
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Help</a>
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Privacy</a>
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:underline">Terms</a>
                    </div>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;