import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, AlertTriangle, Ban, Phone, Mail, MapPin, Activity, Heart } from 'lucide-react';

export const SOSHistoryVictimDetails = ({
  victimData,
  victimHistory,
  guardians,
  pendingAppeal,
  handleAction,
  handleRestoreAccess,
  handlePermanentBan
}: any) => {
  return (
    <div className="w-[50%] lg:w-[45%] h-full overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6 bg-[#0B0F19] relative">
      {/* 🛡️ HEADER AREA */}
      <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl space-y-4 relative">
        {/* 🛡️ DISCIPLINARY OVERLAY */}
        <AnimatePresence>
          {victimData.isSOSBlocked && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(6px)" }}
              className="absolute inset-0 z-50 bg-rose-950/85 flex flex-col items-center justify-center p-6 text-center rounded-[2rem]"
            >
              <div className="bg-[#1E293B]/40 border border-rose-500/30 rounded-xl p-6  space-y-4 max-w-sm">
                <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mx-auto border border-rose-500/20">
                  <Lock size={24} className="text-rose-500" />
                </div>
                <h2 className="text-base font-black text-white uppercase  leading-none">Account Blocked</h2>
                <p className="text-[12px] font-bold text-rose-400 uppercase tracking-widest leading-relaxed">SOS restricted from Grid</p>
                
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-left text-[13px] text-gray-300 ">
                  {pendingAppeal ? `"${pendingAppeal.reason}"` : "NO PENDING APPEAL."}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleRestoreAccess(victimData.id)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-black uppercase tracking-widest ">Restore</button>
                  <button onClick={() => handlePermanentBan(victimData.id)} className="flex-1 py-2 bg-black/40 border border-rose-900 text-rose-900 rounded-xl text-[12px] font-black uppercase tracking-widest">Ban</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="px-2 py-0.5 bg-[#1E293B]/40 text-blue-400 text-[11px] font-black rounded-xl border border-white/5 uppercase tracking-widest leading-none">Archived Incident Ledger</span>
            <h1 className="text-xl font-black text-white uppercase  leading-none tracking-tighter mt-1">{victimData.name}</h1>
          </div>
          
          {/* COMPACT ACTION BUTTONS */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => handleAction('warn')} className="px-2.5 py-1.5 bg-[#1E293B]/40 border border-amber-500/30 text-amber-500 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-amber-500 hover:text-black transition-all">
              <AlertTriangle size={10} /> Warn
            </button>
            <button onClick={() => handleAction('ban')} className="px-2.5 py-1.5 bg-[#1E293B]/40 border border-rose-500/30 text-rose-500 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-rose-500 hover:text-white transition-all">
              <Ban size={10} /> Ban
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#1E293B]/40 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 ">
            <Phone size={10} className="text-gray-500" />
            <span className="text-[13px] font-black text-white tabular-nums">{victimData.phoneNumber || victimData.phone || 'NO RECORD'}</span>
          </div>
          {victimData.email && (
            <div className="bg-[#1E293B]/40 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 ">
              <Mail size={10} className="text-gray-500" />
              <span className="text-[13px] font-black text-white lowercase truncate max-w-[120px]">{victimData.email}</span>
            </div>
          )}
          {victimData.gender && (
            <div className="bg-[#1E293B]/40 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 ">
              <span className="text-[14px] font-black text-gray-500 uppercase tracking-widest">GDR:</span>
              <span className="text-[13px] font-black text-white uppercase">{victimData.gender}</span>
            </div>
          )}
        </div>
      </div>

      {/* 📍 PERMANENT SECTOR GRID */}
      {(victimData.fullAddress || victimData.locationData?.formattedAddress) && (
        <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl  relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/30" />
          <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <MapPin size={10} className="text-rose-500" /> Permanent Sector Grid
          </p>
          <p className="text-[11px] font-black text-white uppercase  leading-relaxed">{victimData.fullAddress || victimData.locationData?.formattedAddress}</p>
        </div>
      )}

      {/* 📊 STRATEGIC STATS OVERLAY */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1E293B]/40/30 p-4 rounded-xl border border-white/5  relative overflow-hidden group">
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Total Alerts</p>
          <h3 className="text-xl font-black text-white  tabular-nums leading-none tracking-tighter">{victimHistory.length}</h3>
        </div>
        <div className="bg-[#1E293B]/40/30 p-4 rounded-xl border border-white/5  relative overflow-hidden group">
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Misuse</p>
          <h3 className="text-xl font-black text-rose-500  tabular-nums leading-none tracking-tighter">{victimHistory.filter((a: any) => a.closureReason?.includes('Misuse') || a.closureReason?.includes('Accidental')).length}</h3>
        </div>
        <div className="bg-[#1E293B]/40/30 p-4 rounded-xl border border-white/5  relative overflow-hidden group">
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Activity Index</p>
          <h3 className="text-xl font-black text-emerald-500  tabular-nums leading-none tracking-tighter">
            {Math.max(0, 100 - (victimHistory.filter((a: any) => a.closureReason?.includes('Misuse')).length * 20))}%
          </h3>
        </div>
      </div>

      {/* 🛡️ SUPPORT NODES */}
      <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl  space-y-4">
        <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Heart size={10} className="text-rose-500" /> Support Nodes</p>
        <div className="space-y-2.5">
          {victimData.primaryGuardian && (
            <div className="flex justify-between items-center bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 ">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-black text-white uppercase ">{victimData.primaryGuardian.name}</span>
                <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[5px] font-black rounded-xl uppercase tracking-widest">Primary</span>
              </div>
              <span className="text-[13px] font-black text-rose-400 tabular-nums">{victimData.primaryGuardian.phone}</span>
            </div>
          )}
          {guardians.map((g: any) => (
            <div key={g.id} className="flex justify-between items-center bg-black/20 px-4 py-2 rounded-xl border border-white/5">
              <span className="text-[13px] font-black text-white uppercase ">{g.name}</span>
              <span className="text-[13px] font-black text-blue-400 tabular-nums">{g.phone || g.phoneNumber}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 📊 PROTOCOL STRIKES */}
      <div className="bg-[#1E293B]/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl  flex items-center justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5"><Activity size={40} /></div>
        <div>
          <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest leading-none">Protocol Strikes</p>
          <p className="text-[14px] text-gray-500 font-bold uppercase tracking-widest mt-1">Misuse Strike Penalty Counter</p>
        </div>
        <h3 className="text-3xl font-black text-rose-500  tabular-nums leading-none">{victimData.sosStrikeCount || 0}</h3>
      </div>
    </div>
  );
};
