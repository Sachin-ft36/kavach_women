import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronLeft, Globe, Mail } from 'lucide-react';
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
  
  // ── Operative States ──
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
          toast.error("This number is already registered with another operative.");
          setLoading(false);
          return;
        }

        // 2. Core Identity Deployment (MUST be first)
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        
        // ⚡ TACTICAL PARALLEL DISPATCH: Start all metadata tasks at once
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
        ]).catch(err => console.error("Background Sync Issue:", err));

        // 🚀 INSTANT UI TRANSITION: Don't wait for metadata to finish
        toast.info("Security link dispatched to Gmail.");
        setNeedsVerification(true);
        setLoading(false); 
        await auth.signOut(); 
        return; // Early exit to prevent finally block from overriding logic
      } else {
        // 🔒 DUAL-CHANNEL LOGIN: Support for Email or Phone Number
        let loginEmail = email;
        const isPhone = /^[0-9]{10}$/.test(email);

        if (isPhone) {
          const fullPhone = `+91 ${email}`;
          const q = query(collection(db, "users"), where("phone", "==", fullPhone));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            toast.error("Shield down. This phone number isn't registered.");
            setLoading(false);
            return;
          }
          loginEmail = snapshot.docs[0].data().email;
        }

        const userCred = await signInWithEmailAndPassword(auth, loginEmail, password);
        if (!userCred.user.emailVerified) {
          toast.warning("Access Denied: Email not approved.");
          setNeedsVerification(true);
          await auth.signOut();
          setLoading(false);
          return;
        }
        toast.success("Access authorized.");
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
      await handleLogin(); // Use the native login handler passed from App.tsx
    } catch (error: any) {
      toast.error(error.message || "Google Auth Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans overflow-hidden text-white selection:bg-accent-red/30 relative">
      {/* 🌐 Language Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={onResetLanguage}
          className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white hover:bg-accent-blue/20 hover:border-accent-blue/30 transition-all active:scale-95 shadow-xl group"
          title="Change Language"
        >
          <Globe size={20} className="group-hover:rotate-12 transition-transform" />
          <div className="absolute -inset-1 bg-accent-blue/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div 
          key="auth-container" 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0 }} 
          className="flex-1 flex flex-col pt-12 pb-6 px-6 relative z-10 overflow-y-auto custom-scrollbar lg:px-8"
        >
          <div className="max-w-[360px] w-full mx-auto flex flex-col h-full justify-center space-y-6">
            
            <div className="space-y-3 text-center">
              <div className="w-12 h-12 bg-accent-red rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg mx-auto italic">K</div>
              <div className="space-y-1">
                <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">KAVACH</h1>
                <div className="flex items-center justify-center gap-2">
                   <div className="h-[1px] w-8 bg-accent-red/30" />
                   <p className="text-[8px] text-gray-500 font-black tracking-[4px] uppercase italic">{t('mha_grid')}</p>
                   <div className="h-[1px] w-8 bg-accent-red/30" />
                </div>
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/5">
                <button onClick={() => setMode('login')} className={cn("flex-1 py-2.5 text-[9px] font-black uppercase tracking-[3px] transition-all rounded-lg", mode === 'login' ? "bg-white text-black shadow-xl" : "text-gray-500 hover:text-white")}>{t('login')}</button>
                <button onClick={() => setMode('signup')} className={cn("flex-1 py-2.5 text-[9px] font-black uppercase tracking-[3px] transition-all rounded-lg", mode === 'signup' ? "bg-white text-black shadow-xl" : "text-gray-500 hover:text-white")}>{t('signup')}</button>
              </div>
            )}

            <div className="pt-1">
              <AnimatePresence mode="wait">
                {needsVerification ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 bg-accent-blue/10 border-2 border-accent-blue/20 rounded-3xl text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-accent-blue/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(0,112,243,0.3)]">
                      <Mail className="text-accent-blue" size={40} />
                    </div>
                    <div className="space-y-2">
                       <h2 className="text-xl font-black italic uppercase tracking-tighter">
                         {t('approve_gmail' as any) || "Approve Gmail Link"}
                       </h2>
                       <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[3px] leading-relaxed">
                         {t('verification_sent' as any) || "Bhai, humne security link bheja hai. Gmail open karke Confirm kijiye taaki KAVACH Grid activate ho sake."}
                       </p>
                    </div>
                    <div className="pt-4 space-y-4">
                      <button 
                        onClick={() => window.open('https://mail.google.com', '_blank')}
                        className="w-full py-4 bg-accent-blue text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
                      >
                        {t('open_gmail' as any) || "Open Gmail App"}
                      </button>
                      <button 
                         onClick={() => setNeedsVerification(false)}
                         className="text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                      >
                        {t('return_login' as any) || "Return to Login"}
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
            
            <footer className="pt-4 text-center opacity-20">
              <p className="text-[7px] font-black text-gray-500 uppercase tracking-[5px] italic leading-relaxed">SECURE KAVACH NODE // v3.5.1</p>
            </footer>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
