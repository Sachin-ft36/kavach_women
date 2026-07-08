import React from 'react';
import { User, CheckCircle2, Shield, ShieldCheck, Clock, Users, ChevronRight } from 'lucide-react';
import { useKavachStore } from '../../state/useKavachStore';

interface ProtectorStats {
  rating: number;
  ratingCount: number;
  level: number;
  xp: number;
  livesHelped: number;
  successRate: number;
  avgResponse: string | number;
}

interface ProtectorHeaderProps {
  profile: any;
  user: any;
  isOnDuty: boolean;
  protectorStats: ProtectorStats;
  setActiveTab: (tab: string) => void;
  handleToggleDuty?: () => void;
}

export default function ProtectorHeader({ profile, user, isOnDuty, protectorStats, setActiveTab, handleToggleDuty }: ProtectorHeaderProps) {
  const setGlobalActiveTab = useKavachStore(state => state.setActiveTab);
  const isGuardian = profile?.isGuardian || profile?.protectorVetting?.isGuardian === true;

  const xpNeededForNextLevel = protectorStats.level * 500;
  const remainingXpToNextLevel = Math.max(0, xpNeededForNextLevel - protectorStats.xp);

  return (
    <div className="px-5 pt-2 space-y-4">
      {/* PROFILE CARD */}
      <div 
        onClick={() => setGlobalActiveTab('rewards')}
        className="bg-[#1E293B] rounded-2xl p-3 shadow-lg border border-white/10 relative overflow-hidden flex items-center justify-between cursor-pointer active:scale-95 transition-transform duration-200"
      >
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-md bg-slate-800 flex items-center justify-center">
              {(profile?.displayPhotoUrl || profile?.photoUrl || profile?.photoURL || user?.photoURL) ? (
                <img src={profile?.displayPhotoUrl || profile?.photoUrl || profile?.photoURL || user?.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-slate-500" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#000080] rounded-full flex items-center justify-center border-2 border-[#151E32]">
              <CheckCircle2 size={10} className="text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-white leading-tight">
              {profile?.displayName || profile?.name || user?.displayName || 'Sachin Singh'}
              {isGuardian && (
                <span className="text-blue-400 font-extrabold text-[12px] ml-1.5 opacity-90">(Family Guardian)</span>
              )}
            </h2>
            <p className="text-[9px] font-medium text-blue-500 mb-0.5">
              {isGuardian ? "Verified Family Sentinel" : "Verified Protector"}
            </p>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(star => (
                <svg key={star} className={`w-2.5 h-2.5 ${star <= Math.round(protectorStats.rating) ? 'text-amber-400' : 'text-white/30'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
              <span className="text-[8px] text-slate-400 ml-1">{protectorStats.rating.toFixed(1)} ({protectorStats.ratingCount})</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end relative z-10 mr-4">
          <div className="flex items-center gap-1 bg-[#1A2642] px-1.5 py-0.5 rounded-lg border border-blue-500/20 mb-1">
            <Shield size={8} className="text-blue-500" />
            <span className="text-[9px] font-bold text-blue-400">Level {protectorStats.level}</span>
          </div>
          <p className="text-[8px] text-slate-400 mt-1.5 font-medium"><span className="text-white font-bold">{remainingXpToNextLevel} XP</span> to Lvl {protectorStats.level + 1}</p>
        </div>
        <ChevronRight size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 opacity-50" />
      </div>

      {/* DUTY STATUS CARD */}
      <div className="bg-[#1E293B] rounded-3xl px-4 pt-4 pb-4 shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] text-center opacity-[0.02] pointer-events-none">
          <h1 className="text-7xl font-black text-white tracking-tighter transform -rotate-12">KAVACH</h1>
        </div>

        {isGuardian ? (
          <div className="flex justify-between items-start relative z-10">
            <div className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/50 shadow-[0_0_20px_rgba(0,0,128,0.3)] flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-blue-400" />
              </div>
              <div className="pt-0.5">
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Secure Link</p>
                <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1">
                  FAMILY SHIELD ACTIVE
                </h2>
                <p className="text-[9px] text-slate-400 leading-snug">
                  Real-time status updates and distress command telemetry are synced.
                </p>
              </div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 " />
              ONLINE
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-full bg-[#0F62FE]/20 border border-[#0F62FE]/50 shadow-[0_0_20px_rgba(15,98,254,0.3)] flex items-center justify-center shrink-0">
                <Shield size={20} className="text-blue-500" fill="currentColor" />
              </div>
              <div className="pt-0.5">
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">You Are</p>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">
                  {isOnDuty ? "ON DUTY" : "OFF DUTY"}
                </h2>
                <p className="text-[9px] text-slate-400 max-w-[140px] leading-snug">
                  {isOnDuty ? "Thank you for keeping your community safe." : "Toggle duty to start protecting citizens."}
                </p>
              </div>
            </div>
            <div 
              onClick={handleToggleDuty}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${isOnDuty ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isOnDuty ? 'Active' : 'Standby'}
              </span>
              <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ease-in-out ${isOnDuty ? 'bg-emerald-500' : 'bg-slate-700'} border border-white/10 shadow-inner`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out flex items-center justify-center ${isOnDuty ? 'translate-x-5' : 'translate-x-0'}`}>
                  {isOnDuty && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full " />}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isGuardian && (
          <div className="grid grid-cols-3 gap-2 relative z-10 bg-[#28354A] rounded-xl p-3 border border-white/5 mt-4">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center mb-1.5">
                <Users size={14} className="text-blue-400" fill="currentColor" />
              </div>
              <p className="text-base font-black text-white leading-none">{protectorStats.livesHelped}</p>
              <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider">Lives Helped</p>
            </div>
            <div className="flex flex-col items-center border-l border-white/5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
              </div>
              <p className="text-base font-black text-white leading-none">{protectorStats.successRate}%</p>
              <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider">Success Rate</p>
            </div>
            <div className="flex flex-col items-center border-l border-white/5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center mb-1.5">
                <Clock size={14} className="text-purple-400" />
              </div>
              <p className="text-base font-black text-white leading-none">{protectorStats.avgResponse}</p>
              <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider">Avg. Response</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
