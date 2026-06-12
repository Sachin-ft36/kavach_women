import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { updateDoc, doc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../../../services/KavachNative';
import { stopWebSiren } from '../../../utils/sirenUtils';
import { useKavachStore } from '../../../store/useKavachStore';
import { useSosMission } from '../../../hooks/useSosMission';

export function useSOSScreenActions(isAIChatOpen: boolean) {
  const { user, safetyPin, triggerMethod, setSOSActive } = useKavachStore();
  const { setShowSafetyVerification } = useSosMission();
  
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  const [showAbortReason, setShowAbortReason] = useState(false);
  const [abortReason, setAbortReason] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [isStealthDisguised, setIsStealthDisguised] = useState(false);
  const [isAborting, setIsAborting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const q = collection(db, "commandhub_chats", user.uid, "messages");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentCount = snapshot.size;
      setTotalMessages(prev => {
        if (!isAIChatOpen && prev > 0 && currentCount > prev) {
          setUnreadCount(u => u + (currentCount - prev));
        }
        return currentCount;
      });
    });
    return () => unsubscribe();
  }, [user?.uid, isAIChatOpen]);

  useEffect(() => {
    if (isAIChatOpen) setUnreadCount(0);
  }, [isAIChatOpen]);

  const handleConfirmSafety = async () => {
    const alertId = useKavachStore.getState().activeAlertId;
    setShowSafetyVerification(false);
    try {
      toast.info("Finalizing Mission Clearance...");
      await setSOSActive(false, alertId, triggerMethod, 'Verified Safe: Rescue Completed');
      toast.success("Mission Verified. Safety Grid Restored.");
    } catch (e) {
      console.error("Safety Clearance Error:", e);
      setSOSActive(false);
    }
  };

  const handleRequestMoreHelp = async () => {
    const alertId = useKavachStore.getState().activeAlertId;
    if (!alertId) return;
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        status: 'responding',
        victimSafetyStatus: 'needs_help',
        reopenedAt: serverTimestamp()
      });
      setShowSafetyVerification(false);
      toast.error("Assistance Request Relayed. Grid Active.");
    } catch (e) {
      toast.error("Failed to relay request.");
    }
  };

  const handleAbort = async () => {
    setShowPinOverlay(true);
  };

  const handlePinSubmit = async (digit: string) => {
    const newPin = enteredPin + digit;
    if (newPin.length <= 4) {
      setEnteredPin(newPin);
      if (newPin.length === 4) {
        if (newPin === safetyPin) {
          setShowAbortReason(true);
          setShowPinOverlay(false);
          setEnteredPin('');
          toast.success("PIN Verified. Provide Clearance Reason.");
        } else {
          toast.error("Invalid Secret PIN. Access Denied.");
          setEnteredPin('');
        }
      }
    }
  };

  const handleFinalAbort = async () => {
    if (!abortReason.trim()) {
      toast.error("Please provide a mission clearance reason.");
      return;
    }
    setIsAborting(true);
    const alertId = useKavachStore.getState().activeAlertId;

    stopWebSiren();
    if (Capacitor.isNativePlatform()) {
      KavachSafe.stopForensicCapture();
      KavachSafe.stopContinuousSiren();
    }

    setSOSActive(false);
    setShowAbortReason(false);
    setAbortReason('');
    setIsAborting(false);
    toast.success("Mission De-escalated. Grid Restored.");

    try {
      await setSOSActive(false, alertId, triggerMethod, abortReason);
    } catch (e: any) {
      console.warn("⚠️ SOS Grid Sync: Background update failed.", e);
    }
  };

  return {
    showPinOverlay, setShowPinOverlay,
    showAbortReason, setShowAbortReason,
    abortReason, setAbortReason,
    enteredPin, setEnteredPin,
    unreadCount, setUnreadCount,
    isStealthDisguised, setIsStealthDisguised,
    isAborting,
    handleConfirmSafety,
    handleRequestMoreHelp,
    handleAbort,
    handlePinSubmit,
    handleFinalAbort
  };
}
