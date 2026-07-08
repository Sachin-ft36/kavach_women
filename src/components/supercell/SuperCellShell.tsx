import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { History } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { useKavachStore } from '../../state/useKavachStore';
import { db, auth } from '../../firebase';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { ZeroFIRRecord } from '../../state/slices/types';

// Tactical Modules
import KavachMap from '../maps/KavachMap';
import { SuperCellSidebar } from './SuperCellSidebar';
import { SuperCellHeader } from './SuperCellHeader';
import { JusticeBlockModal } from './JusticeBlockModal';
import { NationalOverview } from './NationalOverview';
import { StateNexusCommand } from './StateNexusCommand';
import { TransitTrack } from './TransitTrack';
import { ProtectorTrack } from './ProtectorTrack';
import { ProtectorManagement } from './ProtectorManagement';
import { SOSManagement } from './SOSManagement';
import { NationalEmergencyTicker } from './NationalEmergencyTicker';
import { NeuralAnalytics } from './NeuralAnalytics';
import { BanAppeals } from './BanAppeals';
import { VettingDesk } from './VettingDesk';
import { JusticeLedger } from './JusticeLedger';
import { KavachDirectory } from './KavachDirectory';
import { TacticalComms } from './TacticalComms';
import { WomenSafetyOPS } from './WomenSafetyOPS';
import { ShiftLogs } from './ShiftLogs';
import { ProtectorReportsLedger } from './ProtectorReportsLedger';

// Hooks
import { useSuperCellData } from '../../hooks/useSuperCellData';
import { useStateFilter } from '../../hooks/useSuperCellStateFilter';
import { useSuperCellNotifications } from '../../hooks/useSuperCellNotifications';

const INDIAN_STATES_AND_UTS = [
  'Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar',
  'Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka',
  'Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya',
  'Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'
];

const getStateVariationsLocal = (stateName: string): string[] => {
  const name = stateName.toLowerCase().trim();
  return [name];
};

