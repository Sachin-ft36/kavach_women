import React, { createContext, useContext, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useKavachStore } from '../store/useKavachStore';
import { toast } from 'sonner';

interface CallContextType {
  initiateCall: (targetUserId: string, targetName: string, contextId?: string) => Promise<void>;
  hangupCall: () => void;
  callState: 'idle' | 'calling' | 'connected';
  callerName: string | null;
  activeCallUserId: string | null;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [callerName, setCallerName] = useState<string | null>(null);
  const [activeCallUserId, setActiveCallUserId] = useState<string | null>(null);
  const [zegoInstance, setZegoInstance] = useState<any>(null);
  
  const { profile } = useKavachStore();

  const initiateCall = async (roomID: string, targetName: string, contextId?: string) => {
    if (!profile) {
      toast.error("Auth session required for tactical uplink.");
      return;
    }

    try {
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

      if (!appID || !serverSecret) {
        throw new Error("ZEGO Credentials missing in .env");
      }

      setCallState('calling');
      setCallerName(targetName);
      setActiveCallUserId(roomID);

      let startTime: number | null = null;

      // Generate Kit Token
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        profile.uid || Date.now().toString(),
        profile.name || "Kavach User"
      );

      // Create instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      setZegoInstance(zp);

      // Join Room with Voice-Only Config
      zp.joinRoom({
        container: null, // Floating UI handled by Zego
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        showScreenSharingButton: false,
        showMyCameraToggleButton: false, // 🛡️ ANONYMOUS VOICE ONLY
        showAudioVideoSettingsButton: false,
        showUserList: false,
        turnOnCameraWhenJoining: false, // 🛡️ FORCE VIDEO OFF
        showTextChat: false,
        onJoinRoom: () => {
          startTime = Date.now();
          setCallState('connected');
          toast.success("Tactical Link Established.");
        },
        onLeaveRoom: async () => {
          setCallState('idle');
          setZegoInstance(null);
          
          if (startTime && contextId) {
            const durationMs = Date.now() - startTime;
            const durationSec = Math.floor(durationMs / 1000);
            
            try {
              const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
              const { db } = await import('../firebase');
              
              await updateDoc(doc(db, 'alerts', contextId), {
                callLogs: arrayUnion({
                  callerName: profile.name,
                  targetName,
                  durationSeconds: durationSec,
                  timestamp: new Date()
                })
              });
              console.log(`📡 KAVACH: Call Logged - ${durationSec}s`);
            } catch (e) {
              console.error("Call log failure:", e);
            }
          }
        }
      });

    } catch (error) {
      console.error('KAVACH Signal: Zego Uplink Failed:', error);
      toast.error("Tactical Link Failed.");
      setCallState('idle');
    }
  };

  const hangupCall = () => {
    if (zegoInstance) {
      // zp.destroy() or navigate away
      window.location.reload(); // Hard reset for clean session termination in dev
    }
    setCallState('idle');
  };

  return (
    <CallContext.Provider value={{ initiateCall, hangupCall, callState, callerName, activeCallUserId }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
