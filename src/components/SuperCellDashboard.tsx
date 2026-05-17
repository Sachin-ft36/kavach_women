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
import { JusticeBlockModal } from './supercell/JusticeBlockModal';
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
import { BanAppeals } from './supercell/BanAppeals';


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
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 🛰️ TACTICAL SUB-VIEW
  
  const [selectedProtectorId, setSelectedProtectorId] = useState<string | null>(null);
  const [selectedFir, setSelectedFir] = useState<any>(null);
  const [isFirModalOpen, setIsFirModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, type: 'info', title: '', description: '', confirmText: '', onConfirm: () => {} });
  
  // 🛰️ STRATEGIC INTELLIGENCE LEDGER (Notifications)
  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem('kavach_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const playBeep = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.3;
      audio.play();
    } catch (e) { console.error('Audio fail', e); }
  };

  const addNotification = (type: string, title: string, description: string, data?: any) => {
    const newNotif = {
      id: Date.now(),
      type,
      title,
      description,
      timestamp: new Date(),
      data
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 50);
      localStorage.setItem('kavach_notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => prev + 1);
    playBeep();

    // 🚀 AUTO-EXPAND FOR CRITICAL INTEL
    if (type === 'SOS') {
      setIsLedgerOpen(true);
    }
  };

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
        if (collName === 'users' || collName === 'male_users' || collName === 'women_users') {
          const vProts: any[] = [];
          const pProts: any[] = [];
          snapshot.forEach(doc => {
            const data = { id: doc.id, ...(doc.data() as any), originCollection: collName };
            if (data.role?.toLowerCase() === 'protector') {
               if (data.isVerified || data.verified) vProts.push(data);
               else pProts.push(data);
            }
          });
          
          setVerifiedProtectors(prev => {
            const combined = [...prev.filter(p => p.originCollection !== collName), ...vProts];
            // 🛡️ DEDUPLICATE BY ID
            const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
            return unique;
          });
          setPendingProtectors(prev => {
            const combined = [...prev.filter(p => p.originCollection !== collName), ...pProts];
            // 🛡️ DEDUPLICATE BY ID
            const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
            return unique;
          });
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

    // 🏛️ JUSTICE LEDGER SYNC (Unified to zero_firs)
    const unsubscribeFirs = onSnapshot(query(collection(db, 'zero_firs'), orderBy('timestamp', 'desc')), (snapshot) => {
       setActiveFirs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubJourneys = onSnapshot(query(collection(db, 'journeys'), where('status', 'in', ['active', 'emergency'])), (snapshot) => {
      setActiveJourneys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubUsers(); unsubWomen(); unsubMales(); unsubscribeAlerts(); unsubscribeFirs(); unsubJourneys(); };
  }, []);

  // 🛰️ NOTIFICATION OBSERVERS
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('kavach_notified_ids');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    let hasChanges = false;
    const newIds = new Set(notifiedIds);

    // SOS Alerts
    activeAlerts.forEach(alert => {
      if (!newIds.has(alert.id)) {
        addNotification('SOS', 'CRITICAL SOS ALERT', `Victim at ${alert.address || 'Unknown Location'} needs immediate dispatch.`, alert);
        newIds.add(alert.id);
        hasChanges = true;
      }
    });

    // Safe Journey Alerts (Emergency)
    activeJourneys.filter(j => j.status === 'emergency').forEach(journey => {
      if (!newIds.has(journey.id)) {
        addNotification('JOURNEY', 'TRANSIT EMERGENCY', `Safe Journey intercept protocol triggered for user ${journey.userId}.`, journey);
        newIds.add(journey.id);
        hasChanges = true;
      }
    });

    // FIR Notifications
    activeFirs.forEach(fir => {
      if (!newIds.has(fir.id)) {
        addNotification('FIR', 'LEGAL FILING', `New FIR filed: Case ID ${fir.caseId || fir.id.slice(0, 8).toUpperCase()}.`, fir);
        newIds.add(fir.id);
        hasChanges = true;
      }
    });

    // Protector Vetting
    pendingProtectors.forEach(prot => {
      if (!newIds.has(prot.id)) {
        addNotification('VETTING', 'PROTECTOR PENDING', `${prot.name || 'Operative'} is awaiting credentials verification.`, prot);
        newIds.add(prot.id);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setNotifiedIds(newIds);
      localStorage.setItem('kavach_notified_ids', JSON.stringify(Array.from(newIds)));
    }
  }, [activeAlerts, activeJourneys, activeFirs, pendingProtectors]);

   // 🛰️ STRATEGIC SHARD MAPPING (State -> Sector Bridge)
   const sectorMap: Record<string, string> = {
     'MP': 'CENTRAL', 'MADHYA PRADESH': 'CENTRAL', 'CHHATTISGARH': 'CENTRAL',
     'DELHI': 'NORTH', 'NCR': 'NORTH', 'UP': 'NORTH', 'UTTAR PRADESH': 'NORTH', 'RAJASTHAN': 'NORTH', 'PUNJAB': 'NORTH', 'HARYANA': 'NORTH',
     'KARNATAKA': 'SOUTH', 'TAMIL NADU': 'SOUTH', 'TN': 'SOUTH', 'KERALA': 'SOUTH', 'AP': 'SOUTH', 'TELANGANA': 'SOUTH',
     'MAHARASHTRA': 'WEST', 'GUJARAT': 'WEST', 'GOA': 'WEST',
     'WB': 'EAST', 'WEST BENGAL': 'EAST', 'BIHAR': 'EAST', 'ODISHA': 'EAST'
   };

    const handleApproveProtector = async (userId: string) => {
      try {
        const protector = [...pendingProtectors, ...verifiedProtectors].find(p => p.id === userId);
        const coll = protector?.originCollection || 'users';
        
        await updateDoc(doc(db, coll, userId), {
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

  const NavItem = ({ id, label, icon: Icon }: any) => {
    const isActive = viewMode === id;
    return (
      <button onClick={() => onTabChange?.(id)} className={cn("w-full flex flex-col items-center py-2 px-1 transition-all duration-200 relative group", isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50")}>
        <Icon size={18} className={cn("mb-1", isActive && "scale-110")} />
        <span className="text-[5.5px] font-black uppercase tracking-[0.5px] text-center leading-none">{label}</span>
        {isActive && <motion.div layoutId="navIndicator" className="absolute left-0 top-0 bottom-0 w-[2px] bg-white" />}
      </button>
    );
  };

  const renderContent = () => {

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
            onViewReplay={(alertId) => {
               setActiveMissionId(alertId);
               onTabChange?.('TRACK');
            }}
          />
        );
      case 'FIR':
        return (
          <JusticeLedger 
            zeroFirs={activeFirs} 
            viewMode="JUSTICE" 
            onViewFir={(fir) => {
              setSelectedFir(fir);
              setIsFirModalOpen(true);
            }} 
            userStatusMap={userStatusMap} 
          />
        );
      case 'PROTECTORS':
        return (
          <ProtectorManagement 
            externalSelectedId={selectedProtectorId} 
            onViewReplay={(id) => { setActiveMissionId(id); onTabChange?.('TRACK'); }} 
            verifiedProtectors={verifiedProtectors} 
            pendingProtectors={pendingProtectors} 
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
        return <KavachDirectory womenUsers={Object.values(userStatusMap).filter(u => u.role?.toLowerCase() === 'citizen')} protectors={verifiedProtectors} selectedState="NATIONAL" isSovereignActive={isSovereignActive} />;
      case 'ANALYTICS':
        return (
          <NeuralAnalytics 
            activeAlerts={activeAlerts}
            activeJourneys={activeJourneys}
            verifiedProtectors={verifiedProtectors}
            justiceLedger={activeFirs}
          />
        );
      case 'CHAT':
        return <TacticalComms />;
      case 'TRANSIT':
        return (
          <TransitIntelligence 
            journeys={activeJourneys} 
            onJourneyClick={(id) => setSelectedAlertId(id)} 
            onNavigate={(tab) => onTabChange?.(tab)}
            userStatusMap={userStatusMap}
          />
        );
      case 'GUIDES':
        return <WomenSafetyOPS activeAlerts={activeAlerts} onAlertClick={(id) => setSelectedAlertId(id)} />;
      case 'MAP':
        return (
          <div className="flex-1 bg-[#0F172A] rounded-[40px] overflow-hidden m-8">
            <CommandMap 
              activeAlerts={activeAlerts} 
              activeProtectors={verifiedProtectors} 
              activeJourneys={activeJourneys} 
              activeFirs={activeFirs} 
              pendingProtectors={[]} 
              selectedAlertId={selectedAlertId}
              isSovereignActive={isSovereignActive}
              showHeatmap={showHeatmap}
            />
          </div>
        );
      case 'APPEALS':
        return <BanAppeals />;
      case 'SETTINGS':
        return (
          <StateNexusCommand 
            selectedState="NATIONAL"
            womenUsers={Object.values(userStatusMap).filter(u => u.role?.toLowerCase() === 'citizen')}
            verifiedProtectors={verifiedProtectors}
            pendingProtectors={pendingProtectors}
            activeAlerts={activeAlerts}
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
    <div className="relative w-full h-screen flex bg-white font-['Outfit'] overflow-hidden max-h-screen">
      <TacticalModal config={modalConfig} setModalConfig={setModalConfig} />
      <nav className="w-[70px] bg-white border-r border-gray-100 flex flex-col h-full z-50 shrink-0">
        <div className="p-3 flex justify-center border-b border-gray-50"><div className="w-8 h-8 rounded-lg bg-white border border-blue-600 flex items-center justify-center text-blue-600"><Shield size={18} strokeWidth={2.5} /></div></div>
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
          <NavItem id="APPEALS" label="Appeals" icon={Gavel} />
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
            className="w-full flex flex-col items-center py-4 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200 group"
          >
            <LogOut size={20} className="mb-1.5 group-hover:scale-110" />
            <span className="text-[6px] font-black uppercase tracking-[1px] text-center leading-none">Log Out</span>
          </button>
        </div>
      </nav>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between z-40 shrink-0">
           {/* 🏛️ SOVEREIGN COMMAND HEADER: AUTHORIZED PERSONNEL ONLY */}
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                    <Shield size={16} strokeWidth={2.5} />
                 </div>
                 <div>
                    <h1 className="text-[10px] font-black text-gray-900 uppercase leading-none tracking-tighter italic">Kavach Supercell HQ</h1>
                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-[0.1em] mt-1">National Command Grid</p>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              {/* 🛰️ STRATEGIC INTELLIGENCE LEDGER (THE BOOK) */}
              <div className="relative">
                 <button 
                   onClick={() => {
                     setIsLedgerOpen(!isLedgerOpen);
                     setUnreadCount(0);
                   }}
                   className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative group",
                     isLedgerOpen ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-gray-50 text-gray-400 hover:text-blue-600 border border-gray-100"
                   )}
                 >
                    <Bell size={20} className={cn(unreadCount > 0 && "animate-bounce")} />
                    {unreadCount > 0 && (
                       <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                          {unreadCount}
                       </span>
                    )}
                 </button>

                 <AnimatePresence>
                    {isLedgerOpen && (
                       <motion.div 
                         initial={{ opacity: 0, y: 20, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 20, scale: 0.95 }}
                         className="absolute top-full right-0 mt-4 w-[400px] bg-white border border-gray-100 rounded-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] z-[100] overflow-hidden"
                       >
                          <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <BookOpen size={18} className="text-blue-600" />
                                <h3 className="text-[10px] font-black uppercase tracking-[2px] text-gray-900">Intelligence Ledger</h3>
                             </div>
                             <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{notifications.length} Records</span>
                          </div>
                          
                          <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2">
                             {notifications.length === 0 ? (
                                <div className="py-20 text-center opacity-20">
                                   <History size={40} className="mx-auto mb-4" />
                                   <p className="text-[10px] font-black uppercase tracking-widest">No New Intel</p>
                                </div>
                             ) : (
                                <div className="flex flex-col gap-1">
                                   {notifications.map((n) => (
                                       <div 
                                         key={n.id} 
                                         onClick={() => {
                                           // 🚀 TACTICAL REDIRECT
                                           const tabMap: Record<string, any> = {
                                             'SOS': 'SOS',
                                             'JOURNEY': 'ANALYTICS',
                                             'FIR': 'FIR',
                                             'VETTING': 'DATA'
                                           };
                                           const targetTab = tabMap[n.type] || 'COMMAND';
                                           onTabChange(targetTab);
                                           
                                           // 🧹 AUTO-DISMISS
                                           setNotifications(prev => prev.filter(item => item.id !== n.id));
                                           setIsLedgerOpen(false);
                                         }}
                                         className="p-4 rounded-2xl hover:bg-gray-50 transition-all group/item border border-transparent hover:border-gray-100 cursor-pointer active:scale-[0.98]"
                                       >
                                          <div className="flex items-start gap-4">
                                             <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                n.type === 'SOS' ? "bg-rose-50 text-rose-600" : 
                                                n.type === 'JOURNEY' ? "bg-amber-50 text-amber-600" : 
                                                n.type === 'FIR' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                             )}>
                                                {n.type === 'SOS' ? <ShieldAlert size={14} /> : n.type === 'JOURNEY' ? <Car size={14} /> : n.type === 'FIR' ? <Gavel size={14} /> : <Users size={14} />}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                   <span className={cn("text-[9px] font-black uppercase tracking-wider", 
                                                      n.type === 'SOS' ? "text-rose-600" : 
                                                      n.type === 'JOURNEY' ? "text-amber-600" : 
                                                      n.type === 'FIR' ? "text-emerald-600" : "text-blue-600"
                                                   )}>{n.title}</span>
                                                   <span className="text-[7px] font-bold text-gray-400">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-600 leading-relaxed truncate">{n.description}</p>
                                                
                                                {/* 🏛️ DIRECT ACTIONS */}
                                                {n.type === 'VETTING' && (
                                                   <div className="mt-3 flex gap-2">
                                                      <div className="px-3 py-1.5 bg-blue-600 text-white text-[8px] font-black uppercase rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                                                         Verify Credentials
                                                      </div>
                                                   </div>
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                </div>
                             )}
                          </div>
                          <button 
                            onClick={() => setNotifications([])}
                            className="w-full py-4 bg-gray-50 text-[8px] font-black uppercase tracking-[2px] text-gray-400 hover:text-rose-600 transition-colors border-t border-gray-100"
                          >
                             Purge Intelligence Log
                          </button>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              <div className="h-8 w-[1px] bg-gray-100 mx-2" />

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
        <NationalEmergencyTicker isActive={isSovereignActive} gridNodeCount={verifiedProtectors.length + activeAlerts.length} />
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {renderContent()}
        </main>
      </div>
      <JusticeBlockModal 
        fir={selectedFir} 
        isOpen={isFirModalOpen} 
        onClose={() => {
          setIsFirModalOpen(false);
          setSelectedFir(null);
        }} 
      />
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
