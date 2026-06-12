import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export const useProtectorCarSimulation = (isCarScreenOpen: boolean, respondingToId: string | null, isNavigating: boolean, isOnDuty: boolean, profile: any) => {
  const [carSpeed, setCarSpeed] = useState(0);
  const [etaTimer, setEtaTimer] = useState('01:48.6');
  const [etaRemainingMs, setEtaRemainingMs] = useState(108600);
  const [inactivityCountdown, setInactivityCountdown] = useState<number | null>(null);
  const [isInactivityTriggered, setIsInactivityTriggered] = useState(false);

  useEffect(() => {
    if (!isCarScreenOpen) return;

    if (respondingToId && etaRemainingMs === 108600) {
      setEtaRemainingMs(108600);
    }

    const interval = setInterval(() => {
      if (respondingToId) {
        if (isNavigating) {
          setCarSpeed(prev => {
            const delta = Math.floor(Math.random() * 5) - 2;
            const nextSpeed = prev === 0 ? 79 : prev + delta;
            return Math.max(72, Math.min(86, nextSpeed));
          });
          setEtaRemainingMs(prev => (prev <= 100 ? 0 : prev - 100));
        } else {
          setCarSpeed(prev => Math.max(0, prev - 4));
        }
      } else {
        if (isOnDuty) {
          setCarSpeed(prev => {
            if (prev > 45) return prev - 8;
            const delta = Math.floor(Math.random() * 3) - 1;
            const nextSpeed = prev === 0 ? 24 : prev + delta;
            return Math.max(18, Math.min(35, nextSpeed));
          });
        } else {
          setCarSpeed(0);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCarScreenOpen, respondingToId, isNavigating, isOnDuty, etaRemainingMs]);

  useEffect(() => {
    if (respondingToId && isNavigating) {
      const totalTenths = Math.floor(etaRemainingMs / 100);
      const minutes = Math.floor(totalTenths / 600);
      const seconds = Math.floor((totalTenths % 600) / 10);
      const tenths = totalTenths % 10;

      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      setEtaTimer(`${mm}:${ss}.${tenths}`);
    } else if (respondingToId) {
      setEtaTimer('01:48.6');
    } else {
      setEtaTimer('—');
    }
  }, [etaRemainingMs, respondingToId, isNavigating]);

  useEffect(() => {
    if (!respondingToId) {
      setInactivityCountdown(null);
      setIsInactivityTriggered(false);
      return;
    }

    if (carSpeed === 0 && !isInactivityTriggered) {
      if (inactivityCountdown === null) {
        setInactivityCountdown(15);
      }
    } else {
      setInactivityCountdown(null);
    }
  }, [respondingToId, carSpeed, isInactivityTriggered]);

  useEffect(() => {
    if (inactivityCountdown === null || inactivityCountdown <= 0) {
      if (inactivityCountdown === 0 && !isInactivityTriggered && respondingToId) {
        setIsInactivityTriggered(true);
        toast.error("⚠️ STANDSTILL CRITICAL WARNING: Inactivity Escalated to HQ Supercell!");
        updateDoc(doc(db, 'alerts', respondingToId), {
          inactivityEscalated: true,
          inactiveOfficerName: profile?.name || 'PCR Officer',
          inactiveOfficerVehicle: profile?.vehicleNo || 'PCR-TBD',
          inactivityTriggeredAt: serverTimestamp()
        }).catch(() => { });
      }
      return;
    }

    const timer = setTimeout(() => {
      setInactivityCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [inactivityCountdown, isInactivityTriggered, respondingToId, profile]);

  return {
    carSpeed,
    etaTimer,
    inactivityCountdown,
    isInactivityTriggered
  };
};
