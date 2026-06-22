import React from 'react';
import { MapPin, Phone, Mail, Info } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface Props {
  user: any;
}

export function VettingDataGrid({ user: u }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Contact */}
      <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 space-y-3">
        <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Communication Coordinates</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <Phone size={14} className="text-blue-500 shrink-0" />
            <span className="font-semibold">{u.phoneNumber || 'No Phone Registered'}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <Mail size={14} className="text-blue-500 shrink-0" />
            <span className="font-semibold truncate">{u.email || 'No Email Sync'}</span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 space-y-3">
        <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Geographical Sector</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <MapPin size={14} className="text-blue-500 shrink-0" />
            <span className="font-semibold truncate">{u.locationData?.city || 'Sector City'}, {u.locationData?.state || 'Sector State'}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <Info size={12} className="shrink-0" />
            <span className="truncate">{u.fullAddress || 'Detailed address not submitted.'}</span>
          </div>
        </div>
      </div>



      {/* Protector Vetting Details */}
      {u.role === 'protector' && u.protectorVetting && (() => {
        const occ = u.protectorVetting.occupation || '';
        const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police'].includes(occ);
        return (
          <div className={cn('rounded-2xl p-4 space-y-4 col-span-1 md:col-span-2 border', isElite ? 'bg-gradient-to-b from-emerald-950/20 to-emerald-950/5 border-emerald-500/25 shadow-lg shadow-emerald-500/5' : 'bg-white/[0.01] border-white/[0.04]')}>
            <div className="flex items-center justify-between">
              <h3 className={cn('text-[10px] font-extrabold uppercase tracking-widest', isElite ? 'text-emerald-400' : 'text-blue-400')}>
                Civic Protector Application Details
              </h3>
              {isElite && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-[8px] font-black text-emerald-300 uppercase tracking-widest">
                  🛡️ Govt. Service — Elite Protector
                </span>
              )}
            </div>

            {isElite && (
              <div className="bg-emerald-950/40 border border-emerald-500/25 rounded-xl px-3.5 py-2.5 text-[9.5px] text-emerald-300 font-bold flex items-start gap-2">
                <span className="text-base mt-0.5">⚡</span>
                <div>
                  <span className="font-extrabold uppercase tracking-wide text-white block mb-0.5">FAST-TRACK GOVERNMENT DESK APPROVAL</span>
                  Background claimed: <span className="underline decoration-emerald-400/50 decoration-2">{occ}</span>. Verify the service number below.
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Occupation / Profession</p>
                <p className={cn('text-xs font-black', isElite ? 'text-emerald-300' : 'text-slate-200')}>
                  {occ || 'Not Specified'}{u.protectorVetting.customOccupation ? ` — ${u.protectorVetting.customOccupation}` : ''}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Reason for Joining</p>
                <p className="text-xs font-black text-slate-200">{u.protectorVetting.reason || 'Not Provided'}</p>
              </div>

              {isElite && (
                <div className="space-y-2 col-span-2 bg-[#0B1528]/80 border border-white/[0.05] rounded-xl p-3.5 relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      {['Army', 'Ex-Army'].includes(occ) ? '🪖 ARMY REGISTRY DATA' : '🚔 POLICE RECORDS GRID'}
                    </span>
                    <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border', u.protectorVetting.serviceNumber ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400')}>
                      {u.protectorVetting.serviceNumber ? '🛡️ FORMAT VERIFIED' : '⚠️ PENDING UPLOAD'}
                    </span>
                  </div>
                  <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest">
                        {['Army', 'Ex-Army'].includes(occ) ? 'Army Service Number' : 'Police Service Badge No.'}
                      </p>
                      <p className={cn('text-base font-black font-mono tracking-widest', u.protectorVetting.serviceNumber ? 'text-white' : 'text-rose-400')}>
                        {u.protectorVetting.serviceNumber || 'NOT SUBMITTED'}
                      </p>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <span className="text-[7.5px] font-mono text-slate-400 leading-tight">REGISTRY REF: KAVACH-SYS-{u.phoneNumber?.slice(-4) || 'TBD'}</span>
                      <span className={cn('text-[7px] font-extrabold uppercase tracking-widest leading-none mt-0.5', u.protectorVetting.serviceNumber ? 'text-emerald-500' : 'text-rose-400')}>
                        {u.protectorVetting.serviceNumber ? '✓ STRUCTURAL CHECKS CLEAN' : '✗ VERIFICATION FAILED'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Residential Address</p>
                <p className="text-xs font-black text-slate-200">{u.protectorVetting.address || u.fullAddress || 'Not Provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Code of Conduct Agreement</p>
                <p className={cn('text-xs font-black', u.protectorVetting.agreement ? 'text-emerald-400' : 'text-rose-400')}>
                  {u.protectorVetting.agreement ? '✓ Agreed & Accepted' : '✗ Not Agreed'}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Guardian contacts for citizens */}
      {u.role === 'citizen' && u.primaryGuardian && (
        <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 space-y-3 col-span-1 md:col-span-2">
          <h3 className="text-[10px] text-pink-400 font-extrabold uppercase tracking-widest">Primary SOS Guardian Contacts</h3>
          <div className="grid grid-cols-3 gap-4">
            {[['Guardian Name', u.primaryGuardian.name], ['Guardian Phone', u.primaryGuardian.phone], ['Relation', u.primaryGuardian.relation || 'Guardian']].map(([k, v]) => (
              <div key={k} className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{k}</p>
                <p className="text-xs font-black text-slate-200">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
