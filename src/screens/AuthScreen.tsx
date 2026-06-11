import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Globe, Mail, ShieldCheck, Lock, MapPin, Siren, ChevronDown, User, Users, Landmark, BriefcaseMedical, ShieldAlert, Award, AlertCircle, Building, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { auth, db } from '../firebase';
import { useKavachStore } from '../store/useKavachStore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  signInAnonymously,
  signInWithRedirect,
  signOut
} from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { authenticateBiometrically } from '../services/TacticalAuthService';
import { Capacitor } from '@capacitor/core';

// 🔑 MASTER PASSWORD FOR ADMIN BYPASS
const MASTER_PASSWORD = "Singhsachin@#0012";

// Admin tier detector
const detectAdminTier = (email: string): 'NATIONAL' | 'STATE' | 'DISTRICT' | 'PROTECTOR' | 'CITIZEN' => {
  const e = email.toLowerCase();
  if (e === 'admin') return 'NATIONAL';
  if (e.includes('adminsachin') && e.split('.').length >= 3) {
    const parts = e.split('@')[0].split('.');
    if (parts.length >= 3) return 'DISTRICT';
    return 'STATE';
  }
  if (e.includes('adminsachin')) return 'STATE';
  if (e.includes('protector')) return 'PROTECTOR';
  return 'CITIZEN';
};

import LoginView from '../components/auth/LoginView';
import SignupView from '../components/auth/SignupView';
import ForgotPassword from '../components/auth/ForgotPassword';


interface AuthScreenProps {
  handleLogin: () => Promise<void>;
  onResetLanguage: () => void;
}

