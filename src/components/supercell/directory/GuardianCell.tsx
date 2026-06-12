import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { cn } from '../../../lib/utils';

export default function GuardianCell({ userId }: { userId: string }) {
  const [guardians, setGuardians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchGuardians = async () => {
      try {
        const snap = await getDocs(collection(db, 'users', userId, 'guardians'));
        setGuardians(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Guardian Fetch Error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchGuardians();
  }, [userId]);

  return (
    <div className="flex flex-col items-center gap-1 group/g">
      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all",
        guardians.length > 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-gray-50 border-gray-100 text-gray-400"
      )}>
        <Shield size={10} strokeWidth={3} />
        <span className="text-[10px] font-black tabular-nums">{loading ? '...' : guardians.length}</span>
      </div>
      
      {guardians.length > 0 && (
        <div className="absolute z-[100] mt-8 scale-0 group-hover/g:scale-100 transition-all origin-top bg-white border border-gray-100 p-3 rounded-2xl shadow-2xl min-w-[180px] pointer-events-none">
           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-50 pb-1.5">Emergency Network</p>
           <div className="space-y-2">
             {guardians.map((g, i) => (
               <div key={i} className="flex flex-col">
                 <span className="text-[10px] font-black text-gray-900 leading-none">{g.name}</span>
                 <div className="flex items-center gap-1.5 mt-0.5">
                   <span className="text-[7px] font-black text-blue-500 uppercase">{g.relation}</span>
                   <span className="text-[8px] font-bold text-gray-400">{g.phone}</span>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
