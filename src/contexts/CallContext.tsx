import React, { createContext, useContext, useState, useRef } from 'react';
// 🛡️ LAZY LOAD: Zego SDK is 5 MB — only load when a call is actually placed
// import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useKavachStore } from '../store/useKavachStore';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';

interface CallContextType {
  initiateCall: (targetUserId: string, targetName: string, contextId?: string) => Promise<void>;
  answerCall: () => void;
  declineCall: () => void;
  hangupCall: () => void;
  callState: 'idle' | 'calling' | 'ringing' | 'connected';
  callerName: string | null;
  activeCallUserId: string | null;
}

const CallContext = createContext<CallContextType>({
  initiateCall: async () => {},
  answerCall: () => {},
  declineCall: () => {},
  hangupCall: () => {},
  callState: 'idle',
  callerName: null,
  activeCallUserId: null,
});

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [callerName, setCallerName] = useState<string | null>(null);
  const [activeCallUserId, setActiveCallUserId] = useState<string | null>(null);
  const [activeContextId, setActiveContextId] = useState<string | null>(null);
  const [zegoInstance, setZegoInstance] = useState<any>(null);
  const zegoContainerRef = useRef<HTMLDivElement>(null);
  const isJoiningRef = useRef(false);
  
  const { profile, user, activeAlertId } = useKavachStore();

  // 📡 REAL-TIME SIGNALING SENTINEL
  React.useEffect(() => {
    const contextId = activeAlertId || activeContextId;
    const currentUid = profile?.uid || user?.uid || localStorage.getItem('kavach_user_uid');
    
    if (!contextId || !currentUid) return;

    const setupSignalListener = async () => {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      const processSnap = (snap: any) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.activeCall) {
             const amITargeted = data.activeCall.targetUid === currentUid;
             const isVictim = data.victimUid === currentUid;
             const shouldRing = (amITargeted || (isVictim && data.activeCall.targetUid === currentUid)) && 
                                data.activeCall.callerUid !== currentUid && 
                                callState === 'idle';

             if (shouldRing) {
                setCallState('ringing');
                setCallerName(data.activeCall.callerName);
                setActiveCallUserId(data.activeCall.callerUid);
                setActiveContextId(contextId);
             }
          }
          if (!data.activeCall && callState !== 'idle') {
            setCallState('idle');
            if (zegoInstance) zegoInstance.destroy();
            setZegoInstance(null);
          }
        }
      };

      let unsubAlert = () => {};
      let unsubJourney = () => {};

      try {
        unsubAlert = onSnapshot(doc(db, 'alerts', contextId), processSnap, (err) => {
          console.warn("⚠️ CallContext: Alerts listener read or permission error.", err.message);
        });
      } catch (e) {}

      try {
        unsubJourney = onSnapshot(doc(db, 'journeys', contextId), processSnap, (err) => {
          console.warn("⚠️ CallContext: Journeys listener read or permission error.", err.message);
        });
      } catch (e) {}

      return () => { unsubAlert(); unsubJourney(); };
    };

    let unsub: any;
    setupSignalListener().then(fn => unsub = fn);
    return () => unsub && unsub();
  }, [profile?.uid, user?.uid, activeAlertId, activeContextId, callState]);

  const clearSignal = async (contextId?: string) => {
    try {
      const targetId = contextId || activeAlertId || activeContextId;
      if (!targetId) return;
      const { doc, updateDoc, deleteField } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await updateDoc(doc(db, 'alerts', targetId), { activeCall: deleteField() });
    } catch (e) {}
  };

  const initiateCall = async (targetUid: string, targetName: string, contextId?: string) => {
    if (isJoiningRef.current) return;
    
    const state = useKavachStore.getState();
    const currentUser = state.profile || state.user;
    if (!currentUser?.uid) return;

    const finalContextId = contextId || activeAlertId || state.activeAlertId;
    if (!finalContextId) return;

    try {
      isJoiningRef.current = true;
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const signalData = {
        activeCall: {
          callerName: currentUser.name || currentUser.displayName || "Kavach Citizen",
          callerUid: currentUser.uid,
          targetUid: targetUid,
          timestamp: new Date()
        }
      };

      await updateDoc(doc(db, 'alerts', finalContextId), signalData);

      // 📡 VOIP PUSH TRIGGER: Wake up the protector if the app is closed
      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        await addDoc(collection(db, 'notifications'), {
          type: 'VOIP_CALL',
          targetUid: targetUid,
          callerName: currentUser.name || currentUser.displayName || "Kavach Citizen",
          contextId: finalContextId,
          timestamp: serverTimestamp(),
          status: 'pending',
          priority: 'high'
        });
        console.log("🚀 KAVACH: VoIP Wake-up Signal Dispatched to Grid.");
      } catch (pushErr) {
        console.error("⚠️ KAVACH: VoIP Push Trigger Failed.", pushErr);
      }

      setCallState('calling');
      setCallerName(targetName);
      setActiveCallUserId(targetUid);
      setActiveContextId(finalContextId);

      // 🚀 LAZY LOAD: Only pull Zego's 5 MB SDK when a call is actually placed
      const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, serverSecret, finalContextId, currentUser.uid, currentUser.name || "User"
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      setZegoInstance(zp);

      zp.joinRoom({
        container: zegoContainerRef.current,
        scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
        showScreenSharingButton: false,
        showMyCameraToggleButton: false,
        showPreJoinView: false,
        showLeaveRoomConfirmDialog: false,
        showTextChat: false,
        showUserList: false,
        onUserJoin: (_user: any) => {
          setCallState('connected');
          if (Capacitor.isNativePlatform()) KavachSafe.triggerHapticPulse();
          toast.success("🛡️ PROTECTOR LINKED");
        },
        onJoinRoom: () => {
          setCallState('calling');
          isJoiningRef.current = false;
        },
        onLeaveRoom: () => {
          setCallState('idle');
          setZegoInstance(null);
          clearSignal(finalContextId);
          isJoiningRef.current = false;
          window.dispatchEvent(new CustomEvent('kavach-call-ended'));
        }
      });
    } catch (error) {
      isJoiningRef.current = false;
      setCallState('idle');
    }
  };

  const answerCall = async () => {
    if (isJoiningRef.current || callState === 'connected') return;
    const contextId = activeAlertId || activeContextId;
    if (!contextId || !profile) return;

    try {
      isJoiningRef.current = true;
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

      // 🚀 LAZY LOAD: Only pull Zego's 5 MB SDK when answering a call
      const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, serverSecret, contextId, profile.uid, profile.name || "Protector"
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      setZegoInstance(zp);

      zp.joinRoom({
        container: zegoContainerRef.current,
        scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
        showScreenSharingButton: false,
        showMyCameraToggleButton: false,
        showPreJoinView: false,
        showLeaveRoomConfirmDialog: false,
        showTextChat: false,
        showUserList: false,
        onJoinRoom: () => {
          setCallState('connected');
          isJoiningRef.current = false;
        },
        onLeaveRoom: () => {
          setCallState('idle');
          setZegoInstance(null);
          clearSignal(contextId);
          isJoiningRef.current = false;
          window.dispatchEvent(new CustomEvent('kavach-call-ended'));
        }
      });
    } catch (error) {
      isJoiningRef.current = false;
      setCallState('idle');
    }
  };

  const declineCall = () => {
    setCallState('idle');
    if (zegoInstance) zegoInstance.destroy();
    clearSignal();
    isJoiningRef.current = false;
  };

  const hangupCall = () => {
    if (zegoInstance) zegoInstance.destroy();
    setZegoInstance(null);
    setCallState('idle');
    clearSignal();
    isJoiningRef.current = false;
  };

  return (
    <CallContext.Provider value={{ initiateCall, answerCall, declineCall, hangupCall, callState, callerName, activeCallUserId }}>
      {children}
      <div 
        ref={zegoContainerRef}
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '1px', 
          height: '1px', 
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }} 
      />
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
