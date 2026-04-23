import React, { useState, useEffect } from 'react';
import { Trophy, Star, Shield, Award, Download, Share2, CheckCircle2, Zap, Lock, Map, LayoutDashboard, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function Rewards() {
  const { t } = useLanguage();
  const [points, setPoints] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData(data);
        setPoints(data.xp || 0);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const badges = [
    { name: 'Bronze Shield', xp: 500, icon: <Shield size={24} className="text-[#CD7F32]" />, label: 'Initial Responder' },
    { name: 'Silver Guardian', xp: 2000, icon: <Shield size={24} className="text-[#C0C0C0]" />, label: 'Advanced Protector' },
    { name: 'Golden Rakshak', xp: 5000, icon: <Shield size={24} className="text-[#FFD700]" />, label: 'Master Elite' },
    { name: 'Sentinel of Bharat', xp: 10000, icon: <Award size={24} className="text-accent-red" />, label: 'National Legend' },
  ];

  const currentRank = badges.filter(b => points >= b.xp).pop() || { name: 'Probationary', label: 'Field Recruit' };

  return (
    <div className="space-y-6 pb-20">
      {/* XP Hero Card */}
      <section className="bento-card col-span-4 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-8 border-accent-blue/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Trophy size={120} />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Star className="text-yellow-500 fill-yellow-500" size={16} />
            <span className="text-[10px] font-black uppercase tracking-[4px] text-accent-blue">{t('rakshak_merit')}</span>
          </div>
          <div className="flex items-end gap-4">
            <h1 className="text-6xl font-black italic tracking-tighter leading-none">{points}</h1>
            <span className="text-xl font-bold text-gray-500 mb-1 uppercase tracking-widest">XP</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((points / 10000) * 100, 100)}%` }}
              className="h-full bg-accent-blue shadow-[0_0_20px_rgba(0,122,255,0.5)]"
            />
          </div>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">
            {t('next_rank')} // {10000 - points > 0 ? 10000 - points : 0} XP TO NATIONAL LEGEND
          </p>
        </div>
      </section>

      {/* Rewards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Certificate Card */}
        <section 
          className={cn(
            "bento-card col-span-2 md:col-span-1 p-6 flex flex-col justify-between group cursor-pointer transition-all",
            points >= 1000 ? "bg-accent-blue/10 border-accent-blue/30" : "opacity-50 grayscale pointer-events-none"
          )}
          onClick={() => setShowCertificate(true)}
        >
          <div className="bento-card-title">{t('national_certification')}</div>
          <div className="mt-8 space-y-4">
            <div className="w-12 h-12 bg-accent-blue/20 rounded-xl flex items-center justify-center text-accent-blue">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">{t('official_merit')}</h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{points >= 1000 ? 'UNLOCKED' : 'UNLOCKS AT 1000 XP'}</p>
            </div>
          </div>
        </section>

        {/* Badges Column */}
        <div className="col-span-2 space-y-4">
          <div className="bento-card-title px-4">{t('unlocked_badges')}</div>
          <div className="grid grid-cols-2 gap-4">
            {badges.map((badge, i) => (
              <motion.div 
                key={i}
                className={cn(
                  "bento-card p-4 flex flex-col items-center text-center gap-3 transition-all",
                  points >= badge.xp ? "bg-white/5 border-white/10" : "opacity-30 grayscale saturate-0"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center border border-white/5">
                  {points >= badge.xp ? badge.icon : <Lock size={18} className="text-gray-600" />}
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-tighter">{badge.name}</h4>
                  <p className="text-[8px] text-gray-500 font-bold uppercase">{badge.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8"
            onClick={() => setShowCertificate(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-2xl w-full bg-white text-black p-8 sm:p-16 rounded-[2px] shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Certificate Border Design */}
              <div className="absolute inset-0 border-[16px] border-black/5 pointer-events-none" />
              <div className="absolute inset-4 border border-black/10 pointer-events-none" />
              
              <div className="relative z-10 text-center space-y-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 bg-black rounded-xl flex items-center justify-center text-white scale-125 mb-4">
                    <Shield size={40} />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-[8px] text-gray-400">Government of India</h2>
                  <h1 className="text-3xl font-black uppercase tracking-widest italic leading-none">Certificate of Merit</h1>
                </div>

                <div className="space-y-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">This is to certify that</p>
                  <h3 className="text-5xl font-black italic uppercase tracking-tighter border-b-2 border-black inline-block px-12 py-4">
                    {userData?.name || 'Authorized Rakshak'}
                  </h3>
                </div>

                <div className="max-w-md mx-auto">
                  <p className="text-sm font-bold leading-relaxed">
                    Has demonstrated exceptional courage and vigilance within the KAVACH National Safety Grid. Their service has directly contributed to the safety and security of citizens across the nation.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-12 pt-12">
                  <div className="text-left space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Merit Status</p>
                    <p className="text-xl font-black italic">{currentRank.name}</p>
                    <p className="text-[10px] font-mono text-gray-500 uppercase">{points} Verified Merit Points</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mission ID</p>
                    <p className="text-xl font-mono font-black italic">{(user?.uid || '').slice(0, 12).toUpperCase()}</p>
                    <p className="text-[10px] font-bold text-green-600 uppercase">KAVACH Authenticated</p>
                  </div>
                </div>

                <div className="pt-12 flex justify-center">
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-4 px-8 py-4 bg-black text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
                  >
                    <Download size={18} /> Download Asset
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
