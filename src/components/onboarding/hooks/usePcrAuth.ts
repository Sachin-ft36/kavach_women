import { useState } from 'react';
import { toast } from 'sonner';

export function usePcrAuth(
  role: 'citizen' | 'protector' | 'pcr_officer' | null,
  setRole: (val: 'citizen' | 'protector' | 'pcr_officer') => void
) {
  const [showAuth, setShowAuth] = useState(false);
  const [passcode, setPasscode] = useState('');

  const handlePcrClick = () => {
    setShowAuth(true);
    setPasscode('');
  };

  const handleAuthSubmit = () => {
    if (passcode === 'Singhsachin@#0012') {
      setRole('pcr_officer');
      setShowAuth(false);
      toast.success("PCR Authorization Successful");
    } else {
      toast.error("Invalid Passcode", { description: "Please check your passcode and try again." });
      setPasscode('');
    }
  };

  const handleAuthCancel = () => {
    setShowAuth(false);
  };

  const handleCardClick = (targetRole: 'citizen' | 'protector' | 'pcr_officer') => {
    if (targetRole === 'pcr_officer' && role !== 'pcr_officer') {
      handlePcrClick();
    } else {
      setRole(targetRole);
    }
  };

  return {
    showAuth,
    passcode,
    setPasscode,
    handleAuthSubmit,
    handleAuthCancel,
    handleCardClick
  };
}
