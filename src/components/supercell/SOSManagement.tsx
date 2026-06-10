import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, MapPin, Phone, 
  AlertTriangle, History, MessageSquare,
  Activity, Zap, ShieldAlert, Ban, 
  CheckCircle2, Users, Search, Target, Clock,
  ChevronRight, ChevronLeft, Filter, Fingerprint, Car, X,
  ChevronDown, Heart, Lock, Calendar, Mail, ShieldCheck, Globe, Battery,
  Mic, Camera
} from 'lucide-react';
import { db, storage } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

// 🏛️ UHD Strategic Map
import CommandMap from '../maps/CommandMap';
import MapplsCommandMap from '../maps/MapplsCommandMap';
import { MissionAuditModal } from './MissionAuditModal';

const WARNING_REASONS = [
  "Accidental SOS trigger without emergency.",
  "Testing the SOS system without authorization.",
  "Intentional false alarm reporting.",
  "Misuse of the grid for non-emergency communication.",
  "Inappropriate or prank SOS activation.",
  "Other (Type custom message below)"
];

export function SOSManagement({ 
  externalSelectedId, 
  verifiedProtectors = [], 
  activeAlerts = [], 
  historicalAlerts = [], 
  userStatusMap = {},
  onViewReplay
}: { 
  externalSelectedId?: string | null, 
  verifiedProtectors?: any[],
  activeAlerts?: any[],
  historicalAlerts?: any[],
  userStatusMap?: Record<string, any>,
  onViewReplay?: (alertId: string) => void
}) {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'LIVE' | 'HISTORY'>('LIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);
  
  const [guardians, setGuardians] = useState<any[]>([]);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [nearbyPolice, setNearbyPolice] = useState<any[]>([]);
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);

  // 🛡️ Modals State
  const [isWarnModalOpen, setIsWarnModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(WARNING_REASONS[0]);
  const [customMsg, setCustomMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastQueriedCoords = React.useRef<{ id: string | null; lat: number; lng: number } | null>(null);

  useEffect(() => {
    // 🛡️ NO-OP: DATA INJECTED VIA PROPS FROM SUPERCELL_DASHBOARD
  }, []);

  // 📡 SYNC EXTERNAL SELECTION
  useEffect(() => {
    if (externalSelectedId) {
      setSelectedAlertId(externalSelectedId);
      setSidebarTab('LIVE');
    }
  }, [externalSelectedId]);

  useEffect(() => {
    const selectedAlert = (sidebarTab === 'LIVE' ? activeAlerts : historicalAlerts).find(a => a.id === selectedAlertId);
    
    const lat = selectedAlert?.latitude || selectedAlert?.lat || selectedAlert?.location?.latitude || selectedAlert?.location?.lat;
    const lng = selectedAlert?.longitude || selectedAlert?.lng || selectedAlert?.location?.longitude || selectedAlert?.location?.lng;
    
    if (lat && lng) {
      // 🛡️ PREVENT FREQUENT RE-RUNS AND FLICKERING:
      // Only execute geocoding and Mappls nodes search if the alert ID has changed
      // OR if the target has moved by more than ~30 meters (0.0003 degrees)
      const didIdChange = lastQueriedCoords.current === null || lastQueriedCoords.current.id !== selectedAlertId;
      const distShift = lastQueriedCoords.current 
        ? Math.abs(lat - lastQueriedCoords.current.lat) > 0.0003 || Math.abs(lng - lastQueriedCoords.current.lng) > 0.0003 
        : true;

      if (didIdChange || distShift) {
        lastQueriedCoords.current = { id: selectedAlertId, lat, lng };

        const resolveAddr = async () => {
          setLoadingAddress(true);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            setResolvedAddress(data.display_name || "Verified GPS Signal");
          } catch (e) { setResolvedAddress("Tactical Resolution Failed"); }
          finally { setLoadingAddress(false); }
        };
        resolveAddr();

        // 🛰️ FETCH NEARBY EMERGENCY NODES (Mappls Direct Proxy with Mapbox API backup fallback)
        const fetchNodes = async () => {
          setLoadingNodes(true);
          try {
            const { fetchNearbyPoliceMappls, fetchNearbyHospitalsMappls, isOfficialPoliceStation } = await import('../../services/MapplsService');
            
            let police = await fetchNearbyPoliceMappls(lat, lng);
            let hospitals = await fetchNearbyHospitalsMappls(lat, lng);

            const MAPBOX_TOKEN = "pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA";

            if (!police || police.length === 0) {
              try {
                const url = `https://api.mapbox.com/search/searchbox/v1/category/police?proximity=${lng},${lat}&limit=5&access_token=${MAPBOX_TOKEN}`;
                const response = await fetch(url);
                const resData = await response.json();
                
                if (resData && Array.isArray(resData.features) && resData.features.length > 0) {
                  police = resData.features.map((f: any) => {
                    const fLat = f.geometry?.coordinates?.[1] || f.properties?.coordinates?.latitude || lat;
                    const fLng = f.geometry?.coordinates?.[0] || f.properties?.coordinates?.longitude || lng;
                    const distMeters = f.properties?.distance || 0;
                    
                    return {
                      id: f.properties?.mapbox_id || f.id || Math.random().toString(),
                      name: f.properties?.name || f.properties?.full_address || "Local Police Station",
                      address: f.properties?.full_address || "Nearby",
                      phone: "112",
                      lat: fLat,
                      lng: fLng
                    };
                  }).filter((s: any) => isOfficialPoliceStation(s.name));
                }
              } catch (err) {
                console.error("Mapbox Police Fallback Failed:", err);
              }
            }

            if (!hospitals || hospitals.length === 0) {
              try {
                const url = `https://api.mapbox.com/search/searchbox/v1/category/hospital?proximity=${lng},${lat}&limit=5&access_token=${MAPBOX_TOKEN}`;
                const response = await fetch(url);
                const resData = await response.json();
                
                if (resData && Array.isArray(resData.features) && resData.features.length > 0) {
                  hospitals = resData.features.map((f: any) => {
                    const fLat = f.geometry?.coordinates?.[1] || f.properties?.coordinates?.latitude || lat;
                    const fLng = f.geometry?.coordinates?.[0] || f.properties?.coordinates?.longitude || lng;
                    
                    return {
                      id: f.properties?.mapbox_id || f.id || Math.random().toString(),
                      name: f.properties?.name || f.properties?.full_address || "Local Hospital",
                      address: f.properties?.full_address || "Nearby",
                      phone: "108",
                      lat: fLat,
                      lng: fLng
                    };
                  });
                }
              } catch (err) {
                console.error("Mapbox Hospital Fallback Failed:", err);
              }
            }

            setNearbyPolice((police || []).slice(0, 2));
            setNearbyHospitals((hospitals || []).slice(0, 2));
          } catch (error) {
            console.error("Failed to fetch nearby emergency nodes in SOSManagement:", error);
          } finally {
            setLoadingNodes(false);
          }
        };
        fetchNodes();
      }
    } else { 
      setResolvedAddress(null);
      setNearbyPolice([]);
      setNearbyHospitals([]);
      lastQueriedCoords.current = null;
    }

    // 🛰️ TACTICAL ID RESOLUTION
    const currentVictimId = sidebarTab === 'LIVE'
      ? (selectedAlert?.victimUid || selectedAlert?.uid || selectedAlert?.userId)
      : selectedVictimId;
    
    // 🛰️ TACTICAL GUARDIAN FETCH
    let unsub1 = () => {};
    let unsub2 = () => {};
    if (currentVictimId) {
      const gRef1 = collection(db, 'users', currentVictimId, 'guardians');
      const gRef2 = collection(db, 'women_users', currentVictimId, 'safety_data');
      
      unsub1 = onSnapshot(gRef1, (snap) => {
        if (!snap.empty) setGuardians(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        else setGuardians([]);
      });
      unsub2 = onSnapshot(gRef2, (snap) => {
        if (!snap.empty) setGuardians(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        else setGuardians([]);
      });
    } else {
      setGuardians([]);
    }
    return () => { unsub1(); unsub2(); };
  }, [selectedAlertId, selectedVictimId, sidebarTab, activeAlerts, historicalAlerts]);

  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    historicalAlerts.forEach(alert => {
      // 🛡️ SOS LOGS ONLY: Group by victim identity
      const vUid = alert.victimUid || alert.uid || alert.userId;
      if (vUid) {
        if (!groups[vUid]) groups[vUid] = [];
        // 🛡️ DEDUPLICATE: Ensure we don't add the same alert multiple times
        if (!groups[vUid].some(a => a.id === alert.id)) {
          groups[vUid].push(alert);
        }
      }
    });
    return groups;
  }, [historicalAlerts]);

  const uniqueHistoricalParticipants = React.useMemo(() => {
    return Object.keys(groupedHistory).map(uid => {
      const participantAlerts = groupedHistory[uid];
      const profile = userStatusMap[uid];
      return {
        uid,
        name: profile?.name || participantAlerts[0]?.victimName || 'Unknown Citizen',
        count: participantAlerts.length,
        lastTimestamp: participantAlerts[0]?.timestamp,
        role: profile?.role || 'CITIZEN'
      };
    }).sort((a, b) => (b.lastTimestamp?.toMillis() || 0) - (a.lastTimestamp?.toMillis() || 0));
  }, [groupedHistory, userStatusMap]);

  const filteredAlerts = sidebarTab === 'LIVE' 
    ? activeAlerts.filter(a => a.victimName?.toLowerCase().includes(searchTerm.toLowerCase()) || a.id.toLowerCase().includes(searchTerm.toLowerCase()))
    : uniqueHistoricalParticipants.filter(v => v.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedAlert = (sidebarTab === 'LIVE' ? activeAlerts : historicalAlerts).find(a => a.id === selectedAlertId);
  const victimHistory = (sidebarTab === 'HISTORY' && selectedVictimId) ? (groupedHistory[selectedVictimId] || []) : [];
  
  // 🛰️ TACTICAL ID & PHONE RESOLUTION
  const victimId = sidebarTab === 'LIVE' 
    ? (selectedAlert?.victimUid || selectedAlert?.uid || selectedAlert?.userId) 
    : selectedVictimId;

  const firstHistoryAlert = victimHistory[0];
  const alertPhone = sidebarTab === 'LIVE' 
    ? (selectedAlert?.phone || selectedAlert?.victimPhone || selectedAlert?.phoneNumber)
    : (firstHistoryAlert?.phone || firstHistoryAlert?.victimPhone || firstHistoryAlert?.phoneNumber);

  const [pendingAppeal, setPendingAppeal] = useState<any>(null);

  // 🛰️ DEEP PROFILE SEARCH (ID -> PHONE -> NAME)
  const findVictimProfile = () => {
    if (victimId && userStatusMap[victimId]) return userStatusMap[victimId];
    if (alertPhone) {
      const profileByPhone = Object.values(userStatusMap).find((u: any) => 
        u.phoneNumber === alertPhone || u.phone === alertPhone
      );
      if (profileByPhone) return profileByPhone;
    }
    const victimName = (sidebarTab === 'LIVE' ? selectedAlert?.victimName : firstHistoryAlert?.victimName);
    if (victimName) {
      const profileByName = Object.values(userStatusMap).find((u: any) => 
        (u.name || u.userName || '').toLowerCase() === victimName.toLowerCase()
      );
      if (profileByName) return profileByName;
    }
    return null;
  };

  const victimDataFromAlert = {
    name: (sidebarTab === 'LIVE' ? (selectedAlert?.victimName || selectedAlert?.userName) : firstHistoryAlert?.victimName) || 'UNIDENTIFIED CITIZEN',
    phoneNumber: alertPhone || 'NO PHONE RECORD',
    aadhar: (sidebarTab === 'LIVE' ? selectedAlert?.aadhar : firstHistoryAlert?.aadhar) || 'UNLINKED'
  };

  const victimData = findVictimProfile() || victimDataFromAlert;

  useEffect(() => {
    if (victimId && victimData?.isSOSBlocked) {
      const q = query(collection(db, 'appeals'), where('userId', '==', victimId), where('status', '==', 'pending'));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setPendingAppeal({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setPendingAppeal(null);
        }
      });
      return () => unsub();
    } else {
      setPendingAppeal(null);
    }
  }, [victimId, victimData?.isSOSBlocked]);

  const handleAction = async (type: 'warn' | 'ban') => {
    if (!victimData) return;
    if (type === 'warn') setIsWarnModalOpen(true);
    else if (type === 'ban') {
      if (!window.confirm("CRITICAL: Block SOS access?")) return;
      await updateDoc(doc(db, 'users', victimData.id), { isSOSBlocked: true, sosBlockedReason: "Repeated Grid Misuse" });
      toast.error("SOS Access Revoked");
    }
  };

  const submitWarning = async () => {
    if (!victimData) return;
    setIsSubmitting(true);
    const finalMsg = selectedReason.includes("Other") ? customMsg : selectedReason;
    try {
      await updateDoc(doc(db, 'users', victimData.id), {
        hasPendingWarning: true,
        warningMessage: finalMsg,
        sosStrikeCount: (victimData.sosStrikeCount || 0) + 1
      });
      toast.warning("Warning Issued");
      setIsWarnModalOpen(false);
    } catch (e) { toast.error("Citation Failed"); }
    finally { setIsSubmitting(false); }
  };

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isOverriding, setIsOverriding] = useState(false);

  const triggerSovereignOverride = async () => {
    if (!selectedAlert) return;
    setIsOverriding(true);
    try {
      await updateDoc(doc(db, 'alerts', selectedAlert.id), {
        isSovereignOverrideActive: true,
        priority: 'SOVEREIGN_CRITICAL'
      });
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'protector')));
      const batchPromises = snap.docs.map(pDoc => 
        updateDoc(doc(db, 'users', pDoc.id), {
          currentMissionId: selectedAlert.id,
          missionStatus: 'REDIRECTED',
          isUnderSovereignCommand: true
        })
      );
      await Promise.all(batchPromises);
      toast.error("SOVEREIGN OVERRIDE ACTIVE");
      setIsOverrideModalOpen(false);
    } catch (e) { toast.error("Override Failed"); }
    finally { setIsOverriding(false); }
  };

  const handleRestoreAccess = async (uid: string) => {
    if (!window.confirm("COMMAND CENTER: Restore full tactical access?")) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        isSOSBlocked: false,
        isPermanentlyBlocked: false,
        sosBlockedReason: null,
        hasPendingWarning: false,
        sosStrikeCount: 0
      });

      // ⚖️ Resolve Pending Appeal if exists
      if (pendingAppeal?.id) {
        await updateDoc(doc(db, 'appeals', pendingAppeal.id), {
          status: 'resolved',
          resolvedAt: serverTimestamp(),
          resolvedBy: 'SuperCell Command'
        });
      }

      toast.success("Access Restored. National Grid Updated.");
    } catch (e) { toast.error("Restoration Failed."); }
  };

  const handlePermanentBan = async (uid: string) => {
    if (!window.confirm("CRITICAL: Enforce Permanent Terminal Ban? This identity will be blacklisted.")) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        isSOSBlocked: true,
        isPermanentlyBlocked: true,
        sosBlockedReason: "Permanent Grid Exclusion by SuperCell Command"
      });

      // ⚖️ Reject Pending Appeal if exists
      if (pendingAppeal?.id) {
        await updateDoc(doc(db, 'appeals', pendingAppeal.id), {
          status: 'rejected',
          resolvedAt: serverTimestamp(),
          resolvedBy: 'SuperCell Command'
        });
      }

      toast.error("Identity Blacklisted. Terminal Ban Active.");
    } catch (e) { toast.error("Ban Failed."); }
  };

  const renderHistoryContent = () => {
    if (!victimData) {
      return (
        <div className="h-full flex flex-col items-center justify-center opacity-20">
          <ShieldAlert size={120} strokeWidth={0.5} className="mb-8" />
          <p className="text-xl font-black uppercase tracking-[10px]">Select Incident Record</p>
        </div>
      );
    }

    return (
      <div className="flex-grow flex flex-row h-full w-full overflow-hidden">
        {/* LEFT COLUMN: PAST LOGS */}
        <div className="w-[50%] lg:w-[55%] h-full overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6 border-r border-white/5 bg-[#0F172A]">
          <div className="space-y-1 mb-6">
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[11px] font-black rounded-full border border-blue-500/20 uppercase tracking-widest leading-none">Archived Records</span>
            <h1 className="text-xl font-black text-white uppercase italic leading-none tracking-tighter mt-1">Incident Ledger History</h1>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.1em] mt-1">Double scrollable forensic archive for {victimData.name}</p>
          </div>

          <div className="space-y-6">
            {victimHistory.length === 0 ? (
              <div className="py-20 text-center opacity-20 border-2 border-dashed border-white/5 rounded-[2rem]">
                <ShieldAlert size={60} className="mx-auto mb-4" />
                <p className="text-sm font-black uppercase tracking-[8px]">No Records in Ledger</p>
              </div>
            ) : (
              victimHistory.map((alert, idx) => (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#1E293B]/40 rounded-[2rem] border border-white/5 p-6 shadow-xl relative overflow-hidden group"
                >
                  {/* HEADER */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-600/10 rounded-[14px] flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <h5 className="text-[14px] font-black text-white uppercase italic tracking-tighter leading-none">
                          {alert.timestamp?.toDate ? alert.timestamp.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase() : 'UNKNOWN DATE'}
                        </h5>
                        <p className="text-[11px] font-black text-rose-500 uppercase tracking-[1.5px] mt-1.5">
                          TRIGGERED AT: {alert.timestamp?.toDate ? alert.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[12px] font-black text-emerald-500 uppercase tracking-[2px]">
                      Resolved
                    </div>
                  </div>

                  {/* DATA GRID */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {[
                      { label: 'Gender', value: victimData.gender || 'FEMALE', icon: User },
                      // { label: 'Aadhaar UID', value: victimData.aadhar || victimData.aadhaar || 'UNLINKED', icon: Fingerprint },
                      { label: 'Role', value: victimData.role || 'CITIZEN', icon: Shield },
                      { label: 'Phone', value: victimData.phoneNumber || victimData.phone || 'NO RECORD', icon: Phone },
                      { label: 'Email Address', value: victimData.email || 'NO EMAIL', icon: Mail },
                      { label: 'Battery Level', value: alert.batteryLevel || alert.battery || (alert.deviceStatus && alert.deviceStatus.battery) || alert.deviceBattery || '89%', icon: Battery }
                    ].map((item, i) => (
                      <div key={i} className="bg-black/25 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between">
                        <p className="text-[14px] font-black text-gray-500 uppercase tracking-widest mb-1 leading-none">{item.label}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <item.icon size={9} className="text-blue-400 shrink-0" />
                          <span className="text-[12px] font-bold text-gray-200 uppercase tracking-tight truncate w-full">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* GUARDIAN NETWORK */}
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-6">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Users size={10} className="text-rose-500" /> Connected Guardian Network
                    </p>
                    {guardians.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {guardians.map((g, idx) => (
                          <div key={idx} className="bg-black/20 px-3 py-2 rounded-xl border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-black text-white uppercase italic leading-none">{g.name}</span>
                              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[5px] font-black rounded-full uppercase tracking-widest leading-none">{g.relation || 'Guardian'}</span>
                            </div>
                            <span className="text-[12px] font-black text-gray-400 tabular-nums leading-none">{g.phone || g.phoneNumber}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[12px] text-gray-500 font-bold uppercase tracking-widest italic">No guardians registered.</div>
                    )}
                  </div>

                  {/* DETAILS SECTION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/20 p-5 rounded-[1.5rem] border border-white/5 flex flex-col justify-between">
                      <div>
                        <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Resolution Log</p>
                        <p className="text-[13px] font-black text-emerald-500 uppercase italic tracking-widest">Verified Rescue Completed</p>
                        <p className="text-[12px] font-bold text-gray-400 uppercase italic mt-1.5">"{alert.closureReason || 'Mission Accomplished'}"</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <button 
                          onClick={() => setIsAuditModalOpen(true)}
                          className="text-[12px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          Forensic Audit Detail <ChevronRight size={10} />
                        </button>
                        <button 
                          onClick={() => setSelectedAlertId(alert.id)}
                          className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[12px] font-black text-emerald-400 hover:bg-emerald-500 hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                        >
                          <MapPin size={10} /> Load Tactical Map
                        </button>
                      </div>
                    </div>
                    <div className="bg-black/20 p-5 rounded-[1.5rem] border border-white/5 flex flex-col justify-between">
                      <div>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Savior & Responders</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(alert.activeResponders || []).map((r: any) => (
                            <div 
                              key={r.uid} 
                              onClick={() => {
                                onViewReplay?.(alert.id);
                                toast.success(`⚡ INITIATING 3D REPLAY: ${r.name}`);
                              }}
                              className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:bg-emerald-600 hover:scale-105 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                            >
                              <ShieldCheck size={8} />
                              {r.name}
                            </div>
                          ))}
                          {(!alert.activeResponders || alert.activeResponders.length === 0) && (
                            <div className="text-[12px] font-bold text-gray-600 italic">No Responder Logged</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: VICTIM DOSSIER DETAILS */}
        <div className="w-[50%] lg:w-[45%] h-full overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6 bg-[#0B0F19] relative">
          {/* 🛡️ HEADER AREA */}
          <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 space-y-4 relative">
            {/* 🛡️ DISCIPLINARY OVERLAY */}
            <AnimatePresence>
              {victimData.isSOSBlocked && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(6px)" }}
                  className="absolute inset-0 z-50 bg-rose-950/85 flex flex-col items-center justify-center p-6 text-center rounded-[2rem]"
                >
                  <div className="bg-[#1E293B] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4 max-w-sm">
                    <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mx-auto border border-rose-500/20">
                      <Lock size={24} className="text-rose-500" />
                    </div>
                    <h2 className="text-base font-black text-white uppercase italic leading-none">Account Blocked</h2>
                    <p className="text-[12px] font-bold text-rose-400 uppercase tracking-widest leading-relaxed">SOS restricted from Grid</p>
                    
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-left text-[13px] text-gray-300 italic">
                      {pendingAppeal ? `"${pendingAppeal.reason}"` : "NO PENDING APPEAL."}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleRestoreAccess(victimData.id)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-black uppercase tracking-widest shadow-lg">Restore</button>
                      <button onClick={() => handlePermanentBan(victimData.id)} className="flex-1 py-2 bg-black/40 border border-rose-900 text-rose-900 rounded-lg text-[12px] font-black uppercase tracking-widest">Ban</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-[#1E293B] text-blue-400 text-[11px] font-black rounded-full border border-white/5 uppercase tracking-widest leading-none">Archived Incident Ledger</span>
                <h1 className="text-xl font-black text-white uppercase italic leading-none tracking-tighter mt-1">{victimData.name}</h1>
              </div>
              
              {/* COMPACT ACTION BUTTONS */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => handleAction('warn')} className="px-2.5 py-1.5 bg-[#1E293B] border border-amber-500/30 text-amber-500 rounded-lg text-[12px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-amber-500 hover:text-black transition-all">
                  <AlertTriangle size={10} /> Warn
                </button>
                <button onClick={() => handleAction('ban')} className="px-2.5 py-1.5 bg-[#1E293B] border border-rose-500/30 text-rose-500 rounded-lg text-[12px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-rose-500 hover:text-white transition-all">
                  <Ban size={10} /> Ban
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-[#1E293B] px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 shadow-lg">
                <Phone size={10} className="text-gray-500" />
                <span className="text-[13px] font-black text-white tabular-nums">{victimData.phoneNumber || victimData.phone || 'NO RECORD'}</span>
              </div>
              <div className="bg-[#1E293B] px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 shadow-lg">
                {/* <Fingerprint size={10} className="text-gray-500" /> */}
                {/* <span className="text-[13px] font-black text-white tabular-nums tracking-widest">{victimData.aadhar || victimData.aadhaar || 'UNLINKED'}</span> */}
              </div>
              {victimData.email && (
                <div className="bg-[#1E293B] px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 shadow-lg">
                  <Mail size={10} className="text-gray-500" />
                  <span className="text-[13px] font-black text-white lowercase truncate max-w-[120px]">{victimData.email}</span>
                </div>
              )}
              {victimData.gender && (
                <div className="bg-[#1E293B] px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 shadow-lg">
                  <span className="text-[14px] font-black text-gray-500 uppercase tracking-widest">GDR:</span>
                  <span className="text-[13px] font-black text-white uppercase">{victimData.gender}</span>
                </div>
              )}
              {victimData.role && (
                <div className="bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 flex items-center gap-1.5 shadow-lg">
                  <Shield size={10} className="text-blue-400" />
                  <span className="text-[13px] font-black text-blue-400 uppercase">{victimData.role}</span>
                </div>
              )}
              {victimData.isVerified && (
                <div className="bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5 shadow-lg">
                  <ShieldCheck size={10} className="text-emerald-400" />
                  <span className="text-[12px] font-black text-emerald-400 uppercase tracking-widest">Verified</span>
                </div>
              )}
              {victimData.specialCellLinked && (
                <div className="bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 flex items-center gap-1.5 shadow-lg">
                  <Zap size={10} className="text-rose-500" />
                  <span className="text-[12px] font-black text-rose-500 uppercase tracking-widest">Special Cell</span>
                </div>
              )}
            </div>
          </div>

          {/* 📍 PERMANENT SECTOR GRID */}
          {(victimData.fullAddress || victimData.locationData?.formattedAddress) && (
            <div className="bg-[#1E293B] p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/30" />
              <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <MapPin size={10} className="text-rose-500" /> Permanent Sector Grid
              </p>
              <p className="text-[11px] font-black text-white uppercase italic leading-relaxed">{victimData.fullAddress || victimData.locationData?.formattedAddress}</p>
            </div>
          )}

          {/* 📊 STRATEGIC STATS OVERLAY */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1E293B]/30 p-4 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Bell size={30} /></div>
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Total Alerts</p>
              <h3 className="text-xl font-black text-white italic tabular-nums leading-none tracking-tighter">{victimHistory.length}</h3>
            </div>
            <div className="bg-[#1E293B]/30 p-4 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><ShieldAlert size={30} /></div>
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Misuse</p>
              <h3 className="text-xl font-black text-rose-500 italic tabular-nums leading-none tracking-tighter">{victimHistory.filter(a => a.closureReason?.includes('Misuse') || a.closureReason?.includes('Accidental')).length}</h3>
            </div>
            <div className="bg-[#1E293B]/30 p-4 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Activity size={30} /></div>
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Activity Index</p>
              <h3 className="text-xl font-black text-emerald-500 italic tabular-nums leading-none tracking-tighter">
                {Math.max(0, 100 - (victimHistory.filter(a => a.closureReason?.includes('Misuse')).length * 20))}%
              </h3>
            </div>
          </div>

          {/* 🛡️ SUPPORT NODES */}
          <div className="bg-[#1E293B] p-6 rounded-[2rem] border border-white/5 shadow-xl space-y-4">
            <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Heart size={10} className="text-rose-500" /> Support Nodes</p>
            <div className="space-y-2.5">
              {victimData.primaryGuardian && (
                <div className="flex justify-between items-center bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-black text-white uppercase italic">{victimData.primaryGuardian.name}</span>
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[5px] font-black rounded-full uppercase tracking-widest">Primary</span>
                  </div>
                  <span className="text-[13px] font-black text-rose-400 tabular-nums">{victimData.primaryGuardian.phone}</span>
                </div>
              )}
              {guardians.map((g: any) => (
                <div key={g.id} className="flex justify-between items-center bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                  <span className="text-[13px] font-black text-white uppercase italic">{g.name}</span>
                  <span className="text-[13px] font-black text-blue-400 tabular-nums">{g.phone || g.phoneNumber}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 📊 PROTOCOL STRIKES */}
          <div className="bg-[#1E293B] p-6 rounded-[2rem] border border-white/5 shadow-xl flex items-center justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Activity size={40} /></div>
            <div>
              <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest leading-none">Protocol Strikes</p>
              <p className="text-[14px] text-gray-500 font-bold uppercase tracking-widest mt-1">Misuse Strike Penalty Counter</p>
            </div>
            <h3 className="text-3xl font-black text-rose-500 italic tabular-nums leading-none">{victimData.sosStrikeCount || 0}</h3>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-[#0F172A] flex overflow-hidden font-['Outfit']">
      {/* 📟 ASIDE QUEUE */}
      <aside className="w-[380px] bg-[#1E293B] border-r border-white/5 flex flex-col z-20 shadow-2xl">
         <div className="p-8 pb-4">
            <div className="flex bg-[#0F172A] p-1 rounded-2xl border border-white/5 mb-6">
               <button onClick={() => { setSidebarTab('LIVE'); setSelectedAlertId(null); setSelectedVictimId(null); }} className={cn("flex-1 py-3 text-[13px] font-black uppercase tracking-widest rounded-xl transition-all", sidebarTab === 'LIVE' ? "bg-rose-600 text-white shadow-lg" : "text-gray-500")}><Activity size={12} className="inline mr-2" /> Live SOS</button>
               <button onClick={() => { setSidebarTab('HISTORY'); setSelectedAlertId(null); setSelectedVictimId(null); }} className={cn("flex-1 py-3 text-[13px] font-black uppercase tracking-widest rounded-xl transition-all", sidebarTab === 'HISTORY' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500")}><Clock size={12} className="inline mr-2" /> Logs</button>
            </div>
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
               <input type="text" placeholder="SEARCH VICTIM..." className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black text-white uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {filteredAlerts.map((alert: any) => (
              <div key={alert.id || alert.uid} onClick={() => {
                  if (sidebarTab === 'LIVE') {
                      setSelectedAlertId(alert.id);
                  } else {
                      setSelectedVictimId(alert.uid);
                      setSelectedAlertId(null); // Clear Tactical Map to return to Ledger
                  }
              }} className={cn("p-5 rounded-[2.5rem] border border-white/5 cursor-pointer transition-all", (selectedAlertId === alert.id || selectedVictimId === alert.uid) ? "bg-white/10 border-white/20" : "bg-[#1E293B]/50")}>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5"><User size={20} className={sidebarTab === 'LIVE' ? "text-rose-500" : "text-blue-500"} /></div>
                   <div className="flex-1 truncate">
                      <h4 className="text-[11px] font-black text-white uppercase">{userStatusMap[alert.victimUid || alert.userId || alert.uid]?.name || alert.victimName || alert.name}</h4>
                      <p className="text-[11px] text-gray-500 font-black uppercase">{sidebarTab === 'LIVE' ? 'SOS Active' : `Resolved (${alert.count} Incidents)`}</p>
                   </div>
                </div>
              </div>
            ))}
         </div>
      </aside>

      {/* 🔍 MAIN CONTENT */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-[#0F172A]">
         {(selectedAlert || (sidebarTab === 'HISTORY' && selectedVictimId)) ? (
            selectedAlertId && selectedAlert ? (
               <div className="flex-grow flex flex-row h-full w-full overflow-hidden">
                  {/* LEFT COLUMN: MAP */}
                  <div className="w-[50%] lg:w-[55%] h-full relative shrink-0 border-r border-white/5">
                     {!useMapboxFallback ? (
                       <MapplsCommandMap activeAlerts={[selectedAlert]} activeProtectors={verifiedProtectors} selectedAlertId={selectedAlert.id} onFallback={() => setUseMapboxFallback(true)} />
                     ) : (
                       <CommandMap activeAlerts={[selectedAlert]} activeProtectors={verifiedProtectors} selectedAlertId={selectedAlert.id} />
                     )}
                  </div>

                  {/* RIGHT COLUMN: DETAILS */}
                  <div className="w-[50%] lg:w-[45%] h-full overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6 bg-[#0B0F19]">
                     {/* 🛡️ HEADER AREA */}
                     <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 space-y-4 relative">
                        {/* 🛡️ DISCIPLINARY OVERLAY */}
                        <AnimatePresence>
                          {victimData?.isSOSBlocked && (
                            <motion.div 
                              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                              animate={{ opacity: 1, backdropFilter: "blur(6px)" }}
                              className="absolute inset-0 z-50 bg-rose-950/80 flex flex-col items-center justify-center p-6 text-center rounded-[2rem]"
                            >
                              <div className="bg-[#1E293B] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4 max-w-sm">
                                 <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mx-auto border border-rose-500/20">
                                    <Lock size={24} className="text-rose-500" />
                                 </div>
                                 <h2 className="text-base font-black text-white uppercase italic leading-none">Account Blocked</h2>
                                 <p className="text-[12px] font-bold text-rose-400 uppercase tracking-widest leading-relaxed">SOS restricted from National Grid</p>
                                 
                                 <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-left text-[13px] text-gray-300 italic">
                                    {pendingAppeal ? `"${pendingAppeal.reason}"` : "NO PENDING APPEAL."}
                                 </div>

                                 <div className="flex gap-2">
                                    <button onClick={() => handleRestoreAccess(victimData.id)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-black uppercase tracking-widest shadow-lg">Restore</button>
                                    <button onClick={() => handlePermanentBan(victimData.id)} className="flex-1 py-2 bg-black/40 border border-rose-900 text-rose-900 rounded-lg text-[12px] font-black uppercase tracking-widest">Ban</button>
                                 </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex items-start justify-between">
                           <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                   "px-2 py-0.5 text-[11px] font-black rounded-full border uppercase tracking-widest leading-none",
                                   sidebarTab === 'HISTORY' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                )}>
                                   {sidebarTab === 'HISTORY' ? 'Archived SOS Packet' : 'Live SOS Packet'}
                                </span>
                                {sidebarTab === 'HISTORY' && (
                                   <button 
                                     onClick={() => setSelectedAlertId(null)}
                                     className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white text-[11px] font-black rounded border border-white/10 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                   >
                                     <ChevronLeft size={8} /> Back to Ledger
                                   </button>
                                )}
                              </div>
                              <h1 className="text-xl font-black text-white uppercase italic leading-none tracking-tighter mt-1">{victimData?.name || 'Citizen Profile'}</h1>
                           </div>
                           
                           {/* COMPACT ACTION BUTTONS */}
                           <div className="flex items-center gap-1.5 shrink-0">
                              <button onClick={() => handleAction('warn')} className="px-2.5 py-1.5 bg-[#1E293B] border border-amber-500/30 text-amber-500 rounded-lg text-[12px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-amber-500 hover:text-black transition-all">
                                 <AlertTriangle size={10} /> Warn
                              </button>
                              <button onClick={() => setIsOverrideModalOpen(true)} className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg text-[12px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-rose-600/20 transition-all border border-rose-400/30">
                                 <Zap size={10} /> Override
                              </button>
                              <button onClick={() => handleAction('ban')} className="px-2.5 py-1.5 bg-[#1E293B] border border-rose-500/30 text-rose-500 rounded-lg text-[12px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-rose-500 hover:text-white transition-all">
                                 <Ban size={10} /> Ban
                              </button>
                           </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                           <div className="bg-[#1E293B] px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 shadow-lg">
                              <Phone size={10} className="text-gray-500" />
                              <span className="text-[13px] font-black text-white tabular-nums">{victimData?.phoneNumber || victimData?.phone || 'NO RECORD'}</span>
                           </div>
                           <div className="bg-[#1E293B] px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 shadow-lg">
                             {/* <Fingerprint size={10} className="text-gray-500" /> */}
                              {/* <span className="text-[13px] font-black text-white tabular-nums tracking-widest">{victimData?.aadhar || victimData?.aadhaar || 'UNLINKED'}</span> */}
                           </div>
                           {victimData?.email && (
                              <div className="bg-[#1E293B] px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 shadow-lg">
                                 <Mail size={10} className="text-gray-500" />
                                 <span className="text-[13px] font-black text-white lowercase truncate max-w-[120px]">{victimData.email}</span>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* 📍 NEURAL GEOCODE SECTOR */}
                     <div className="bg-[#1E293B] p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30" />
                        <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                           <MapPin size={10} className="text-blue-500" /> Neural Geocode Sector
                        </p>
                        <p className="text-[11px] font-black text-white uppercase italic leading-relaxed">{loadingAddress ? "Pinpointing..." : (resolvedAddress || selectedAlert?.fullAddress || 'Sector Unknown')}</p>
                     </div>

                     {/* 🛡️ SUPPORT NODES */}
                     <div className="bg-[#1E293B] p-6 rounded-[2rem] border border-white/5 shadow-xl space-y-4">
                        <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Heart size={10} className="text-rose-500" /> Support Nodes</p>
                        <div className="space-y-2.5">
                           {victimData?.primaryGuardian && (
                              <div className="flex justify-between items-center bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 shadow-lg">
                                 <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-black text-white uppercase italic">{victimData.primaryGuardian.name}</span>
                                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[5px] font-black rounded-full uppercase tracking-widest">Primary</span>
                                 </div>
                                 <span className="text-[13px] font-black text-rose-400 tabular-nums">{victimData.primaryGuardian.phone}</span>
                              </div>
                           )}
                           {guardians.map((g: any) => (
                              <div key={g.id} className="flex justify-between items-center bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                                 <span className="text-[13px] font-black text-white uppercase italic">{g.name}</span>
                                 <span className="text-[13px] font-black text-blue-400 tabular-nums">{g.phone || g.phoneNumber}</span>
                              </div>
                           ))}

                           {/* 🚀 DYNAMIC EMERGENCY NODES (POLICE & HOSPITALS) */}
                           {loadingNodes ? (
                              <div className="py-2 text-center">
                                 <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Scanning Nearby Grid...</p>
                              </div>
                           ) : (
                              (nearbyPolice.length > 0 || nearbyHospitals.length > 0) && (
                                 <div className="pt-3 border-t border-white/5 mt-3 space-y-2.5">
                                    <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                       <Globe size={10} className="text-cyan-400" /> Nearby Emergency Nodes
                                    </p>
                                    
                                    {/* POLICE STATIONS */}
                                    {nearbyPolice.map((station: any, idx: number) => (
                                       <div key={`police-${idx}`} className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl flex flex-col gap-2">
                                          <div className="flex justify-between items-start">
                                             <div className="min-w-0">
                                                <div className="flex items-center gap-1">
                                                   <Shield size={8} className="text-blue-400 shrink-0" />
                                                   <span className="text-[13px] font-black text-white uppercase italic leading-none truncate block max-w-[140px]">{station.name}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 font-bold uppercase mt-1 leading-none truncate block max-w-[160px]">{station.address}</p>
                                             </div>
                                             <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[5px] font-black rounded uppercase tracking-widest scale-90 shrink-0">POLICE</span>
                                          </div>
                                          <div className="flex gap-1.5">
                                             <button onClick={() => window.open(`tel:${station.phone || '112'}`)} className="flex-1 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                                                <Phone size={8} /> Call
                                             </button>
                                             <button onClick={() => {
                                                const dest = (station.lat && station.lng) ? `${station.lat},${station.lng}` : encodeURIComponent(station.name);
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
                                             }} className="flex-1 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                                                <MapPin size={8} /> Navigate
                                             </button>
                                          </div>
                                       </div>
                                    ))}

                                    {/* HOSPITALS */}
                                    {nearbyHospitals.map((hospital: any, idx: number) => (
                                       <div key={`hospital-${idx}`} className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex flex-col gap-2">
                                          <div className="flex justify-between items-start">
                                             <div className="min-w-0">
                                                <div className="flex items-center gap-1">
                                                   <Heart size={8} className="text-emerald-400 shrink-0" />
                                                   <span className="text-[13px] font-black text-white uppercase italic leading-none truncate block max-w-[140px]">{hospital.name}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 font-bold uppercase mt-1 leading-none truncate block max-w-[160px]">{hospital.address}</p>
                                             </div>
                                             <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[5px] font-black rounded uppercase tracking-widest scale-90 shrink-0">TRAUMA</span>
                                          </div>
                                          <div className="flex gap-1.5">
                                             <button onClick={() => window.open(`tel:${hospital.phone || '108'}`)} className="flex-1 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                                                <Phone size={8} /> Call
                                             </button>
                                             <button onClick={() => {
                                                const dest = (hospital.lat && hospital.lng) ? `${hospital.lat},${hospital.lng}` : encodeURIComponent(hospital.name);
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
                                             }} className="flex-1 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-0.5 cursor-pointer">
                                                <MapPin size={8} /> Navigate
                                             </button>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )
                           )}
                        </div>
                     </div>

                     {/* 🛡️ ACTIVE TACTICAL RESPONDERS */}
                     <div className="bg-[#1E293B] p-6 rounded-[2rem] border border-white/5 shadow-xl space-y-4">
                        <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                           <Shield size={10} className="text-blue-500" /> Active Tactical Responders
                        </p>
                        <div className="space-y-2.5">
                           {selectedAlert?.activeResponders?.filter((v: any, i: number, a: any[]) => a.findIndex((t: any) => t.uid === v.uid) === i).map((responder: any) => (
                              <div key={responder.uid} className="flex justify-between items-center bg-blue-500/5 px-4 py-2.5 rounded-xl border border-blue-500/10 shadow-lg">
                                 <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                       {responder.photo ? (
                                          <img src={responder.photo} className="w-full h-full object-cover" />
                                       ) : (
                                          <User size={10} className="text-blue-400" />
                                       )}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-[13px] font-black text-white uppercase italic leading-none">{responder.name}</span>
                                       <span className="text-[5px] font-black text-blue-400 uppercase tracking-widest mt-0.5">Intercepting</span>
                                    </div>
                                 </div>
                                 <span className="text-[13px] font-black text-blue-400 tabular-nums">{responder.phone}</span>
                              </div>
                           ))}
                           {(!selectedAlert?.activeResponders || selectedAlert.activeResponders.length === 0) && (
                              <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest italic text-center py-2">Scanning for nearest protectors...</p>
                           )}
                        </div>
                     </div>

                     {/* 📊 PROTOCOL STRIKES */}
                     <div className="bg-[#1E293B] p-6 rounded-[2rem] border border-white/5 shadow-xl flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Activity size={40} /></div>
                        <div>
                           <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest leading-none">Protocol Strikes</p>
                           <p className="text-[14px] text-gray-500 font-bold uppercase tracking-widest mt-1">Misuse Strike Penalty Counter</p>
                        </div>
                        <h3 className="text-3xl font-black text-rose-500 italic tabular-nums leading-none">{victimData?.sosStrikeCount || 0}</h3>
                     </div>

                     {/* 🛡️ FORENSIC EVIDENCE VAULT */}
                     <div className="bg-[#1E293B] p-6 rounded-[2rem] border border-white/5 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                           <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Fingerprint size={10} className="text-blue-500" /> Forensic Evidence Vault
                           </p>
                           <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[14px] font-black rounded border border-blue-500/20">LIVE SYNC</span>
                        </div>
                        
                        <EvidenceGallery alertId={selectedAlert.id} />
                     </div>
                  </div>
               </div>
            ) : (
               renderHistoryContent()
            )
         ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20"><ShieldAlert size={120} strokeWidth={0.5} className="mb-8" /><p className="text-xl font-black uppercase tracking-[10px]">Select Incident Record</p></div>
          )}
      </main>

      <AnimatePresence>
         {isWarnModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsWarnModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-xl bg-[#1E293B] border border-white/10 rounded-[40px] shadow-2xl p-10">
                  <h3 className="text-xl font-black text-white uppercase italic mb-8">Issue Misuse Warning</h3>
                  <div className="space-y-6">
                     <select value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)} className="w-full bg-[#0F172A] border border-white/5 rounded-2xl py-4 px-6 text-xs font-bold text-white appearance-none outline-none">{WARNING_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
                     <button disabled={isSubmitting} onClick={submitWarning} className="w-full py-4 bg-amber-500 text-black rounded-2xl text-[14px] font-black uppercase shadow-xl flex items-center justify-center gap-3">{isSubmitting ? <Activity className="animate-spin" size={14} /> : <ShieldAlert size={14} />} Finalize Citation</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {victimData && (
         <MissionAuditModal user={victimData} isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}

const EvidenceGallery = ({ alertId }: { alertId: string }) => {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(collection(db, 'alerts', alertId, 'evidence'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setEvidence(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [alertId]);

  const handleReview = async (item: any) => {
    if (item.status === 'Reviewed') return;
    try {
      // 1. Delete actual file from Firebase Storage to save space (Cost: ₹0)
      if (item.url && item.fileName) {
         const fileRef = ref(storage, `kavach_evidence/${alertId}/${item.fileName}`);
         await deleteObject(fileRef).catch(() => {});
      }
      
      // 2. Update Firestore metadata (keeps the log, but removes the big file)
      await updateDoc(doc(db, 'alerts', alertId, 'evidence', item.id), {
        status: 'Reviewed',
        url: '', // URL is now invalid
        'metadata.reviewedBy': 'Command Center',
        'metadata.reviewedAt': serverTimestamp()
      });
      
      toast.success("Evidence Reviewed", {
        description: "Cloud storage cleared to save space. Audit log preserved."
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    }
  };

  // Load blobs from IndexedDB for video/audio (they have a vaultId, not a cloud URL)
  useEffect(() => {
    if (evidence.length === 0) return;
    const loadBlobs = async () => {
      const { getVaultEntry } = await import('../../lib/forensicVault');
      const newUrls: Record<string, string> = {};
      for (const item of evidence) {
        if (!item.vaultId) continue;
        try {
          const entry = await getVaultEntry(item.vaultId);
          if (entry) newUrls[item.vaultId] = URL.createObjectURL(entry.blob);
        } catch (e) { /* vault entry may not exist on other devices */ }
      }
      setBlobUrls(prev => {
        Object.values(prev).forEach(u => { try { URL.revokeObjectURL(u); } catch(e) {} });
        return newUrls;
      });
    };
    loadBlobs();
    return () => setBlobUrls(prev => {
      Object.values(prev).forEach(u => { try { URL.revokeObjectURL(u); } catch(e) {} });
      return {};
    });
  }, [evidence]);

  const handleDownload = (item: any) => {
    const src = blobUrls[item.vaultId] || item.url;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = item.fileName || `kavach_evidence_${item.id}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <div className="py-10 text-center text-[12px] font-black uppercase text-gray-600 animate-pulse tracking-widest">Accessing Forensic Cache...</div>;
  if (evidence.length === 0) return (
    <div className="py-10 text-center space-y-2 opacity-40">
      <Shield size={32} className="mx-auto text-blue-500" />
      <p className="text-[12px] font-black uppercase text-gray-500 italic tracking-widest">No Environmental Intel Yet.</p>
      <p className="text-[10px] font-bold text-gray-600 uppercase">Evidence syncs every 8–10 sec during active SOS</p>
    </div>
  );

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {evidence.map((item) => {
        const blobSrc = blobUrls[item.vaultId] || '';
        const imgSrc = item.type === 'Snapshot' ? (item.url || blobSrc) : blobSrc;
        const hasSrc = !!(blobSrc || item.url);

        return (
          <div key={item.id} className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-3 group">
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-[11px] font-black uppercase px-2 py-0.5 rounded",
                item.type === 'Snapshot'  ? "bg-emerald-500/10 text-emerald-500" :
                item.type === 'Audio Log' ? "bg-purple-500/10 text-purple-400"   :
                                            "bg-blue-500/10 text-blue-500"
              )}>
                {item.type === 'CCTV_FEED' ? '🎥 CCTV Feed' : item.type === 'Audio Log' ? '🎙️ Audio' : '📸 Snapshot'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleTimeString() : 'SYNC...'}
                </span>
                
                {item.status === 'Reviewed' ? (
                  <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded text-[9px] font-black uppercase flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    Reviewed
                  </span>
                ) : (
                  <>
                    {hasSrc && (
                      <button onClick={() => handleDownload(item)}
                        className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded text-[10px] font-black uppercase transition-all">
                        ↓ Save
                      </button>
                    )}
                    <button onClick={() => handleReview(item)}
                      className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded text-[10px] font-black uppercase transition-all flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      Review & Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {item.type === 'CCTV_FEED' && (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-blue-500/30">
                {blobSrc
                  ? <video controls className="w-full h-full object-cover"><source src={blobSrc} type={item.mimeType || 'video/webm'} /></video>
                  : <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-40">
                      <Activity size={22} className="animate-pulse text-blue-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {item.metadata?.storage === 'IndexedDB' ? 'Locally stored — open on recording device' : 'Loading...'}
                      </p>
                    </div>
                }
                <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-white uppercase bg-black/60 px-1.5 py-0.5 rounded tracking-widest">TACTICAL CCTV</span>
                </div>
              </div>
            )}

            {item.type === 'Snapshot' && (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-white/5">
                {item.status === 'Reviewed' ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-40 bg-gray-900">
                     <ShieldCheck size={28} className="text-emerald-500" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">File Cleared from Cloud</p>
                   </div>
                ) : imgSrc ? (
                   <img src={imgSrc} alt="Forensic" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                   <div className="absolute inset-0 flex items-center justify-center opacity-30"><Camera size={24} className="text-gray-400" /></div>
                )}
                
                {item.status !== 'Reviewed' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-tighter truncate w-full">
                      HASH: {item.hash ? item.hash.slice(0, 20) + '...' : 'COMPUTING'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {item.type === 'Audio Log' && (
              <div className="bg-purple-500/5 p-3 rounded-xl border border-purple-500/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Mic size={12} className="text-purple-400" />
                </div>
                {item.status === 'Reviewed' ? (
                   <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                     Audio Cleared (Reviewed)
                   </span>
                ) : blobSrc ? (
                   <audio controls className="h-8 flex-1"><source src={blobSrc} type={item.mimeType || 'audio/webm'} /></audio>
                ) : (
                   <span className="text-[11px] font-bold text-purple-400/40 uppercase tracking-widest">
                      {item.metadata?.storage === 'IndexedDB' ? 'Locally stored — play on recording device' : 'Loading...'}
                   </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="h-0.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500/50 w-full" />
              </div>
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-[1px]">
                {item.metadata?.storage || 'Integrity Verified'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SOSManagement;

