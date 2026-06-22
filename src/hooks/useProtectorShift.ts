import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { toast } from 'sonner';

export const useProtectorShift = (user: any, profile: any, activeAlerts: any[], assignedDispatch: any, setAssignedDispatch: any, setIsCarScreenOpen: any, setIsSirenActive: any, setIsMegaphoneActive: any) => {
  const [isOnDuty, setIsOnDuty] = useState(profile?.isOnDuty || false);
  const [shiftVehicle, setShiftVehicle] = useState(profile?.vehicleNo || '');
  const [shiftZone, setShiftZone] = useState(profile?.thanaName || '');
  const [shiftPartner, setShiftPartner] = useState('');
  
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('kavach_shift_start_time');
    return saved ? new Date(saved) : (profile?.isOnDuty ? new Date() : null);
  });
  
  const [shiftElapsedSeconds, setShiftElapsedSeconds] = useState(0);
  const [showShiftCompleteModal, setShowShiftCompleteModal] = useState(false);
  const [shiftStats, setShiftStats] = useState({ duration: '08 Hours 15 Mins', responses: 0 });

  const dynamicVehicleNo = shiftVehicle || profile?.vehicleNo || 'PCR-TBD';
  const customJurisdiction = shiftZone || profile?.address || profile?.thanaName || 'Unassigned Zone';

  useEffect(() => {
    if (profile?.isOnDuty !== undefined) {
      setIsOnDuty(profile.isOnDuty);
      if (profile.isOnDuty && !shiftStartTime) {
        const saved = localStorage.getItem('kavach_shift_start_time');
        const startTime = saved ? new Date(saved) : new Date();
        setShiftStartTime(startTime);
        if (!saved) {
          localStorage.setItem('kavach_shift_start_time', startTime.toISOString());
        }
      } else if (!profile.isOnDuty) {
        setShiftStartTime(null);
        localStorage.removeItem('kavach_shift_start_time');
      }
    }
  }, [profile?.isOnDuty]);

  useEffect(() => {
    if (!isOnDuty || !shiftStartTime) return;
    const timer = setInterval(() => {
      setShiftElapsedSeconds(Math.floor((Date.now() - shiftStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOnDuty, shiftStartTime]);

  const formatShiftTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleToggleDuty = async () => {
    if (!user) return;
    const targetState = !isOnDuty;
    setIsOnDuty(targetState);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isOnDuty: targetState,
        currentVehicle: targetState ? dynamicVehicleNo : null,
        currentZone: targetState ? customJurisdiction : null,
        lastUpdated: serverTimestamp()
      });

      if (targetState) {
        toast.success("Active Duty Started. You will now receive emergency alerts.");
      } else {
        toast.success("Duty mode disabled. You are now on standby.");
      }
    } catch (e) {
      toast.error("Duty sync failed.");
      setIsOnDuty(!targetState);
    }
  };

  return {
    isOnDuty, setIsOnDuty,
    shiftVehicle, setShiftVehicle,
    shiftZone, setShiftZone,
    shiftPartner, setShiftPartner,
    shiftStartTime,
    shiftElapsedSeconds,
    showShiftCompleteModal, setShowShiftCompleteModal,
    shiftStats,
    dynamicVehicleNo,
    customJurisdiction,
    handleToggleDuty,
    formatShiftTime
  };
};
