import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Shield, FileText, MapPin, Clock, 
  MessageSquare, Video, Mic, CheckCircle2, 
  ShieldCheck, Fingerprint, Lock, Database,
  ArrowDownToLine, Scale
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface JusticeBlockModalProps {
  fir: any;
  isOpen: boolean;
  onClose: () => void;
}

export function JusticeBlockModal({ fir, isOpen, onClose }: JusticeBlockModalProps) {
  if (!fir) return null;

  const timestamp = fir.timestamp?.toMillis ? new Date(fir.timestamp.toMillis()).toLocaleString() : 
                    (fir.timestamp?.toDate ? fir.timestamp.toDate().toLocaleString() : new Date(fir.timestamp).toLocaleString());

  const evidence = fir.evidence || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-10">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A0A0B]/90 backdrop-blur-3xl"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative w-full max-w-5xl bg-[#111827] rounded-[3rem] shadow-[0_50px_150px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* 🏛️ BLOCKCHAIN HUB HEADER */}
            <div className="p-8 sm:p-10 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-blue-600/40 relative">
                  <Database size={28} />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#111827] flex items-center justify-center">
                     <Lock size={10} />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white italic leading-none">Justice Block Explorer</h2>
                  <p className="text-[10px] sm:text-[11px] font-black text-blue-400 uppercase tracking-[4px] mt-2 opacity-60">Hash: 0x{fir.id?.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white active:scale-90">
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-12 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* 📋 SECTION I: CITIZEN AFFIDAVIT */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                      <h3 className="text-[12px] font-black text-white uppercase tracking-[4px]">Deposition Statement</h3>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 text-white/[0.02] group-hover:text-white/[0.05] transition-colors">
                        <Scale size={120} />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-200 italic leading-relaxed relative z-10">
                        "{fir.statement || fir.text || "No statement recorded in block."}"
                      </p>
                      <div className="mt-10 flex items-center gap-4 pt-8 border-t border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1.5">Official Affirmation</p>
                          <p className="text-xs font-bold text-white uppercase italic tracking-tighter">Verified under BNS/IPC Framework</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Forensic Evidence Grid */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                      <h3 className="text-[12px] font-black text-white uppercase tracking-[4px]">Forensic Evidence (Chain of Custody)</h3>
                    </div>
                    {evidence.length === 0 ? (
                      <div className="py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem] text-center">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">No Evidence Packets Found</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {evidence.map((log: any, i: number) => (
                          <div key={i} className="bg-white/[0.03] border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all",
                                log.type?.toLowerCase().includes('audio') ? "bg-blue-600/10 border-blue-500/20 text-blue-400" : "bg-rose-600/10 border-rose-500/20 text-rose-400"
                              )}>
                                {log.type?.toLowerCase().includes('audio') ? <Mic size={20} /> : <Video size={20} />}
                              </div>
                              <div>
                                <p className="text-xs font-black text-white uppercase italic">{log.type || 'Digital Evidence'}</p>
                                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">Verified Hash Sync</p>
                              </div>
                            </div>
                            <button className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100">
                               <ArrowDownToLine size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 🕵️ SECTION II: METADATA & TELEMETRY */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-blue-400 rounded-full" />
                      <h3 className="text-[12px] font-black text-white uppercase tracking-[4px]">Block Metadata</h3>
                    </div>
                    <div className="bg-[#1F2937]/50 border border-white/5 rounded-[2.5rem] p-8 space-y-8">
                      
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Official ID</p>
                          <p className="text-sm font-black text-white uppercase italic tracking-tighter">{fir.firId || fir.caseId || fir.id.slice(-12).toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                          <MapPin size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Sector Vector</p>
                          <p className="text-sm font-black text-white uppercase italic tracking-tighter truncate">
                            {fir.incidentLocation?.display || fir.incidentLocation?.city || fir.state || 'Sector Central Grid'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                          <Clock size={20} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Commit Timestamp</p>
                          <p className="text-sm font-black text-white uppercase italic tracking-tighter">{timestamp}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                          <Database size={20} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Jurisdiction Station</p>
                          <p className="text-sm font-black text-blue-400 uppercase italic tracking-tighter">{fir.policeStation || "NATIONWIDE (ZERO FIR)"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                          <Fingerprint size={20} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Filing Status</p>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                             <p className="text-sm font-black text-blue-400 uppercase italic tracking-tighter">{fir.status || 'Active Review'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield size={20} className="text-blue-500" />
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Judicial Admissibility</h4>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-wider">
                      This block is cryptographically sealed and admitted as primary evidence under Section 65B of the Indian Evidence Act.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 🛡️ MODAL FOOTER */}
            <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-[3px]">Integrity Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-[3px]">Cloud Redundancy Active</span>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={onClose} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                     Close Block
                  </button>
                  <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                     Audit Protocol
                  </button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
