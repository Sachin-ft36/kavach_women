import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, QrCode, Link as LinkIcon, Keyboard, ArrowLeft, Check, ArrowRight,
  Heart, User, Users, Home, Baby, PersonStanding, MinusCircle, Plus, Lock, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useKavachStore } from '../../state/useKavachStore';
import { KavachSafe } from '../../services/KavachNative';

interface AddMemberBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConnectMethod: (method: 'scan' | 'generate' | 'link' | 'manual', selectedRelationships: string[]) => void;
}

interface MemberDetail {
  relationship: string;
  phone: string;
  bgColor: string;
  icon: React.ComponentType;
  status: 'pending' | 'checking' | 'found' | 'not_found' | 'sending' | 'sent';
  uid?: string;
  name?: string;
}

// Custom top-level components to match the image's avatars closely and ensure stable React resolution
function MotherIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
      <path d="M21 22c0-4.41-3.59-8-8-8H11c-4.41 0-8 3.59-8 8"/>
      <circle cx="12" cy="14" r="2" />
    </svg>
  );
}

function FatherIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
      <path d="M20 22c0-4.41-3.59-8-8-8h-4c-4.41 0-8 3.59-8 8"/>
      <path d="M9 14h6" />
    </svg>
  );
}

function BrotherIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
      <path d="M19 21c0-3.86-3.14-7-7-7h-4c-3.86 0-7 3.14-7 7"/>
    </svg>
  );
}

function SisterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
      <path d="M21 22c0-4.41-3.59-8-8-8H11c-4.41 0-8 3.59-8 8"/>
      <path d="M10 12h4" />
    </svg>
  );
}

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366] shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const RELATIONSHIPS = [
  {
    id: "Mother",
    label: "Mother",
    icon: Heart,
    color: "#A855F7",
  },
  {
    id: "Father",
    label: "Father",
    icon: User,
    color: "#3B82F6",
  },
  {
    id: "Brother",
    label: "Brother",
    icon: Users,
    color: "#10B981",
  },
  {
    id: "Sister",
    label: "Sister",
    icon: Users,
    color: "#EC4899",
  },
  {
    id: "Spouse",
    label: "Spouse",
    icon: Heart,
    color: "#EF4444",
  },
  {
    id: "Friend",
    label: "Friend",
    icon: Users,
    color: "#F59E0B",
  },
  {
    id: "Roommate",
    label: "Roommate",
    icon: Home,
    color: "#06B6D4",
  },
  {
    id: "Other",
    label: "Other",
    icon: PersonStanding,
    color: "#6B7280",
  },
];

const REL_CONFIG: Record<string, { bgColor: string; icon: React.ComponentType; phone: string }> = {
  Mother: { bgColor: 'bg-[#4C2E8A]', icon: MotherIcon, phone: '' },
  Father: { bgColor: 'bg-[#293F76]', icon: FatherIcon, phone: '' },
  Brother: { bgColor: 'bg-[#1D513F]', icon: BrotherIcon, phone: '' },
  Sister: { bgColor: 'bg-[#6F2648]', icon: SisterIcon, phone: '' },
  Spouse: { bgColor: 'bg-[#6F1D1D]', icon: MotherIcon, phone: '' },
  Friend: { bgColor: 'bg-[#5F4613]', icon: BrotherIcon, phone: '' },
  Roommate: { bgColor: 'bg-[#175E6D]', icon: BrotherIcon, phone: '' },
  Other: { bgColor: 'bg-[#3A4368]', icon: BrotherIcon, phone: '' }
};

