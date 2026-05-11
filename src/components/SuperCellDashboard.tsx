import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Users, 
  User,
  Map as MapIcon, 
  Bell, 
  Activity,
  Settings,
  Clock,
  MapPin,
  Phone,
  ShieldAlert,
  Zap,
  Cpu,
  FileText,
  AlertTriangle,
  Gavel,
  ShieldCheck,
  CheckCircle2,
  Car,
  MessageSquare,
  History,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  MessageCircle,
  Box,
  ChevronDown,
  LogOut,
  Navigation,
  Globe,
  Database,
  Layers
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// High-Fidelity Tactical Modules
import CommandMap from './maps/CommandMap';
import { TransitIntelligence } from './supercell/TransitIntelligence';
import { KavachDirectory } from './supercell/KavachDirectory';
import { TacticalComms } from './supercell/TacticalComms';
import { WomenSafetyOPS } from './supercell/WomenSafetyOPS';
import { NationalOverview } from './supercell/NationalOverview';
import { StateNexusCommand } from './supercell/StateNexusCommand';
import { TransitTrack } from './supercell/TransitTrack';
import { ProtectorTrack } from './supercell/ProtectorTrack';
import { ProtectorManagement } from './supercell/ProtectorManagement';
import { SOSManagement } from './supercell/SOSManagement';
import { NodesControl } from './supercell/NodesControl';
import { JusticeLedger } from './supercell/JusticeLedger';
import { NationalEmergencyTicker } from './supercell/NationalEmergencyTicker';
import { NeuralAnalytics } from './supercell/NeuralAnalytics';


