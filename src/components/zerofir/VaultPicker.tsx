import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Mic, ShieldCheck } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { cn } from '../../lib/utils';
import { useKavachStore } from '../../state/useKavachStore';

interface VaultPickerProps {
  onClose: () => void;
  onSelect: (item: any) => void;
  selectedIds: string[];
}

export function VaultPicker({ onClose, onSelect, selectedIds }: VaultPickerProps) {
  const { user } = useKavachStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestEvidence = async () => {
      if (!user) return;
      try {
        const alertsRef = collection(db, 'alerts');
        const q = query(alertsRef, orderBy('timestamp', 'desc'), limit(1));
        const alertSnap = await getDocs(q);
        
        if (!alertSnap.empty) {
          const alertId = alertSnap.docs[0].id;
          const evidenceRef = collection(db, 'alerts', alertId, 'evidence');
          const evSnap = await getDocs(evidenceRef);
          setItems(evSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (e) {
        console.error("Vault fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestEvidence();
  }, [user]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[400] bg-[#0A0A0B] flex flex-col p-6"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Select from Vault</h3>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide grid grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-20 text-center text-[10px] font-black text-gray-500 uppercase  tracking-widest">Accessing Secure Vault...</div>
        ) : items.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">No Evidence Found in Vault</div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onSelect(item)}
              className={cn(
                "relative aspect-square rounded-3xl border-2 transition-all overflow-hidden cursor-pointer",
                selectedIds.includes(item.id) ? "border-blue-500" : "border-white/5 bg-white/5"
              )}
            >
              {item.type === 'Snapshot' ? (
                <img src={item.url} className="w-full h-full object-cover opacity-60" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <Mic size={24} className="text-blue-500" />
                  <span className="text-[7px] font-black uppercase text-gray-500">Audio Log</span>
                </div>
              )}
              {selectedIds.includes(item.id) && (
                <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1 text-white"><ShieldCheck size={12} /></div>
              )}
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-[6px] font-black text-white/40 uppercase truncate">ID: {item.id.slice(0, 8)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <button onClick={onClose} className="mt-6 w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[3px]">Confirm Selection</button>
    </motion.div>
  );
}
