import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, MessageSquare, Phone, Info, Send, UserX, AlertCircle, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import KavachAIChat from '../components/KavachAIChat';

export default function SpecialCellScreen() {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const handleSubmitReport = async () => {
    if (!message) return;
    setIsSending(true);
    try {
      console.log("KAVACH: Dispatching Discreet Intelligence Report...");
      await addDoc(collection(db, 'special_cell_reports'), {
        text: message,
        anonymous: isAnonymous,
        uid: isAnonymous ? 'ANONYMOUS_MISSION' : (auth.currentUser?.uid || 'ID_PROTOCOL_INVOKED'),
        userName: isAnonymous ? 'Anonymous Citizen' : (auth.currentUser?.displayName || auth.currentUser?.email || 'Verified Citizen'),
        userEmail: isAnonymous ? null : auth.currentUser?.email,
        timestamp: serverTimestamp(),
        status: 'pending',
        priority: 'CRITICAL',
        metadata: {
           client: 'Mobile_Kavach_Node',
           auth_verified: !!auth.currentUser
        }
      });
      setSentAt(Date.now());
      setMessage('');
    } catch (e) {
      console.error("Report transmission failure:", e);
      alert("Mission Link Failed. Check your network or neural sync.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-[85vh] p-6 space-y-8 pb-32">
       {/* Header Section */}
       <header>
          <div className="flex items-center gap-3 text-accent-blue mb-2">
             <Shield size={20} className="animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[4px]">Verified Secure Node</span>
          </div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Special Cell</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[2px] mt-2 italic">No FIR Required. Zero-Trust Anonymous Help.</p>
       </header>

       {sentAt ? (
         <motion.div 
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="bg-green-500/10 border-2 border-green-500/30 p-8 rounded-[32px] text-center space-y-4"
         >
           <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto">
             <Lock size={32} />
           </div>
           <h3 className="text-xl font-black uppercase italic tracking-tight">Mission Secured</h3>
           <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
             Your report has been encrypted and routed directly to the Central Special Cell command. <br/> A specialized responder will review the telemetry shortly.
           </p>
           <button onClick={() => setSentAt(null)} className="text-[10px] text-accent-blue font-black uppercase underline tracking-widest">Send another report</button>
         </motion.div>
       ) : (
         <>
           {/* Rapid Action Actions */}
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => window.open('tel:1091', '_self')} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all">
                <div className="w-12 h-12 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-lg">
                  <Phone size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Women Helpline</span>
              </button>
              <button 
                onClick={() => setIsAIChatOpen(true)}
                className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all"
              >
                <div className="w-12 h-12 bg-accent-blue/10 text-accent-blue rounded-2xl flex items-center justify-center group-hover:bg-accent-blue group-hover:text-white transition-all shadow-lg">
                  <MessageSquare size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Connect AI Bot</span>
              </button>
           </div>

           {/* Anonymous Reporting Box */}
           <section className="bg-gradient-to-br from-[#0d0d0f] to-black border border-white/5 rounded-[40px] p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <AlertCircle size={20} className="text-accent-blue" />
                   <h3 className="text-xs font-black uppercase tracking-widest">Discreet Report</h3>
                 </div>
                 <button 
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isAnonymous ? 'bg-green-600/20 border-green-500/30 text-green-500' : 'bg-white/5 border-white/10 text-gray-500'}`}
                 >
                   <UserX size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{isAnonymous ? 'Anonymous ON' : 'ID Visible'}</span>
                 </button>
              </div>

              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe current situation or threat... (Blackmail, Stalking, etc.)"
                className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-sm font-bold placeholder:text-gray-700 outline-none focus:border-accent-blue/50 transition-all resize-none"
              />

              <button 
                onClick={handleSubmitReport}
                disabled={!message || isSending}
                className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[3px] text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-30"
              >
                {isSending ? 'Transmitting...' : (
                  <>
                    <Send size={16} /> 
                    Secure Transmission
                  </>
                )}
              </button>

              <div className="flex items-start gap-4 p-4 bg-white/3 rounded-2xl border border-white/5">
                <Info size={16} className="text-gray-500 shrink-0 mt-1" />
                <p className="text-[9px] text-gray-500 font-bold uppercase leading-relaxed tracking-widest italic opacity-60">
                  Data sent to the Special Cell is treated with Zero-Trust protocols. We prioritize your privacy and immediate safety over paperwork.
                </p>
              </div>
           </section>
         </>
       )}
        <KavachAIChat isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </div>
  );
}
