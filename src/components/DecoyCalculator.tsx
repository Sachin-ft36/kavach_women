import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { KavachNative } from '../services/KavachNative';

export default function DecoyCalculator() {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState('');
  const { setSOSActive, safetyPin, isHubReady, setFakeCallActive } = useKavachStore();

  const handleSOS = () => {
    // 📳 TACTICAL CONFIRMATION: Discreet double-pulse vibration
    if (Capacitor.isNativePlatform() && isHubReady) {
      KavachNative.triggerHapticPulse().catch(() => { });
    }

    // SILENT TRIGGER EMITTED
    const event = new CustomEvent('sos-silent-trigger');
    window.dispatchEvent(event);
  };

  const pressKey = (key: string) => {
    if (key === 'C') {
      setDisplay('0');
      setHistory('');
      return;
    }

    if (key === '=') {
      try {
        // Evaluate expression (safely if possible, but decoy so simple is fine)
        const result = eval(display.replace(/×/g, '*').replace(/÷/g, '/'));
        setHistory(display + ' =');
        setDisplay(String(result));

        // 🔐 SECRET TACTICAL TRIGGER: Use the user's safetyPin (or default 911911)
        const secretCode = safetyPin || '911911';
        if (display === secretCode) {
          handleSOS();
        }
        // TRIGGER FAKE CALL UI (Global Store)
        setFakeCallActive(true);
      } catch {
        setDisplay('Error');
      }
      return;
    }

    setDisplay(prev => (prev === '0' || prev === 'Error' ? key : prev + key));
  };

  const keys = [
    ['C', '÷', '×', '⌫'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.', '%']
  ];

  return (
    <div className="w-full max-w-sm mx-auto bg-black p-6 rounded-[40px] border border-white/5 shadow-2xl">
      <div className="h-32 flex flex-col justify-end items-end p-4 mb-4">
        <span className="text-gray-600 text-sm font-mono mb-2">{history}</span>
        <span className="text-5xl font-light text-white tracking-tighter">{display}</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {keys.map((row, i) => (
          <React.Fragment key={i}>
            {row.map(key => (
              <button
                key={key}
                onClick={() => pressKey(key)}
                className={`
                  h-16 rounded-2xl text-xl font-medium transition-all active:scale-95
                  ${['÷', '×', '-', '+', '='].includes(key) ? 'bg-orange-500 text-white' : 'bg-[#1c1c1e] text-white'}
                  ${key === 'C' ? 'bg-[#a5a5a5] text-black' : ''}
                  ${key === '0' ? 'col-span-2' : ''}
                `}
              >
                {key}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      <p className="text-[10px] text-gray-800 font-bold uppercase text-center mt-6 tracking-widest opacity-20">
        Standard Precision Computing Unit © 2026
      </p>
    </div>
  );
}
