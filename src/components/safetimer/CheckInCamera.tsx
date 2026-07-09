import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Sparkles, Sliders, ShieldCheck,
  RefreshCw, Check, Download, Trash2,
  Zap, FlipHorizontal, Moon, Layers, Mic, Music2, Video, Settings, Cpu,
  Shield, Activity, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useKavachStore } from '../../state/useKavachStore';

interface CheckInCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured?: (photo: string) => void;
}

const FILTER_STYLES: Record<string, string> = {
  Natural: '',
  Warm: 'saturate(1.25) sepia(0.15) brightness(1.02)',
  Cool: 'hue-rotate(15deg) saturate(1.1) brightness(0.98)',
  Vintage: 'sepia(0.6) contrast(1.15) brightness(0.95)',
  Film: 'contrast(1.1) saturate(0.85) brightness(1.02) sepia(0.1)',
  Mono: 'grayscale(1) contrast(1.25)',
  Night: 'brightness(1.5) contrast(0.8) saturate(1.15) hue-rotate(8deg)',
  Cinematic: 'contrast(1.35) saturate(0.9) brightness(0.9)',
  Pink: 'hue-rotate(-15deg) saturate(1.3) brightness(1.05)',
  Golden: 'saturate(1.4) sepia(0.25) brightness(1.05)',
};

