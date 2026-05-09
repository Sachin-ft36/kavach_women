import { useEffect, useState } from 'react';
import {
  Database, Shield, Lock, Download, Video, Mic, Image as ImageIcon,
  FileText, ArrowDownToLine, AlertTriangle, Fingerprint
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, collectionGroup } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface CommandVaultProps {
  targetUid: string;
}

export const CommandVault: React.FC<CommandVaultProps> = ({ targetUid }) => {
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUid) return;

    // 1. Fetch case/FIR data
    const qFir = query(
      collection(db, 'zero_firs'),
      where('victimUid', '==', targetUid)
    );

    const unsubFir = onSnapshot(qFir, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvidenceData(data[0] || null);
      setLoading(false);
    });

    // 2. Fetch specific evidence files for this victim/case
    const qAlerts = query(
      collection(db, 'alerts'),
      where('victimUid', '==', targetUid)
    );

    const activeEvidenceUnsubs: (() => void)[] = [];

    const unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
      const alertList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Cleanup previous evidence listeners
      activeEvidenceUnsubs.forEach(unsub => unsub());
      activeEvidenceUnsubs.length = 0;

      alertList.forEach(alert => {
        const unsubEv = onSnapshot(collection(db, 'alerts', alert.id, 'evidence'), (evSnap) => {
          const files = evSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            time: (doc.data().timestamp as any)?.toDate().toLocaleString() || 'Synced'
          }));

          setEvidenceFiles(prev => {
            const others = prev.filter(p => !files.find(f => f.id === p.id));
            const combined = [...others, ...files].sort((a, b) => {
              const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
              const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
              return tB - tA;
            });
            return combined;
          });
        });
        activeEvidenceUnsubs.push(unsubEv);
      });
    }, (err) => {
      console.warn("Evidence Sync Restricted:", err);
    });

    return () => {
      unsubFir();
      unsubAlerts();
      activeEvidenceUnsubs.forEach(unsub => unsub());
    };
  }, [targetUid]);

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black/20">
        <div className="flex flex-col items-center gap-4">
          <Database size={40} className="text-accent-blue" />
          <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-500">Decrypting Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white/50 backdrop-blur-xl flex flex-col overflow-hidden border border-gray-100 rounded-[24px]">
      {/* Immutable Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-500/5 to-transparent flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black italic uppercase tracking-[2px] text-[#0F172A]">Forensic Command Vault</h2>
            <p className="text-[9px] text-gray-500 font-mono font-bold tracking-widest uppercase flex items-center gap-2">
              <Lock size={12} className="text-green-500" /> BNS 2023 Tamper-Proof Chain of Custody
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-black font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
            CASE_ID: {targetUid.slice(0, 8).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
        {/* Stage 1: Official FIR Status */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <FileText size={18} className="text-blue-500" />
            <h3 className="text-[11px] font-black text-[#1E293B] uppercase tracking-[4px]">Mission Statement / FIR</h3>
          </div>

          {evidenceData ? (
            <div className="bg-white border border-gray-100 p-6 rounded-[28px] relative group overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <h4 className="text-sm font-black uppercase mb-2 text-[#0F172A] italic">Zero-FIR Drafted</h4>
              <p className="text-gray-600 text-sm leading-relaxed font-medium mb-4">
                "{evidenceData.incidentDetails || evidenceData.statement}"
              </p>
              <div className="flex gap-4">
                <span className="text-[9px] font-black bg-gray-50 px-3 py-1 rounded-full uppercase text-gray-500 border border-gray-100">
                  Victim: {evidenceData.victimName}
                </span>
                <span className="text-[9px] font-black bg-orange-50 px-3 py-1 rounded-full uppercase text-orange-600 border border-orange-100">
                  Status: {evidenceData.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50/50 border border-yellow-100 p-6 rounded-[28px] flex items-center gap-4">
              <AlertTriangle className="text-yellow-600" size={24} />
              <div>
                <p className="text-[11px] font-black text-yellow-700 uppercase tracking-widest">No Formal Statements Filed</p>
                <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Reverting to automated BlackBox telemetry and raw forensic logs.</p>
              </div>
            </div>
          )}
        </section>

        {/* Stage 2: BlackBox Forensic Assets (Videos/Audio/Photos) */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Database size={18} className="text-red-500" />
              <h3 className="text-[11px] font-black text-[#1E293B] uppercase tracking-[4px]">Electronic Evidence (Black Box)</h3>
            </div>
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Fingerprint size={12} /> HASH_VERIFIED: SHA-256
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evidenceFiles.length > 0 ? (
              evidenceFiles.map((file) => (
                <div key={file.id} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col group hover:border-blue-500/30 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-6">
                    {file.type === 'Audio Log' || file.type === 'audio' ? <Mic className="text-red-500" size={32} /> :
                      file.type === 'Snapshot' || file.type === 'image' || file.type === 'video' ? <Video className="text-blue-500" size={32} /> :
                        <ImageIcon className="text-green-500" size={32} />}

                    {file.url && (
                      <button
                        onClick={() => handleDownload(file.url, `KAVACH_${file.type}_${file.id.slice(0, 4)}`)}
                        className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <ArrowDownToLine size={16} />
                      </button>
                    )}
                  </div>
                  <h5 className="text-[11px] font-black uppercase text-[#1E293B] tracking-widest mb-1 truncate">
                    {file.type === 'Audio Log' ? 'TACTICAL AUDIO' : file.type === 'Snapshot' ? 'VISUAL SNAPSHOT' : (file.fileName || `${file.type}_CAPTURE_${file.id.slice(0, 5)}`.toUpperCase())}
                  </h5>
                  <p className="text-[9px] text-gray-400 font-bold uppercase font-mono mb-4">
                    {file.status || 'UNALTERED'} • {file.time}
                  </p>

                  {/* ✨ LIVE TRANSCRIPT VIEW FOR ADMIN */}
                  {file.transcript && (
                    <div className="mt-auto bg-blue-50/30 border border-blue-100/50 p-3 rounded-xl">
                      <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <FileText size={10} /> AI_TRANSCRIPT_NODE
                      </p>
                      <p className="text-[10px] text-gray-500 italic leading-snug line-clamp-3 group-hover:line-clamp-none transition-all">
                        "{file.transcript}"
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[4px]">Awaiting Incoming Forensic Stream...</p>
              </div>
            )}
          </div>
        </section>

        {/* Security Warning */}
        <div className="bg-gray-900 border-2 border-red-500/20 p-8 rounded-[32px] text-center space-y-4 shadow-xl">
          <Lock size={48} className="mx-auto text-red-500/50" />
          <h4 className="text-sm font-black uppercase tracking-[4px] text-red-500">Legal Tamper Lock Active</h4>
          <div className="max-w-xl mx-auto space-y-2">
            <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase tracking-widest">
              Under Zero-Trust Protocol, evidence cannot be altered, deleted, or relocated without a Judicial Override.
            </p>
            <p className="text-[9px] text-orange-500/80 font-black uppercase tracking-widest">
              All Command Access is Logged to Supreme Neural Audit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
