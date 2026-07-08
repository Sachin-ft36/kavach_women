import React from 'react';

export default function TrashWarningIllustration({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Glow Effect behind the trash bin */}
      <div className="absolute inset-0 bg-red-500/15 blur-xl rounded-full"></div>
      
      {/* Custom 3D styled Trash Bin SVG */}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_8px_16px_rgba(239,68,68,0.25)]"
      >
        <defs>
          {/* Gradients for 3D metallic red plastic look */}
          <linearGradient id="lidGradient" x1="20" y1="20" x2="100" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#b91c1c" />
            <stop offset="85%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
          <linearGradient id="canGradient" x1="25" y1="60" x2="95" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="20%" stopColor="#ef4444" />
            <stop offset="45%" stopColor="#b91c1c" />
            <stop offset="80%" stopColor="#7f1d1d" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>
          <linearGradient id="handleGradient" x1="45" y1="12" x2="75" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          {/* Shadow filters */}
          <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feOffset dx="0" dy="3" />
            <feGaussianBlur stdDeviation="3" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.6" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Shadow under the can */}
        <ellipse cx="60" cy="112" rx="35" ry="6" fill="#000000" fillOpacity="0.6" />

        {/* 1. Handle on the lid */}
        <path
          d="M 46 22 L 46 14 C 46 11, 74 11, 74 14 L 74 22"
          stroke="url(#handleGradient)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* 2. Lid rim */}
        <rect
          x="16"
          y="22"
          width="88"
          height="10"
          rx="5"
          fill="url(#lidGradient)"
          stroke="#450a0a"
          strokeWidth="1.5"
        />

        {/* 3. Main Bin Can Body */}
        <path
          d="M 23 34 
             L 30 102 
             C 31 108, 89 108, 90 102 
             L 97 34 
             Z"
          fill="url(#canGradient)"
          stroke="#450a0a"
          strokeWidth="1.5"
        />

        {/* 4. Front highlights / vertical ridges for 3D depth */}
        <path d="M 37 38 L 42 98" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        <path d="M 49 38 L 51 98" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" opacity="0.2.5" />
        <path d="M 71 38 L 69 98" stroke="#000000" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <path d="M 83 38 L 78 98" stroke="#000000" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      </svg>

      {/* Floating Warning Sign (Badge overlay on bottom right of the trash illustration) */}
      <div className="absolute bottom-1 right-1 z-20 bg-red-600 text-white rounded-full p-1 border border-[#1c080b] flex items-center justify-center shadow-lg transform translate-x-1.5 translate-y-1.5 animate-bounce-slow">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
    </div>
  );
}
