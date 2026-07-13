import React from 'react';
import { Sparkles } from 'lucide-react';

interface AIInsightProps {
  selectedMood: string | null;
}

const AIInsight: React.FC<AIInsightProps> = ({ selectedMood }) => {
  return (
    <div className="relative bg-gradient-to-br from-[#1E1535] via-[#1A1230] to-[#14102B] rounded-xl border border-purple-500/20 p-2 flex flex-col gap-1 overflow-hidden w-full">
      {/* Glowing Background Orbs */}
      <div className="absolute -top-1 -right-1 w-8 h-8 bg-purple-600/20 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-pink-600/20 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-1 relative z-10">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-1 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]">
          <Sparkles size={9} className="text-white" />
        </div>
        <div>
          <h3 className="text-[8px] font-bold text-white leading-none">AI Insight</h3>
          <p className="text-[6px] text-purple-400 mt-0.5 leading-none">Powered by Kavach AI</p>
        </div>
        {/* AI Live Badge */}
        <div className="ml-auto flex items-center gap-0.5 bg-green-500/20 px-1.5 py-0.5 rounded-full border border-green-500/30">
          <span className="w-1 h-1 bg-green-400 rounded-full"></span>
          <span className="text-[6px] font-bold text-green-400">LIVE</span>
        </div>
      </div>

      {/* Insight Message */}
      <div className="relative z-10 bg-white/5 rounded-lg p-1.5 border border-white/10 text-left">
        {selectedMood === null ? (
          <p className="text-[8px] text-gray-300 leading-[1.4]">
            Select your mood to get personalized AI insights and wellness tips just for you. 💜
          </p>
        ) : selectedMood === 'great' ? (
          <p className="text-[8px] text-gray-300 leading-[1.4]">
            <span className="text-yellow-400 font-bold">Radiant day! 🌟</span> You're at your peak. Channel this energy into something creative today — write, draw, connect!
          </p>
        ) : selectedMood === 'good' ? (
          <p className="text-[8px] text-gray-300 leading-[1.4]">
            <span className="text-green-400 font-bold">Steady & bright 💚</span> A great day to tackle goals. Try a 5-min meditation to keep your clarity sharp.
          </p>
        ) : selectedMood === 'okay' ? (
          <p className="text-[8px] text-gray-300 leading-[1.4]">
            <span className="text-yellow-300 font-bold">Balanced energy 🌤</span> A calm day is still a good day. Gentle walks and warm tea can uplift your spirit.
          </p>
        ) : selectedMood === 'low' ? (
          <p className="text-[8px] text-gray-300 leading-[1.4]">
            <span className="text-purple-400 font-bold">Gentle hug 💜</span> Low days are temporary. Rest, breathe, and know your support circle is here for you.
          </p>
        ) : (
          <p className="text-[8px] text-gray-300 leading-[1.4]">
            <span className="text-red-400 font-bold">You are seen 🤝</span> Reaching out is the bravest thing. A trained companion is ready to listen right now.
          </p>
        )}
      </div>

      {/* Footer Tip */}
      <div className="flex items-center gap-1 relative z-10">
        <div className="h-[0.5px] flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <p className="text-[6px] text-purple-400 font-medium">Updated with your mood</p>
        <div className="h-[0.5px] flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
      </div>
    </div>
  );
};

export default AIInsight;
