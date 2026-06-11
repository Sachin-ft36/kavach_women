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
import { IncidentRecord, UserProfile } from '../../domain/types';

// 🏛️ UHD Strategic Map
import CommandMap from '../maps/CommandMap';
import MapplsCommandMap from '../maps/MapplsCommandMap';
import { SOSHistoryPanel } from './panels/SOSHistoryPanel';
import { EvidenceViewerModal } from './EvidenceViewerModal';
import { SOSQueueSidebar } from './sos/SOSQueueSidebar';
import { SOSLiveView } from './sos/SOSLiveView';

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
  verifiedProtectors?: UserProfile[],
  activeAlerts?: IncidentRecord[],
  historicalAlerts?: IncidentRecord[],
  userStatusMap?: Record<string, UserProfile>,
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
  const [evidenceVaultAlertId, setEvidenceVaultAlertId] = useState<string | null>(null);
  const [isEvidenceViewerOpen, setIsEvidenceViewerOpen] = useState(false);
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


  return (
    <div className="h-full w-full bg-[#0F172A] flex overflow-hidden font-['Outfit'] italic">
      {/* 📟 ASIDE QUEUE */}
      <SOSQueueSidebar
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredAlerts={filteredAlerts}
        selectedAlertId={selectedAlertId}
        setSelectedAlertId={setSelectedAlertId}
        selectedVictimId={selectedVictimId}
        setSelectedVictimId={setSelectedVictimId}
        userStatusMap={userStatusMap}
      />

      {/* 🔍 MAIN CONTENT */}
      <main className="flex-1 relative flex flex-col overflow-hidden bg-[#0F172A]">
         {(selectedAlert || (sidebarTab === 'HISTORY' && selectedVictimId)) ? (
            selectedAlertId && selectedAlert ? (
               <SOSLiveView
                 selectedAlert={selectedAlert}
                 selectedAlertId={selectedAlertId}
                 victimData={victimData}
                 sidebarTab={sidebarTab}
                 setSelectedAlertId={setSelectedAlertId}
                 handleAction={handleAction}
                 setIsOverrideModalOpen={setIsOverrideModalOpen}
                 pendingAppeal={pendingAppeal}
                 handleRestoreAccess={handleRestoreAccess}
                 handlePermanentBan={handlePermanentBan}
                 loadingAddress={loadingAddress}
                 resolvedAddress={resolvedAddress}
                 guardians={guardians}
                 nearbyPolice={nearbyPolice}
                 nearbyHospitals={nearbyHospitals}
                 loadingNodes={loadingNodes}
                 setIsEvidenceViewerOpen={setIsEvidenceViewerOpen}
                 useMapboxFallback={useMapboxFallback}
                 setUseMapboxFallback={setUseMapboxFallback}
                 verifiedProtectors={verifiedProtectors}
               />
            ) : (
                <SOSHistoryPanel victimData={victimData} victimHistory={victimHistory} guardians={guardians} pendingAppeal={pendingAppeal} onViewReplay={onViewReplay} handleAction={handleAction} handleRestoreAccess={handleRestoreAccess} handlePermanentBan={handlePermanentBan} onOpenEvidence={setEvidenceVaultAlertId} setSelectedAlertId={setSelectedAlertId} />
            )
         ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20"><ShieldAlert size={120} strokeWidth={0.5} className="mb-8" /><p className="text-xl font-black uppercase tracking-[10px]">Select Incident Record</p></div>
          )}
      </main>

      <AnimatePresence>
         {isWarnModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsWarnModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-xl bg-[#1E293B]/40 border border-white/5 rounded-[2rem]  p-10">
                  <h3 className="text-xl font-black text-white uppercase  mb-8">Issue Misuse Warning</h3>
                  <div className="space-y-6">
                     <select value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)} className="w-full bg-[#0F172A] border border-white/5 rounded-xl py-4 px-6 text-xs font-bold text-white appearance-none outline-none">{WARNING_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
                     <button disabled={isSubmitting} onClick={submitWarning} className="w-full py-4 bg-amber-500 text-black rounded-xl text-[14px] font-black uppercase  flex items-center justify-center gap-3">{isSubmitting ? <Activity className="animate-spin" size={14} /> : <ShieldAlert size={14} />} Finalize Citation</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

        {(selectedAlert || evidenceVaultAlertId) && (
          <EvidenceViewerModal 
            alertId={evidenceVaultAlertId || selectedAlert?.id || ''} 
            isOpen={isEvidenceViewerOpen || !!evidenceVaultAlertId} 
            onClose={() => {
              setIsEvidenceViewerOpen(false);
              setEvidenceVaultAlertId(null);
            }} 
          />
        )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default SOSManagement;

