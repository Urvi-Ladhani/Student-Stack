import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset link.');
      }

      setSuccess(data.message || 'If an account exists for this email, a password reset link has been sent.');
      setEmail('');
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
      <div className="w-full max-w-[480px] strong-glass p-10 shadow-[0_24px_64px_rgba(0,0,0,0.5)] z-10 animate-in zoom-in-95 duration-500">
        
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="mb-6 flex justify-center p-4 rounded-3xl light-glass shadow-inner">
            <Command className="w-8 h-8 text-white stroke-[1.5]" />
          </div>
          
          <h1 className="text-3xl font-semibold text-white drop-shadow-md tracking-tight mb-2">
            Student Stack
          </h1>
          
          <h2 className="text-xl font-medium text-white/80 mt-4 mb-2">
            Forgot your password?
          </h2>
          
          <p className="text-sm text-white/60 font-medium tracking-wide max-w-[320px] text-center">
            Enter your email address and we'll send you a secure link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center animate-in fade-in duration-300">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-emerald-300 text-sm font-medium bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl">
              {success}
            </div>
            <button 
              type="button" 
              onClick={() => navigate('/login')}
              className="w-full glass-btn-primary py-4 mt-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" strokeWidth={1.5} />
              <input 
                type="email" 
                name="email" 
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }} 
                placeholder="Email Address" 
                required 
                disabled={loading}
                className="w-full glass-input py-4 pl-12 pr-5" 
              />
            </div>

            {error && (
              <div className="text-red-300 text-sm font-medium text-center bg-red-900/30 border border-red-500/20 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full glass-btn-primary py-4 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-300" />
              ) : (
                'Send Reset Link'
              )}
            </button>

            <button 
              type="button" 
              disabled={loading}
              onClick={() => navigate('/login')}
              className="w-full glass-btn-secondary py-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
