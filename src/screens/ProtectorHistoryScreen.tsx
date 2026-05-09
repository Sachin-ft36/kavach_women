import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useKavachStore } from '../store/useKavachStore';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Users, ShieldCheck, MapPin, Clock, FileText, ChevronRight, User, Award } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface InterventionLog {
  id: string;
  victimName?: string;
  timestamp: any;
  status: string;
  coords: [number, number];
  interventionSummary?: string;
  triggerMethod?: string;
}

export default function ProtectorHistoryScreen() {
  const { user } = useKavachStore();
  const { t } = useLanguage();
  const { role, profile } = useKavachStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.missionHistory) {
      // Sort history by timestamp descending
      const sortedHistory = [...profile.missionHistory].sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setLogs(sortedHistory);
    }
    setLoading(false);
  }, [profile]);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] text-[#1E293B] p-4 sm:p-6 overflow-hidden font-sans">
      {/* 🏅 ACTIVITY HISTORY HEADER */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1E293B] flex items-center gap-3">
            <Activity className="text-[#2563EB]" size={28} strokeWidth={2.5} />
            Activity History
          </h1>
          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-[2px] mt-2">
            Community Support Log // User ID: {user?.uid.slice(-6).toUpperCase()}
          </p>
        </div>
        <div className="bg-[#2563EB]/10 border border-[#2563EB]/10 px-4 py-1.5 rounded-full text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">
          {logs.length} Responses
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
          <div className="w-12 h-12 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Syncing Records...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-[32px] border border-dashed border-[#E2E8F0]">
          <Shield size={48} className="text-[#CBD5E1] mb-5" strokeWidth={1.5} />
          <h3 className="text-lg font-bold text-[#94A3B8]">NO RECENT ACTIVITY</h3>
          <p className="text-[12px] text-[#CBD5E1] font-medium uppercase tracking-widest mt-2">Monitoring safety network for requests.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-[28px] border-l-4 border-l-[#10B981] transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-[#10B981]/5 flex items-center justify-center text-[#10B981] border border-[#10B981]/10">
                        <Users size={22} strokeWidth={2} />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-bold text-[#1E293B] truncate max-w-[200px]">
                          Saved: {log.victimName || 'Citizen'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={12} className-[#94A3B8] />
                          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                            {log.timestamp instanceof Timestamp ? format(log.timestamp.toDate(), 'PPP p') : 'Pending Sync'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-[#10B981] text-white text-[9px] font-bold uppercase tracking-widest rounded-lg">
                      COMPLETED
                    </div>
                  </div>

                  {/* 📝 RESOLUTION SUMMARY */}
                  <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#E2E8F0] mb-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <FileText size={14} className="text-[#2563EB]" strokeWidth={2} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">Resolution Summary</span>
                    </div>
                    <p className="text-[13px] text-[#475569] font-medium leading-relaxed italic">
                      "{log.type === 'TRANSIT_INTERCEPTION' ? 'Secured safe passage during national transit.' : 'Successful emergency extraction and grid resolution.'}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] flex items-center gap-3">
                      <MapPin size={14} className="text-[#2563EB]" strokeWidth={2} />
                      <div className="overflow-hidden">
                        <p className="text-[8px] text-[#94A3B8] font-bold uppercase tracking-wider leading-none mb-1">LOCATION</p>
                        <p className="text-[10px] font-medium text-[#1E293B] truncate">
                          {log.coords?.[0]?.toFixed(4)}N, {log.coords?.[1]?.toFixed(4)}E
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] flex items-center gap-3">
                      <Shield size={14} className="text-[#2563EB]" strokeWidth={2} />
                      <div>
                        <p className="text-[8px] text-[#94A3B8] font-bold uppercase tracking-wider leading-none mb-1">REQUEST TYPE</p>
                        <p className="text-[10px] font-medium text-[#1E293B] uppercase">{log.type?.replace('_', ' ') || "SOS RESPONSE"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="h-24" />
        </div>
      )}
    </div>
  );
}
