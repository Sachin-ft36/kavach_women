import React from 'react';
import { Camera } from 'lucide-react';

export function ProtectorClosureModal({
  resolvingAlert,
  setResolvingAlert,
  resolutionSummary,
  setResolutionSummary,
  handshakeInput,
  setHandshakeInput,
  rescuePhoto,
  setRescuePhoto,
  handleResolveAlert,
  fileInputRef
}: any) {
  if (!resolvingAlert) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-none">
      <div onClick={() => setResolvingAlert(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-[340px] bg-white rounded-[32px] p-6 shadow-2xl border border-slate-200 text-slate-800 animate-none">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-1.5 bg-emerald-500 rounded-full mb-4" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Safety Confirmation</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-center">Capture verification photo and confirm.</p>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex justify-between"><span>Verification Photo</span><span className="text-emerald-500">VERIFIED</span></p>
            <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setRescuePhoto(URL.createObjectURL(file));
            }} />
            <div onClick={() => fileInputRef.current?.click()} className="relative w-full h-32 rounded-[20px] bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-slate-100">
              {rescuePhoto ? <img src={rescuePhoto} className="w-full h-full object-cover" alt="Safety Proof" /> : <div className="flex flex-col items-center text-slate-400"><Camera size={32} strokeWidth={1.5} /><span className="text-[10px] font-black uppercase mt-2 tracking-widest">Capture</span></div>}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Closure Reason</p>
            <textarea value={resolutionSummary} onChange={(e) => setResolutionSummary(e.target.value)} placeholder="e.g. Victim safe, suspect fled..." className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all resize-none shadow-sm" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Victim Safety Code</p>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3].map(i => (
                <input key={i} type="text" maxLength={1} value={handshakeInput[i] || ''} onChange={(e) => {
                  const val = e.target.value;
                  if (val && handshakeInput.length < 4) setHandshakeInput(handshakeInput + val);
                  else if (!val) setHandshakeInput(handshakeInput.slice(0, -1));
                }} className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-black text-blue-600 outline-none focus:border-blue-500 transition-all shadow-sm" placeholder="•" />
              ))}
            </div>
          </div>
          <div className="pt-3 space-y-3">
            <button onClick={handleResolveAlert} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg cursor-pointer">CONFIRM SAFE STATUS</button>
            <button onClick={() => setResolvingAlert(null)} className="w-full py-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
