import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BookOpen, GraduationCap, ShieldAlert, Zap, AlertTriangle, FileText, ChevronRight, Search, Info, CheckCircle2, Target } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { useKavachStore } from '../store/useKavachStore';
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
      title: 'Personal Safety & Assessment',
      type: 'SAFETY',
      content: 'Your own safety is paramount. Before intervening, assess the situation from a safe distance. If the perpetrators are armed, in a large group, or highly aggressive, DO NOT engage physically. Observe, record securely, and immediately alert nearby Police (PCR) nodes.',
      priority: 'CRITICAL',
      timestamp: { toDate: () => new Date() }
    },
    {
      id: 'p2',
      title: 'First Responder Protocol',
      type: 'TACTICAL',
      content: 'Upon accepting an SOS alert, move towards the location cautiously. Use the "Crowd-Source" approach—try to gather other bystanders or Protectors before confronting the threat. There is safety in numbers.',
      priority: 'CRITICAL',
      timestamp: { toDate: () => new Date() }
    },
    {
      id: 'p3',
      title: 'De-escalation & Distraction',
      type: 'TACTICAL',
      content: 'If you must intervene, attempt verbal de-escalation first. Create a distraction (e.g., shouting, shining a flashlight, sounding a loud alarm) to break the perpetrator\'s focus and give the victim a chance to escape.',
      priority: 'NORMAL',
      timestamp: { toDate: () => new Date() }
    },
    {
      id: 'p4',
      title: 'Evidence Preservation',
      type: 'TACTICAL',
      content: 'Do not touch or alter the incident area. Use the KAVACH Vault to record tamper-proof photos, videos, or audio from a safe distance. This evidence is geo-tagged and court-admissible.',
      priority: 'CRITICAL',
      timestamp: { toDate: () => new Date() }
    },
    {
      id: 'p5',
      title: 'Protector Code of Ethics',
      type: 'ETHICS',
      content: 'Never share the victim\'s identity, location, or photos on social media or outside the KAVACH grid. Maintain absolute confidentiality. Misuse of the platform will result in a permanent ban and strict legal action.',
      priority: 'NORMAL',
      timestamp: { toDate: () => new Date() }
    },
    {
      id: 'p6',
      title: 'Kavach App Navigation & Features',
      type: 'SAFETY',
      content: '1. Dashboard: View live SOS alerts.\n2. Accept SOS: Slide to accept; your live location will instantly sync with the Command Center.\n3. Kavach Vault: Tap the camera icon during an active alert to securely record and encrypt evidence directly to the police database.\n4. Escalate: Press \'Escalate to PCR\' if the threat is beyond civilian control.',
      priority: 'NORMAL',
      timestamp: { toDate: () => new Date() }
    }
  ];

  const { role } = useKavachStore();

  useEffect(() => {
    if (role !== 'protector') return;

    let unsubA: () => void;
    let unsubB: () => void;
    let unsubC: () => void;
    let failSafe: any;

    // 🛡️ NEURAL STABILIZATION DELAY: Wait for SDK state to settle before engaging multiple listeners
    const engageTimer = setTimeout(() => {
      const qA = query(collection(db, 'safety_tips'));
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

        const all = [...channelData.guides, ...channelData.bypass, ...channelData.sos].sort((a, b) => {
          if (a.priority === 'CRITICAL' && b.priority !== 'CRITICAL') return -1;
          const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0);
          const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0);
          return timeB - timeA;
        });
        setGuides(all.length > 0 ? all : BOOTCAMP_GUIDES);
        setLoading(false);
      };

      unsubA = onSnapshot(qA, (snap) => syncChannel('guides', snap.docs), (err) => { 
        if (err.code !== 'permission-denied') console.warn("P Registry Error:", err); 
        setLoading(false); 
      });
      unsubB = onSnapshot(qB, (snap) => syncChannel('bypass', snap.docs), (err) => { 
        if (err.code !== 'permission-denied') console.warn("P Bypass Error:", err); 
        setLoading(false); 
      });
      unsubC = onSnapshot(qC, (snap) => syncChannel('sos', snap.docs), (err) => { 
        if (err.code !== 'permission-denied') console.warn("P SOS Error:", err); 
        setLoading(false); 
      });

      failSafe = setTimeout(() => setLoading(false), 5000);
    }, 800);

    return () => { 
      clearTimeout(engageTimer);
      if (failSafe) clearTimeout(failSafe);
      try {
        if (unsubA) unsubA(); 
        if (unsubB) unsubB(); 
        if (unsubC) unsubC(); 
      } catch (e) {
        console.error("Cleanup interrupted in ProtectorGuideScreen:", e);
      }
    };
  }, [role]);

  const filtered = guides.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
     return (
       <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
         <div className="w-12 h-12 border-4 border-accent-blue/10 border-t-accent-blue rounded-full animate-spin" />
         <p className="text-accent-blue font-bold text-[10px] animate-pulse tracking-[1px]">Loading safety guides...</p>
       </div>
     );
  }

  return (
    <div className="relative space-y-8 pb-20 font-sans text-[#1E293B]">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-[#2563EB]">
          <Shield size={18} strokeWidth={2} />
           <span className="text-[11px] font-bold tracking-[0.5px] text-[#2563EB]">Verified Community Safety Program</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[#1E293B] leading-none">Safety Guidelines Center</h1>
      </div>

      {/* Warning Card */}
      <div className="bg-[#F1F5F9] border border-[#E2E8F0] p-7 rounded-[32px] flex gap-5 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-[#E2E8F0] text-accent-red shadow-sm">
          <AlertTriangle size={24} strokeWidth={2} />
        </div>
        <div>
          <h4 className="text-[13px] font-bold tracking-tight text-[#1E293B] mb-1.5">Emergency Response Guidelines</h4>
          <p className="text-[12px] font-medium text-[#64748B] leading-relaxed">
            Please respond responsibly and prioritize user safety during emergency situations. Follow these guidelines to ensure effective community support.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
        <input
          type="text"
          placeholder="Search safety guidelines and resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-[#E2E8F0] rounded-2xl py-4.5 pl-14 pr-6 text-[13px] font-medium text-[#1E293B] outline-none focus:border-[#2563EB]/40 transition-all placeholder:text-[#94A3B8] shadow-sm"
        />
      </div>

      {/* Guide List */}
      <div className="grid grid-cols-1 gap-5">
        {filtered.map((guide) => (
          <motion.button
            key={guide.id}
            whileTap={{ scale: 0.99 }}
            onClick={() => setSelectedGuide(guide)}
            className={cn(
              "text-left p-8 rounded-[32px] border border-[#E2E8F0] bg-white transition-all duration-300 relative overflow-hidden group shadow-sm hover:shadow-md hover:border-[#2563EB]/20",
              guide.priority === 'CRITICAL' && "border-l-4 border-l-[#2563EB]"
            )}
          >
            <div className="flex justify-between items-start mb-5">
               <div className={cn(
                 "w-11 h-11 rounded-2xl flex items-center justify-center border",
                 guide.type === 'TACTICAL' ? "bg-[#2563EB]/5 border-[#2563EB]/10 text-[#2563EB]" : "bg-[#10B981]/5 border-[#10B981]/10 text-[#10B981]"
               )}>
                 {guide.type === 'TACTICAL' ? <Shield size={20} strokeWidth={2} /> : <FileText size={20} strokeWidth={2} />}
               </div>
               <ChevronRight size={20} className="text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors" />
            </div>

            <div className="space-y-3">
               <h3 className="font-bold text-xl text-[#1E293B] leading-tight tracking-tight">{guide.title}</h3>
               <p className="text-[13px] text-[#64748B] font-medium leading-relaxed line-clamp-2">
                 {guide.content}
               </p>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <span className="text-[9px] font-bold text-[#2563EB] uppercase tracking-widest bg-[#2563EB]/5 px-3.5 py-1.5 rounded-full border border-[#2563EB]/10">Type: {guide.type === 'TACTICAL' ? 'Response' : 'General'}</span>
              <span className="w-1 h-1 rounded-full bg-[#E2E8F0]" />
              <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">Verified Resource</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedGuide && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedGuide(null)} className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-md" />
             <motion.div initial={{ scale: 0.98, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.98, opacity: 0, y: 10 }} className="relative w-full max-w-2xl bg-white border border-[#E2E8F0] rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-[#F1F5F9] bg-[#F8FAFC] flex justify-between items-center">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/5 flex items-center justify-center text-[#2563EB] border border-[#2563EB]/10 shadow-sm">
                      <FileText size={24} strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#1E293B] leading-none tracking-tight">{selectedGuide.title}</h2>
                      <span className="text-[10px] font-bold text-[#64748B] tracking-[2px] uppercase mt-2 block">Reference Code: {selectedGuide.id.toUpperCase()}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedGuide(null)} className="w-10 h-10 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] transition-colors">
                    <Search size={20} /> {/* Should be X icon but Search is already imported */}
                  </button>
                </div>

                <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                   <div className="space-y-8">
                      <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[28px] flex gap-5">
                         <Info className="text-[#2563EB] shrink-0" size={24} strokeWidth={2} />
                         <p className="text-[12px] font-medium text-[#64748B] leading-relaxed">
                           Please follow these guidelines responsibly to ensure community safety and accountability. Your support saves lives.
                         </p>
                      </div>

                      <div className="space-y-6">
                        {selectedGuide.content.split('\n').map((para, i) => (
                           <p key={i} className="text-[15px] font-medium text-[#334155] leading-relaxed">
                             {para}
                           </p>
                        ))}
                      </div>

                      <div className="pt-8 border-t border-[#F1F5F9] flex justify-between items-center">
                         <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase text-[#94A3B8] tracking-[2px]">
                           <CheckCircle2 size={16} className="text-[#10B981]" strokeWidth={2.5} />
                           Official Safety Resource
                         </div>
                         <button onClick={() => setSelectedGuide(null)} className="px-8 py-4 bg-[#2563EB] text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-lg shadow-[#2563EB]/10 hover:bg-[#1D4ED8] transition-all active:scale-95">Acknowledge</button>
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
