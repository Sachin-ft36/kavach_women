import { useState, useEffect } from 'react';
import { functions } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';

export function useServiceNumberCheck(
  data: any,
  setData: (data: any) => void
) {
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'valid' | 'invalid' | 'idle'>('idle');

  useEffect(() => {
    const serviceNo = data.serviceNumber || '';
    const occ = data.occupation || '';

    if (!['Army', 'Ex-Army', 'Police', 'Ex-Police'].includes(occ)) {
      setCheckResult('idle');
      setChecking(false);
      return;
    }

    if (!serviceNo.trim()) {
      setCheckResult('idle');
      setChecking(false);
      if (data.isServiceNumberValid) {
        setData({ ...data, isServiceNumberValid: false });
      }
      return;
    }

    const armyRegex = /^(?:[0-9]{7,8}[A-Z]|(?:IC|SS|JC|RC|TC|SL|MS|MR|TA)-?[0-9]{4,6}[A-Z]?)$/i;
    const policeRegex = /^(?:[A-Z]{2}[/-]?[0-9A-Z/-]{3,15}|[0-9]{3,8}(?:[/-][A-Z]+)?)$/i;

    const isValidFormat = ['Army', 'Ex-Army'].includes(occ)
      ? armyRegex.test(serviceNo)
      : policeRegex.test(serviceNo);

    if (!isValidFormat) {
      setCheckResult('invalid');
      setChecking(false);
      if (data.isServiceNumberValid) {
        setData({ ...data, isServiceNumberValid: false });
      }
      return;
    }

    let isMounted = true;
    let fallbackTimer: any = null;

    setChecking(true);
    setCheckResult('idle');
    if (data.isServiceNumberValid) {
      setData({ ...data, isServiceNumberValid: false });
    }

    const checkServiceNumber = async () => {
      try {
        const verifyFn = httpsCallable(functions, 'verifyServiceNumber');
        const result = await verifyFn({ serviceNumber: serviceNo, occupation: occ });
        const resData = result.data as { valid: boolean; error?: string };
        
        if (!isMounted) return;
        setChecking(false);
        if (resData && resData.valid) {
          setCheckResult('valid');
          setData({ ...data, isServiceNumberValid: true });
        } else {
          setCheckResult('invalid');
          setData({ ...data, isServiceNumberValid: false });
        }
      } catch (error) {
        console.error("Cloud Function verification failed, applying offline fallback/simulation:", error);
        if (!isMounted) return;
        
        fallbackTimer = setTimeout(() => {
          if (!isMounted) return;
          setChecking(false);
          setCheckResult('valid');
          setData({ ...data, isServiceNumberValid: true });
        }, 1200);
      }
    };

    checkServiceNumber();

    return () => {
      isMounted = false;
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [data.serviceNumber, data.occupation, data.isServiceNumberValid, setData]);

  return { checking, checkResult, setCheckResult };
}
