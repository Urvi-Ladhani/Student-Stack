import React, { useState } from 'react';
import { Mail, Lock, User, GraduationCap, BookOpen, Target, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', university: '', branch: '', semester: '', targetRole: '' });

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 bg-cover bg-center"
      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=3540&auto=format&fit=crop')` }}
    >
      {/* ================= TRUE FROSTED GLASS CARD ================= */}
      {/* backdrop-blur-3xl creates the heavy Apple-style depth */}
      <div className="w-full max-w-[550px] backdrop-blur-3xl backdrop-saturate-[180%] bg-white/5 border border-white/20 rounded-[40px] p-12 shadow-2xl relative overflow-hidden">
        
        {/* Brand Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-white tracking-tighter mb-4">
            StudentStack
          </h1>
          <p className="text-xl text-blue-100 font-medium tracking-wide">
            {isLogin ? 'Welcome back to your workspace.' : 'Mount your operational profile.'}
          </p>
        </div>

        {/* Form Inputs */}
        <form className="space-y-6">
          {!isLogin && (
            <div className="space-y-6">
              <input type="text" placeholder="Full Name" className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-lg text-white placeholder-blue-100/50 focus:ring-2 focus:ring-blue-400 outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="University" className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-lg text-white placeholder-blue-100/50 focus:ring-2 focus:ring-blue-400 outline-none" />
                <input type="text" placeholder="Major" className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-lg text-white placeholder-blue-100/50 focus:ring-2 focus:ring-blue-400 outline-none" />
              </div>
            </div>
          )}

          <input type="email" placeholder="Email Address" className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-lg text-white placeholder-blue-100/50 focus:ring-2 focus:ring-blue-400 outline-none" />
          <input type="password" placeholder="Password" className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-lg text-white placeholder-blue-100/50 focus:ring-2 focus:ring-blue-400 outline-none" />

          <button 
            type="submit"
            className="w-full bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-lg rounded-2xl py-5 mt-4 transition-all shadow-lg shadow-blue-900/50 flex items-center justify-center gap-3"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight className="w-6 h-6" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/80 text-lg">
            {isLogin ? "New here? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-white font-bold underline decoration-blue-400 underline-offset-4">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;