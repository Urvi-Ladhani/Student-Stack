import React from 'react';

const Logo = ({ className = "w-5 h-5" }) => (
  <svg 
    className={className} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Top layer (solid blue diamond) */}
    <path 
      d="M16 3L5 9L16 15L27 9L16 3Z" 
      fill="#3b82f6" 
    />
    {/* Middle and bottom stacked layers (strokes) */}
    <path 
      d="M5 15L16 21L27 15" 
      stroke="#a78bfa" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M5 21L16 27L27 21" 
      stroke="#8b5cf6" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

export default Logo;
