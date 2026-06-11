import React from 'react';
import SOSButton from '../components/SOSButton';
import { Lock, Fingerprint, Shield, AlertTriangle, X, Mic, Radio, Signal, ShieldCheck, Eye, MessageSquare, Phone, User, UserCheck, Volume2, Calculator, Map, Navigation, ChevronRight, Siren, Menu, Building2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useKavachStore } from '../store/useKavachStore';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, serverTimestamp, updateDoc, doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { KavachSafe } from '../services/KavachNative';
import { stopVoiceSentinel, startVoiceSentinel } from '../hooks/KavachVoiceEngine';
import KavachAIChat from '../components/KavachAIChat';
import KavachMap from '../components/maps/KavachMap';
import { useCall } from '../contexts/CallContext';
import { fetchNearbyPoliceMappls, isOfficialPoliceStation } from '../services/MapplsService';

// 🚨 Web Audio API Police Siren Synthesizer (Browser Fallback/Cross-Platform)
let audioCtx: AudioContext | null = null;
let sirenOscillator: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let sirenInterval: any = null;

const startWebSiren = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (sirenOscillator) return;

    sirenOscillator = audioCtx.createOscillator();
    sirenGain = audioCtx.createGain();

    sirenOscillator.type = 'square';
    sirenGain.gain.value = 0.8; // LOUD

    sirenOscillator.connect(sirenGain);
    sirenGain.connect(audioCtx.destination);

    sirenOscillator.start();

    let isHigh = false;
    sirenInterval = setInterval(() => {
      isHigh = !isHigh;
      if (sirenOscillator && audioCtx) {
        sirenOscillator.frequency.setTargetAtTime(isHigh ? 1200 : 700, audioCtx.currentTime, 0.1);
      }
    }, 450); // fast alternating police siren
  } catch (e) {
    console.error("Web Audio API not supported", e);
  }
};

const stopWebSiren = () => {
  if (sirenOscillator) {
    try {
      sirenOscillator.stop();
      sirenOscillator.disconnect();
    } catch (e) { }
    sirenOscillator = null;
  }
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
};

interface SOSScreenProps {
  isLocked: boolean;
  activeTab: string;
  isGhostMode: boolean;
  handleManualUnlock: () => void | Promise<void>;
}

