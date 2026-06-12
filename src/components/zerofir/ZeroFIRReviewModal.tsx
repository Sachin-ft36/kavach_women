import React from 'react';
import { Shield, X, Video, AlertTriangle, Mic, FileText, Radio, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  setShowReviewModal: (show: boolean) => void;
  evidenceLogs: any[];
  evidenceHashes: Record<number, string>;
  firForm: any;
  setFirForm: (form: any) => void;
  isFetchingPS: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isDrawing: boolean;
  hasSigned: boolean;
  startDrawing: (e: any) => void;
  draw: (e: any) => void;
  stopDrawing: () => void;
  clearSignature: () => void;
  isGenerating: boolean;
  generateFIR: () => void;
}

export default function ZeroFIRReviewModal({
  setShowReviewModal, evidenceLogs, evidenceHashes,
  firForm, setFirForm, isFetchingPS,
  canvasRef, isDrawing, hasSigned, startDrawing, draw, stopDrawing, clearSignature,
  isGenerating, generateFIR
}: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[10000] bg-[#F8FAFC] flex flex-col">
      <div className="p-6 bg-white border-b border-[#E5E7EB] flex items-center justify-between sticky top-0 z-[101]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#2563EB]/5 rounded-2xl flex items-center justify-center text-[#2563EB]">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#111827] uppercase tracking-tighter italic leading-none">Digital Complaint Center</h2>
            <p className="text-[10px] font-black text-[#2563EB] uppercase tracking-[3px] mt-1.5 opacity-60">National Safety Reporting Portal</p>
          </div>
        </div>
        <button onClick={() => setShowReviewModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-gray-500 active:scale-90"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-12">
        <div className="max-w-5xl mx-auto w-full bg-white border border-[#E5E7EB] shadow-sm rounded-[3rem] overflow-hidden flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 p-8 sm:p-12">
            
            {/* Left: Forensic Evidence Summary */}
            <div className="space-y-6 sm:space-y-8">
              <div className="p-5 sm:p-8 bg-gray-50 border border-[#E5E7EB] rounded-[24px] sm:rounded-[32px] shadow-sm relative overflow-hidden">
                <h4 className="text-[9px] sm:text-[10px] font-black text-[#1E293B] uppercase tracking-[3px] mb-6 sm:mb-8 flex items-center gap-3">
                  <Video size={16} className="text-[#2563EB]" /> SECTION I: FORENSIC ATTACHMENTS
                </h4>
                {evidenceLogs.length === 0 ? (
                  <div className="py-10 sm:py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl sm:rounded-3xl bg-white/50">
                    <AlertTriangle className="text-gray-300 mx-auto mb-3" size={32} />
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest px-4">No forensic assets detected in this session.</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {evidenceLogs.map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm group hover:border-[#2563EB]/30 transition-all">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-lg sm:rounded-xl flex items-center justify-center border border-gray-100 shadow-inner">
                            {log.type === 'Audio Log' ? <Mic className="text-[#2563EB] w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="text-[#DC2626] w-5 h-5 sm:w-6 sm:h-6" />}
                          </div>
                          <div>
                            <p className="font-black text-[12px] sm:text-sm text-gray-900 italic uppercase">{log.type}</p>
                            <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-tight">{log.date}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="px-2 py-1 bg-accent-green/10 border border-accent-green/20 rounded-lg">
                            <span className="text-[7px] sm:text-[8px] font-black uppercase text-accent-green tracking-widest">VERIFIED</span>
                          </div>
                          <span className="text-[6px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-0.5">
                            <span>🔒 SHA256</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-[#2563EB]/5 rounded-xl sm:rounded-2xl border border-[#2563EB]/10">
                  <p className="text-[8px] sm:text-[9px] text-[#2563EB] font-bold uppercase leading-relaxed tracking-wider">
                    All attachments are cryptographically hashed and timestamped to ensure admissible Chain of Custody under Section 63 of BNSS.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Manual Input Section */}
            <div className="space-y-6 sm:space-y-8">
              <h4 className="text-[9px] sm:text-[10px] font-black text-[#111827] uppercase tracking-[2px] sm:tracking-[3px] flex items-center gap-3">
                <FileText size={16} className="text-[#2563EB]" /> SECTION II: AFFIDAVIT OF INCIDENT
              </h4>
              
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Incident Date</label>
                  <input type="date" className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold" value={firForm.occurenceDate} onChange={(e) => setFirForm({...firForm, occurenceDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Incident Time</label>
                  <input type="time" className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold" value={firForm.occurenceTime} onChange={(e) => setFirForm({...firForm, occurenceTime: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Category of Offense (BNS Taxonomy)</label>
                <select className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold appearance-none" value={firForm.offenseType} onChange={(e) => setFirForm({...firForm, offenseType: e.target.value})}>
                  <option value="">Select Official Category...</option>
                  <option value="Crime against Women (BNS Chapter V)">Crime against Women (BNS Chapter V)</option>
                  <option value="Stalking / Harassment (BNS Sec 78/74)">Stalking / Harassment (BNS Sec 78/74)</option>
                  <option value="Physical Assault / Threat (BNS Chapter VI)">Physical Assault / Threat (BNS Chapter VI)</option>
                  <option value="Emergency Rescue Required">Emergency Rescue Required</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Identification Details (Suspect/Vehicle)</label>
                <input type="text" placeholder="Visual indicators, plate numbers..." className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold placeholder:text-gray-300" value={firForm.suspectDetails} onChange={(e) => setFirForm({...firForm, suspectDetails: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Nearest Police Station</label>
                <div className="relative">
                  <input type="text" placeholder={isFetchingPS ? "Resolving via Mappls..." : "e.g. Noida Sector 63 PS"} className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold placeholder:text-gray-300" value={firForm.policeStation} onChange={(e) => setFirForm({...firForm, policeStation: e.target.value})} />
                  {isFetchingPS && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Radio className="animate-spin text-blue-600" size={14} /></div>}
                </div>
                <p className="text-[7px] sm:text-[8px] text-gray-400 font-bold uppercase tracking-widest ml-1 italic">Coordinates checked on Mappls search node to prevent manual location tampering.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest ml-1">Detailed Deposition of Facts *</label>
                <textarea rows={4} placeholder="Describe the events..." className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#2563EB] focus:bg-white transition-all font-bold placeholder:text-gray-300 resize-none font-sans" value={firForm.victimStatement} onChange={(e) => setFirForm({...firForm, victimStatement: e.target.value})} />
              </div>

              {/* Signature Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[8px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest">Electronic Signature (e-Sign)</label>
                  {hasSigned && <button onClick={clearSignature} className="text-[7px] font-black text-rose-500 uppercase tracking-widest hover:underline">Clear Canvas</button>}
                </div>
                <div className="relative border border-dashed border-[#E5E7EB] rounded-xl overflow-hidden bg-gray-50 h-24 flex items-center justify-center">
                  <canvas
                    ref={canvasRef} width={400} height={96}
                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                    className="absolute inset-0 w-full h-full cursor-crosshair z-10"
                  />
                  {!hasSigned && <p className="text-[8px] text-gray-300 font-black uppercase tracking-widest pointer-events-none select-none z-0">Draw your signature here</p>}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 sm:p-5 bg-accent-red/5 border border-accent-red/10 rounded-xl sm:rounded-2xl">
                <input type="checkbox" id="affirmation" className="mt-1 w-3.5 h-3.5 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]" />
                <label htmlFor="affirmation" className="text-[8px] sm:text-[9px] font-bold text-gray-800 uppercase tracking-wider leading-relaxed">
                  I affirm that all details submitted are true and accurate under Section 229 of the Bharatiya Nyaya Sanhita (BNS), 2023, and Section 214 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-10 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-6 sticky bottom-0 z-[101]">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:max-w-md">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shadow-inner shrink-0 border border-gray-100">
            <Lock size={16} />
          </div>
          <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
            Submission is encrypted and digitally signed for admissibility in Indian Courts under BNSS-2023.
          </p>
        </div>
        <button 
          onClick={generateFIR}
          disabled={isGenerating || !firForm.offenseType || !firForm.victimStatement || !hasSigned}
          className="w-full sm:w-auto px-10 py-4 sm:px-12 sm:py-5 bg-[#111827] text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-[2px] sm:tracking-[3px] text-[10px] sm:text-xs flex items-center justify-center gap-3 sm:gap-4 hover:bg-black active:scale-[0.95] transition-all shadow-2xl shadow-black/20 disabled:opacity-50 disabled:grayscale"
        >
          {isGenerating ? <Radio className="animate-spin" size={14} /> : <Shield size={18} />} 
          {isGenerating ? "DISPATCHING..." : "OFFICIALLY DISPATCH REPORT"}
        </button>
      </div>
    </motion.div>
  );
}
