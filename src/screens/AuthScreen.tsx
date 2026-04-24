import React from 'react';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AuthScreenProps {
  handleLogin: () => Promise<void>;
}

export default function AuthScreen({ handleLogin }: AuthScreenProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-accent-red rounded-xl flex items-center justify-center font-black text-4xl mx-auto shadow-2xl">K</div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">KAVACH Woman</h1>
            <p className="text-text-dim font-bold uppercase tracking-[3px] text-[10px] leading-relaxed max-w-[280px] mx-auto opacity-80">
              {t('national_grid')}
            </p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <button 
            onClick={handleLogin}
            className="w-full py-5 bg-white text-black rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl"
          >
            <LogIn size={20} /> {t('login_google') || "Login with Google"}
          </button>

          <div className="pt-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
              Identity Anchoring via Neural Link <br/> Secured by KAVACH Defense Systems
            </p>
          </div>
        </motion.div>

        <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed text-center">
          By logging in, you agree to the KAVACH Protocol for real-time emergency response and evidence collection.
        </p>
      </div>
    </div>
  );
}
