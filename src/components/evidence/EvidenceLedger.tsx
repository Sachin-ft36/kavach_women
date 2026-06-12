import React from 'react';
import { Database, Mic, Video, Shield, Download, Folder, ChevronDown, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface EvidenceLedgerProps {
  logs: any[];
  firs: any[];
  handleDownload: (url: string, filename: string) => void;
}

export function EvidenceLedger({ logs, firs, handleDownload }: EvidenceLedgerProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-2">
        <Database size={18} className="text-[#94A3B8]" />
        <h3 className="text-xs font-black text-[#94A3B8] uppercase tracking-[4px]">Forensic Ledger</h3>
      </div>
      
      <div className="grid gap-4">
        {logs.length > 0 ? (
          <>
            {/* 🔴 LATEST RECORD */}
            <div className="mb-4">
              {[logs[0]].map((log) => {
                const firsWithThisEvidence = firs.filter(f => 
                  f.evidence?.some((ev: any) => ev.id === log.id || ev.hash === log.hash)
                );
                const isLinked = firsWithThisEvidence.length > 0;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50/50 backdrop-blur-md border border-red-100 rounded-[24px] p-5 flex items-center justify-between group hover:bg-white transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                        log.type?.includes('SOS') ? "bg-red-50 text-red-500 border-red-200" : "bg-blue-50 text-blue-500 border-blue-200"
                      )}>
                        {log.type?.includes('Audio') ? <Mic size={20} /> : <Video size={20} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#1E293B] text-sm truncate">LATEST: {log.type}</h4>
                          {isLinked && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-[#059669] border border-emerald-100 rounded-md text-[8px] font-black uppercase tracking-tighter">
                              Linked to Case
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest mt-0.5">{log.date}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center gap-1">
                       <div className="flex items-center gap-2">
                         {log.digitalSignature && (
                           <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100" title="ECDSA Cryptographic Signature Present">
                             <Shield size={10} />
                             <span className="text-[8px] font-black uppercase tracking-widest">Signed</span>
                           </div>
                         )}
                         {log.url && (
                           <button 
                             onClick={() => handleDownload(log.url, `KAVACH_${log.hash}.webm`)}
                             className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#2563EB] transition-all"
                           >
                             <Download size={16} />
                           </button>
                         )}
                       </div>
                       <span className="text-[10px] font-mono text-gray-400 font-bold pr-2">#{log.hash.slice(0,8)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 🕰️ HISTORY RECORDS FOLDER */}
            {logs.length > 1 && (
              <details className="group mt-6">
                <summary className="flex items-center gap-4 px-5 py-4 bg-white border border-[#E2E8F0] rounded-[24px] cursor-pointer list-none select-none hover:bg-gray-50 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-[#2563EB] group-hover:border-blue-100 transition-all shrink-0">
                    <Folder size={22} className="fill-current opacity-20" />
                    <Folder size={22} className="absolute" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#1E293B] text-sm truncate">Past Evidence Archive</h4>
                    <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-widest mt-0.5">{logs.length - 1} Records Stored</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-open:rotate-180 transition-transform duration-300 shrink-0">
                    <ChevronDown size={16} strokeWidth={3} />
                  </div>
                </summary>
                <div className="grid gap-3 mt-4 max-h-[45vh] overflow-y-auto custom-scrollbar p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[24px]">
                  {logs.slice(1).map((log) => {
                    const firsWithThisEvidence = firs.filter(f => 
                      f.evidence?.some((ev: any) => ev.id === log.id || ev.hash === log.hash)
                    );
                    const isLinked = firsWithThisEvidence.length > 0;

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/60 backdrop-blur-md border border-[#F1F5F9] rounded-[20px] p-3 flex items-center justify-between group/item hover:bg-white transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                            log.type?.includes('SOS') ? "bg-red-50 text-red-400 border-red-50" : "bg-blue-50 text-blue-400 border-blue-50"
                          )}>
                            {log.type?.includes('Audio') ? <Mic size={16} /> : <Video size={16} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-600 text-xs truncate">{log.type}</h4>
                              {isLinked && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[7px] font-black uppercase tracking-tighter">
                                  Linked
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{log.date}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                           <div className="flex items-center gap-2">
                             {log.digitalSignature && (
                               <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100" title="ECDSA Cryptographic Signature Present">
                                 <Shield size={8} />
                                 <span className="text-[7px] font-black uppercase tracking-widest">Signed</span>
                               </div>
                             )}
                             {log.url && (
                               <button 
                                 onClick={() => handleDownload(log.url, `KAVACH_${log.hash}.webm`)}
                                 className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#2563EB] transition-all"
                               >
                                 <Download size={14} />
                               </button>
                             )}
                           </div>
                           <span className="text-[8px] font-mono text-gray-300 font-bold pr-1">#{log.hash.slice(0,8)}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </details>
            )}
          </>
        ) : (
          <div className="bg-white/40 backdrop-blur-sm border-2 border-dashed border-[#F1F5F9] rounded-[32px] p-10 sm:p-20 flex flex-col items-center text-center gap-6">
            <div className="relative">
               <Database size={48} className="text-[#E2E8F0]" />
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border border-[#E2E8F0] flex items-center justify-center">
                  <Clock size={10} className="text-[#94A3B8]" />
               </div>
            </div>
            <div>
              <h4 className="font-bold text-[#94A3B8] uppercase tracking-[2px] text-[10px]">Vault Activity Monitor</h4>
              <p className="text-[11px] text-[#64748B] mt-2 max-w-xs leading-relaxed font-medium">
                No forensic records detected in your safety grid.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
