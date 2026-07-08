import React from 'react';

export const FamilyIllustration = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full text-[#14b8a6] pointer-events-none" preserveAspectRatio="none">
    <g transform="translate(180, 190) scale(1.3)">
      <circle cx="60" cy="60" r="120" fill="currentColor" opacity="0.1" filter="blur(10px)" />
      <path d="M-200 120 C-100 100, 100 130, 200 110 L200 200 L-200 200 Z" fill="currentColor" opacity="0.3" />
      <path d="M-60 115 V 30 L -10 -15 L 40 30 V 115 Z" fill="currentColor" opacity="0.25" />
      <rect x="-35" y="50" width="16" height="22" fill="#04060d" opacity="0.9" />
      <rect x="5" y="50" width="16" height="22" fill="#04060d" opacity="0.9" />
      <path d="M20 120 V 45 L 75 0 L 130 45 V 120 Z" fill="currentColor" opacity="0.5" />
      <rect x="42" y="65" width="16" height="22" fill="#04060d" opacity="0.9" />
      <rect x="78" y="65" width="16" height="22" fill="#04060d" opacity="0.9" />
      <line x1="20" y1="45" x2="130" y2="45" stroke="currentColor" strokeWidth="2.5" opacity="0.6" />
      <path d="M140 120 V 60" stroke="currentColor" strokeWidth="6" opacity="0.5" />
      <circle cx="140" cy="45" r="30" fill="currentColor" opacity="0.4" />
      <circle cx="115" cy="55" r="22" fill="currentColor" opacity="0.35" />
      <circle cx="165" cy="55" r="22" fill="currentColor" opacity="0.35" />
      <path d="M-110 120 V 75" stroke="currentColor" strokeWidth="5" opacity="0.5" />
      <circle cx="-110" cy="60" r="24" fill="currentColor" opacity="0.3" />
    </g>
  </svg>
);

export const TravelIllustration = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full text-[#3b82f6] pointer-events-none" preserveAspectRatio="none">
    <g transform="translate(180, 180) scale(1.2)">
      <path d="M-200 130 Q -100 90, 0 140 T 200 120 L200 300 L-200 300 Z" fill="currentColor" opacity="0.25" />
      <circle cx="-120" cy="110" r="25" fill="currentColor" opacity="0.3" />
      <circle cx="150" cy="100" r="30" fill="currentColor" opacity="0.3" />
      <path d="M -120 300 C -40 200, 60 210, 80 120 C 95 30, -10 60, 50 -40" fill="none" stroke="currentColor" strokeWidth="70" opacity="0.3" />
      <path d="M -120 300 C -40 200, 60 210, 80 120 C 95 30, -10 60, 50 -40" fill="none" stroke="#04060d" strokeWidth="64" />
      <path d="M -120 300 C -40 200, 60 210, 80 120 C 95 30, -10 60, 50 -40" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="14 14" opacity="0.8" />
      <path d="M -155 300 C -72 200, 28 210, 48 120" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M -85 300 C -8 200, 92 210, 112 120" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <g transform="translate(42, -65)">
        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" fill="#04060d" stroke="currentColor" strokeWidth="2.5" opacity="0.95" />
        <circle cx="12" cy="10" r="3.5" fill="currentColor" opacity="0.95" />
      </g>
    </g>
  </svg>
);

export const RadarIllustration = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full text-[#a855f7] pointer-events-none" preserveAspectRatio="none">
    <g transform="translate(200, 200) scale(1.3)">
      <path d="M0 0 L-110 -110 A 155 155 0 0 1 110 -110 Z" fill="currentColor" opacity="0.15" />
      <circle cx="0" cy="0" r="50" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.9" />
      <circle cx="0" cy="0" r="95" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.75" />
      <circle cx="0" cy="0" r="145" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="-220" y1="0" x2="220" y2="0" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <line x1="0" y1="-220" x2="0" y2="220" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="-65" cy="-70" r="5" fill="currentColor" opacity="0.95" />
      <circle cx="-65" cy="-70" r="15" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
    </g>
  </svg>
);

export const RiskShieldIllustration = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full text-[#10b981] pointer-events-none" preserveAspectRatio="none">
    <g transform="translate(180, 220)">
      {/* Grid lines */}
      <line x1="-120" y1="20" x2="120" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.1" />
      <line x1="-120" y1="-20" x2="120" y2="-20" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.1" />
      <line x1="-120" y1="-60" x2="120" y2="-60" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.1" />
      <line x1="-60" y1="-90" x2="-60" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.1" />
      <line x1="0" y1="-90" x2="0" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.1" />
      <line x1="60" y1="-90" x2="60" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" opacity="0.1" />

      {/* Upward Line Chart Path */}
      <path
        d="M -120 40 L -70 10 L -30 25 L 20 -35 L 70 -15 L 120 -80"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Glowing area under the path */}
      <path
        d="M -120 40 L -70 10 L -30 25 L 20 -35 L 70 -15 L 120 -80 L 120 60 L -120 60 Z"
        fill="currentColor"
        opacity="0.08"
      />

      {/* Arrowhead */}
      <polygon points="113,-85 125,-85 125,-73" fill="currentColor" />

      {/* Data point dots */}
      <circle cx="-70" cy="10" r="4.5" fill="#04060d" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="20" cy="-35" r="4.5" fill="#04060d" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="70" cy="-15" r="4.5" fill="#04060d" stroke="currentColor" strokeWidth="2.5" />
    </g>
  </svg>
);
