import React from 'react';
import { Users, ChevronRight, ShieldCheck, Home, Briefcase, Car, MapPin, Plus, UserCheck } from 'lucide-react';
import { useKavachStore } from '../../state/useKavachStore';

interface YourFamilyListProps {
  onViewAll: () => void;
  onAddMember: () => void;
  onTrackLive: (memberName: string) => void;
}

export default function YourFamilyList({ onViewAll, onAddMember, onTrackLive }: YourFamilyListProps) {
  const { guardianCache } = useKavachStore();

  const activeMembers = (guardianCache && Array.isArray(guardianCache))
    ? guardianCache.filter((g: any) => g.status !== 'pending' && g.accepted !== false && g.uid)
    : [];

  return (
    <div
      className="w-full max-w-[850px] rounded-[24px] p-5 flex flex-col gap-4 relative overflow-hidden font-sans text-left"
      style={{
        background: '#0B0818',
        border: '1px solid #2A1C44',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-[#8B5CF6]" />
          <h2 className="text-[11px] font-bold text-slate-300 tracking-wider uppercase">
            Your Family ({activeMembers.length})
          </h2>
        </div>
        <button
          onClick={onViewAll}
          className="text-[10px] font-bold text-[#8B5CF6] hover:text-[#A78BFA] transition-colors flex items-center gap-0.5 border-none bg-transparent cursor-pointer uppercase tracking-wider"
        >
          View All <ChevronRight size={12} className="mt-[0.5px]" />
        </button>
      </div>

      {/* List container */}
      <div className="flex flex-col border border-white/[0.04] bg-[#0E0B20]/45 rounded-2xl divide-y divide-white/[0.04] overflow-hidden">
        {activeMembers.length > 0 ? (
          activeMembers.map((member: any, idx: number) => {
            const name = member.name || member.relationship || 'Family Member';
            const relation = member.relationship || 'Guardian';
            const photo = member.photoURL || member.photoUrl || '';
            const status = member.status || 'Safe';
            const isSafe = status.toLowerCase().includes('safe') || status.toLowerCase().includes('active');

            return (
              <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-white/[0.01] transition-colors">

                {/* Member details */}
                <div className="flex items-center gap-3.5">
                  <div className="relative w-11 h-11 shrink-0">
                    {photo ? (
                      <img
                        src={photo}
                        alt={name}
                        className="w-full h-full rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#1e173e] border border-white/10 flex items-center justify-center text-[#a78bfa] font-bold text-sm">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B0818] ${isSafe ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-white">{name}</span>
                      {relation && (
                        <span className="text-[10px] font-medium text-slate-400">({relation})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10.5px] font-medium text-emerald-400 flex items-center gap-1">
                        <ShieldCheck size={12} className="text-emerald-400" /> {status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onTrackLive(name)}
                    className="py-1 px-2.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wider transition-all border border-solid bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-[#00E676] cursor-pointer"
                  >
                    Live
                  </button>
                  <ChevronRight size={15} className="text-slate-500" />
                </div>

              </div>
            );
          })
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#18123c] border border-[#7C4DFF]/30 flex items-center justify-center text-[#a78bfa] mb-2">
              <UserCheck size={20} />
            </div>
            <p className="text-[12px] font-medium text-white mb-0.5">No connected family members</p>
            <p className="text-[10px] text-slate-400 mb-3">Add family members to monitor safety & share real-time location.</p>
            <button
              onClick={onAddMember}
              className="px-3 py-1.5 bg-[#6035f5] hover:bg-[#5229db] text-white text-[10px] font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={12} /> Add Your First Family Member
            </button>
          </div>
        )}
      </div>

      {/* Add family button */}
      {activeMembers.length > 0 && (
        <button
          onClick={onAddMember}
          className="w-full py-2.5 bg-transparent hover:bg-white/[0.02] border border-dashed border-white/[0.08] hover:border-white/20 text-[#A78BFA] rounded-2xl text-[10.5px] font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus size={13} /> Add Family Member
        </button>
      )}

    </div>
  );
}