// ── Inline TacticalModal (small utility, stays in shell) ──
const TacticalModal = ({ config, setModalConfig }: any) => {
  const [inputText, setInputText] = useState('');
  if (!config.isOpen) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 backdrop-blur-xl bg-black/40">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
        <div className={cn('h-2', config.type === 'danger' ? 'bg-red-600' : config.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-600')} />
        <div className="p-10 text-center">
          <h3 className="text-xl font-black text-gray-900 uppercase mb-2">{config.title}</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase mb-8">{config.description}</p>
          {config.showInput && (
            <select value={inputText} onChange={e => setInputText(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-bold mb-8 outline-none">
              <option value="">Select Reason...</option>
              {config.selectOptions?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
          <div className="flex gap-4">
            <button onClick={() => setModalConfig({ isOpen: false })} className="flex-1 py-4 bg-gray-100 text-gray-900 text-[10px] font-black uppercase rounded-2xl">Cancel</button>
            <button onClick={() => config.onConfirm(inputText)} className={cn('flex-1 py-4 text-white text-[10px] font-black uppercase rounded-2xl', config.type === 'danger' ? 'bg-red-600' : config.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-600')}>{config.confirmText}</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const SuperCellShell = ({ viewMode = 'COMMAND', onTabChange }: { viewMode?: string; onTabChange?: (m: string) => void }) => {

  // ── Firebase data ──
  const {
    activeAlerts, missionHistory, activeJourneys,
    verifiedProtectors, pendingProtectors, activeFirs, userStatusMap
  } = useSuperCellData();

  // ── UI State ──
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [isSovereignActive, setIsSovereignActive] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);
  const [selectedProtectorId, setSelectedProtectorId] = useState<string | null>(null);
  const [selectedFir, setSelectedFir] = useState<ZeroFIRRecord | null>(null);
  const [isFirModalOpen, setIsFirModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean; type: string; title: string; description: string; confirmText?: string; onConfirm?: (v?: any) => void}>({ isOpen: false, type: 'info', title: '', description: '' });
  const [selectedVettingUserId, setSelectedVettingUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  // ── State Shard Selection ──
  const [selectedState, setSelectedState] = useState<string>(() => localStorage.getItem('kavach_selected_state') || 'ALL');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => { if (user) setCurrentUserEmail(user.email || ''); });
    return () => unsub();
  }, []);

  const detectedAdminState = React.useMemo(() => {
    if (!currentUserEmail) return null;
    const email = currentUserEmail.toLowerCase().trim();
    const isAdmin = useKavachStore.getState().role === 'admin' || useKavachStore.getState().role === 'super_cell';
    if (isAdmin) return 'ALL';

    if (email.includes('adminsachin@')) {
      const localPart = email.split('@')[0];
      const parts = localPart.replace('.adminsachin', '').split('.');
      if (parts.length >= 2) {
        const STATE_ABBR_MAP: Record<string, string> = {
          'mp': 'Madhya Pradesh', 'up': 'Uttar Pradesh', 'dl': 'Delhi',
          'mh': 'Maharashtra', 'rj': 'Rajasthan', 'hr': 'Haryana',
          'pb': 'Punjab', 'gj': 'Gujarat', 'tn': 'Tamil Nadu',
          'ka': 'Karnataka', 'ap': 'Andhra Pradesh', 'ts': 'Telangana',
          'wb': 'West Bengal', 'br': 'Bihar', 'jh': 'Jharkhand',
          'uk': 'Uttarakhand', 'hp': 'Himachal Pradesh', 'jk': 'Jammu & Kashmir',
          'la': 'Ladakh', 'ga': 'Goa', 'as': 'Assam', 'mn': 'Manipur',
          'ml': 'Meghalaya', 'mz': 'Mizoram', 'nl': 'Nagaland', 'sk': 'Sikkim',
          'tr': 'Tripura', 'ar': 'Arunachal Pradesh', 'ct': 'Chhattisgarh',
          'or': 'Odisha', 'kl': 'Kerala', 'ch': 'Chandigarh'
        };
        const resolvedState = STATE_ABBR_MAP[parts[1]] || parts[1].toUpperCase();
        sessionStorage.setItem('kavach_admin_district', parts[0]);
        sessionStorage.setItem('kavach_admin_state', resolvedState);
        return resolvedState;
      }
      const statePart = localPart.replace('.adminsachin', '');
      for (const state of INDIAN_STATES_AND_UTS) {
        const v = getStateVariationsLocal(state);
        if (v.some(vv => statePart === vv.replace(/\s+/g, '') || statePart === vv.replace(/\s+/g, '_'))) {
          sessionStorage.removeItem('kavach_admin_district');
          sessionStorage.setItem('kavach_admin_state', state);
          return state;
        }
      }
    }
    return null;
  }, [currentUserEmail]);

  const detectedAdminDistrict = React.useMemo(() => sessionStorage.getItem('kavach_admin_district') || null, [currentUserEmail]);

  useEffect(() => {
    if (detectedAdminState) {
      setSelectedState(detectedAdminState);
    } else if (currentUserEmail && useKavachStore.getState().role !== 'admin') {
      setSelectedState(prev => prev === 'ALL' ? 'Uttar Pradesh' : prev);
    }
  }, [detectedAdminState, currentUserEmail]);

  useEffect(() => { localStorage.setItem('kavach_selected_state', selectedState); }, [selectedState]);

  // ── State filter ──
  const { filterByState, buildFilteredUserStatusMap } = useStateFilter({ selectedState, detectedAdminDistrict, userStatusMap });

  const filteredUserStatusMap = React.useMemo(
    () => buildFilteredUserStatusMap(activeAlerts, missionHistory, activeFirs),
    [buildFilteredUserStatusMap, activeAlerts, missionHistory, activeFirs]
  );

  const filteredActiveAlerts = activeAlerts.filter(filterByState);
  const filteredMissionHistory = missionHistory.filter(filterByState);
  const filteredVerifiedProtectors = verifiedProtectors.filter(filterByState);
  const filteredPendingProtectors = pendingProtectors.filter(filterByState);
  const filteredActiveFirs = activeFirs.filter(filterByState);
  const filteredActiveJourneys = activeJourneys.filter(filterByState);

  // ── Notifications ──
  const { notifications, setNotifications, unreadCount, setUnreadCount } = useSuperCellNotifications({
    activeAlerts,
    activeJourneys,
    activeFirs,
    pendingProtectors
  });

  // ── Actions ──
  const handleApproveProtector = async (userId: string) => {
    try {
      const protector = [...pendingProtectors, ...verifiedProtectors].find(p => p.id === userId);
      const coll = protector?.originCollection || 'users';
      await updateDoc(doc(db, coll, userId), { isVerified: true, verified: true, verificationDate: new Date() });
      toast.success('Protector Verified Successfully');
    } catch (error) {
      console.error('Approval Error:', error);
      toast.error('Failed to verify protector');
    }
  };

  // ── Tab Content Renderer ──
  const renderContent = () => {
    switch (viewMode) {
      case 'COMMAND':
        return (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === 'DASHBOARD' && (
              <NationalOverview
                activeAlerts={filteredActiveAlerts}
                verifiedProtectors={filteredVerifiedProtectors}
                pendingProtectors={filteredPendingProtectors}
                zeroFirs={filteredActiveFirs}
                selectedState={selectedState}
                isSovereignActive={isSovereignActive}
                onNavigate={(tab, alertId) => {
                  if (tab === 'VERIFICATION') { if (alertId) setSelectedVettingUserId(alertId); }
                  else { if (alertId) setSelectedAlertId(alertId); }
                  const viewMap: Record<string, string> = { 'ALERTS': 'SOS', 'SAFETY': 'SOS', 'REPORTS': 'DATA', 'FIR': 'FIR', 'PROTECTORS': 'PROTECTORS' };
                  const targetTab = viewMap[tab] || tab;
                  if (targetTab === 'PROTECTORS' && alertId) setSelectedProtectorId(alertId);
                  onTabChange?.(targetTab);
                }}
                onApproveProtector={handleApproveProtector}
                onDispatchSpecial={async (alertId, protectorIds) => {
                  try {
                    await updateDoc(doc(db, 'alerts', alertId), {
                      status: 'responding', dispatchedAt: new Date(),
                      activeResponders: protectorIds.map(pid => ({ id: pid, status: 'dispatched', timestamp: new Date() }))
                    });
                    toast.success(`Special Force Dispatched to ${protectorIds.length} Nodes`);
                  } catch (error) { toast.error('Tactical Dispatch Failed'); }
                }}
              />
            )}
          </div>
        );
      case 'VERIFICATION':
        return <VettingDesk userStatusMap={userStatusMap} selectedState={selectedState} detectedAdminDistrict={detectedAdminDistrict} initialSelectedUserId={selectedVettingUserId} onSelectUser={uid => setSelectedVettingUserId(uid)} />;
      case 'SOS':
        return <SOSManagement externalSelectedId={selectedAlertId} verifiedProtectors={filteredVerifiedProtectors} activeAlerts={filteredActiveAlerts} historicalAlerts={filteredMissionHistory} userStatusMap={filteredUserStatusMap} onViewReplay={alertId => { setActiveMissionId(alertId); onTabChange?.('TRACK'); }} />;
      case 'FIR':
        return <JusticeLedger zeroFirs={filteredActiveFirs} viewMode="JUSTICE" onViewFir={fir => { setSelectedFir(fir); setIsFirModalOpen(true); }} userStatusMap={filteredUserStatusMap} />;
      case 'PROTECTORS':
        return <ProtectorManagement externalSelectedId={selectedProtectorId} onViewReplay={id => { setActiveMissionId(id); onTabChange?.('TRACK'); }} verifiedProtectors={filteredVerifiedProtectors} pendingProtectors={filteredPendingProtectors} userStatusMap={filteredUserStatusMap} onSelectPendingProtector={id => { setSelectedVettingUserId(id); onTabChange?.('VERIFICATION'); }} />;
      case 'TRACK':
        return <ProtectorTrack activeMissionId={activeMissionId} onClearMission={() => setActiveMissionId(null)} isSovereignActive={isSovereignActive} userStatusMap={filteredUserStatusMap} selectedState={selectedState} detectedAdminDistrict={detectedAdminDistrict} />;
      case 'DATA':
        return <KavachDirectory womenUsers={Object.values(filteredUserStatusMap).filter(u => u.role?.toLowerCase() === 'citizen')} protectors={filteredVerifiedProtectors} selectedState={selectedState} isSovereignActive={isSovereignActive} />;
      case 'ANALYTICS':
        return <NeuralAnalytics activeAlerts={filteredActiveAlerts} activeJourneys={filteredActiveJourneys} verifiedProtectors={filteredVerifiedProtectors} justiceLedger={filteredActiveFirs} selectedState={selectedState} detectedAdminDistrict={detectedAdminDistrict} />;
      case 'CHAT':
        return <TacticalComms />;
      case 'TRANSIT':
        return <TransitTrack isSovereignActive={isSovereignActive} userStatusMap={filteredUserStatusMap} externalSelectedId={selectedAlertId} selectedState={selectedState} detectedAdminDistrict={detectedAdminDistrict} />;
      case 'GUIDES':
        return <WomenSafetyOPS />;
      case 'MAP':
        return (
          <div className="flex-1 bg-[#0F172A] rounded-[40px] overflow-hidden m-8">
            <KavachMap mode="command" activeAlerts={filteredActiveAlerts} activeProtectors={filteredVerifiedProtectors} activeJourneys={filteredActiveJourneys} {...{ activeFirs: filteredActiveFirs, pendingProtectors: [], selectedAlertId, isSovereignActive, showHeatmap, selectedState }} useMapboxFallback={useMapboxFallback} onFallback={() => setUseMapboxFallback(true)} />
          </div>
        );
      case 'SHIFTS':
        return <ShiftLogs selectedState={selectedState} detectedAdminDistrict={detectedAdminDistrict} />;
      case 'APPEALS':
        return <BanAppeals />;
      case 'REPORTS':
        return <ProtectorReportsLedger />;
      case 'SETTINGS':
        return <StateNexusCommand selectedState={selectedState} womenUsers={Object.values(userStatusMap).filter(u => u.role?.toLowerCase() === 'citizen')} verifiedProtectors={filteredVerifiedProtectors} pendingProtectors={filteredPendingProtectors} activeAlerts={filteredActiveAlerts} zeroFirs={filteredActiveFirs} onAlertClick={id => setSelectedAlertId(id)} onViewFir={fir => setSelectedAlertId(fir.id)} isSovereignActive={isSovereignActive} userStatusMap={userStatusMap} />;
      default:
        return <div className="flex-1 flex flex-col items-center justify-center opacity-20"><History size={80} className="mb-6" /><p className="text-sm font-black uppercase tracking-[5px]">Module Linked - Scanning...</p></div>;
    }
  };

  return (
    <div className="relative w-full h-screen flex bg-[#0F172A] font-['Outfit'] overflow-hidden max-h-screen text-white">
      <TacticalModal config={modalConfig} setModalConfig={setModalConfig} />
      <SuperCellSidebar viewMode={viewMode} onTabChange={onTabChange || (() => {})} />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperCellHeader
          selectedState={selectedState}
          detectedAdminDistrict={detectedAdminDistrict}
          notifications={notifications}
          setNotifications={setNotifications}
          isSovereignActive={isSovereignActive}
          setIsSovereignActive={setIsSovereignActive}
          showHeatmap={showHeatmap}
          setShowHeatmap={setShowHeatmap}
          unreadCount={unreadCount}
          setUnreadCount={setUnreadCount}
          setModalConfig={setModalConfig}
          onTabChange={onTabChange || (() => {})}
        />
        <NationalEmergencyTicker isActive={isSovereignActive} gridNodeCount={verifiedProtectors.length + activeAlerts.length} />
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {renderContent()}
        </main>
      </div>
      <JusticeBlockModal fir={selectedFir} isOpen={isFirModalOpen} onClose={() => { setIsFirModalOpen(false); setSelectedFir(null); }} />
    </div>
  );
};
