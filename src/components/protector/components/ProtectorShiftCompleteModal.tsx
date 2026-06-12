import React from 'react';
import { Car } from 'lucide-react';

interface Props {
  showShiftCompleteModal: boolean;
  setShowShiftCompleteModal: (val: boolean) => void;
  shiftStats: any;
  dynamicVehicleNo: string;
  customJurisdiction: string;
}

export const ProtectorShiftCompleteModal = ({
  showShiftCompleteModal, setShowShiftCompleteModal, shiftStats, dynamicVehicleNo, customJurisdiction
}: Props) => {
  if (!showShiftCompleteModal) return null;

  return (
    <div className="fixed inset-0 z-[3000000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 text-slate-800 animate-none">
      <div className="w-full max-w-[320px] bg-white border border-slate-200 rounded-3xl p-6 space-y-5 text-center shadow-2xl animate-none">
        <Car size={40} className="text-sky-600 mx-auto" />
        <div>
          <p className="text-[8px] text-sky-600 uppercase tracking-[3px]">Shift Concluded</p>
          <h2 className="text-xl font-black uppercase text-slate-900">Duty Debrief</h2>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-left">
          {[['Duration', shiftStats.duration], ['Responses', `${shiftStats.responses} Incidents`], ['Vehicle', dynamicVehicleNo], ['Zone', customJurisdiction]].map(([k, v]) => (
            <div key={k as string} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
              <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">{k}</span>
              <span className="text-[9px] font-black text-slate-800">{v as string}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setShowShiftCompleteModal(false)}
          className="w-full py-3 bg-sky-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[2px] cursor-pointer shadow-md">
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
};
