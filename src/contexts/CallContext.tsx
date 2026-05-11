import React, { createContext, useContext, useState } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useKavachStore } from '../store/useKavachStore';
import { toast } from 'sonner';

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
  
  const { profile, user, activeAlertId } = useKavachStore();

  // 📡 REAL-TIME SIGNALING SENTINEL: Listen for incoming calls via Alert Document
  React.useEffect(() => {
    const contextId = activeAlertId || activeContextId;
    const currentUid = profile?.uid || user?.uid || localStorage.getItem('kavach_user_uid');
    
    if (!contextId || !currentUid) {
      console.log("📞 KAVACH SIGNAL: Listener Standby - Waiting for Context/Auth", { contextId, hasUid: !!currentUid });
      return;
    }

    const setupSignalListener = async () => {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      console.log("📞 KAVACH SIGNAL: Sentinel Active for", contextId);

      const processSnap = (snap: any) => {
        if (snap.exists()) {
          const data = snap.data();
          
          if (data.activeCall) {
             const isTargetMe = data.activeCall.targetUid === currentUid;
             const isAuthorizedResponder = data.activeResponders?.some((r: any) => r.uid === currentUid);
             const isVictim = data.victimUid === currentUid;
             const amITargeted = data.activeCall.targetUid === currentUid;
             
             console.log("📞 KAVACH SIGNAL: Tactical Logic Check", { 
               amITargeted,
               isVictim,
               isAuthorizedResponder,
               callerUid: data.activeCall.callerUid,
               myUid: currentUid,
               callState
             });

             // Ring if I am specifically targeted OR if I am the victim and a responder is calling me
             const shouldRing = (amITargeted || (isVictim && !isTargetMe)) && 
                                data.activeCall.callerUid !== currentUid && 
                                callState === 'idle';

             if (shouldRing) {
                console.log("📞 KAVACH SIGNAL: Match Found! Initiating Ring Sequence...");
                setCallState('ringing');
                setCallerName(data.activeCall.callerName);
                setActiveCallUserId(data.activeCall.callerUid);
                setActiveContextId(contextId);
             }
          }

          if (!data.activeCall && callState === 'ringing') {
            console.log("📞 KAVACH SIGNAL: Remote Hangup Detected.");
            setCallState('idle');
          }
        }
      };

      const unsubAlert = onSnapshot(doc(db, 'alerts', contextId), processSnap);
      const unsubJourney = onSnapshot(doc(db, 'journeys', contextId), processSnap);

      return () => {
        unsubAlert();
        unsubJourney();
      };
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
      
      await updateDoc(doc(db, 'alerts', targetId), {
        activeCall: deleteField()
      });
    } catch (e) { console.error("Signal Clear Error:", e); }
  };

  const initiateCall = async (targetUid: string, targetName: string, contextId?: string) => {
    const state = useKavachStore.getState();
    const currentUser = state.profile || state.user;
    
    console.log("📞 KAVACH SIGNAL: initiateCall triggered", { targetUid, targetName, profile: !!state.profile, user: !!state.user });

    if (!currentUser?.uid) {
      toast.error("Auth session required for tactical uplink.");
      return;
    }

    const finalContextId = contextId || activeAlertId || state.activeAlertId;

    if (!finalContextId) {
      console.warn("📞 KAVACH SIGNAL: Blocked - No Mission Context Found.");
      toast.error("No active mission context for tactical call.");
      return;
    }

    try {
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

      console.log("📞 KAVACH SIGNAL: Zego Config", { appID, hasSecret: !!serverSecret });

      if (!appID || isNaN(appID) || !serverSecret) {
        throw new Error("ZEGO Credentials missing or invalid in .env");
      }

      // 📡 BROADCAST SIGNAL TO ALERT OR JOURNEY DOC
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const signalData = {
        activeCall: {
          callerName: currentUser.name || currentUser.displayName || "Kavach Guardian",
          callerUid: currentUser.uid,
          targetUid: targetUid,
          timestamp: new Date()
        }
      };

      console.log("📞 KAVACH SIGNAL: Broadcasting to Firebase...", signalData);
      try {
        await updateDoc(doc(db, 'alerts', finalContextId), signalData);
        console.log("📞 KAVACH SIGNAL: Alert Document Updated.");
      } catch (e) {
        console.warn("Signal attempt on alerts failed, trying journeys...");
        await updateDoc(doc(db, 'journeys', finalContextId), signalData);
        console.log("📞 KAVACH SIGNAL: Journey Document Updated.");
      }

      setCallState('calling');
      setCallerName(targetName);
      setActiveCallUserId(targetUid);
      setActiveContextId(finalContextId);

      console.log("📞 KAVACH SIGNAL: Generating Zego Token...");
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        finalContextId,
        currentUser.uid || Date.now().toString(),
        currentUser.name || currentUser.displayName || "Kavach User"
      );

      console.log("📞 KAVACH SIGNAL: Joining Zego Room...");
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      setZegoInstance(zp);

      zp.joinRoom({
        container: null,
        scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
        showScreenSharingButton: false,
        showMyCameraToggleButton: false,
        showAudioVideoSettingsButton: false,
        showUserList: false,
        turnOnCameraWhenJoining: false,
        showTextChat: false,
        onJoinRoom: () => {
          console.log("📞 KAVACH SIGNAL: Zego Room Joined Successfully!");
          setCallState('connected');
          toast.success("Tactical Link Established.");
        },
        onLeaveRoom: () => {
          console.log("📞 KAVACH SIGNAL: Left Zego Room.");
          setCallState('idle');
          setZegoInstance(null);
          clearSignal(finalContextId);
        }
      });

    } catch (error) {
      console.error('KAVACH Signal: Zego Uplink Failed:', error);
      toast.error("Tactical Link Failed.");
      setCallState('idle');
      clearSignal(finalContextId);
    }
  };

  const answerCall = async () => {
    const contextId = activeAlertId || activeContextId;
    if (!contextId || !profile) return;

    try {
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
      const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        contextId, // Join the alert room
        profile.uid || Date.now().toString(),
        profile.name || "Kavach User"
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      setZegoInstance(zp);

      zp.joinRoom({
        container: null,
        scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
        showScreenSharingButton: false,
        showMyCameraToggleButton: false,
        showAudioVideoSettingsButton: false,
        showUserList: false,
        turnOnCameraWhenJoining: false,
        showTextChat: false,
        onJoinRoom: () => {
          setCallState('connected');
        },
        onLeaveRoom: () => {
          setCallState('idle');
          setZegoInstance(null);
        }
      });
    } catch (error) {
      toast.error("Link Failure.");
      setCallState('idle');
    }
  };

  const declineCall = () => {
    setCallState('idle');
    if (zegoInstance) zegoInstance.destroy();
    clearSignal();
  };

  const hangupCall = () => {
    if (zegoInstance) {
      zegoInstance.destroy();
      setZegoInstance(null);
    }
    setCallState('idle');
    clearSignal();
  };

  return (
    <CallContext.Provider value={{ initiateCall, answerCall, declineCall, hangupCall, callState, callerName, activeCallUserId }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  return useContext(CallContext);
};
