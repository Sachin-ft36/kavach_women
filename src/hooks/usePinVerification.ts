import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export function usePinVerification(safetyPin: string | null | undefined, onSuccess: () => void, onCloseModal: () => void) {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (!isLockedOut || lockoutSeconds <= 0) return;
    const t = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) { clearInterval(t); setIsLockedOut(false); setAttempts(0); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isLockedOut, lockoutSeconds]);

  const handleOpenPinModal = () => {
    setEnteredPin('');
    setPinError(false);
    setIsPinModalOpen(true);
  };

  const handlePinKey = useCallback((val: string) => {
    if (isLockedOut) return;
    setEnteredPin(prev => {
      if (prev.length >= 4) return prev;
      return prev + val;
    });
    setPinError(false);
  }, [isLockedOut]);

  const handlePinClear = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setPinError(false);
  };

  const handlePinSubmit = useCallback(() => {
    if (enteredPin.length < 4) return;

    if (!safetyPin) {
      toast.info('No PIN configured. Returning to Kavach.');
      setIsPinModalOpen(false);
      onSuccess();
      return;
    }

    if (enteredPin === safetyPin) {
      toast.success('Identity Verified. Returning to KAVACH.', { icon: '🛡️' });
      setIsPinModalOpen(false);
      setEnteredPin('');
      setAttempts(0);
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPinError(true);
      setEnteredPin('');
      if (newAttempts >= 5) {
        setIsLockedOut(true);
        setLockoutSeconds(30);
        toast.error('Too many failed attempts. Locked for 30 seconds.', { duration: 5000 });
      } else {
        toast.error(`Incorrect PIN. ${5 - newAttempts} attempt(s) remaining.`);
      }
    }
  }, [enteredPin, safetyPin, attempts, onSuccess]);

  useEffect(() => {
    if (enteredPin.length === 4) handlePinSubmit();
  }, [enteredPin, handlePinSubmit]);

  const handleCancel = () => {
    setIsPinModalOpen(false);
    setEnteredPin('');
    setPinError(false);
    onCloseModal();
  };

  return {
    isPinModalOpen,
    enteredPin,
    pinError,
    isLockedOut,
    lockoutSeconds,
    handleOpenPinModal,
    handlePinKey,
    handlePinClear,
    handlePinSubmit,
    handleCancel
  };
}
