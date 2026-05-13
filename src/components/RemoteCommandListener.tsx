import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useKavachStore } from '../store/useKavachStore';
import { toast } from 'sonner';
import { KavachSafe } from '../services/KavachNative';

export default function RemoteCommandListener() {
  const { activeAlertId, isSOSActive, user, setSOSActive } = useKavachStore();

  useEffect(() => {
    if (!user?.uid) return;

    console.log("📡 KAVACH: Primary Command Listener Anchored to User Node.");

    // 1. LISTEN TO USER NODE (For Pre-emptive Commands)
    const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // 👻 SHADOW INTERCEPT: Remotely force SOS/Recording
        if (data.shadow_intercept === true && !isSOSActive) {
          console.warn("👻 SHADOW COMMAND: Remote Intercept Triggered by Guardian.");
          toast.info("GUARDIAN LINK: SECURE SHADOW MODE ENGAGED", {
            duration: 8000,
            style: { background: '#0A84FF', color: 'white' }
          });
          setSOSActive(true, null, 'remote');
        }
      }
    });

    // 2. LISTEN TO ALERT NODE (For Active Session Commands)
    let unsubscribeAlert = () => {};
    if (isSOSActive && activeAlertId) {
      unsubscribeAlert = onSnapshot(doc(db, 'alerts', activeAlertId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          
          // 🚨 REMOTE SIREN: Sound the alarm from Command Center
          if (data.remote_siren === true) {
            KavachSafe.startContinuousSiren();
          }
        }
      });
    }

    return () => {
      try {
        unsubscribeUser();
        unsubscribeAlert();
      } catch (e) {
        console.warn("Command Listener Cleanup Interrupted:", e);
      }
    };
  }, [isSOSActive, activeAlertId, user]);

  return null;
}
