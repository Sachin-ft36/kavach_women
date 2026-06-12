import React from 'react';

export default function AuthBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-[320px] h-[320px] md:w-[480px] md:h-[480px] opacity-[0.06] text-slate-500">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.25">
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="42" strokeDasharray="1,2" />
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="28" strokeDasharray="1,15" strokeWidth="1" />
          <circle cx="50" cy="50" r="22" />
          <circle cx="50" cy="50" r="16" strokeDasharray="1,2" />
          <circle cx="50" cy="50" r="10" />
          {Array.from({ length: 32 }).map((_, i) => {
            const angle = (i * 360) / 32;
            const rad = (angle * Math.PI) / 180;
            const x1 = 50 + 10 * Math.cos(rad);
            const y1 = 50 + 10 * Math.sin(rad);
            const x2 = 50 + 46 * Math.cos(rad);
            const y2 = 50 + 46 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </svg>
      </div>

      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[320px] h-[320px] md:w-[480px] md:h-[480px] opacity-[0.06] text-slate-500">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.25">
          <circle cx="50" cy="50" r="46" />
          <circle cx="50" cy="50" r="42" strokeDasharray="1,2" />
          <circle cx="50" cy="50" r="35" />
          <circle cx="50" cy="50" r="28" strokeDasharray="1,15" strokeWidth="1" />
          <circle cx="50" cy="50" r="22" />
          <circle cx="50" cy="50" r="16" strokeDasharray="1,2" />
          <circle cx="50" cy="50" r="10" />
          {Array.from({ length: 32 }).map((_, i) => {
            const angle = (i * 360) / 32;
            const rad = (angle * Math.PI) / 180;
            const x1 = 50 + 10 * Math.cos(rad);
            const y1 = 50 + 10 * Math.sin(rad);
            const x2 = 50 + 46 * Math.cos(rad);
            const y2 = 50 + 46 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </svg>
      </div>
    </div>
  );
}
