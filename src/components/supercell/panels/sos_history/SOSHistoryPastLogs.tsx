import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Calendar, User, Phone, Mail, Battery, Users, ChevronRight, MapPin, ShieldCheck } from 'lucide-react';

export const SOSHistoryPastLogs = ({
  victimData,
  victimHistory,
  guardians,
  onOpenEvidence,
  setSelectedAlertId,
  onViewReplay
}: any) => {
  return (
    <div className="w-[50%] lg:w-[55%] h-full overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6 border-r border-white/5 bg-[#0F172A]">
      <div className="space-y-1 mb-6">
        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[11px] font-black rounded-xl border border-blue-500/20 uppercase tracking-widest leading-none">Archived Records</span>
        <h1 className="text-xl font-black text-white uppercase  leading-none tracking-tighter mt-1">Incident Ledger History</h1>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.1em] mt-1">Double scrollable forensic archive for {victimData.name}</p>
      </div>

      <div className="space-y-6">
        {victimHistory.length === 0 ? (
          <div className="py-20 text-center opacity-20 border-2 border-dashed border-white/5 rounded-[2rem]">
            <ShieldAlert size={60} className="mx-auto mb-4" />
            <p className="text-sm font-black uppercase tracking-[8px]">No Records in Ledger</p>
          </div>
        ) : (
          victimHistory.map((alert: any, idx: number) => (
            <motion.div 
              key={alert.id}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#1E293B]/40 rounded-[2rem] border border-white/5 shadow-2xl p-6  relative overflow-hidden group"
            >
              {/* HEADER */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-600 text-white shadow-lg/10 rounded-[14px] flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h5 className="text-[14px] font-black text-white uppercase  tracking-tighter leading-none">
                      {alert.timestamp?.toDate ? alert.timestamp.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase() : 'UNKNOWN DATE'}
                    </h5>
                    <p className="text-[11px] font-black text-rose-500 uppercase tracking-[1.5px] mt-1.5">
                      TRIGGERED AT: {alert.timestamp?.toDate ? alert.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[12px] font-black text-emerald-500 uppercase tracking-[2px]">
                  Resolved
                </div>
              </div>

              {/* DATA GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Gender', value: victimData.gender || 'FEMALE', icon: User },
                  { label: 'Role', value: victimData.role || 'CITIZEN', icon: ShieldCheck },
                  { label: 'Phone', value: victimData.phoneNumber || victimData.phone || 'NO RECORD', icon: Phone },
                  { label: 'Email Address', value: victimData.email || 'NO EMAIL', icon: Mail },
                  { label: 'Battery Level', value: (() => { const lvl = alert.batteryLevel ?? alert.battery ?? alert.telemetry?.battery ?? alert.deviceStatus?.battery ?? alert.deviceBattery; return lvl !== undefined && lvl !== null ? (typeof lvl === 'string' && lvl.includes('%') ? lvl : `${lvl}%`) : '89%'; })(), icon: Battery }
                ].map((item, i) => (
                  <div key={i} className="bg-black/25 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between">
                    <p className="text-[14px] font-black text-gray-500 uppercase tracking-widest mb-1 leading-none">{item.label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <item.icon size={9} className="text-blue-400 shrink-0" />
                      <span className="text-[12px] font-bold text-gray-200 uppercase tracking-tight truncate w-full">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* GUARDIAN NETWORK */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-6">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Users size={10} className="text-rose-500" /> Connected Guardian Network
                </p>
                {guardians.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {guardians.map((g: any, idx: number) => (
                      <div key={idx} className="bg-black/20 px-3 py-2 rounded-xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-black text-white uppercase  leading-none">{g.name}</span>
                          <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[5px] font-black rounded-xl uppercase tracking-widest leading-none">{g.relation || 'Guardian'}</span>
                        </div>
                        <span className="text-[12px] font-black text-gray-400 tabular-nums leading-none">{g.phone || g.phoneNumber}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[12px] text-gray-500 font-bold uppercase tracking-widest ">No guardians registered.</div>
                )}
              </div>

              {/* DETAILS SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 p-5 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Resolution Log</p>
                    <p className="text-[13px] font-black text-emerald-500 uppercase  tracking-widest">Verified Rescue Completed</p>
                    <p className="text-[12px] font-bold text-gray-400 uppercase  mt-1.5">"{alert.closureReason || 'Mission Accomplished'}"</p>
                    {alert.feedback && (
                      <div className="bg-amber-500/10 p-3 mt-3 rounded-xl border border-amber-500/20">
                         <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Citizen Feedback</p>
                         <p className="text-[11px] font-bold text-amber-200 italic">"{alert.feedback}"</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <button 
                      onClick={() => onOpenEvidence?.(alert.id)}
                      className="text-[12px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Open Evidence Vault <ChevronRight size={10} />
                    </button>
                    <button 
                      onClick={() => setSelectedAlertId(alert.id)}
                      className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[12px] font-black text-emerald-400 hover:bg-emerald-500 hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer  shadow-emerald-500/10"
                    >
                      <MapPin size={10} /> Load Tactical Map
                    </button>
                  </div>
                </div>
                <div className="bg-black/20 p-5 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Savior & Responders</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(alert.activeResponders || []).map((r: any) => (
                        <div 
                          key={r.uid} 
                          onClick={() => {
                            onViewReplay?.(alert.id);
                          }}
                          className="px-2.5 py-1 bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:bg-emerald-600 hover:scale-105 transition-all active:scale-95  shadow-emerald-500/20"
                        >
                          <ShieldCheck size={8} />
                          {r.name}
                        </div>
                      ))}
                      {(!alert.activeResponders || alert.activeResponders.length === 0) && (
                        <div className="text-[12px] font-bold text-gray-600 ">No Responder Logged</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
