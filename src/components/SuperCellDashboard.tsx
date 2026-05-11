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
  LogOut
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
  
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, type: 'info', title: '', description: '', confirmText: '', onConfirm: () => {} });

  useEffect(() => {
    // 🛡️ RE-LINKED TO PRIMARY 'users' REGISTRY
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const statusMap: Record<string, any> = {};
      const vProts: any[] = [];
      const pProts: any[] = [];
      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        statusMap[doc.id] = data;
        if (data.role?.toLowerCase() === 'protector') {
           if (data.isVerified || data.verified) vProts.push(data);
           else pProts.push(data);
        }
      });
      setUserStatusMap(statusMap);
      setVerifiedProtectors(vProts);
      setPendingProtectors(pProts);
    });

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

    return () => { unsubscribeUsers(); unsubscribeAlerts(); unsubscribeFirs(); unsubscribeJourneys(); };
  }, []);

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
     switch(viewMode) {
        case 'COMMAND':
           return (
              <div className="flex-1 flex overflow-hidden">
                 {/* 📟 LEFT: ACTION CENTER (SOS + PENDING VETTING) */}
                 <div className="w-[300px] bg-white border-r border-gray-100 flex flex-col shrink-0 overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-rose-50/20 shrink-0">
                       <div className="flex items-center gap-2 text-rose-600">
                          <Bell size={14} />
                          <h2 className="text-[10px] font-black uppercase tracking-widest leading-none">Live SOS Briefs</h2>
                       </div>
                       <div className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full uppercase">{activeAlerts.length}</div>
                    </div>
                    <div className="max-h-[40vh] overflow-y-auto p-4 space-y-3 bg-gray-50/30 custom-scrollbar border-b border-gray-100">
                       {activeAlerts.length === 0 ? (
                          <div className="py-10 text-center opacity-20"><ShieldCheck size={30} className="mx-auto mb-2" /><p className="text-[8px] font-black uppercase tracking-widest">Grid Secure</p></div>
                       ) : activeAlerts.map(alert => (
                          <div key={alert.id} onClick={() => setSelectedAlertId(alert.id)} className={cn("p-4 rounded-[2rem] border transition-all cursor-pointer bg-white group shadow-sm", selectedAlertId === alert.id ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-100 hover:border-blue-200")}>
                             <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100"><Activity size={14} /></div>
                                   <div>
                                      <h4 className="text-[10px] font-black uppercase text-gray-900 leading-none">{alert.victimName || 'Citizen'}</h4>
                                      <p className="text-[7px] font-black text-rose-500 uppercase tracking-widest mt-1 italic">Active SOS</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>

                     <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-blue-50/20 shrink-0">
                        <div className="flex items-center gap-2 text-blue-600">
                           <Car size={14} />
                           <h2 className="text-[10px] font-black uppercase tracking-widest leading-none">Live Transit Intel</h2>
                        </div>
                        <div className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded-full uppercase">{activeJourneys.length}</div>
                     </div>
                     <div className="max-h-[30vh] overflow-y-auto p-4 space-y-3 bg-gray-50/20 custom-scrollbar border-b border-gray-100">
                        {activeJourneys.length === 0 ? (
                           <div className="py-6 text-center opacity-10"><Car size={24} className="mx-auto mb-2" /><p className="text-[8px] font-black uppercase tracking-widest">No Active Rides</p></div>
                        ) : activeJourneys.map(journey => (
                           <div key={journey.id} onClick={() => setSelectedAlertId(journey.id)} className={cn("p-4 rounded-[2rem] border transition-all cursor-pointer bg-white group shadow-sm", selectedAlertId === journey.id ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-100 hover:border-blue-200")}>
                              <div className="flex items-center gap-3">
                                 <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border", journey.status === 'emergency' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-blue-50 text-blue-600 border-blue-100")}>
                                    <Car size={14} />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <h4 className="text-[10px] font-black uppercase text-gray-900 leading-none truncate">{journey.userName || 'Citizen'}</h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                       <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest truncate">{journey.vehicleNo}</p>
                                       <div className={cn("w-1 h-1 rounded-full", journey.status === 'emergency' ? "bg-rose-500" : "bg-emerald-500")} />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>

                    <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-emerald-50/20 shrink-0">
                        <div className="flex items-center gap-2 text-emerald-600">
                           <Users size={14} />
                           <h2 className="text-[10px] font-black uppercase tracking-widest leading-none">Pending Vetting</h2>
                        </div>
                        <div className="px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-black rounded-full uppercase">{pendingProtectors.length}</div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/10 custom-scrollbar">
                        {pendingProtectors.length === 0 ? (
                           <div className="py-10 text-center opacity-10"><Users size={30} className="mx-auto mb-2" /><p className="text-[8px] font-black uppercase tracking-widest">No New Recruits</p></div>
                        ) : pendingProtectors.map(prot => (
                           <div key={prot.id} className="p-5 rounded-[2.5rem] border border-gray-100 bg-white shadow-sm group">
                              <div className="flex items-center gap-3 mb-4">
                                 <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100"><User size={18} /></div>
                                 <div className="flex-1">
                                    <h4 className="text-[11px] font-black uppercase text-gray-900 leading-none">{prot.name || 'Operative'}</h4>
                                    <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mt-1.5">{prot.protectorVetting?.occupation || 'Recruit'}</p>
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                 <button 
                                   onClick={async () => {
                                     await updateDoc(doc(db, 'users', prot.id), { isVerified: true, verified: true });
                                     toast.success(`${prot.name} Activated`);
                                   }}
                                   className="flex-1 py-3 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                                 >
                                    Approve Node
                                 </button>
                                 <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><Settings size={12} /></button>
                              </div>
                           </div>
                        ))}
                     </div>
                 </div>

                 {/* 🌍 MIDDLE: STRATEGIC MAP */}
                 <div className="flex-1 bg-[#0F172A] relative flex flex-col">
                    <CommandMap activeAlerts={activeAlerts} activeProtectors={verifiedProtectors} activeJourneys={activeJourneys} activeFirs={activeFirs} pendingProtectors={[]} selectedAlertId={selectedAlertId} onAlertClick={setSelectedAlertId} />
                 </div>

                 {/* 🛡️ RIGHT: NODES & JUSTICE */}
                 <div className="w-[380px] bg-white border-l border-gray-100 flex flex-col shrink-0 overflow-hidden">
                    <div className="flex-[1.2] flex flex-col overflow-hidden">
                       <NodesControl pendingProtectors={pendingProtectors} verifiedProtectors={verifiedProtectors} viewMode="COMMAND" />
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                       <JusticeLedger zeroFirs={activeFirs} viewMode="COMMAND" onViewFir={(fir) => setSelectedAlertId(fir.id)} />
                    </div>
                 </div>
              </div>
           );
        case 'SOS':
           return <SOSManagement />;
        case 'PROTECTORS':
           return (
             <ProtectorManagement 
               onViewReplay={(missionId) => {
                 setActiveMissionId(missionId);
                 onTabChange?.('TRACK');
               }} 
             />
           );
        case 'TRACK':
           return <ProtectorTrack activeMissionId={activeMissionId} onClearMission={() => setActiveMissionId(null)} />;
        case 'DATA':
           return <KavachDirectory womenUsers={Object.values(userStatusMap).filter(u => u.role?.toLowerCase() === 'citizen')} protectors={verifiedProtectors} selectedState="National" />;
        case 'CHAT':
           return <TacticalComms />;
        case 'TRANSIT':
           return <TransitTrack />;
        case 'GUIDES':
           return <WomenSafetyOPS activeAlerts={activeAlerts} onAlertClick={(id) => setSelectedAlertId(id)} />;
        case 'MAP':
           return <div className="flex-1 bg-[#0F172A] rounded-[40px] overflow-hidden m-8"><CommandMap activeAlerts={activeAlerts} activeProtectors={verifiedProtectors} activeJourneys={activeJourneys} activeFirs={activeFirs} pendingProtectors={[]} selectedAlertId={selectedAlertId} /></div>;
        case 'SETTINGS':
           return <StateNexusCommand />;
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
          <NavItem id="DATA" label="Data" icon={BarChart3} />
          <NavItem id="GUIDES" label="Guides" icon={BookOpen} />
          <NavItem id="SETTINGS" label="Settings" icon={Settings} />
        </div>
        <div className="py-4 border-t border-gray-50">
          <button 
            onClick={async () => {
              const { auth } = await import('../firebase');
              const { signOut } = await import('firebase/auth');
              await signOut(auth);
              localStorage.clear();
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
        <header className="h-12 bg-white border-b border-gray-100 px-6 flex items-center justify-between z-40 shrink-0">
           <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"><Shield size={16} /></div><div><h1 className="text-[10px] font-black text-gray-900 uppercase leading-none tracking-tighter">Kavach Supercell HQ</h1><p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Sector: National</p></div></div>
           <div className="flex items-center gap-4"><div className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-gray-500">National <ChevronDown size={12} /></div></div>
        </header>
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
          <div className="flex gap-4"><button onClick={() => setModalConfig({ isOpen: false })} className="flex-1 py-4 bg-gray-100 text-gray-900 text-[10px] font-black uppercase rounded-2xl">Cancel</button><button onClick={() => config.onConfirm(inputText)} className={cn("flex-1 py-4 text-white text-[10px] font-black uppercase rounded-2xl", config.type === 'danger' ? "bg-red-600" : "bg-blue-600")}>{config.confirmText}</button></div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperCellDashboard;
