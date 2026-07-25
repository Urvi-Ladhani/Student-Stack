import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Loader2, Eye, EyeOff, ArrowRight, ArrowLeft, Check, AlertTriangle, Lock } from 'lucide-react';
import Logo from '../components/Logo';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password requirement checks
  const hasMinLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasNumber && passwordsMatch;

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-token/${token}`);
        if (response.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      } catch (err) {
        console.error('Token verification error:', err);
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setSuccess('Your password has been updated successfully.');
      
      // Trigger a custom dialog / window alert as defined in App.jsx hook
      setTimeout(() => {
        window.alert('Your password has been updated successfully.');
        navigate('/login');
      }, 500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center p-6 bg-cover bg-center font-sans"
        style={{ backgroundImage: "url('/mountain-bg.jpg')" }} 
      >
        <div className="w-full max-w-[480px] strong-glass p-10 shadow-[0_24px_64px_rgba(0,0,0,0.5)] z-10 text-center flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
          <h2 className="text-xl font-medium text-white/80">Securing Workspace...</h2>
          <p className="text-sm text-white/50 mt-2">Verifying password reset request authenticity.</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center p-6 bg-cover bg-center font-sans"
        style={{ backgroundImage: "url('/mountain-bg.jpg')" }} 
      >
        <div className="w-full max-w-[480px] strong-glass p-10 shadow-[0_24px_64px_rgba(0,0,0,0.5)] z-10 text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
          <div className="mb-6 flex justify-center p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-semibold text-white mb-2">Invalid or Expired Link</h2>
          <p className="text-sm text-white/60 mb-8 max-w-[320px]">
            This password reset link is invalid, expired, or has already been used. Please request a new one.
          </p>

          <div className="w-full space-y-4">
            <button 
              type="button" 
              onClick={() => navigate('/forgot-password')}
              className="w-full glass-btn-primary py-4 cursor-pointer"
            >
              Request New Link
            </button>

            <button 
              type="button" 
              onClick={() => navigate('/login')}
              className="w-full glass-btn-secondary py-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 bg-cover bg-center font-sans"
      style={{ backgroundImage: "url('/mountain-bg.jpg')" }} 
    >
      <div className="w-full max-w-[480px] strong-glass p-10 shadow-[0_24px_64px_rgba(0,0,0,0.5)] z-10 animate-in zoom-in-95 duration-500">
        
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="mb-6 flex justify-center p-4 rounded-3xl light-glass shadow-inner">
            <Logo className="w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-semibold text-white drop-shadow-md tracking-tight mb-2">
            Student Stack
          </h1>
          
          <h2 className="text-xl font-medium text-white/80 mt-4 mb-2">
            Reset your password
          </h2>
          
          <p className="text-sm text-white/60 font-medium tracking-wide">
            Enter your new secure password credentials below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* New Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" strokeWidth={1.5} />
              <input 
                type={showNewPassword ? "text" : "password"} 
                name="newPassword" 
                value={newPassword} 
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError('');
                }} 
                placeholder="New Password" 
                required 
                disabled={loading}
                className="w-full glass-input py-4 pl-12 pr-12 font-sans" 
              />
              <button 
                type="button" 
                onClick={() => setShowNewPassword(!showNewPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" strokeWidth={1.5} />
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword" 
                value={confirmPassword} 
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }} 
                placeholder="Confirm New Password" 
                required 
                disabled={loading}
                className="w-full glass-input py-4 pl-12 pr-12 font-sans" 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* Password Strength and matching checks */}
          <div className="p-4 rounded-2xl light-glass bg-white/5 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${hasMinLength ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-white/10 text-white/30'}`}>
                {hasMinLength && <Check className="w-3 h-3" />}
              </div>
              <span className={hasMinLength ? 'text-emerald-400 font-medium' : 'text-white/40'}>
                Minimum 6 characters
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${hasNumber ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-white/10 text-white/30'}`}>
                {hasNumber && <Check className="w-3 h-3" />}
              </div>
              <span className={hasNumber ? 'text-emerald-400 font-medium' : 'text-white/40'}>
                Contains at least one number
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${passwordsMatch ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-white/10 text-white/30'}`}>
                {passwordsMatch && <Check className="w-3 h-3" />}
              </div>
              <span className={passwordsMatch ? 'text-emerald-400 font-medium' : 'text-white/40'}>
                Passwords match
              </span>
            </div>
          </div>

          {error && (
            <div className="text-red-300 text-sm font-medium text-center bg-red-900/30 border border-red-500/20 py-3 rounded-xl animate-in fade-in">
              {error}
            </div>
          )}

          {success && (
            <div className="text-emerald-300 text-sm font-medium text-center bg-emerald-900/30 border border-emerald-500/20 py-3 rounded-xl animate-in fade-in">
              {success}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !isFormValid} 
            className="w-full glass-btn-primary py-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-300" />
            ) : (
              <>
                Reset Password <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
