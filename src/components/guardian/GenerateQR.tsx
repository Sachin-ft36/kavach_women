import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, Shield, CheckCircle2, Sparkles, Clock, Users, RefreshCw, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { QrSecurityService } from '../../services/native/QrSecurityService';

interface GenerateQRProps {
  currentUserProfile: any;
  onClose: () => void;
  onShowScanner?: () => void;
}

export default function GenerateQR({ currentUserProfile, onClose, onShowScanner }: GenerateQRProps) {
  const [timeLeft, setTimeLeft] = useState(600);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<number>(0);

  // Generate QR Code payload & manage TTL
  useEffect(() => {
    if (currentUserProfile?.uid) {
      const generateNewPayload = async () => {
        const nowSec = Math.floor(Date.now() / 1000);
        const expiresAt = nowSec + 600; // 10 minutes TTL
        const nonce = Math.random().toString(36).substring(2, 10).toUpperCase();

        const signature = await QrSecurityService.generateSignature(currentUserProfile.uid, nonce, expiresAt);
        setGeneratedAt(nowSec);

        const payload = {
          version: 2,
          intent: 'pair_guardian',
          ward_id: currentUserProfile.uid,
          ward_name: currentUserProfile.name || 'Kavach Citizen',
          generated_at: nowSec,
          expires_at: expiresAt,
          nonce: nonce,
          signature: signature
        };

        const payloadStr = JSON.stringify(payload);
        setQrPayload(payloadStr);
        setTimeLeft(600);

        localStorage.setItem('kavach_qr_payload', payloadStr);
        localStorage.setItem('kavach_qr_generated_at', nowSec.toString());
      };

      const loadOrGeneratePayload = async () => {
        const storedPayload = localStorage.getItem('kavach_qr_payload');
        const storedGeneratedAt = localStorage.getItem('kavach_qr_generated_at');

        if (storedPayload && storedGeneratedAt) {
          const nowSec = Math.floor(Date.now() / 1000);
          const elapsed = nowSec - parseInt(storedGeneratedAt, 10);

          if (elapsed < 600) {
            setGeneratedAt(parseInt(storedGeneratedAt, 10));
            setQrPayload(storedPayload);
            setTimeLeft(600 - elapsed);
            return;
          }
        }

        await generateNewPayload();
      };

      loadOrGeneratePayload();

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            generateNewPayload();
            return 600;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentUserProfile?.uid]);

  const handleRefresh = async () => {
    if (!currentUserProfile?.uid) return;
    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAt = nowSec + 600;
    const nonce = Math.random().toString(36).substring(2, 10).toUpperCase();
    const signature = await QrSecurityService.generateSignature(currentUserProfile.uid, nonce, expiresAt);
    setGeneratedAt(nowSec);
    const payload = {
      version: 2,
      intent: 'pair_guardian',
      ward_id: currentUserProfile.uid,
      ward_name: currentUserProfile.name || 'Kavach Citizen',
      generated_at: nowSec,
      expires_at: expiresAt,
      nonce: nonce,
      signature: signature
    };
    const payloadStr = JSON.stringify(payload);
    setQrPayload(payloadStr);
    setTimeLeft(600);
    localStorage.setItem('kavach_qr_payload', payloadStr);
    localStorage.setItem('kavach_qr_generated_at', nowSec.toString());
    toast.success('QR Code refreshed.');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Kavach Safety Grid Invite',
        text: `Pair with my Kavach profile using payload: ${qrPayload}`
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(qrPayload);
      toast.success('Payload copied to clipboard!');
    }
  };

  const formatMMSS = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <main className="max-w-md mx-auto w-full px-5 py-6 flex flex-col space-y-5 pb-2 relative select-none min-h-[80vh] font-sans">

      {/* Header Row */}
      <div className="flex items-center justify-between w-full pt-2">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#101633]/80 border border-[#232A56] backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-gray-300" strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center text-center">
          <h2 className="text-[17px] font-bold tracking-wide text-white">My Family QR</h2>
          <p className="text-[10px] text-gray-400 font-medium">Share to invite a family member</p>
        </div>

        <button
          onClick={onShowScanner}
          className="w-10 h-10 rounded-xl bg-[#7C4DFF]/15 border border-[#232A56] flex items-center justify-center shadow-[0_0_12px_rgba(124,77,255,0.15)] cursor-pointer hover:bg-[#7C4DFF]/30 transition-colors"
        >
          <Shield className="w-5 h-5 text-[#7C4DFF]" fill="rgba(124,77,255,0.2)" />
        </button>
      </div>

      {/* Secure Badges Pill */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#00D26A]" />
          <span className="text-[11px] text-gray-250 font-semibold flex items-center gap-2">
            Secure <span className="text-gray-600 font-bold">•</span> One-time <span className="text-gray-600 font-bold">•</span> Valid for 10 min
          </span>
        </div>
      </div>

      {/* Outer Wrapper (No borders/boxes) */}
      <div className="w-full flex-grow flex flex-col items-center relative">

        <div className="flex items-center gap-2 text-gray-400 font-semibold text-[10.5px] tracking-[0.14em] uppercase mb-6">
          <Shield className="w-3.5 h-3.5 text-[#7C4DFF]/80" />
          <span>Scan to join Family Circle</span>
        </div>

        {/* QR box with central logo */}
        <div className="relative p-2.5 bg-white rounded-[24px] shadow-[0_0_30px_rgba(124,77,255,0.15)] border border-slate-100 flex items-center justify-center">
          {qrPayload ? (
            <div className="relative w-44 h-44">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`}
                alt="Kavach Safe pairing QR"
                className="w-full h-full block rounded-lg"
              />
              {/* Central Badge */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#101633] border-[2px] border-white flex items-center justify-center shadow-lg">
                  <Shield className="w-4.5 h-4.5 text-[#7C4DFF]" fill="rgba(124,77,255,0.2)" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-44 h-44 flex items-center justify-center bg-slate-50 rounded-lg">
              <RefreshCw className="animate-spin text-slate-400" size={24} />
            </div>
          )}
        </div>

        {/* Expiration timer */}
        <div className="flex items-center gap-1.5 bg-[#101633] border border-[#232A56] rounded-full px-3.5 py-1 mt-6">
          <Clock className="w-3.5 h-3.5 text-[#7C4DFF]" />
          <span className="text-[10px] text-gray-300 font-semibold">
            Expires in <span className="text-[#00D26A] font-bold">{formatMMSS(timeLeft)}</span>
          </span>
        </div>

        {/* 3-column metadata card section (No bg/border) */}
        <div className="grid grid-cols-3 w-full mt-7 p-1 divide-x divide-[#232A56]">
          <div className="flex flex-col items-center justify-start text-center h-16">
            <Users className="w-5 h-5 text-[#7C4DFF]" />
            <span className="text-[10px] text-gray-500 font-semibold mt-1.5 uppercase tracking-wider">Family</span>
            <span className="text-[12px] text-[#7C4DFF] font-bold mt-1 truncate max-w-[95%]">
              {currentUserProfile?.name ? `${currentUserProfile.name.split(' ')[0]} Family` : 'Sharma Family'}
            </span>
          </div>
          <div className="flex flex-col items-center justify-start text-center h-16">
            <Shield className="w-5 h-5 text-[#7C4DFF]" />
            <span className="text-[10px] text-gray-500 font-semibold mt-1.5 uppercase tracking-wider">Role</span>
            <span className="text-[12px] text-[#7C4DFF] font-bold mt-1 uppercase tracking-wide truncate max-w-[95%]">
              {currentUserProfile?.role || 'Guardian'}
            </span>
          </div>
          <div className="flex flex-col items-center justify-start text-center h-16">
            <CheckCircle2 className="w-5 h-5 text-[#7C4DFF]" />
            <span className="text-[10px] text-gray-500 font-semibold mt-1.5 uppercase tracking-wider">Max Uses</span>
            <span className="text-[14px] text-[#7C4DFF] font-bold mt-1 uppercase tracking-wide truncate max-w-[95%]">
              5
            </span>
          </div>
        </div>

        {/* How it works info box (No bg/border) */}
        <div className="w-full p-2 flex gap-4 mt-7 text-left items-center">
          <div className="w-12 h-12 rounded-full bg-[#7C4DFF]/10 flex items-center justify-center shrink-0 border border-[#232A56] shadow-[0_0_12px_rgba(124,77,255,0.15)]">
            <svg className="w-5 h-5 text-[#7C4DFF]" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 11.5l2 2 4-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-tight">How it works?</p>
            <p className="text-[11px] text-gray-400 mt-1 font-medium leading-relaxed">
              Share this QR with your family member. They scan it to join your safety circle.
            </p>
          </div>
        </div>

        {/* Share and Refresh QR Buttons */}
        <div className="grid grid-cols-2 gap-3.5 w-full mt-7">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3.5 bg-[#101633] border border-[#232A56] hover:bg-white/5 text-white text-[12px] font-display font-bold rounded-2xl active:scale-95 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Share QR</span>
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 py-3.5 bg-[#7C4DFF] hover:bg-[#7C4DFF]/80 text-white text-[12px] font-display font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-[#7C4DFF]/20 cursor-pointer"
          >
            <RefreshCw size={14} className="text-white" />
            <span>Refresh QR</span>
          </button>
        </div>

        {/* Padlock Footnote info box (No bg/border) */}
        <div className="w-full p-2 flex gap-3.5 mt-auto pt-6 text-left items-center">
          <div className="w-8 h-8 rounded-full bg-[#00D26A]/10 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-[#00D26A]" />
          </div>
          <p className="text-[12px] text-gray-400 font-medium leading-tight">
            Your QR is end-to-end encrypted and secure.<br />
            <span className="text-[#00D26A] font-semibold">Do not share screenshots.</span>
          </p>
        </div>

      </div>
    </main>
  );
}
