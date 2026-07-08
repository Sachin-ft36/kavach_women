import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { updateDoc, doc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../../../services/KavachNative';
import { stopWebSiren } from '../../../utils/sirenUtils';
import { useKavachStore } from '../../../state/useKavachStore';
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
    
    const alertId = useKavachStore.getState().activeAlertId;

    stopWebSiren();
    if (Capacitor.isNativePlatform()) {
      KavachSafe.stopForensicCapture();
      KavachSafe.stopContinuousSiren();
    }

    // ⚡ OPTIMISTIC UI CLOSE: Instantly reset modal states so UI reacts in <100ms
    setShowAbortReason(false);
    setAbortReason('');
    setIsAborting(false);
    toast.success("Mission De-escalated. Grid Restored.");

    // 📡 Execute database sync and archiving in the background
    (async () => {
      try {
        await setSOSActive(false, alertId, triggerMethod, abortReason);
      } catch (e: any) {
        console.warn("⚠️ SOS Grid Sync: Background update failed.", e);
      }

      // 🎯 STRIKE DETECTION: Was this a false alarm?
      if (alertId && user?.uid) {
        try {
          const { db } = await import('../../../firebase');
          const { doc, getDoc, updateDoc, increment, serverTimestamp } = await import('firebase/firestore');

          const alertSnap = await getDoc(doc(db, 'alerts', alertId));
          const alertData = alertSnap.exists() ? alertSnap.data() : null;

          // Time from alert creation to closure
          const createdMs = alertData?.createdAt?.toMillis
            ? alertData.createdAt.toMillis()
            : (typeof alertData?.createdAt === 'number' ? alertData.createdAt : 0);
          const durationMs = createdMs > 0 ? Date.now() - createdMs : Infinity;

          // False-alarm keywords in reason
          const falseAlarmKeywords = ['false', 'mistake', 'accident', 'wrong', 'test', 'prank', 'fun', 'joke', 'fake', 'ghalti', 'bhool', 'galti'];
          const reasonLower = abortReason.toLowerCase();
          const isFalseReason = falseAlarmKeywords.some(kw => reasonLower.includes(kw));

          // Short close < 2 min = suspicious
          const isShortDuration = durationMs < 2 * 60 * 1000;

          if (isFalseReason || isShortDuration) {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            const currentStrikes = userSnap.exists() ? (userSnap.data().sosStrikeCount || 0) : 0;
            const newStrikes = currentStrikes + 1;

            await updateDoc(userRef, {
              sosStrikeCount: increment(1),
              lastFalseAlarmAt: serverTimestamp(),
              lastFalseAlarmReason: abortReason,
            });

            const strikeMessages: Record<number, string> = {
              1: '⚠️ Strike 1/4: Next SOS restricted to 3 hours.',
              2: '🔴 Strike 2/4: Next SOS restricted to 12 hours.',
              3: '🚨 Strike 3/4: Next SOS blocked for 48 hours.',
              4: '🚫 Strike 4/4: SOS access suspended.',
            };

            toast.warning(strikeMessages[newStrikes] || '🚫 SOS privileges suspended.', {
              description: 'Misuse of the emergency system puts real lives at risk.',
              duration: 8000,
            });

            console.warn(`🛡️ KAVACH STRIKE: User ${user.uid} now has ${newStrikes} strike(s). Reason: ${isFalseReason ? 'false reason' : 'short duration'}`);
          }
        } catch (strikeErr) {
          console.warn('⚠️ KAVACH: Strike update failed:', strikeErr);
        }
      }
    })();
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