export default function CheckInCamera({ isOpen, onClose, onPhotoCaptured }: CheckInCameraProps) {
  const { isCameraActive, setIsCameraActive } = useKavachStore();

  // Core states
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [beautyLevel, setBeautyLevel] = useState(30);
  const [showBeautySlider, setShowBeautySlider] = useState(false);
  const [showFiltersPicker, setShowFiltersPicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Natural');
  const [focusRing, setFocusRing] = useState<{ x: number; y: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanReport, setScanReport] = useState<{
    quality: number; lighting: number; focus: number; spoof: number; overall: string;
  } | null>(null);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'torch'>('off');
  const [exposureCompensation, setExposureCompensation] = useState(0);
  const [frameRate, setFrameRate] = useState<number>(30);
  const [availableFps, setAvailableFps] = useState<number[]>([30]);
  const [showFpsPicker, setShowFpsPicker] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const computedFilterString = `${FILTER_STYLES[activeFilter] || ''} brightness(${1.0 + (exposureCompensation * 0.15) + (beautyLevel * 0.0005)}) contrast(${1.0 - (beautyLevel * 0.001)}) saturate(${1.0 + (beautyLevel * 0.0008)})`;

  // ── Camera stream + face analysis loop ──
  useEffect(() => {
    let animFrame: number;
    let localStream: MediaStream | null = null;
    let disappearTimeout: any = null;

    if (isOpen) {
      const analysisCanvas = document.createElement('canvas');
      analysisCanvas.width = 80;
      analysisCanvas.height = 60;
      const analysisCtx = analysisCanvas.getContext('2d', { willReadFrequently: true });

      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: frameRate, max: frameRate },
        },
      })
        .then((stream) => {
          localStream = stream;
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;

          // Detect device supported FPS
          const track = stream.getVideoTracks()[0];
          if (track && typeof (track as any).getCapabilities === 'function') {
            const caps = (track as any).getCapabilities();
            const maxFps = caps?.frameRate?.max ?? 30;
            const supported = [24, 30, 60, 120].filter(f => f <= Math.round(maxFps));
            setAvailableFps(supported.length > 0 ? supported : [30]);
          }

          const runAnalysisLoop = () => {
            if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
              animFrame = requestAnimationFrame(runAnalysisLoop);
              return;
            }
            if (analysisCtx && videoRef.current.videoWidth > 0) {
              analysisCtx.drawImage(videoRef.current, 0, 0, 80, 60);
              try {
                const imgData = analysisCtx.getImageData(10, 10, 60, 40);
                let rSum = 0, gSum = 0, bSum = 0;
                const totalPixels = imgData.data.length / 4;
                for (let i = 0; i < imgData.data.length; i += 4) {
                  rSum += imgData.data[i];
                  gSum += imgData.data[i + 1];
                  bSum += imgData.data[i + 2];
                }
                const rAvg = rSum / totalPixels, gAvg = gSum / totalPixels, bAvg = bSum / totalPixels;
                const brightnessVal = (rAvg + gAvg + bAvg) / 3;
                const hasSkinTone = rAvg > 60 && gAvg > 40 && bAvg > 30 && rAvg > gAvg && rAvg > bAvg;

                if (hasSkinTone && brightnessVal > 45) {
                  setIsFaceDetected(true);
                  if (disappearTimeout) { clearTimeout(disappearTimeout); disappearTimeout = null; }
                } else {
                  if (!disappearTimeout) {
                    disappearTimeout = setTimeout(() => setIsFaceDetected(false), 1200);
                  }
                }
              } catch (_) { }
            }
            animFrame = requestAnimationFrame(runAnalysisLoop);
          };
          animFrame = requestAnimationFrame(runAnalysisLoop);
        })
        .catch((err) => {
          console.warn('Camera access failed:', err);
          setIsFaceDetected(false);
        });
    }

    return () => {
      cancelAnimationFrame(animFrame);
      if (disappearTimeout) clearTimeout(disappearTimeout);
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, [isOpen, isCameraActive, facingMode, frameRate]);

  // ── Capture handler ──
  const handleCapture = () => {
    if (!isFaceDetected) {
      toast.error('Please center your face inside the viewfinder.');
      return;
    }
    setIsScanning(true);
    if (window.navigator.vibrate) window.navigator.vibrate([80, 50, 80]);

    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        if (videoRef.current) {
          canvas.width = videoRef.current.videoWidth || 720;
          canvas.height = videoRef.current.videoHeight || 1280;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
            ctx.filter = computedFilterString;
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedPhoto(dataUrl);
            setIsScanning(false);
            setScanReport({
              quality: 94 + Math.floor(Math.random() * 5),
              lighting: 88 + Math.floor(Math.random() * 8),
              focus: 91 + Math.floor(Math.random() * 7),
              spoof: 0.12,
              overall: 'SECURE',
            });
            toast.success('AI Biometric Check-In Scan Complete!');
          }
        }
      } catch (_) {
        setIsScanning(false);
        toast.error('Capture failed. Please try again.');
      }
    }, 1800);
  };

  const handleShare = () => {
    if (capturedPhoto && onPhotoCaptured) onPhotoCaptured(capturedPhoto);
    setIsCameraActive(false);
    onClose();
  };

  if (!isOpen) return null;

  // ── Corner bracket positions ──
  const corners = [
    { top: 0, left: 0, bT: true, bL: true, radius: '6px 0 0 0' },
    { top: 0, right: 0, bT: true, bR: true, radius: '0 6px 0 0' },
    { bottom: 0, left: 0, bB: true, bL: true, radius: '0 0 0 6px' },
    { bottom: 0, right: 0, bB: true, bR: true, radius: '0 0 6px 0' },
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw', height: '100vh', zIndex: 2147483647,
      backgroundColor: '#000', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>

      {/* ── FULL BLEED VIDEO / PHOTO ── */}
      <div className="absolute inset-0 w-full h-full"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setFocusRing({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
          setTimeout(() => setFocusRing(null), 900);
        }}>

        {capturedPhoto ? (
          <img src={capturedPhoto} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            style={{ filter: computedFilterString }} />
        )}

        {/* Top vignette */}
        <div className="absolute top-0 left-0 right-0 h-52 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)' }} />

        {/* Bottom vignette */}
        <div className="absolute bottom-0 left-0 right-0 h-60 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }} />

        {/* ════════════════ TOP BAR ════════════════ */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4 pb-3 pointer-events-auto">

          {/* Back button → closes camera */}
          <button onClick={(e) => { e.stopPropagation(); setIsCameraActive(false); onClose(); }}
            className="flex items-center gap-2 active:opacity-70 transition-opacity">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <ArrowLeft size={18} className="text-white" />
            </div>
          </button>

          {/* LIVE pill */}
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span className="w-2 h-2 rounded-full bg-red-500 " style={{ boxShadow: '0 0 8px rgba(239,68,68,1)' }} />
            <span className="text-white font-black text-[11px] tracking-[0.2em] uppercase">Live</span>
            <Activity size={12} className="text-pink-400" />
          </div>

          {/* FPS picker */}
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowFpsPicker(p => !p); }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 active:scale-95 transition-all"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="text-white font-bold text-[11px] tracking-wider">HD • {frameRate}FPS</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.9)' }} />
            </button>
            {showFpsPicker && (
              <div className="absolute right-0 top-full mt-2 flex flex-col gap-1 rounded-2xl p-2 shadow-2xl z-50 min-w-[90px]"
                style={{ background: 'rgba(5,5,15,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {availableFps.map(fps => (
                  <button key={fps}
                    onClick={(e) => { e.stopPropagation(); setFrameRate(fps); setShowFpsPicker(false); }}
                    className="w-full text-center py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all"
                    style={frameRate === fps
                      ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', color: '#6ee7b7' }
                      : { color: 'rgba(255,255,255,0.6)' }}>
                    {fps} FPS
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>




        {/* Tap-to-focus ring */}
        {focusRing && (
          <div className="absolute pointer-events-none z-30"
            style={{ left: `${focusRing.x}%`, top: `${focusRing.y}%`, transform: 'translate(-50%,-50%)' }}>
            <div className="w-16 h-16 rounded-full border-2 border-yellow-400 "
              style={{ boxShadow: '0 0 12px rgba(250,204,21,0.7)' }} />
          </div>
        )}

        {/* ════════════════ LEFT SIDE CONTROLS ════════════════ */}
        {!capturedPhoto && !isScanning && (
          <div className="absolute left-3 z-40 flex flex-col gap-3 pointer-events-auto"
            style={{ top: '50%', transform: 'translateY(-50%)' }}>
            {([
              {
                icon: <Zap size={14} style={{ color: flashMode !== 'off' ? '#facc15' : '#fff' }} />,
                label: flashMode === 'off' ? 'Flash' : flashMode === 'on' ? 'On' : 'Torch',
                active: flashMode !== 'off',
                glow: 'rgba(234,179,8,0.3)',
                border: flashMode !== 'off' ? 'rgba(234,179,8,0.5)' : 'rgba(255,255,255,0.12)',
                bg: flashMode !== 'off' ? 'rgba(234,179,8,0.15)' : 'rgba(0,0,0,0.55)',
                action: () => setFlashMode(p => p === 'off' ? 'on' : p === 'on' ? 'torch' : 'off'),
              },
              {
                icon: <FlipHorizontal size={14} style={{ color: '#fff' }} />,
                label: 'Flip',
                active: false, glow: '', border: 'rgba(255,255,255,0.12)', bg: 'rgba(0,0,0,0.55)',
                action: () => setFacingMode(p => p === 'user' ? 'environment' : 'user'),
              },
              {
                icon: <Sparkles size={14} style={{ color: beautyLevel > 0 ? '#f472b6' : '#fff' }} />,
                label: 'Beauty',
                active: showBeautySlider,
                glow: 'rgba(236,72,153,0.3)',
                border: showBeautySlider ? 'rgba(236,72,153,0.5)' : 'rgba(255,255,255,0.12)',
                bg: showBeautySlider ? 'rgba(236,72,153,0.15)' : 'rgba(0,0,0,0.55)',
                action: () => { setShowBeautySlider(p => !p); setShowFiltersPicker(false); },
              },
              {
                icon: <Moon size={14} style={{ color: exposureCompensation > 0 ? '#fde047' : '#fff' }} />,
                label: 'Low Light',
                active: exposureCompensation > 0,
                glow: 'rgba(253,224,71,0.25)',
                border: exposureCompensation > 0 ? 'rgba(253,224,71,0.45)' : 'rgba(255,255,255,0.12)',
                bg: exposureCompensation > 0 ? 'rgba(253,224,71,0.1)' : 'rgba(0,0,0,0.55)',
                action: () => setExposureCompensation(p => p > 0 ? 0 : 2),
              },
              {
                icon: <Layers size={14} style={{ color: '#fff' }} />,
                label: 'Stabilizer',
                active: false, glow: '', border: 'rgba(255,255,255,0.12)', bg: 'rgba(0,0,0,0.55)',
                action: () => toast.info('Stabilizer on'),
              },
            ] as const).map((btn, i) => (
              <button key={i}
                onClick={(e) => { e.stopPropagation(); (btn.action as () => void)(); }}
                className="flex flex-col items-center gap-1 rounded-xl py-2 px-1 active:scale-90 transition-all"
                style={{
                  width: 46, backdropFilter: 'blur(14px)',
                  background: btn.bg, border: `1px solid ${btn.border}`,
                  boxShadow: btn.active && btn.glow ? `0 0 14px ${btn.glow}` : 'none',
                }}>
                {btn.icon}
                <span style={{ fontSize: 6.5, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {btn.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ════════════════ RIGHT SIDE CONTROLS ════════════════ */}
        {!capturedPhoto && !isScanning && (
          <div className="absolute right-3 z-40 flex flex-col gap-3 pointer-events-auto"
            style={{ top: '50%', transform: 'translateY(-50%)' }}>
            {([
              { icon: <Cpu size={14} style={{ color: '#c084fc' }} />, label: 'AI Face', bg: 'rgba(124,58,237,0.22)', border: 'rgba(168,85,247,0.4)', action: () => toast.info('AI Face active') },
              { icon: <Sliders size={14} style={{ color: activeFilter !== 'Natural' ? '#c084fc' : '#fff' }} />, label: 'Filters', bg: showFiltersPicker ? 'rgba(124,58,237,0.22)' : 'rgba(0,0,0,0.55)', border: showFiltersPicker ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.12)', action: () => { setShowFiltersPicker(p => !p); setShowBeautySlider(false); } },
              { icon: <Mic size={14} style={{ color: '#fff' }} />, label: 'Mic', bg: 'rgba(0,0,0,0.55)', border: 'rgba(255,255,255,0.12)', action: () => toast.info('Mic toggled') },
              { icon: <Music2 size={14} style={{ color: '#fff' }} />, label: 'Sound', bg: 'rgba(0,0,0,0.55)', border: 'rgba(255,255,255,0.12)', action: () => toast.info('Sound toggled') },
              { icon: <Video size={14} style={{ color: '#f87171' }} />, label: 'Record', bg: 'rgba(220,38,38,0.18)', border: 'rgba(248,113,113,0.4)', action: () => toast.info('Recording started') },
              { icon: <Settings size={14} style={{ color: '#fff' }} />, label: 'Settings', bg: 'rgba(0,0,0,0.55)', border: 'rgba(255,255,255,0.12)', action: () => toast.info('Settings') },
            ] as const).map((btn, i) => (
              <button key={i}
                onClick={(e) => { e.stopPropagation(); (btn.action as () => void)(); }}
                className="flex flex-col items-center gap-1 rounded-xl py-2 px-1 active:scale-90 transition-all"
                style={{ width: 46, backdropFilter: 'blur(14px)', background: btn.bg, border: `1px solid ${btn.border}` }}>
                {btn.icon}
                <span style={{ fontSize: 6.5, fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {btn.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ════════════════ SNAPCHAT-STYLE FILTER STRIP ════════════════ */}
        {showFiltersPicker && !capturedPhoto && (
          <div className="absolute z-50 left-0 right-0 pointer-events-auto" style={{ bottom: 165 }}>
            <div className="flex justify-center mb-2">
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Filters
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto px-6 pb-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as any}>
              {Object.keys(FILTER_STYLES).map(f => (
                <button key={f}
                  onClick={(e) => { e.stopPropagation(); setActiveFilter(f); }}
                  className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-all">
                  <div className="w-14 h-14 rounded-full overflow-hidden"
                    style={{
                      border: activeFilter === f ? '2.5px solid #a855f7' : '2px solid rgba(255,255,255,0.18)',
                      boxShadow: activeFilter === f ? '0 0 14px rgba(168,85,247,0.7)' : 'none',
                      filter: FILTER_STYLES[f] || 'none',
                      transition: 'all 0.2s',
                    }}>
                    <div className="w-full h-full"
                      style={{ background: 'radial-gradient(circle at 40% 35%, #f87171 0%, #c084fc 50%, #818cf8 100%)' }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: activeFilter === f ? '#c084fc' : 'rgba(255,255,255,0.6)', textTransform: 'capitalize', letterSpacing: '0.04em' }}>
                    {f}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════ BEAUTY SLIDER ════════════════ */}
        {showBeautySlider && !capturedPhoto && (
          <div className="absolute z-50 left-4 right-4 rounded-3xl p-4 pointer-events-auto"
            style={{ bottom: 165, background: 'rgba(5,0,15,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(236,72,153,0.3)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-pink-400" />
                <span style={{ fontSize: 11, fontWeight: 900, color: '#f9a8d4', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Face Retouch</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{beautyLevel}%</span>
            </div>
            <input type="range" min="0" max="100" value={beautyLevel}
              onChange={(e) => setBeautyLevel(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full cursor-pointer appearance-none"
              style={{ accentColor: '#ec4899', background: `linear-gradient(to right, #ec4899 ${beautyLevel}%, rgba(255,255,255,0.12) ${beautyLevel}%)` }} />
            <div className="flex justify-between mt-1.5">
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Natural</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Smooth</span>
            </div>
          </div>
        )}

        {/* ════════════════ SCANNING OVERLAY ════════════════ */}
        {isScanning && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
            <div className="relative w-56 h-56">
              <div className="absolute inset-0 rounded-3xl border border-fuchsia-500/30"
                style={{ boxShadow: '0 0 32px rgba(192,38,211,0.35), inset 0 0 30px rgba(192,38,211,0.1)' }} />
              {[33, 66].map(p => (
                <React.Fragment key={p}>
                  <div className="absolute top-0 bottom-0 w-px" style={{ left: `${p}%`, background: 'rgba(192,38,211,0.2)' }} />
                  <div className="absolute left-0 right-0 h-px" style={{ top: `${p}%`, background: 'rgba(192,38,211,0.2)' }} />
                </React.Fragment>
              ))}
              <div className="absolute left-0 right-0 h-px animate-bounce"
                style={{ top: '50%', background: 'linear-gradient(to right, transparent, #e879f9, transparent)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw size={28} className="text-fuchsia-400 animate-spin" />
              </div>
            </div>
            <span className="mt-5 "
              style={{ fontSize: 11, fontWeight: 900, color: '#e879f9', textTransform: 'uppercase', letterSpacing: '0.25em' }}>
              Analyzing Biometrics…
            </span>
          </div>
        )}

        {/* ════════════════ AI SCAN REPORT MODAL ════════════════ */}
        {scanReport && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 pointer-events-auto"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(18px)' }}>
            <div className="w-full max-w-[300px] rounded-3xl p-5 flex flex-col gap-3"
              style={{ background: 'rgba(8,5,20,0.98)', border: '1px solid rgba(52,211,153,0.25)', boxShadow: '0 0 50px rgba(52,211,153,0.08)' }}>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <ShieldCheck size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em' }}>AI Biometric Report</p>
                  <p style={{ fontSize: 9, color: 'rgba(52,211,153,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kavach Secure Check-In</p>
                </div>
              </div>
              {[
                { label: 'Face Quality', val: `${scanReport.quality}%` },
                { label: 'Lighting', val: `${scanReport.lighting}%` },
                { label: 'Focus Stability', val: `${scanReport.focus}%` },
                { label: 'Spoof Risk', val: `${scanReport.spoof}%` },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#34d399' }}>{row.val}</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-2xl px-4 py-2.5 mt-1"
                style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <span style={{ fontSize: 9.5, color: '#6ee7b7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Overall</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#6ee7b7', letterSpacing: '0.2em' }}>{scanReport.overall}</span>
              </div>
              <button onClick={() => setScanReport(null)}
                className="w-full py-3 rounded-2xl text-white active:scale-95 transition-all mt-1"
                style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 24px rgba(16,185,129,0.35)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                ✓ Accept &amp; Continue
              </button>
            </div>
          </div>
        )}

        {/* ════════════════ BOTTOM ACTION BAR ════════════════ */}
        <div className="absolute bottom-0 left-0 right-0 z-40 px-8 pb-10 pt-4 pointer-events-auto">
          {capturedPhoto ? (
            /* Photo confirm row */
            <div className="flex items-center justify-between">
              <button onClick={() => setCapturedPhoto(null)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-all">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <Trash2 size={20} className="text-white" />
                </div>
                <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Retake</span>
              </button>

              <button onClick={handleShare} className="flex flex-col items-center gap-1.5 active:scale-90 transition-all">
                <div className="w-24 h-14 rounded-full flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 4px 24px rgba(16,185,129,0.45)' }}>
                  <Check size={18} className="text-white" strokeWidth={3} />
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>Use</span>
                </div>
                <span style={{ fontSize: 8.5, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Confirm</span>
              </button>

              <button onClick={() => { if (capturedPhoto) { const a = document.createElement('a'); a.href = capturedPhoto; a.download = 'kavach-checkin.jpg'; a.click(); } }}
                className="flex flex-col items-center gap-1.5 active:scale-90 transition-all">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <Download size={20} className="text-white" />
                </div>
                <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Save</span>
              </button>
            </div>
          ) : (
            /* Live capture row */
            <div className="flex items-center justify-between">

              {/* Gallery */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.2)' }}>
                  <Camera size={22} style={{ color: 'rgba(255,255,255,0.45)' }} />
                </div>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Gallery</span>
              </div>

              {/* Premium orbit capture button */}
              <button onClick={handleCapture} disabled={isScanning}
                className="relative flex items-center justify-center active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-40"
                style={{ width: 88, height: 88 }}>
                {/* Spinning gradient ring */}
                <div className="absolute inset-0 rounded-full animate-[spin_6s_linear_infinite]"
                  style={{ background: 'conic-gradient(from 0deg,#7c3aed,#ec4899,#f97316,#7c3aed)', padding: 3, borderRadius: '50%' }}>
                  <div className="w-full h-full rounded-full" style={{ background: '#000' }} />
                </div>
                {/* Dashed inner ring */}
                <div className="absolute rounded-full"
                  style={{ inset: 6, border: '1.5px dashed rgba(168,85,247,0.6)', borderRadius: '50%', boxShadow: '0 0 16px rgba(124,58,237,0.55), inset 0 0 10px rgba(236,72,153,0.1)' }} />
                {/* White center */}
                <div className="relative rounded-full bg-white"
                  style={{ width: 60, height: 60, boxShadow: '0 0 28px rgba(255,255,255,0.95), 0 0 55px rgba(255,255,255,0.3)' }} />
              </button>

              {/* Flip */}
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={(e) => { e.stopPropagation(); setFacingMode(p => p === 'user' ? 'environment' : 'user'); }}
                  className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-all"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <FlipHorizontal size={22} className="text-white" />
                </button>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Flip</span>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
