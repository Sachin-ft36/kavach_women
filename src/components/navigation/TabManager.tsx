import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { useKavachStore } from '../../store/useKavachStore';
import { auth } from '../../firebase';

const VictimMap = React.lazy(() => import('../maps/VictimMap'));
const MapplsVictimMap = React.lazy(() => import('../maps/MapplsVictimMap'));
const EvidenceVault = React.lazy(() => import('../EvidenceVault'));
const EmergencyContacts = React.lazy(() => import('../EmergencyContacts'));
const ProtectorDashboard = React.lazy(() => import('../ProtectorDashboard'));
const GuardianDashboard = React.lazy(() => import('../guardian/GuardianDashboard'));
const SuperCellDashboard = React.lazy(() => import('../SuperCellDashboard'));
const Rewards = React.lazy(() => import('../Rewards'));
const DashboardScreen = React.lazy(() => import('../../screens/DashboardScreen'));
const SOSScreen = React.lazy(() => import('../../screens/SOSScreen'));
const MissionHistoryScreen = React.lazy(() => import('../../screens/MissionHistoryScreen'));
const GuideScreen = React.lazy(() => import('../../screens/GuideScreen'));
const ProtectorGuideScreen = React.lazy(() => import('../../screens/ProtectorGuideScreen'));
const ProtectorsRadarScreen = React.lazy(() => import('../../screens/ProtectorsRadarScreen'));
const ProtectorGrievanceScreen = React.lazy(() => import('../../screens/ProtectorGrievanceScreen'));
const ProtectorHistoryScreen = React.lazy(() => import('../../screens/ProtectorHistoryScreen'));

interface TabManagerProps {
  isGhostMode: boolean;
  onToggleGhost: () => void;
}

export function TabManager({ isGhostMode, onToggleGhost }: TabManagerProps) {
  const { activeTab, role, isLocked, handleManualUnlock, isVerified, gender, profile } = useKavachStore();
  const isSystemAdmin = auth.currentUser && (role === 'admin' || role === 'super_cell');
  const [useMapboxFallback, setUseMapboxFallback] = useState(true);

  // 🔒 FORCED MALE RULE: Male users can never be citizens
  const isMale = gender === 'male' || (profile as any)?.gender === 'male';
  const effectiveRole = (isMale && role === 'citizen') ? 'protector' : role;

  const renderTab = (tab: string) => {
    const isVisible = activeTab === tab;

    if ((effectiveRole === 'protector' || effectiveRole === 'guardian') && tab === 'sos') return null;

    switch (tab) {
      case 'dashboard':
        if (isVisible) {
          if (effectiveRole === 'guardian') {
            return <div key="dashboard" className="block"><GuardianDashboard /></div>;
          }
          if (effectiveRole === 'protector' && !isVerified && !useKavachStore.getState().isSOSActive) {
            return (
              <div key="pending" className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-700">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl animate-pulse" />
                  <div className="relative w-full h-full bg-white rounded-full border border-blue-50 flex items-center justify-center shadow-2xl">
                    <Shield size={56} className="text-blue-500 animate-pulse" strokeWidth={1} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Vetting in Progress</h2>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[3px]">Institutional Validation Active</p>
                </div>
              </div>
            );
          }
          return <div key="dashboard" className="block">{effectiveRole === 'protector' ? <ProtectorDashboard /> : isSystemAdmin ? <SuperCellDashboard /> : <DashboardScreen />}</div>;
        }
        return null;
      case 'map': return isVisible ? <div key="map" className="block h-[calc(100vh-210px)] w-full">{!useMapboxFallback ? <MapplsVictimMap onFallback={() => setUseMapboxFallback(true)} /> : <VictimMap />}</div> : null;
      case 'sos': return (isVisible && effectiveRole === 'citizen') ? <SOSScreen key="sos" isLocked={isLocked} activeTab={activeTab} isGhostMode={isGhostMode} handleManualUnlock={handleManualUnlock} /> : null;
      case 'vault': return isVisible ? <div key="vault" className="max-w-2xl mx-auto"><EvidenceVault /></div> : null;
      case 'contacts': return isVisible ? <div key="contacts" className="max-w-2xl mx-auto"><EmergencyContacts /></div> : null;
      case 'radar': return isVisible ? <div key="radar" className="w-full"><ProtectorsRadarScreen /></div> : null;
      case 'rewards': return isVisible ? <div key="rewards" className="w-full min-h-screen bg-[#0F172A]"><div className="max-w-2xl mx-auto"><Rewards /></div></div> : null;
      case 'history': return isVisible ? <div key="history" className="max-w-4xl mx-auto px-4"><MissionHistoryScreen /></div> : null;
      case 'guide': return isVisible ? <div key="guide" className="max-w-4xl mx-auto px-4">{effectiveRole === 'protector' ? <ProtectorGuideScreen /> : <GuideScreen />}</div> : null;
      case 'grievance': return isVisible ? <div key="grievance" className="max-w-4xl mx-auto px-4"><ProtectorGrievanceScreen /></div> : null;
      case 'protector_history': return isVisible ? <div key="protector_history" className="max-w-4xl mx-auto px-4"><ProtectorHistoryScreen /></div> : null;
      default: return null;
    }
  };

  const citizenStack = ['dashboard', 'radar', 'map', 'sos', 'vault', 'contacts', 'history', 'rewards'];
  const protectorStack = ['dashboard', 'radar', 'rewards', 'guide', 'grievance', 'protector_history'];
  const guardianStack = ['dashboard', 'history'];
  const adminStack = ['dashboard', 'map', 'vault', 'history'];

  const currentStack = 
    effectiveRole === 'guardian' ? guardianStack :
    effectiveRole === 'protector' ? protectorStack : 
    effectiveRole === 'admin' ? adminStack : 
    citizenStack;

  return (
    <div className="relative w-full h-full overflow-hidden">
      <React.Suspense fallback={<div className="p-20 text-center uppercase tracking-widest text-xs animate-pulse text-gray-400">Loading Node...</div>}>
        <div className="relative w-full h-full">{currentStack.map(tab => renderTab(tab))}</div>
      </React.Suspense>
    </div>
  );
}
