import React from 'react';
import { ShieldAlert, Calendar, User, Phone, Mail, Battery, Users, ChevronRight, MapPin, ShieldCheck, Lock, AlertTriangle, Ban, Activity, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function SOSHistoryPanel({
  victimData,
  victimHistory,
  guardians,
  pendingAppeal,
  onViewReplay,
  handleAction,
  handleRestoreAccess,
  handlePermanentBan,
  onOpenEvidence,
  setSelectedAlertId
}: any) {
  if (!victimData) {
    return (
      <div className="h-full flex flex-col items-center justify-center opacity-20">
        <ShieldAlert size={120} strokeWidth={0.5} className="mb-8" />
        <p className="text-xl font-black uppercase tracking-[10px]">Select Incident Record</p>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-row h-full w-full overflow-hidden">
      {/* LEFT COLUMN: PAST LOGS */}
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
                    { label: 'Battery Level', value: alert.batteryLevel || alert.battery || (alert.deviceStatus && alert.deviceStatus.battery) || alert.deviceBattery || '89%', icon: Battery }
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

      {/* RIGHT COLUMN: VICTIM DOSSIER DETAILS */}
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
    </div>
  );
}
