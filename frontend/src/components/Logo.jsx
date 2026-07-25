import React from 'react';

const Logo = ({ className = "w-5 h-5" }) => (
  <svg 
    className={className} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Top layer (solid gradient diamond) */}
    <path 
      d="M16 3L5 9L16 15L27 9L16 3Z" 
      fill="url(#logo-grad-1)" 
    />
    {/* Middle and bottom stacked layers (strokes) */}
    <path 
      d="M5 15L16 21L27 15" 
      stroke="url(#logo-grad-2)" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M5 21L16 27L27 21" 
      stroke="url(#logo-grad-3)" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    <defs>
      <linearGradient id="logo-grad-1" x1="5" y1="9" x2="27" y2="9" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#60a5fa" />
      </linearGradient>
      <linearGradient id="logo-grad-2" x1="5" y1="18" x2="27" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#a78bfa" />
      </linearGradient>
      <linearGradient id="logo-grad-3" x1="5" y1="24" x2="27" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60a5fa" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
);

export default Logo;
