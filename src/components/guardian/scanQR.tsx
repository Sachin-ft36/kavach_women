import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ChevronLeft, Zap, Lightbulb, CheckCircle2,
    Shield, QrCode, Focus, Clock, Keyboard,
    Users, Flashlight, ChevronRight, Check, AlertTriangle, X, Image as ImageIcon, MoreVertical
} from 'lucide-react';
import { KavachSafeHardware } from '../../services/native/hardware';
import { toast } from 'sonner';

interface ScanQRProps {
    onSuccess?: (data: string) => void;
    onClose?: () => void;
    onShowMyQr?: () => void;
}

// --- Custom Animations & Styles ---
const inlineStyles = `
  @keyframes scanline {
    0% { transform: translateY(0); opacity: 0; }
    10% { opacity: 1; box-shadow: 0 0 20px 2px var(--scan-color, rgba(168, 85, 247, 0.4)); }
    50% { box-shadow: 0 0 30px 4px var(--scan-color, rgba(168, 85, 247, 0.8)); opacity: 1; }
    90% { opacity: 1; box-shadow: 0 0 20px 2px var(--scan-color, rgba(168, 85, 247, 0.3)); }
    100% { transform: translateY(230px); opacity: 0; }
  }
  .animate-scanline {
    animation: scanline 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  .animate-slide-up {
    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  .scanner-cutout {
    box-shadow: 0 0 0 9999px rgba(9, 11, 31, 0.82);
    border-radius: 36px;
    transition: all 0.3s ease;
  }

  .bracket {
    position: absolute;
    width: 48px;
    height: 48px;
    border-style: solid;
    transition: all 0.4s ease;
  }
  .bracket-tl { top: -6px; left: -6px; border-width: 6px 0 0 6px; border-top-left-radius: 32px; }
  .bracket-tr { top: -6px; right: -6px; border-width: 6px 6px 0 0; border-top-right-radius: 32px; }
  .bracket-bl { bottom: -6px; left: -6px; border-width: 0 0 6px 6px; border-bottom-left-radius: 32px; }
  .bracket-br { bottom: -6px; right: -6px; border-width: 0 6px 6px 0; border-bottom-right-radius: 32px; }
`;

