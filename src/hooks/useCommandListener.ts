import { useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useKavachStore } from '../state/useKavachStore';
import { KavachSafe } from '../services/KavachNative';
import { toast } from 'sonner';

export function useCommandListener() {
  const { user, isSOSActive, setSOSActive } = useKavachStore();

  useEffect(() => {
    if (!user?.uid) return;

    // Listen for pending commands targeted at this citizen user
    const q = query(
      collection(db, 'commands'),
      where('targetUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      snap.docs.forEach(async (document) => {
        const cmdData = document.data();
        const cmdId = document.id;
        const command = cmdData.command;

        console.log(`📡 KAVACH COMMAND ENGINE: Received remote command "${command}"`);

        try {
          // Acknowledge command immediately by setting status to executing
          await updateDoc(doc(db, 'commands', cmdId), {
            status: 'executing',
            executedAt: serverTimestamp()
          });

          // Execute corresponding override action
          switch (command) {
            case 'ring_phone':
              // Sound standard ringtone / alert audio
              if ('speechSynthesis' in window) {
                const msg = new SpeechSynthesisUtterance("Attention! Safe contact is ringing your device.");
                window.speechSynthesis.speak(msg);
              }
              // Ring device via native API or fallback vibration
              if (navigator.vibrate) navigator.vibrate([100, 100, 200, 100, 500]);
              toast.info("🚨 Remote Ring command executed by Guardian.");
              break;

            case 'trigger_sos':
              if (!isSOSActive) {
                await setSOSActive(true, null, 'remote');
                toast.warning("🚨 EMERGENCY: SOS triggered remotely by Guardian!");
              }
              break;

            case 'siren':
              // Continuous siren alarm
              KavachSafe.startContinuousSiren();
              toast.warning("🚨 Continuous emergency siren activated remotely!");
              break;

            case 'ping_location':
              // Re-sync location to update Firestore
              await useKavachStore.getState().syncLocation();
              toast.info("📍 Live location updated via remote query.");
              break;

            case 'check_in':
              // Trigger pending check-in warning / prompt
              toast.warning("🔔 SAFETY CHECK-IN REQUESTED BY GUARDIAN!", {
                duration: 10000,
                description: "Tap to confirm you are safe."
              });
              // Vibrate to alert user
              if (navigator.vibrate) navigator.vibrate([500, 300, 500]);
              break;

            default:
              console.warn(`⚠️ KAVACH COMMAND ENGINE: Unknown command "${command}"`);
          }

          // Mark command as completed
          await updateDoc(doc(db, 'commands', cmdId), {
            status: 'completed',
            completedAt: serverTimestamp()
          });

        } catch (err: any) {
          console.error(`❌ Failed to execute command ${command}:`, err);
          await updateDoc(doc(db, 'commands', cmdId), {
            status: 'failed',
            error: err.message || 'Execution error'
          }).catch(() => {});
        }
      });
    }, (err) => {
      console.error("📡 Command engine listener error:", err);
    });

    return () => unsubscribe();
  }, [user?.uid, isSOSActive]);
}
