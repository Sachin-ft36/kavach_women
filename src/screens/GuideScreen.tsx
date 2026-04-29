import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Shield, ShieldCheck, Zap, AlertTriangle, FileText, ChevronRight, Search, Info, Scale } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

interface Guide {
  id: string;
  title: string;
  category: 'SAFETY' | 'LEGAL' | 'TACTICAL';
  content: string;
  priority: 'HIGH' | 'NORMAL';
  timestamp: any;
  updatedAt?: any;
}

export default function GuideScreen() {
  const { t } = useLanguage();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'SAFETY' | 'LEGAL' | 'TACTICAL'>('ALL');

  const DEFAULT_GUIDES: Guide[] = [
    {
      id: 'g1',
      title: 'TACTICAL SOS PROTOCOL',
      category: 'TACTICAL',
      content: 'In emergency, use the Triple-Shake pattern or say "KAVACH HELP" / "HELP" 3 times to active SOS. Ensure your phone is not in ultra battery saver mode for 100% mission reliability.',
      priority: 'HIGH',
      timestamp: { toDate: () => new Date() }
    },
    {
      id: 'g2',
      title: 'ZERO-FIR LEGAL RIGHTS',
      category: 'LEGAL',
      content: 'You can file a Zero-FIR in ANY police station regardless of where the incident happened. The police are legally bound to register it and transfer it to the relevant station later.',
      priority: 'NORMAL',
      timestamp: { toDate: () => new Date() }
    },
    {
      id: 'g3',
      title: 'DECOY CALCULATOR GUIDE',
      category: 'TACTICAL',
      content: 'The calculator acts as a stealth trigger. Type your 4-digit Safety PIN and press "=" to trigger a silent SOS blast to all guardians without revealing the app.',
      priority: 'HIGH',
      timestamp: { toDate: () => new Date() }
    }
  ];

  useEffect(() => {
    const qA = query(collection(db, 'guides'));
    const qB = query(collection(db, 'special_cell_reports'), where('type', '==', 'INTEL_BROADCAST'), where('originalTarget', '==', 'CITIZEN'));
    const qC = query(collection(db, 'alerts'), where('type', '==', 'INTEL_RESCUE'));

    const channelData: Record<string, Guide[]> = { guides: [], bypass: [], sos: [] };

    const syncChannel = (channel: string, docs: any[]) => {
      channelData[channel] = docs.map(doc => {
        const d = doc.data();
        return { 
          id: doc.id, 
          title: d.title || 'BROADCAST',
          category: d.category || 'SAFETY',
          content: d.content || '',
          priority: d.priority || 'NORMAL',
          timestamp: d.timestamp,
          updatedAt: d.updatedAt
        } as Guide;
      });

      const combined = [...DEFAULT_GUIDES, ...channelData.guides, ...channelData.bypass, ...channelData.sos].sort((a, b) => {
        if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
        const getT = (g: Guide) => (g.updatedAt?.toMillis?.() || g.updatedAt?.toDate?.().getTime() || g.timestamp?.toMillis?.() || g.timestamp?.toDate?.().getTime() || 0);
        return getT(b) - getT(a);
      });
      setGuides(combined);
      setLoading(false);
    };

    const unsubA = onSnapshot(qA, (snap) => syncChannel('guides', snap.docs), (err) => { console.warn("Registry Sync Error:", err); setLoading(false); });
    const unsubB = onSnapshot(qB, (snap) => syncChannel('bypass', snap.docs), (err) => { console.warn("Bypass Sync Error:", err); setLoading(false); });
    const unsubC = onSnapshot(qC, (snap) => syncChannel('sos', snap.docs), (err) => { console.warn("SOS Tunnel Sync Error:", err); setLoading(false); });

    // Final Fail-Safe: Ensure loading screen resolves after 5s regardless of network state
    const failSafe = setTimeout(() => setLoading(false), 5000);

    return () => { unsubA(); unsubB(); unsubC(); clearTimeout(failSafe); };
  }, []);

  const filteredGuides = guides.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) || g.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'ALL' || g.category === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-accent-blue/20 border-t-accent-blue rounded-full animate-spin" />
        <p className="text-accent-blue font-black uppercase text-[10px] animate-pulse italic tracking-[4px]">Syncing Intelligence Hub...</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-accent-blue">
          <BookOpen size={16} />
          <span className="text-[10px] font-black uppercase tracking-[3px] italic">Mission Intelligence</span>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Security Guide</h1>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="SEARCH TACTICAL MANUALS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-[11px] font-black uppercase tracking-widest focus:border-accent-blue/50 outline-none transition-all placeholder:text-gray-600"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['ALL', 'SAFETY', 'LEGAL', 'TACTICAL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className={cn(
                "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap",
                filter === cat ? "bg-white text-black border-white" : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Guides List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGuides.map((guide) => (
          <motion.button
            key={guide.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedGuide(guide)}
            className={cn(
              "text-left p-6 rounded-[28px] border-2 transition-all duration-300 relative overflow-hidden group",
              guide.priority === 'HIGH' ? "bg-accent-red/5 border-accent-red/20" : "bg-white/[0.03] border-white/10"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                guide.category === 'SAFETY' ? "bg-accent-blue/10 text-accent-blue" :
                  guide.category === 'LEGAL' ? "bg-purple-500/10 text-purple-500" :
                    "bg-orange-500/10 text-orange-500"
              )}>
                {guide.category === 'SAFETY' ? <Shield size={20} /> :
                  guide.category === 'LEGAL' ? <Scale size={20} /> :
                    <Zap size={20} />}
              </div>
              <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-black italic uppercase text-lg leading-tight tracking-tighter">{guide.title}</h3>
                {guide.priority === 'HIGH' && <AlertTriangle size={14} className="text-accent-red animate-pulse" />}
              </div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest line-clamp-2 leading-relaxed">
                {guide.content}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-mono font-bold text-gray-600 uppercase tracking-widest">{guide.category}</span>
                <span className="w-1 h-1 rounded-full bg-gray-800" />
                <span className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                  {guide.updatedAt ? `Updated: ${new Date(guide.updatedAt.toDate()).toLocaleDateString()}` : (guide.timestamp?.toDate ? new Date(guide.timestamp.toDate()).toLocaleDateString() : 'ACTIVE')}
                </span>
              </div>
              {guide.updatedAt && (
                <div className="flex items-center gap-1 text-[7px] font-black text-accent-blue uppercase tracking-widest bg-accent-blue/10 px-2 py-0.5 rounded-full border border-accent-blue/20">
                  <Zap size={8} fill="currentColor" /> Redrafted
                </div>
              )}
            </div>
          </motion.button>
        ))}

        {filteredGuides.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4 opacity-30">
            <Search size={48} className="mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-[4px]">No tactical manuals match your search pulse</p>
          </div>
        )}
      </div>

      {/* Guide Detail Modal */}
      <AnimatePresence>
        {selectedGuide && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGuide(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-accent-blue/10 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-accent-blue border border-white/10 shadow-lg">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">{selectedGuide.title}</h2>
                    <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest mt-1 block">MANUAL_TYPE: {selectedGuide.category}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedGuide(null)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                  <Zap size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="space-y-8">
                  <div className="flex gap-4 p-6 bg-accent-blue/5 border border-accent-blue/20 rounded-3xl">
                    <Info size={24} className="text-accent-blue shrink-0" />
                    <p className="text-xs font-bold text-gray-300 leading-relaxed italic uppercase tracking-wider">
                      This information is provided by KAVACH Mission Command for tactical safety and legal awareness. Ensure you follow standard mission protocols.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {selectedGuide.content.split('\n').map((para, i) => para.trim() && (
                      <p key={i} className="text-sm font-medium text-gray-200 leading-relaxed first-letter:text-xl first-letter:font-black first-letter:text-accent-blue">
                        {para}
                      </p>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase text-gray-600 tracking-widest">
                        <ShieldCheck size={14} className="text-green-500" />
                        Verified Intelligence Node
                      </div>
                      <button onClick={() => setSelectedGuide(null)} className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest italic shadow-xl active:scale-95 transition-all">Understood</button>
                    </div>
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
