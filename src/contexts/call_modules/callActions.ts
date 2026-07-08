import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { KavachSafe } from '../../services/KavachNative';
import { loadZegoScript } from './zegoLoader';
import { useKavachStore } from '../../state/useKavachStore';

export const clearSignal = async (contextId?: string, activeAlertId?: string | null, activeContextId?: string | null) => {
  try {
    const targetId = contextId || activeAlertId || activeContextId;
    if (!targetId) return;
    const { doc, updateDoc, deleteField } = await import('firebase/firestore');
    const { db } = await import('../../firebase');
    await updateDoc(doc(db, 'alerts', targetId), { activeCall: deleteField() });
  } catch (e) {}
};

export const initiateCallAction = async (
  targetUid: string, targetName: string, contextId: string | undefined,
  isJoiningRef: React.MutableRefObject<boolean>,
  activeAlertId: string | null,
  setCallState: (s: any) => void,
  setCallerName: (s: string | null) => void,
  setActiveCallUserId: (s: string | null) => void,
  setActiveContextId: (s: string | null) => void,
  zegoContainerRef: React.RefObject<HTMLDivElement>,
  setZegoInstance: (i: any) => void
) => {
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
    const { db } = await import('../../firebase');
    
    const callerName = ('name' in currentUser ? (currentUser as any).name : undefined) || 
                       ('displayName' in currentUser ? (currentUser as any).displayName : undefined) || 
                       "Kavach Citizen";

    const signalData = {
      activeCall: {
        callerName: callerName,
        callerUid: currentUser.uid,
        targetUid: targetUid,
        timestamp: new Date()
      }
    };

    await updateDoc(doc(db, 'alerts', finalContextId), signalData);

    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'notifications'), {
        type: 'VOIP_CALL',
        targetUid: targetUid,
        callerName: callerName,
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

    const ZegoUIKitPrebuilt = await loadZegoScript();

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, serverSecret, finalContextId, currentUser.uid, callerName || "User"
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
        clearSignal(finalContextId, activeAlertId, null);
        isJoiningRef.current = false;
        window.dispatchEvent(new CustomEvent('kavach-call-ended'));
      }
    });
  } catch (error) {
    isJoiningRef.current = false;
    setCallState('idle');
  }
};

export const answerCallAction = async (
  isJoiningRef: React.MutableRefObject<boolean>,
  callState: string,
  activeAlertId: string | null,
  activeContextId: string | null,
  profile: any,
  setZegoInstance: (i: any) => void,
  zegoContainerRef: React.RefObject<HTMLDivElement>,
  setCallState: (s: any) => void
) => {
  if (isJoiningRef.current || callState === 'connected') return;
  const contextId = activeAlertId || activeContextId;
  if (!contextId || !profile) return;

  try {
    isJoiningRef.current = true;
    const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;

    const ZegoUIKitPrebuilt = await loadZegoScript();

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
        clearSignal(contextId, activeAlertId, activeContextId);
        isJoiningRef.current = false;
        window.dispatchEvent(new CustomEvent('kavach-call-ended'));
      }
    });
  } catch (error) {
    isJoiningRef.current = false;
    setCallState('idle');
  }
};