const SuperCellDashboard = ({ viewMode = 'COMMAND', onTabChange }: { viewMode?: string, onTabChange?: (m: any) => void }) => {
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [missionHistory, setMissionHistory] = useState<any[]>([]);
  const [activeJourneys, setActiveJourneys] = useState<any[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [verifiedProtectors, setVerifiedProtectors] = useState<any[]>([]);
  const [pendingProtectors, setPendingProtectors] = useState<any[]>([]);
  const [activeFirs, setActiveFirs] = useState<any[]>([]);
  const [userStatusMap, setUserStatusMap] = useState<Record<string, any>>({});
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [isSovereignActive, setIsSovereignActive] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedSector, setSelectedSector] = useState('NATIONAL'); // 🛰️ SHARDING STATE
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 🛰️ TACTICAL SUB-VIEW
  
  const [selectedProtectorId, setSelectedProtectorId] = useState<string | null>(null);
  const [replayMissionId, setReplayMissionId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, type: 'info', title: '', description: '', confirmText: '', onConfirm: () => {} });

  const sectorButtons = [
    { id: 'NORTH', label: 'Sector North', icon: Navigation, type: 'SECTOR' },
    { id: 'SOUTH', label: 'Sector South', icon: Navigation, type: 'SECTOR' },
    { id: 'CENTRAL', label: 'Sector Central', icon: Navigation, type: 'SECTOR' }
  ];

  const stateShards = [
    { id: 'NATIONAL', label: 'National Grid', icon: Globe, type: 'NATIONAL' },
    { id: 'MP', label: 'Madhya Pradesh', icon: MapPin, type: 'STATE' },
    { id: 'DELHI', label: 'Delhi NCR', icon: MapPin, type: 'STATE' },
    { id: 'MAHARASHTRA', label: 'Maharashtra', icon: MapPin, type: 'STATE' },
    { id: 'KARNATAKA', label: 'Karnataka', icon: MapPin, type: 'STATE' },
    { id: 'UP', label: 'Uttar Pradesh', icon: MapPin, type: 'STATE' },
    { id: 'RAJASTHAN', label: 'Rajasthan', icon: MapPin, type: 'STATE' },
    { id: 'GUJARAT', label: 'Gujarat', icon: MapPin, type: 'STATE' },
    { id: 'WB', label: 'West Bengal', icon: MapPin, type: 'STATE' },
    { id: 'TN', label: 'Tamil Nadu', icon: MapPin, type: 'STATE' }
  ];

  const allShards = [...sectorButtons, ...stateShards];

  useEffect(() => {
    // 🛡️ RE-LINKED TO PRIMARY USER REGISTRIES (Unified Sync)
    const syncCollection = (collName: string) => {
      return onSnapshot(collection(db, collName), (snapshot) => {
        setUserStatusMap(prev => {
          const newMap = { ...prev };
          snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            newMap[doc.id] = data;
          });
          return newMap;
        });

        // Update lists for protectors specifically
        if (collName === 'users' || collName === 'male_users') {
          const vProts: any[] = [];
          const pProts: any[] = [];
          snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            if (data.role?.toLowerCase() === 'protector') {
               if (data.isVerified || data.verified) vProts.push(data);
               else pProts.push(data);
            }
          });
          setVerifiedProtectors(prev => [...prev.filter(p => p.role !== 'protector'), ...vProts]);
          setPendingProtectors(prev => [...prev.filter(p => p.role !== 'protector'), ...pProts]);
        }
      });
    };

    const unsubUsers = syncCollection('users');
    const unsubWomen = syncCollection('women_users');
    const unsubMales = syncCollection('male_users');

    // 🔴 RE-LINKED TO OFFICIAL 'alerts' REGISTRY
    const unsubscribeAlerts = onSnapshot(query(collection(db, 'alerts'), orderBy('timestamp', 'desc')), (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setActiveAlerts(alerts.filter(a => ['active', 'Active', 'ACTIVE', 'responding', 'Responding'].includes(a.status)));
      setMissionHistory(alerts.filter(a => !['active', 'Active', 'ACTIVE', 'responding', 'Responding'].includes(a.status)));
    });

    // 🏛️ JUSTICE LEDGER SYNC
    const unsubscribeFirs = onSnapshot(query(collection(db, 'firs'), orderBy('timestamp', 'desc')), (snapshot) => {
       setActiveFirs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeJourneys = onSnapshot(query(collection(db, 'journeys'), where('status', 'in', ['active', 'emergency'])), (snapshot) => {
      setActiveJourneys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubUsers(); unsubWomen(); unsubMales(); unsubscribeAlerts(); unsubscribeFirs(); unsubscribeJourneys(); };
  }, []);

   // 🛰️ STRATEGIC SHARD MAPPING (State -> Sector Bridge)
   const sectorMap: Record<string, string> = {
     'MP': 'CENTRAL', 'MADHYA PRADESH': 'CENTRAL', 'CHHATTISGARH': 'CENTRAL',
     'DELHI': 'NORTH', 'NCR': 'NORTH', 'UP': 'NORTH', 'UTTAR PRADESH': 'NORTH', 'RAJASTHAN': 'NORTH', 'PUNJAB': 'NORTH', 'HARYANA': 'NORTH',
     'KARNATAKA': 'SOUTH', 'TAMIL NADU': 'SOUTH', 'TN': 'SOUTH', 'KERALA': 'SOUTH', 'AP': 'SOUTH', 'TELANGANA': 'SOUTH',
     'MAHARASHTRA': 'WEST', 'GUJARAT': 'WEST', 'GOA': 'WEST',
     'WB': 'EAST', 'WEST BENGAL': 'EAST', 'BIHAR': 'EAST', 'ODISHA': 'EAST'
   };

   // 🛰️ INTELLIGENT SHARD FILTERING
   const filterByShard = (item: any) => {
     if (selectedSector === 'NATIONAL') return true;
     const shard = allShards.find(s => s.id === selectedSector);
     if (!shard) return true;

     // 📡 EXTRACT TELEMETRY
     const itemSector = (item.sector || '').toUpperCase();
     const itemState = (item.state || '').toUpperCase();
     const fullLoc = (item.locationName || item.fullAddress || item.address || '').toUpperCase();

     // 🛡️ LOGIC A: DIRECT SECTOR MATCH
     if (shard.type === 'SECTOR') {
       if (itemSector === shard.id) return true;
       // Auto-bridge: If item is in a state belonging to this sector
       if (sectorMap[itemState] === shard.id) return true;
       // Fuzzy scan: If location name contains state keywords for this sector
       const isStateInSector = Object.entries(sectorMap).some(([state, sec]) => 
         sec === shard.id && (fullLoc.includes(state) || itemState.includes(state))
       );
       return isStateInSector;
     }

     // 🛡️ LOGIC B: SPECIFIC STATE MATCH
     if (shard.type === 'STATE') {
       if (itemState === shard.id || itemState === shard.label.toUpperCase()) return true;
       // Fuzzy scan for state name in location address
       return fullLoc.includes(shard.label.toUpperCase()) || fullLoc.includes(shard.id);
     }
     
     return itemSector === selectedSector || itemState === selectedSector;
   };

   const filteredAlerts = activeAlerts.filter(filterByShard);
   const filteredJourneys = activeJourneys.filter(filterByShard);
   const filteredProtectors = verifiedProtectors.filter(filterByShard);
   const filteredPending = pendingProtectors.filter(filterByShard);

  const NavItem = ({ id, label, icon: Icon }: any) => {
    const isActive = viewMode === id;
    return (
      <button onClick={() => onTabChange?.(id)} className={cn("w-full flex flex-col items-center py-5 px-1 transition-all duration-200 relative group", isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50")}>
        <Icon size={20} className={cn("mb-1.5", isActive && "scale-110")} />
        <span className="text-[6px] font-black uppercase tracking-[1px] text-center leading-none">{label}</span>
        {isActive && <motion.div layoutId="navIndicator" className="absolute left-0 top-0 bottom-0 w-[3px] bg-white" />}
      </button>
    );
  };

  const renderContent = () => {
    const handleApproveProtector = async (userId: string) => {
      try {
        await updateDoc(doc(db, 'users', userId), {
          isVerified: true,
          verified: true,
          verificationDate: new Date()
        });
        toast.success('Protector Verified Successfully');
      } catch (error) {
        console.error('Approval Error:', error);
        toast.error('Failed to verify protector');
      }
    };

    switch(viewMode) {
      case 'COMMAND':
        return (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === 'DASHBOARD' && (
              <NationalOverview 
                activeAlerts={activeAlerts} // Show all, no shard
                verifiedProtectors={verifiedProtectors} // Show all, no shard
                pendingProtectors={pendingProtectors} // Show all, no shard
                zeroFirs={activeFirs}
                selectedState="NATIONAL"
                isSovereignActive={isSovereignActive}
                onNavigate={(tab, alertId) => {
                  if (alertId) setSelectedAlertId(alertId);
                  const viewMap: Record<string, string> = {
                    'ALERTS': 'SOS',
                    'SAFETY': 'SOS',
                    'REPORTS': 'DATA',
                    'FIR': 'FIR',
                    'PROTECTORS': 'PROTECTORS'
                  };
                  const targetTab = viewMap[tab] || tab;
                  if (targetTab === 'PROTECTORS' && alertId) setSelectedProtectorId(alertId);
                  
                  // 🚀 GLOBAL REDIRECTION
                  onTabChange?.(targetTab);
                }}
                onApproveProtector={handleApproveProtector}
                onDispatchSpecial={async (alertId, protectorIds) => {
                  try {
                    const alertRef = doc(db, 'alerts', alertId);
                    await updateDoc(alertRef, {
                      status: 'responding',
                      dispatchedAt: new Date(),
                      activeResponders: protectorIds.map(pid => ({
                        id: pid,
                        status: 'dispatched',
                        timestamp: new Date()
                      }))
                    });
                    toast.success(`Special Force Dispatched to ${protectorIds.length} Nodes`);
                  } catch (error) {
                    console.error('Dispatch Error:', error);
                    toast.error('Tactical Dispatch Failed');
                  }
                }}
              />
            )}
          </div>
        );
      case 'SOS':
        return (
          <SOSManagement 
            externalSelectedId={selectedAlertId} 
            verifiedProtectors={verifiedProtectors} 
            activeAlerts={activeAlerts}
            historicalAlerts={missionHistory}
            userStatusMap={userStatusMap}
          />
        );
      case 'FIR':
        return <JusticeLedger zeroFirs={activeFirs} viewMode="JUSTICE" onViewFir={() => {}} userStatusMap={userStatusMap} />;
      case 'PROTECTORS':
        return (
          <ProtectorManagement 
            externalSelectedId={selectedProtectorId} 
            onViewReplay={(id) => { setReplayMissionId(id); setActiveTab('REPLAY'); }} 
            verifiedProtectors={filteredProtectors} 
            pendingProtectors={filteredPending} 
            userStatusMap={userStatusMap}
          />
        );
      case 'TRACK':
        return (
          <ProtectorTrack 
            activeMissionId={activeMissionId} 
            onClearMission={() => setActiveMissionId(null)} 
            isSovereignActive={isSovereignActive} 
            userStatusMap={userStatusMap}
          />
        );
      case 'DATA':
        return <KavachDirectory womenUsers={Object.values(userStatusMap).filter(u => u.role?.toLowerCase() === 'citizen')} protectors={filteredProtectors} selectedState={selectedSector} isSovereignActive={isSovereignActive} />;
      case 'ANALYTICS':
        return (
          <NeuralAnalytics 
            activeAlerts={filteredAlerts}
            activeJourneys={filteredJourneys}
            verifiedProtectors={filteredProtectors}
            justiceLedger={activeFirs}
          />
        );
      case 'CHAT':
        return <TacticalComms />;
      case 'TRANSIT':
        return (
          <TransitIntelligence 
            journeys={filteredJourneys} 
            onJourneyClick={(id) => setSelectedAlertId(id)} 
            userStatusMap={userStatusMap}
          />
        );
      case 'GUIDES':
        return <WomenSafetyOPS activeAlerts={filteredAlerts} onAlertClick={(id) => setSelectedAlertId(id)} />;
      case 'MAP':
        return (
          <div className="flex-1 bg-[#0F172A] rounded-[40px] overflow-hidden m-8">
            <CommandMap 
              activeAlerts={filteredAlerts} 
              activeProtectors={filteredProtectors} 
              activeJourneys={filteredJourneys} 
              activeFirs={activeFirs} 
              pendingProtectors={[]} 
              selectedAlertId={selectedAlertId}
              isSovereignActive={isSovereignActive}
              showHeatmap={showHeatmap}
            />
          </div>
        );
      case 'SETTINGS':
        return (
          <StateNexusCommand 
            selectedState={selectedSector}
            womenUsers={Object.values(userStatusMap).filter(u => u.role?.toLowerCase() === 'citizen')}
            verifiedProtectors={filteredProtectors}
            pendingProtectors={filteredPending}
            activeAlerts={filteredAlerts}
            zeroFirs={activeFirs}
            onAlertClick={(id) => setSelectedAlertId(id)}
            onViewFir={(fir) => {
              setSelectedAlertId(fir.id);
              // Handle FIR navigation if needed
            }}
            isSovereignActive={isSovereignActive}
            userStatusMap={userStatusMap}
          />
        );
      default:
        return <div className="flex-1 flex flex-col items-center justify-center opacity-20"><History size={80} className="mb-6" /><p className="text-sm font-black uppercase tracking-[5px]">Module Linked - Scanning...</p></div>;
    }
  };

  return (
    <div className="fixed inset-0 flex bg-white font-['Outfit'] overflow-hidden">
      <TacticalModal config={modalConfig} setModalConfig={setModalConfig} />
      <nav className="w-[70px] bg-white border-r border-gray-100 flex flex-col h-full z-50 shrink-0">
        <div className="p-4 flex justify-center border-b border-gray-50"><div className="w-8 h-8 rounded-lg bg-white border border-blue-600 flex items-center justify-center text-blue-600"><Shield size={18} strokeWidth={2.5} /></div></div>
        <div className="flex-1 py-2 overflow-y-auto scrollbar-hide">
          <NavItem id="COMMAND" label="Dashboard" icon={LayoutDashboard} />
          <NavItem id="SOS" label="SOS Alerts" icon={Bell} />
          <NavItem id="FIR" label="FIR Reports" icon={FileText} />
          <NavItem id="PROTECTORS" label="Protectors" icon={Users} />
          <NavItem id="TRACK" label="3D Track" icon={Box} />
          <NavItem id="TRANSIT" label="Transit Intel" icon={Car} />
          <NavItem id="CHAT" label="Chat" icon={MessageCircle} />
          <NavItem id="ANALYTICS" label="Neural Pulse" icon={BarChart3} />
          <NavItem id="DATA" label="Directory" icon={Database} />
          <NavItem id="GUIDES" label="Guides" icon={BookOpen} />
           <NavItem id="SETTINGS" label="Settings" icon={Settings} />

        </div>
        <div className="py-4 border-t border-gray-50">
          <button 
            onClick={async () => {
              const { auth } = await import('../firebase');
              const { signOut } = await import('firebase/auth');
              await signOut(auth);
              localStorage.clear(); // 🏛️ SYSTEM WIPE: AUTHORIZED
              window.location.reload();
            }}
            className="w-full flex flex-col items-center py-5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200 group"
          >
            <LogOut size={20} className="mb-1.5 group-hover:scale-110" />
            <span className="text-[6px] font-black uppercase tracking-[1px] text-center leading-none">Log Out</span>
          </button>
        </div>
      </nav>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between z-40 shrink-0">
           {/* 🏛️ SOVEREIGN COMMAND HEADER: AUTHORIZED PERSONNEL ONLY */}
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                    <Shield size={20} strokeWidth={2.5} />
                 </div>
                 <div>
                    <h1 className="text-[11px] font-black text-gray-900 uppercase leading-none tracking-tighter">Kavach Supercell HQ</h1>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Sector: {allShards.find(s => s.id === selectedSector)?.label || 'National'} Command Grid</p>
                 </div>
              </div>

              <div className="h-8 w-[1px] bg-gray-100 mx-6" />

              {/* 🛰️ DIRECT SECTOR BUTTONS */}
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
                 {sectorButtons.map((shard) => (
                    <button 
                      key={shard.id}
                      onClick={() => setSelectedSector(shard.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                        selectedSector === shard.id ? "bg-white text-blue-600 shadow-sm border border-blue-100" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                       <shard.icon size={12} />
                       {shard.label}
                    </button>
                 ))}
              </div>

              <div className="h-8 w-[1px] bg-gray-100 mx-2" />

              {/* 🛰️ STATE NEXUS DROPDOWN (National Grid + States) */}
              <div className="relative group">
                 <button className={cn(
                   "px-5 py-2.5 border rounded-2xl flex items-center gap-3 shadow-sm transition-all group/btn",
                   stateShards.some(s => s.id === selectedSector) 
                     ? "bg-blue-600 border-blue-500 text-white shadow-blue-600/20" 
                     : "bg-gray-50 border-gray-100 text-[#0F172A] hover:border-blue-200"
                 )}>
                    {selectedSector === 'NATIONAL' ? <div className="w-2 h-2 bg-emerald-500 rounded-full" /> : <MapPin size={12} />}
                    <span className="text-[10px] font-black uppercase tracking-[3px]">
                       {stateShards.find(s => s.id === selectedSector)?.label || 'National Grid'}
                    </span>
                    <ChevronDown size={14} className={cn("transition-transform duration-300 group-hover/btn:rotate-180", stateShards.some(s => s.id === selectedSector) ? "text-white/60" : "text-gray-400")} />
                 </button>

                 <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] overflow-hidden">
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-3">
                       <div className="px-6 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-2">State Strategic Shards</div>
                       {stateShards.map(s => (
                          <button 
                            key={s.id} 
                            onClick={() => setSelectedSector(s.id)} 
                            className={cn(
                              "w-full px-5 py-3.5 flex items-center justify-between rounded-2xl transition-all group/item",
                              selectedSector === s.id ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "hover:bg-gray-50 text-gray-600"
                            )}
                          >
                             <div className="flex items-center gap-4">
                                <s.icon size={16} className={cn(selectedSector === s.id ? "text-white" : "text-gray-400 group-hover/item:text-blue-500")} />
                                <div className="text-left">
                                   <span className="text-[9px] font-black uppercase tracking-widest block leading-none">{s.label}</span>
                                   <span className={cn("text-[6px] font-bold uppercase mt-1 block", selectedSector === s.id ? "text-white/60" : "text-gray-400")}>{s.type} CONTROL</span>
                                </div>
                             </div>
                             {selectedSector === s.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              {/* 🛰️ TACTICAL CONTROL CLUSTER */}
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-[20px] border border-gray-100">
                 <button 
                   onClick={() => setShowHeatmap(!showHeatmap)}
                   className={cn(
                     "px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                     showHeatmap ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-400 hover:text-gray-600"
                   )}
                 >
                    <Activity size={12} />
                    Neural Load
                 </button>
                 <button 
                   onClick={() => {
                     if (!isSovereignActive) {
                       setModalConfig({
                         isOpen: true,
                         type: 'danger',
                         title: 'Sovereign Override',
                         description: 'Initiating National Tactical Lockout. This protocol overrides all regional dispatch systems. Confirm authorization?',
                         confirmText: 'Execute Lockout',
                         onConfirm: () => {
                           setIsSovereignActive(true);
                           setModalConfig({ isOpen: false });
                           toast.error("NATIONAL GRID LOCKOUT ACTIVE", {
                             description: "Protocol 00-X initiated. Regional nodes bypassed.",
                             duration: 5000
                           });
                         }
                       });
                     } else {
                       setIsSovereignActive(false);
                       toast.success("Sovereign Control Restored", {
                         description: "National grid back to standard ops."
                       });
                     }
                   }}
                   className={cn(
                     "px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                     isSovereignActive ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20" : "text-gray-400 hover:text-gray-600"
                   )}
                 >
                    <ShieldAlert size={12} />
                    Override
                 </button>
              </div>

              <div className="h-8 w-[1px] bg-gray-100 mx-2" />
           </div>
        </header>
        <NationalEmergencyTicker isActive={isSovereignActive} gridNodeCount={verifiedProtectors.length + filteredAlerts.length} />
        {renderContent()}
      </div>
    </div>
  );
};

const TacticalModal = ({ config, setModalConfig }: any) => {
  const [inputText, setInputText] = useState("");
  if (!config.isOpen) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 backdrop-blur-xl bg-black/40">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
        <div className={cn("h-2", config.type === 'danger' ? "bg-red-600" : config.type === 'warning' ? "bg-yellow-500" : "bg-blue-600")} />
        <div className="p-10 text-center"><h3 className="text-xl font-black text-gray-900 uppercase mb-2">{config.title}</h3><p className="text-gray-400 text-[10px] font-bold uppercase mb-8">{config.description}</p>
          {config.showInput && (<select value={inputText} onChange={(e) => setInputText(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-bold mb-8 outline-none"><option value="">Select Reason...</option>{config.selectOptions?.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}</select>)}
          <div className="flex gap-4"><button onClick={() => setModalConfig({ isOpen: false })} className="flex-1 py-4 bg-gray-100 text-gray-900 text-[10px] font-black uppercase rounded-2xl">Cancel</button><button onClick={() => config.onConfirm(inputText)} className={cn("flex-1 py-4 text-white text-[10px] font-black uppercase rounded-2xl", config.type === 'danger' ? "bg-red-600" : config.type === 'warning' ? "bg-yellow-500" : "bg-blue-600")}>{config.confirmText}</button></div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperCellDashboard;
