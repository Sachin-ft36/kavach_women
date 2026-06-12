import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useKavachStore } from '../store/useKavachStore';

import LoginView from '../components/auth/LoginView';
import SignupView from '../components/auth/SignupView';
import ForgotPassword from '../components/auth/ForgotPassword';

import AuthHeader from '../components/auth/AuthHeader';
import AuthFooter from '../components/auth/AuthFooter';
import AuthBackground from '../components/auth/AuthBackground';
import AuthTitle from '../components/auth/AuthTitle';
import { useAuthLogic } from '../hooks/useAuthLogic';

interface AuthScreenProps {
  handleLogin: () => Promise<void>;
  onResetLanguage: () => void;
}

export default function AuthScreen({ handleLogin, onResetLanguage }: AuthScreenProps) {
  const { role } = useKavachStore();

  const storedRole = localStorage.getItem('kavach_user_role');
  if (role === 'protector' || storedRole === 'protector') return null;

  const {
    mode, setMode,
    loading,
    email, setEmail,
    password, setPassword,
    phone, setPhone,
    username, setUsername,
    needsVerification, setNeedsVerification,
    handleManualAuth,
    handleGoogleAuth,
    handleBiometricLogin
  } = useAuthLogic(handleLogin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F7FC] via-white to-[#F0F4F8] flex flex-col font-sans text-gray-900 selection:bg-[#2563EB]/10 relative w-full overflow-x-hidden">
      <AuthHeader />

      <main className="flex-1 flex flex-col items-center justify-start pt-0 pb-2 px-3 sm:px-6 max-w-[440px] w-full mx-auto space-y-3 sm:space-y-5 relative z-10 -mt-6 sm:-mt-10">
        <AuthTitle />

        <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden flex flex-col">
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
                    <button onClick={() => setMode('signup')} className="text-[#1d4ed8] font-bold hover:underline cursor-pointer ml-1">
                      Create Account
                    </button>
                  </p>
                ) : (
                  <p className="text-[12px] font-semibold text-slate-700">
                    Already registered?{' '}
                    <button onClick={() => setMode('login')} className="text-[#1d4ed8] font-bold hover:underline cursor-pointer ml-1">
                      Login
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <AuthBackground />
      <AuthFooter />
    </div>
  );
}
