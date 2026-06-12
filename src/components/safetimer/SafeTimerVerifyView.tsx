import React from 'react';

interface SafeTimerVerifyViewProps {
  pinInput: string;
  setPinInput: React.Dispatch<React.SetStateAction<string>>;
  safetyPin: string;
  error: boolean;
  handleExtendClick: () => void;
  handleStop: () => void;
}

export function SafeTimerVerifyView({
  pinInput, setPinInput, safetyPin, error, handleExtendClick, handleStop
}: SafeTimerVerifyViewProps) {
  return (
    <>
      <div className="w-full flex justify-center gap-3 mb-6">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-300
              ${error ? 'bg-red-500/20 text-red-500 border border-red-500/50' :
                pinInput[index]
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800 border border-gray-700 text-gray-500'
              }`}
          >
            {pinInput[index] ? '•' : ''}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => {
              if (pinInput.length < 4) setPinInput(p => p + num);
            }}
            className="h-14 rounded-xl bg-gray-800 active:bg-gray-700 text-white font-bold text-xl transition-colors"
          >
            {num}
          </button>
        ))}
        <div className="col-start-2">
          <button
            onClick={() => {
              if (pinInput.length < 4) setPinInput(p => p + '0');
            }}
            className="w-full h-14 rounded-xl bg-gray-800 active:bg-gray-700 text-white font-bold text-xl transition-colors"
          >
            0
          </button>
        </div>
        <button
          onClick={() => setPinInput(p => p.slice(0, -1))}
          className="h-14 rounded-xl bg-red-500/10 active:bg-red-500/20 text-red-500 font-bold flex items-center justify-center transition-colors"
        >
          DEL
        </button>
      </div>

      <div className="w-full flex flex-col gap-3">
        <button
          disabled={pinInput !== safetyPin}
          onClick={handleExtendClick}
          className="w-full h-14 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-50 disabled:bg-transparent disabled:border-transparent disabled:text-gray-600 font-bold uppercase tracking-widest text-sm transition-all"
        >
          Extend Timer
        </button>
        <button
          disabled={pinInput !== safetyPin}
          onClick={handleStop}
          className="w-full h-14 rounded-xl bg-white disabled:opacity-50 disabled:bg-gray-800 disabled:text-gray-500 text-black font-black uppercase tracking-widest text-sm transition-all"
        >
          Confirm I am Safe
        </button>
      </div>
    </>
  );
}
