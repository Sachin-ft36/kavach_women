import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useKavachStore } from '../store/useKavachStore';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { History, MapPin, Clock, ShieldAlert, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface ForensicLog {
  id: string;
  triggerMethod: string;
  timestamp: any;
  status: string;
  coords: [number, number];
  address?: string;
}

export default function MissionHistoryScreen() {
  const { user } = useKavachStore();
  const { t } = useLanguage();
  const [logs, setLogs] = useState<ForensicLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'alerts'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForensicLog[];
      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 sm:p-6 overflow-hidden">
      {/* 🏛️ FORENSIC HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
            <History className="text-accent-blue" size={28} />
            {t('mission_history') || "Mission History"}
          </h1>
          <p className="text-[10px] font-mono text-accent-blue font-bold uppercase tracking-[3px] mt-1 opacity-60">
            {t('forensic_logs_active') || "FORENSIC NEURAL LOGS // ACTIVE"}
          </p>
        </div>
        <div className="bg-accent-blue/10 border border-accent-blue/20 px-3 py-1 rounded-full text-[10px] font-black text-accent-blue animate-pulse">
          {logs.length} {t('incidents_recorded') || "INCIDENTS"}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
          <div className="w-12 h-12 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest">{t('fetching_ledger') || "FETCHING MISSION LEDGER..."}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white/5 rounded-3xl border border-white/10 border-dashed">
          <ShieldAlert size={48} className="text-gray-600 mb-4" />
          <h3 className="text-lg font-black italic uppercase text-gray-400">{t('no_incidents') || "NO INCIDENTS RECORDED"}</h3>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2">{t('grid_clean_desc') || "Your tactical grid status is currently clean."}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div className={cn(
                  "bento-card p-5 border-l-4 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer",
                  log.status === 'resolved' ? "border-l-green-600 bg-green-500/5" : "border-l-accent-red bg-accent-red/5"
                )}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                        log.status === 'resolved' ? "bg-green-600/20 text-green-500" : "bg-accent-red/20 text-accent-red"
                      )}>
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black italic uppercase tracking-tight text-white leading-none">
                          {log.triggerMethod === 'voice' ? "Neural Voice Trigger" : 
                           log.triggerMethod === 'shake' ? "Tactical Shake Trigger" : 
                           log.triggerMethod === 'button' ? "Manual SOS Activation" : 
                           "System Alert"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Calendar size={10} className="text-gray-500" />
                          <span className="text-[9px] font-mono text-gray-500 font-bold">
                            {log.timestamp instanceof Timestamp ? format(log.timestamp.toDate(), 'PPP p') : 'Pending Sync...'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                      log.status === 'resolved' ? "bg-green-600 text-black" : "bg-accent-red text-white"
                    )}>
                      {log.status || 'ACTIVE'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex items-center gap-2">
                      <MapPin size={12} className="text-accent-blue" />
                      <div className="overflow-hidden">
                        <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">COORDINATES</p>
                        <p className="text-[9px] font-mono text-white truncate">
                          {log.coords?.[0]?.toFixed(4)}N, {log.coords?.[1]?.toFixed(4)}E
                        </p>
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex items-center gap-2">
                      <Clock size={12} className="text-accent-blue" />
                      <div>
                        <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">ID TAG</p>
                        <p className="text-[9px] font-mono text-white truncate">#{log.id.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 group-hover:text-accent-blue transition-colors" size={20} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="h-20" /> {/* Spacer */}
        </div>
      )}

      {/* 🛰️ FOOTER DECAL */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-20">
        <p className="text-[8px] font-mono font-bold tracking-[8px] whitespace-nowrap text-white">
          KAVACH // PERMANENT LEDGER // NODE_772
        </p>
      </div>
    </div>
  );
}