export default function SOSScreen({ isLocked, activeTab, isGhostMode, handleManualUnlock }: SOSScreenProps) {
  const { t } = useLanguage();
  const { role, user, isSOSActive, activeAlertId, setSOSActive, triggerMethod, safetyPin, userPos, activeRadius, setActiveRadius, handshakeCode } = useKavachStore();

  // 🛡️ TACTICAL PURITY: Responders must NEVER see the victim's emergency UI.
  // We check both the store and the persistent storage to prevent identity leakage.
  const storedRole = localStorage.getItem('kavach_user_role');
  if (role === 'protector' || storedRole === 'protector') return null;

  const [showPinOverlay, setShowPinOverlay] = React.useState(false);
  const [showAbortReason, setShowAbortReason] = React.useState(false);
  const [abortReason, setAbortReason] = React.useState('');
  const [enteredPin, setEnteredPin] = React.useState('');
  const [nearbyCount, setNearbyCount] = React.useState(0);
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = React.useState(false);
  const [isSafeHavenMapOpen, setIsSafeHavenMapOpen] = React.useState(false);
  const [safeHavenTarget, setSafeHavenTarget] = React.useState<any>(null);
  const [smsStatus, setSmsStatus] = React.useState('INITIALIZING...');
  const [protectors, setProtectors] = React.useState<any[]>([]);
  const [nearestPolice, setNearestPolice] = React.useState<{ name: string, lat: number, lng: number, dist?: string } | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const { initiateCall, callState } = useCall();

  const [unreadCount, setUnreadCount] = React.useState(0);
  const [totalMessages, setTotalMessages] = React.useState(0);

  // 💬 COMMAND HUB UNREAD BADGE LOGIC
  React.useEffect(() => {
    if (!user?.uid) return;
    const q = collection(db, "commandhub_chats", user.uid, "messages");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentCount = snapshot.size;
      setTotalMessages(prev => {
        if (!isAIChatOpen && prev > 0 && currentCount > prev) {
          setUnreadCount(u => u + (currentCount - prev));
        }
        return currentCount;
      });
    });
    return () => unsubscribe();
  }, [user?.uid, isAIChatOpen]);

  React.useEffect(() => {
    if (isAIChatOpen) setUnreadCount(0);
  }, [isAIChatOpen]);

  // 🕶️ STEALTH DISGUISE DECOY STATE
  const [isStealthDisguised, setIsStealthDisguised] = React.useState(false);
  const [calcInput, setCalcInput] = React.useState('');

  // 📡 SOS DISPATCH HANDSHAKE SEQUENCE
  React.useEffect(() => {
    if (isSOSActive) {
      const smsTimer1 = setTimeout(() => setSmsStatus('SENDING...'), 2000);
      const smsTimer2 = setTimeout(() => setSmsStatus('DELIVERED'), 5000);

      return () => {
        clearTimeout(smsTimer1);
        clearTimeout(smsTimer2);
      };
    } else {
      setSmsStatus('INITIALIZING...');
    }
  }, [isSOSActive]);

  // ⚡ TACTICAL RANGE HARDENING: Fixed 5KM Scanning (Optimized for performance)
  React.useEffect(() => {
    if (isSOSActive && activeAlertId && activeRadius < 5.0) {
      setActiveRadius(5.0);

      // 🛡️ SYNC FINAL RADIUS TO NATIONAL GRID IMMEDIATELY
      setDoc(doc(db, 'alerts', activeAlertId), {
        dispatchRadius: 5.0,
        lastEscalatedAt: serverTimestamp(),
        escalationReason: 'MAX_RANGE_FORCE_OVERRIDE'
      }, { merge: true }).catch(e => console.error("🛰️ RADIUS_FORCE_SYNC_ERROR:", e));

      console.log("⚡ KAVACH: Search Perimeter Hardened to 5.0KM (Max Range)");
    }
  }, [isSOSActive, activeAlertId, activeRadius]);

  // 📡 PROTECTOR RADAR LOGIC (ADAPTIVE RANGE SCAN)
  React.useEffect(() => {
    let unsubscribe: () => void = () => { };

    if (isSOSActive && userPos) {
      console.log(`📡 RADAR: Scanning for local protectors within ${activeRadius}KM tactical tier...`);
      const q = query(collection(db, 'users'), where('role', '==', 'protector'), where('isVerified', '==', true));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const allFound = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const inRange = allFound.filter((data: any) => {
          if (!data.coords) return false;

          // 🎖️ ELITE PRIORITY BYPASS: Army/Police always visible up to 5km
          const occupation = data.protectorVetting?.occupation || '';
          const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police'].some(role =>
            occupation.toLowerCase().includes(role.toLowerCase())
          );

          const dist = calculateDistance(userPos[0], userPos[1], data.coords[0], data.coords[1]);
          return isElite ? (dist <= 5.0) : (dist <= activeRadius);
        });

        setNearbyCount(inRange.length);
        setProtectors(inRange);
        console.log(`📡 RADAR UPDATE: Found ${inRange.length} verified protectors in tactical range.`);
      });
    }

    return () => {
      console.log("📡 RADAR: Disengaging tactical scan.");
      unsubscribe();
      setProtectors([]);
    };
  }, [isSOSActive, userPos, activeRadius]);

  // 🚔 FETCH NEAREST POLICE FOR QUICK ESCAPE ROUTE (SYNCED WITH DASHBOARD MAPPLS ENGINE)
  React.useEffect(() => {
    if (isSOSActive && userPos && !nearestPolice) {
      const fetchNearestPolice = async () => {
        try {
          const [lat, lng] = userPos;

          // 🛰️ PRIMARY ENGINE: MapmyIndia (Mappls)
          let realStations: any[] = await fetchNearbyPoliceMappls(lat, lng);
          const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

          const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          };

          // 🛰️ SECONDARY ENGINE: Mapbox Category Search
          if (realStations.length === 0) {
            try {
              const url = `https://api.mapbox.com/search/searchbox/v1/category/police?proximity=${lng},${lat}&limit=10&access_token=${MAPBOX_TOKEN}`;
              const response = await fetch(url);
              const data = await response.json();
              if (data && Array.isArray(data.features) && data.features.length > 0) {
                realStations = data.features.map((f: any) => {
                  const fLat = f.geometry?.coordinates?.[1] || f.properties?.coordinates?.latitude || lat;
                  const fLng = f.geometry?.coordinates?.[0] || f.properties?.coordinates?.longitude || lng;
                  const distKm = calculateDistance(lat, lng, fLat, fLng);
                  return {
                    name: f.properties?.name || f.properties?.full_address || "Local Police Station",
                    distVal: distKm,
                    lat: fLat,
                    lng: fLng
                  };
                }).filter((s: any) => isOfficialPoliceStation(s.name));
              }
            } catch (e) { }
          }

          // 🛰️ FALLBACK ENGINE: OpenStreetMap (Overpass API)
          if (realStations.length === 0) {
            try {
              const query = `[out:json];(node["amenity"="police"](around:25000,${lat},${lng});way["amenity"="police"](around:25000,${lat},${lng}););out center;`;
              const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
              const response = await fetch(url);
              const data = await response.json();
              if (data && Array.isArray(data.elements) && data.elements.length > 0) {
                realStations = data.elements.map((item: any) => {
                  const fLat = item.lat || item.center?.lat;
                  const fLng = item.lon || item.center?.lng;
                  const d = calculateDistance(lat, lng, fLat, fLng);
                  return {
                    name: item.tags?.name || "Local Police Station",
                    distVal: d,
                    lat: fLat,
                    lng: fLng
                  };
                }).filter((s: any) => s.distVal <= 25);
              }
            } catch (e) { }
          }

          // 🛰️ PROGRESSIVE RANGE DISCOVERY & DE-DUPLICATION (EXACT MATCH WITH NEARBY HUB)
          const sortedStations = realStations.sort((a: any, b: any) => (a.distVal || 0) - (b.distVal || 0));
          const dedupedStations: any[] = [];
          for (const station of sortedStations) {
            const isDuplicate = dedupedStations.some((existing) => {
              const isCoordsSame = station.lat && station.lng && existing.lat && existing.lng &&
                Math.abs(station.lat - existing.lat) < 0.002 && Math.abs(station.lng - existing.lng) < 0.002;
              const isDistanceSame = Math.abs((station.distVal || 0) - (existing.distVal || 0)) < 0.1;
              return isCoordsSame || isDistanceSame;
            });
            if (!isDuplicate) {
              dedupedStations.push(station);
            } else {
              const index = dedupedStations.findIndex((existing) => {
                return Math.abs((station.distVal || 0) - (existing.distVal || 0)) < 0.1;
              });
              if (index !== -1) {
                const existing = dedupedStations[index];
                const isNewBetter = !station.name.toLowerCase().includes('auxilliary') && existing.name.toLowerCase().includes('auxilliary');
                if (isNewBetter) {
                  dedupedStations[index] = station;
                }
              }
            }
          }

          let filteredStations = dedupedStations.filter((s: any) => (s.distVal || 0) <= 5);
          if (filteredStations.length === 0) filteredStations = dedupedStations.filter((s: any) => (s.distVal || 0) <= 10);
          if (filteredStations.length === 0 && dedupedStations.length > 0) filteredStations = [dedupedStations[0]];

          if (filteredStations.length > 0) {
            const finalStation = filteredStations[0];
            const distStr = finalStation.dist || (finalStation.distVal ? (finalStation.distVal < 1 ? `${(finalStation.distVal * 1000).toFixed(0)}m AWAY` : `${finalStation.distVal.toFixed(1)}km AWAY`) : 'NEARBY');

            setNearestPolice({
              name: finalStation.name || 'Nearest Police Station',
              lat: finalStation.lat,
              lng: finalStation.lng,
              dist: distStr
            });
          } else {
            // 🛑 CRITICAL MOCK FALLBACK
            setNearestPolice({
              name: 'Kavach Tactical Hub (Local)',
              lat: userPos[0] + 0.01,
              lng: userPos[1] + 0.01,
              dist: '1.2km AWAY'
            });
          }

        } catch (e) {
          console.error("SOS Police Fetch Error (Falling back to local grid)", e);
          if (!nearestPolice) {
            setNearestPolice({
              name: 'Kavach Tactical Hub (Local)',
              lat: userPos[0] + 0.01,
              lng: userPos[1] + 0.01,
              dist: '1.2km AWAY'
            });
          }
        }
      };

      fetchNearestPolice();
    }
  }, [isSOSActive, userPos, nearestPolice]);

  // 📡 MISSION CRITICAL: 2-Second High-Precision Location Uplink
  React.useEffect(() => {
    let updateTimer: any;
    if (isSOSActive && activeAlertId && userPos) {
      updateTimer = setInterval(async () => {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');

          await setDoc(doc(db, 'alerts', activeAlertId), {
            latitude: userPos[0],
            longitude: userPos[1],
            'location.latitude': userPos[0],
            'location.longitude': userPos[1],
            lastLocationUpdate: serverTimestamp()
          }, { merge: true });
          console.log("🛰️ KAVACH UPLINK: Precision coordinates transmitted.");
        } catch (e) {
          console.error("🛰️ UPLINK_SYNC_ERROR:", e);
        }
      }, 2000); // 🕒 2-Second Tactical Interval
    }
    return () => clearInterval(updateTimer);
  }, [isSOSActive, activeAlertId, userPos]);

  // 🎙️ MISSION CRITICAL: LIVE TRANSCRIPT ENGINE (RETIRED DUE TO HARDWARE CLASH)
  // Transcription during SOS is disabled to prioritize high-fidelity native recording.
  // This prevents the 'Mic Busy' error on critical SOS interceptors.

  const [isBeingMonitored, setIsBeingMonitored] = React.useState(false);
  const [showSafetyVerification, setShowSafetyVerification] = React.useState(false);
  const [activeAlertData, setActiveAlertData] = React.useState<any>(null);

  // 📡 ACTIVE MISSION SYNC: Real-time Alert Data Stream
  React.useEffect(() => {
    let unsubscribe = () => { };

    if (isSOSActive && activeAlertId) {
      console.log(`🛰️ SOS GRID: Establishing Uplink for Mission [${activeAlertId}]`);
      const alertRef = doc(db, 'alerts', activeAlertId);
      unsubscribe = onSnapshot(alertRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          console.log(`🛡️ SOS GRID: Mission Status Update [${data.status}]`, data);
          setActiveAlertData(data);

          if (data.isBeingMonitored && !isBeingMonitored) {
            if (Capacitor.isNativePlatform()) KavachSafe.triggerHapticPulse();
            toast.info("COMMAND CENTER: TACTICAL UPLINK ESTABLISHED.");
          }
          setIsBeingMonitored(!!data.isBeingMonitored);

          // 🛰️ SYNC HANDSHAKE CODE FROM CLOUD
          if (data.handshakeCode && !useKavachStore.getState().handshakeCode) {
            useKavachStore.setState({ handshakeCode: data.handshakeCode });
          }

          // 🛡️ SAFETY HANDSHAKE DETECTION (Inclusive Check)
          if (data.status === 'rescued_pending_victim_clearance' || data.verification?.verifiedBy) {
            console.log("🛡️ SOS GRID: Safety Verification Required - Opening HUD");
            setShowSafetyVerification(true);
          } else {
            setShowSafetyVerification(false);
          }
        }
      });
    }
    return () => unsubscribe();
  }, [isSOSActive, activeAlertId]); // Removed isBeingMonitored to prevent flicker/resub

  const handleConfirmSafety = async () => {
    const alertId = useKavachStore.getState().activeAlertId;
    setShowSafetyVerification(false);

    // 🛡️ FAST-TRACK RESOLUTION: Protector already verified, just close it
    try {
      toast.info("Finalizing Mission Clearance...");
      await setSOSActive(false, alertId, triggerMethod, 'Verified Safe: Rescue Completed');
      toast.success("Mission Verified. Safety Grid Restored.");
    } catch (e) {
      console.error("Safety Clearance Error:", e);
      // Fallback: Force local state reset if network fails
      setSOSActive(false);
    }
  };

  const handleRequestMoreHelp = async () => {
    const alertId = useKavachStore.getState().activeAlertId;
    if (!alertId) return;

    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        status: 'responding',
        victimSafetyStatus: 'needs_help',
        reopenedAt: serverTimestamp()
      });
      setShowSafetyVerification(false);
      toast.error("Assistance Request Relayed. Grid Active.");
    } catch (e) {
      toast.error("Failed to relay request.");
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleAbort = async () => {
    // 🛡️ SECURITY PROTOCOL: Enforce PIN-only verification for aborting missions.
    // Biometrics (fingerprint/face) are disabled for mission aborts to prevent forced authorization.
    setShowPinOverlay(true);
  };

  const handlePinSubmit = async (digit: string) => {
    const newPin = enteredPin + digit;
    if (newPin.length <= 4) {
      setEnteredPin(newPin);
      if (newPin.length === 4) {
        if (newPin === safetyPin) {
          setShowAbortReason(true);
          setShowPinOverlay(false);
          setEnteredPin('');
          toast.success("PIN Verified. Provide Clearance Reason.");
        } else {
          toast.error("Invalid Secret PIN. Access Denied.");
          setEnteredPin('');
        }
      }
    }
  };

  const [isAborting, setIsAborting] = React.useState(false);

  const handleFinalAbort = async () => {

    if (!abortReason.trim()) {
      toast.error("Please provide a mission clearance reason.");
      return;
    }

    setIsAborting(true);
    const alertId = useKavachStore.getState().activeAlertId;

    // 🛡️ PHASE 1: INSTANT LOCAL HARDWARE RELEASE (Optimistic UI)
    // We kill the siren and recording IMMEDIATELY so the user isn't stuck with noise/hangs.
    stopWebSiren();
    if (Capacitor.isNativePlatform()) {
      KavachSafe.stopForensicCapture();
      KavachSafe.stopContinuousSiren();
    }

    // 🛡️ PHASE 2: INSTANT LOCAL SNAPBACK (Optimistic UI)
    // We clear the local state first so the UI changes within milliseconds.
    setSOSActive(false);
    setShowAbortReason(false);
    setAbortReason('');
    setIsAborting(false);
    toast.success("Mission De-escalated. Grid Restored.");

    // 🛡️ PHASE 3: GRID SYNC & ACCOUNTABILITY (Background)
    try {
      await setSOSActive(false, alertId, triggerMethod, abortReason);
    } catch (e: any) {
      console.warn("⚠️ SOS Grid Sync: Background update failed.", e);
    }
  };

  // 🔒 DEVICE LOCK SCREEN
  if (isLocked && activeTab !== 'sos') {
    return (
      <div className="min-h-screen bg-[#060000] flex flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-12">
          <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-accent-blue shadow-2xl">
            <Lock size={48} className="animate-pulse" />
          </div>
        </div>
        <h2 className="text-[44px] font-black italic uppercase tracking-tighter mb-4">{t('shield_locked')}</h2>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px] mb-12 opacity-60">{t('identity_verification')}</p>
        <button
          onClick={async () => {
            try {
              await handleManualUnlock();
            } catch (e) {
              setShowPinOverlay(true);
              toast.error("Biometric handshake failed. Fallback to PIN active.");
            }
          }}
          className="px-10 py-5 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-4 active:scale-95 transition-all shadow-2xl"
        >
          <Fingerprint size={20} /> {t('use_biometrics')}
        </button>
      </div>
    );
  }

  if (isSOSActive) {
    if (isStealthDisguised) {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#0F172A] flex flex-col justify-end p-4 select-none font-sans text-white">
          {/* Decoy Calculator Display */}
          <div className="flex-1 flex flex-col justify-end items-end mb-8 px-4">
            <span className="text-gray-400 text-sm font-light tracking-wide min-h-[28px]">{calcInput || '0'}</span>
            <span className="text-white text-5xl font-extralight tracking-tighter mt-3 truncate max-w-full">
              {(() => {
                try {
                  if (!calcInput) return '0';
                  if (/^[0-9\+\-\*\/\.\s()]+$/.test(calcInput)) {
                    // Using new Function avoids the strict 'eval' bundler warnings
                    const result = new Function('return ' + calcInput)();
                    return String(result).slice(0, 12);
                  }
                  return '0';
                } catch (e) {
                  return '0';
                }
              })()}
            </span>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-4 mb-8 max-w-md mx-auto w-full">
            {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '=', '🔓'].map((key) => {
              const isOperator = ['/', '*', '-', '+', '='].includes(key);
              const isClear = ['C', '(', ')'].includes(key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'C') {
                      setCalcInput('');
                    } else if (key === '=') {
                      // Handled in dynamic eval display
                    } else if (key === '🔓') {
                      setIsStealthDisguised(false);
                      setCalcInput('');
                      toast.success("DISGUISE DISENGAGED");
                    } else {
                      const nextInput = calcInput + key;
                      setCalcInput(nextInput);
                      // Custom trigger: entering safetyPin (e.g. 1234) escapes disguise
                      if (nextInput === safetyPin) {
                        setIsStealthDisguised(false);
                        setCalcInput('');
                        toast.success("DISGUISE DISENGAGED");
                      }
                    }
                  }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all active:scale-90",
                    isOperator ? "bg-amber-500 text-white active:bg-amber-400" :
                      isClear ? "bg-gray-700 text-gray-200 active:bg-gray-600" :
                        "bg-gray-800 text-white active:bg-gray-700"
                  )}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div
  className="fixed inset-0 z-[5000] overflow-y-auto px-4 pt-6 pb-8"
  style={{
    background: `
      radial-gradient(
        circle at left center,
        rgba(92,140,255,0.55) 0%,
        rgba(92,140,255,0.18) 28%,
        transparent 52%
      ),

      linear-gradient(
        180deg,
        #071433 0%,
        #0B1D4A 15%,
        #173778 35%,
        #3D67AF 58%,
        #8DB5EA 82%,
        #F5F8FD 100%
      )
    `
  }}
>
        {/* PIN Pad Overlay */}
        {showPinOverlay && (
          <div className="absolute inset-0 z-[6000] bg-black/95 flex flex-col p-8">
            <div className="flex-1 flex flex-col items-center justify-center space-y-12">
              <div className="text-center">
                <Lock size={40} className="text-accent-blue mx-auto mb-4" />
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Identity Verification</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 italic">Enter Secure PIN to Verify</p>
              </div>

              <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn(
                    "w-4 h-4 rounded-full border-2 transition-all duration-300",
                    enteredPin.length >= i ? "bg-accent-blue border-accent-blue shadow-[0_0_15px_rgba(45,212,191,0.5)]" : "border-white/20"
                  )} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      if (k === 'C') setEnteredPin('');
                      else if (k === '⌫') setEnteredPin(prev => prev.slice(0, -1));
                      else handlePinSubmit(k.toString());
                    }}
                    className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-white active:bg-accent-blue/20 transition-all active:scale-90"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => { setShowPinOverlay(false); setEnteredPin(''); }}
              className="py-6 text-gray-500 font-bold uppercase tracking-widest text-[8px] hover:text-white"
            >
              RETURN TO KAVACH DASHBOARD
            </button>
          </div>
        )}

        {/* 🛡️ SAFETY HANDSHAKE POPUP (RESPONSE VERIFICATION) */}
        {showSafetyVerification && (
          <div className="absolute inset-0 z-[7000] flex items-center justify-center p-8 bg-black/90">
            <div className="relative w-full max-w-[340px] bg-[#111] border border-white/10 rounded-[40px] p-8 text-center space-y-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <ShieldCheck size={40} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Response Verification</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action Required</p>
                </div>
              </div>

              <p className="text-[13px] font-bold text-white/70 leading-relaxed px-2 uppercase tracking-wide">
                The assigned protector has completed the emergency response. Please verify your safety status.
              </p>

              <div className="pt-4 space-y-3">
                <button
                  onClick={handleConfirmSafety}
                  className="w-full py-6 bg-emerald-500 text-white rounded-[24px] font-black uppercase tracking-[4px] text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  SAFE
                </button>
                <button
                  onClick={handleRequestMoreHelp}
                  className="w-full py-6 bg-white/5 text-gray-400 rounded-[24px] font-black uppercase tracking-[4px] text-[10px] border border-white/5 active:scale-95 transition-all"
                >
                  REQUEST HELP
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2.5 opacity-30">
                <Shield size={10} className="text-white" />
                <span className="text-[7px] font-black uppercase tracking-[3px] text-white">Kavach Handshake Protocol Active</span>
              </div>
            </div>
          </div>
        )}

        {/* 🛡️ INSTITUTIONAL SAFETY CONFIRMATION */}
        <AnimatePresence>
          {showAbortReason && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[8000] flex items-center justify-center p-6 bg-black/90"
            >
              <div className="relative w-full max-w-[400px] max-h-[92vh] bg-white rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col overflow-y-auto">
                <div className="flex flex-col items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
                    <Shield size={28} strokeWidth={2.5} />
                  </div>
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">Safety Confirmation</h2>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Official Record Update</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-[12px] font-semibold text-gray-600 leading-relaxed text-center px-2">
                    {activeAlertData?.status === 'rescued_pending_victim_clearance'
                      ? "The Protector has confirmed your safety. Please provide a final closure note."
                      : "Please confirm why you are closing this SOS request."
                    }
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'I am safe now',
                      'Help has arrived',
                      'Reached a safe location',
                      'Accidentally triggered SOS',
                      'Threat no longer nearby',
                      'Other reason'
                    ].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setAbortReason(reason)}
                        className={cn(
                          "w-full py-3 px-4 rounded-xl text-[12px] font-bold text-left transition-colors border flex items-center justify-between",
                          abortReason === reason
                            ? "bg-blue-50 border-blue-600 text-blue-900"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <span>{reason}</span>
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                          abortReason === reason ? "border-blue-600 bg-blue-600" : "border-gray-300"
                        )}>
                          {abortReason === reason && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  {abortReason === 'Other reason' && (
                    <div className="mt-2">
                      <textarea
                        placeholder="Please provide details..."
                        className="w-full bg-white border border-gray-300 rounded-xl p-4 text-gray-900 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-gray-400 min-h-[80px]"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider text-center leading-relaxed">
                      False reports are logged for emergency accountability.
                    </p>
                  </div>

                  <button
                    onClick={handleFinalAbort}
                    disabled={!abortReason || isAborting}
                    className={cn(
                      "w-full py-4 rounded-xl font-black uppercase tracking-[2px] text-xs transition-all",
                      abortReason
                        ? "bg-blue-700 text-white hover:bg-blue-800"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed",
                      isAborting && "opacity-50 cursor-wait"
                    )}
                  >
                    {isAborting ? 'PROCESSING...' : 'CONFIRM & CLOSE ALERT'}
                  </button>

                  <div className="flex flex-col items-center gap-1.5 pt-2">
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-[8px] font-bold uppercase tracking-widest">ID: {useKavachStore.getState().activeAlertId?.slice(-4).toUpperCase()}</span>
                      <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span className="text-[8px] font-bold uppercase tracking-widest">Archived Securely</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 💬 FLOATING CHAT BUBBLE (COMMAND HUB) */}
        <div className="absolute bottom-36 right-4 z-50 flex flex-col items-center gap-1">
          <button
            onClick={() => setIsAIChatOpen(true)}
            className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white/20 active:scale-95 transition-all"
          >
            <MessageSquare size={20} />
          </button>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0F172A] flex items-center justify-center text-[8px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
          <span className="text-[8px] font-semibold text-white/50 uppercase tracking-widest">AI Help</span>
        </div>

        
        {/* Government SOS Background Glow */}
<div className="absolute inset-0 pointer-events-none overflow-hidden">

  <div
    className="absolute left-[-180px] top-[25%] w-[420px] h-[420px] rounded-full blur-[120px]"
    style={{
      background: "rgba(126,167,255,0.35)"
    }}
  />

  <div
    className="absolute left-0 right-0 bottom-[25%] mx-auto w-[500px] h-[220px] rounded-full blur-[140px]"
    style={{
      background: "rgba(255,255,255,0.28)"
    }}
  />
</div>

        {/* Monitoring Reassurance Indicator */}
        {isBeingMonitored && (
          <div className="absolute top-16 left-0 right-0 z-50 flex justify-center">
            <div className="px-6 py-2 bg-blue-700/10 border border-blue-700/30 rounded-full flex items-center gap-3">
              <Eye size={14} className="text-blue-400" />
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-[3px]">{t('watching_you')}</span>
            </div>
          </div>
        )}
        {/* Top Header */}
<div className="relative z-10 flex items-center justify-between gap-2 mb-5">

  {/* HIDE */}
            <button
              onClick={() => {
                setIsStealthDisguised(true);
                toast.success("APP HIDDEN");
              }}
              className="
                h-10 sm:h-12 md:h-14
                px-3 sm:px-4 md:px-6
                rounded-full
                border border-blue-500/30
                bg-white/5
                backdrop-blur-xl
                flex items-center gap-2
                text-white
                shadow-lg
                flex-shrink-0
              "
            >
              <Calculator
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]"
              />

              <span
                className="
                  text-[10px]
                  sm:text-xs
                  md:text-sm
                  font-semibold
                  tracking-wide
                  whitespace-nowrap
                "
              >
                HIDE
              </span>
            </button>

            {/* Protectors Map */}
            <button
              onClick={() => {
                setSafeHavenTarget(null);
                setIsSafeHavenMapOpen(true);
              }}
              className="
                flex-1
                h-10 sm:h-12 md:h-14
                px-3 sm:px-4 md:px-8
                rounded-full
                border border-blue-500/30
                bg-blue-500/10
                backdrop-blur-xl
                flex items-center justify-center gap-2
                text-blue-300
                shadow-lg
                min-w-0
              "
            >
              <Map
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]"
              />

              <span
                className="
                  text-[10px]
                  sm:text-xs
                  md:text-sm
                  font-semibold
                  truncate
                "
              >
                Protectors Map
              </span>
            </button>

            {/* IN RANGE */}
            <div
              className="
                h-10 sm:h-12 md:h-14
                px-2 sm:px-3 md:px-5
                rounded-full
                border border-blue-500/30
                bg-white/5
                backdrop-blur-xl
                flex items-center gap-1.5
                text-blue-200
                shadow-lg
                flex-shrink-0
              "
            >
              <Shield
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-[14px] md:h-[14px]"
              />

              <span
                className="
                  text-[9px]
                  sm:text-[10px]
                  md:text-xs
                  font-bold
                  whitespace-nowrap
                "
              >
                {nearbyCount} IN RANGE
              </span>
            </div>

        </div>
      {/* 🛡️ MAIN CONTENT */}
