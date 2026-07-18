import React, { useState, useEffect } from 'react';
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

  // Official Google OAuth redirect trigger
  const handleGoogleRedirect = () => {
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const clientId = (envClientId && !envClientId.includes('PLACEHOLDER') && envClientId.trim() !== '')
      ? envClientId
      : '152418212756-3gqlnrdt0mgijotj53lqb68u22i02mnk.apps.googleusercontent.com';
    const redirectUri = window.location.origin + window.location.pathname; // redirects back to current path
    const scope = 'openid profile email';
    const responseType = 'id_token';
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    sessionStorage.setItem('google_oauth_nonce', nonce);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=${encodeURIComponent(responseType)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&nonce=${encodeURIComponent(nonce)}`;
      
    window.location.href = authUrl;
  };

  // Google authentication submit (sends ID Token to backend)
  const handleGoogleAuth = async (idToken) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, isSignup: !isLoginPath }),
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

  // Parse Google OAuth redirect URL hash fragment
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      if (idToken) {
        // Clear hash from URL so it doesn't stay in the address bar
        window.history.replaceState(null, '', window.location.pathname);
        handleGoogleAuth(idToken);
      }
    }
  }, [location.pathname]);

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
          onClick={handleGoogleRedirect}
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
    </div>
  );
};

export default AuthPage;