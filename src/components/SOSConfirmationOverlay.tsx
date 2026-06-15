import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, AlertTriangle, Zap, Radio } from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';

export default function SOSConfirmationOverlay() {
  const { pendingSOS, cancelPendingSOS, setSOSActive } = useKavachStore();
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (!pendingSOS) {
      setTimeLeft(5);
      return;
    }

    if (Capacitor.isNativePlatform()) {
      KavachSafe.triggerHapticPulse();
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        
        if (Capacitor.isNativePlatform()) {
           KavachSafe.triggerHapticPulse();
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingSOS]);

  useEffect(() => {
    if (timeLeft === 0 && pendingSOS) {
      setSOSActive(true, null, pendingSOS.method);
    }
  }, [timeLeft, pendingSOS, setSOSActive]);

  if (!pendingSOS) return null;

  // Calculate SVG stroke offset for the circular countdown (r=75, circumference = 2 * pi * 75 = 471.24)
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / 5) * circumference;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'radial-gradient(circle at center, #151020 0%, #07080C 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '56px 28px',
      color: '#FFFFFF',
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <style>{`
        .abort-btn-tactical {
          width: 100%;
          padding: 18px 32px;
          background: rgba(255, 255, 255, 0.08);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 20px;
          fontSize: 13px;
          fontWeight: 800;
          textTransform: uppercase;
          letter-spacing: 3px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-sizing: border-box;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .abort-btn-tactical:hover {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.4) !important;
          color: #F87171 !important;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.25) !important;
        }
        .abort-btn-tactical:active {
          transform: scale(0.97) !important;
          background: rgba(239, 68, 68, 0.3) !important;
        }
      `}</style>

      {/* Futuristic soft background ambient nodes */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        zIndex: 10,
        width: '100%',
        textAlign: 'center'
      }}>
        {/* State Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '100px'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#EF4444',
            boxShadow: '0 0 8px #EF4444'
          }} />
          <span style={{
            fontSize: '9px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '2.5px',
            color: '#F87171'
          }}>Sovereign Guard Active</span>
        </div>

        {/* Title */}
        <div>
          <h2 style={{
            margin: '0',
            fontSize: '28px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            color: '#FFFFFF',
            lineHeight: '1.2'
          }}>
            SOS Broadcast
          </h2>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '11px',
            color: '#94A3B8',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.5px'
          }}>
            Trigger Method: <span style={{ color: '#F87171', fontWeight: 800 }}>{pendingSOS.method}</span>
          </p>
        </div>
      </div>

      {/* CENTRAL SLEEK COUNTDOWN */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '220px',
        height: '220px',
        zIndex: 10
      }}>
        {/* Soft Ring Shadow Background */}
        <div style={{
          position: 'absolute',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid rgba(255, 255, 255, 0.03)'
        }} />

        {/* Circular Progress SVG */}
        <svg style={{
          transform: 'rotate(-90deg)',
          width: '180px',
          height: '180px',
          position: 'absolute'
        }}>
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="#EF4444"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Counter digits */}
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{
            fontSize: '76px',
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: '1',
            fontFamily: "system-ui, -apple-system, sans-serif"
          }}>
            {timeLeft}
          </span>
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: '#94A3B8',
            marginTop: '4px'
          }}>seconds left</span>
        </div>
      </div>

      {/* ACTION & FOOTER SECTION */}
      <div style={{
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        zIndex: 10
      }}>
        {/* Warning Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          width: '100%',
          padding: '14px 18px',
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          borderRadius: '16px',
          boxSizing: 'border-box'
        }}>
          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
          <span style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#F3F4F6',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            PCR Dispatch & Guardians will be alerted
          </span>
        </div>

        {/* Abort button (Glassmorphic) */}
        <button
          onClick={cancelPendingSOS}
          className="abort-btn-tactical"
        >
          <X size={14} strokeWidth={3} />
          Cancel Alert
        </button>

        {/* Secure marker */}
        <span style={{
          fontSize: '9px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          color: '#475569'
        }}>
          Secure Transit Link
        </span>
      </div>
    </div>
  );
}