<div className="flex-1 flex flex-col gap-3 relative z-10">

  {/* 🛡️ KAVACH STATUS CARD (UPPER) */}
  <motion.div
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="w-full px-1"
  >
    <div className="bg-white rounded-2xl p-3 shadow-xl border border-slate-100">
      <div className="flex justify-between items-center gap-2">

        <div className="flex items-center gap-3 min-w-0">

          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0">
            <ShieldCheck size={16} className="text-blue-600" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              KAVACH Emergency Response System
            </h2>

            <p className="text-[10px] text-slate-500 mt-0.5">
              National Safety Network Active
            </p>
          </div>

        </div>

        <div className="px-3 py-2 bg-green-100 rounded-xl flex-shrink-0">
          <span className="text-[10px] font-bold text-green-700">
            ACTIVE
          </span>
        </div>

      </div>
    </div>
  </motion.div>

  {/* 🚨 EMERGENCY CALL STRIP (BELOW) */}
  <a
    href="tel:112"
    className="
      relative z-10 w-full
      flex items-center justify-between
      rounded-xl
      px-3 py-2
      overflow-hidden
      shadow-lg
    "
  >
    <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-500" />

    <div className="relative z-10 flex items-center gap-2">
      <Phone size={14} className="text-white" fill="white" />
      <span className="text-white font-bold text-[11px]">
        Emergency Call
      </span>
    </div>

    <span className="relative z-10 text-white font-black text-lg">
      112
    </span>
  </a>

  <div className="w-full space-y-3 mt-1 pointer-events-auto">

    {/* RESPONDER HUB */}
    <AnimatePresence mode="wait">
      {(activeAlertData?.activeResponders?.length > 0) && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="space-y-2"
        >

          <div className="flex items-center justify-between px-1">

            <p className="text-[8px] sm:text-[9px] font-semibold text-blue-600 uppercase tracking-[1px] sm:tracking-[2px] flex items-center gap-1.5">
              <ShieldCheck
                className="w-3 h-3"
              />

              {(() => {
                const unique =
                  (activeAlertData?.activeResponders || []).filter(
                    (v, i, a) =>
                      a.findIndex(t => t.uid === v.uid) === i
                  );

                return unique.length;
              })()}

              Protector
              {(activeAlertData?.activeResponders?.length || 0) > 1
                ? "s"
                : ""}
              {" "}
              Responding
            </p>

            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            </div>

          </div>

          <div className="max-h-[160px] sm:max-h-[180px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar space-y-2 sm:space-y-3">

            {(activeAlertData?.activeResponders || [])
              .filter(
                (v, i, a) =>
                  a.findIndex(t => t.uid === v.uid) === i
              )
              .map((responder) => (

                <motion.div
                  key={responder.uid}
                  layout
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white border border-slate-200 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between relative overflow-hidden"
                >

                  <div className="flex items-center gap-2 sm:gap-3 relative z-10 min-w-0">

                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 flex-shrink-0">
                      <UserCheck
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700"
                      />
                    </div>

                    <div className="space-y-0.5 min-w-0">

                      <div className="flex items-center gap-1 sm:gap-2">

                        <h4 className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold text-slate-800 uppercase truncate max-w-[110px] sm:max-w-[180px]">
                          {responder.name}
                        </h4>

                        {(responder.xp || 0) >= 25000 && (
                          <div className="px-1 py-0.5 bg-blue-700 rounded-full flex items-center flex-shrink-0">
                            <ShieldCheck
                              className="w-2 h-2 text-white"
                            />
                          </div>
                        )}

                      </div>

                      <div className="flex items-center gap-1">

                        <div className="w-1 h-1 bg-blue-600 rounded-full" />

                        <p className="text-[6px] sm:text-[7px] font-bold text-gray-500 uppercase tracking-wide sm:tracking-widest">
                          Active Dispatch
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="flex items-center gap-2 relative z-10">

                    <button
                      onClick={() => {
                        console.log(
                          "📞 KAVACH UI: Secure Link Initiated for",
                          responder.name
                        );

                        initiateCall(
                          responder.uid,
                          responder.name
                        );
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-700 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all hover:bg-blue-800 flex-shrink-0"
                    >
                      <Phone
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        strokeWidth={2.5}
                      />
                    </button>

                  </div>

                </motion.div>
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

            {/* 🚔 QUICK ESCAPE ROUTE NAVIGATOR */}
            {/* 🚔 QUICK ESCAPE ROUTE NAVIGATOR */}
<AnimatePresence>
  {nearestPolice && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pb-1 px-1"
    >
      <button
        onClick={() => {
          setSafeHavenTarget(nearestPolice);
          setIsSafeHavenMapOpen(true);
          toast.success(`Locating ${nearestPolice.name}`);
        }}
        className="
          w-full
          bg-white
          rounded-2xl sm:rounded-[30px]
          p-3 sm:p-4 md:p-6
          flex items-center justify-between
          active:scale-95
          transition-all
          shadow-xl
          border border-slate-100
          relative overflow-hidden
        "
      >
        <div className="absolute inset-0 bg-blue-500/5" />

        {/* Left Side */}
        <div className="flex items-center gap-2 sm:gap-4 relative z-10 min-w-0">

          <div
            className="
              w-10 h-10
              sm:w-12 sm:h-12
              rounded-full
              bg-slate-100
              flex items-center justify-center
              shadow-sm
              flex-shrink-0
            "
          >
            <Building2
              className="
                w-4 h-4
                sm:w-6 sm:h-6
                text-slate-500
              "
            />
          </div>

          <div className="text-left min-w-0">

            <span
              className="
                block
                text-[9px]
                sm:text-xs
                font-bold
                text-blue-700
                uppercase
                tracking-wide
                mb-1
              "
            >
              Nearest Police Station
            </span>

            <span
              className="
                block
                text-[10px]
                sm:text-sm
                font-bold
                text-slate-900
                truncate
                max-w-[110px]
                sm:max-w-[180px]
                md:max-w-[240px]
              "
            >
              {nearestPolice.name}
            </span>

          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3 relative z-10 flex-shrink-0">

          {nearestPolice.dist && (
            <>
              <div className="w-px h-10 sm:h-14 bg-slate-200 rounded-full" />

              <div className="flex flex-col items-center justify-center">

                <span
                  className="
                    text-sm
                    sm:text-lg
                    md:text-2xl
                    font-bold
                    text-slate-900
                    leading-none
                  "
                >
                  {String(nearestPolice.dist ?? '')
                    .toUpperCase()
                    .replace(' AWAY', '')
                    .replace('KM', 'km')}
                </span>

                <span
                  className="
                    text-[8px]
                    sm:text-[10px]
                    font-bold
                    text-blue-700
                    uppercase
                    mt-1
                  "
                >
                  AWAY
                </span>

              </div>
            </>
          )}

          <ChevronRight
            className="
              w-4 h-4
              sm:w-5 sm:h-5
              md:w-6 md:h-6
              text-slate-500
            "
          />
        </div>
      </button>
    </motion.div>
  )}
</AnimatePresence>

            {/* 🛡️ TACTICAL HANDSHAKE HUB */}
           {/* 🛡️ RESCUE VERIFICATION HUB */}
{/* 🛡️ RESCUE VERIFICATION CODE */}

<motion.div
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4 }}
  className="
    mx-1
    bg-white
    rounded-[28px]
    border border-[#DCE6F5]
    shadow-lg
    px-5
    py-6
  "
>

  {/* Title */}
  <p
    className="
      text-center
      text-[10px]
      font-bold
      tracking-[2px]
      text-[#64748B]
      uppercase
      mb-5
    "
  >
    Rescue Verification Code
  </p>

  {/* Verification Box */}
  <div
    className="
      mx-auto
      max-w-[250px]
      bg-[#EDF4FF]
      rounded-2xl
      px-4
      py-4
      flex
      items-center
      justify-center
      gap-4
    "
  >
    <Fingerprint
      size={28}
      className="text-[#2563EB]"
      strokeWidth={2.2}
    />

    <span
      className="
        text-[44px]
        font-black
        tracking-[10px]
        text-[#0A2E6D]
        leading-none
      "
    >
      {handshakeCode ||
        activeAlertData?.verification?.handshakeCode ||
        "----"}
    </span>
  </div>

  {/* Description */}
  <p
    className="
      mt-5
      text-center
      text-[11px]
      leading-6
      text-[#64748B]
      max-w-[280px]
      mx-auto
    "
  >
    Provide this code to your verified rescuer to formally
    close the emergency protocol.
  </p>

</motion.div>
          </div>
        </div>

        {/* 🚨 MISSION CONTROL HUB */}
<div className="relative z-10 mt-3 sm:mt-4 lg:mt-5 pb-safe pb-8 sm:pb-12 space-y-4 px-2">

  {/* 🚨 ACOUSTIC PANIC CONTROLLER */}
  <div className="grid grid-cols-2 gap-2.5">

  {/* Emergency Siren */}
  <button
    onClick={async () => {
      stopVoiceSentinel();
      startWebSiren();

      if (Capacitor.isNativePlatform()) {
        await KavachSafe.startContinuousSiren();
      }

      (window as any)._kavach_manual_siren = true;

      toast.error("MANUAL PANIC ALARM ACTIVE", {
        icon: "🚨",
        duration: 5000,
      });
    }}
    className="
      relative
      h-[118px]
      rounded-[22px]
      flex
      flex-col
      items-center
      justify-center
      active:scale-[0.98]
      transition-all
    "
    style={{
      background: "#FFF8F8",
      border: "1px solid rgba(255,255,255,0.85)",
      boxShadow: `
        0 4px 18px rgba(15,23,42,0.04),
        inset 0 1px 0 rgba(255,255,255,0.9)
      `
    }}
  >
    {/* Icon */}
    <div
      className="
        w-[52px]
        h-[52px]
        rounded-full
        flex
        items-center
        justify-center
        mb-3
      "
      style={{
        background: "#FFEFEF"
      }}
    >
      <Siren
        size={22}
        strokeWidth={2}
        className="text-[#FF4343]"
      />
    </div>

    {/* Title */}
    <h3
      className="
        text-[13px]
        font-bold
        tracking-[-0.2px]
      "
      style={{
        color: "#EF2D2D"
      }}
    >
      EMERGENCY SIREN
    </h3>

    {/* Subtitle */}
    <p
      className="
        text-[11px]
        mt-1
        font-medium
      "
      style={{
        color: "#7A8599"
      }}
    >
      Alert nearby people
    </p>

  </button>

  {/* Stop Siren */}
  <button
    onClick={async () => {
      stopWebSiren();

      if (Capacitor.isNativePlatform()) {
        await KavachSafe.stopContinuousSiren();
      }

      (window as any)._kavach_manual_siren = false;

      toast.success("All Audible Alarms Silenced.");

      const state = useKavachStore.getState();

      if (state.isVoiceTriggerActive) {
        startVoiceSentinel(() => {
          state.setPendingSOS(true, "voice");
        });
      }
    }}
    className="
      relative
      h-[118px]
      rounded-[22px]
      flex
      flex-col
      items-center
      justify-center
      active:scale-[0.98]
      transition-all
    "
    style={{
      background: "#F8FAFD",
      border: "1px solid rgba(255,255,255,0.85)",
      boxShadow: `
        0 4px 18px rgba(15,23,42,0.04),
        inset 0 1px 0 rgba(255,255,255,0.9)
      `
    }}
  >
    {/* Icon */}
    <div
      className="
        w-[52px]
        h-[52px]
        rounded-full
        flex
        items-center
        justify-center
        mb-3
      "
      style={{
        background: "#EEF2F7"
      }}
    >
      <Volume2
        size={22}
        strokeWidth={2}
        className="text-[#5E6F92]"
      />
    </div>

    {/* Title */}
    <h3
      className="
        text-[13px]
        font-bold
        tracking-[-0.2px]
      "
      style={{
        color: "#143C7D"
      }}
    >
      STOP SIREN
    </h3>

    {/* Subtitle */}
    <p
      className="
        text-[11px]
        mt-1
        font-medium
      "
      style={{
        color: "#7A8599"
      }}
    >
      Silence the alert
    </p>
  </button>

</div>

  {/* 🛡️ CLOSE EMERGENCY */}
  <div className="border-t border-white/10 pt-4">
    <button
      onClick={handleAbort}
      className="w-full min-h-[56px] py-4 bg-[#003366] text-white rounded-2xl font-semibold uppercase tracking-[2px] sm:tracking-[3px] text-[10px] sm:text-xs flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg"
    >
      <Lock size={18} />
      Close Emergency Request
    </button>
  </div>

  {/* Footer */}
<div className="px-1 mt-2">
  <div
    className="
      h-[36px]
      rounded-full
      border
      flex
      items-center
      justify-center
      gap-2
      backdrop-blur-sm
    "
    style={{
      background: "rgba(255,255,255,0.18)",
      borderColor: "rgba(120,140,180,0.08)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)"
    }}
  >
    {/* Shield */}
    <div className="flex items-center justify-center">
      <Shield
        size={12}
        className="text-[#6B8FE8]"
        strokeWidth={2.4}
      />
    </div>

    {/* Text */}
    <span
      className="
        text-[6px]
        font-medium
        uppercase
        tracking-[3px]
        text-[#8A96AF]
      "
    >
      KAVACH NATIONAL SAFETY NETWORK
    </span>

    <span
      className="
        text-[#B4BCCB]
        text-[6px]
      "
    >
      •
    </span>

    <span
      className="
        text-[6px]
        font-medium
        uppercase
        tracking-[3px]
        text-[#8A96AF]
      "
    >
      SECURE
    </span>
  </div>
</div>
</div>

<KavachAIChat
  isOpen={isAIChatOpen}
  onClose={() => setIsAIChatOpen(false)}
/>

{/* 🗺️ LIVE TACTICAL MAP MODAL */}
<AnimatePresence>
  {isMapModalOpen && (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 200,
      }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:p-4 bg-[#0B101A] border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <Map className="text-blue-500" size={20} />

          <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[2px] sm:tracking-widest">
            Tactical Radar
          </span>
        </div>

        <button
          onClick={() => setIsMapModalOpen(false)}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <KavachMap
          mode="radar"
          activeProtectors={protectors}
          // The old radar map used 'protectors', KavachMap uses 'activeProtectors' (we can pass it as protectors if we want, let's pass both)
          {...{protectors, activeRadius}}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

        {/* Stats */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-2 sm:py-3 bg-black/90 border border-white/20 rounded-full flex items-center gap-2 sm:gap-3 max-w-[90vw]">
          <ShieldCheck
            size={16}
            className="text-emerald-500 flex-shrink-0"
          />

          <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-[1px] sm:tracking-[2px] whitespace-nowrap">
            {nearbyCount} Police/Protectors Near You
          </span>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

{/* SAFE HAVEN MAP */}
{isSafeHavenMapOpen && (
  <KavachMap
    mode="safehaven"
    onClose={() => {
      setIsSafeHavenMapOpen(false);
      setSafeHavenTarget(null);
    }}
    initialTarget={safeHavenTarget}
  />
)}

<style>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 2px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(16, 185, 129, 0.2);
    border-radius: 10px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(16, 185, 129, 0.4);
  }
`}</style>
      </div>
    );
  }

  return (
  <div className="w-full max-w-md mx-auto min-h-screen overflow-x-hidden">
    <SOSButton />
  </div>
);
}
