import React from 'react';
import { FileText, CheckCircle, Shield, Lock, Upload } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useZeroFIRLogic } from '../hooks/useZeroFIRLogic';
import ZeroFIRReviewModal from './zerofir/ZeroFIRReviewModal';

interface ZeroFIRProps {
  evidenceLogs?: any[];
}

export default function ZeroFIR({ evidenceLogs = [] }: ZeroFIRProps) {
  const {
    isGenerating, firData, showReviewModal, setShowReviewModal, isFetchingPS,
    evidenceHashes, firForm, setFirForm,
    canvasRef, isDrawing, hasSigned, startDrawing, draw, stopDrawing, clearSignature,
    generateFIR, downloadFIR
  } = useZeroFIRLogic(evidenceLogs);

  const trackFIR = () => {
    toast.info("Processing Status: Under active review by authorities.");
  };

  return (
    <>
      <div className="bg-white border border-[#E5E7EB] rounded-[32px] p-8 space-y-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700"><Shield size={120} /></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-inner">
              <FileText className="text-[#0F172A]" size={28} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-black text-[#0F172A] text-2xl tracking-tighter uppercase italic">Digital Complaint</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[3px] mt-1">Online FIR Support Center</p>
            </div>
          </div>

          {!firData ? (
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-8 py-4 bg-[#0F172A] text-white rounded-2xl font-black uppercase tracking-[2px] text-[10px] flex items-center justify-center gap-3 hover:bg-black active:scale-95 transition-all shadow-xl shadow-black/10"
            >
              <Upload size={16} /> Start Complaint
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3">
                <CheckCircle className="text-emerald-500" size={16} />
                <div>
                  <p className="text-[10px] font-black text-gray-900 tracking-tight leading-none uppercase">FIR: {firData.firId}</p>
                  <p className="text-[7px] text-emerald-600 uppercase tracking-widest font-black mt-1">Legally Registered</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={downloadFIR} className="flex-1 py-2 bg-white border border-gray-100 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Download</button>
                <button onClick={trackFIR} className="flex-1 py-2 bg-white border border-gray-100 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Track</button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-gray-50 flex items-center gap-2 text-gray-400 relative z-10">
          <Lock size={12} className="text-blue-600" />
          <span className="text-[9px] font-bold uppercase tracking-widest italic leading-none">Your identity and evidence are protected via end-to-end encryption.</span>
        </div>
      </div>

      <AnimatePresence>
        {showReviewModal && (
          <ZeroFIRReviewModal
            setShowReviewModal={setShowReviewModal} evidenceLogs={evidenceLogs}
            evidenceHashes={evidenceHashes} firForm={firForm} setFirForm={setFirForm}
            isFetchingPS={isFetchingPS} canvasRef={canvasRef} isDrawing={isDrawing}
            hasSigned={hasSigned} startDrawing={startDrawing} draw={draw}
            stopDrawing={stopDrawing} clearSignature={clearSignature}
            isGenerating={isGenerating} generateFIR={generateFIR}
          />
        )}
      </AnimatePresence>
    </>
  );
}
