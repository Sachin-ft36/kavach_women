import { useEffect } from 'react';

export const useCallSignaling = (
  profile: any,
  user: any,
  activeAlertId: string | null,
  activeContextId: string | null,
  callState: string,
  setCallState: (state: any) => void,
  setCallerName: (name: string | null) => void,
  setActiveCallUserId: (id: string | null) => void,
  setActiveContextId: (id: string | null) => void,
  zegoInstance: any,
  setZegoInstance: (instance: any) => void
) => {
  useEffect(() => {
    const contextId = activeAlertId || activeContextId;
    const currentUid = profile?.uid || user?.uid || localStorage.getItem('kavach_user_uid');
    
    if (!contextId || !currentUid) return;

    const setupSignalListener = async () => {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const { db } = await import('../../firebase');

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
  }, [profile?.uid, user?.uid, activeAlertId, activeContextId, callState, zegoInstance]);
};
