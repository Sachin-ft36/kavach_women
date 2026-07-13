import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useKavachStore } from '../../state/useKavachStore';
import { auth } from '../../firebase';

// Instant Eager Imports for lightning-fast 0-second tab switching
import VictimMap from '../maps/VictimMap';
import MapplsVictimMap from '../maps/MapplsVictimMap';
import FamilyCircleDetail from '../FamilyCircleDetail';
import FamilyProtectionOverview from '../guardian/FamilyProtectionOverview';
import SmartSafetyTools from '../SmartSafetyTools';
import ProtectorDashboard from '../ProtectorDashboard';
import GuardianDashboard from '../guardian/GuardianDashboard';
import SuperCellDashboard from '../SuperCellDashboard';
import Rewards from '../Rewards';
import ProfileScreen from '../../screens/ProfileScreen';
import DashboardScreen from '../../screens/DashboardScreen';
import SOSScreen from '../../screens/SOSScreen';
import MissionHistoryScreen from '../../screens/MissionHistoryScreen';
import GuideScreen from '../../screens/GuideScreen';
import ProtectorGuideScreen from '../../screens/ProtectorGuideScreen';
import ProtectorGrievanceScreen from '../../screens/ProtectorGrievanceScreen';
import ProtectorHistoryScreen from '../../screens/ProtectorHistoryScreen';
import GuardianHistoryScreen from '../../screens/GuardianHistoryScreen';
import CalmSpaceScreen from '../../screens/CalmSpaceScreen';
import SafetyReadinessScreen from '../../screens/SafetyReadinessScreen';
import TalkToSomeoneScreen from '../../screens/TalkToSomeoneScreen';

interface TabManagerProps {
  isGhostMode: boolean;
  onToggleGhost: () => void;
}

export function TabManager({ isGhostMode, onToggleGhost }: TabManagerProps) {
  const { activeTab, role, isLocked, handleManualUnlock, isVerified, gender, profile } = useKavachStore();
  const isSystemAdmin = auth.currentUser && (role === 'admin' || role === 'super_cell');
  const [useMapboxFallback, setUseMapboxFallback] = useState(true);

  // Scroll back to top when switching active tabs to prevent scroll leakage
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // 🔒 FORCED MALE RULE: Male users can never be citizens
  const isMale = gender === 'male' || (profile as any)?.gender === 'male';
  const effectiveRole = (isMale && role === 'citizen') ? 'protector' : role;

  const citizenStack = ['dashboard', 'radar', 'map', 'sos', 'vault', 'contacts', 'history', 'rewards', 'calm_space', 'safety_readiness', 'talk_to_someone'];
  const protectorStack = ['dashboard', 'radar', 'rewards', 'guide', 'grievance', 'protector_history', 'safety_readiness', 'talk_to_someone'];
  const guardianStack = ['dashboard', 'radar', 'history', 'rewards', 'safety_readiness', 'talk_to_someone'];
  const adminStack = ['dashboard', 'map', 'vault', 'history', 'safety_readiness', 'talk_to_someone'];

  const currentStack =
    effectiveRole === 'guardian' ? guardianStack :
      effectiveRole === 'protector' ? protectorStack :
        effectiveRole === 'admin' ? adminStack :
          citizenStack;

  const renderTabContent = (tab: string) => {
    const isVisible = activeTab === tab;
    if ((effectiveRole === 'protector' || effectiveRole === 'guardian') && tab === 'sos') return null;

    const containerStyle: React.CSSProperties = isVisible 
      ? { display: 'block', width: '100%', height: '100%' } 
      : { display: 'none', width: '100%', height: '100%' };

    switch (tab) {
      case 'dashboard':
        if (effectiveRole === 'guardian') {
          return <div key="dashboard" style={containerStyle}><GuardianDashboard /></div>;
        }
        if (effectiveRole === 'protector' && !isVerified && !useKavachStore.getState().isSOSActive) {
          return (
            <div key="pending" style={containerStyle} className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center space-y-8">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl " />
                <div className="relative w-full h-full bg-white rounded-full border border-blue-50 flex items-center justify-center shadow-2xl">
                  <Shield size={56} className="text-blue-500 " strokeWidth={1} />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Vetting in Progress</h2>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[3px]">Institutional Validation Active</p>
              </div>
            </div>
          );
        }
        return <div key="dashboard" style={containerStyle}>{effectiveRole === 'protector' ? <ProtectorDashboard /> : isSystemAdmin ? <SuperCellDashboard /> : <DashboardScreen />}</div>;
      case 'map': 
        return (
          <div key="map" style={containerStyle} className="h-[calc(100vh-210px)] w-full">
            {!useMapboxFallback ? <MapplsVictimMap onFallback={() => setUseMapboxFallback(true)} /> : <VictimMap />}
          </div>
        );
      case 'sos': 
        return effectiveRole === 'citizen' ? (
          <div key="sos" style={containerStyle}>
            <SOSScreen isLocked={isLocked} activeTab={activeTab} isGhostMode={isGhostMode} handleManualUnlock={handleManualUnlock} />
          </div>
        ) : null;
      case 'vault': 
        return <div key="vault" style={containerStyle}><SmartSafetyTools /></div>;
      case 'contacts': 
        return <div key="contacts" style={containerStyle}><FamilyProtectionOverview /></div>;
      case 'radar': 
        return <div key="radar" style={containerStyle}><FamilyCircleDetail isOpen={true} onClose={() => useKavachStore.getState().setActiveTab('dashboard')} /></div>;
      case 'rewards': 
        return (
          <div key="rewards" style={containerStyle} className="w-full min-h-screen">
            <ProfileScreen />
          </div>
        );
      case 'history':
        if (effectiveRole === 'guardian') {
          return <div key="history" style={containerStyle} className="max-w-4xl mx-auto px-4"><GuardianHistoryScreen /></div>;
        }
        return <div key="history" style={containerStyle} className="max-w-4xl mx-auto px-4"><MissionHistoryScreen /></div>;
      case 'guide': 
        return (
          <div key="guide" style={containerStyle} className="max-w-4xl mx-auto px-4">
            {effectiveRole === 'protector' ? <ProtectorGuideScreen /> : <GuideScreen />}
          </div>
        );
      case 'grievance': 
        return <div key="grievance" style={containerStyle} className="max-w-4xl mx-auto px-4"><ProtectorGrievanceScreen /></div>;
      case 'protector_history': 
        return <div key="protector_history" style={containerStyle} className="max-w-4xl mx-auto px-4"><ProtectorHistoryScreen /></div>;
      case 'calm_space':
        return <div key="calm_space" style={containerStyle}><CalmSpaceScreen /></div>;
      case 'safety_readiness':
        return <div key="safety_readiness" style={containerStyle}><SafetyReadinessScreen /></div>;
      case 'talk_to_someone':
        return <div key="talk_to_someone" style={containerStyle}><TalkToSomeoneScreen /></div>;
      default: 
        return null;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="relative w-full h-full">
        {currentStack.map(tab => renderTabContent(tab))}
      </div>
    </div>
  );
}
