import React from 'react';
import { ChevronRight, UserCheck } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  user: any;
  isSelected: boolean;
  onSelect: () => void;
}

export default function VettingUserCard({ user, isSelected, onSelect }: Props) {
  const u = user;
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-2xl border transition-all flex gap-3 items-center group relative cursor-pointer',
        isSelected
          ? 'bg-blue-600/10 border-blue-500/40 text-white'
          : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] text-slate-300'
      )}
    >
      {u.photoUrl ? (
        <img
          src={u.photoUrl}
          alt="Face"
          className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name || u.username}`; }}
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-blue-950/40 border border-blue-500/10 flex items-center justify-center shrink-0">
          <UserCheck size={18} className="text-blue-400" />
        </div>
      )}

      <div className="overflow-hidden flex-1 space-y-0.5">
        <p className="text-xs font-black uppercase tracking-wide truncate">
          {u.name || u.username || 'Anonymous User'}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn(
            'text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded-md',
            u.role === 'citizen' ? 'bg-pink-500/10 text-pink-400'
              : 'bg-blue-500/10 text-blue-400'
          )}>
            {u.role || 'citizen'}
          </span>
          <span className="text-[8px] font-mono text-slate-500 bg-white/5 px-1 py-0.5 rounded-md">
            ID: {(u.id || '').slice(0, 4)}
          </span>
        </div>
        <p className="text-[9px] text-slate-500 truncate">
          {u.locationData?.city || 'City Unknown'}, {u.locationData?.state || 'State Unknown'}
        </p>
      </div>

      <ChevronRight
        size={14}
        className={cn('text-slate-600 transition-transform', isSelected ? 'translate-x-1 text-blue-400' : 'group-hover:translate-x-1')}
      />
    </button>
  );
}
