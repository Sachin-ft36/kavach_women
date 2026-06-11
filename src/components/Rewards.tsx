import React, { useState, useEffect } from 'react';
import { Trophy, Star, Shield, Award, Download, Share2, CheckCircle2, Zap, Lock, Map, LayoutDashboard, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Rewards() {
  const { t } = useLanguage();
  const [points, setPoints] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [displayPhotoUrl, setDisplayPhotoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserData(data);
        setPoints(data.xp || 0);
        setDisplayPhotoUrl(prev => prev || data.displayPhotoUrl || data.photoUrl || '');
      }
    });
    return () => unsubscribe();
  }, [user]);

  const badges = [
    { name: 'Bronze Shield', xp: 500, icon: <Shield size={26} className="text-[#CD7F32]" />, label: 'Initial Responder' },
    { name: 'Silver Guardian', xp: 2000, icon: <Shield size={26} className="text-[#94A3B8]" />, label: 'Advanced Protector' },
    { name: 'Golden Rakshak', xp: 5000, icon: <Shield size={26} className="text-[#EAB308]" />, label: 'Master Elite' },
    { name: 'Sentinel of Bharat', xp: 10000, icon: <Award size={26} className="text-[#2563EB]" />, label: 'National Legend' },
  ];

  const currentRank = badges.filter(b => points >= b.xp).pop() || { name: 'Probationary', label: 'Field Recruit' };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setDisplayPhotoUrl(compressedBase64);
        
        // Auto-save to Firestore
        if (user) {
          setIsSaving(true);
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              displayPhotoUrl: compressedBase64
            });
            toast.success("Profile Photo Updated", { icon: '📸' });
          } catch (err) {
            console.error(err);
            toast.error("Failed to update photo.");
          }
          setIsSaving(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-4 sm:p-6 space-y-8 pb-24">
      {/* Instagram-Style Profile Header */}
      <section className="bg-[#1E293B] border border-white/10 p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-sm relative overflow-hidden flex flex-col items-center text-center">
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handlePhotoUpload} 
        />
        
        <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
          <div className="w-28 h-28 rounded-full bg-slate-700 overflow-hidden border-4 border-slate-600 shadow-lg flex items-center justify-center">
            {displayPhotoUrl ? (
              <img src={displayPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-gray-400" />
            )}
          </div>
          {isSaving ? (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-[2px]">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex flex-col items-center justify-center backdrop-blur-[2px]">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
                <Download size={14} className="text-white transform rotate-180" />
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-[#2563EB] font-bold text-sm hover:text-[#1D4ED8] transition-colors mb-2"
        >
          Change profile photo
        </button>

        <h1 className="text-2xl font-black text-white tracking-tight">{userData?.name || 'Authorized Protector'}</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentRank.name}</p>
      </section>
      {/* Safety Merit Score Hero */}
      <section className="bg-[#1E293B] border border-white/10 p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 sm:p-10 text-[#2563EB]/5 pointer-events-none group-hover:scale-110 transition-transform">
          <Trophy size={100} className="sm:size-[140px]" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="text-amber-500 fill-amber-500" size={16} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[3px] text-[#2563EB]">Safety Merit Score</span>
          </div>
          <div className="flex items-end gap-2 sm:gap-3">
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-none tracking-tight">{points}</h1>
            <span className="text-sm sm:text-lg font-bold text-slate-400 mb-1 uppercase tracking-widest">Points</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((points / 10000) * 100, 100)}%` }}
              className="h-full bg-[#2563EB] shadow-sm rounded-full"
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {10000 - points > 0 ? `${10000 - points} Points to National Legend` : 'Maximum Merit Achieved'}
            </p>
            <div className="px-3 py-1 bg-[#2563EB]/5 rounded-lg border border-[#2563EB]/10">
               <span className="text-[9px] font-bold text-[#2563EB] uppercase tracking-widest">Rank: {currentRank.name}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Official Certification Card */}
        <section 
          className={cn(
            "bg-[#1E293B] border border-white/10 p-6 sm:p-8 rounded-[28px] sm:rounded-[32px] shadow-sm flex flex-col justify-between group cursor-pointer hover:shadow-md hover:border-white/20 transition-all",
            points < 1000 && "pointer-events-none border-white/5 bg-[#1E293B]/50"
          )}
          onClick={() => setShowCertificate(true)}
        >
          <div>
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#2563EB] mb-6 shadow-inner group-hover:bg-[#2563EB] group-hover:text-white transition-all">
              <Download size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">National Merit Certification</h3>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">Download your official government-authenticated safety certificate for your contributions.</p>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-[10px] text-[#2563EB] font-bold uppercase tracking-[2px]">
              {points >= 1000 ? 'Verification Complete - Ready to Download' : 'Required Merit: 1000 Points'}
            </p>
          </div>
        </section>

        {/* Badges Collection */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[2px] text-white ml-2">Safety Achievement Badges</h3>
          <div className="grid grid-cols-2 gap-4">
            {badges.map((badge, i) => (
                <motion.div 
                  key={i}
                  className={cn(
                    "bg-[#1E293B] border p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col items-center text-center gap-3 sm:gap-4 transition-all shadow-sm",
                    points >= badge.xp ? "border-white/10 hover:border-white/20 hover:shadow-md" : "border-white/5 bg-[#1E293B]/50"
                  )}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                    {points >= badge.xp ? React.cloneElement(badge.icon as any, { size: 22 }) : <Lock size={18} className="text-slate-400" />}
                  </div>
                  <div>
                    <h4 className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-tight leading-tight mb-1">{badge.name}</h4>
                    <p className="text-[8px] sm:text-[9px] text-slate-300 font-bold uppercase tracking-widest">{badge.label}</p>
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
            className="fixed inset-0 z-[5000] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCertificate(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-2xl w-full bg-white text-gray-900 p-6 sm:p-20 rounded-[4px] shadow-2xl relative overflow-hidden border-[8px] sm:border-[12px] border-gray-100"
              onClick={e => e.stopPropagation()}
            >
              {/* Official Border */}
              <div className="absolute inset-4 border border-gray-200 pointer-events-none" />
              
              <div className="relative z-10 text-center space-y-12">
                <div className="flex flex-col items-center space-y-3 sm:space-y-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#2563EB] rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#2563EB]/30 mb-2 sm:mb-4">
                    <Shield size={32} className="sm:size-[44px]" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[4px] sm:tracking-[8px] text-gray-400">Government of India</h2>
                    <h1 className="text-xl sm:text-3xl font-bold uppercase tracking-widest text-gray-900">Certificate of Merit</h1>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400">This is to officially certify that</p>
                  <h3 className="text-2xl sm:text-4xl font-bold text-gray-900 border-b-2 sm:border-b-4 border-gray-900 inline-block px-6 sm:px-12 py-2 sm:py-3 tracking-tight italic">
                    {userData?.name || 'Authorized Citizen'}
                  </h3>
                </div>

                <div className="max-w-md mx-auto">
                  <p className="text-sm font-medium leading-relaxed text-gray-600">
                    Has demonstrated exceptional vigilance and commitment to the KAVACH National Safety Grid. Their active participation has significantly contributed to communal safety and national security.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 pt-4 sm:pt-8 text-left">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">Merit Designation</p>
                    <p className="text-lg sm:text-xl font-bold text-[#2563EB]">{currentRank.name}</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase">{points} Verified Merit Points</p>
                  </div>
                  <div className="space-y-1 sm:space-y-2 text-left sm:text-right">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">Citizen ID</p>
                    <p className="text-lg sm:text-xl font-bold font-mono text-gray-900">{(user?.uid || '').slice(0, 12).toUpperCase()}</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-accent-green uppercase">KAVACH Authenticated</p>
                  </div>
                </div>

                <div className="pt-10 flex justify-center">
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-3 px-10 py-4 bg-[#2563EB] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#1D4ED8] transition-all shadow-lg shadow-[#2563EB]/30 active:scale-95"
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
