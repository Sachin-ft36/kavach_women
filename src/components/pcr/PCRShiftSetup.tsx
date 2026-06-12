import React from 'react';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

const VEHICLE_OPTIONS = ['PCR-01','PCR-02','PCR-03','PCR-04','PCR-05','PCR-06','PCR-07','PCR-08'];
const ZONE_OPTIONS = ['Zone A – North','Zone B – South','Zone C – East','Zone D – West','Zone E – Central','Zone F – Highway','Zone G – Industrial'];

interface Props {
  profile: any;
  shiftVehicle: string;
  setShiftVehicle: (v: string) => void;
  shiftZone: string;
  setShiftZone: (v: string) => void;
  shiftPartner: string;
  setShiftPartner: (v: string) => void;
  handleToggleDuty: () => void;
}

export default function PCRShiftSetup({
  profile, shiftVehicle, setShiftVehicle,
  shiftZone, setShiftZone, shiftPartner, setShiftPartner, handleToggleDuty
}: Props) {
  const rank = profile?.rank || 'Constable';
  const badge = profile?.badgeId || 'IND-POL-00000';
  const name = profile?.name || 'Officer';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col animate-none">
      {/* Gov Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-[3px]">GOVERNMENT OF INDIA</p>
          <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight">Kavach ERSS — PCR Unit Portal</h1>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[8px] text-slate-400 uppercase tracking-widest">Status</p>
          <p className="text-[10px] font-black text-amber-600 uppercase">OFF DUTY</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-8 gap-6 max-w-md mx-auto w-full">
        {/* Officer ID Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[8px] text-blue-600 uppercase tracking-[2px] font-black mb-3">Officer Identity</p>
          <div className="grid grid-cols-2 gap-3">
            {[['Name', name], ['Rank', rank], ['Badge No.', badge], ['Station', profile?.thanaName || '—']].map(([k, v]) => (
              <div key={k} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[6px] text-slate-400 uppercase tracking-widest">{k}</p>
                <p className="text-xs font-black text-slate-800 mt-0.5 truncate">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Setup Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <p className="text-[8px] text-blue-600 uppercase tracking-[2px] font-black">Configure Shift</p>

          <div className="space-y-1">
            <label className="text-[7px] text-slate-500 uppercase tracking-widest font-black">Assigned Vehicle</label>
            <select
              value={shiftVehicle}
              onChange={e => setShiftVehicle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-500"
            >
              <option value="">— Select PCR Vehicle —</option>
              {VEHICLE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              {profile?.vehicleNo && !VEHICLE_OPTIONS.includes(profile.vehicleNo) && (
                <option value={profile.vehicleNo}>{profile.vehicleNo}</option>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[7px] text-slate-500 uppercase tracking-widest font-black">Patrol Zone / Beat</label>
            <select
              value={shiftZone}
              onChange={e => setShiftZone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-500"
            >
              <option value="">— Select Patrol Zone —</option>
              {ZONE_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
              {profile?.thanaName && !ZONE_OPTIONS.some(z => z.includes(profile.thanaName)) && (
                <option value={profile.thanaName}>{profile.thanaName}</option>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[7px] text-slate-500 uppercase tracking-widest font-black">Partner / Co-Officer (Optional)</label>
            <input
              type="text"
              value={shiftPartner}
              onChange={e => setShiftPartner(e.target.value)}
              placeholder="Enter partner name..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-blue-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        <button
          onClick={() => {
            if (!shiftVehicle) { toast.error('Please select a vehicle before starting shift.'); return; }
            if (!shiftZone) { toast.error('Please assign a patrol zone.'); return; }
            handleToggleDuty();
          }}
          className="w-full py-5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all rounded-2xl text-sm font-black uppercase tracking-[2px] text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
        >
          <Shield size={16} /> START SHIFT — GO ON DUTY
        </button>

        <p className="text-center text-[8px] text-slate-400 uppercase tracking-widest">
          Shift details are logged to ERSS HQ upon activation
        </p>
      </div>
    </div>
  );
}
