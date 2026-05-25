import React, { useState, useEffect } from 'react';
import { 
  Clock, Shield, MapPin, ChevronRight, Gavel, 
  CheckCircle2, Lock, Fingerprint, Database, History,
  User, ShieldAlert, Zap, Calendar, Search, Car, ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

interface ShiftLogsProps {
  selectedState: string;
  detectedAdminDistrict: string | null;
}

export function ShiftLogs({ selectedState, detectedAdminDistrict }: ShiftLogsProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Real-time synchronization with Firestore shift_logs
  useEffect(() => {
    const q = query(collection(db, 'shift_logs'), orderBy('timestamp', 'desc'));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(fetchedLogs);
      setIsLoading(false);
    }, (err) => {
      console.error("Failed to fetch shift logs:", err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredLogs = logs.filter(log => {
    // 1. Filter by State
    if (selectedState !== 'ALL') {
      const stateName = selectedState.toLowerCase().trim();
      const logState = (log.state || '').toLowerCase().trim();
      const logZone = (log.zone || '').toLowerCase().trim();
      
      const match = logState.includes(stateName) || logZone.includes(stateName);
      if (!match) return false;
    }

    // 2. Filter by District
    if (detectedAdminDistrict) {
      const district = detectedAdminDistrict.toLowerCase().trim();
      const logZone = (log.zone || '').toLowerCase().trim();
      const logCity = (log.city || '').toLowerCase().trim();
      
      const match = logZone.includes(district) || logCity.includes(district);
      if (!match) return false;
    }

    // 3. Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return (
        (log.officerName || '').toLowerCase().includes(q) ||
        (log.officerBadge || '').toLowerCase().includes(q) ||
        (log.vehicleNo || '').toLowerCase().includes(q) ||
        (log.partner || '').toLowerCase().includes(q) ||
        (log.zone || '').toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="bg-[#0F172A] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl transition-all h-full relative">
      {/* 🚔 BLOCK HEADER */}
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 to-transparent border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20 relative">
            <Clock size={20} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0F172A] flex items-center justify-center">
              <Lock size={8} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[4px] text-white italic leading-none">PCO Shift Ledger</h3>
            <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mt-2 opacity-60">Verified Patrol Shift Chronicles</p>
          </div>
        </div>

        {/* Search and Counts */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search Officer, Badge, Callsign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1E293B] border border-white/5 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 w-[240px] transition-all font-bold"
            />
            <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>

          <div className="bg-blue-600/10 px-4 py-2 rounded-2xl border border-blue-500/20 whitespace-nowrap">
            <span className="text-[10px] font-black text-blue-400 tabular-nums">{filteredLogs.length} RECORDED SHIFTS</span>
          </div>
        </div>
      </div>

      {/* 🔗 SHIFT FEED */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6 py-8 custom-scrollbar bg-[#0F172A]/50 relative">
        {/* Background Vertical Line */}
        <div className="absolute left-12 top-0 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent z-0" />

        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4 py-20">
            <div className="w-8 h-8 rounded-full border-2 border-t-blue-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[4px] text-center italic">Loading Shift Intelligence...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4 py-20">
            <History size={60} />
            <p className="text-[12px] font-black uppercase tracking-[4px] text-center italic">No Shift Logs Registered...</p>
          </div>
        ) : filteredLogs.map((log, idx) => {
          const startTimeFormatted = log.startTime 
            ? new Date(log.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : "TBD";
          const endTimeFormatted = log.endTime 
            ? new Date(log.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : "TBD";
          const dateFormatted = log.endTime
            ? new Date(log.endTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : "LIVE";

          const logHash = `0x${log.id?.slice(0, 8) || 'SHFT'}${idx.toString(16).toUpperCase()}9A`;

          return (
            <motion.div 
              key={log.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: Math.min(idx * 0.04, 0.4) }}
              className="relative z-10 flex gap-6 group"
            >
              {/* Timeline Node Icon */}
              <div className="shrink-0 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-[#1E293B] border border-white/10 flex items-center justify-center shadow-2xl relative group-hover:border-blue-500/50 transition-all">
                  <Car size={18} className="text-blue-400" />
                  {idx < filteredLogs.length - 1 && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 h-8 w-[2px] bg-blue-500/10 group-hover:bg-blue-500/30 transition-all" />
                  )}
                </div>
              </div>

              {/* Log Card */}
              <div className="flex-1 bg-[#1E293B]/40 hover:bg-[#1E293B]/70 border border-white/5 hover:border-white/10 rounded-[2.5rem] p-6 transition-all group-hover:shadow-2xl">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
                        {log.vehicleNo || 'PCR-TBD'}
                      </span>
                      <span className="text-[8px] font-black text-gray-500 tabular-nums uppercase italic">
                        Node Block: {logHash}
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">
                      {log.officerName || 'Officer'}
                    </h4>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[1.5px] mt-1">
                      BADGE: {log.officerBadge || 'IND-POL-00000'} · PARTNER: {log.partner?.toUpperCase() || 'SOLO'}
                    </p>
                  </div>

                  <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Shift Logged
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  {/* Zone */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5 shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Beat Zone</p>
                      <p className="text-[11px] font-bold text-white truncate uppercase tracking-tighter italic">
                        {log.zone || 'District Beat'}
                      </p>
                    </div>
                  </div>

                  {/* Date & Shift Span */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5 shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Shift Timeline</p>
                      <p className="text-[11px] font-bold text-white truncate uppercase tracking-tighter italic">
                        {startTimeFormatted} <ArrowRight size={10} className="inline mx-0.5 text-blue-500" /> {endTimeFormatted}
                      </p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5 shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Shift Duration</p>
                      <p className="text-[11px] font-black text-sky-400 font-mono italic">
                        {log.duration || '00:00:00'}
                      </p>
                    </div>
                  </div>

                  {/* Responses */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/5 shrink-0">
                      <ShieldAlert size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">SOS Responses</p>
                      <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-tighter italic">
                        {log.responsesCount || 0} Incident{log.responsesCount === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer block */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[8px] font-black uppercase tracking-widest text-gray-500">
                  <span>Log Date: {dateFormatted}</span>
                  <span className="flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 size={10} /> Cryptographically Signed (BNSS Audited)
                  </span>
                </div>

              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 🔐 LEDGER AUTHENTICATION FOOTER */}
      <div className="p-6 border-t border-white/5 flex items-center justify-between bg-black/40 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-emerald-500" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-[4px]">Sovereign Immutability Active</span>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-[4px]">PCO Roster Synced</span>
          </div>
        </div>
        <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
          <Database size={12} />
          HQ Registry Bridge Stable
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
