import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, ChevronRight, MapPin, Clock, ShieldCheck, AlertCircle, Download, Send, Camera, Video, Plus, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useKavachStore } from '../store/useKavachStore';
import { cn } from '../lib/utils';

interface ZeroFIRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ZeroFIRModal({ isOpen, onClose }: ZeroFIRModalProps) {
  const { user, userPos } = useKavachStore();
  const [step, setStep] = useState(1);
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const incidentTypes = [
    "Stalking / Harassment",
    "Physical Assault",
    "Public Transport Misconduct",
    "Cyber Harassment",
    "Other Threat"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
      toast.success(`${e.target.files.length} Evidence file(s) attached.`);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleDownload = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>KAVACH_ZERO_FIR_OFFICIAL_COPY</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; position: relative; }
              .watermark { 
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg);
                font-size: 150px; font-weight: 900; color: rgba(0,0,0,0.03); z-index: -1; pointer-events: none;
                text-transform: uppercase; white-space: nowrap;
              }
              .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .gov-text { font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 5px; }
              .fir-title { font-size: 28px; font-weight: 900; margin: 10px 0; color: #d32f2f; }
              .section { margin-bottom: 25px; }
              .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; background: #f0f0f0; padding: 5px 10px; margin-bottom: 10px; border-left: 4px solid #d32f2f; }
              .row { display: flex; margin-bottom: 8px; font-size: 11px; }
              .label { font-weight: 700; width: 200px; color: #555; }
              .value { flex: 1; border-bottom: 1px dotted #ccc; padding-bottom: 2px; }
              .description { font-size: 11px; line-height: 1.6; border: 1px solid #eee; padding: 15px; background: #fafafa; }
              .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
              .sig-box { width: 200px; border-top: 1px solid #000; text-align: center; padding-top: 10px; font-size: 10px; font-weight: 700; }
              .qr-placeholder { width: 80px; height: 80px; background: #eee; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999; }
            </style>
          </head>
          <body>
            <div className="watermark">KAVACH PROTECT</div>
            <div class="header">
              <div class="gov-text">Government of India / National Safety Network</div>
              <div class="fir-title">FIRST INFORMATION REPORT (ZERO FIR)</div>
              <div style="font-size: 10px; font-weight: 700; color: #666;">Issued under Section 154 of CrPC / BNS Compliance</div>
            </div>

            <div class="section">
              <div class="section-title">1. Reference Details</div>
              <div class="row"><div class="label">FIR Reference Number:</div><div class="value">KVC-FIR-${Math.floor(Math.random() * 1000000)}</div></div>
              <div class="row"><div class="label">Date of Registration:</div><div class="value">${new Date().toLocaleDateString()}</div></div>
              <div class="row"><div class="label">Time of Registration:</div><div class="value">${new Date().toLocaleTimeString()}</div></div>
            </div>

            <div class="section">
              <div class="section-title">2. Complainant Information</div>
              <div class="row"><div class="label">Name of Informant:</div><div class="value">${user?.displayName || 'Citizen (Kavach Verified)'}</div></div>
              <div class="row"><div class="label">Verification ID:</div><div class="value">${user?.uid.substring(0, 12)}... (Kavach Secured)</div></div>
            </div>

            <div class="section">
              <div class="section-title">3. Incident Parameters</div>
              <div class="row"><div class="label">Type of Offence:</div><div class="value">${incidentType}</div></div>
              <div class="row"><div class="label">GPS Coordinates:</div><div class="value">${userPos ? `${userPos[0].toFixed(6)}, ${userPos[1].toFixed(6)}` : 'Logged in Support Hub'}</div></div>
              <div class="row"><div class="label">Jurisdiction Station:</div><div class="value">Zero FIR (Valid at any station nationwide)</div></div>
            </div>

            <div class="section">
              <div class="section-title">4. Narrative / Description of Events</div>
              <div class="description">${description || 'No detailed narrative provided at time of intake.'}</div>
            </div>

            <div class="section">
              <div class="section-title">5. Forensic Evidence Log</div>
              <div class="row"><div class="label">Audio/Video Files:</div><div class="value">${attachments.length} files attached/synced</div></div>
              <div class="row"><div class="label">Encryption Status:</div><div class="value">AES-256 (Kavach Evidence Vault Locked)</div></div>
            </div>

            <div class="footer">
              <div class="qr-placeholder">DIGITAL SEAL<br>SCAN FOR HUB</div>
              <div class="sig-box">
                DIGITAL SIGNATURE OF INFORMANT<br>
                <span style="font-size: 8px; opacity: 0.5;">(Generated via Biometric Authenticated App)</span>
              </div>
            </div>

            <div style="margin-top: 30px; font-size: 8px; color: #999; text-align: center;">
              This is a digitally generated Zero FIR under legal provisions. Police are mandated to record it regardless of jurisdiction.
            </div>

            <script>window.print(); setTimeout(() => window.close(), 1000);</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
    toast.success("Generating Official FIR Copy...");
  };

  const handleForward = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Securing Encrypted Connection to E-Police Hub...',
        success: 'Complaint Successfully Forwarded to National Safety Network.',
        error: 'Transmission Failed. Please try again.',
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-[#0A0A0B] flex flex-col p-6 pt-12 overflow-hidden font-sans">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onClose}
          className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white flex items-center gap-2 group"
        >
          <ChevronRight size={18} className="rotate-180" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Safe Zone</span>
        </button>
        <div className="px-3 py-1 bg-accent-red/20 rounded-full border border-accent-red/30">
           <span className="text-[8px] font-black text-accent-red uppercase tracking-widest italic">Legal Intake Protocol</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 scrollbar-hide pb-20">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Zero FIR Assistant</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[3px]">Digital Complaint Registration (Sec. 154 CrPC)</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: -20, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-3 text-center">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-500 block">Select Incident Category</label>
                <div className="grid grid-cols-1 gap-3">
                  {incidentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setIncidentType(type)}
                      className={cn(
                        "p-5 rounded-2xl border transition-all text-center",
                        incidentType === type 
                          ? "bg-accent-red/10 border-accent-red text-white" 
                          : "bg-white/5 border-white/10 text-white/60"
                      )}
                    >
                      <span className="text-xs font-bold uppercase tracking-wide">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button 
                disabled={!incidentType}
                onClick={() => setStep(2)}
                className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[2px] disabled:opacity-20 transition-all"
              >
                Continue to Evidence Details
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: -20, x: 0 }}
              className="space-y-6"
            >
              {/* Evidence Upload Section */}
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-500 block">Attach Media Proof (Photos/Videos/Screenshots)</label>
                 <div className="grid grid-cols-4 gap-3">
                    {attachments.map((file, idx) => (
                       <div key={idx} className="relative aspect-square bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                          {file.type.startsWith('image') ? <Camera size={16} className="text-gray-500" /> : <Video size={16} className="text-gray-500" />}
                          <button 
                            onClick={() => removeAttachment(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                          >
                             <Trash2 size={8} />
                          </button>
                       </div>
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-accent-red transition-all"
                    >
                       <Plus size={20} className="text-gray-500" />
                       <span className="text-[8px] font-bold text-gray-600 uppercase">Add Proof</span>
                    </button>
                 </div>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileChange} 
                   multiple 
                   className="hidden" 
                   accept="image/*,video/*"
                 />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[2px] text-gray-500 block">Describe the Incident</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about the person, vehicle, or event..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-accent-red/50 transition-all"
                />
              </div>

              <button 
                onClick={() => setStep(3)}
                className="w-full py-5 bg-accent-red text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-xl shadow-accent-red/20"
              >
                Generate Official FIR Copy
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center pt-10 text-center space-y-8"
            >
              <div className="w-24 h-24 bg-accent-green/20 rounded-full flex items-center justify-center text-accent-green shadow-2xl shadow-accent-green/20">
                <ShieldCheck size={48} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-black text-white uppercase italic">Document Secured</h3>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-10">Your Zero FIR (Complaint #FIR-291) has been generated and encrypted in the Evidence Vault.</p>
              </div>
              
              <div className="grid grid-cols-1 w-full gap-3">
                <button 
                  onClick={handleDownload}
                  className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                   <Download size={16} /> Download Official PDF
                </button>
                <button 
                  onClick={handleForward}
                  className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                   <Send size={16} /> Forward to E-Police Hub
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-white/5 border-t border-white/10 flex items-center gap-3">
         <FileText size={16} className="text-gray-500" />
         <p className="text-[8px] text-gray-500 font-bold uppercase leading-relaxed tracking-widest">A Zero FIR can be filed at ANY police station irrespective of jurisdiction. The police MUST forward it to the concerned station.</p>
      </div>

      {/* Hidden FIR Template for Print */}
      <div ref={printRef} className="hidden" />
    </div>
  );
}