export default function AuthScreen({ handleLogin, onResetLanguage }: AuthScreenProps) {
  const { t, language, setLanguage } = useLanguage();

  const langs = [
    { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { id: 'en', label: 'English', sub: 'Primary' },
    { id: 'hinglish', label: 'Hinglish', sub: 'Hinglish' },
    { id: 'ml', label: 'മലയാളം', sub: 'Malayalam' },
    { id: 'pa', label: 'ਪੰਜਾਬੀ', sub: 'Punjabi' },
    { id: 'mr', label: 'मराठी', sub: 'Marathi' },
    { id: 'ta', label: 'தமிழ்', sub: 'Tamil' },
    { id: 'bn', label: 'বাংলা', sub: 'Bengali' },
    { id: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' },
    { id: 'te', label: 'తెలుగు', sub: 'Telugu' },
    { id: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' },
    { id: 'or', label: 'ଓଡ଼ିଆ', sub: 'Odia' },
    { id: 'as', label: 'অসমীয়া', sub: 'Assamese' },
    { id: 'ur', label: 'اردو', sub: 'Urdu' },
    { id: 'bho', label: 'भोजपुरी', sub: 'Bhojpuri' }
  ];
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  // Core Manual Login & Signup handler
  const handleManualAuth = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    const loginEmail = email.trim();
    const loginPassword = password;

    try {
      // 1. SIGNUP PIPELINE
      if (mode === 'signup') {
        const fullPhone = `+91 ${phone.trim()}`;

        // Ensure unique phone number
        const q = query(collection(db, "users"), where("phone", "==", fullPhone));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          toast.error("This phone number is already registered.");
          setLoading(false);
          return;
        }

        // Create Firebase Auth Account
        const userCred = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);

        // Update user profile metadata
        await updateProfile(userCred.user, { displayName: username });
        await sendEmailVerification(userCred.user);

        // Sync profile to database (Unverified citizen by default)
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          email: loginEmail,
          phone: fullPhone,
          username,
          role: 'citizen',
          createdAt: new Date().toISOString(),
          isRegistered: false,
          isVerified: false,
          verificationStatus: 'pending'
        });

        toast.info("Verification link sent! Please verify your email.");
        setNeedsVerification(true);
        await signOut(auth);
        setLoading(false);
        return;
      }

      // 2. LOGIN PIPELINE
      let targetEmail = loginEmail;
      const isPhone = /^[0-9]{10}$/.test(loginEmail);

      // Check phone login alias
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

      // 🔐 Check Master Password Admin Bypass
      const isMasterPassword = loginPassword === MASTER_PASSWORD;
      const adminTier = detectAdminTier(targetEmail);
      const isAdmin = adminTier !== 'CITIZEN';

      if (isMasterPassword && isAdmin) {
        sessionStorage.removeItem('kavach_dev_logout'); // Clear local logout block

        try {
          // Attempt standard sign in
          const userCred = await signInWithEmailAndPassword(auth, targetEmail, loginPassword);
          const uid = userCred.user.uid;

          // Provision the admin settings in Firestore
          const displayName = targetEmail.includes('admin') ? 'NATIONAL COMMANDER' : 'COMMAND ADMIN';
          await setDoc(doc(db, 'users', uid), {
            uid: uid,
            email: targetEmail,
            username: displayName,
            role: 'admin',
            isRegistered: true,
            isVerified: true,
            createdAt: new Date().toISOString()
          }, { merge: true });

          sessionStorage.setItem('kavach_just_logged_in', 'true');
          sessionStorage.setItem('kavach_admin_tier', adminTier);
          toast.success(`Access Granted: ${displayName}`);

          // Re-enable network in case it was disabled previously
          try {
            const { enableNetwork } = await import('firebase/firestore');
            await enableNetwork(db);
            console.log("🔌 KAVACH: Firestore network enabled for live admin session.");
          } catch (e) { }

          // Let the app re-mount and transition
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (authError: any) {
          console.warn("Direct Firebase auth failed. Attempting to auto-create admin account online...", authError);

          try {
            // Attempt to create the user account online
            const userCred = await createUserWithEmailAndPassword(auth, targetEmail, loginPassword);
            const uid = userCred.user.uid;

            // Provision the admin settings in Firestore
            const displayName = targetEmail.includes('admin') ? 'NATIONAL COMMANDER' : 'COMMAND ADMIN';
            await setDoc(doc(db, 'users', uid), {
              uid: uid,
              email: targetEmail,
              username: displayName,
              role: 'admin',
              isRegistered: true,
              isVerified: true,
              createdAt: new Date().toISOString()
            }, { merge: true });

            sessionStorage.setItem('kavach_just_logged_in', 'true');
            sessionStorage.setItem('kavach_admin_tier', adminTier);
            toast.success(`Admin Account Created & Access Granted: ${displayName}`);

            // Re-enable network in case it was disabled previously
            try {
              const { enableNetwork } = await import('firebase/firestore');
              await enableNetwork(db);
              console.log("🔌 KAVACH: Firestore network enabled for live admin session.");
            } catch (e) { }

            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } catch (createError) {
            console.error("Auto-creation failed. Accessing Command Center offline...", createError);

            // Fallback to local offline Mock Developer Profile
            try {
              const { disableNetwork } = await import('firebase/firestore');
              await disableNetwork(db);
              console.log("🔌 KAVACH: Firestore network disabled due to offline/failed login.");
            } catch (e) { }

            const mockUser = {
              uid: 'mock_dev_uid_123',
              email: 'admin@kavach.gov.in',
              displayName: 'Developer Admin',
              phoneNumber: '9999999999'
            } as any;
            const devProfile = {
              uid: 'mock_dev_uid_123',
              email: 'admin@kavach.gov.in',
              username: 'Developer Admin',
              role: 'admin' as const,
              isRegistered: true,
              isVerified: true,
              gender: 'male'
            };

            const store = useKavachStore.getState();
            store.setUser(mockUser);
            store.setRole('admin');
            store.setRegistered(true);
            store.setVerified(true);
            store.setGender('male');
            store.setProfile(devProfile);

            toast.success("Offline Developer Bypass Engaged!");
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }

        setLoading(false);
        return;
      }

      // Standard Login Flow
      const userCred = await signInWithEmailAndPassword(auth, targetEmail, loginPassword);

      // Verify email status
      if (!userCred.user.emailVerified) {
        toast.warning("Verification Required: Please verify your email first.");
        setNeedsVerification(true);
        await signOut(auth);
        setLoading(false);
        return;
      }

      // Check account blacklist status
      const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", userCred.user.uid)));
      if (!userDoc.empty && userDoc.docs[0].data().isPermanentlyBlocked) {
        await signOut(auth);
        toast.error("TERMINAL LOCKOUT: This identity is permanently blacklisted.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem('kavach_just_logged_in', 'true');
      toast.success("Login successful.");
    } catch (error: any) {
      console.error("Auth Failure:", error);
      if (error.code === 'auth/network-request-failed' || error.message?.includes('network-request-failed')) {
        toast.error("Network request failed. Please check your internet connection.");
      } else {
        toast.error(error.message || "Authentication Error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Authentication handler with Popup-to-Redirect fallback
  const handleGoogleAuth = async () => {
    setLoading(true);
    sessionStorage.setItem('kavach_just_logged_in', 'true');

    if (Capacitor.isNativePlatform()) {
      try {
        await handleLogin();
      } catch (err: any) {
        console.error("Native Google sign-in failed:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      const userCred = await signInWithPopup(auth, provider);

      const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", userCred.user.uid)));
      if (!userDoc.empty && userDoc.docs[0].data().isPermanentlyBlocked) {
        await signOut(auth);
        toast.error("TERMINAL LOCKOUT: This identity is blacklisted.");
        setLoading(false);
        return;
      }

      toast.success("Login successful.");
      setLoading(false);
    } catch (popupErr: any) {
      console.warn("⚠️ Popup blocked or security policy conflict. Redirecting to Google Login page...", popupErr);
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectErr: any) {
        console.error("Redirect auth failed:", redirectErr);
        toast.error("Google sign-in is unavailable. Check network or try email/password.");
        setLoading(false);
      }
    }
  };

  // Biometric Login Flow
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

  const KavachShieldLogo = () => (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto flex items-center justify-center select-none">
      {/* Soft blue back glow */}
      <div className="absolute inset-0 bg-[#2563EB]/8 rounded-full blur-xl animate-pulse" />
      <img
        src="/logo.jpeg"
        alt="KAVACH Logo"
        className="w-26 h-26 sm:w-30 sm:h-30 object-contain mix-blend-multiply relative z-10"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F7FC] via-white to-[#F0F4F8] flex flex-col font-sans text-gray-900 selection:bg-[#2563EB]/10 relative w-full overflow-x-hidden">

      {/* Desktop Language Switcher - Aligned horizontally with the Kavach logo */}
      <div className="hidden md:block absolute top-[140px] right-6 lg:right-16 z-20">
        <div className="relative group flex items-center justify-center">
          <select
            value={language}
            translate="no"
            onChange={(e) => setLanguage(e.target.value as any)}
            className="appearance-none flex items-center gap-1.5 pl-8 pr-7 py-1.5 bg-white border border-slate-200 hover:border-[#2563EB] rounded-full text-[11px] font-semibold text-[#0b2545] transition-all shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#2563EB]/50 notranslate"
          >
            {langs.map(l => (
              <option key={l.id} value={l.id} translate="no" className="notranslate">{l.label} ({l.sub})</option>
            ))}
          </select>
          <Globe size={13} className="text-slate-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2563EB] transition-colors" />
          <ChevronDown size={11} className="text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2563EB] transition-colors" />
        </div>
      </div>

      {/* 🌐 Top Government Banner (Open style, no background container box) */}
      <header className="relative z-20 bg-transparent pt-4 pb-0 px-6 sm:px-12 flex justify-between items-start gap-3 w-full max-w-6xl mx-auto select-none">
        {/* Left Side: GOI ministry details */}
        <div className="flex items-center gap-3">
          <img src="/emblem-dark.png" alt="Emblem of India" className="h-10 sm:h-12 w-auto object-contain shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[9.5px] sm:text-[11.5px] font-bold text-[#0B2545] uppercase tracking-wider leading-tight">GOVERNMENT OF INDIA</span>
            <span className="text-[8px] sm:text-[9.5px] text-slate-800 font-semibold uppercase tracking-wide mt-0.5 leading-tight">MINISTRY OF WOMEN & CHILD DEVELOPMENT</span>
            <span className="text-[7px] sm:text-[8.5px] text-slate-500 font-normal tracking-wide mt-0.5 leading-tight">Government Initiative</span>
          </div>
        </div>

        {/* Right Side: Digital India & Mobile Language Switcher */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <img src="/digitalindia.png" alt="Digital India Logo" className="h-9 sm:h-11 w-auto object-contain shrink-0 opacity-95" />
          <div className="block md:hidden">
            <div className="relative group flex items-center justify-center">
              <select
                value={language}
                translate="no"
                onChange={(e) => setLanguage(e.target.value as any)}
                className="appearance-none flex items-center gap-1 pl-6 pr-5 py-1 bg-white border border-slate-200 hover:border-[#2563EB] rounded-full text-[9px] font-semibold text-[#0b2545] transition-all shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#2563EB]/50 notranslate"
              >
                {langs.map(l => (
                  <option key={l.id} value={l.id} translate="no" className="notranslate">{l.label}</option>
                ))}
              </select>
              <Globe size={10} className="text-slate-600 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2563EB] transition-colors" />
              <ChevronDown size={9} className="text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[#2563EB] transition-colors" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start pt-0 pb-2 px-3 sm:px-6 max-w-[440px] w-full mx-auto space-y-3 sm:space-y-5 relative z-10 -mt-6 sm:-mt-10">

        {/* Logo and Headings */}
        <div className="text-center space-y-1 sm:space-y-2">
          <KavachShieldLogo />

          <div className="space-y-0.5">
            <h1 className="text-2xl sm:text-3.5xl font-black tracking-tight text-[#0B2545] leading-none">KAVACH</h1>

            {/* Tricolor accent stripes */}
            <div className="flex items-center justify-center gap-2.5">
              <div className="flex flex-col gap-[2px] w-8 shrink-0">
                <div className="h-[1.5px] bg-[#FF9933] rounded-full" />
                <div className="h-[1.5px] bg-[#138808] rounded-full" />
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#3b82f6] font-bold tracking-[0.2em] uppercase whitespace-nowrap">Official Safety Portal</span>
              <div className="flex flex-col gap-[2px] w-8 shrink-0">
                <div className="h-[1.5px] bg-[#FF9933] rounded-full" />
                <div className="h-[1.5px] bg-[#138808] rounded-full" />
              </div>
            </div>

            <p className="text-[8px] sm:text-[9px] text-slate-500 font-medium uppercase tracking-[0.15em] leading-none mt-1">Authorized Safety Network Access</p>
          </div>
        </div>



        {/* 🔑 Main Authentication Form Container */}
        <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden flex flex-col">

          {/* Integrated tab switcher at top of card */}
          {mode !== 'forgot' && !needsVerification && (
            <div className="flex border-b border-slate-200 select-none">
              <button
                onClick={() => setMode('login')}
                className={cn(
                  "flex-1 py-3.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer",
                  mode === 'login'
                    ? "border-[#1d4ed8] text-[#1d4ed8] bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-700 bg-white"
                )}
              >
                <Lock size={14} strokeWidth={2.5} />
                Login
              </button>
              <button
                onClick={() => setMode('signup')}
                className={cn(
                  "flex-1 py-3.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer",
                  mode === 'signup'
                    ? "border-[#1d4ed8] text-[#1d4ed8] bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-700 bg-white"
                )}
              >
                <User size={14} strokeWidth={2.5} />
                Sign Up
              </button>
            </div>
          )}

          {/* Form Content area */}
          <div className="p-4 sm:p-7">
            <AnimatePresence mode="wait">
              {needsVerification ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5 text-center py-1"
                >
                  <div className="w-14 h-14 bg-[#2563EB]/5 border border-[#2563EB]/10 rounded-[16px] flex items-center justify-center mx-auto">
                    <Mail className="text-[#2563EB]" size={24} />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Identity Verification</h2>
                    <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                      A secure activation link has been transmitted to your registered email. Please verify to initialize protection.
                    </p>
                  </div>
                  <div className="pt-1.5 space-y-3.5">
                    <button
                      onClick={() => window.open('https://mail.google.com', '_blank')}
                      className="w-full py-3.5 bg-[#0B2545] hover:bg-[#1A3A6B] text-white rounded-2xl font-bold uppercase tracking-wider text-xs shadow-md shadow-[#0B2545]/10 active:scale-95 transition-all cursor-pointer"
                    >
                      Launch Mail Gateway
                    </button>
                    <button
                      onClick={() => setNeedsVerification(false)}
                      className="text-[9px] font-black text-slate-400 hover:text-[#2563EB] transition-colors uppercase tracking-widest"
                    >
                      Return to Authentication
                    </button>
                  </div>
                </motion.div>
              ) : mode === 'forgot' ? (
                <ForgotPassword
                  key="forgot-view"
                  onBack={() => setMode('login')}
                  initialEmail={email}
                />
              ) : mode === 'login' ? (
                <LoginView
                  key="login-view"
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  loading={loading}
                  onLogin={handleManualAuth}
                  onGoogleLogin={handleGoogleAuth}
                  onBiometricLogin={handleBiometricLogin}
                  onForgotClick={() => setMode('forgot')}
                  onSignupClick={() => setMode('signup')}
                />
              ) : (
                <SignupView
                  key="signup-view"
                  username={username} setUsername={setUsername}
                  email={email} setEmail={setEmail}
                  phone={phone} setPhone={setPhone}
                  password={password} setPassword={setPassword}
                  loading={loading}
                  onSignup={handleManualAuth}
                  onLoginClick={() => setMode('login')}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Tab Selector Footer Link (Inside the main white card) */}
          {!needsVerification && mode !== 'forgot' && (
            <div className="w-full px-4 sm:px-7 pb-5 sm:pb-7">
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative bg-white px-3 text-slate-500">
                  <ShieldCheck size={16} strokeWidth={2} />
                </div>
              </div>

              <div className="text-center select-none">
                {mode === 'login' ? (
                  <p className="text-[12px] font-semibold text-slate-700">
                    New to KAVACH?{' '}
                    <button
                      onClick={() => setMode('signup')}
                      className="text-[#1d4ed8] font-bold hover:underline cursor-pointer ml-1"
                    >
                      Create Account
                    </button>
                  </p>
                ) : (
                  <p className="text-[12px] font-semibold text-slate-700">
                    Already registered?{' '}
                    <button
                      onClick={() => setMode('login')}
                      className="text-[#1d4ed8] font-bold hover:underline cursor-pointer ml-1"
                    >
                      Login
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* 🌸 Subtle Mandala/Concentric Background Patterns in corners */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 w-[320px] h-[320px] md:w-[480px] md:h-[480px] opacity-[0.06] text-slate-500">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.25">
            <circle cx="50" cy="50" r="46" />
            <circle cx="50" cy="50" r="42" strokeDasharray="1,2" />
            <circle cx="50" cy="50" r="35" />
            <circle cx="50" cy="50" r="28" strokeDasharray="1,15" strokeWidth="1" />
            <circle cx="50" cy="50" r="22" />
            <circle cx="50" cy="50" r="16" strokeDasharray="1,2" />
            <circle cx="50" cy="50" r="10" />
            {/* Radial Spokes */}
            {Array.from({ length: 32 }).map((_, i) => {
              const angle = (i * 360) / 32;
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 10 * Math.cos(rad);
              const y1 = 50 + 10 * Math.sin(rad);
              const x2 = 50 + 46 * Math.cos(rad);
              const y2 = 50 + 46 * Math.sin(rad);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </svg>
        </div>

        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[320px] h-[320px] md:w-[480px] md:h-[480px] opacity-[0.06] text-slate-500">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.25">
            <circle cx="50" cy="50" r="46" />
            <circle cx="50" cy="50" r="42" strokeDasharray="1,2" />
            <circle cx="50" cy="50" r="35" />
            <circle cx="50" cy="50" r="28" strokeDasharray="1,15" strokeWidth="1" />
            <circle cx="50" cy="50" r="22" />
            <circle cx="50" cy="50" r="16" strokeDasharray="1,2" />
            <circle cx="50" cy="50" r="10" />
            {/* Radial Spokes */}
            {Array.from({ length: 32 }).map((_, i) => {
              const angle = (i * 360) / 32;
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 10 * Math.cos(rad);
              const y1 = 50 + 10 * Math.sin(rad);
              const x2 = 50 + 46 * Math.cos(rad);
              const y2 = 50 + 46 * Math.sin(rad);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </svg>
        </div>
      </div>

      {/* 🚀 NEW WIDE FOOTER SECTIONS */}
      <div className="w-full relative z-10 flex flex-col items-center space-y-4 pb-0 pt-2 sm:pt-4">

        {/* Box 1: Trusted Platform */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-8">
          <div className="w-full bg-[#f6fcf8] border border-emerald-100 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                <ShieldCheck size={28} className="stroke-[2.5px]" />
              </div>
              <div className="flex flex-col text-left">
                <h4 className="text-sm sm:text-base font-semibold text-[#0B2545] leading-tight">A Trusted Platform for Every Indian</h4>
                <p className="text-xs text-slate-500 font-normal mt-0.5">Working together for a safer and secure India</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 border-l border-emerald-100 pl-8">
              <div className="flex flex-col items-center gap-1.5">
                <Users size={24} className="text-blue-700" />
                <span className="text-[10px] font-bold text-blue-800">Citizens</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Shield size={24} className="text-slate-500" />
                <span className="text-[10px] font-medium text-slate-500">Police</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <BriefcaseMedical size={24} className="text-red-500" />
                <span className="text-[10px] font-medium text-slate-500">Responders</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Landmark size={24} className="text-slate-700" />
                <span className="text-[10px] font-medium text-slate-500">Govt. Agencies</span>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Compliance Stats */}
        <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 pb-4">
          <div className="w-full bg-white border border-slate-200 rounded-lg py-1.5 sm:py-2 px-1 sm:px-2 shadow-sm overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center justify-between gap-1 sm:gap-2 divide-x divide-slate-100 min-w-max w-full">

              <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1.5 sm:px-3 flex-1">
                <img src="/emblem-dark.png" alt="Emblem of India" className="h-4 sm:h-5 w-auto object-contain shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-[#0B2545] uppercase tracking-tight leading-none mb-0.5">GOVT OF<br />INDIA</span>
                  <span className="text-[5px] sm:text-[6.5px] text-blue-600 font-medium leading-none whitespace-nowrap">Official Initiative</span>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1.5 sm:px-3 flex-1">
                <img
                  src="/iso-icon.png"
                  alt="ISO Certified"
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 mix-blend-multiply grayscale contrast-150 scale-[1.2]"
                />
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-[#0B2545] uppercase tracking-tight leading-none mb-0.5">ISO 27001<br />CERTIFIED</span>
                  <span className="text-[5px] sm:text-[6.5px] text-blue-600 font-medium leading-none whitespace-nowrap">Information Security</span>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1.5 sm:px-3 flex-1">
                <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 text-[#0B2545]">
                  <ShieldCheck className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-[#0B2545] uppercase tracking-tight leading-none mb-0.5">REGULAR<br />AUDITS</span>
                  <span className="text-[5px] sm:text-[6.5px] text-blue-600 font-medium leading-none whitespace-nowrap">System Protection</span>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-1.5 sm:px-3 flex-1">
                <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 text-orange-500">
                  <Lock className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[6px] sm:text-[7.5px] font-bold text-[#0B2545] uppercase tracking-tight leading-none mb-0.5">DATA<br />PRIVACY</span>
                  <span className="text-[5px] sm:text-[6.5px] text-blue-600 font-medium leading-none whitespace-nowrap">Your Privacy Matters</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Solid Bottom Banner (Dark Blue) */}
      <footer className="w-full bg-[#0B2545] text-white py-3 sm:py-4 px-6 sm:px-12 relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-center sm:text-left shadow-2xl mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-white/90" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[11px] sm:text-xs font-medium tracking-widest text-white/90">KAVACH SAFETY GRID v3.5.1</span>
            <span className="text-[9px] sm:text-[10px] text-blue-100/60 mt-0.5">Securing Women. Empowering India.</span>
          </div>
        </div>
        <span className="text-[9px] sm:text-[10px] font-normal text-blue-100/50 tracking-widest">© Government of India</span>
      </footer>
    </div>
  );
}
