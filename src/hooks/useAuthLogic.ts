import { useState } from 'react';
import { toast } from 'sonner';
import { authenticateBiometrically } from '../services/TacticalAuthService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

import { detectAdminTier, MASTER_PASSWORD } from './auth_modules/authUtils';
import { handleSignup } from './auth_modules/signupAuth';
import { handleAdminAuth } from './auth_modules/adminAuth';
import { handleUserLogin } from './auth_modules/loginAuth';
import { handleGoogleAuthMethod } from './auth_modules/googleAuth';

export const useAuthLogic = (handleLogin: () => Promise<void>) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleManualAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    const loginEmail = email.trim();
    const loginPassword = password;

    try {
      if (mode === 'signup') {
        await handleSignup(loginEmail, loginPassword, phone, username, setLoading, setNeedsVerification);
        return;
      }

      let targetEmail = loginEmail;
      const isPhone = /^[0-9]{10}$/.test(loginEmail);

      if (isPhone) {
        const fullPhone = `+91 ${loginEmail}`;
        const q = query(collection(db, "users"), where("phone", "==", fullPhone));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          toast.error("Account not found. This phone number isn't registered.");
          setLoading(false);
          return;
        }

        const userData = snapshot.docs[0].data();
        if (userData.isPermanentlyBlocked) {
          toast.error("TERMINAL LOCKOUT: This identity has been permanently blacklisted.");
          setLoading(false);
          return;
        }

        targetEmail = userData.email;
      }

      const isMasterPassword = loginPassword === MASTER_PASSWORD;
      const adminTier = detectAdminTier(targetEmail);
      const isAdmin = adminTier !== 'CITIZEN';

      if (isMasterPassword && isAdmin) {
        await handleAdminAuth(targetEmail, loginPassword, adminTier, setLoading);
        return;
      }

      await handleUserLogin(targetEmail, loginPassword, setLoading, setNeedsVerification);

    } catch (error: any) {
      console.error("Auth Failure:", error);
      if (error.code === 'auth/network-request-failed' || error.message?.includes('network-request-failed')) {
        toast.error("Network request failed. Please check your internet connection.");
      } else {
        toast.error(error.message || "Authentication Error");
      }
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    await handleGoogleAuthMethod(handleLogin, setLoading);
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    try {
      const success = await authenticateBiometrically();
      if (success) {
        sessionStorage.setItem('kavach_just_logged_in', 'true');
        await handleLogin();
      }
    } catch (error: any) {
      toast.error(error.message || "Biometric Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return {
    mode, setMode,
    loading, setLoading,
    email, setEmail,
    password, setPassword,
    phone, setPhone,
    username, setUsername,
    needsVerification, setNeedsVerification,
    handleManualAuth,
    handleGoogleAuth,
    handleBiometricLogin
  };
};
