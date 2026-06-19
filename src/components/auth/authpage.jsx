import React, { useState } from 'react';
import { Mail, Lock, User, Target, Eye, EyeOff, AlertCircle, ArrowRight, Command } from 'lucide-react';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', university: '', branch: '', semester: '', targetRole: '' });

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 bg-cover bg-center font-sans"
      style={{ backgroundImage: "url('/mountain-bg.jpg')" }} 
    >
      {/* ================= TRUE NEUTRAL GLASS CARD ================= */}
      <div className="w-full max-w-[480px] backdrop-blur-[48px] backdrop-saturate-[150%] bg-white/[0.04] border border-white/[0.15] rounded-[36px] p-10 shadow-[0_24px_64px_rgba(0,0,0,0.5)] relative z-10">
        
        {/* Brand Header */}
        <div className="mb-10 text-center flex flex-col items-center">
          
          {/* Sleek Geometric Icon */}
          <div className="mb-6 flex justify-center p-4 rounded-3xl bg-white/[0.06] border border-white/10 shadow-inner">
            <Command className="w-8 h-8 text-white stroke-[1.5]" />
          </div>
          
          {/* Stark, Clean Typography */}
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
            Student Stack
          </h1>
          
          <p className="text-sm text-white/60 font-medium tracking-wide">
            {isLogin ? 'Welcome back. Enter your details.' : 'Create your workspace profile.'}
          </p>
        </div>

        {/* Form Inputs */}
        <form className="space-y-4">
          {!isLogin && (
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all" 
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="University" 
                  className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all" 
                />
                <input 
                  type="text" 
                  placeholder="Major" 
                  className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all" 
                />
              </div>
            </div>
          )}

          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all" 
          />
          
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              className="w-full bg-black/[0.15] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white font-medium placeholder-white/40 focus:ring-1 focus:ring-white/30 focus:border-white/20 outline-none transition-all pr-12" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          </div>

          {/* Premium High-Contrast Button */}
          <button 
            type="submit"
            className="w-full bg-white hover:bg-white/90 text-black font-semibold text-sm rounded-2xl py-4 mt-6 transition-all shadow-[0_4px_14px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isLogin ? 'Sign In' : 'Continue'}
            <ArrowRight className="w-4 h-4"/>
          </button>
        </form>

        {/* Minimalist Footer */}
        <div className="mt-8 text-center pt-6">
          <p className="text-white/50 text-sm font-medium">
            {isLogin ? "Don't have an account? " : "Already registered? "}
            <button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                setIsLogin(!isLogin);
              }} 
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