import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ShieldCheck, MapPin, Clock, CheckCircle2,
  AlertTriangle, Home, Plus, Users, User, Shield,
  ChevronRight, Car, QrCode, Link as LinkIcon, Keyboard, X,
  UserPlus, Radio, Activity, Settings, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { useKavachStore } from '../state/useKavachStore';
import { db, auth } from '../firebase';
import QuickPairQr from './guardian/QuickPairQr';

interface FamilyCircleDetailProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FamilyCircleDetail({ isOpen, onClose }: FamilyCircleDetailProps) {
  const { profile, guardianCache, verifiedProtectorCount, setOverlayActive } = useKavachStore();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);
  const [isPairingQrOpen, setIsPairingQrOpen] = useState<boolean>(false);
  const [pairingQrMode, setPairingQrMode] = useState<'generate' | 'scan'>('generate');
  const [showInviteOverlay, setShowInviteOverlay] = useState<boolean>(false);
  const [addTargetCircle, setAddTargetCircle] = useState<'family' | 'friends' | 'any'>('any');

  // Unified Add Person flow state
  const [addStep, setAddStep] = useState<number>(1);
  const [addForm, setAddForm] = useState({ name: '', phone: '', relationship: '' });
  const [checkingProgress, setCheckingProgress] = useState<number>(0);
  const [isFoundOnKavach, setIsFoundOnKavach] = useState<boolean>(true);

  // Default relationship state depending on which circle is active
  useEffect(() => {
    if (isAddMemberOpen) {
      if (addTargetCircle === 'friends') {
        setAddForm(prev => ({ ...prev, relationship: 'Friend' }));
      } else if (addTargetCircle === 'family') {
        setAddForm(prev => ({ ...prev, relationship: 'Mother' }));
      } else {
        setAddForm(prev => ({ ...prev, relationship: 'Mother' }));
      }
    }
  }, [isAddMemberOpen, addTargetCircle]);

  // Reset flow when modal closes
  useEffect(() => {
    if (!isAddMemberOpen) {
      setAddStep(1);
      setAddForm({ name: '', phone: '', relationship: '' });
      setCheckingProgress(0);
    }
  }, [isAddMemberOpen]);

  // Loading animation effect for Step 3
  useEffect(() => {
    if (addStep === 3) {
      setCheckingProgress(0);
      const timer1 = setTimeout(() => setCheckingProgress(1), 700);
      const timer2 = setTimeout(() => setCheckingProgress(2), 1400);
      const timer3 = setTimeout(() => setCheckingProgress(3), 2100);
      const timer4 = setTimeout(() => {
        // Mock check logic: if name contains 'riya' or phone ends with even digit, it is found
        const isFound = addForm.name.toLowerCase().includes('riya') ||
          addForm.phone.endsWith('0') ||
          addForm.phone.endsWith('2') ||
          addForm.phone.endsWith('4') ||
          addForm.phone.endsWith('6') ||
          addForm.phone.endsWith('8') ||
          addForm.phone === '';
        setIsFoundOnKavach(isFound);
        setAddStep(4);
      }, 2800);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [addStep, addForm]);

  // Dynamic members lists
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [friendMembers, setFriendMembers] = useState<any[]>([]);

  useEffect(() => {
    if (guardianCache && Array.isArray(guardianCache)) {
      const acceptedGuardians = guardianCache.filter((g: any) => g.status !== 'pending' && g.accepted !== false && g.uid);
      const fam = acceptedGuardians.filter((g: any) => g.relationship !== 'Friend').map((g: any) => ({
        name: g.name || g.relationship || 'Guardian',
        status: g.status || 'Safe',
        statusColor: 'green',
        img: g.photoURL || g.photoUrl || ''
      }));
      const fri = acceptedGuardians.filter((g: any) => g.relationship === 'Friend').map((g: any) => ({
        name: g.name || 'Friend',
        status: g.status || 'Safe',
        statusColor: 'green',
        img: g.photoURL || g.photoUrl || ''
      }));
      setFamilyMembers(fam);
      setFriendMembers(fri);
    }
  }, [guardianCache]);

  const handleAddMemberAction = () => {
    const isFriend = addForm.relationship === 'Friend';
    const newMember = {
      name: addForm.name || 'Riya Sharma',
      status: 'Pending',
      statusColor: 'gray',
      img: isFriend
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
        : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop'
    };

    if (isFriend) {
      setFriendMembers(prev => [...prev, newMember]);
      toast.success(`${newMember.name} added to Friends Circle (Pending)!`);
    } else {
      setFamilyMembers(prev => [...prev, newMember]);
      toast.success(`${newMember.name} added to Family Circle (Pending)!`);
    }
    setAddStep(5); // Request Sent page
  };

  useEffect(() => {
    if (setOverlayActive) {
      setOverlayActive(isAddMemberOpen || isPairingQrOpen);
    }
    return () => {
      if (setOverlayActive) {
        setOverlayActive(false);
      }
    };
  }, [isAddMemberOpen, isPairingQrOpen, setOverlayActive]);

  if (!isOpen) return null;

  const overlayContent = (
    <div className="w-full min-h-screen text-white bg-[#05050a] font-sans pb-32 selection:bg-[#7C4DFF]/30 relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[260px] bg-gradient-to-b from-[#7C4DFF]/6 to-transparent blur-[100px] pointer-events-none rounded-full" />

      <div className="w-[calc(100vw-20px)] max-w-[820px] mx-auto px-1">
        {/* HEADER */}
        <header className="px-3 pt-4 pb-2.5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 text-left">
            <button
              onClick={onClose}
              className="w-7.5 h-7.5 flex items-center justify-center text-slate-300 bg-[#090B21]/50 border border-[#3b236d]/50 hover:bg-[#1c152e] rounded-xl active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft size={13} />
            </button>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <h1 className="text-[17px] font-medium tracking-tight leading-none">My Circle</h1>
                <Users size={16} className="text-[#8b5cf6] fill-[#8b5cf6]/20" />
              </div>
              <p className="text-[10px] text-gray-400 font-normal">Your people. Your protection.</p>
            </div>
          </div>

          <button
            onClick={() => { setAddTargetCircle('any'); setIsAddMemberOpen(true); }}
            className="bg-[#6035f5] hover:bg-[#5229db] active:scale-95 transition-all px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-white flex items-center gap-1 shadow-[0_3px_12px_rgba(96,53,245,0.4)] cursor-pointer"
          >
            <Plus size={13} strokeWidth={2.5} /> Add Member
          </button>
        </header>

        <main className="space-y-4 relative z-10">


          {/* 1. FAMILY CIRCLE */}
          <section className="bg-[#0e0728]/95 border border-[#7C4DFF]/50 rounded-[20px] p-4 shadow-[0_15px_35px_rgba(124,77,255,0.15)] backdrop-blur-xl relative overflow-hidden">
            {/* Layered radial glow inside */}
            <div className="absolute top-[-70px] left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-[radial-gradient(circle,#7C4DFF,transparent_75%)] opacity-[0.08] blur-[45px] pointer-events-none" />

            {/* Top Header */}
            <div className="flex justify-between items-center mb-2.5 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#231448] flex items-center justify-center border border-[#7C4DFF]/30 text-[#a78bfa]">
                  <Shield size={13} className="fill-[#a78bfa]/10" />
                </div>
                <div className="text-left">
                  <h2 className="text-[13px] font-medium text-white tracking-tight leading-tight">Family Circle</h2>
                  <p className="text-[10px] font-normal text-[#9d72ff] mt-0.5">{familyMembers.length} Members</p>
                </div>
              </div>
              <div className="bg-[#0d1424]/90 border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-medium text-white flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors shadow-sm">
                <CheckCircle2 size={11} className="text-[#00FF88]" /> All Safe
                <ChevronRight size={10} className="text-slate-500 ml-0.5" />
              </div>
            </div>

            {familyMembers.length > 0 ? (
              <div className="flex items-center gap-2.5 relative z-10 mt-3">
                <div className="flex-1 flex gap-3 overflow-x-auto scrollbar-hide pt-2 pb-1 w-full items-center">
                  <Avatar img={profile?.photoURL || profile?.photoUrl || ""} name="You" status="Safe" statusColor="green" isYou />
                  {familyMembers.map((m, idx) => (
                    <Avatar key={idx} img={m.img} name={m.name} status={m.status} statusColor={m.statusColor} />
                  ))}
                </div>
                <div className="shrink-0 border-l border-[#7C4DFF]/15 pl-2.5 pb-1">
                  <AddAvatarButton type="Member" borderColor="border-white/[0.12] hover:border-[#8b5cf6]" hoverColor="hover:bg-white/[0.02]" onClick={() => { setAddTargetCircle('family'); setIsAddMemberOpen(true); }} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between relative z-10 my-2 px-1">
                <div className="flex items-center gap-7 flex-1 pr-2 text-left">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#8b5cf6] bg-[#8b5cf6]/10 flex items-center justify-center text-[#a78bfa] shrink-0 self-center ml-2.5">
                    <Users size={22} />
                  </div>
                  <div className="flex flex-col items-start min-w-0 justify-center">
                    <h3 className="text-[11px] font-medium text-white tracking-tight leading-tight mb-0.5">No family members yet</h3>
                    <p className="text-[9px] font-normal text-slate-300 leading-snug mb-1.5 max-w-[200px]">Add your loved ones to create your family safety circle.</p>
                    <button 
                      onClick={() => { setAddTargetCircle('family'); setIsAddMemberOpen(true); }}
                      className="bg-[#6035f5] hover:bg-[#5229db] active:scale-95 transition-all px-3 py-1.5 rounded-md text-[9px] font-medium text-white flex items-center gap-1 shadow-[0_3px_12px_rgba(96,53,245,0.4)] cursor-pointer whitespace-nowrap"
                    >
                      <Plus size={10} strokeWidth={2.5} /> Add Your First Member
                    </button>
                  </div>
                </div>
                <div className="w-[1px] h-14 bg-white/[0.08] shrink-0 mx-2 self-center" />
                <div 
                  onClick={() => { setAddTargetCircle('family'); setIsAddMemberOpen(true); }}
                  className="flex flex-col items-center justify-center shrink-0 cursor-pointer w-14 group self-center"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 group-hover:border-white/60 bg-white/[0.04] flex items-center justify-center text-slate-200 group-hover:text-white transition-all mb-1">
                    <Plus size={20} strokeWidth={1.8} />
                  </div>
                  <span className="text-[9.5px] font-normal text-slate-200 group-hover:text-white leading-tight text-center">Add<br />Member</span>
                </div>
              </div>
            )}

            <div
              onClick={() => { setAddTargetCircle('family'); setIsAddMemberOpen(true); }}
              className="mt-3 bg-[#130d2e]/80 border border-white/[0.06] hover:bg-[#19113b] transition-all rounded-xl p-2.5 flex justify-between items-center cursor-pointer group relative z-10"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-[#2a1d4f] flex items-center justify-center border border-white/5 text-[#a78bfa]">
                  <Shield size={13} className="fill-[#a78bfa]/20" />
                </div>
                <div>
                  <h3 className="text-[12px] font-medium text-white leading-tight">Manage Family Circle</h3>
                  <p className="text-[10px] text-slate-400 font-normal mt-0.5">Edit members, permissions & roles</p>
                </div>
              </div>
              <ChevronRight size={13} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
          </section>

          {/* 2. FRIENDS CIRCLE */}
          <section className="bg-[#071328]/95 border border-[#00A3FF]/50 rounded-[20px] p-4 shadow-[0_15px_35px_rgba(0,163,255,0.15)] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-[-70px] left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-[radial-gradient(circle,#00A3FF,transparent_75%)] opacity-[0.08] blur-[45px] pointer-events-none" />

            <div className="flex justify-between items-center mb-2.5 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#142648] flex items-center justify-center border border-[#00A3FF]/30 text-[#00A3FF]">
                  <Users size={13} className="fill-[#00A3FF]/20" />
                </div>
                <div className="text-left">
                  <h2 className="text-[13px] font-medium text-white tracking-tight leading-tight">Friends Circle</h2>
                  <p className="text-[10px] font-normal text-[#60a5fa] mt-0.5">{friendMembers.length} Friends</p>
                </div>
              </div>
              <div className="bg-[#0d1424]/90 border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-medium text-white flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors shadow-sm">
                <CheckCircle2 size={11} className="text-[#00FF88]" /> All Safe
                <ChevronRight size={10} className="text-slate-500 ml-0.5" />
              </div>
            </div>

            {friendMembers.length > 0 ? (
              <div className="flex items-center gap-2.5 relative z-10 mt-3">
                <div className="flex-1 flex gap-3 overflow-x-auto scrollbar-hide pt-2 pb-1 w-full items-center">
                  {friendMembers.map((m, idx) => (
                    <Avatar key={idx} img={m.img} name={m.name} status={m.status} statusColor={m.statusColor} />
                  ))}
                </div>
                <div className="shrink-0 border-l border-[#00A3FF]/15 pl-2.5 pb-1">
                  <AddAvatarButton type="Friend" borderColor="border-white/[0.12]" hoverColor="hover:border-[#00A3FF]" onClick={() => { setAddTargetCircle('friends'); setIsAddMemberOpen(true); }} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between relative z-10 my-2 px-1">
                <div className="flex items-center gap-7 flex-1 pr-2 text-left">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#00A3FF] bg-[#00A3FF]/10 flex items-center justify-center text-[#00A3FF] shrink-0 self-center ml-2.5">
                    <Users size={22} />
                  </div>
                  <div className="flex flex-col items-start min-w-0 justify-center">
                    <h3 className="text-[11px] font-medium text-white tracking-tight leading-tight mb-0.5">No friends added yet</h3>
                    <p className="text-[9px] font-normal text-slate-300 leading-snug mb-1.5 max-w-[200px]">Add friends to stay connected and share locations.</p>
                    <button 
                      onClick={() => { setAddTargetCircle('friends'); setIsAddMemberOpen(true); }}
                      className="bg-[#00A3FF] hover:bg-[#008ce6] active:scale-95 transition-all px-3 py-1.5 rounded-md text-[9px] font-medium text-white flex items-center gap-1 shadow-[0_3px_12px_rgba(0,163,255,0.4)] cursor-pointer whitespace-nowrap"
                    >
                      <Plus size={10} strokeWidth={2.5} /> Add Your First Friend
                    </button>
                  </div>
                </div>
                <div className="w-[1px] h-14 bg-white/[0.08] shrink-0 mx-2 self-center" />
                <div 
                  onClick={() => { setAddTargetCircle('friends'); setIsAddMemberOpen(true); }}
                  className="flex flex-col items-center justify-center shrink-0 cursor-pointer w-14 group self-center"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 group-hover:border-white/60 bg-white/[0.04] flex items-center justify-center text-slate-200 group-hover:text-white transition-all mb-1">
                    <Plus size={20} strokeWidth={1.8} />
                  </div>
                  <span className="text-[9.5px] font-normal text-slate-200 group-hover:text-white leading-tight text-center">Add<br />Friend</span>
                </div>
              </div>
            )}

            <div
              onClick={() => { setAddTargetCircle('friends'); setIsAddMemberOpen(true); }}
              className="mt-3 bg-[#0b162a]/80 border border-white/[0.06] hover:bg-[#101f3d] transition-all rounded-xl p-2.5 flex justify-between items-center cursor-pointer group relative z-10"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-[#1e2e4a] flex items-center justify-center border border-white/5 text-[#60a5fa]">
                  <Users size={13} className="fill-[#60a5fa]/20" />
                </div>
                <div>
                  <h3 className="text-[12px] font-medium text-white leading-tight">Manage Friends</h3>
                  <p className="text-[10px] text-slate-400 font-normal mt-0.5">View, edit & share your location with friends</p>
                </div>
              </div>
              <ChevronRight size={13} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
          </section>

          {/* 3. TRUSTED CIRCLE */}
          <section className="bg-[#051812]/95 border border-[#00FF88]/50 rounded-[20px] p-4 shadow-[0_15px_35px_rgba(0,255,136,0.15)] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-[-70px] left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-[radial-gradient(circle,#00FF88,transparent_75%)] opacity-[0.08] blur-[45px] pointer-events-none" />

            <div className="flex justify-between items-center mb-2.5 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0f3223] flex items-center justify-center border border-[#00FF88]/30 text-[#00FF88]">
                  <ShieldCheck size={13} className="fill-[#00FF88]/20" />
                </div>
                <div className="text-left">
                  <h2 className="text-[13px] font-medium text-white tracking-tight leading-tight text-left">
                    Trusted Circle <span className="text-[10px] text-gray-400 font-normal block xs:inline mt-0.5 xs:mt-0">(Nearby Protectors)</span>
                  </h2>
                  <p className="text-[10px] font-normal text-[#00FF88] mt-0.5">{verifiedProtectorCount || 0} Protectors Nearby</p>
                </div>
              </div>
              <div className="bg-[#0d1424]/90 border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-medium text-white flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors shadow-sm">
                <CheckCircle2 size={11} className="text-[#00FF88]" /> All Active
                <ChevronRight size={10} className="text-slate-500 ml-0.5" />
              </div>
            </div>

            {verifiedProtectorCount && verifiedProtectorCount > 0 ? (
              <div className="flex items-center gap-2.5 relative z-10 mt-3">
                <div className="flex-1 flex gap-3 overflow-x-auto scrollbar-hide pt-2 pb-1 w-full items-center">
                  {Array.from({ length: Math.min(verifiedProtectorCount, 4) }).map((_, idx) => (
                    <Avatar key={idx} img="" name={`Protector ${idx + 1}`} status="Nearby" statusColor="green" badge="shield" />
                  ))}
                </div>
                <div className="shrink-0 border-l border-[#00FF88]/15 pl-2.5 pb-1">
                  <AddAvatarButton type="Protectors" borderColor="border-white/[0.12]" hoverColor="hover:border-[#00FF88]" title="See All" onClick={() => toast.info("Opening Protectors Radar...")} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between relative z-10 my-2 px-1">
                <div className="flex items-center gap-7 flex-1 pr-2 text-left">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#00FF88] bg-[#00FF88]/10 flex items-center justify-center text-[#00FF88] shrink-0 self-center ml-2.5">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="flex flex-col items-start min-w-0 justify-center">
                    <h3 className="text-[11px] font-medium text-white tracking-tight leading-tight mb-0.5">No trusted protectors nearby</h3>
                    <p className="text-[9px] font-normal text-slate-300 leading-snug mb-1.5 max-w-[200px]">Allow location access to find nearby trusted protectors.</p>
                    <button 
                      onClick={() => toast.success("Location Access Enabled")}
                      className="bg-[#00d254] hover:bg-[#00b849] active:scale-95 transition-all px-3 py-1.5 rounded-md text-[9px] font-medium text-white flex items-center gap-1 shadow-[0_3px_12px_rgba(0,210,84,0.4)] cursor-pointer whitespace-nowrap"
                    >
                      <Plus size={10} strokeWidth={2.5} /> Enable Location Access
                    </button>
                  </div>
                </div>
                <div className="w-[1px] h-14 bg-white/[0.08] shrink-0 mx-2 self-center" />
                <div 
                  onClick={() => toast.info("Opening Protectors Radar...")}
                  className="flex flex-col items-center justify-center shrink-0 cursor-pointer w-14 group self-center"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 group-hover:border-white/60 bg-white/[0.04] flex items-center justify-center text-slate-200 group-hover:text-white transition-all mb-1">
                    <Plus size={20} strokeWidth={1.8} />
                  </div>
                  <span className="text-[9.5px] font-normal text-slate-200 group-hover:text-white leading-tight text-center">See All<br />Protectors</span>
                </div>
              </div>
            )}

            <div 
              onClick={() => toast.info("Opening Nearby Protectors view...")}
              className="mt-3 bg-[#071d16]/80 border border-white/[0.06] hover:bg-[#0c2920] transition-all rounded-xl p-2.5 flex justify-between items-center cursor-pointer group relative z-10"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-lg bg-[#133526] flex items-center justify-center border border-white/5 text-[#4ade80]">
                  <Radio size={13} />
                </div>
                <div>
                  <h3 className="text-[12px] font-medium text-white leading-tight">View Nearby Protectors</h3>
                  <p className="text-[10px] text-slate-400 font-normal mt-0.5">See who can help you in an emergency</p>
                </div>
              </div>
              <ChevronRight size={13} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </div>
          </section>

          {/* 4. CIRCLE ACTIVITY */}
          <section className="pt-3 pb-2">
            <div className="flex justify-between items-center mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-[#8b5cf6]" />
                <h2 className="text-[12px] font-medium text-white tracking-tight">Circle Activity</h2>
              </div>
              <button className="text-[#a78bfa] hover:text-white text-[10px] font-normal flex items-center gap-0.5 transition-colors bg-transparent border-none cursor-pointer">
                View All <ChevronRight size={11} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="bg-[#0f0d22]/90 border border-white/[0.06] rounded-2xl p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#15122e] transition-all">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#00FF88] shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-medium text-white leading-tight">Welcome to Kavach!</h4>
                    <p className="text-[9px] font-normal text-slate-400 mt-0.5 leading-tight">Let's build your safety network.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[9px] font-normal">
                  <span>Just now</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              <div className="bg-[#0f0d22]/90 border border-white/[0.06] rounded-2xl p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#15122e] transition-all">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-medium text-white leading-tight">Add your first family member</h4>
                    <p className="text-[9px] font-normal text-slate-400 mt-0.5 leading-tight">Stay connected with your loved ones.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[9px] font-normal">
                  <span>Just now</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              <div className="bg-[#0f0d22]/90 border border-white/[0.06] rounded-2xl p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#15122e] transition-all">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-medium text-white leading-tight">Share your live location</h4>
                    <p className="text-[9px] font-normal text-slate-400 mt-0.5 leading-tight">Let others know you're safe.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[9px] font-normal">
                  <span>Just now</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              <div className="bg-[#0f0d22]/90 border border-white/[0.06] rounded-2xl p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#15122e] transition-all">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 font-bold text-[9px] shrink-0">
                    SOS
                  </div>
                  <div>
                    <h4 className="text-[11px] font-medium text-white leading-tight">Learn about SOS</h4>
                    <p className="text-[9px] font-normal text-slate-400 mt-0.5 leading-tight">Press & hold the SOS button in an emergency.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[9px] font-normal">
                  <span>Just now</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            </div>
          </section>

          {/* 5. QUICK ACTIONS */}
          <section className="pt-2 pb-6">
            <div className="flex justify-between items-center mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-xs">⚡</span>
                <h2 className="text-[12px] font-medium text-white tracking-tight">Quick Actions</h2>
              </div>
              <button className="text-[#a78bfa] hover:text-white text-[10px] font-normal flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer">
                <span>Customize</span> <Settings size={11} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-[#0f0d22]/90 border border-white/[0.06] hover:border-emerald-500/40 rounded-xl p-2 flex items-center gap-2 cursor-pointer active:scale-95 transition-all">
                <div className="w-7.5 h-7.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck size={15} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[10.5px] font-medium text-white leading-none">I'm Safe</span>
                  <span className="text-[8.5px] font-normal text-slate-400 mt-0.5 leading-none truncate">Notify Guardians</span>
                </div>
              </div>

              <div className="bg-[#0f0d22]/90 border border-white/[0.06] hover:border-blue-500/40 rounded-xl p-2 flex items-center gap-2 cursor-pointer active:scale-95 transition-all">
                <div className="w-7.5 h-7.5 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Car size={15} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[10.5px] font-medium text-white leading-none">Ride Safe</span>
                  <span className="text-[8.5px] font-normal text-slate-400 mt-0.5 leading-none truncate">Track My Ride</span>
                </div>
              </div>

              <div className="bg-[#0f0d22]/90 border border-white/[0.06] hover:border-purple-500/40 rounded-xl p-2 flex items-center gap-2 cursor-pointer active:scale-95 transition-all">
                <div className="w-7.5 h-7.5 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Phone size={15} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[10.5px] font-medium text-white leading-none">Fake Call</span>
                  <span className="text-[8.5px] font-normal text-slate-400 mt-0.5 leading-none truncate">Start Fake Call</span>
                </div>
              </div>

              <div className="bg-[#0f0d22]/90 border border-white/[0.06] hover:border-amber-500/40 rounded-xl p-2 flex items-center gap-2 cursor-pointer active:scale-95 transition-all">
                <div className="w-7.5 h-7.5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock size={15} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[10.5px] font-medium text-white leading-none">Safety Timer</span>
                  <span className="text-[8.5px] font-normal text-slate-400 mt-0.5 leading-none truncate">Set Timer</span>
                </div>
              </div>
            </div>
          </section>

        </main>

        <style dangerouslySetInnerHTML={{
          __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      </div>
    </div>
  );

  return (
    <>
      {overlayContent}
      {createPortal(
        <>
          {/* ADD FAMILY MEMBER MODAL/BOTTOM SHEET (UNIFIED 7-STEP FLOW) */}
          <AnimatePresence>
            {isAddMemberOpen && (
              <div className="fixed inset-0 z-[10005] flex items-end justify-center">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAddMemberOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                {/* Bottom Sheet Card */}
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="relative w-full max-w-md bg-gradient-to-b from-[#141226]/95 to-[#0a0816]/98 border-t border-white/[0.08] rounded-t-[32px] p-5 pb-8 shadow-[0_-15px_40px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.05)] z-10 flex flex-col font-sans text-slate-200 backdrop-blur-[24px]"
                >
                  {/* Drag Handle Indicator */}
                  <div className="w-12 h-1 bg-white/15 rounded-full mx-auto mb-5" />

                  {/* Close Button */}
                  <button
                    onClick={() => setIsAddMemberOpen(false)}
                    className="absolute top-4 right-5 w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer border border-white/[0.04]"
                  >
                    <X size={15} />
                  </button>

                  {/* STEP 1: Choose How to Add */}
                  {addStep === 1 && (
                    <div className="flex flex-col text-left">
                      <div className="mb-5">
                        <h2 className="text-[18px] font-bold text-white tracking-tight flex items-center gap-1.5">
                          Add Person <span className="w-1.5 h-1.5 rounded-full bg-[#7C4DFF] "></span>
                        </h2>
                        <p className="text-[11.5px] text-slate-400 mt-1">Choose how you want to add</p>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setAddForm({ ...addForm, name: 'Riya Sharma', phone: '+91 98765 43210' });
                            setAddStep(2);
                          }}
                          className="w-full bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.04] p-3.5 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-[#7C4DFF]/10 text-[#a78bfa] rounded-xl flex items-center justify-center shrink-0 border border-[#7C4DFF]/15">
                              <Users size={20} />
                            </div>
                            <div>
                              <h4 className="text-[13.5px] font-bold text-white leading-none">Add from Contacts</h4>
                              <p className="text-[10px] text-slate-400 mt-1.5 leading-none">Pick from phone contacts</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                        </button>

                        <button
                          onClick={() => setAddStep(2)}
                          className="w-full bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.04] p-3.5 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/15">
                              <UserPlus size={20} />
                            </div>
                            <div>
                              <h4 className="text-[13.5px] font-bold text-white leading-none">Enter Phone Number</h4>
                              <p className="text-[10px] text-slate-400 mt-1.5 leading-none">Add using phone number</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                        </button>

                        <button
                          onClick={() => {
                            setIsAddMemberOpen(false);
                            setPairingQrMode('scan');
                            setIsPairingQrOpen(true);
                          }}
                          className="w-full bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.04] p-3.5 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-[#00A3FF]/10 text-[#00A3FF] rounded-xl flex items-center justify-center shrink-0 border border-[#00A3FF]/15">
                              <QrCode size={20} />
                            </div>
                            <div>
                              <h4 className="text-[13px] font-bold text-white leading-none">Scan QR Code</h4>
                              <p className="text-[10px] text-slate-400 mt-1.5 leading-none">Scan their KAVACH QR</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                        </button>

                        <button
                          onClick={() => {
                            setIsAddMemberOpen(false);
                            setShowInviteOverlay(true);
                          }}
                          className="w-full bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.04] p-3.5 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center shrink-0 border border-purple-500/15">
                              <LinkIcon size={20} />
                            </div>
                            <div>
                              <h4 className="text-[13.5px] font-bold text-white leading-none">Share Invite Link</h4>
                              <p className="text-[10px] text-slate-400 mt-1.5 leading-none">Send invite link via apps</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      </div>
                    </div>
                  )}                  {/* STEP 2: Enter Details */}
                  {addStep === 2 && (
                    <div className="flex flex-col text-left">
                      <div className="mb-5">
                        <h2 className="text-[18px] font-bold text-white tracking-tight flex items-center gap-1.5">
                          Add Person <span className="w-1.5 h-1.5 rounded-full bg-[#7C4DFF] "></span>
                        </h2>
                        <p className="text-[11.5px] text-slate-400 mt-1">Enter details to send invite</p>
                      </div>
                      <div className="space-y-4.5">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider">Name</label>
                          <input
                            type="text"
                            value={addForm.name}
                            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                            placeholder="Riya Sharma"
                            className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-[#7C4DFF] focus:bg-[#121024]/50 focus:shadow-[0_0_15px_rgba(124,77,255,0.15)] rounded-xl px-3.5 py-2.5 text-[13.5px] text-white outline-none transition-all duration-300 placeholder:text-gray-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-semibold mb-1.5 uppercase tracking-wider">Phone Number</label>
                          <input
                            type="text"
                            value={addForm.phone}
                            onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-[#7C4DFF] focus:bg-[#121024]/50 focus:shadow-[0_0_15px_rgba(124,77,255,0.15)] rounded-xl px-3.5 py-2.5 text-[13.5px] text-white outline-none transition-all duration-300 placeholder:text-gray-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-semibold mb-2 uppercase tracking-wider">Relationship</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(addTargetCircle === 'family'
                              ? ['Mother', 'Father', 'Brother', 'Sister', 'Other']
                              : addTargetCircle === 'friends'
                                ? ['Friend', 'Other']
                                : ['Mother', 'Father', 'Brother', 'Sister', 'Friend', 'Other']
                            ).map((rel) => (
                              <button
                                key={rel}
                                onClick={() => setAddForm({ ...addForm, relationship: rel })}
                                className={`py-2.5 rounded-xl text-[12.5px] font-medium transition-all cursor-pointer border ${addForm.relationship === rel
                                    ? 'bg-gradient-to-r from-[#7C4DFF]/20 to-[#6035f5]/20 border-[#7C4DFF] text-white font-semibold shadow-[0_0_15px_rgba(124,77,255,0.25)]'
                                    : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.04]'
                                  }`}
                              >
                                {rel}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => setAddStep(3)}
                          disabled={!addForm.name || !addForm.phone}
                          className="w-full mt-3 bg-gradient-to-r from-[#7C4DFF] to-[#6035f5] hover:from-[#8c66ff] hover:to-[#6d45ff] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] py-3 rounded-xl text-[13.5px] font-bold text-white transition-all shadow-[0_4px_20px_rgba(124,77,255,0.35)] cursor-pointer text-center"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Checking on KAVACH */}
                  {addStep === 3 && (
                    <div className="flex flex-col items-center text-center py-5">
                      <h2 className="text-[18px] font-bold text-white tracking-tight mb-7">Checking...</h2>

                      {/* Pulsating Shield Orb Loader */}
                      <div className="relative w-28 h-28 flex items-center justify-center mb-9">
                        <div className="absolute inset-0 bg-[#7C4DFF]/10 blur-[25px] rounded-full "></div>
                        <div className="absolute w-26 h-26 border border-[#7C4DFF]/20 rounded-full animate-spin [animation-duration:4s]"></div>
                        <div className="absolute w-20 h-20 border border-dashed border-[#7C4DFF]/30 rounded-full animate-spin [animation-duration:8s] [animation-direction:reverse]"></div>
                        <div className="relative w-15 h-15 bg-gradient-to-b from-[#1c1836] to-[#0c0d1b] border border-[#7C4DFF]/40 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                          <Shield className="w-7 h-7 text-[#a78bfa] " />
                        </div>
                      </div>

                      {/* Checking Status Lines */}
                      <div className="w-full max-w-xs space-y-4 text-left px-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[12.5px] text-slate-300 font-medium">Verifying number</span>
                          {checkingProgress >= 1 ? (
                            <CheckCircle2 size={16} className="text-[#00FF88] fill-[#00FF88]/20 animate-scaleIn" />
                          ) : (
                            <span className="w-3.5 h-3.5 border border-white/10 rounded-full " />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12.5px] text-slate-300 font-medium">Checking on KAVACH</span>
                          {checkingProgress >= 2 ? (
                            <CheckCircle2 size={16} className="text-[#00FF88] fill-[#00FF88]/20 animate-scaleIn" />
                          ) : (
                            <span className="w-3.5 h-3.5 border border-white/10 rounded-full " />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12.5px] text-slate-300 font-medium">Checking connection</span>
                          {checkingProgress >= 3 ? (
                            <CheckCircle2 size={16} className="text-[#00FF88] fill-[#00FF88]/20 animate-scaleIn" />
                          ) : (
                            <span className="w-3.5 h-3.5 border border-white/10 rounded-full " />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4 & 5: Person Found / Not Found & Request */}
                  {addStep === 4 && (
                    <div className="flex flex-col text-left">
                      {isFoundOnKavach ? (
                        /* Found on KAVACH Flow */
                        <div className="space-y-4.5">
                          <div>
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-2">Found on KAVACH</span>
                            <div className="bg-[#0b1c15]/60 border border-emerald-500/25 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
                              <img
                                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop"
                                alt="Found User"
                                className="w-11 h-11 rounded-full object-cover border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                              />
                              <div>
                                <h4 className="text-[14.5px] font-bold text-white leading-none">{addForm.name || "Riya Sharma"}</h4>
                                <p className="text-[11px] text-emerald-400 mt-2 font-semibold flex items-center gap-1">
                                  is on KAVACH <CheckCircle2 size={12} className="fill-emerald-500/20 text-emerald-400" />
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
                            <h4 className="text-[13.5px] font-bold text-white mb-1.5">Send Protection Request</h4>
                            <p className="text-[11px] text-slate-400 font-normal leading-relaxed">They will receive a secure notification request to join your protection circle.</p>
                          </div>

                          <button
                            onClick={handleAddMemberAction}
                            className="w-full bg-gradient-to-r from-[#7C4DFF] to-[#6035f5] hover:from-[#8c66ff] hover:to-[#6d45ff] py-3 rounded-xl text-[13.5px] font-bold text-white transition-all shadow-[0_4px_20px_rgba(124,77,255,0.35)] cursor-pointer text-center"
                          >
                            Send Request
                          </button>
                        </div>
                      ) : (
                        /* Not Found Flow (Invite to KAVACH) */
                        <div className="space-y-4.5">
                          <div>
                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block mb-2">Not on KAVACH</span>
                            <div className="bg-[#1e150a]/60 border border-amber-500/25 rounded-2xl p-4 flex items-center gap-3.5 backdrop-blur-sm">
                              <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                                <User size={20} />
                              </div>
                              <div>
                                <h4 className="text-[14.5px] font-bold text-white leading-none">{addForm.name || "Riya Sharma"}</h4>
                                <p className="text-[11px] text-amber-500 mt-2 font-semibold">is not on KAVACH</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4">
                            <h4 className="text-[13.5px] font-bold text-white mb-1.5">Invite to Join KAVACH</h4>
                            <p className="text-[11px] text-slate-400 font-normal leading-relaxed">Invite them to install KAVACH securely and connect with your circle.</p>
                          </div>

                          <div className="space-y-2.5">
                            <button
                              onClick={handleAddMemberAction}
                              className="w-full bg-emerald-600/90 hover:bg-emerald-600 active:scale-[0.98] py-2.5 rounded-xl text-[12.5px] font-semibold text-white transition-all cursor-pointer text-center shadow-[0_3px_12px_rgba(16,185,129,0.2)]"
                            >
                              Invite via WhatsApp
                            </button>
                            <button
                              onClick={handleAddMemberAction}
                              className="w-full bg-[#00A3FF]/90 hover:bg-[#00A3FF] active:scale-[0.98] py-2.5 rounded-xl text-[12.5px] font-semibold text-white transition-all cursor-pointer text-center shadow-[0_3px_12px_rgba(0,163,255,0.2)]"
                            >
                              Invite via SMS
                            </button>
                            <button
                              onClick={handleAddMemberAction}
                              className="w-full bg-white/[0.02] border border-white/10 hover:bg-white/[0.06] active:scale-[0.98] py-2.5 rounded-xl text-[12.5px] font-semibold text-white transition-all cursor-pointer text-center"
                            >
                              Share Invite Link
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 6: Request Sent */}
                  {addStep === 5 && (
                    <div className="flex flex-col items-center text-center py-5">
                      {/* Success Check Circle */}
                      <div className="relative w-18 h-18 bg-[#00FF88]/10 rounded-full flex items-center justify-center mb-6 border border-[#00FF88]/20 shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                        <CheckCircle2 size={36} className="text-[#00FF88] fill-[#00FF88]/10 animate-scaleIn" />
                      </div>

                      <h2 className="text-[19px] font-bold text-white tracking-tight">Request Sent!</h2>
                      <p className="text-[12px] text-slate-400 mt-2 max-w-xs leading-relaxed font-normal">
                        {addForm.name || "Riya"} will get your request and can accept anytime.
                      </p>

                      <div className="w-full mt-7 space-y-3">
                        <button
                          onClick={() => setAddStep(1)}
                          className="w-full bg-gradient-to-r from-[#7C4DFF] to-[#6035f5] hover:from-[#8c66ff] hover:to-[#6d45ff] py-3 rounded-xl text-[13.5px] font-bold text-white transition-all shadow-[0_4px_20px_rgba(124,77,255,0.35)] cursor-pointer"
                        >
                          Add Another Person
                        </button>
                        <button
                          onClick={() => setIsAddMemberOpen(false)}
                          className="w-full bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 py-3 rounded-xl text-[13.5px] font-bold text-white transition-all cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isPairingQrOpen && (
              <QuickPairQr mode={pairingQrMode} onClose={() => setIsPairingQrOpen(false)} currentUserProfile={profile} />
            )}
          </AnimatePresence>
        </>,
        document.body
      )}

      {/* SHARE INVITE LINK FULL-SCREEN OVERLAY */}
      {showInviteOverlay && createPortal(
        <div className="fixed inset-0 z-[10010] bg-black text-slate-200 font-sans overflow-y-auto">
          <div className="flex justify-center min-h-full">
            <div className="w-full max-w-[480px] flex flex-col gap-6 px-4 pt-4 pb-10">
              <div className="flex items-center justify-between py-2">
                <button
                  onClick={() => setShowInviteOverlay(false)}
                  className="w-10 h-10 rounded-full bg-[#090B1F] border border-[#232A56] flex items-center justify-center cursor-pointer hover:bg-[#090B1F]/80 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
                <h1 className="text-[17px] font-bold text-white tracking-wide">Share Invite Link</h1>
                <div className="w-10 h-10"></div>
              </div>

              <div className="flex flex-col items-center justify-center py-6 relative">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#7C4DFF]/10 blur-[30px] rounded-full"></div>
                  <div className="relative w-36 h-36 bg-gradient-to-b from-[#101633] to-[#141A3A] border border-[#7C4DFF]/20 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="w-24 h-24 bg-[#141A3A] border border-[#7C4DFF]/35 rounded-full flex items-center justify-center relative">
                      <Shield className="w-12 h-12 text-[#7C4DFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </Shield>
                    </div>
                  </div>
                </div>
                <h2 className="text-white text-[17px] font-bold text-center mt-6 max-w-[280px] leading-tight">
                  Invite your family to join your safety circle
                </h2>
              </div>

              <div className="bg-[#101633] border border-[#232A56] rounded-[24px] overflow-hidden p-1.5 flex flex-col gap-1">
                <div
                  onClick={() => {
                    const url = `${window.location.origin}/invite?ref=${auth.currentUser?.uid || 'user'}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Join my safety circle on Kavach: ' + url)}`);
                  }}
                  className="flex items-center justify-between p-3.5 hover:bg-white/[0.03] rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#10b981]/15 border border-[#10b981]/25 flex items-center justify-center">
                      <svg className="w-5 h-5" style={{ fill: '#10b981' }} viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.16 1.448 4.75 1.45 5.536.002 10.04-4.5 10.044-10.04.002-2.684-1.04-5.207-2.93-7.098C16.564 1.575 14.04 1.53 11.35 1.53c-5.536 0-10.037 4.5-10.04 10.043-.001 1.765.485 3.36 1.455 4.887l-.95 3.473 3.567-.935zm12.33-6.23c-.33-.165-1.95-.963-2.25-1.074-.3-.11-.52-.165-.74.165-.22.33-.85 1.074-1.04 1.29-.19.22-.385.247-.715.082-1.815-.91-2.98-1.51-4.04-3.33-.11-.2-.22-.38-.2-.55.19-.22.38-.44.57-.66.19-.22.25-.385.385-.66.13-.275.06-.52-.03-.685-.09-.165-.74-1.785-1.01-2.44-.27-.648-.54-.56-.74-.57-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.41-.3.33-1.15 1.127-1.15 2.75 0 1.62 1.18 3.19 1.35 3.41.17.22 2.33 3.56 5.65 4.99.79.34 1.4.54 1.88.7.792.25 1.51.21 2.08.13.63-.09 1.95-.8 2.22-1.57.27-.77.27-1.43.19-1.57-.08-.14-.3-.22-.63-.385z" />
                      </svg>
                    </div>
                    <span className="text-[14.5px] font-semibold text-white">WhatsApp</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
                <div className="h-px bg-white/5 mx-3.5" />

                <div
                  onClick={() => {
                    const url = `${window.location.origin}/invite?ref=${auth.currentUser?.uid || 'user'}`;
                    window.open(`sms:?&body=${encodeURIComponent('Join my safety circle on Kavach: ' + url)}`);
                  }}
                  className="flex items-center justify-between p-3.5 hover:bg-white/[0.03] rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#10b981]/15 border border-[#10b981]/25 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <span className="text-[14.5px] font-semibold text-white">SMS</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
                <div className="h-px bg-white/5 mx-3.5" />

                <div
                  onClick={() => {
                    const url = `${window.location.origin}/invite?ref=${auth.currentUser?.uid || 'user'}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Invite link copied to clipboard!');
                  }}
                  className="flex items-center justify-between p-3.5 hover:bg-white/[0.03] rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </div>
                    <span className="text-[14.5px] font-semibold text-white">Copy Link</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ---------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------

function Avatar({ img, name, status, statusColor, isYou, badge = 'dot' }: { img: string; name: string; status: string; statusColor: string; isYou?: boolean; badge?: string }) {
  const colorMap: Record<string, string> = {
    green: 'text-[#00FF88] bg-[#00FF88]',
    blue: 'text-[#00A3FF] bg-[#00A3FF]',
    gray: 'text-gray-400 bg-gray-400',
  };

  const textColor = colorMap[statusColor].split(' ')[0];
  const bgColor = colorMap[statusColor].split(' ')[1];

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0 min-w-[50px] cursor-pointer group">
      <div className="relative">
        {/* Avatar Image */}
        <div className={`w-[40px] h-[40px] rounded-full overflow-hidden p-[1px] bg-[#2a2736] ${isYou ? 'ring-2 ring-[#00FF88] ring-offset-[2px] ring-offset-[#0e0a1b]' : ''}`}>
          <img src={img} alt={name} className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300" />
        </div>

        {/* Badge Overlay */}
        {badge === 'dot' ? (
          <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${bgColor} border-[1px] border-[#100d1a]`} />
        ) : (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#091510] flex items-center justify-center border border-[#00FF88]/30">
            <ShieldCheck size={8} className="text-[#00FF88] fill-[#00FF88]" />
          </div>
        )}
      </div>

      {/* Text Info */}
      <div className="text-center">
        <span className="block text-[10.5px] font-normal text-white mb-0.5">{name}</span>
        <span className={`block text-[8.5px] font-normal ${textColor}`}>{status}</span>
      </div>
    </div>
  );
}

function AddAvatarButton({ type, borderColor, hoverColor, title = "Add", onClick }: { type: string; borderColor: string; hoverColor: string; title?: string; onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[50px] cursor-pointer group pt-1">
      <div className={`w-[40px] h-[40px] rounded-full border-[1.5px] border-dashed ${borderColor} bg-white/[0.02] flex items-center justify-center transition-all ${hoverColor}`}>
        <Plus size={14} className="text-gray-500 group-hover:text-white transition-colors" />
      </div>
      <div className="text-center">
        <span className="block text-[10.5px] font-normal text-gray-400 group-hover:text-gray-300 transition-colors mb-0.5">{title}</span>
        <span className="block text-[8.5px] font-normal text-gray-500">{type}</span>
      </div>
    </div>
  );
}

function ActivityItem({ icon, iconBg, title, subtitle, time }: { icon: React.ReactNode; iconBg: string; title: string; subtitle: string; time: string }) {
  return (
    <div className="flex items-center justify-between group cursor-pointer hover:bg-white/[0.03] p-2.5 rounded-xl transition-all border border-transparent hover:border-white/5 min-h-[66px]">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${iconBg}`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
        </div>
        <div className="text-left">
          <h4 className="text-[13.5px] font-semibold text-white leading-tight">{title}</h4>
          <p className="text-[11px] text-gray-400 mt-1 leading-none">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] font-medium text-gray-500">{time}</span>
        <ChevronRight size={13} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}
