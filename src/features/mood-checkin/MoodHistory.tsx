import React from 'react';
import { Calendar } from 'lucide-react';
import Face from './Face';
import { weeklyHistory } from './moodData';

interface MoodHistoryProps {
  selectedMood: string | null;
}

const MoodHistory: React.FC<MoodHistoryProps> = ({ selectedMood }) => {
  return (
    <div className="bg-[#171026] rounded-xl p-2 border border-white/5 flex flex-col gap-1 w-full">
      <div className="flex gap-1.5 items-center text-left">
        <div className="bg-[#261A3F] p-1 rounded-full">
          <Calendar size={12} className="text-purple-300" />
        </div>
        <div>
          <h3 className="text-[9px] font-semibold text-white leading-none">Mood History</h3>
          <p className="text-[7px] text-gray-400 mt-0.5 leading-none">This Week</p>
        </div>
      </div>

      <div className="flex justify-between items-center w-full px-1 mt-1.5">
        {weeklyHistory.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1 relative">
            <span className="text-[7.5px] text-gray-400 font-medium leading-none">{day.day}</span>
            {day.mood === 'low' && selectedMood === 'low' ? (
              <div className="relative">
                {/* Active highlight ring for the history icon */}
                <div className="absolute -inset-0.5 rounded-full border border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                <div className="w-[14px] h-[14px] relative z-10">
                  <Face type={day.mood} />
                </div>
              </div>
            ) : (
              <div className="w-[14px] h-[14px] opacity-80">
                <Face type={day.mood} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoodHistory;
