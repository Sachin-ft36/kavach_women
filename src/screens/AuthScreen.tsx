import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronLeft, Globe, Mail, ShieldCheck, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// 🛡️ Modular Components
import LoginView from '../components/auth/LoginView';
import SignupView from '../components/auth/SignupView';
import ForgotPassword from '../components/auth/ForgotPassword';

interface AuthScreenProps {
  handleLogin: () => Promise<void>;
  onResetLanguage: () => void;
}

export default function AuthScreen({ handleLogin, onResetLanguage }: AuthScreenProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  
  // ── Form States ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(''); 
  const [username, setUsername] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleManualAuth = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        const fullPhone = `+91 ${phone}`;
        
        // 1. Identity Uniqueness Check
        const q = query(collection(db, "users"), where("phone", "==", fullPhone));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          toast.error("This number is already registered with another user.");
          setLoading(false);
          return;
        }

        // 2. User Account Creation
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        
        // Sync metadata tasks in background
        Promise.all([
          updateProfile(userCred.user, { displayName: username }),
          sendEmailVerification(userCred.user),
          setDoc(doc(db, 'users', userCred.user.uid), {
            uid: userCred.user.uid, 
            email, 
            phone: fullPhone, 
            username, 
            role: 'citizen', 
            createdAt: new Date().toISOString(), 
            isRegistered: false
          })
        ]).catch(err => console.error("Identity Sync Issue:", err));

        toast.info("Verification link sent to your email.");
        setNeedsVerification(true);
        setLoading(false); 
        await auth.signOut(); 
        return;
      } else {
        let loginEmail = email;
        const isPhone = /^[0-9]{10}$/.test(email);

        if (isPhone) {
          const fullPhone = `+91 ${email}`;
          const q = query(collection(db, "users"), where("phone", "==", fullPhone));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            toast.error("Account not found. This phone number isn't registered.");
            setLoading(false);
            return;
          }

          const userData = snapshot.docs[0].data();
          if (userData.isPermanentlyBlocked) {
            toast.error("TERMINAL LOCKOUT: This identity has been permanently blacklisted from the National Grid due to severe protocol violations.", {
              description: "All access is summarily rejected by SuperCell Command.",
              className: "bg-rose-950 border-rose-500 text-white font-black"
            });
            setLoading(false);
            return;
          }

          loginEmail = userData.email;
        }

        const userCred = await signInWithEmailAndPassword(auth, loginEmail, password);

        // 🛡️ Post-Auth Registry Validation
        const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", userCred.user.uid)));
        if (!userDoc.empty && userDoc.docs[0].data().isPermanentlyBlocked) {
          await auth.signOut();
          toast.error("TERMINAL LOCKOUT: This identity is permanently blacklisted.", {
            className: "bg-rose-950 border-rose-500 text-white font-black"
          });
          setLoading(false);
          return;
        }

        if (!userCred.user.emailVerified) {
          toast.warning("Verification Required: Email not verified.");
          setNeedsVerification(true);
          await auth.signOut();
          setLoading(false);
          return;
        }
        sessionStorage.setItem('kavach_just_logged_in', 'true');
        toast.success("Login successful.");
      }
    } catch (error: any) {
      toast.error(error.message || "Auth Error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      // 🛡️ Google Auth requires post-auth check since we don't know the email/uid yet
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", result.user.uid)));
      if (!userDoc.empty && userDoc.docs[0].data().isPermanentlyBlocked) {
        await auth.signOut();
        toast.error("TERMINAL LOCKOUT: This identity is blacklisted.", {
          className: "bg-rose-950 border-rose-500 text-white font-black"
        });
        return;
      }

      sessionStorage.setItem('kavach_just_logged_in', 'true');
      toast.success("Login successful.");
    } catch (error: any) {
      toast.error(error.message || "Google Auth Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-hidden text-gray-900 selection:bg-[#2563EB]/10 relative">
      {/* 🌐 Language Selection Gateway */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={onResetLanguage}
          className="w-12 h-12 bg-white border border-[#E5E7EB] rounded-2xl flex items-center justify-center text-gray-700 hover:border-[#2563EB] transition-all active:scale-90 shadow-sm group"
          title="Change Language"
        >
          <Globe size={22} className="text-gray-400 group-hover:text-[#2563EB] transition-colors" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key="auth-container" 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 1.02 }} 
          className="flex-1 flex flex-col pt-6 sm:pt-16 pb-6 sm:pb-8 px-6 relative z-10 overflow-y-auto custom-scrollbar lg:px-12"
        >
          <div className="max-w-[420px] w-full mx-auto flex flex-col h-full justify-center space-y-6 sm:space-y-10">
            
            <div className="space-y-2 sm:space-y-5 text-center">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-white border border-[#E5E7EB] rounded-xl sm:rounded-[24px] flex items-center justify-center shadow-lg shadow-gray-100 mx-auto transition-all duration-500">
                <Shield size={20} className="text-[#2563EB] sm:size-[32px]" />
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900">KAVACH</h1>
                <p className="text-[9px] sm:text-[11px] text-[#2563EB] font-bold tracking-[2px] sm:tracking-[4px] uppercase">Official Safety Portal</p>
                <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0">Authorized Safety Network Access</p>
              </div>
            </div>

            <div className="bg-gray-50/50 p-2 rounded-[24px] border border-[#E5E7EB] shadow-inner flex gap-2">
              <button 
                onClick={() => setMode('login')} 
                className={cn(
                  "flex-1 py-3.5 text-xs font-bold transition-all rounded-2xl uppercase tracking-widest", 
                  mode === 'login' ? "bg-white text-[#2563EB] shadow-md border border-[#E5E7EB]" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {t('login')}
              </button>
              <button 
                onClick={() => setMode('signup')} 
                className={cn(
                  "flex-1 py-3.5 text-xs font-bold transition-all rounded-2xl uppercase tracking-widest", 
                  mode === 'signup' ? "bg-white text-[#2563EB] shadow-md border border-[#E5E7EB]" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {t('signup')}
              </button>
            </div>

            <div className="bg-white rounded-[32px] sm:rounded-[40px] border border-[#E5E7EB] p-6 sm:p-10 shadow-2xl shadow-gray-100">
              <AnimatePresence mode="wait">
                {needsVerification ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8 text-center"
                  >
                    <div className="w-20 h-20 bg-[#2563EB]/5 rounded-[24px] flex items-center justify-center mx-auto border border-[#2563EB]/10">
                      <Mail className="text-[#2563EB]" size={36} />
                    </div>
                    <div className="space-y-3">
                       <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                         Identity Verification
                       </h2>
                       <p className="text-sm text-gray-500 font-semibold leading-relaxed">
                         A secure activation link has been transmitted to your registered email. Please verify to initialize protection.
                       </p>
                    </div>
                    <div className="pt-2 space-y-4">
                      <button 
                        onClick={() => window.open('https://mail.google.com', '_blank')}
                        className="w-full py-4.5 bg-[#2563EB] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-[#2563EB]/25 active:scale-95 transition-all"
                      >
                        Launch Mail Gateway
                      </button>
                      <button 
                         onClick={() => setNeedsVerification(false)}
                         className="text-[10px] font-bold text-gray-400 hover:text-[#2563EB] transition-colors uppercase tracking-widest"
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
            
            <footer className="pt-4 sm:pt-6 space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between gap-4 px-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <ShieldCheck size={20} className="text-[#2563EB]" />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">UIDAI Verified</span>
                </div>
                <div className="w-px h-10 bg-gray-100" />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <Lock size={20} className="text-[#10B981]" />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">ISO Secure</span>
                </div>
                <div className="w-px h-10 bg-gray-100" />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                    <Globe size={20} className="text-amber-500" />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Pan-India Grid</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2 opacity-40">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[4px]">
                  Kavach Safety Grid v3.5.1
                </p>
                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Official Government Compliance Protocol</p>
              </div>
            </footer>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