export default function AddMemberBottomSheet({
  isOpen,
  onClose,
  onSelectConnectMethod
}: AddMemberBottomSheetProps) {
  const [step, setStep] = useState<'relationship' | 'details' | 'verification' | 'results' | 'sending' | 'connect'>('relationship');
  const [selectedRelations, setSelectedRelations] = useState<string[]>([]);
  const [memberDetails, setMemberDetails] = useState<MemberDetail[]>([]);
  
  // Get active profile for Firebase Firestore pairing request writes
  const { profile } = useKavachStore();

  // Verification states
  const [verifyingIndex, setVerifyingIndex] = useState<number>(-1);
  const [isVerifyingComplete, setIsVerifyingComplete] = useState<boolean>(false);

  // Sending/Invitation states
  const [sendingIndex, setSendingIndex] = useState<number>(-1);
  const [isSendingComplete, setIsSendingComplete] = useState<boolean>(false);

  const toggleRelationship = (id: string) => {
    setSelectedRelations(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selectedRelations.length === 0) {
      toast.error('Please select at least one relationship.');
      return;
    }
    
    // Initialize details from configurations
    const initialDetails = selectedRelations.map(rel => {
      const conf = REL_CONFIG[rel] || REL_CONFIG.Other;
      return { 
        relationship: rel, 
        phone: conf.phone, 
        bgColor: conf.bgColor,
        icon: conf.icon,
        status: 'pending' as const
      };
    });

    setMemberDetails(initialDetails);
    setStep('details');
  };

  const handleContinue = () => {
    // Validate that all phone numbers are valid 10-digit Indian mobile numbers starting with 6, 7, 8, or 9
    const indianMobileRegex = /^[6-9]\d{9}$/;
    const hasInvalid = memberDetails.some(m => !indianMobileRegex.test(m.phone));
    if (hasInvalid) {
      toast.error('Please enter a valid mobile number.');
      return;
    }
    
    // Move to Verification Simulation
    setStep('verification');
    setVerifyingIndex(0);
    setIsVerifyingComplete(false);
  };

  // Run Smart Verification Live Database Check
  useEffect(() => {
    if (step !== 'verification' || verifyingIndex < 0 || verifyingIndex >= memberDetails.length) {
      if (verifyingIndex >= memberDetails.length && memberDetails.length > 0) {
        setIsVerifyingComplete(true);
      }
      return;
    }

    // Set current verifying status to checking
    setMemberDetails(prev => {
      const copy = [...prev];
      copy[verifyingIndex].status = 'checking';
      return copy;
    });

    const verifyDatabaseUser = async () => {
      const current = memberDetails[verifyingIndex];
      const cleanPhone = current.phone.replace(/\D/g, '').slice(-10);
      let isFound = false;
      let foundUid = '';
      let foundName = '';

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, metadata')
          .or(`metadata->>phone.ilike.%${cleanPhone}%,metadata->>phoneNumber.ilike.%${cleanPhone}%`);

        if (data && data.length > 0 && !error) {
          isFound = true;
          foundUid = data[0].id;
          foundName = data[0].metadata?.name || data[0].name || current.relationship;
        }
      } catch (err) {
        console.warn('Smart Verification error:', err);
      }

      setMemberDetails(prev => {
        const copy = [...prev];
        const item = copy[verifyingIndex];
        if (item) {
          item.status = isFound ? 'found' : 'not_found';
          item.uid = foundUid;
          item.name = foundName;
        }
        return copy;
      });

      setVerifyingIndex(prev => prev + 1);
    };

    const timer = setTimeout(() => {
      verifyDatabaseUser();
    }, 700);

    return () => clearTimeout(timer);
  }, [step, verifyingIndex, memberDetails.length]);

  const handleProceedToConnect = () => {
    // Go to step 4: Review & Continue (Results)
    setStep('results');
  };

  const handleSendAllInvitations = () => {
    // Transition to Step 5: Sending Screen
    setStep('sending');
    setSendingIndex(0);
    setIsSendingComplete(false);
  };

  // Live Database Writing and Native SMS Auto-dispatch Loop for Step 5
  useEffect(() => {
    if (step !== 'sending' || sendingIndex < 0 || sendingIndex >= memberDetails.length) {
      if (sendingIndex >= memberDetails.length && memberDetails.length > 0) {
        setIsSendingComplete(true);
      }
      return;
    }

    const current = memberDetails[sendingIndex];

    // Set current item to sending state
    setMemberDetails(prev => {
      const copy = [...prev];
      copy[sendingIndex].status = 'sending';
      return copy;
    });

    const sendActualInvitation = async () => {
      const inviteMsg = `Hi ${current.relationship}! 👋\nI'm using KAVACH to stay safe and connected with my family and friends. Please install KAVACH and accept my request to become my Guardian.\n\nInstall Now: kavach.app/invite/AB12CD`;
      const senderProfile = useKavachStore.getState().profile;
      const senderId = (senderProfile as any)?.uid || (senderProfile as any)?.id || '';

      if (current.uid && senderId) {
        try {
          console.log(`[FIREBASE] Sending pairing request to Kavach user: ${current.relationship} (UID: ${current.uid})`);
          await addDoc(collection(db, 'pairing_requests'), {
            senderId,
            senderName: senderProfile.name || senderProfile.displayName || 'User',
            senderPhone: senderProfile.phoneNumber || senderProfile.phone || '',
            senderPhoto: senderProfile.photoURL || senderProfile.photoUrl || '',
            receiverId: current.uid,
            receiverName: current.name || current.relationship,
            receiverPhone: current.phone,
            status: 'pending',
            timestamp: serverTimestamp(),
            relationship: current.relationship,
            isKavachUser: true
          });
          console.log(`[FIREBASE] Pairing request written for: ${current.relationship}`);
        } catch (dbErr) {
          console.error('Failed to write pairing request:', dbErr);
        }
      } else {
        // ── NON-KAVACH USER ── Still write Firestore record for Sent tracking + trigger WhatsApp
        if (senderId) {
          try {
            await addDoc(collection(db, 'pairing_requests'), {
              senderId,
              senderName: senderProfile.name || senderProfile.displayName || 'User',
              senderPhone: senderProfile.phoneNumber || senderProfile.phone || '',
              senderPhoto: senderProfile.photoURL || senderProfile.photoUrl || '',
              receiverId: null,
              receiverName: current.relationship,
              receiverPhone: `+91${current.phone}`,
              status: 'invited',
              timestamp: serverTimestamp(),
              relationship: current.relationship,
              isKavachUser: false
            });
          } catch (dbErr) {
            console.error('Failed to write non-Kavach invite record:', dbErr);
          }
        }

        // Open WhatsApp link
        try {
          console.log(`[WHATSAPP REDIRECT] Opening WhatsApp for: ${current.relationship} (+91${current.phone})`);
          const waUrl = `https://wa.me/91${current.phone}?text=${encodeURIComponent(inviteMsg)}`;
          
          try {
            KavachSafe.broadcastEmergencySMS({
              numbers: [current.phone],
              message: inviteMsg
            }).catch(() => {});
          } catch (smsErr) {
            console.warn('Background SMS backup trigger failed:', smsErr);
          }

          const newWindow = window.open(waUrl, '_blank');
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            toast.info(`Pop-up blocked! Click here to invite ${current.relationship} via WhatsApp`, {
              action: {
                label: 'Open WhatsApp',
                onClick: () => window.open(waUrl, '_blank')
              },
              duration: 10000
            });
          }
        } catch (waErr) {
          console.warn('Auto-WhatsApp redirect blocked by browser:', waErr);
        }
      }

      // Mark as fully sent
      setMemberDetails(prev => {
        const copy = [...prev];
        copy[sendingIndex].status = 'sent';
        return copy;
      });

      setSendingIndex(prev => prev + 1);
    };

    // Trigger after a short delay
    const timer = setTimeout(() => {
      sendActualInvitation();
    }, 1200);

    return () => clearTimeout(timer);
  }, [step, sendingIndex, memberDetails.length, profile]);


  const handleIndividualInvite = (member: MemberDetail) => {
    const inviteMsg = `Hi ${member.relationship}! 👋\nI'm using KAVACH to stay safe and connected with my family and friends. Please install KAVACH and accept my request to become my Guardian.\n\nInstall Now: kavach.app/invite/AB12CD`;
    console.log(`[MANUAL WHATSAPP] Triggering manual WhatsApp invite link for: ${member.relationship} (+91${member.phone})`);
    window.open(`https://wa.me/91${member.phone}?text=${encodeURIComponent(inviteMsg)}`, '_blank');
    toast.success(`Opening WhatsApp to invite ${member.relationship}.`);
  };

  const handleShareInvite = () => {
    const inviteMsg = `Hi Family! 👋\nI'm using KAVACH to stay safe and connected with my family and friends. Please install KAVACH and accept my request to become my Guardian.\n\nInstall Now: kavach.app/invite/AB12CD`;
    console.log(`[SHARE LINK] Copying/sharing invite link text: ${inviteMsg}`);
    if (navigator.share) {
      navigator.share({
        title: 'Kavach Safety Grid Invite',
        text: inviteMsg,
        url: 'https://kavach.app/invite/AB12CD'
      }).then(() => {
        toast.success('Invite link shared successfully!');
      }).catch((err) => {
        console.warn('Share failed:', err);
      });
    } else {
      navigator.clipboard.writeText(inviteMsg);
      toast.success('Invite link copied to clipboard!');
    }
    onSelectConnectMethod('link', selectedRelations);
  };

  const handleBack = () => {
    if (step === 'results') {
      setStep('verification');
    } else if (step === 'connect') {
      setStep('results');
    } else if (step === 'verification') {
      setStep('details');
    } else if (step === 'details') {
      setStep('relationship');
    }
  };

  const updateDetailField = (index: number, field: keyof MemberDetail, value: string) => {
    setMemberDetails(prev => {
      const copy = [...prev];
      let val = value;
      if (field === 'phone') {
        // Restrict to digits only and limit to 10 digits
        val = value.replace(/\D/g, '').slice(0, 10);
      }
      copy[index] = { ...copy[index], [field]: val } as any;
      return copy;
    });
  };

  const removeDetailRow = (index: number) => {
    setMemberDetails(prev => prev.filter((_, i) => i !== index));
  };

  const addAnotherRow = () => {
    setMemberDetails(prev => [
      ...prev, 
      { relationship: 'Other', phone: '', bgColor: 'bg-[#3A4368]', icon: BrotherIcon, status: 'pending' }
    ]);
  };

  if (!isOpen) return null;

  const foundMembers = memberDetails.filter(m => m.status === 'found' || (step === 'sending' && ['found', 'sent', 'sending'].includes(m.status)));
  const notFoundMembers = memberDetails.filter(m => m.status === 'not_found' || (step === 'sending' && ['not_found', 'sent', 'sending'].includes(m.status)));

  const realKavachUsers = memberDetails.filter(m => m.uid);
  const notOnKavachUsers = memberDetails.filter(m => !m.uid);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9500] bg-black/70 backdrop-blur-sm"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[9600] flex justify-center pointer-events-none"
      >
        {/* Fixed height h-[650px] to prevent size jumping when shifting steps & move it higher */}
        <div className="w-full max-w-md h-[650px] bg-[#0C1020] border-t border-[#2B315F] rounded-t-[32px] px-5 pt-3 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,.55)] flex flex-col pointer-events-auto overflow-hidden select-none">
          {/* Drag Handle */}
          <div className="w-12 h-1 bg-[#2B315F]/60 rounded-full mx-auto mb-4 shrink-0" />

          {/* Close / Back header buttons */}
          <div className="flex items-center justify-between mb-4 w-full h-8 px-1 shrink-0">
            {step !== 'relationship' && (step !== 'sending' || !isSendingComplete) ? (
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors border border-white/5"
              >
                <ArrowLeft size={18} className="text-white" strokeWidth={2.5} />
              </button>
            ) : (
              <div className="w-8 h-8" />
            )}
            
            <h1 className="text-white text-[17px] font-semibold text-center tracking-wide font-display">
              {step === 'relationship' && 'Add Family Members'}
              {step === 'details' && 'Add Details'}
              {step === 'verification' && 'Verifying Members'}
              {step === 'results' && 'Review & Continue'}
              {step === 'sending' && (isSendingComplete ? 'Invitations Complete' : 'Sending Invitations')}
              {step === 'connect' && 'Add Family Member'}
            </h1>

            {step !== 'sending' || !isSendingComplete ? (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors border border-white/5"
              >
                <X size={16} className="text-gray-300" />
              </button>
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0 relative">
            <AnimatePresence mode="wait">
              {step === 'relationship' && (
                <motion.div
                  key="relationship"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col text-left w-full h-full"
                >
                  {/* Subtitles */}
                  <div className="mb-5 pl-1 shrink-0">
                    <h2 className="text-gray-100 text-[16px] font-semibold tracking-wide">Select relationship(s)</h2>
                    <p className="text-[#848896] text-[13.5px] mt-1 font-medium">You can select multiple</p>
                  </div>

                  {/* List Container - flex-1 to take all available space inside the fixed height */}
                  <div className="bg-[#131A31] rounded-3xl py-1 mb-5 flex-1 overflow-y-auto hide-scrollbar">
                    {RELATIONSHIPS.map((rel, index) => {
                      const isChecked = selectedRelations.includes(rel.id);
                      const isLast = index === RELATIONSHIPS.length - 1;
                      const RelIcon = rel.icon;

                      return (
                        <div
                          key={rel.id}
                          onClick={() => toggleRelationship(rel.id)}
                          className={`flex items-center justify-between px-5 py-[14px] cursor-pointer active:bg-white/5 transition-colors ${
                            !isLast ? 'border-b border-[#2B315F]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Styled icon container matching the specified color */}
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                              style={{ 
                                backgroundColor: `${rel.color}15`, 
                                borderColor: `${rel.color}30` 
                              }}
                            >
                              <RelIcon size={18} style={{ color: rel.color }} />
                            </div>
                            <span className="text-[#F3F4F6] text-[15.5px] font-medium tracking-wide">{rel.label}</span>
                          </div>

                          {/* Custom Checkbox */}
                          <div className={`w-6 h-6 rounded-[7px] flex items-center justify-center transition-all duration-200 ${
                            isChecked
                              ? 'bg-[#7C4DFF] border-none'
                              : 'border-[2px] border-[#2B315F] bg-transparent'
                          }`}>
                            {isChecked && <Check size={16} className="text-white" strokeWidth={3.5} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={handleNext}
                    className="w-full bg-[#7C4DFF] hover:bg-[#6c3df0] active:scale-[0.98] transition-all text-white text-[16px] font-semibold py-[18px] rounded-[18px] flex items-center justify-center shadow-[0_4px_20px_rgba(124,77,255,0.3)] cursor-pointer border-none shrink-0"
                  >
                    <span className="ml-2 font-display">Next</span>
                    <ArrowRight size={20} className="ml-2" strokeWidth={2.5} />
                  </button>
                </motion.div>
              )}

              {step === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col text-left w-full h-full"
                >
                  {/* Table Headers */}
                  <div className="grid grid-cols-[115px_1fr_30px] gap-3 px-4 mb-2.5 font-sans shrink-0">
                    <span className="text-[11px] font-bold text-[#6B728E] tracking-widest uppercase">Relationship</span>
                    <span className="text-[11px] font-bold text-[#6B728E] tracking-widest uppercase">Phone Number</span>
                    <span className="w-[30px]" />
                  </div>

                  {/* List Container - Tabular format with custom Avatars & BGColors */}
                  <div className="bg-[#151A2E] border border-[#2A3152] rounded-2xl divide-y divide-[#2A3152] mb-4 flex-1 overflow-y-auto hide-scrollbar">
                    {memberDetails.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-[13px] font-medium">No members added yet.</div>
                    ) : (
                      memberDetails.map((member, index) => {
                        const Icon = member.icon;
                        return (
                          <div key={index} className="flex items-center gap-3 p-3.5 font-sans">
                            {/* Avatar & Relationship */}
                            <div className="flex items-center gap-3 w-[115px] shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${member.bgColor}`}>
                                <Icon />
                              </div>
                              <span className="text-[14.5px] font-bold text-white tracking-wide truncate">
                                {member.relationship}
                              </span>
                            </div>

                            {/* Phone Number Input with +91 prefix */}
                            <div className="flex-1 flex items-center bg-[#0A0D1A] border border-[#2A3152] rounded-[14px] px-3.5 py-2.5 focus-within:border-[#7C4DFF] transition-colors">
                              <span className="text-[14px] font-bold text-[#9C75FF] mr-2 select-none shrink-0">+91</span>
                              <input
                                type="tel"
                                value={member.phone}
                                onChange={(e) => updateDetailField(index, 'phone', e.target.value)}
                                placeholder="Phone Number"
                                className="w-full bg-transparent text-[14px] font-semibold text-white placeholder-gray-655 focus:outline-none"
                              />
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeDetailRow(index)}
                              className="text-[#E53E3E] hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer shrink-0 ml-1 bg-transparent border-none"
                            >
                              <MinusCircle size={22} strokeWidth={2} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Another Button */}
                  <button
                    onClick={addAnotherRow}
                    className="w-full mb-4 py-[18px] bg-transparent border border-dashed border-[#2A3152] hover:border-[#7C4DFF]/60 text-[#9C75FF] hover:text-[#B292FF] font-bold text-[14px] rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Add Another</span>
                  </button>

                  {/* Continue Button */}
                  <button
                    onClick={handleContinue}
                    className="w-full bg-[#7C4DFF] hover:bg-[#6c3df0] active:scale-[0.98] transition-all text-white text-[16px] font-semibold py-[18px] rounded-[18px] flex items-center justify-center shadow-[0_4px_20px_rgba(124,77,255,0.3)] cursor-pointer border-none shrink-0"
                  >
                    <span className="ml-2 font-display">Continue</span>
                    <ArrowRight size={20} className="ml-2" strokeWidth={2.5} />
                  </button>

                  {/* Security Note */}
                  <div className="flex items-center justify-center gap-1.5 mt-4 shrink-0">
                    <Lock size={12} className="text-[#6B728E]" />
                    <span className="text-[#6B728E] text-[12px] font-medium">Your information is 100% secure and private</span>
                  </div>
                </motion.div>
              )}

              {step === 'verification' && (
                <motion.div
                  key="verification"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col text-left w-full h-full font-sans"
                >
                  {/* Shield with Magnifying Glass Logo */}
                  <div className="relative w-20 h-20 mx-auto mt-2 mb-4 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 text-[#7C4DFF] flex items-center justify-center">
                      <svg className="w-full h-full drop-shadow-[0_8px_16px_rgba(124,77,255,0.25)]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                      </svg>
                    </div>
                    <div className="absolute z-10 text-white font-extrabold text-[22px] tracking-tighter">
                      C
                    </div>
                    <div className="absolute -bottom-1 -right-1 z-20 bg-[#0C1020] p-1.5 rounded-full border border-[#2B315F]">
                      <svg className="w-5.5 h-5.5 text-[#9C75FF] " fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </div>
                  </div>

                  <div className="text-center mb-6 pl-1 shrink-0">
                    <h2 className="text-gray-100 text-[16px] font-semibold tracking-wide">Please wait while we verify</h2>
                    <p className="text-[#848896] text-[13.5px] mt-1 font-medium">member numbers...</p>
                  </div>

                  {/* Verification Rows */}
                  <div className="bg-[#131A31] border border-[#2B315F] rounded-2xl divide-y divide-[#2B315F] mb-5 flex-1 overflow-y-auto hide-scrollbar">
                    {memberDetails.map((member, index) => {
                      const Icon = member.icon;
                      return (
                        <div key={index} className="flex items-center justify-between p-4 transition-all">
                          {/* Member info */}
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${member.bgColor}`}>
                              <Icon />
                            </div>
                            <span className="text-[14.5px] font-bold text-white tracking-wide truncate">
                              {member.relationship}
                            </span>
                          </div>

                          {/* Verification status label */}
                          <div className="flex items-center gap-2">
                            {member.status === 'pending' && (
                              <span className="text-gray-500 text-[12.5px] font-bold uppercase tracking-wider">Pending</span>
                            )}
                            {member.status === 'checking' && (
                              <div className="flex items-center gap-2">
                                <span className="text-[#9C75FF] text-[12.5px] font-bold ">Checking...</span>
                                <div className="w-2 h-2 rounded-full bg-[#9C75FF] " />
                              </div>
                            )}
                            {member.status === 'found' && (
                              <div className="flex items-center gap-2">
                                <span className="text-[#00D26A] text-[13px] font-bold font-sans">Found on KAVACH</span>
                                <div className="w-5 h-5 rounded-full bg-[#00D26A]/10 border border-[#00D26A]/20 flex items-center justify-center">
                                  <Check size={12} className="text-[#00D26A]" strokeWidth={3.5} />
                                </div>
                              </div>
                            )}
                            {member.status === 'not_found' && (
                              <div className="flex items-center gap-2">
                                <span className="text-[#F59E0B] text-[13px] font-bold font-sans">Not on KAVACH</span>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Bar & Counter */}
                  <div className="flex flex-col gap-2.5 mb-5 px-1 shrink-0">
                    <div className="w-full bg-[#131A31] h-2 rounded-full overflow-hidden border border-[#2B315F]">
                      <div 
                        className="bg-[#7C4DFF] h-full transition-all duration-300 rounded-full"
                        style={{ 
                          width: `${(memberDetails.filter(m => m.status === 'found' || m.status === 'not_found').length / memberDetails.length) * 100}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[12px] font-bold text-gray-500 uppercase tracking-widest pl-0.5">
                      <span>Verification Progress</span>
                      <span>
                        Verifying {memberDetails.filter(m => m.status === 'found' || m.status === 'not_found').length} of {memberDetails.length}
                      </span>
                    </div>
                  </div>

                  {/* Action Button once complete */}
                  <button
                    disabled={!isVerifyingComplete}
                    onClick={handleProceedToConnect}
                    className={`w-full py-[18px] rounded-[18px] flex items-center justify-center font-semibold text-[16px] transition-all border-none shrink-0 ${
                      isVerifyingComplete 
                        ? 'bg-[#7C4DFF] hover:bg-[#6c3df0] text-white cursor-pointer active:scale-[0.98] shadow-[0_4px_20px_rgba(124,77,255,0.3)]' 
                        : 'bg-[#131A31] text-gray-600 border border-[#2B315F] cursor-not-allowed'
                    }`}
                  >
                    <span className="ml-2 font-display">
                      {isVerifyingComplete ? 'Proceed to Connect' : 'Verifying Members...'}
                    </span>
                    <ArrowRight size={20} className="ml-2" strokeWidth={2.5} />
                  </button>
                </motion.div>
              )}

              {step === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col text-left w-full h-full font-sans"
                >
                  {/* Results Container - flex-1 and scrollable */}
                  <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-4 mb-4">
                    {/* Already on KAVACH Container */}
                    {memberDetails.filter(m => m.status === 'found').length > 0 && (
                      <div className="bg-[#0A2E20]/20 border border-[#10B981]/20 rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#10B981]/15 border border-[#10B981]/25 flex items-center justify-center">
                            <Users size={16} className="text-[#10B981]" />
                          </div>
                          <div>
                            <h3 className="text-[14px] font-bold text-white leading-none">Already on KAVACH ({memberDetails.filter(m => m.status === 'found').length})</h3>
                            <p className="text-[#8B93A6] text-[11px] mt-1.5 font-medium leading-none font-sans">They will receive a request in-app</p>
                          </div>
                        </div>

                        <div className="divide-y divide-[#10B981]/10">
                          {memberDetails.filter(m => m.status === 'found').map((member, index) => {
                            const Icon = member.icon;
                            return (
                              <div key={index} className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${member.bgColor}`}>
                                    <Icon />
                                  </div>
                                  <span className="text-[14px] font-bold text-white tracking-wide truncate">{member.relationship}</span>
                                </div>
                                <span className="text-[12.5px] font-bold text-[#00D26A] flex items-center gap-1">@ Kavach User</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Not on KAVACH Container */}
                    {memberDetails.filter(m => m.status === 'not_found').length > 0 && (
                      <div className="bg-[#2E1F0A]/20 border border-[#F59E0B]/20 rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/25 flex items-center justify-center">
                            <Info size={16} className="text-[#F59E0B]" />
                          </div>
                          <div>
                            <h3 className="text-[14px] font-bold text-white leading-none">Not on KAVACH ({memberDetails.filter(m => m.status === 'not_found').length})</h3>
                            <p className="text-[#8B93A6] text-[11px] mt-1.5 font-medium leading-none font-sans">They will receive an invite to install</p>
                          </div>
                        </div>

                        <div className="divide-y divide-[#F59E0B]/10 font-sans">
                          {memberDetails.filter(m => m.status === 'not_found').map((member, index) => {
                            const Icon = member.icon;
                            return (
                              <div key={index} className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${member.bgColor}`}>
                                    <Icon />
                                  </div>
                                  <span className="text-[14px] font-bold text-white tracking-wide truncate">{member.relationship}</span>
                                </div>
                                <button
                                  onClick={() => handleIndividualInvite(member)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-[#25D366]/10 hover:bg-[#25D366]/15 border border-[#25D366]/25 text-[#25D366] text-[11px] font-bold tracking-wide uppercase hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-sans"
                                >
                                  <WhatsAppIcon />
                                  <span>Invite (WA/SMS)</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Send All Invitations Button */}
                  <button
                    onClick={handleSendAllInvitations}
                    className="w-full bg-[#7C4DFF] hover:bg-[#6c3df0] active:scale-[0.98] transition-all text-white text-[16px] font-semibold py-[18px] rounded-[18px] flex items-center justify-center shadow-[0_4px_20px_rgba(124,77,255,0.3)] cursor-pointer border-none shrink-0"
                  >
                    <span className="ml-2 font-display">Send All Invitations</span>
                    <ArrowRight size={20} className="ml-2" strokeWidth={2.5} />
                  </button>
                </motion.div>
              )}

              {step === 'sending' && (
                <motion.div
                  key="sending"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col text-left w-full h-full font-sans"
                >
                  {isSendingComplete ? (
                    /* Final Success View - Invitations Complete */
                    <div className="flex-1 flex flex-col items-center justify-between h-full py-4 text-center font-sans">
                      {/* Animating Confetti & Circle Check */}
                      <div className="relative w-full flex items-center justify-center py-6 shrink-0">
                        {/* Circle Pulsing Ring */}
                        <motion.div 
                          initial={{ scale: 0.3, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', damping: 15 }}
                          className="w-24 h-24 rounded-full bg-[#00D26A]/10 border-[3.5px] border-[#00D26A] flex items-center justify-center shadow-[0_0_30px_rgba(0,210,106,0.35)]"
                        >
                          <motion.svg 
                            width="40" 
                            height="40" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="#00D26A" 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </motion.svg>
                        </motion.div>

                        {/* Floating Sparkles Confetti Particles */}
                        {[...Array(12)].map((_, i) => {
                          const angle = (i * 30 * Math.PI) / 180;
                          const distance = 65 + Math.random() * 20;
                          const targetX = Math.cos(angle) * distance;
                          const targetY = Math.sin(angle) * distance;
                          const color = ['#FFC107', '#EC4899', '#3B82F6', '#10B981', '#7C4DFF'][i % 5];
                          
                          return (
                            <motion.div
                              key={i}
                              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                              animate={{ 
                                x: targetX, 
                                y: targetY, 
                                scale: [0, 1.2, 0.7, 0],
                                opacity: [1, 1, 0.8, 0] 
                              }}
                              transition={{ duration: 1.4, delay: 0.15, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.0 }}
                              className="absolute w-2 h-2 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          );
                        })}
                      </div>

                      {/* Header message */}
                      <div className="shrink-0 mb-4">
                        <h2 className="text-white text-[20px] font-extrabold tracking-wide font-display">
                          {memberDetails.length} Invitations Sent Successfully!
                        </h2>
                      </div>

                      {/* Dynamic Side-by-Side Cards */}
                      <div className="w-full flex-1 flex items-center justify-center my-3">
                        <div className={`w-full ${realKavachUsers.length > 0 && notOnKavachUsers.length > 0 ? 'grid grid-cols-2 gap-4' : 'flex justify-center max-w-[280px]'}`}>
                          {/* KAVACH card */}
                          {realKavachUsers.length > 0 && (
                            <div className="w-full bg-[#0D2A20]/45 border border-[#10B981]/25 rounded-2xl p-4 flex flex-col justify-between items-start text-left min-h-[120px] shadow-[0_8px_32px_rgba(16,185,129,0.06)] relative overflow-hidden group hover:border-[#10B981]/40 transition-colors">
                              {/* Background subtle radial glow */}
                              <div className="absolute top-0 right-0 w-16 h-16 bg-[#10B981]/10 rounded-full blur-xl pointer-events-none" />
                              
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[34px] font-extrabold text-[#00D26A] font-sans leading-none tracking-tight">
                                  {realKavachUsers.length}
                                </span>
                                
                                {/* custom requests sent icon grid */}
                                <div className="flex items-center gap-1 text-[#10B981]/80">
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="">
                                    <path d="M22 2L11 13" />
                                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                  </svg>
                                </div>
                              </div>

                              <div className="mt-4">
                                <h4 className="text-white text-[13px] font-bold tracking-wide font-sans">Requests Sent</h4>
                                <p className="text-[#848896] text-[10.5px] font-medium font-sans mt-0.5 leading-none">To KAVACH users</p>
                              </div>
                            </div>
                          )}

                          {/* WhatsApp / SMS card */}
                          {notOnKavachUsers.length > 0 && (
                            <div className="w-full bg-[#2E1F0A]/45 border border-[#F59E0B]/25 rounded-2xl p-4 flex flex-col justify-between items-start text-left min-h-[120px] shadow-[0_8px_32px_rgba(245,158,11,0.06)] relative overflow-hidden group hover:border-[#F59E0B]/40 transition-colors">
                              {/* Background subtle radial glow */}
                              <div className="absolute top-0 right-0 w-16 h-16 bg-[#F59E0B]/10 rounded-full blur-xl pointer-events-none" />
                              
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[34px] font-extrabold text-[#F59E0B] font-sans leading-none tracking-tight">
                                  {notOnKavachUsers.length}
                                </span>
                                
                                <div className="flex items-center gap-1.5">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                  </svg>
                                  <WhatsAppIcon />
                                </div>
                              </div>

                              <div className="mt-4">
                                <h4 className="text-white text-[13px] font-bold tracking-wide font-sans">Invites Sent</h4>
                                <p className="text-[#848896] text-[10.5px] font-medium font-sans mt-0.5 leading-none">Via WhatsApp/SMS</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Go to Family Circle Action Button */}
                      <div className="w-full mt-auto pt-3 shrink-0">
                        <button
                          onClick={() => {
                            localStorage.setItem('requests_default_subtab', 'sent');
                            useKavachStore.getState().setActiveTab('vault');
                            onClose();
                          }}
                          className="w-full bg-[#7C4DFF] hover:bg-[#6c3df0] active:scale-[0.98] transition-all text-white text-[16px] font-semibold py-[18px] rounded-[18px] flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(124,77,255,0.35)] hover:shadow-[0_4px_30px_rgba(124,77,255,0.5)] cursor-pointer border-none transition-shadow"
                        >
                          <span className="font-display font-bold">Go to Family Circle</span>
                          <ArrowRight size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Existing Sending loop view with animating airplane & progress bar */
                    <>
                      {/* Telegram Send Paper Airplane Animation */}
                      <div className="relative w-32 h-32 mx-auto mt-2 mb-4 flex items-center justify-center shrink-0">
                        {/* Outer Glow Circles */}
                        <div className="absolute w-20 h-20 rounded-full bg-[#7C4DFF]/10  opacity-75" />
                        <div className="absolute w-24 h-24 rounded-full bg-[#7C4DFF]/5 " />
                        
                        {/* Animated Telegram Paper Airplane */}
                        <motion.div
                          variants={{
                            animate: {
                              x: [0, 8, 120, -120, 0],
                              y: [0, -8, -120, 120, 0],
                              rotate: [0, -10, -45, -45, 0],
                              scale: [1, 1.08, 0, 0, 1],
                              opacity: [1, 1, 0, 0, 1],
                              transition: {
                                duration: 2.0,
                                ease: [0.4, 0, 0.2, 1],
                                repeat: Infinity,
                                repeatDelay: 0.2
                              }
                            }
                          }}
                          animate="animate"
                          className="absolute z-10 flex items-center justify-center text-[#7C4DFF] drop-shadow-[0_8px_24px_rgba(124,77,255,0.4)]"
                        >
                          <svg width="54" height="54" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                          </svg>
                        </motion.div>
                      </div>

                      <div className="text-center mb-6 pl-1 shrink-0">
                        <h2 className="text-gray-100 text-[16.5px] font-semibold tracking-wide">
                          Sending invitations...
                        </h2>
                        <p className="text-[#848896] text-[13.5px] mt-1 font-medium">One click, we'll do the rest</p>
                      </div>

                      {/* Sending Status Rows during process */}
                      <div className="bg-[#131A31] border border-[#2B315F] rounded-2xl divide-y divide-[#2B315F] mb-5 flex-1 overflow-y-auto hide-scrollbar">
                        {memberDetails.map((member, index) => {
                          const Icon = member.icon;
                          
                          // Match status style
                          const isSent = index < sendingIndex;
                          const isCurrentSending = index === sendingIndex;

                          return (
                            <div key={index} className="flex items-center justify-between p-4 transition-all font-sans">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${member.bgColor}`}>
                                  <Icon />
                                </div>
                                <span className="text-[14.5px] font-bold text-white tracking-wide truncate">
                                  {member.relationship}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {isCurrentSending && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#9C75FF] text-[13px] font-bold ">Sending...</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#9C75FF] " />
                                  </div>
                                )}
                                
                                {!isSent && !isCurrentSending && (
                                  <span className="text-gray-500 text-[12.5px] font-bold uppercase tracking-wider">Waiting</span>
                                )}

                                {isSent && (
                                  <div className="flex items-center gap-2">
                                    {!member.uid ? (
                                      <>
                                        <span className="text-[#00D26A] text-[13px] font-bold">Invite initiated</span>
                                        <div className="w-5 h-5 rounded-full bg-[#00D26A]/10 border border-[#00D26A]/20 flex items-center justify-center">
                                          <Check size={12} className="text-[#00D26A]" strokeWidth={3.5} />
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-[#00D26A] text-[13px] font-bold">Request sent</span>
                                        <div className="w-5 h-5 rounded-full bg-[#00D26A]/10 border border-[#00D26A]/20 flex items-center justify-center">
                                          <Check size={12} className="text-[#00D26A]" strokeWidth={3.5} />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Progress Bar & Centered Counter pushed to the bottom */}
                      <div className="flex flex-col gap-3 mt-auto w-full shrink-0 pb-3">
                        {/* Progress Bar */}
                        <div className="w-full bg-[#131A31] h-2.5 rounded-full overflow-hidden border border-[#2B315F]">
                          <div 
                            className="bg-[#7C4DFF] h-full transition-all duration-300 rounded-full"
                            style={{ 
                              width: `${(sendingIndex / memberDetails.length) * 100}%` 
                            }}
                          />
                        </div>
                        {/* Centered Counter */}
                        <div className="text-center text-gray-400 text-[14.5px] font-medium font-sans tracking-wide">
                          {sendingIndex} of {memberDetails.length} Completed
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {step === 'connect' && (
                <motion.div
                  key="connect"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col text-left w-full h-full"
                >
                  <div className="mb-5 pl-1 text-center shrink-0">
                    <h2 className="text-gray-100 text-[16px] font-semibold tracking-wide">Choose connection method</h2>
                    <p className="text-[#848896] text-[13.5px] mt-1 font-medium">Select how you want to add them</p>
                  </div>

                  <div className="flex flex-col gap-3 flex-1 overflow-y-auto hide-scrollbar pb-2">
                    {/* Scan QR Code */}
                    <button
                      onClick={() => onSelectConnectMethod('scan', selectedRelations)}
                      className="w-full bg-[#131A31] border border-[#2B315F] hover:bg-[#1C2443] transition-all rounded-2xl p-4 flex items-center justify-between text-left group shadow-lg cursor-pointer shrink-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-[#7C4DFF]/10 flex items-center justify-center border border-[#7C4DFF]/20 group-hover:scale-105 transition-transform">
                          <QrCode className="w-5.5 h-5.5 text-[#7C4DFF]" />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-bold text-white leading-tight font-display">Scan QR Code</h3>
                          <p className="text-[11px] text-gray-400 mt-1 font-medium font-sans">Scan the QR code of your family member</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Show My QR Code */}
                    <button
                      onClick={() => onSelectConnectMethod('generate', selectedRelations)}
                      className="w-full bg-[#131A31] border border-[#2B315F] hover:bg-[#1C2443] transition-all rounded-2xl p-4 flex items-center justify-between text-left group shadow-lg cursor-pointer shrink-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-[#00D26A]/10 flex items-center justify-center border border-[#00D26A]/20 group-hover:scale-105 transition-transform">
                          <QrCode className="w-5.5 h-5.5 text-[#00D26A]" />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-bold text-white leading-tight font-display">Show My QR Code</h3>
                          <p className="text-[11px] text-gray-400 mt-1 font-medium font-sans">Share your QR code to be added</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Share Invite Link */}
                    <button
                      onClick={handleShareInvite}
                      className="w-full bg-[#131A31] border border-[#2B315F] hover:bg-[#1C2443] transition-all rounded-2xl p-4 flex items-center justify-between text-left group shadow-lg cursor-pointer shrink-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center border border-[#3B82F6]/20 group-hover:scale-105 transition-transform">
                          <LinkIcon className="w-5.5 h-5.5 text-[#3B82F6]" />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-bold text-white leading-tight font-display">Share Invite Link</h3>
                          <p className="text-[11px] text-gray-400 mt-1 font-medium font-sans">Send invite link via WhatsApp, SMS or more</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Enter Code Manually */}
                    <button
                      onClick={() => onSelectConnectMethod('manual', selectedRelations)}
                      className="w-full bg-[#131A31] border border-[#2B315F] hover:bg-[#1C2443] transition-all rounded-2xl p-4 flex items-center justify-between text-left group shadow-lg cursor-pointer shrink-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-[#7C4DFF]/10 flex items-center justify-center border border-[#7C4DFF]/20 group-hover:scale-105 transition-transform">
                          <Keyboard className="w-5.5 h-5.5 text-[#7C4DFF]" />
                        </div>
                        <div>
                          <h3 className="text-[14px] font-bold text-white leading-tight font-display">Enter Code Manually</h3>
                          <p className="text-[11px] text-gray-455 mt-1 font-medium font-sans">Enter 6-digit code to connect</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}
