import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useKavachStore } from '../../state/useKavachStore';

const SupportBanner: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-br from-[#2D1B4E] to-[#160B2E] rounded-[12px] p-2.5 pt-3 pb-2.5 border border-purple-500/20 my-0.5 overflow-hidden text-left w-full">
      {/* Card background glowing dots */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0.5 left-1 text-purple-300 text-[5px]">✦</div>
        <div className="absolute bottom-2 right-1/2 text-purple-400 text-[4px]">✦</div>
      </div>

      <div className="relative z-10 w-[70%] mb-2">
        <h2 className="text-[8.5px] font-[800] leading-[1.2] mb-0.5 text-white">
          It's okay to have <br />
          <span className="relative inline-block mr-0.5">
            a
            <span className="absolute -bottom-0.5 left-0 w-2 h-[0.8px] bg-[#D946EF] rounded-full"></span>
          </span>
          <span className="text-[#D946EF]">difficult day.</span>
        </h2>
        <p className="text-[7px] text-gray-300 leading-tight">
          You're not alone. We're here.
        </p>
      </div>

      {/* 3D Hugging Heart Illustration (SVG Custom) */}
      <div className="absolute right-[-10px] top-[-5px] w-[50px] h-[50px] pointer-events-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <defs>
            <radialGradient id="heart3d" cx="40%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="60%" stopColor="#7E22CE" />
              <stop offset="100%" stopColor="#4C1D95" />
            </radialGradient>
            <linearGradient id="armLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
            <linearGradient id="armRight" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
          </defs>

          {/* Back Arm (Right) */}
          <path d="M80 65 Q95 65 95 50 Q95 40 85 45 L70 55" stroke="url(#armRight)" strokeWidth="8" strokeLinecap="round" fill="none" />

          {/* Main Heart */}
          <path fill="url(#heart3d)" d="M50 85 L44 79.5 C25 62 12 50 12 35 C12 22 22 12 35 12 C42.5 12 49 15.5 50 21 C51 15.5 57.5 12 65 12 C78 12 88 22 88 35 C88 50 75 62 56 79.5 L50 85 Z" />

          {/* Front Arms wrapping */}
          {/* Left Arm wrapping to front */}
          <path d="M15 50 Q5 60 25 70 C35 75 45 70 55 68" stroke="url(#armLeft)" strokeWidth="9" strokeLinecap="round" fill="none" />
          {/* Right Arm wrapping to front */}
          <path d="M85 55 Q95 65 75 75 C65 80 50 75 45 72" stroke="url(#armRight)" strokeWidth="9" strokeLinecap="round" fill="none" />

          {/* Cute little hands (fingers) */}
          <path d="M55 64 L50 66 M55 68 L50 70 M53 72 L49 73" stroke="#FCE7F3" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M45 68 L50 70 M45 72 L50 74 M47 76 L51 77" stroke="#FCE7F3" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <button
        onClick={() => useKavachStore.getState().setActiveTab('talk_to_someone')}
        className="w-full relative z-10 bg-gradient-to-r from-[#F43F5E] via-[#D946EF] to-[#8B5CF6] text-white py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1 hover:opacity-90 transition-opacity shadow-[0_4px_15px_rgba(217,70,239,0.3)] border-none cursor-pointer text-[8.5px]"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          <path d="M8 10h8v2H8zm0 4h5v2H8z" fill="#FFF" />
        </svg>
        Enter Safe Space
        <ArrowRight size={10} className="absolute right-3" />
      </button>
    </div>
  );
};

export default SupportBanner;
