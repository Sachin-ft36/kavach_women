import React from 'react';

interface SafeTimerExtendViewProps {
  selectedReason: string | null;
  setSelectedReason: React.Dispatch<React.SetStateAction<string | null>>;
  customReason: string;
  setCustomReason: React.Dispatch<React.SetStateAction<string>>;
  extendMins: number;
  setExtendMins: React.Dispatch<React.SetStateAction<number>>;
  setMode: React.Dispatch<React.SetStateAction<'verify' | 'extend'>>;
  setPinInput: React.Dispatch<React.SetStateAction<string>>;
  handleExtendConfirm: (mins: number, reason: string) => void;
}

export function SafeTimerExtendView({
  selectedReason, setSelectedReason,
  customReason, setCustomReason,
  extendMins, setExtendMins,
  setMode, setPinInput,
  handleExtendConfirm
}: SafeTimerExtendViewProps) {
  return (
    <div className="w-full flex flex-col gap-4 mt-4 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-gray-300 font-bold text-sm text-left">Select Reason:</h3>
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Traffic Jam', icon: '🚦' },
          { label: 'Metro Delayed', icon: '🚇' },
          { label: 'Bad Weather', icon: '🌧️' },
          { label: 'Taking Detour', icon: '🚶' },
          { label: 'Running Late', icon: '⏳' },
          { label: 'Other', icon: '✏️' },
        ].map(opt => (
          <button
            key={opt.label}
            onClick={() => setSelectedReason(opt.label)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${selectedReason === opt.label
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {selectedReason === 'Other' && (
        <input
          type="text"
          placeholder="Type your reason..."
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-blue-500"
        />
      )}

      <h3 className="text-gray-300 font-bold text-sm text-left mt-2">Time to Extend:</h3>
      <div className="flex items-center justify-between bg-gray-800 rounded-xl p-2 border border-gray-700">
        <button onClick={() => setExtendMins(m => Math.max(5, m - 5))} className="w-12 h-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold text-xl transition-colors">-</button>
        <div className="text-2xl font-black text-white tracking-tight">{extendMins} <span className="text-sm font-bold text-gray-400">mins</span></div>
        <button onClick={() => setExtendMins(m => Math.min(180, m + 5))} className="w-12 h-12 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold text-xl transition-colors">+</button>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => {
            setMode('verify');
            setPinInput('');
          }}
          className="flex-1 py-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 hover:text-white font-bold transition-colors"
        >
          Cancel
        </button>
        <button
          disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim())}
          onClick={() => handleExtendConfirm(extendMins, selectedReason === 'Other' ? customReason.trim() : selectedReason!)}
          className="flex-[2] py-4 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:shadow-none"
        >
          Start
        </button>
      </div>
    </div>
  );
}
