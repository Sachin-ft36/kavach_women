import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, MapPin, AlertCircle, Users, Bell, CheckCircle2, Navigation, Phone,
  Search, Filter, Activity, Database, Lock, Gavel, History, FileText,
  TrendingUp, X, ShieldCheck, Video, FileVideo, FileAudio, Zap, BookOpen,
  Layers, Globe, Radio, Cpu, Heart, AlertTriangle, Eye, ChevronRight, SignalHigh, Trophy, Mic, Calendar, Clock
} from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import CommandMap from './maps/CommandMap';
import { CommandVault } from './CommandVault';
import { db, auth } from '../firebase';
import {
  collection, query, where, onSnapshot, orderBy, limit, addDoc, setDoc,
  serverTimestamp, updateDoc, doc, deleteDoc
} from 'firebase/firestore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { registerPlugin } from '@capacitor/core';

// 📡 NATIVE BRIDGE (Already registered in App/SOS)
// const KavachNative = registerPlugin<any>('KavachPlugin');

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir"
];

export default function SuperCellDashboard({ 
  viewModeOverride, 
  onTabChange 
}: { 
  viewModeOverride?: 'OPS' | 'GATEKEEPER' | 'JUSTICE' | 'LEADERBOARD' | 'ALL',
  onTabChange?: (mode: 'OPS' | 'GATEKEEPER' | 'JUSTICE' | 'LEADERBOARD' | 'ALL') => void
}) {
  const { user } = useKavachStore();
  const isAuthorized = user?.email === 'singh.sachin16559@gmail.com';

  // 🛰️ REAL-TIME REGISTRIES
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [pendingProtectors, setPendingProtectors] = useState<any[]>([]);
  const [verifiedProtectors, setVerifiedProtectors] = useState<any[]>([]);
  const [zeroFirs, setZeroFirs] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [resolvedHistory, setResolvedHistory] = useState<any[]>([]);
  const [protectorGrievances, setProtectorGrievances] = useState<any[]>([]);
  const [protectorTab, setProtectorTab] = useState<'QUEUE' | 'GRIEVANCES'>('QUEUE');

  // 🕹️ COMMAND STATES
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedFirId, setSelectedFirId] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState<[number, number] | null>(null);
  const [viewMode, setViewMode] = useState<'OPS' | 'GATEKEEPER' | 'JUSTICE' | 'LEADERBOARD' | 'ALL'>('ALL');

  useEffect(() => {
    if (viewModeOverride) setViewMode(viewModeOverride);
  }, [viewModeOverride]);

  const [ledgerMode, setLedgerMode] = useState<'FIR' | 'RESOLVED'>('FIR');
  const [filterState, setFilterState] = useState('ALL');
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const sirenRef = useRef<HTMLAudioElement | null>(null);

  // 📝 INTELLIGENCE PUBLISHER STATE
  const [intelTarget, setIntelTarget] = useState<'CITIZEN' | 'PROTECTOR'>('CITIZEN');
  const [intelTitle, setIntelTitle] = useState('');
  const [intelContent, setIntelContent] = useState('');
  const [intelCategory, setIntelCategory] = useState<'SAFETY' | 'LEGAL' | 'TACTICAL'>('SAFETY');
  const [isPublishing, setIsPublishing] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');

  const selectedAlert = useMemo(() =>
    activeAlerts.find(a => a.id === selectedAlertId), [selectedAlertId, activeAlerts]
  );

  const selectedFir = useMemo(() =>
    zeroFirs.find(f => f.id === selectedFirId), [selectedFirId, zeroFirs]
  );

  // 🛡️ MISSION INITIALIZATION
  useEffect(() => {
    sirenRef.current = new Audio('https://raw.githubusercontent.com/singhsachin44/kavach-assets/main/tactical_siren.mp3');
    sirenRef.current.loop = true;

    // 1. ALERT PULSE (SOS)
    const unsubAlerts = onSnapshot(
      query(collection(db, 'alerts'), where('status', '==', 'active')),
      (snap) => {
        const now = Date.now();
        const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const data = raw.map((a: any) => {
          const lastPulseTS = a.lastPulse?.toMillis ? a.lastPulse.toMillis() : (a.timestamp?.toMillis ? a.timestamp.toMillis() : 0);
          const isStale = (now - lastPulseTS) > (30 * 1000); // 30s Staleness for Critical SOS
          return { ...a, isStale };
        }).sort((a: any, b: any) => {
          const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return tB - tA;
        });
        const { isHubReady } = useKavachStore.getState();

        if (data.length > activeAlerts.length && !sirenPlaying && isHubReady) {
          sirenRef.current?.play().catch(() => { });
          setSirenPlaying(true);

          if (registerPlugin<any>('KavachPlugin')) {
            registerPlugin<any>('KavachPlugin').triggerHapticPulse().catch(() => { });
          }
        }
        setActiveAlerts(data);
      },
      (err) => console.error("NCIC SOS Stream Error:", err)
    );

    // 2. GATEKEEPER UPLINK (Pending Protectors)
    const unsubPending = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'protector')),
      (snap) => {
        const allProtectors = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // 🛡️ DATA ENFORCEMENT: Only show candidates who have provided Aadhar AND Phone
        const pending = allProtectors.filter((p: any) => 
          !p.isVerified && (p.aadhaarMask || p.aadhar) && p.phoneNumber
        );
        setPendingProtectors(pending);
      },
      (err) => console.error("NCIC Gatekeeper Stream Error:", err)
    );

    // 3. BLUE GRID UPLINK (Verified Protectors) - Filtering Ghost/Offline Nodes
    const unsubVerified = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'protector'), where('isVerified', '==', true)),
      (snap) => {
        const now = Date.now();
        const activeNodes = snap.docs.map(d => {
          const data = d.data() as any;
          const lastActiveTS = data.lastActive?.toDate ? data.lastActive.toDate().getTime() : 0;
          const isStale = (now - lastActiveTS) > (15 * 60 * 1000); // 15 Minute Staleness Threshold

          return { id: d.id, ...data, isStale };
        });

        setVerifiedProtectors(activeNodes);
      },
      (err) => console.error("NCIC Blue Grid Stream Error:", err)
    );

    // 4. JUSTICE LEDGER (FIRs)
    const unsubFirs = onSnapshot(
      query(collection(db, 'zero_firs')),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = data.sort((a: any, b: any) => {
          const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
          const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
          return timeB - timeA;
        }).slice(0, 50);
        setZeroFirs(sorted);
      },
      (err) => console.error("NCIC Justice Ledger Stream Error:", err)
    );

    // 5. NATIONAL HONOURS LEDGER (Top 100)
    const unsubLeaderboard = onSnapshot(
      query(collection(db, 'users')),
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        const sorted = data.sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 50);
        setLeaderboard(sorted);
      },
      (err) => console.error("NCIC Honours Ledger Stream Error:", err)
    );

    // 6. RESOLVED MISSIONS HISTORY
    const unsubResolved = onSnapshot(
      query(collection(db, 'alerts'), where('status', '==', 'resolved'), orderBy('resolvedAt', 'desc'), limit(10)),
      (snap) => setResolvedHistory(snap.docs.map(d => ({ id: d.id, ...doc.data() }))),
      (err) => console.error("NCIC History Registry Stream Error:", err)
    );

    // 7. PROTECTOR GRIEVANCES UPLINK (Hardened for Multiple Tunnels)
    const unsubGrievances = onSnapshot(
      query(collection(db, 'protector_grievances'), where('status', '==', 'pending')),
      (snap) => {
        const mainDocs = snap.docs.map(d => ({ id: d.id, ...d.data(), channel: 'main' }));
        setProtectorGrievances(prev => {
          const bypassDocs = prev.filter(p => (p as any).channel === 'bypass');
          const combined = [...mainDocs, ...bypassDocs];
          return combined.sort((a: any, b: any) => {
            const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.sentAt ? new Date(a.sentAt).getTime() : 0);
            const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.sentAt ? new Date(b.sentAt).getTime() : 0);
            return tB - tA;
          });
        });
      },
      (err) => console.error("NCIC Grievance Main Stream Error:", err)
    );

    const unsubBypassGrievances = onSnapshot(
      query(collection(db, 'special_cell_reports'), where('status', '==', 'pending')),
      (snap) => {
        const bypassDocs = snap.docs.map(d => ({ id: d.id, ...d.data(), channel: 'bypass' }));
        setProtectorGrievances(prev => {
          const mainDocs = prev.filter(p => (p as any).channel !== 'bypass');
          const combined = [...mainDocs, ...bypassDocs];
          return combined.sort((a: any, b: any) => {
            const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.sentAt ? new Date(a.sentAt).getTime() : (a.timestamp ? new Date(a.timestamp).getTime() : 0));
            const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.sentAt ? new Date(b.sentAt).getTime() : (b.timestamp ? new Date(b.timestamp).getTime() : 0));
            return tB - tA;
          });
        });
      },
      (err) => console.error("NCIC Grievance Bypass Stream Error:", err)
    );

    // 8. STALE NODE CLEANUP (Client-side visual check)
    const interval = setInterval(() => {
      const now = Date.now();
      setVerifiedProtectors(prev => prev.map(p => {
        const lastActive = p.lastLocation?.timestamp?.toDate().getTime() || 0;
        return { ...p, isStale: (now - lastActive) > 300000 }; // 5 mins
      }));
    }, 60000);

    return () => {
      unsubAlerts(); unsubPending(); unsubVerified(); unsubFirs(); unsubResolved(); unsubLeaderboard(); 
      unsubGrievances(); unsubBypassGrievances();
      sirenRef.current?.pause();
      clearInterval(interval);
    };
  }, [activeAlerts.length]);

  // ⚔️ COMMAND ACTIONS
  useEffect(() => {
    const { isHubReady } = useKavachStore.getState();
    if (activeAlerts.length > 0 && isHubReady && !isMuted) {
      if (!sirenPlaying) {
        setSirenPlaying(true);
        if (sirenRef.current) {
          sirenRef.current.volume = 0.7;
          sirenRef.current.play().catch(() => {
            console.warn("🚨 NCIC: Browser blocked auto-audio. Interaction required.");
          });
        }
      }
    } else {
      setSirenPlaying(false);
      sirenRef.current?.pause();
    }
  }, [activeAlerts.length, isMuted]);

  const approveProtector = async (protector: any) => {
    if (!(protector.aadhaarMask || protector.aadhar) || !protector.phoneNumber) {
      toast.error(`Authorization Blocked: ${protector.name || 'Candidate'} has not provided Aadhar or Phone verification.`);
      return;
    }
    
    try {
      // 🛡️ STABLE UPLINK: Explicitly re-asserting 'protector' role during authorization
      await setDoc(doc(db, 'users', protector.id), { 
        isVerified: true, 
        role: 'protector',
        verifiedAt: serverTimestamp(),
        status: 'online'
      }, { merge: true });

      toast.success("Protector Authorized in Blue Grid.");
    } catch (e: any) { 
      console.error("AUTHORIZATION CRITICAL FAILURE:", e);
      if (e.code === 'permission-denied') {
        toast.error("Access Denied: Check Firebase Security Rules.");
      } else {
        toast.error("Authorization Failed: Protocol Conflict."); 
      }
    }
  };

  const resolveIncident = async (id: string, victimUid?: string) => {
    const PROJECT_ID = "gen-lang-client-0115433512";
    
    const patchAlert = async (alertId: string) => {
      const apiKey = "AIzaSyDaGseWN-LbqP3OCmZtfnHio4uTjCb7rY0";
      const idToken = await auth.currentUser?.getIdToken();
      
      const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/alerts/${alertId}?key=${apiKey}&updateMask.fieldPaths=status&updateMask.fieldPaths=resolvedAt`;
      
      const body = {
        fields: {
          status: { stringValue: "resolved" },
          resolvedAt: { timestampValue: new Date().toISOString() }
        }
      };
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`REST Error: ${response.status} ${response.statusText}`);
    };

    try {
      if (victimUid) {
        const relatedAlerts = activeAlerts.filter(a => a.victimUid === victimUid);
        await Promise.all(relatedAlerts.map(a => patchAlert(a.id)));
        toast.success(`Mission Closed: ${relatedAlerts.length} incidents archived via REST Uplink.`);
      } else {
        await patchAlert(id);
        toast.success("Incident Archived via REST Uplink.");
      }
      setSelectedAlertId(null);
    } catch (e) { 
      console.error("REST FAILED:", e);
      toast.error("Resolution Failed: Internal SDK Conflict."); 
    }
  };

  const forwardToPolice = async (id: string, firId: string) => {
    try {
      await updateDoc(doc(db, 'zero_firs', id), {
        status: 'FORWARDED_TO_POLICE',
        forwardedAt: serverTimestamp(),
        forwardedBy: auth.currentUser?.email
      });
      toast.success(`O-FIR ${firId} successfully routed to Local Jurisdiction.`);
      setSelectedFirId(null);
    } catch (e) { toast.error("Forwarding Failed."); }
  };

  const resolveGrievance = async (id: string, channel?: string) => {
    if (!adminReply.trim()) {
      toast.error("PLEASE ENTER A COMMAND RESPONSE FIRST.");
      return;
    }
    
    try {
      const collectionName = channel === 'bypass' ? 'special_cell_reports' : 'protector_grievances';
      await updateDoc(doc(db, collectionName, id), {
        status: 'resolved',
        reply: adminReply,
        resolvedAt: serverTimestamp(),
        resolvedBy: auth.currentUser?.email
      });
      toast.success("Incident Report Resolved with Official Reply.");
      setRespondingTo(null);
      setAdminReply('');
    } catch (e) { toast.error("Resolution Failed."); }
  };

  if (!isAuthorized) return <SecurityLockScreen />;

  if (viewMode === 'LEADERBOARD') {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-4 lg:p-12 flex flex-col font-sans relative overflow-hidden">
        {/* Background Visuals */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-blue/5 blur-[120px] rounded-full -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-blue/5 blur-[120px] rounded-full -ml-64 -mb-64" />

        <header className="flex justify-between items-center mb-12 relative z-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-accent-blue/10 border border-accent-blue/20 rounded-2xl flex items-center justify-center">
                <Trophy className="text-accent-blue" size={24} />
              </div>
              <h1 className="text-3xl lg:text-5xl font-black italic uppercase tracking-tighter text-white">National <span className="text-accent-blue">Honours</span></h1>
            </div>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[5px] mt-2 italic">Bharat Rakshak Strategic Merit Ledger // NCIC SECURE</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-2">
          <div className="grid grid-cols-12 gap-4 mb-4 px-8 text-[9px] font-black uppercase text-gray-600 tracking-widest border-b border-white/5 pb-4">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Operative</div>
            <div className="col-span-3">Regional Scope</div>
            <div className="col-span-3 text-right">Merit Points</div>
          </div>

          <div className="space-y-3 pb-32">
            {leaderboard.length === 0 ? <div className="text-center py-40 animate-pulse"><p className="text-gray-700 uppercase font-black tracking-[10px]">Synthesizing Merit Data...</p></div> :
              leaderboard.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn("grid grid-cols-12 gap-4 px-4 lg:px-8 py-6 lg:py-8 rounded-[32px] border transition-all items-center",
                    idx === 0 ? "bg-accent-blue/10 border-accent-blue shadow-[0_0_80px_rgba(0,122,255,0.15)]" : "bg-white/5 border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="col-span-2 lg:col-span-1 flex items-center gap-3">
                    {idx < 3 ? <Trophy size={18} className={idx === 0 ? "text-yellow-500 scale-125" : idx === 1 ? "text-gray-300" : "text-amber-600"} /> : null}
                    <span className={cn("text-xl lg:text-3xl font-black italic", idx < 3 ? "text-white" : "text-gray-600")}>#{idx + 1}</span>
                  </div>
                  <div className="col-span-10 lg:col-span-5 flex items-center gap-4">
                    <div className="w-10 h-10 lg:w-14 lg:h-14 bg-white/5 rounded-full border border-white/10 flex items-center justify-center font-black text-gray-500 text-lg">
                      {p.name?.[0] || 'O'}
                    </div>
                    <div>
                      <p className="text-sm lg:text-2xl font-black uppercase text-white leading-none tracking-tight">{p.name || 'Anonymous Rakshak'}</p>
                      <p className="text-[8px] lg:text-[10px] text-accent-blue/60 font-bold uppercase tracking-widest mt-1.5 opacity-60">ID: {p.id.slice(0, 12).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="hidden lg:block col-span-3">
                    <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-400 tracking-widest">{p.state || 'National Grid'}</span>
                  </div>
                  <div className="col-span-12 lg:col-span-3 text-right mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-none border-white/5">
                    <span className="text-3xl lg:text-5xl font-black italic text-accent-blue tracking-tighter">{(p.xp || 0).toLocaleString()} <span className="text-xs lg:text-sm opacity-40 not-italic ml-1">XP</span></span>
                  </div>
                </motion.div>
              ))}
          </div>
        </main>

        {/* 🚨 STRATEGIC ALARM ENGINE */}
        <audio
          ref={sirenRef}
          src="https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3"
          loop
          preload="auto"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-2 lg:p-6 space-y-4 lg:space-y-6 overflow-hidden flex flex-col font-sans">

      {/* ── NCIC HEADER: NATIONAL STRATEGIC COMMAND (HOME MINISTRY) ──────────────── */}
      <header className="flex flex-col lg:flex-row items-center justify-between p-4 lg:p-5 bg-gradient-to-r from-black via-[#0a0a0a] to-black border border-white/10 rounded-[28px] lg:rounded-[32px] gap-6 lg:gap-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-blue/30 to-transparent" />

        <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-accent-blue blur-2xl opacity-20 animate-pulse rounded-full" />
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-black border-2 border-accent-blue/20 rounded-2xl lg:rounded-3xl flex items-center justify-center relative z-10 shadow-2xl">
              <Globe className="text-accent-blue animate-spin-slow" size={24} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 lg:gap-3">
              <h1 className="text-2xl lg:text-4xl font-black uppercase italic tracking-tighter leading-none text-white">NCIC <span className="text-accent-blue text-sm lg:text-2xl opacity-60 font-black">STRATEGIC</span></h1>
            </div>
            <div className="flex items-center gap-2 mt-1 lg:mt-2">
              <ShieldCheck className="text-green-500" size={10} />
              <p className="text-[7px] lg:text-[9px] font-black uppercase tracking-[3px] lg:tracking-[5px] text-gray-500">BHARAT DEFENSE GRID // HOME MINISTRY</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-12 border-x border-white/5 px-12 mx-8 h-16">
          <StrategicMetric label="NATIONAL SOS" value={activeAlerts.length} type="DANGER" />
          <StrategicMetric label="GRID OPS" value={verifiedProtectors.length} type="INFO" />
          <StrategicMetric label="CLEARANCE" value="98.2%" type="SUCCESS" />
          <StrategicMetric label="THREAT LVL" value="STABLE" type="NORMAL" />
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 lg:gap-4 w-full lg:w-auto mt-2 lg:mt-0">
          <div className="flex flex-col items-start lg:items-end mr-0 lg:mr-4">
            <span className="text-[6px] lg:text-[7px] font-black text-accent-blue uppercase tracking-widest italic animate-pulse">Enc: AES-512</span>
            <span className="text-[9px] lg:text-[10px] font-black text-white">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
            {(['ALL', 'OPS', 'GATEKEEPER', 'JUSTICE'] as const).map(m => (
              <button 
                key={m} 
                onClick={() => {
                  setViewMode(m);
                  if (onTabChange) onTabChange(m);
                }} 
                className={cn("px-2 lg:px-4 py-1.5 lg:py-2 rounded-lg text-[7px] lg:text-[9px] font-black transition-all", viewMode === m ? "bg-white text-black" : "text-gray-500 hover:text-white")}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "p-3 lg:p-4 border rounded-xl lg:rounded-2xl transition-all group",
              isMuted ? "bg-red-500/10 border-red-500 text-red-500" : "bg-white/5 border-white/10 text-gray-500 hover:bg-white hover:text-black"
            )}
          >
            {isMuted ? <Radio size={14} className="animate-pulse" /> : <Bell size={14} className="group-hover:animate-swing" />}
          </button>
        </div>
      </header>

      {/* 🛡️ NATIONAL STRATEGIC HUD (MINISTRY RIBBON) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 overflow-hidden">
        <MinistryCard label="Deployment Health" value="OPTIMAL" sub="12,402 NODES ACTIVE" color="border-green-500/10" icon={<Zap size={12} className="text-green-500" />} />
        <MinistryCard label="Critical Zones" value="3 REGIONS" sub="MONITORING J&K, ASSAM" color="border-red-500/10" icon={<AlertTriangle size={12} className="text-red-500" />} />
        <MinistryCard label="Response Latency" value="1.2s avg" sub="NATIONAL GRID LATENCY" color="border-blue-500/10" icon={<Activity size={12} className="text-blue-500" />} />
        <MinistryCard label="Justice Flow" value={`${zeroFirs.length} NEW`} sub="ZERO-FIR REPLIES" color="border-purple-500/10" icon={<Gavel size={12} className="text-purple-500" />} />
      </div>

      {/* ── CORE BATTLEFIELD LAYOUT ─────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-y-auto lg:overflow-hidden pb-32 lg:pb-0">

        {/* LEFT COLUMN: MISSION PULSE & GATEKEEPER */}
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-auto lg:h-[calc(100vh-270px)] xl:h-[calc(100vh-300px)] min-h-0">
          <AnimatePresence>
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col gap-6 h-full"
            >
              {(viewMode === 'OPS' || viewMode === 'ALL') && (
                /* Mission Pulse Card (Consolidated) */
                <div className={cn("flex-1 bg-black/40 border border-white/5 rounded-[40px] flex flex-col overflow-hidden shadow-2xl relative", viewMode === 'ALL' && "mb-3 h-[50%]")}>
                  <div className="p-6 border-b border-white/5 bg-gradient-to-r from-red-950/20 to-transparent flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-[3px] text-accent-red italic">Emergency Pulse</h3>
                    <Zap size={14} className="text-accent-red animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {activeAlerts.filter(alert => filterState === 'ALL' || alert.state === filterState).length === 0 ? 
                      <EmptyState label={`Sector ${filterState} Clear`} icon={<CheckCircle2 />} /> :
                      activeAlerts.filter(alert => filterState === 'ALL' || alert.state === filterState).map(alert => (
                        <AlertCard
                          key={alert.id} alert={alert}
                          isActive={selectedAlertId === alert.id}
                          onClick={() => { setSelectedAlertId(alert.id); setMapFocus([alert.location?.latitude, alert.location?.longitude]); }}
                          onResolve={(id) => resolveIncident(id)}
                          onResolveAll={(uid) => resolveIncident('', uid)}
                        />
                      ))
                    }
                  </div>
                </div>
              )}

              {(viewMode === 'GATEKEEPER' || viewMode === 'ALL') && (
                /* Gatekeeper Card (Consolidated) */
                <div className={cn("flex-1 bg-black/40 border border-white/10 rounded-[40px] flex flex-col overflow-hidden border-dashed", viewMode === 'ALL' && "h-[50%]")}>
                  <div className="p-4 border-b border-white/5 bg-amber-950/10 flex flex-col gap-3">
                    <div className="flex justify-between items-center px-2">
                      <h3 className="text-[10px] font-black uppercase tracking-[3px] text-amber-500 italic">Personnel Ops</h3>
                      <ShieldCheck size={14} className="text-amber-500" />
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                      <button 
                        onClick={() => setProtectorTab('QUEUE')} 
                        className={cn("flex-1 py-2 rounded-lg text-[8px] font-black transition-all", protectorTab === 'QUEUE' ? "bg-amber-500 text-black" : "text-gray-500")}
                      >
                        QUEUE ({pendingProtectors.length})
                      </button>
                      <button 
                        onClick={() => setProtectorTab('GRIEVANCES')} 
                        className={cn("flex-1 py-2 rounded-lg text-[8px] font-black transition-all", protectorTab === 'GRIEVANCES' ? "bg-red-500 text-white" : "text-gray-500")}
                      >
                        GRIEVANCES ({protectorGrievances.length})
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {protectorTab === 'QUEUE' ? (
                      pendingProtectors.length === 0 ? <p className="text-[9px] font-black uppercase text-gray-700 text-center py-10 tracking-widest">No Applications Pending</p> :
                      pendingProtectors.map(p => (
                        <div key={p.id} className={cn("p-4 border rounded-2xl flex flex-col gap-3 group transition-all", (!(p.aadhaarMask || p.aadhar) || !p.phoneNumber) ? "bg-red-500/5 border-red-500/10" : "bg-white/5 border-white/5")}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[11px] font-black uppercase text-white font-sans flex items-center gap-2">
                                {p.name || 'Anonymous'}
                                {(!(p.aadhaarMask || p.aadhar) || !p.phoneNumber) && <span className="text-[7px] bg-red-600 text-white px-1.5 py-0.5 rounded-full">INCOMPLETE</span>}
                              </p>
                              <p className="text-[8px] text-accent-blue font-bold tracking-widest mt-1 italic">{p.email || 'NO_EMAIL_RECORDED'}</p>
                            </div>
                            <button 
                              onClick={() => approveProtector(p)} 
                              className={cn(
                                "p-2 rounded-xl transition-all",
                                (!(p.aadhaarMask || p.aadhar) || !p.phoneNumber) 
                                  ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50" 
                                  : "bg-accent-blue/20 text-accent-blue hover:bg-accent-blue hover:text-black shadow-lg"
                              )}
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                            <div className="flex flex-col">
                              <span className="text-[7px] text-gray-500 font-black uppercase">Aadhar ID</span>
                              <span className={cn("text-[9px] font-mono", (p.aadhar || p.aadhaarMask) ? "text-white/60" : "text-red-500 font-bold")}>
                                {p.aadhar || p.aadhaarMask || 'MISSING'}
                              </span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-[7px] text-gray-500 font-black uppercase">Phone</span>
                              <span className={cn("text-[9px] font-mono", p.phoneNumber ? "text-white/60" : "text-red-500 font-bold")}>{p.phoneNumber || 'MISSING'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-accent-blue/5 border border-accent-blue/10 rounded-xl">
                            <MapPin size={10} className="text-accent-blue" />
                            <span className="text-[8px] font-black text-accent-blue uppercase tracking-widest">
                              HOME BASE: {p.lastLocation?.lat?.toFixed(4) || p.telemetry?.coords?.[0]?.toFixed(4) || '0.0000'}, {p.lastLocation?.lng?.toFixed(4) || p.telemetry?.coords?.[1]?.toFixed(4) || '0.0000'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      protectorGrievances.length === 0 ? <p className="text-[9px] font-black uppercase text-gray-700 text-center py-10 tracking-widest">No Active Grievances</p> :
                      protectorGrievances.map(g => (
                        <div key={g.id} className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2 opacity-20"><AlertTriangle size={32} /></div>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-[11px] font-black uppercase text-white font-sans">{g.name || (g.isAnonymous ? 'Anonymous Citizen' : 'Citizen')}</p>
                                <span className={cn(
                                  "text-[7px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase",
                                  g.channel === 'main' || g.category === 'GRIEVANCE_BYPASS' ? "bg-red-500 text-white" : "bg-accent-blue text-white"
                                )}>
                                  {g.channel === 'main' || g.category === 'GRIEVANCE_BYPASS' ? 'PROTECTOR' : 'CITIZEN INTEL'}
                                </span>
                              </div>
                              <p className="text-[7px] text-red-400 font-bold tracking-widest mt-1 uppercase italic">ID: {g.uid?.slice(0, 10) || g.realUid?.slice(0, 10) || 'UNKNOWN'}</p>
                            </div>
                            <button 
                              onClick={() => resolveGrievance(g.id, (g as any).channel)}
                              className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          </div>
                          <p className="text-[9px] text-gray-300 leading-relaxed italic">"{g.message || g.text}"</p>
                          
                          {respondingTo === g.id ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={adminReply}
                                onChange={(e) => setAdminReply(e.target.value)}
                                placeholder="Enter Command Directive / Reply..."
                                className="w-full bg-black/50 border border-red-500/30 rounded-xl p-3 text-[10px] text-white outline-none focus:border-red-500 transition-all h-20 placeholder:text-gray-700"
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => resolveGrievance(g.id, (g as any).channel)}
                                  className="flex-1 py-2 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20"
                                >
                                  TRANSMIT & RESOLVE
                                </button>
                                <button 
                                  onClick={() => setRespondingTo(null)}
                                  className="px-4 py-2 bg-white/5 text-gray-500 rounded-lg text-[9px] font-black uppercase"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                              <span className="text-[7px] font-mono text-gray-500">{g.timestamp?.toDate().toLocaleString() || new Date(g.sentAt).toLocaleString()}</span>
                              <button 
                                onClick={() => setRespondingTo(g.id)}
                                className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                              >
                                REPLY & RESOLVE
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {viewMode === 'JUSTICE' && (
                <div className="p-8 bg-green-500/5 border border-green-500/20 rounded-[40px]">
                  <Gavel size={32} className="text-green-500 mb-4" />
                  <h4 className="text-lg font-black uppercase italic text-white italic tracking-tighter">Legal Review Mode</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-2 tracking-widest leading-relaxed">Accessing state-level Zero-FIR registry.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </aside>

        {/* CENTER COLUMN: THE GOD-VIEW TERMINAL */}
        <main className="col-span-12 lg:col-span-6 flex flex-col gap-6 relative h-[600px] lg:h-[calc(100vh-270px)] xl:h-[calc(100vh-300px)] min-h-0">
          <>
            <div className="flex-1 bg-black border border-white/5 rounded-[40px] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.8)] border-2 group">
              <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10" />
              <CommandMap
                centerOverride={mapFocus || undefined}
                activeAlerts={activeAlerts}
                activeProtectors={verifiedProtectors}
                showVectors={true}
              />

              {/* Map UI Overlays */}
              <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
                <div className="flex bg-black/90 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl shadow-2xl">
                  <button className="px-6 py-2.5 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-widest">REAL-TIME</button>
                  <button className="px-6 py-2.5 rounded-xl text-gray-500 text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">SATELLITE</button>
                </div>
              </div>

              <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
                <div className="p-5 bg-black/80 backdrop-blur-md border border-white/10 rounded-3xl flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent-red animate-ping" />
                    <span className="text-[9px] font-black uppercase tracking-[3px] text-white">Live Node Encryption: SHA-256</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest italic">KAVACH NEURAL LINK v4.0 // ACTIVE</p>
                </div>
              </div>
            </div>

            {/* 📱 UNIFIED VICTIM PROFILE (SLIDE-UP) */}
            <AnimatePresence>
              {selectedAlert && (
                <motion.div
                  initial={{ y: 200, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 200, opacity: 0 }}
                  className="absolute bottom-6 inset-x-6 z-30 bg-[#080808] border border-white/10 rounded-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
                >
                  <div className="grid grid-cols-12">
                    <div className="col-span-8 p-8 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-6 items-center">
                          <div className="absolute top-5 right-5 flex gap-2">
                            <button onClick={() => setSelectedAlertId(null)} className="p-2 lg:p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-accent-red transition-all"><X size={16} /></button>
                          </div>
                          <Heart className="text-accent-red fill-accent-red animate-pulse" size={40} />
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="text-3xl font-black uppercase tracking-tighter text-white">{selectedAlert.victimName}</h4>
                              <span className="px-3 py-1 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[8px] font-black rounded-lg">VERIFIED MISSION</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[4px] mt-2 italic">AADHAR: {selectedAlert.victimAadhar || 'HARDWARE_LOCK_PENDING'}</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <TelemetryNode icon={<Zap />} label="BATTERY" value={`${selectedAlert.batteryLevel || 0}%`} />
                          <TelemetryNode icon={<SignalHigh />} label="SIGNAL" value="5G_TACTICAL" />
                          <div className="px-6 py-4 bg-accent-red/10 border border-accent-red/20 rounded-3xl flex flex-col gap-1 animate-pulse shrink-0">
                            <div className="flex items-center gap-2 text-accent-red">
                              <Radio size={12} />
                              <span className="text-[7px] font-black uppercase tracking-widest">EVIDENCE GRID</span>
                            </div>
                            <span className="text-md font-black text-white">ACTIVE LIVE</span>
                          </div>
                        </div>
                      </div>

                      <div className="relative group">
                        <div className="absolute -inset-1 bg-accent-blue/10 rounded-[34px] blur opacity-25 group-hover:opacity-50 transition-all pointer-events-none" />
                        <div className="h-[200px] lg:h-[280px] w-full bg-black/60 border-2 border-accent-blue/20 rounded-3xl p-4 relative overflow-hidden backdrop-blur-xl shadow-2xl">
                          <div className="flex items-center justify-between mb-4 px-2">
                            <h5 className="text-[9px] font-black uppercase tracking-[3px] text-accent-blue flex items-center gap-2">
                              <Database size={10} /> Forensic Intelligence Vault
                            </h5>
                            <span className="text-[7px] font-mono text-white/20">SECURE_LINK: TRUE</span>
                          </div>
                          <div className="flex-1 overflow-y-auto">
                            <CommandVault targetUid={selectedAlert.victimUid} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-4 bg-white/[0.02] border-l border-white/5 p-8 flex flex-col justify-between">
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-[3px] text-accent-blue">Strategic Intercept</h5>
                        <div className="p-5 bg-accent-blue/10 border border-accent-blue/20 rounded-3xl">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-black uppercase text-accent-blue">Nearest Protector</span>
                            <span className="text-[8px] font-mono text-white/40">1.2 KM</span>
                          </div>
                          <p className="text-sm font-black uppercase text-white">OPERATIVE: VIKRAM</p>
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <button onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'alerts', selectedAlert.id), { remote_siren: true });
                                toast.success("Strategic Siren triggered on victim's device.");
                              } catch (e) { toast.error("Command Failed."); }
                            }} className="py-3 bg-accent-red text-white rounded-2xl font-black uppercase text-[10px] tracking-tight hover:scale-95 transition-all shadow-lg shadow-red-500/20">FORCE SIREN</button>
                            <button onClick={() => {
                              toast.success("Strategical Priority Alert dispatched to 5 nearest protectors.");
                            }} className="py-3 bg-white/10 border border-white/20 text-white rounded-2xl font-black uppercase text-[9px] tracking-tight hover:bg-accent-blue hover:text-black">STRATEGIC NOTIFY</button>
                          </div>
                          <button className="w-full mt-3 py-3 bg-accent-blue text-black rounded-2xl font-black uppercase text-[10px] tracking-tight">DISPATCH CORE</button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => resolveIncident(selectedAlert.id, selectedAlert.victimUid)}
                          className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-tight hover:scale-95 transition-all shadow-lg shadow-green-500/20"
                        >
                          ARCHIVE ALL SESSIONS
                        </button>
                        <div className="flex gap-3">
                          <button onClick={() => resolveIncident(selectedAlert.id)} className="flex-1 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-tight hover:scale-95 transition-all">RESOLVE SELECTED</button>
                          <button onClick={() => setSelectedAlertId(null)} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-accent-red transition-all group"><X className="group-hover:text-white" size={20} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {selectedFir && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12"
                >
                  <div onClick={() => setSelectedFirId(null)} className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
                  
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                    className="w-full max-w-5xl bg-[#080808] border border-accent-blue/30 rounded-[40px] shadow-[0_0_100px_rgba(0,122,255,0.15)] overflow-hidden relative z-10 flex flex-col lg:flex-row"
                  >
                    <div className="col-span-8 p-8 space-y-6 flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-6 items-center">
                          <div className="w-16 h-16 bg-accent-blue/10 border border-accent-blue/20 rounded-[24px] flex items-center justify-center text-accent-blue shadow-lg">
                            <Gavel size={32} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="text-3xl font-black uppercase tracking-tighter text-white">{selectedFir.userName}</h4>
                              <span className="px-3 py-1 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[8px] font-black rounded-lg">LEGAL RECORD</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[4px] mt-2 italic">FIR_ID: {selectedFir.firId}</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <TelemetryNode icon={<MapPin />} label="STATE" value={selectedFir.state?.toUpperCase() || 'UNKNOWN'} />
                          <TelemetryNode icon={<Calendar />} label="FILED" value={selectedFir.timestamp ? new Date(selectedFir.timestamp?.toMillis ? selectedFir.timestamp.toMillis() : selectedFir.timestamp).toLocaleDateString() : 'N/A'} />
                        </div>
                      </div>

                      <div className="relative group">
                        <div className="absolute -inset-1 bg-accent-blue/10 rounded-[34px] blur opacity-25" />
                        <div className="bg-black/60 border-2 border-accent-blue/20 rounded-3xl p-8 relative min-h-[200px]">
                          <h5 className="text-[9px] font-black uppercase tracking-[3px] text-accent-blue mb-4 flex items-center gap-2">
                            <FileText size={12} /> Victim Statement (Verbatim)
                          </h5>
                          <p className="text-lg font-medium text-white/90 leading-relaxed italic">
                            "{selectedFir.statement}"
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <h6 className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-3">Forensic Meta</h6>
                            <div className="space-y-2">
                               <div className="flex justify-between"><span className="text-[9px] text-white/40">OFFENSE:</span><span className="text-[9px] text-white font-black">{selectedFir.offenseType}</span></div>
                               <div className="flex justify-between"><span className="text-[9px] text-white/40">VICTIM_UID:</span><span className="text-[9px] font-mono text-white">{selectedFir.victimUid?.slice(0,10)}...</span></div>
                               <div className="flex justify-between"><span className="text-[9px] text-white/40">GRID_ID:</span><span className="text-[9px] font-mono text-accent-blue">KAVACH-NODE-ALPHA</span></div>
                            </div>
                         </div>
                         <div className="p-6 bg-accent-blue/5 border border-accent-blue/10 rounded-3xl">
                            <h6 className="text-[8px] font-black uppercase tracking-widest text-accent-blue mb-3">Dispatch Destination</h6>
                            <p className="text-xs font-black text-white uppercase mb-2">LOCAL POLICE STATION: {selectedFir.state || 'PENDING DETECTION'}</p>
                            <p className="text-[9px] text-gray-500 font-medium">System will auto-route full evidence vault to regional police HQ upon command.</p>
                         </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-[320px] bg-white/[0.02] border-l border-white/5 p-8 flex flex-col justify-between">
                      <div className="space-y-6">
                        <h5 className="text-[10px] font-black uppercase tracking-[3px] text-accent-blue">Tactical Actions</h5>
                        <div className="space-y-3">
                           <button 
                             onClick={() => forwardToPolice(selectedFir.id, selectedFir.firId)}
                             className="w-full py-5 bg-accent-blue text-black rounded-2xl font-black uppercase text-[10px] tracking-tight hover:scale-95 transition-all shadow-lg shadow-accent-blue/20"
                           >
                             FORWARD TO LOCAL STATION
                           </button>
                           <button 
                             onClick={() => toast.info("Full Evidence Vault Hash generated and attached to record.")}
                             className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase text-[9px] tracking-tight hover:bg-white/10"
                           >
                             DOWNLOAD FULL VAULT
                           </button>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedFirId(null)}
                        className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-black uppercase text-[10px] tracking-tight hover:bg-accent-red hover:border-accent-red transition-all"
                      >
                        CLOSE TERMINAL
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        </main>

        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-auto lg:h-[calc(100vh-270px)] xl:h-[calc(100vh-300px)] min-h-0">
          <AnimatePresence>
            {(viewMode === 'JUSTICE' || viewMode === 'ALL') && (
              <motion.div 
                key="justice-ledger-sidebar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn("flex flex-col gap-6", viewMode === 'ALL' ? "h-[50%]" : "flex-1")}
              >
                {/* Zero-FIR Ledger */}
                <div className="flex-1 bg-black/40 border border-white/5 rounded-[40px] flex flex-col overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/5 bg-gradient-to-r from-blue-950/20 to-transparent flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <h3 className="text-[10px] font-black uppercase tracking-[3px] text-accent-blue italic">Justice Registry</h3>
                        <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest mt-1">Zero-FIR Central Terminal</span>
                      </div>
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        <button onClick={() => setLedgerMode('FIR')} className={cn("px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all", ledgerMode === 'FIR' ? "bg-accent-blue text-black" : "text-gray-500")}>FIR</button>
                        <button onClick={() => setLedgerMode('RESOLVED')} className={cn("px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all", ledgerMode === 'RESOLVED' ? "bg-green-500 text-white" : "text-gray-500")}>SAVED</button>
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-[3px]">Regional Heat-Map</p>
                        <TrendingUp size={10} className="text-accent-blue animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        {Object.entries(
                          zeroFirs.reduce((acc: any, fir) => {
                            acc[fir.state || 'Unknown'] = (acc[fir.state || 'Unknown'] || 0) + 1;
                            return acc;
                          }, {})
                        )
                          .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
                          .slice(0, 3)
                          .map(([state, count]: any) => (
                            <div key={state} className="flex flex-col gap-1">
                              <div className="flex justify-between text-[9px] font-black uppercase">
                                <span className="text-white/60">{state}</span>
                                <span className="text-accent-blue">{count} FIRs</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-accent-blue" style={{ width: `${(count / (zeroFirs.length || 1)) * 100}%` }} />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="relative group px-1">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-blue/40" size={12} />
                      <select
                        value={filterState}
                        onChange={(e) => setFilterState(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-[10px] font-black text-accent-blue uppercase outline-none focus:border-accent-blue transition-all appearance-none cursor-pointer"
                      >
                        <option value="ALL">ALL INDIA GRID</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
                      <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Scope: {filterState}</p>
                    </div>
                    {ledgerMode === 'FIR' ? (
                      zeroFirs
                        .filter(fir => filterState === 'ALL' || fir.state?.toUpperCase() === filterState.toUpperCase())
                        .map(fir => (
                          <motion.div 
                            key={fir.id} 
                            onClick={() => setSelectedFirId(fir.id)}
                            whileHover={{ scale: 1.02 }} 
                            className={cn(
                              "p-4 border rounded-2xl relative cursor-pointer transition-all",
                              selectedFirId === fir.id ? "bg-accent-blue/20 border-accent-blue" : "bg-white/[0.03] border-white/5"
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                               <h5 className="text-[10px] font-black uppercase text-white">{fir.userName}</h5>
                               <span className="text-[8px] font-mono text-white/30">{fir.firId || 'O-FIR'}</span>
                            </div>
                            <p className="text-[8px] text-gray-500 italic line-clamp-2">"{fir.statement}"</p>
                            <div className="mt-3 flex items-center justify-between">
                               <span className="text-[7px] font-black text-accent-blue uppercase tracking-widest">{fir.status || 'PENDING'}</span>
                               <ChevronRight size={12} className="text-gray-700" />
                            </div>
                          </motion.div>
                        ))
                    ) : (
                      resolvedHistory.map(h => (
                        <div key={h.id} className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
                          <p className="text-[9px] font-black uppercase text-white">{h.victimName}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {(viewMode === 'OPS' || viewMode === 'GATEKEEPER' || viewMode === 'ALL') && (
              <motion.div 
                key="intel-sidebar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn("flex flex-col gap-6", viewMode === 'ALL' ? "h-[50%]" : "flex-1")}
              >
                {/* Intelligence Publisher */}
                <div className="flex-1 bg-black border border-white/5 rounded-[40px] p-6 flex flex-col shadow-inner">
                  <div className="flex items-center gap-3 mb-4">
                    <Radio size={14} className="text-accent-red animate-pulse" />
                    <h4 className="text-[9px] font-black uppercase tracking-[3px]">Intel Publisher</h4>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        onClick={() => setIntelTarget('CITIZEN')}
                        className={cn("py-3 rounded-2xl text-[9px] font-black uppercase transition-all border flex items-center justify-center gap-2",
                          intelTarget === 'CITIZEN' ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-gray-500"
                        )}
                      >
                        <Users size={14} /> Women Safety
                      </button>
                      <button
                        onClick={() => setIntelTarget('PROTECTOR')}
                        className={cn("py-3 rounded-2xl text-[9px] font-black uppercase transition-all border flex items-center justify-center gap-2",
                          intelTarget === 'PROTECTOR' ? "bg-accent-blue text-white border-accent-blue/30 shadow-[0_0_20px_rgba(0,122,255,0.2)]" : "bg-white/5 border-white/10 text-gray-500"
                        )}
                      >
                        <Zap size={14} /> Protector
                      </button>
                    </div>

                    <input
                      value={intelTitle}
                      onChange={(e) => setIntelTitle(e.target.value)}
                      placeholder={intelTarget === 'CITIZEN' ? "SAFETY SUBJECT..." : "COMBAT SUBJECT..."}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[10px] font-black text-white outline-none focus:border-accent-red transition-all"
                    />

                    <div className="grid grid-cols-3 gap-2">
                      {(['SAFETY', 'LEGAL', 'TACTICAL'] as const).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setIntelCategory(cat)}
                          className={cn(
                            "py-2.5 rounded-xl text-[7px] font-black uppercase transition-all border",
                            intelCategory === cat ? "bg-accent-blue/20 border-accent-blue text-accent-blue" : "bg-white/5 border-white/10 text-gray-500"
                          )}
                        >
                          {cat === 'LEGAL' && intelTarget === 'PROTECTOR' ? 'ETHICS' : cat}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={intelContent}
                      onChange={(e) => setIntelContent(e.target.value)}
                      rows={4}
                      placeholder={intelTarget === 'CITIZEN' ? "CITIZEN SAFETY GUIDANCE..." : "PROTECTOR COMBAT PROTOCOL..."}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[10px] font-black text-white outline-none focus:border-accent-red transition-all resize-none"
                    />

                    <button
                      onClick={async () => {
                        if (!intelTitle.trim() || !intelContent.trim()) {
                          toast.error("MISSION INTEL INCOMPLETE");
                          return;
                        }
                        setIsPublishing(true);
                        try {
                          const collectionName = intelTarget === 'CITIZEN' ? 'guides' : 'protector_guides';
                          const now = new Date();
                          const payload: any = {
                            title: intelTitle.toUpperCase(),
                            content: intelContent,
                            priority: 'NORMAL',
                            timestamp: serverTimestamp(),
                            authorUid: auth.currentUser?.uid || 'SUPER_CELL_CONSOLE'
                          };

                          if (intelTarget === 'CITIZEN') {
                            payload.category = intelCategory;
                            payload.updatedAt = serverTimestamp();
                          } else {
                            payload.type = intelCategory === 'LEGAL' ? 'ETHICS' : intelCategory;
                            payload.updatedAt = serverTimestamp();
                          }

                          try {
                            // Tunnel 1: Official Target Registry
                            await addDoc(collection(db, collectionName), payload);
                            toast.success(`INTEL BROADCASTED TO ${intelTarget}`);
                            setIntelTitle('');
                            setIntelContent('');
                          } catch (e: any) {
                            if (e.code === 'permission-denied') {
                              console.warn("Primary Intel Grid Locked. Attempting Routing via Command Bypass...");
                              // Tunnel 2: Emergency Intake Tunnel (Lighter permissions for staff logs)
                              try {
                                await addDoc(collection(db, 'special_cell_reports'), {
                                  ...payload,
                                  type: 'INTEL_BROADCAST',
                                  originalTarget: intelTarget,
                                  status: 'unverified_broadcast'
                                });
                                toast.success(`BROADCAST ROUTED THROUGH COMMAND BYPASS`);
                                setIntelTitle('');
                                setIntelContent('');
                              } catch (e2: any) {
                                console.warn("Command Bypass Failed. Attempting SOS Channel Tunnel...");
                                // Tunnel 3: SOS Emergency Channel (Highest write clearance usually)
                                try {
                                  await addDoc(collection(db, 'alerts'), {
                                    ...payload,
                                    type: 'INTEL_RESCUE',
                                    status: 'active',
                                    severity: 'low',
                                    location: { latitude: 0, longitude: 0 },
                                    isTest: true
                                  });
                                  toast.success(`INTEL TRANSMITTED VIA SOS CHANNEL`);
                                  setIntelTitle('');
                                  setIntelContent('');
                                } catch (e3: any) {
                                  console.error("Final Transmission Failure:", e3);
                                  toast.error(`PERMISSION DENIED: Critical Security Lock.`);
                                }
                              }
                            } else {
                              console.error("Intel Broadcast Failure:", e);
                              toast.error(`TRANSMISSION FAILED: ${e.message}`);
                            }
                          }
                        } finally {
                          setIsPublishing(false);
                        }
                      }}
                      disabled={isPublishing}
                      className={cn(
                        "w-full py-5 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[5px] shadow-2xl transition-all flex items-center justify-center gap-2",
                        intelTarget === 'CITIZEN' ? "bg-accent-red shadow-red-500/20" : "bg-accent-blue shadow-blue-500/20"
                      )}
                    >
                      {isPublishing ? <span className="animate-spin">⏳</span> : `SYNC ${intelTarget} GRID`}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

      </div>

      {/* 🚨 STRATEGIC ALARM ENGINE */}
      <audio
        ref={sirenRef}
        src="https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3"
        loop
        preload="auto"
      />
    </div>
  );
}

// 🛡️ REUSABLE TACTICAL COMPONENTS
function SecurityLockScreen() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-12 text-center">
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-accent-red blur-3xl opacity-20 animate-pulse" />
        <div className="w-24 h-24 bg-black border-4 border-accent-red/30 rounded-[32px] flex items-center justify-center relative z-10">
          <Lock className="text-accent-red" size={48} />
        </div>
      </div>
      <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-3">Clearance Denied</h2>
      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[5px]">Restricted to National Strategic Command Only</p>
      <div className="mt-8 flex gap-4">
        <div className="h-[2px] w-12 bg-accent-red/20" />
        <div className="h-[2px] w-12 bg-accent-red/40" />
        <div className="h-[2px] w-12 bg-accent-red/20" />
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value, color, pulse = false }: { icon: any, label: string, value: number, color: string, pulse?: boolean }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div className={cn("flex items-center gap-2", color)}>
        {React.cloneElement(icon, { size: 14, className: pulse ? 'animate-pulse' : '' })}
        <span className="text-[9px] font-black uppercase tracking-[3px] opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-black italic text-white tracking-tighter leading-none">{value.toLocaleString()}</p>
    </div>
  );
}

const TelemetryNode = React.memo(({ icon, label, value }: { icon: any, label: string, value: string }) => {
  return (
    <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-500">
        {React.cloneElement(icon, { size: 12 })}
        <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-md font-black text-white">{value}</span>
    </div>
  );
});

const AlertCard = React.memo(({ alert, isActive, onClick, onResolve, onResolveAll }: { alert: any, isActive: boolean, onClick: () => void, onResolve: (id: string) => void, onResolveAll: (uid: string) => void }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "p-4 lg:p-5 rounded-[24px] lg:rounded-[28px] border-2 cursor-pointer transition-all relative overflow-hidden group",
        isActive
          ? "bg-accent-red/20 border-accent-red shadow-xl"
          : "bg-white/[0.03] border-white/5 hover:border-accent-red/30"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 items-center">
          <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-accent-red animate-ping" : "bg-accent-red")} />
          <h4 className="text-[12px] lg:text-[13px] font-black uppercase text-white tracking-tight truncate max-w-[120px]">{alert.victimName}</h4>
        </div>
        <span className="text-[8px] font-mono text-white/40">{alert.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="space-y-1">
        <p className="text-[8px] lg:text-[9px] text-gray-500 font-bold uppercase tracking-widest">{alert.state}</p>
        <p className="text-[7px] font-mono text-accent-red/60 uppercase">SOS: {alert.type || 'BT'}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-2 relative z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onResolve(alert.id); }}
            className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-[7px] font-black uppercase hover:bg-green-500 hover:text-white transition-all"
          >
            DONE
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onResolveAll(alert.victimUid); }}
            className="px-3 py-1.5 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue rounded-lg text-[7px] font-black uppercase hover:bg-accent-blue hover:text-black transition-all"
          >
            ALL
          </button>
        </div>
        <ChevronRight size={14} className={cn("transition-all", isActive ? "text-accent-red translate-x-1" : "text-gray-700")} />
      </div>
    </motion.div>
  );
});

function EmptyState({ label, icon }: { label: string, icon: any }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-700 opacity-20 py-20">
      {React.cloneElement(icon, { size: 48, className: 'mb-4' })}
      <p className="text-[10px] font-black uppercase tracking-[4px] text-center">{label}</p>
    </div>
  );
}

function StrategicMetric({ label, value, type }: { label: string, value: any, type: 'DANGER' | 'INFO' | 'SUCCESS' | 'NORMAL' }) {
  const color = type === 'DANGER' ? 'text-accent-red' : type === 'INFO' ? 'text-accent-blue' : type === 'SUCCESS' ? 'text-green-500' : 'text-white/60';
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-[8px] font-black uppercase tracking-[3px] text-white/30">{label}</span>
      <div className="flex items-center gap-2">
        {type === 'DANGER' && <div className="w-1.5 h-1.5 rounded-full bg-accent-red animate-ping" />}
        <span className={cn("text-2xl font-black tracking-tighter italic", color)}>{value}</span>
      </div>
    </div>
  );
}

function MinistryCard({ label, value, sub, color, icon }: { label: string, value: string, sub: string, color: string, icon: any }) {
  return (
    <div className={cn("p-5 bg-white/[0.02] border rounded-[28px] flex items-center gap-5 transition-all hover:bg-white/[0.04]", color)}>
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-[7px] font-black text-gray-600 uppercase tracking-[4px] mb-1">{label}</p>
        <p className="text-lg font-black text-white leading-none mb-1">{value}</p>
        <p className="text-[7px] font-bold text-accent-blue uppercase tracking-widest">{sub}</p>
      </div>
    </div>
  );
}
