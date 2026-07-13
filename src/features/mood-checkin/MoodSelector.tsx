import React from 'react';
import Face from './Face';
import { moodOptions } from './moodData';

interface MoodSelectorProps {
  selectedMood: string | null;
  onSelect: (moodId: string) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelect }) => {
  return (
    <div className="flex justify-between items-end relative z-10 px-0.5 w-full">
      {moodOptions.map((mood) => {
        const isActive = selectedMood === mood.id;
        return (
          <div
            key={mood.id}
            onClick={() => onSelect(mood.id)}
            className="flex flex-col items-center gap-0.5 cursor-pointer group"
          >
            {/* Face and Ring Container */}
            <div className="relative">
              {/* Selected State Effects */}
              {isActive && (
                <>
                  {/* Perfectly centered ring */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28px] h-[28px] rounded-full border-[1.5px] border-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.4)] pointer-events-none" />

                  {/* Particles / Stars */}
                  <div className="absolute -top-1.5 -left-1.5 text-[#FDBA74] text-[5px]">✨</div>

                  {/* Checkmark Badge */}
                  <div className="absolute -top-1 -right-1 bg-pink-400 rounded-full w-[10px] h-[10px] flex items-center justify-center border-[1.2px] border-[#100B1D] z-20 shadow-sm">
                    <svg className="w-1.5 h-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </>
              )}

              <div className={`w-[22px] h-[22px] relative z-10 transition-transform ${isActive ? 'scale-105' : 'group-hover:scale-110'}`}>
                <Face type={mood.icon} />
              </div>
            </div>

            <span
              className={`text-[6px] font-[800] ${isActive ? 'text-pink-400' : 'text-gray-400'}`}
              style={isActive ? { fontFamily: "'Nunito', sans-serif" } : {}}
            >
              {mood.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default MoodSelector;
