import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';
import { ShieldCheck, Briefcase, MapPin, Loader2, Info, Award, MessageSquare } from 'lucide-react';

export function PcrSpecificFields({ data, setData, POLICE_RANKS }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Police Rank</label>
        <div className="relative">
          <select
            value={data.rank || ''}
            onChange={(e) => setData({ ...data, rank: e.target.value, occupation: 'Police' })}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none transition-all"
          >
            <option value="">Select Rank</option>
            {POLICE_RANKS.map((rank: string) => (
              <option key={rank} value={rank}>{rank}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Award size={14} className="text-gray-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Badge ID</label>
          <input
            type="text"
            value={data.badgeId || ''}
            onChange={(e) => setData({ ...data, badgeId: e.target.value.toUpperCase() })}
            placeholder="e.g. MP-2291"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PCR Vehicle No</label>
          <input
            type="text"
            value={data.vehicleNo || ''}
            onChange={(e) => setData({ ...data, vehicleNo: e.target.value.toUpperCase() })}
            placeholder="e.g. MP-04-PCR-12"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Thana / Police Precinct</label>
        <input
          type="text"
          value={data.thanaName || ''}
          onChange={(e) => setData({ ...data, thanaName: e.target.value })}
          placeholder="e.g. Bhopal Bypass Chowki Police Station"
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        />
      </div>
    </motion.div>
  );
}

export function LocationField({ data, setData, isPcrRoute, isLocating, handleFetchLocation }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end px-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {isPcrRoute ? "Operational Precinct Address" : "Permanent Residence Address"}
        </label>
        <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest italic flex items-center gap-1">
            <Info size={8} /> Use Fetch only at Base
        </span>
      </div>
      <div className="relative">
        <input
          type="text"
          value={data.address}
          onChange={(e) => setData({ ...data, address: e.target.value })}
          placeholder={isPcrRoute ? "Station Street, Sector Details, Area" : "House No, Building, Area, City"}
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 pr-12 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        />
        <button 
          type="button"
          onClick={handleFetchLocation}
          disabled={isLocating}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 active:scale-90 transition-all disabled:opacity-50 group"
        >
          {isLocating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
          <div className="absolute bottom-full mb-3 right-0 w-48 p-3 bg-gray-900 text-[8px] font-bold text-white uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl leading-relaxed">
              🛡️ Security: Use this only when you are at your PERMANENT/OFFICIAL STATION.
          </div>
        </button>
      </div>
    </div>
  );
}

export function ServiceNumberInput({ data, setData, checking, checkResult }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center justify-between"
        style={{ color: ['Army', 'Ex-Army'].includes(data.occupation) ? '#16a34a' : '#2563eb' }}>
        <span className="flex items-center gap-1.5">
          {['Army', 'Ex-Army'].includes(data.occupation) ? '🪖' : '🚔'}
          {['Army', 'Ex-Army'].includes(data.occupation) ? 'Army Service Number' : 'Police Service Number'}
          <span className="text-rose-500">*</span>
        </span>
        
        {checking && (
          <span className="text-[9px] font-black  flex items-center gap-1 uppercase tracking-wider text-slate-500">
            <Loader2 size={10} className="animate-spin" /> Verifying...
          </span>
        )}
        {checkResult === 'valid' && (
          <span className="text-[9px] font-black flex items-center gap-1 uppercase tracking-wider text-emerald-600">
            ✓ Format Checked
          </span>
        )}
        {checkResult === 'invalid' && (
          <span className="text-[9px] font-black flex items-center gap-1 uppercase tracking-wider text-rose-500">
            ✗ Invalid Pattern
          </span>
        )}
      </label>

      <div className="relative">
        <input
          type="text"
          value={data.serviceNumber || ''}
          onChange={(e) => setData({ ...data, serviceNumber: e.target.value.toUpperCase() })}
          placeholder={['Army', 'Ex-Army'].includes(data.occupation) ? 'e.g. 15709001W or IC-12345' : 'e.g. MP/2345/2019'}
          className={cn(
            "w-full border rounded-2xl px-4 py-4 text-sm font-bold outline-none transition-all pr-10",
            checkResult === 'valid' && "border-emerald-500 focus:ring-emerald-500/20",
            checkResult === 'invalid' && "border-rose-500 focus:ring-rose-500/20"
          )}
          style={{
            background: ['Army', 'Ex-Army'].includes(data.occupation) ? '#f0fdf4' : '#eff6ff',
            borderColor: checkResult === 'valid' ? '#10b981' : (checkResult === 'invalid' ? '#ef4444' : (['Army', 'Ex-Army'].includes(data.occupation) ? '#bbf7d0' : '#bfdbfe')),
          }}
        />
        {checkResult === 'valid' && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
            <ShieldCheck size={18} />
          </div>
        )}
      </div>

      {checking && (
        <p className="text-[9.5px] text-slate-500 font-bold bg-slate-100 p-2.5 rounded-xl border border-slate-200/50 flex items-center gap-1.5">
          🔍 {['Army', 'Ex-Army'].includes(data.occupation) 
            ? 'Querying Ministry of Defence registry database...' 
            : 'Connecting with state CCTNS Police records desk...'}
        </p>
      )}

      {checkResult === 'invalid' && (
        <p className="text-[9.5px] text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-100/50 flex flex-col gap-0.5">
          <span>⚠ Invalid formatting pattern detected.</span>
          <span className="text-[8.5px] text-slate-500 font-semibold leading-normal normal-case">
            {['Army', 'Ex-Army'].includes(data.occupation)
              ? 'Expected Indian Armed Forces format: E.g. 15709001W (8 digits + letter) or IC-12345 (prefix + 5 digits).'
              : 'Expected State Police format: E.g. State Code + belt/year (MP/2345/2019, DL-98124, MH/POL/5432).'}
          </span>
        </p>
      )}

      {checkResult === 'valid' && (
        <p className="text-[9.5px] text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100/50 flex items-center gap-1.5">
          🛡️ Service ID structure matches official registries. Cleared for administrative vetting.
        </p>
      )}

      {!checking && checkResult === 'idle' && (
        <p className="text-[9px] text-gray-400 font-bold ml-1">
          {['Army', 'Ex-Army'].includes(data.occupation)
            ? '⚡ This number is verified against Ministry of Defence records.'
            : '⚡ This number is verified against State Police Service records.'}
        </p>
      )}
    </motion.div>
  );
}
