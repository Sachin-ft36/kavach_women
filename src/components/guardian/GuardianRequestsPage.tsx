import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, User, ShieldCheck, ChevronRight, ArrowLeft, MoreVertical, 
  Home, Bell, Users, Shield, Plus
} from 'lucide-react';
import { useKavachStore } from '../../state/useKavachStore';
import { db, auth } from '../../firebase';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, 
  getDocs, addDoc
} from 'firebase/firestore';
import { toast } from 'sonner';

interface GuardianRequestsPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMember?: (memberId: string) => void;
}

export default function GuardianRequestsPage({ isOpen, onClose, onSelectMember }: GuardianRequestsPageProps) {
  const { profile } = useKavachStore();
  const currentUid = auth.currentUser?.uid;

  // Sub Tabs: 'received' | 'sent'
  const [subTab, setSubTab] = useState<'received' | 'sent'>('received');

  // Data states
  const [allRequests, setAllRequests] = useState<any[]>([]);

  // Auto-switch to 'sent' tab if redirected from "Go to Family Circle" button
  useEffect(() => {
    const defaultTab = localStorage.getItem('requests_default_subtab');
    if (defaultTab === 'sent') {
      setSubTab('sent');
      localStorage.removeItem('requests_default_subtab');
    }
  }, []);

  // Listen to all pairing requests related to current user
  useEffect(() => {
    if (!currentUid) return;
    const q = query(
      collection(db, 'pairing_requests')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data(),
          timeStr: d.data().timestamp ? formatTimeAgo(d.data().timestamp.toDate()) : 'Recently'
        }))
        .filter((r: any) => r.senderId === currentUid || r.receiverId === currentUid);
      setAllRequests(reqs);
    }, (err) => {
      console.error("Failed to fetch requests:", err);
    });
    return () => unsub();
  }, [currentUid]);

  // Decline Request Handler
  const handleDecline = async (req: any) => {
    try {
      await updateDoc(doc(db, 'pairing_requests', req.id), {
        status: 'declined',
        declinedAt: serverTimestamp()
      });
      toast.info(`Request from ${req.senderName} declined.`);
    } catch (e: any) {
      toast.error('Failed to decline request.');
    }
  };

  // Accept Request Handler
  const handleAccept = async (req: any) => {
    try {
      // 1. Mark request approved
      await updateDoc(doc(db, 'pairing_requests', req.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        receiverName: profile.name || profile.displayName || 'Guardian',
        receiverPhoto: profile.photoURL || profile.photoUrl || ''
      });

      // 2. Write pairing data
      const payload = req.wardPayload;
      if (payload && currentUid) {
        const { executePairingWrite } = await import('../../services/pairingService');
        await executePairingWrite(payload, profile);
      }
      toast.success(`🎉 Connection approved with ${req.senderName}!`);
    } catch (e: any) {
      toast.error('Failed to accept request: ' + (e.message || 'Unknown error'));
    }
  };

  // Time Formatter helper
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 24) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
      return `Today • ${formattedHours}:${formattedMinutes} ${ampm}`;
    } else if (diffHrs < 48) {
      return 'Yesterday';
    } else {
      return `${date.toLocaleDateString()}`;
    }
  };

  if (!isOpen) return null;

  // Universal filter based on Received vs Sent sub-tabs
  const filteredRequests = allRequests.filter((req: any) => {
    if (subTab === 'received') {
      return req.receiverId === currentUid;
    } else {
      return req.senderId === currentUid;
    }
  });

  return (
    <AnimatePresence>
      <div className="w-full flex flex-col font-sans text-slate-100 bg-[#070715]/40 px-4 pt-3 pb-24 min-h-[calc(100vh-140px)] overflow-y-auto">
        
        {/* ===================== UNIVERSAL HEADER WITH SUBTITLE ===================== */}
        <div className="text-left mb-5 mt-1 px-1">
          <h2 className="text-[20px] font-black text-white tracking-tight uppercase italic">Connection Requests</h2>
          <p className="text-[10px] font-bold text-[#7C4DFF] uppercase tracking-[3px] mt-0.5">Vetting & Invites Hub</p>
        </div>

        {/* ===================== RECEIVED vs SENT SUB TABS ===================== */}
        <div className="flex bg-[#10132B] border border-[#232A56] rounded-xl p-1 mb-5 self-center w-full max-w-sm">
          <button
            onClick={() => setSubTab('received')}
            className={`flex-1 py-2 text-center text-[12px] font-bold rounded-lg tracking-wide transition-all border-none cursor-pointer ${
              subTab === 'received'
                ? 'bg-[#7C4DFF] text-white shadow-lg'
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            Received ({filteredRequests.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setSubTab('sent')}
            className={`flex-1 py-2 text-center text-[12px] font-bold rounded-lg tracking-wide transition-all border-none cursor-pointer ${
              subTab === 'sent'
                ? 'bg-[#7C4DFF] text-white shadow-lg'
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            Sent
          </button>
        </div>

        {/* ===================== LIST OF FILTERED REQUESTS ===================== */}
        <div className="space-y-4 flex-1">
          {filteredRequests.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center gap-3 text-slate-500">
              <Users size={36} className="opacity-40" />
              <p className="text-[13px] font-medium font-sans">No requests found here</p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <motion.div
                layout
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#121633] border border-[#2B315F] rounded-2xl p-4 flex flex-col relative shadow-md"
              >
                {/* Close button top right */}
                {req.status === 'pending' && req.receiverId === currentUid && (
                  <button
                    onClick={() => handleDecline(req)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white bg-transparent border-none cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Header Row */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full border border-slate-700 bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {req.senderId === currentUid ? (
                      req.receiverPhoto ? (
                        <img src={req.receiverPhoto} alt="receiver" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#7C4DFF]/15 text-[#A78BFA] font-black text-[16px]">
                          {(req.receiverName || req.relationship || '?')[0].toUpperCase()}
                        </div>
                      )
                    ) : (
                      req.senderPhoto ? (
                        <img src={req.senderPhoto} alt="sender" className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-slate-400" size={18} />
                      )
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0 pr-6">
                    <h3 className="text-[14px] font-extrabold text-white leading-tight font-display truncate">
                      {req.senderId === currentUid
                        ? (req.receiverName || req.relationship || 'Invite Sent')
                        : req.senderName}
                    </h3>
                    {/* Show phone number for non-Kavach invites */}
                    {req.senderId === currentUid && req.receiverPhone && (
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {req.receiverPhone}
                      </p>
                    )}
                    <p className="text-[12px] text-gray-400 font-medium mt-1 font-sans">
                      {req.senderId === currentUid
                        ? req.isKavachUser
                          ? `Waiting for ${req.receiverName || 'them'} to approve`
                          : `Invitation sent via WhatsApp / SMS`
                        : `Wants you to be her Guardian`
                      }
                    </p>
                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-[9.5px] text-slate-500 font-semibold uppercase tracking-wider">
                        {req.timeStr}
                      </span>
                      {req.senderId === currentUid && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          req.status === 'declined' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          req.status === 'invited' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {req.status === 'invited' ? 'INVITED' : req.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Decline / Accept Actions for pending received requests */}
                {req.status === 'pending' && req.receiverId === currentUid && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => handleDecline(req)}
                      className="py-2.5 rounded-xl border border-[#2B315F] bg-[#0E1020] text-slate-300 hover:bg-white/5 active:scale-95 transition-all text-[12.5px] font-bold cursor-pointer font-sans"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(req)}
                      className="py-2.5 rounded-xl bg-[#7C4DFF] text-white hover:bg-[#6c3df0] active:scale-95 transition-all text-[12.5px] font-bold border-none cursor-pointer font-display shadow-md shadow-[#7C4DFF]/20"
                    >
                      Accept
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}
