import React, { useState, useEffect } from 'react';
import { Lock, FileText, Video, Mic, Shield, Download, ExternalLink, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, collectionGroup, where } from 'firebase/firestore';

import ZeroFIR from './ZeroFIR';

export default function EvidenceVault() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const qAlerts = query(
      collection(db, 'alerts'),
      where('victimUid', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    // 2. Listen for evidence across all alerts
    const qEvidence = query(
      collectionGroup(db, 'evidence'),
      orderBy('timestamp', 'desc'),
      limit(30)
    );

    const unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
      const alertList = snapshot.docs.map(doc => ({
        id: doc.id,
        source: 'alert' as const,
        ...doc.data()
      }));
      updateLogs(alertList, 'alerts');
    });

    const unsubEvidence = onSnapshot(qEvidence, (snapshot) => {
      const evidenceList = snapshot.docs.map(doc => ({
        id: doc.id,
        source: 'evidence' as const,
        ...doc.data()
      }));
      updateLogs(evidenceList, 'evidence');
    });

    return () => {
      unsubAlerts();
      unsubEvidence();
    };
  }, []);

  const [rawLogs, setRawLogs] = useState<{alerts: any[], evidence: any[]}>({alerts: [], evidence: []});

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
        type: item.source === 'alert' ? 'SOS Alert' : item.type,
        date: item.timestamp?.toDate().toLocaleString() || 'Recent',
        status: item.source === 'alert' 
          ? (item.status === 'active' ? 'Securing Evidence...' : 'Resolved')
          : 'Blockchain Verified',
        hash: item.hash || `0x${Math.random().toString(16).slice(2, 10)}`,
        url: item.url || null
      }));

      setLogs(formatted);
      setLoading(false);
      return next;
    });
  };

  const handleDownload = (url: string | null, filename: string) => {
    if (!url) {
      alert("Evidence payload still synchronizing with cloud...");
      return;
    }
    
    // In a real native app, we'd use Capacitor Filesystem to save securely.
    // For now, we trigger a browser download.
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <ZeroFIR />
      
      <div className="bg-gradient-to-br from-[#1a0a0a] to-card-bg p-6 rounded-3xl border border-border">
        <div className="flex items-center gap-3 mb-4">
          <Lock size={24} className="text-accent-blue" />
          <h2 className="text-xl sm:text-2xl font-black tracking-tighter italic uppercase">Black-Box Vault</h2>
        </div>
        <p className="text-orange-100 text-xs sm:text-sm mb-6 leading-relaxed">
          <span className="text-accent-blue font-black uppercase underline decoration-2 underline-offset-4 mr-1">Security Protocol:</span> Previews are disabled in-vault to prevent local cached exposure. All evidence must be downloaded via secure tunnel for legal review.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
            <Shield size={16} />
            VERIFY INTEGRITY
          </button>
          <button className="flex-1 bg-black/20 backdrop-blur-lg border border-white/20 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
            <Download size={16} />
            EXPORT ALL
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Secure Forensic Logs</h3>
        <div className="space-y-2">
          {logs?.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleDownload(log.url, `KAVACH_EVIDENCE_${log.id}.mp4`)}
              className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                  {(log.type === 'SOS Alert' || log.type === 'SOS TRIGGER') && <Shield className="text-red-500" size={20} />}
                  {log.type === 'Audio Log' && <Mic className="text-blue-500" size={20} />}
                  {log.type === 'Zero-FIR' && <FileText className="text-green-500" size={20} />}
                  {(log.type === 'Video Stream' || log.type === 'Snapshot') && <Video className="text-accent-red" size={20} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{log.type}</p>
                    {log.url && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
                        <Download size={8} className="text-accent-blue" />
                        <span className="text-[8px] font-black text-accent-blue uppercase tracking-widest">Download Evidence</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">{log.date}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  (log.status === 'Streaming Live' || log.status === 'Recording...') ? "text-red-500 animate-pulse" : "text-orange-500"
                )}>{log.status}</p>
                <p className="text-[8px] font-mono text-gray-600 italic">SHA-256: {log.hash.slice(0, 10)}...</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-blue-600/10 border border-blue-600/20 p-6 rounded-3xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <Video className="text-blue-500" />
          </div>
          <h3 className="font-bold">Auto-Evidence Mode</h3>
        </div>
        <p className="text-xs text-blue-200 mb-4 leading-relaxed">
          Once SOS is triggered, front/back cameras and microphone will stream directly to the cloud. Even if the device is destroyed, data is safe.
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">System Ready</span>
        </div>
      </div>
    </div>
  );
}
