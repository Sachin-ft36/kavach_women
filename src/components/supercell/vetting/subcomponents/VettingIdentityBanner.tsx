import React from 'react';
import { UserCheck, ZoomIn } from 'lucide-react';

interface Props {
  user: any;
  onZoom: () => void;
}

export function VettingIdentityBanner({ user: u, onZoom }: Props) {
  return (
    <div className="flex gap-6 items-start flex-col md:flex-row">
      <div className="relative group shrink-0">
        {u.photoUrl ? (
          <img
            src={u.photoUrl} alt="Profile Face"
            className="w-36 h-36 rounded-2xl object-cover border-2 border-white/10 shadow-2xl"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name || u.username}`; }}
          />
        ) : (
          <div className="w-36 h-36 rounded-2xl bg-blue-950/20 border border-blue-500/10 flex items-center justify-center">
            <UserCheck size={40} className="text-blue-500/50" />
          </div>
        )}
        <button
          onClick={onZoom}
          className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer text-white"
        >
          <ZoomIn size={16} /> Inspect Face
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
            {u.role} Registration
          </span>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">{u.name || u.username || 'Anonymous User'}</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['GENDER', u.gender], ['BLOOD GROUP', u.bloodGroup || 'N/A'], ['DOB', u.dob || 'N/A']].map(([k, v]) => (
            <span key={k} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 border border-white/10 rounded-lg">{k}: {v}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
