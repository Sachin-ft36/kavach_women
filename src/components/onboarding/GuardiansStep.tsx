import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserPlus, Trash2, Landmark, CheckCircle2, Info, QrCode, MapPin, Compass } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { db, auth } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import QuickPairQr from '../guardian/QuickPairQr';

interface GuardiansStepProps {
  guardians: { name: string; phone: string; relation: string }[];
  setGuardians: (guardians: { name: string; phone: string; relation: string }[]) => void;
  localGuardian?: { name: string; phone: string; relation: string; address?: string } | null;
  setLocalGuardian?: (localGuardian: { name: string; phone: string; relation: string; address?: string } | null) => void;
  userPhone?: string;
}

export default function GuardiansStep({ 
  guardians, 
  setGuardians,
  localGuardian,
  setLocalGuardian,
  userPhone
}: GuardiansStepProps) {
  const { t } = useLanguage();
  
  const [activeMode, setActiveMode] = useState<'family' | 'local'>('family');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftRelation, setDraftRelation] = useState('Father');
  const [draftAddress, setDraftAddress] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const guardiansRef = collection(db, 'users', auth.currentUser.uid, 'guardians');
    const unsubscribe = onSnapshot(guardiansRef, (snapshot) => {
      const list = snapshot.docs
        .map(doc => ({
          name: doc.data().name || 'Guardian',
          phone: (doc.data().phone || '').replace(/\D/g, '').slice(-10),
          relation: doc.data().relation || 'Guardian',
          isLocal: !!doc.data().isLocal,
          address: doc.data().address || ''
        }));
        
      const famList = list.filter(g => !g.isLocal);
      const locGuard = list.find(g => g.isLocal);
      
      if (famList.length > 0) setGuardians(famList);
      if (locGuard && setLocalGuardian) setLocalGuardian(locGuard);
    });
    return () => unsubscribe();
  }, [setGuardians, setLocalGuardian]);

  const handleAddClick = () => {
    if (draftPhone.length < 10) return;

    const cleanUserPhone = userPhone?.replace(/\D/g, '').slice(-10) || '';
    const cleanDraftPhone = draftPhone.replace(/\D/g, '').slice(-10);
    
    if (cleanUserPhone && cleanUserPhone === cleanDraftPhone) {
      toast.error('Invalid Contact', {
        description: 'You cannot add your own phone number.'
      });
      return;
    }

    if (activeMode === 'family') {
      if (guardians.length >= 3) {
        toast.error('Limit Reached', { description: 'You can add up to 3 Family Guardians.' });
        return;
      }
      setGuardians([...guardians, { name: draftRelation, phone: draftPhone, relation: draftRelation }]);
      toast.success('Family Guardian Added!');
    } else {
      if (setLocalGuardian) {
        setLocalGuardian({
          name: draftName || 'Local Guardian',
          phone: draftPhone,
          relation: draftRelation,
          address: draftAddress
        });
        toast.success('Local Guardian Configured!');
      }
    }

    setDraftPhone('');
    setDraftName('');
    setDraftAddress('');
    setDraftRelation(activeMode === 'family' ? 'Father' : 'Best Friend');
  };

  const removeGuardian = (index: number) => {
    const updated = guardians.filter((_, i) => i !== index);
    setGuardians(updated);
  };

  const removeLocalGuardian = () => {
    if (setLocalGuardian) setLocalGuardian(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 flex flex-col min-h-0 font-sans w-full max-w-md mx-auto relative px-2 sm:px-4 text-slate-900"
    >
      {/* Official Header */}
      <div className="flex flex-col items-center space-y-2 mt-2 mb-3 text-center shrink-0">
        <Landmark className="text-[#000080]" size={22} strokeWidth={1.5} />
        <div className="space-y-0.5">
          <h2 className="text-[15px] sm:text-[17px] font-black tracking-widest text-[#000080] uppercase">
            Emergency Registry
          </h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
            National Safety Grid • Form 3A
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 space-y-4">
        
        {/* Toggle Mode */}
        <div className="flex rounded-md bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => {
              setActiveMode('family');
              setDraftRelation('Father');
            }}
            className={cn(
              "flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all border-none cursor-pointer",
              activeMode === 'family' ? "bg-[#000080] text-white shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            Family Circle
          </button>
          <button
            onClick={() => {
              setActiveMode('local');
              setDraftRelation('Best Friend');
            }}
            className={cn(
              "flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all border-none cursor-pointer",
              activeMode === 'local' ? "bg-[#000080] text-white shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            Local Guardian
          </button>
        </div>

        {/* Notice Info Box */}
        <div className="bg-blue-50 border-l-2 border-[#000080] px-3 py-2 flex items-start gap-2 rounded-r-sm">
          <Info size={13} className="text-[#000080] shrink-0 mt-0.5" />
          <p className="text-[8.5px] font-bold text-[#000080] uppercase tracking-wide leading-relaxed">
            {activeMode === 'family' 
              ? "Family Circle: Connect parents & siblings (emotional layer). They will receive parallel instant SOS notifications."
              : "Local Guardian: Add a trusted colleague, roommate, or neighbor who lives nearby and can reach you within 15 minutes."}
          </p>
        </div>

        {/* Quick Pair QR Banner (Family only) */}
        {activeMode === 'family' && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-md p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <QrCode size={18} className="text-indigo-600" />
              <div>
                <p className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">Quick Pair via QR</p>
                <p className="text-[8px] text-indigo-700 font-bold uppercase tracking-wide">Let guardians scan you to link instantly</p>
              </div>
            </div>
            <button 
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-black uppercase tracking-widest rounded-sm border-none cursor-pointer"
            >
              Show QR
            </button>
          </div>
        )}

        {/* Official Form Container */}
        <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden relative">
          <div className="h-1.5 w-full flex">
            <div className="h-full flex-1 bg-[#FF9933]"></div>
            <div className="h-full flex-1 bg-white"></div>
            <div className="h-full flex-1 bg-[#138808]"></div>
          </div>

          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserPlus size={12} className="text-[#000080]" />
              <span className="text-[9px] font-black text-[#000080] uppercase tracking-widest">
                {activeMode === 'family' ? "Add Family Member" : "Configure Local Guardian"}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-4 bg-white">
            {activeMode === 'local' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-700">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="E.G. RAHUL SINGH"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full h-[40px] px-3 bg-white border border-slate-300 rounded-sm text-xs font-bold text-slate-900 uppercase tracking-wide outline-none focus:border-[#000080] transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-700">
                Relationship <span className="text-red-600">*</span>
              </label>
              <select 
                value={draftRelation}
                onChange={(e) => setDraftRelation(e.target.value)}
                className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-sm text-xs font-bold text-slate-900 uppercase tracking-wide outline-none focus:border-[#000080] transition-all"
              >
                {activeMode === 'family' 
                  ? ['Father', 'Mother', 'Brother', 'Sister', 'Husband', 'Wife', 'Relative', 'Guardian'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))
                  : ['Best Friend', 'Neighbour', 'Flatmate', 'Trusted Colleague', 'Relative'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))
                }
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-700">
                Mobile Number <span className="text-red-600">*</span>
              </label>
              <div className="flex items-center w-full rounded-sm border border-slate-300 bg-white overflow-hidden focus-within:border-[#000080] transition-all">
                <div className="flex items-center justify-center h-[40px] px-3 text-[11px] font-black text-slate-700 border-r border-slate-300 bg-slate-50 shrink-0 font-sans">
                  +91
                </div>
                <input 
                  type="tel" 
                  maxLength={10} 
                  placeholder="10-DIGIT NUMBER" 
                  value={draftPhone} 
                  onChange={(e) => setDraftPhone(e.target.value.replace(/\D/g, ''))} 
                  className="flex-1 h-[40px] px-3 bg-transparent border-none outline-none text-xs font-bold text-slate-900 font-mono tracking-[0.1em] placeholder:text-[9px]"
                />
              </div>
            </div>

            {activeMode === 'local' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-700 flex justify-between">
                  <span>Current Area/Address</span>
                  <span className="text-[7.5px] text-slate-500 font-bold tracking-normal italic uppercase">For Soft Proximity Check</span>
                </label>
                <input 
                  type="text" 
                  placeholder="E.G. NEHRU NAGAR, REWA"
                  value={draftAddress}
                  onChange={(e) => setDraftAddress(e.target.value)}
                  className="w-full h-[40px] px-3 bg-white border border-slate-300 rounded-sm text-xs font-bold text-slate-900 uppercase tracking-wide outline-none focus:border-[#000080] transition-all"
                />
              </div>
            )}

            <button 
              onClick={handleAddClick} 
              disabled={draftPhone.length < 10 || (activeMode === 'local' && !draftName.trim())}
              className={cn(
                "w-full py-2.5 rounded-sm text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] border-none",
                draftPhone.length === 10 && (activeMode === 'family' || draftName.trim())
                  ? "bg-[#000080] text-white shadow-[0_4px_15px_rgba(0,0,128,0.2)] hover:bg-blue-900 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              )}
            >
              <CheckCircle2 size={12} />
              <span>{activeMode === 'family' ? "Authorize & Add Contact" : "Link Local Guardian"}</span>
            </button>
          </div>
        </div>

        {/* Local Guardian Status Card */}
        {localGuardian && (
          <div className="mt-4 space-y-3">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-[#000080] flex items-center gap-1.5 border-b border-blue-100 pb-1.5 px-1">
              <MapPin size={12} /> Local Guardian (Hyper-Local Responder)
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-600 font-black text-sm shrink-0">
                  {localGuardian.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-slate-950 uppercase tracking-wider">{localGuardian.name}</span>
                    <span className="px-1.5 py-0.5 bg-orange-600 text-white rounded-[2px] text-[6.5px] font-black uppercase tracking-widest">
                      {localGuardian.relation}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-800 font-bold font-mono tracking-widest mt-0.5">
                    +91 {localGuardian.phone}
                  </p>
                  {localGuardian.address && (
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide flex items-center gap-1 mt-1">
                      <Compass size={10} /> {localGuardian.address}
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={removeLocalGuardian}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Registered Family Guardians List */}
        {guardians.length > 0 && (
          <div className="mt-4 space-y-3">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1.5 border-b border-emerald-100 pb-1.5 px-1">
              <ShieldCheck size={12} /> Family Safety Circle ({guardians.length}/3)
            </h3>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {guardians.map((g, idx) => (
                    <motion.div 
                      key={`${g.phone}-${idx}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white border border-slate-200 rounded-sm p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-sm bg-blue-50 border border-blue-100 flex items-center justify-center text-[#000080] font-black text-xs shrink-0">
                          {g.name[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="px-1.5 py-0.5 bg-[#000080] text-white rounded-[2px] text-[7px] font-black uppercase tracking-widest w-fit">
                            {g.relation}
                          </span>
                          <p className="text-[10px] sm:text-[11px] text-slate-800 font-bold font-mono tracking-widest mt-1">
                            +91 {g.phone}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeGuardian(idx)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors border-none bg-transparent cursor-pointer shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showQrModal && (
          <QuickPairQr 
            mode="generate" 
            onClose={() => setShowQrModal(false)} 
            currentUserProfile={{
              uid: auth.currentUser?.uid,
              name: auth.currentUser?.displayName || 'Kavach Citizen',
              phoneNumber: auth.currentUser?.phoneNumber || ''
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}