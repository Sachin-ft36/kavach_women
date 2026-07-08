import React from 'react';

export interface InsightCardProps {
  title: string;
  value: string | number;
  status: string;
  icon: React.ReactNode;
  illustration: React.ReactNode;
  glowColor: string;
  baseBgColor: string;
  textColor: string;
  statusColor: string;
}

export const InsightCard = ({
  title,
  value,
  status,
  icon,
  illustration,
  glowColor,
  textColor,
  statusColor,
  baseBgColor
}: InsightCardProps) => {
  const lines = title.split(/\\n|\n/);

  return (
    <div
      className="relative w-full h-[105px] rounded-[14px] overflow-hidden p-2 flex flex-col justify-between border shadow-[0_5px_20px_rgba(90,78,180,.12),inset_0_1px_0_rgba(255,255,255,.05)] transition-transform hover:-translate-y-0.5"
      style={{
        background: `
          radial-gradient(circle at 15% 15%, ${glowColor}30 0%, transparent 60%),
          radial-gradient(circle at 90% 90%, ${glowColor}15 0%, transparent 60%),
          linear-gradient(180deg, ${baseBgColor} 0%, #04060d 100%)
        `,
        borderColor: `${glowColor}35`,
      }}
    >
      {/* Artwork strictly pushed to background container with constrained size and reduced opacity */}
      <div className="absolute bottom-0 right-0 w-[80px] h-[80px] z-0 pointer-events-none opacity-[0.22]">
        {illustration}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start gap-1">
          <span className="text-[8px] font-bold text-slate-300 leading-tight">
            {title.split('\\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
          </span>
          <div
            className="w-[24px] h-[24px] rounded-full flex items-center justify-center shadow-md shrink-0"
            style={{
              background: `linear-gradient(135deg, ${glowColor}25 0%, ${glowColor}05 100%)`,
              border: `1px solid ${glowColor}30`,
              boxShadow: `inset 0 0 10px ${glowColor}15, 0 2px 5px rgba(0,0,0,0.3)`
            }}
          >
            {React.cloneElement(icon as React.ReactElement<any>, { size: 13 })}
          </div>
        </div>

        <div className="flex flex-col mt-0.5">
          <span className={`text-[24px] font-black leading-none mb-1.5 ${textColor}`}>
            {value}
          </span>
          <span className={`text-[9.5px] font-bold leading-none uppercase tracking-wider ${statusColor}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};
