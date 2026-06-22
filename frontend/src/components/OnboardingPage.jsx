import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, ArrowRight, UserPlus, LogIn } from 'lucide-react';

const OnboardingPage = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen w-full flex flex-col bg-cover bg-center font-sans relative overflow-hidden"
      style={{ backgroundImage: "url('/mountain-bg.jpg')" }} 
    >
      {/* --- Ambient Glow Effects --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* --- Upperside Navigation --- */}
      <header className="w-full px-8 py-6 flex items-center justify-between z-50 relative">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/[0.06] border border-white/10 shadow-inner">
            <Command className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold tracking-wide text-lg drop-shadow-md">
            Student Stack
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="text-white/70 hover:text-white text-sm font-medium transition-colors px-2"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/signup')}
            className="bg-white hover:bg-white/90 text-black px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_4px_14px_rgba(255,255,255,0.2)] active:scale-[0.98]"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* --- Main Hero Content --- */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 relative">
        
        {/* Glass Tagline Badge */}
        <div className="mb-6 px-4 py-2 rounded-full backdrop-blur-md bg-white/[0.04] border border-white/[0.15] text-white/80 text-xs font-semibold tracking-widest uppercase shadow-xl inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          Your Ultimate Academic Workspace
        </div>

        {/* Huge Title */}
        <h1 className="text-6xl md:text-8xl lg:text-[100px] font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 tracking-tighter mb-8 drop-shadow-2xl">
          Stack Your <br /> Potential.
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/60 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
          The all-in-one operating system for ambitious students. Track assignments, manage your semester, and build your profile—all in one beautifully designed space.
        </p>

        {/* Big Call to Action */}
        <button 
          onClick={() => navigate('/signup')}
          className="group flex items-center gap-3 backdrop-blur-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
        >
          Create Your Workspace
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </main>
    </div>
  );
};

export default OnboardingPage;