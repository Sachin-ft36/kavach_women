import React from 'react';
import SOSButton from '../components/SOSButton';
import { Lock, Eye, MessageSquare, Phone, Map, X, ShieldCheck, Shield } from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import DeviceLockScreen from '../components/sos/DeviceLockScreen';
import { ActiveSOSOverlay } from '../components/sos/ActiveSOSOverlay';

interface SOSScreenProps {
  isLocked: boolean;
  activeTab: string;
  isGhostMode: boolean;
  handleManualUnlock: () => void | Promise<void>;
}

export default function SOSScreen({ isLocked, activeTab, isGhostMode, handleManualUnlock }: SOSScreenProps) {
  const { role, user, isSOSActive, setSOSActive, triggerMethod, safetyPin, handshakeCode } = useKavachStore();

  const storedRole = localStorage.getItem('kavach_user_role');
  if (role === 'protector' || storedRole === 'protector') return null;

  if (isSOSActive) {
    return <ActiveSOSOverlay />;
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen overflow-x-hidden">
      <SOSButton />
    </div>
  );
}
