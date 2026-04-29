import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ShieldAlert, Zap, AlertTriangle, FileText, ChevronRight, Search, Info, CheckCircle2, Target } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

interface ProtectorGuide {
  id: string;
  title: string;
  type: 'TACTICAL' | 'SAFETY' | 'ETHICS';
  content: string;
  priority: 'CRITICAL' | 'NORMAL';
  timestamp: any;
}

export default function ProtectorGuideScreen() {
  const { t } = useLanguage();
  const [guides, setGuides] = useState<ProtectorGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<ProtectorGuide | null>(null);

  const BOOTCAMP_GUIDES: ProtectorGuide[] = [
    {
      id: 'p1',
      title: 'FIRST RESPONDER PROTOCOL',
      type: 'TACTICAL',
      content: 'Upon receiving an alert, immediately verify the location map. Do not engage alone if the threat level is high. Coordinate with local Super Cell nodes.',
      priority: 'CRITICAL',
      timestamp: { toDate: () => new Date() }
    },
    {
      id: 'p2',
      title: 'EVIDENCE PRESERVATION',
      type: 'TACTICAL',
      content: 'Do not touch or clean the incident area. Take clear photos/videos through the KAVACH Vault immediately. Your actions are court-admissible.',
      priority: 'CRITICAL',
      timestamp: { toDate: () => new Date() }
    },
    {
      id: 'p3',
      title: 'PROTECTOR ETHICS CODE',
      type: 'ETHICS',
      content: 'Never share victim identity or photos outside the KAVACH grid. Misuse of the SOS network will result in immediate permanent ban and legal action.',
      priority: 'CRITICAL',
      timestamp: { toDate: () => new Date() }
    }
  ];

  useEffect(() => {
    const qA = query(collection(db, 'protector_guides'));
    const qB = query(collection(db, 'special_cell_reports'), where('type', '==', 'INTEL_BROADCAST'), where('originalTarget', '==', 'PROTECTOR'));
    const qC = query(collection(db, 'alerts'), where('type', '==', 'INTEL_RESCUE'));

    const channelData: Record<string, ProtectorGuide[]> = { guides: [], bypass: [], sos: [] };

    const syncChannel = (channel: string, docs: any[]) => {
      channelData[channel] = docs.map(doc => {
        const d = doc.data();
        return { 
          id: doc.id, 
          title: d.title || 'TACTICAL COMMAND',
          type: d.type || 'TACTICAL',
          content: d.content || '',
          priority: d.priority === 'HIGH' ? 'CRITICAL' : 'NORMAL',
          timestamp: d.timestamp
        } as ProtectorGuide;
      });

      const all = [...BOOTCAMP_GUIDES, ...channelData.guides, ...channelData.bypass, ...channelData.sos].sort((a, b) => {
        if (a.priority === 'CRITICAL' && b.priority !== 'CRITICAL') return -1;
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0);
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0);
        return timeB - timeA;
      });
      setGuides(all);
      setLoading(false);
    };

    const unsubA = onSnapshot(qA, (snap) => syncChannel('guides', snap.docs), (err) => { console.warn("P Registry Error:", err); setLoading(false); });
    const unsubB = onSnapshot(qB, (snap) => syncChannel('bypass', snap.docs), (err) => { console.warn("P Bypass Error:", err); setLoading(false); });
    const unsubC = onSnapshot(qC, (snap) => syncChannel('sos', snap.docs), (err) => { console.warn("P SOS Error:", err); setLoading(false); });

    const failSafe = setTimeout(() => setLoading(false), 5000);

    return () => { unsubA(); unsubB(); unsubC(); clearTimeout(failSafe); };
  }, []);

  const filtered = guides.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
     return (
       <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
         <div className="w-12 h-12 border-4 border-accent-blue/10 border-t-accent-blue rounded-full animate-spin" />
         <p className="text-accent-blue font-black uppercase text-[10px] animate-pulse italic tracking-[4px]">Syncing Tactical Bootcamp...</p>
       </div>
     );
  }

  return (
    <div className="relative space-y-8 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-accent-blue">
          <GraduationCap size={16} />
          <span className="text-[10px] font-black uppercase tracking-[3px] italic text-accent-blue">Elite Bootcamp Intelligence</span>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Protector Hub</h1>
      </div>

      {/* Warning Card */}
      <div className="bg-accent-red/10 border border-accent-red/20 p-6 rounded-[32px] flex gap-4">
        <ShieldAlert className="text-accent-red shrink-0" size={24} />
        <div>
          <h4 className="text-[12px] font-black uppercase tracking-widest text-accent-red mb-1">Combat Readiness</h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-relaxed">
            Your actions determine mission success. Follow these protocols strictly to avoid legal glitches and ensure victim safety.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          placeholder="SEARCH TACTICAL MANUALS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-[11px] font-black uppercase tracking-widest focus:border-accent-blue/50 outline-none transition-all placeholder:text-gray-600 shadow-inner"
        />
      </div>

      {/* Guide List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((guide) => (
          <motion.button
            key={guide.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedGuide(guide)}
            className={cn(
              "text-left p-6 rounded-[32px] border-2 transition-all duration-300 relative overflow-hidden group shadow-lg",
              guide.priority === 'CRITICAL' ? "bg-white/[0.03] border-accent-blue/20" : "bg-white/[0.01] border-white/5"
            )}
          >
            <div className="flex justify-between items-start mb-4">
               <div className={cn(
                 "w-10 h-10 rounded-xl flex items-center justify-center",
                 guide.type === 'TACTICAL' ? "bg-accent-blue/10 text-accent-blue" : "bg-purple-500/10 text-purple-500"
               )}>
                 {guide.type === 'TACTICAL' ? <Target size={20} /> : <GraduationCap size={20} />}
               </div>
               <ChevronRight size={18} className="text-gray-700 group-hover:text-white transition-colors" />
            </div>

            <div className="space-y-2">
               <h3 className="font-black italic uppercase text-lg leading-tight tracking-tighter">{guide.title}</h3>
               <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest line-clamp-2 leading-relaxed">
                 {guide.content}
               </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <span className="text-[8px] font-mono font-black text-accent-blue uppercase tracking-widest bg-accent-blue/10 px-3 py-1 rounded-full border border-accent-blue/10">Type: {guide.type}</span>
              <span className="w-1 h-1 rounded-full bg-gray-800" />
              <span className="text-[8px] font-mono font-bold text-gray-700 uppercase tracking-widest">Protocol Active</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Modal Tool - Simplified for Bootcamp */}
      <AnimatePresence>
        {selectedGuide && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedGuide(null)} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
             <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="relative w-full max-w-2xl bg-[#08080c] border border-white/10 rounded-[40px] shadow-[0_0_100px_rgba(10,132,255,0.1)] overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-accent-blue/10 to-transparent flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-blue/20 flex items-center justify-center text-accent-blue border border-accent-blue/30">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">{selectedGuide.title}</h2>
                      <span className="text-[9px] font-mono font-bold text-gray-500 tracking-[3px] uppercase mt-1 block">RESPONDER_CODE: {guideType(selectedGuide.type)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                   <div className="space-y-8">
                      <div className="p-6 bg-accent-red/5 border border-accent-red/20 rounded-3xl flex gap-4">
                         <AlertTriangle className="text-accent-red shrink-0" size={24} />
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed italic">
                           DEVIATION FROM THIS TACTICAL PROTOCOL WILL RESULT IN IMMEDIATE DISMISSAL FROM THE KAVACH PROTECTOR NETWORK.
                         </p>
                      </div>

                      <div className="space-y-6">
                        {selectedGuide.content.split('\n').map((para, i) => (
                           <p key={i} className="text-sm font-medium text-gray-300 leading-relaxed first-letter:text-xl first-letter:font-black first-letter:text-accent-blue">
                             {para}
                           </p>
                        ))}
                      </div>

                      <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                         <div className="flex items-center gap-2 text-[9px] font-black uppercase text-gray-600 tracking-[3px]">
                           <CheckCircle2 size={14} className="text-accent-blue" />
                           Verified Bootcamp Manual
                         </div>
                         <button onClick={() => setSelectedGuide(null)} className="px-8 py-4 bg-accent-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest italic shadow-xl shadow-accent-blue/20 transition-all active:scale-95">Copy Protocol</button>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function guideType(type: string) {
  switch(type) {
    case 'TACTICAL': return 'COMBAT_ALPHA';
    case 'SAFETY': return 'SECURE_NODE';
    case 'ETHICS': return 'HONOR_CODE';
    default: return 'MANUAL_UNKN';
  }
}