export default function ScanQR({ onSuccess, onClose, onShowMyQr }: ScanQRProps) {
    // --- States ---
    const [hasPermission, setHasPermission] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [autoTorchStatus, setAutoTorchStatus] = useState('auto');
    const [isLowLight, setIsLowLight] = useState(false);
    const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);

    const [scanState, setScanState] = useState('searching'); // UI State
    const [scannedData, setScannedData] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const zoomIntervalRef = useRef<number | null>(null);
    const lastScannedPayload = useRef<string | null>(null);
    const lastSuccessTime = useRef<number>(0);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Real-time loop sync refs (To prevent stale closure & performance overload)
    const isProcessing = useRef(false);
    const lastScanTime = useRef(0);
    const scanStateRef = useRef('searching'); // Real-time logic state
    const barcodeDetector = useRef<any>(null);

    // Helper to sync React state with Loop state instantly
    const updateScanState = useCallback((newState: string) => {
        setScanState(newState);
        scanStateRef.current = newState;
    }, []);

    const playSuccessSound = () => {
        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // clean high pitch beep
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
            osc.stop(audioCtx.currentTime + 0.12);
        } catch (e) {
            console.warn("Audio cue failed:", e);
        }
    };

    const handleSelectFromGallery = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        toast.loading('Analyzing image for QR code...');

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const dataUrl = event.target?.result as string;
                if (!dataUrl) {
                    toast.dismiss();
                    toast.error('Failed to read selected image.');
                    return;
                }

                const img = new Image();
                img.onload = async () => {
                    const canvas = canvasRef.current;
                    if (!canvas) {
                        toast.dismiss();
                        return;
                    }
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        toast.dismiss();
                        return;
                    }

                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    let detectedData: string | null = null;

                    if (barcodeDetector.current) {
                        try {
                            const barcodes = await barcodeDetector.current.detect(canvas);
                            if (barcodes.length > 0) {
                                detectedData = barcodes[0].rawValue;
                            }
                        } catch (err) {
                            console.warn("Native detection from image failed:", err);
                        }
                    }

                    if (!detectedData && window.jsQR) {
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert",
                        });
                        if (code) {
                            detectedData = code.data;
                        }
                    }

                    toast.dismiss();

                    if (detectedData) {
                        updateScanState('locked');
                        setScannedData(detectedData);
                        if (navigator.vibrate) navigator.vibrate(40);
                        playSuccessSound();

                        setTimeout(() => {
                            updateScanState('success');
                        }, 400);

                        if (onSuccess) {
                            onSuccess(detectedData);
                        }
                    } else {
                        toast.error('No valid QR code found in this image. Try another.');
                    }
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        } catch (err) {
            toast.dismiss();
            toast.error('Error scanning selected file.');
            console.error(err);
        }
    };

    const touchStartDist = useRef<number | null>(null);
    const touchStartZoom = useRef<number>(1);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchStartDist.current = dist;
            touchStartZoom.current = zoom;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && touchStartDist.current !== null) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const factor = dist / touchStartDist.current;
            const targetZoom = Math.min(Math.max(touchStartZoom.current * factor, 1), 2);
            setZoom(targetZoom);
            try {
                const track = streamRef.current?.getVideoTracks()[0];
                if (track) {
                    const capabilities = track.getCapabilities() as any;
                    if (capabilities.zoom) {
                        const safeZoom = Math.min(
                            Math.max(targetZoom, capabilities.zoom.min),
                            capabilities.zoom.max
                        );
                        track.applyConstraints({
                            advanced: [{ zoom: safeZoom }]
                        } as any);
                    }
                }
            } catch (err) { }
        }
    };

    const handleTouchEnd = () => {
        touchStartDist.current = null;
    };

    // --- 1. INITIALIZATION ---
    useEffect(() => {
        // Inject jsQR for Laptops/Apple devices
        if (!window.jsQR) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
            script.async = true;
            document.body.appendChild(script);
        }

        // Advanced Native API Check (Desktop Chrome has API but lacks QR format sometimes)
        if ('BarcodeDetector' in window) {
            window.BarcodeDetector.getSupportedFormats()
                .then((formats: string[]) => {
                    if (formats.includes('qr_code')) {
                        barcodeDetector.current = new window.BarcodeDetector({ formats: ['qr_code'] });
                    } else {
                        console.log("Barcode API found, but QR not supported natively. Will use jsQR.");
                    }
                })
                .catch(() => console.log("Failed to query Barcode formats."));
        }

        const startCamera = async () => {
            try {
                let stream;
                try {
                    // Attempt 1: Back camera (Mobile)
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: { exact: 'environment' }, width: { ideal: 720 }, height: { ideal: 720 } }
                    });
                } catch (e) {
                    // Attempt 2: Generic Webcam (Laptop)
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 720 }, height: { ideal: 720 } }
                    });
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        setHasPermission(true);
                        startRealTimeAnalysis();
                    };
                }
                streamRef.current = stream;
            } catch (err) {
                setHasPermission(true);
            }
        };

        // Keep Screen On and increase brightness
        KavachSafeHardware.keepScreenOn(true);
        KavachSafeHardware.setScreenBrightness(1.0);

        startCamera();

        return () => {
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if (zoomIntervalRef.current) clearInterval(zoomIntervalRef.current);
            KavachSafeHardware.keepScreenOn(false);
            KavachSafeHardware.setScreenBrightness(-1.0);
        };
    }, []);

    // --- 2. THE ENGINE (THROTTLED PROCESSING) ---
    const startRealTimeAnalysis = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const analyzeFrame = async () => {
            // Keep loop running
            animationFrameId.current = requestAnimationFrame(analyzeFrame);

            if (video.readyState !== video.HAVE_ENOUGH_DATA || isProcessing.current) return;
            if (video.videoWidth === 0 || video.videoHeight === 0) return;

            // THROTTLE: Only run heavy QR detection every 300ms (Saves Laptop CPU)
            const now = Date.now();
            if (now - lastScanTime.current < 300) return;

            isProcessing.current = true;
            lastScanTime.current = now;

            // Match canvas to video size
            if (canvas.width !== video.videoWidth) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // --- A. LIGHT DETECTION (Runs once per second) ---
            if (autoTorchStatus === 'auto' && !isTorchOn && (now % 1000 < 300)) {
                const imgData = ctx.getImageData((canvas.width / 2) - 50, (canvas.height / 2) - 50, 100, 100);
                let sum = 0;
                for (let i = 0; i < imgData.data.length; i += 4) {
                    sum += 0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2];
                }
                if ((sum / 10000) < 45) {
                    triggerHardwareTorch(true);
                }
            }

            // --- B. QR DETECTION ---
            if (scanStateRef.current === 'searching' || scanStateRef.current === 'zooming') {
                try {
                    let detectedData: string | null = null;
                    let qrWidth = 0;
                    let qrHeight = 0;

                    // Native Android Engine
                    if (barcodeDetector.current) {
                        const barcodes = await barcodeDetector.current.detect(canvas);
                        if (barcodes.length > 0) {
                            detectedData = barcodes[0].rawValue;
                            qrWidth = barcodes[0].boundingBox.width;
                            qrHeight = barcodes[0].boundingBox.height;
                        }
                    }
                    // Laptop/Apple Fallback Engine
                    else if (window.jsQR) {
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert",
                        });
                        if (code) {
                            detectedData = code.data;
                            qrWidth = Math.abs(code.location.topRightCorner.x - code.location.topLeftCorner.x);
                            qrHeight = Math.abs(code.location.bottomLeftCorner.y - code.location.topLeftCorner.y);
                        }
                    }

                    if (detectedData) {
                        // Ignore duplicate rapid triggers
                        if (detectedData === lastScannedPayload.current && (now - lastSuccessTime.current < 4000)) {
                            isProcessing.current = false;
                            return;
                        }
                        lastScannedPayload.current = detectedData;
                        lastSuccessTime.current = now;

                        const sizeRatio = (qrWidth * qrHeight) / (canvas.width * canvas.height);

                        // ZOOM LOGIC (If QR occupies less than 15% of preview, smooth zoom up to 2.0x)
                        if (sizeRatio > 0 && sizeRatio < 0.15 && zoom < 2.0) {
                            updateScanState('zooming');
                            let nextZoom = 1.2;
                            if (zoom >= 1.5) nextZoom = 2.0;
                            else if (zoom >= 1.2) nextZoom = 1.5;

                            triggerHardwareZoom(nextZoom);
                        } else {
                            // LOCK & SUCCESS LOGIC
                            updateScanState('locked');
                            setScannedData(detectedData);

                            if (navigator.vibrate) navigator.vibrate(40);
                            playSuccessSound();

                            setTimeout(() => {
                                updateScanState('success');
                            }, 400);

                            if (onSuccess) {
                                onSuccess(detectedData);
                            }

                            // Auto Reset after 4 seconds
                            setTimeout(() => {
                                updateScanState('searching');
                                setScannedData(null);
                                triggerHardwareZoom(1.0);
                            }, 4000);
                        }
                    }
                } catch (e) {
                    console.error("Scanning Error:", e);
                }
            }

            isProcessing.current = false;
        };

        analyzeFrame();
    };

    // --- NATIVE HARDWARE CONTROLS ---
    const triggerHardwareTorch = (turnOn: boolean) => {
        setIsTorchOn(turnOn);
        try {
            const track = streamRef.current?.getVideoTracks()[0];
            if (track) {
                const capabilities = track.getCapabilities() as any;
                if (capabilities.torch) {
                    track.applyConstraints({
                        advanced: [{ torch: turnOn }]
                    } as any);
                }
            }
        } catch (e) { }
    };

    const triggerHardwareZoom = (targetZoom: number) => {
        if (zoomIntervalRef.current) {
            clearInterval(zoomIntervalRef.current);
            zoomIntervalRef.current = null;
        }

        const track = streamRef.current?.getVideoTracks()[0];
        if (!track) {
            setZoom(targetZoom);
            return;
        }

        let capabilities: any = {};
        try {
            capabilities = track.getCapabilities();
        } catch (e) { }

        const minZoom = capabilities.zoom?.min ?? 1;
        const maxZoom = Math.min(capabilities.zoom?.max ?? 2, 2.0);
        const safeTargetZoom = Math.min(Math.max(targetZoom, minZoom), maxZoom);

        const startZoom = zoom;
        const steps = 10;
        const duration = 200;
        let currentStep = 0;

        zoomIntervalRef.current = window.setInterval(() => {
            currentStep++;
            const nextZoom = startZoom + (safeTargetZoom - startZoom) * (currentStep / steps);
            setZoom(nextZoom);

            try {
                if (capabilities.zoom) {
                    track.applyConstraints({
                        advanced: [{ zoom: nextZoom }]
                    } as any);
                }
            } catch (e) { }

            if (currentStep >= steps) {
                if (zoomIntervalRef.current) {
                    clearInterval(zoomIntervalRef.current);
                    zoomIntervalRef.current = null;
                }
            }
        }, duration / steps);
    };

    const handleToggleTorch = () => {
        const newState = !isTorchOn;
        setAutoTorchStatus(newState ? 'manual_on' : 'manual_off');
        triggerHardwareTorch(newState);
    };

    const handleManualZoom = (level: number) => {
        updateScanState('zooming');
        triggerHardwareZoom(level);
        setTimeout(() => updateScanState('searching'), 500);
    };

    // UI Variables
    const isSuccess = scanState === 'locked' || scanState === 'success';
    const bracketColor = isSuccess ? '#22c55e' : '#a855f7';
    const bracketShadow = isSuccess ? 'rgba(34, 197, 94, 0.8)' : 'rgba(168, 85, 247, 0.8)';

    return (
        <div className="relative w-full h-[100dvh] bg-[#090B1F] text-white font-sans overflow-hidden flex flex-col select-none">
            <style>{inlineStyles}</style>

            {/* Hidden Canvas - Absolute necessary for pixel analysis */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Hidden File Input for Gallery QR Scan */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(#7C4DFF 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    maskImage: 'linear-gradient(to right, black, transparent 20%, transparent 80%, black)',
                    WebkitMaskImage: 'linear-gradient(to right, black, transparent 20%, transparent 80%, black)'
                }}>
            </div>

            {/* 1. Camera Layer (Background) */}
            <div className="absolute inset-0 z-0 bg-[#090B1F]">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover opacity-90"
                    style={{
                        transform: `scale(${1 + (zoom - 1) * 0.5})`,
                        transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
                    }}
                />
                {!streamRef.current && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="text-white/20 text-sm">Hardware Camera Offline</div>
                    </div>
                )}
            </div>

            {/* 2. Interactive UI Layer & Scanner Hole */}
            <div className="relative z-20 w-full h-full flex flex-col justify-between pt-4 pb-6 px-6 pointer-events-none">

                {/* Top Header */}
                <div className="flex items-center justify-between w-full pointer-events-auto relative z-30">
                    {/* Back Button matching mockup */}
                    <button
                        onClick={() => {
                            if (streamRef.current) {
                                streamRef.current.getTracks().forEach(track => track.stop());
                            }
                            if (onClose) onClose();
                        }}
                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#101633] border border-[#232A56] text-white hover:bg-[#141A3A] active:scale-95 transition-all cursor-pointer shadow-lg"
                    >
                        <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                    </button>

                    {/* Logo & Description Centered */}
                    <div className="flex items-center gap-2">
                        {/* Custom KAVACH Logo SVG matching header logo exactly */}
                        <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                            <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-sm" />
                            <svg className="w-full h-full drop-shadow-[0_0_6px_rgba(140,124,255,0.4)]" viewBox="0 0 100 100" fill="none">
                                {/* Shield path */}
                                <path d="M50 10C68 18 78 20 85 24V52C85 71.5 50 88 50 88C50 88 15 71.5 15 52V24C22 20 32 18 50 10Z" fill="url(#shieldGradScan)" stroke="#8c7cff" strokeWidth="2.5" />
                                {/* Woman Face Profile Silhouette */}
                                <path d="M42 30C36.5 33.5 34 39.5 34 47.5C34 55.5 36.5 61.5 42 65C39.5 60 39.5 55 42 50C44.5 45 48.5 42.5 53.5 42C51 40.5 49.5 38 50 35C50.5 32 53 30 56.5 30C54.5 28.5 52.5 28 50 28C46.5 28 44 30 42 30Z" fill="#d8b4fe" />
                                <defs>
                                    <linearGradient id="shieldGradScan" x1="50" y1="10" x2="50" y2="88" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#1e184c" />
                                        <stop offset="1" stopColor="#0e0a26" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="font-display font-extrabold text-[15px] tracking-wide text-white leading-none">KAVACH</span>
                            <span className="font-display font-bold text-[8px] tracking-wider text-[#7C4DFF] mt-0.5">WOMEN SAFETY NETWORK</span>
                        </div>
                    </div>

                    {/* Header Action Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleTorch}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl border border-[#232A56] transition-all active:scale-95 cursor-pointer shadow-lg ${isTorchOn ? 'bg-[#7C4DFF] text-white' : 'bg-[#101633] text-white hover:bg-[#141A3A]'}`}
                        >
                            <Flashlight className="w-5 h-5" strokeWidth={2} />
                        </button>
                        <button
                            onClick={() => {
                                if (streamRef.current) {
                                    streamRef.current.getTracks().forEach(track => track.stop());
                                }
                                if (onShowMyQr) onShowMyQr();
                            }}
                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#101633] border border-[#232A56] text-white hover:bg-[#141A3A] active:scale-95 transition-all cursor-pointer shadow-lg"
                        >
                            <QrCode className="w-5 h-5" strokeWidth={2} />
                        </button>
                        <button className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#101633] border border-[#232A56] text-white hover:bg-[#141A3A] active:scale-95 transition-all cursor-pointer shadow-lg">
                            <MoreVertical className="w-5 h-5" strokeWidth={2} />
                        </button>
                    </div>
                </div>

                {/* Main Content Area (Centered and scanner size enlarged) */}
                <div className="flex-1 flex flex-col items-center justify-center w-full pointer-events-auto my-auto gap-6 relative z-20">
                    {/* Centered Title and Subtitle (Added z-30 to sit above shadow) */}
                    <div className="text-center w-full relative z-30">
                        <h1 className="text-[26px] font-display font-extrabold text-white tracking-tight leading-tight">Scan Family QR</h1>
                        <p className="text-[13px] text-gray-300 font-sans font-medium mt-2 max-w-[300px] mx-auto leading-relaxed">
                            Scan the QR shown on your family member's <span className="text-[#7C4DFF] font-bold">KAVACH</span> app to add them.
                        </p>
                    </div>

                    {/* Scanner window with cutout (Larger size) */}
                    <div className="relative w-[310px] h-[310px] sm:w-[335px] sm:h-[335px] scanner-cutout flex-shrink-0 flex items-center justify-center z-10">
                        {scanState === 'success' && (
                            <div className="absolute inset-0 bg-[#00D26A]/20 rounded-[36px]  z-0"></div>
                        )}
                        <div className="bracket bracket-tl z-20" style={{ borderColor: '#FF2D2D' }}></div>
                        <div className="bracket bracket-tr z-20" style={{ borderColor: '#7C4DFF' }}></div>
                        <div className="bracket bracket-bl z-20" style={{ borderColor: '#7C4DFF' }}></div>
                        <div className="bracket bracket-br z-20" style={{ borderColor: '#00D26A' }}></div>

                        {/* Centered overlay instructions inside frame */}
                        <div className="flex flex-col items-center justify-center text-center p-4 select-none z-20">
                            {/* Visual QR Outline Frame */}
                            <div className="w-14 h-14 border-2 border-dashed border-white/30 rounded-2xl flex items-center justify-center mb-3">
                                <QrCode className="w-7 h-7 text-white/50" strokeWidth={1.5} />
                            </div>
                            <span className="font-display font-bold text-[14px] text-white tracking-wide">Align the Family QR</span>
                            <span className="font-sans font-medium text-[11px] text-gray-200 mt-1">inside the frame</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Panels and Action Buttons */}
                <div className="w-full flex flex-col gap-4 mt-auto pointer-events-auto relative z-30">
                    
                    {/* Action Cards Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Gallery Card */}
                        <button
                            onClick={handleSelectFromGallery}
                            className="bg-[#141A3A] border border-[#232A56] hover:bg-[#1C234E] active:scale-95 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer shadow-lg"
                        >
                            <ImageIcon className="w-6 h-6 text-[#7C4DFF] group-hover:scale-105 transition-transform" strokeWidth={2} />
                            <div className="flex flex-col">
                                <span className="font-display font-bold text-[13px] text-white">Gallery</span>
                                <span className="font-sans text-[9px] text-gray-400 mt-0.5 leading-none">Upload from photos</span>
                            </div>
                        </button>

                        {/* Flash Card */}
                        <button
                            onClick={handleToggleTorch}
                            className={`border rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer shadow-lg active:scale-95 ${isTorchOn ? 'bg-[#7C4DFF]/15 border-[#7C4DFF]' : 'bg-[#141A3A] border-[#232A56] hover:bg-[#1C234E]'}`}
                        >
                            <Flashlight className={`w-6 h-6 group-hover:scale-105 transition-transform ${isTorchOn ? 'text-[#00D26A]' : 'text-[#7C4DFF]'}`} strokeWidth={2} />
                            <div className="flex flex-col">
                                <span className="font-display font-bold text-[13px] text-white">Flash</span>
                                <span className="font-sans text-[9px] text-gray-400 mt-0.5 leading-none">{isTorchOn ? 'Turn off light' : 'Turn on light'}</span>
                            </div>
                        </button>

                        {/* My QR Card */}
                        <button
                            onClick={() => {
                                if (streamRef.current) {
                                    streamRef.current.getTracks().forEach(track => track.stop());
                                }
                                if (onShowMyQr) onShowMyQr();
                            }}
                            className="bg-[#141A3A] border border-[#232A56] hover:bg-[#1C234E] active:scale-95 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer shadow-lg"
                        >
                            <QrCode className="w-6 h-6 text-[#7C4DFF] group-hover:scale-105 transition-transform" strokeWidth={2} />
                            <div className="flex flex-col">
                                <span className="font-display font-bold text-[13px] text-white">My QR</span>
                                <span className="font-sans text-[9px] text-gray-400 mt-0.5 leading-none">Show my QR code</span>
                            </div>
                        </button>
                    </div>

                    {/* Trusted/Security Note Card */}
                    <div className="bg-[#101633] border border-[#232A56] rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#7C4DFF]/10 flex items-center justify-center border border-[#7C4DFF]/20 flex-shrink-0">
                            <Shield className="w-5 h-5 text-[#7C4DFF]" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="font-display font-bold text-[12px] text-white leading-tight">Only trusted family QR codes are accepted.</span>
                            <span className="font-sans text-[10px] text-gray-400 mt-0.5 leading-tight">Your privacy and safety are our priority.</span>
                        </div>
                    </div>

                    {/* Can't Scan? Enter Code Manually Button */}
                    <button
                        onClick={() => {
                            // Close camera scanner and prompt modal or form
                            if (streamRef.current) {
                                streamRef.current.getTracks().forEach(track => track.stop());
                            }
                            setShowAddFamilyModal(true);
                        }}
                        className="w-full bg-[#7C4DFF]/15 border border-[#7C4DFF]/30 hover:bg-[#7C4DFF]/25 active:scale-[0.99] transition-all rounded-2xl p-4 flex items-center justify-between text-left group cursor-pointer shadow-lg"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#7C4DFF]/20 flex items-center justify-center border border-[#7C4DFF]/40 text-[#7C4DFF] group-hover:scale-105 transition-transform">
                                <Keyboard className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="font-sans text-[11px] text-gray-400">Can't scan?</span>
                                <span className="font-display font-bold text-[15px] text-white mt-0.5">Enter Code Manually</span>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#7C4DFF] group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                    </button>

                    {/* Footer Links (Need Help?) */}
                    <div className="flex justify-center items-center gap-1.5 text-gray-400 text-[12px] font-sans font-semibold pt-1">
                        <span className="opacity-80">Need help? Visit</span>
                        <a href="#help" className="text-[#7C4DFF] hover:underline flex items-center gap-0.5">
                            Help Center
                            <ChevronRight className="w-3 h-3 inline-block" strokeWidth={3} />
                        </a>
                    </div>
                </div>
            </div>

            {/* Add Family Member Modal (Bottom Sheet Design matching screenshot) */}
            {showAddFamilyModal && (
                <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center pointer-events-auto transition-opacity duration-300">
                    <div className="w-full max-w-md bg-[#141A3A] border-t border-[#232A56] rounded-t-[28px] p-5 pb-8 flex flex-col items-center relative animate-slide-up shadow-2xl">
                        {/* Drag Handle */}
                        <div className="w-10 h-0.75 bg-[#232A56] rounded-full mb-5"></div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowAddFamilyModal(false)}
                            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>

                        {/* Title & Subtitle */}
                        <div className="text-center mb-6 mt-1">
                            <h2 className="text-[20px] font-bold text-white tracking-wide font-display">Add Family Member</h2>
                            <p className="text-[12px] text-gray-400 mt-0.5 font-medium font-sans">Choose how you want to connect</p>
                        </div>

                        {/* QR Option Card */}
                        <button
                            onClick={() => {
                                setShowAddFamilyModal(false);
                                updateScanState('searching');
                                setScannedData(null);
                            }}
                            className="w-full bg-[#101633] border border-[#232A56] hover:bg-[#141A3A] transition-all rounded-[20px] p-3 flex items-center justify-between text-left group shadow-lg"
                        >
                            <div className="flex items-center gap-3">
                                {/* Custom Stylized Purple QR Icon */}
                                <div className="w-11 h-11 rounded-[14px] bg-[#7C4DFF]/15 flex items-center justify-center border border-[#232A56] group-hover:scale-105 transition-transform">
                                    <QrCode className="w-5.5 h-5.5 text-[#7C4DFF]" />
                                </div>

                                <div>
                                    <h3 className="text-[14px] font-bold text-white leading-tight font-display">Scan QR Code</h3>
                                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium font-sans">Scan the QR code of your family member</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}