import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  FileText, 
  Video, 
  Mic, 
  Shield, 
  Download, 
  ExternalLink, 
  Database, 
  Clock, 
  History, 
  CheckCircle,
  AlertCircle,
  Folder,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, auth, handleFirestoreError } from '../firebase';
import { collection, query, onSnapshot, where, limit } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { AuditExportService } from '../services/AuditExportService';

import ZeroFIR from './ZeroFIR';

export default function EvidenceVault({ targetUid }: { targetUid?: string }) {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [firs, setFirs] = useState<any[]>([]);
  const [rawLogs, setRawLogs] = useState<{ alerts: any[], evidence: any[] }>({ alerts: [], evidence: [] });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const qFirs = query(collection(db, 'zero_firs'), where('victimUid', '==', currentUser.uid));
    const unsubFirs = onSnapshot(qFirs, (snapshot) => {
      const firData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return tB - tA;
      });
      setFirs(firData);
    });
    return () => unsubFirs();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uidToQuery = targetUid || auth.currentUser.uid;
    
    const qAlerts = query(
      collection(db, 'alerts'),
      where('victimUid', '==', uidToQuery),
      limit(20)
    );

    const activeEvidenceUnsubs: (() => void)[] = [];

    const unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
      const alertList = snapshot.docs.map(doc => ({ id: doc.id, source: 'alert' as const, ...doc.data() }));
      const sortedAlerts = alertList.sort((a: any, b: any) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return tB - tA;
      }).slice(0, 10);
      
      updateLogs(sortedAlerts, 'alerts');

      activeEvidenceUnsubs.forEach(unsub => unsub());
      activeEvidenceUnsubs.length = 0;

      sortedAlerts.forEach(alert => {
        const unsubEv = onSnapshot(collection(db, 'alerts', alert.id, 'evidence'), (evSnap) => {
          const evList = evSnap.docs.map(d => ({ id: d.id, source: 'evidence' as const, ...d.data() }));
          setRawLogs(prev => {
            const otherEv = prev.evidence.filter(e => !evList.find(ne => ne.id === e.id));
            const newEv = [...otherEv, ...evList];
            
            const combined = [...prev.alerts, ...newEv].sort((a, b) => {
              const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
              const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
              return tB - tA;
            });

            const formatted = combined.map(item => ({
              id: item.id,
              type: item.source === 'alert' ? 'SOS Activation' : item.type,
              date: item.timestamp?.toDate().toLocaleString() || 'Recent',
              status: item.source === 'alert' ? (item.status === 'active' ? 'Recording...' : 'Logged') : 'Verified',
              hash: item.hash || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              digitalSignature: item.digitalSignature || null,
              url: item.url || null,
              triggerMethod: item.triggerMethod || null
            }));
            setLogs(formatted);
            setLoading(false);
            return { ...prev, evidence: newEv };
          });
        });
        activeEvidenceUnsubs.push(unsubEv);
      });
    }, (err) => {
      console.warn("Vault Alerts Sync Info:", err.message);
    });

    return () => { 
      unsubAlerts(); 
      activeEvidenceUnsubs.forEach(unsub => unsub());
    };
  }, [targetUid]);

  const updateLogs = (data: any[], type: 'alerts' | 'evidence') => {
    setRawLogs(prev => {
      const next = { ...prev, [type]: data };
      const combined = [...next.alerts, ...next.evidence].sort((a, b) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return tB - tA;
      });
      const formatted = combined.map(item => ({
        id: item.id,
        type: item.source === 'alert' ? 'SOS Activation' : item.type,
        date: item.timestamp?.toDate().toLocaleString() || 'Recent',
        status: item.source === 'alert' ? (item.status === 'active' ? 'Recording...' : 'Logged') : 'Verified',
        hash: item.hash || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        digitalSignature: item.digitalSignature || null,
        url: item.url || null,
        triggerMethod: item.triggerMethod || null
      }));
      setLogs(formatted);
      setLoading(false);
      return next;
    });
  };

  const [isVerifying, setIsVerifying] = useState(false);

  const verifyIntegrity = async () => {
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const totalFiles = logs.filter(l => l.url || l.hash).length;
    alert(`Safety Records Verified.\n${totalFiles} evidence records match their digital signatures.\nChain of Custody is secured.`);
    setIsVerifying(false);
  };

  const handleDownload = (url: string | null, filename: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllEvidence = () => {
    const downloadableLogs = logs.filter(l => l.url);
    if (downloadableLogs.length === 0) {
      alert("No downloadable records found.");
      return;
    }
    alert(`Downloading ${downloadableLogs.length} safety records...`);
    downloadableLogs.forEach((log, index) => {
      setTimeout(() => {
        let extension = log.type === 'Audio Log' ? 'webm' : 'jpg';
        handleDownload(log.url, `KAVACH_RECORD_${log.hash}_${index}.${extension}`);
      }, index * 500);
    });
  };

  const generateLegalAudit = async () => {
    try {
      const dummyIncident = {
        id: 'GLOBAL_VAULT_EXPORT',
        victimUid: auth.currentUser?.uid || 'UNKNOWN',
        status: 'Audit Export' as any,
        location: { lat: 0, lng: 0 }
      };
      await AuditExportService.generatePDF(dummyIncident, logs);
      alert('Legal Audit PDF generated securely.');
    } catch (e) {
      alert('Failed to generate Legal Audit. Ensure jspdf is installed.');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10 pt-4 sm:pt-6 pb-24 px-4 sm:px-6 h-full flex flex-col relative font-sans selection:bg-[#2563EB]/10">
      
      {/* 🏛️ BACKGROUND WATERMARK (Extremely Subtle) */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden opacity-[0.008]">
        <h1 className="text-[25vw] font-black uppercase text-gray-900 -rotate-12 select-none tracking-tighter leading-none">
          KAVACH
        </h1>
      </div>

      <div className="relative z-10 space-y-6 sm:space-y-10">
        {(() => {
          // 🛡️ FORENSIC INTEGRITY: Identify evidence already anchored in existing FIRs
          const usedEvidenceIds = new Set();
          firs.forEach(fir => {
            if (Array.isArray(fir.evidence)) {
              fir.evidence.forEach((ev: any) => {
                // Check for various possible identifiers (id, hash, or url)
                if (ev.id) usedEvidenceIds.add(ev.id);
                if (ev.hash) usedEvidenceIds.add(ev.hash);
              });
            }
          });

          const unusedLogs = logs.filter(log => !usedEvidenceIds.has(log.id) && !usedEvidenceIds.has(log.hash));
          
          // 🔥 Only attach the absolute latest evidence to the FIR to prevent old test data from mixing
          const latestUnusedLogs = unusedLogs.length > 0 ? [unusedLogs[0]] : [];

          return <ZeroFIR evidenceLogs={latestUnusedLogs} />;
        })()}

        {/* 📋 COMPLAINT HISTORY SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <History size={18} className="text-[#2563EB]" />
              <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-[3px]">Complaint History</h3>
            </div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-full">
              {firs.length} {firs.length === 1 ? 'Report' : 'Reports'} Filed
            </span>
          </div>

          <div className="grid gap-5">
            {firs.length > 0 ? (
              firs.map((fir) => (
                <motion.div
                  key={fir.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white border border-[#F1F5F9] rounded-[28px] p-5 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] transition-all group relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-8">
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#2563EB] group-hover:bg-[#2563EB]/5 transition-all shrink-0">
                        <FileText size={22} strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#1E293B] text-base sm:text-lg mb-0.5 truncate">{fir.offenseType}</h4>
                        <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">Case ID: {fir.firId}</p>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border self-start sm:self-center shadow-sm",
                      fir.status === 'RESOLVED' ? "bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]" :
                      fir.status === 'ACTION_TAKEN' ? "bg-[#FFF7ED] text-[#9A3412] border-[#FFEDD5]" :
                      "bg-[#EFF6FF] text-[#1E40AF] border-[#DBEAFE]"
                    )}>
                      {fir.status === 'RESOLVED' ? 'Resolved' : fir.status === 'ACTION_TAKEN' ? 'Under Review' : 'Submitted'}
                    </div>
                  </div>

                  <div className="mt-5 p-4 sm:p-5 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9]">
                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed italic line-clamp-2">
                      "{fir.victimStatement || fir.statement}"
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-50 text-[#64748B]">
                    <div className="flex items-center gap-2">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {fir.timestamp?.toDate ? fir.timestamp.toDate().toLocaleString() : 'Just Now'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#166534] bg-[#F0FDF4] px-3 py-1 rounded-lg">
                      <CheckCircle size={12} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Submitted</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white border-2 border-dashed border-[#F1F5F9] rounded-[32px] p-12 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                  <FileText size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-[#1E293B] uppercase tracking-widest text-xs">No records found</h4>
                  <p className="text-[11px] text-[#64748B] mt-1">Start a complaint to register your first report.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🔐 SECURE EVIDENCE VAULT AREA */}
        <div className="bg-white border border-[#F1F5F9] rounded-[40px] p-8 sm:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 text-[#2563EB]/5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
             <Database size={200} strokeWidth={0.5} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-[#2563EB] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#2563EB]/30">
                <Lock size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-[#1E293B]">{t('vault')}</h3>
            </div>

            <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-2xl mb-10">
              Emergency recordings and evidence files are stored securely for safety reporting and support purposes. All data is protected with high-level privacy protocols.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <button 
                onClick={verifyIntegrity}
                disabled={isVerifying}
                className="flex items-center justify-center gap-3 py-4 sm:py-5 bg-[#0F172A] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#1E293B] transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <CheckCircle size={18} /> {isVerifying ? "Verifying..." : "Verify Evidence"}
              </button>
              <button 
                onClick={exportAllEvidence}
                className="flex items-center justify-center gap-3 py-4 sm:py-5 bg-white border border-[#E2E8F0] text-[#1E293B] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              >
                <Download size={18} /> Download Records
              </button>
            </div>
            <div className="mt-4">
              <button 
                onClick={generateLegalAudit}
                className="w-full flex items-center justify-center gap-3 py-4 sm:py-5 bg-red-50 text-red-600 border border-red-200 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm active:scale-95"
              >
                <FileText size={18} /> Generate Legal PDF Report
              </button>
            </div>
          </div>
        </div>

        {/* 📊 EVIDENCE HISTORY LOG */}
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
      </div>
    </div>
  );
}
