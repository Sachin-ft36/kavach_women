import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useKavachStore } from '../store/useKavachStore';
import { registerPlugin } from '@capacitor/core';
import { toast } from 'sonner';

const KavachNative = registerPlugin<any>('KavachPlugin');

export default function RemoteCommandListener() {
  const { activeAlertId, isSOSActive } = useKavachStore();

  useEffect(() => {
    if (!isSOSActive || !activeAlertId) return;

    console.log("📡 KAVACH: Remote Command Listener Activated for Alert:", activeAlertId);

    const unsubscribe = onSnapshot(doc(db, 'alerts', activeAlertId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // 🚨 REMOTE SIREN TRIGGER
        if (data.remote_siren === true) {
          console.warn("🚨 STRATEGIC COMMAND: Remote Siren Triggered by SuperCell.");
          toast.error("REMOTE COMMAND: SIREN ACTIVATED BY COMMAND CENTER", {
            duration: 5000,
            style: { background: '#dc2626', color: 'white', fontWeight: 'bold' }
          });
          
          KavachNative.startContinuousSiren().catch((e: any) => {
            console.error("Failed to start remote siren:", e);
          });
        }
      }
    });

    return () => unsubscribe();
  }, [isSOSActive, activeAlertId]);

  return null;
}
