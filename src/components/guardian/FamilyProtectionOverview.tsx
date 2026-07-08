import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  Users,
  ShieldCheck,
  Car,
  Bell,
  Home,
  Briefcase,
  MapPin,
  Plus,
  Navigation,
  Phone,
  UserCheck,
  Share2,
  Settings,
  ChevronRight,
  ChevronDown,
  Info,
  PlayCircle,
  AlertTriangle,
  Battery,
  Clock,
  Radio,
  UserPlus,
  QrCode,
  Check,
  Link,
  ArrowLeft,
  MessageSquare,
  User,
  Lock,
  X,
  Activity,
  Zap
} from 'lucide-react';
import { useKavachStore } from '../../state/useKavachStore';
import { db, auth } from '../../firebase';
import { collection, doc, query, orderBy, onSnapshot, limit, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

// --- Sub-components ---

const SOSAlertCard = ({ member, onResolve, onTrack }: { member: any; onResolve: () => void; onTrack: () => void }) => {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[20px] p-4 flex flex-col gap-3.5 border-2 border-[#FF2D2D]/80 shadow-[0_0_20px_rgba(255,45,45,0.35)] -red"
      style={{
        background: 'linear-gradient(135deg, #1A0808 0%, #0F0303 100%)',
        fontFamily: '"Plus Jakarta Sans", sans-serif'
      }}
    >
      {/* Import Plus Jakarta Sans for exact typography matching */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse-red-glow {
          0%, 100% {
            border-color: rgba(255, 45, 45, 0.6);
            box-shadow: 0 0 15px rgba(255, 45, 45, 0.25), 0 4px 30px rgba(0,0,0,0.4);
          }
          50% {
            border-color: rgba(255, 45, 45, 1);
            box-shadow: 0 0 25px rgba(255, 45, 45, 0.55), 0 4px 30px rgba(0,0,0,0.4);
          }
        }
        .-red {
          animation: pulse-red-glow 2s infinite ease-in-out;
        }
      `}</style>

      {/* Soft Steady Inner Glow */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500/5 blur-[40px] pointer-events-none" />

      {/* --- TOP BAR --- */}
      <div className="flex justify-between items-center z-10">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[8.5px] tracking-wide"
          style={{ backgroundColor: 'rgba(255, 45, 45, 0.12)', color: '#FF2D2D' }}
        >
          <Home size={10} strokeWidth={2.5} />
          LIVE ALERT
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/5 text-slate-300 text-[8.5px] font-medium backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
          </span>
          High Priority
        </div>
      </div>

      {/* --- CENTER CONTENT ROW --- */}
      <div className="flex items-center gap-3 z-10">

        {/* Avatar Column */}
        <div className="relative flex-shrink-0">
          {/* Subtle slow pulsing ring */}
          <div className="absolute inset-0 rounded-full border border-red-500/30 " />

          {/* Avatar Frame */}
          <div className="w-[68px] h-[68px] rounded-full p-0.5 border border-red-500/25 bg-gradient-to-b from-red-500/10 to-transparent flex items-center justify-center relative">
            <img
              src={member.avatar || "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=200&auto=format&fit=crop"}
              alt={member.name}
              className="w-full h-full rounded-full object-cover border border-white/5"
            />
          </div>

          {/* SOS Badge */}
          <div className="absolute -bottom-0.5 -right-0.5 bg-[#FF2D2D] text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-full border border-[#141A3A] shadow-md flex items-center justify-center z-20">
            SOS
          </div>
        </div>

        {/* Info Column */}
        <div className="flex flex-col flex-grow min-w-0 font-sans">
          <div className="flex items-center gap-1 text-[#FF2D2D] text-[8.5px] font-bold uppercase tracking-wider mb-0.5">
            <AlertTriangle size={11} strokeWidth={2.5} className="text-[#FF2D2D]" />
            ACTIVE SOS ALERT
          </div>

          <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0 leading-none mb-1">
            <span className="text-white text-[16px] sm:text-[18px] font-display font-bold tracking-tight">{member.name.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 text-[9.5px] font-sans font-medium mb-0.5 truncate">
            <MapPin size={11} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">Connaught Place, New Delhi</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#FF2D2D] text-[9.5px] font-semibold">
            <Clock size={11} className="flex-shrink-0 text-[#FF2D2D]" />
            <span>Started 12 seconds ago</span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-[56px] bg-white/10 mx-0.5 hidden sm:block" />

        {/* Distance Column */}
        <div className="flex flex-col items-end justify-center flex-shrink-0 ml-0.5 font-sans">
          <div className="text-[#FF2D2D] text-[22px] font-black leading-none tracking-tight">2.4<span className="text-[14px] ml-0.5">km</span></div>
          <div className="text-slate-400 text-[8px] font-medium mt-0.5 mb-1.5">away from you</div>

          <button className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#FF2D2D]/25 bg-[#FF2D2D]/5 text-white text-[8px] font-medium hover:bg-[#FF2D2D]/10 transition-all w-full justify-center cursor-pointer">
            <Radio size={10} className="text-[#FF2D2D]" />
            View Live
          </button>
        </div>
      </div>

      {/* --- BOTTOM ACTIONS --- */}
      <div className="flex gap-2 z-10 font-sans">
        <button
          onClick={onTrack}
          className="flex-1 h-9 rounded-xl border border-[#00D26A]/20 bg-[#00D26A]/5 text-[#00D26A] text-[8.5px] sm:text-[9px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#00D26A]/10 transition-all cursor-pointer"
        >
          <MapPin size={11} />
          TRACK LIVE
        </button>

        <button
          onClick={onTrack}
          className="flex-1 h-9 rounded-xl border border-[#7C4DFF]/20 bg-[#7C4DFF]/5 text-[#7C4DFF] text-[8.5px] sm:text-[9px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#7C4DFF]/10 transition-all cursor-pointer"
        >
          <Navigation size={11} fill="currentColor" className="rotate-45 mb-0.5" />
          NAVIGATE
        </button>

        <button onClick={onResolve} className="flex-1 h-9 rounded-xl border border-[#FF2D2D]/30 bg-[#FF2D2D]/10 text-[#FF2D2D] text-[8.5px] sm:text-[9px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#FF2D2D]/20 transition-all cursor-pointer">
          <Phone size={11} fill="currentColor" />
          CALL NOW
        </button>
      </div>
    </div>
  );
};

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#0B0B22] border border-[#2C1C72]/70 rounded-[20px] shadow-[0_0_0_1px_rgba(108,61,255,.12),0_0_24px_rgba(108,61,255,.08)] p-3 ${className}`}>
    {children}
  </div>
);

const IconButton = ({ icon: Icon, label, sublabel, isSos, onClick }: { icon: any, label: string, sublabel: string, isSos?: boolean, onClick?: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center p-2 py-3 bg-[#101633] hover:bg-[#141A3A] transition-colors rounded-2xl gap-1.5 w-full min-w-0 border border-[#232A56] font-display">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSos ? 'bg-red-500/10' : 'bg-[#7C4DFF]/15'}`}>
      <Icon className={`w-[18px] h-[18px] ${isSos ? 'text-[#FF2D2D]' : 'text-[#7C4DFF]'}`} />
    </div>
    <div className="text-center w-full min-w-0">
      <div className={`text-[10px] font-bold leading-tight ${isSos ? 'text-[#FF2D2D]' : 'text-slate-200'}`} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{label}</div>
      <div className="text-[8px] text-slate-400 mt-0.5 leading-none truncate whitespace-nowrap font-sans">{sublabel}</div>
    </div>
  </button>
);

const FamilyMember = ({ name, relation, status, statusIcon: StatusIcon, statusColor, location, locationIcon: LocationIcon, avatar, isLive }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-[#232A56] last:border-0 cursor-pointer">
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#141A3A] rounded-full"></div>
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-white text-[13px] font-display font-medium">{name}</span>
          {relation && <span className="text-[10px] text-slate-400 font-sans">({relation})</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-sans">
          <div className={`flex items-center gap-1 ${statusColor}`}>
            <StatusIcon className="w-3 h-3" />
            <span>{status}</span>
          </div>
          {location && (
            <div className="flex items-center gap-1 text-slate-300">
              <LocationIcon className="w-3 h-3 text-slate-400" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${isLive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-slate-400/10 text-slate-300'}`}>
        Live
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
    </div>
  </div>
);

const TimelineItem = ({ icon: Icon, iconBg, title, time, hasBorder = true }: any) => (
  <div className={`flex items-center justify-between py-2 ${hasBorder ? 'border-b border-[#232A56]' : ''}`}>
    <div className="flex items-center gap-2.5">
      <div className={`w-[28px] h-[28px] rounded-full flex items-center justify-center ${iconBg}`}>
        <Icon className="w-3.5 h-3.5" fill="currentColor" />
      </div>
      <span className="text-[11.5px] text-slate-200">{title}</span>
    </div>
    <span className="text-[10px] text-slate-400">{time}</span>
  </div>
);

const AnimatedBar = ({ value, label, number, isOrange, delay, trigger = true }: any) => (
  <div className="flex flex-col items-center gap-1.5 w-6">
    <span
      className={`text-[11px] font-medium ${trigger ? 'opacity-0 animate-fade-in-up' : 'opacity-0'} ${isOrange ? 'text-orange-400' : 'text-emerald-400'}`}
      style={{ animationDelay: trigger ? `${delay + 400}ms` : '0ms', animationFillMode: 'forwards' }}
    >
      {number}
    </span>
    <div className="h-[55px] w-3 bg-[#101633] rounded-full relative overflow-hidden shadow-inner">
      <div
        className={`absolute bottom-0 left-0 w-full rounded-full ${trigger ? 'animate-grow-bar' : 'scale-y-0'} ${isOrange ? 'bg-gradient-to-t from-orange-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
          }`}
        style={{ height: `${value}%`, animationDelay: trigger ? `${delay}ms` : '0ms', transformOrigin: 'bottom', transition: trigger ? 'none' : 'transform 0.5s ease', animationFillMode: 'forwards' }}>
      </div>
    </div>
    <span className="text-[10px] text-slate-400 mt-0.5">{label}</span>
  </div>
);

const AnimatedNumber = ({ end, duration, trigger = true }: { end: number, duration: number, trigger?: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) {
      setCount(0);
      return;
    }
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      setCount(Math.floor(end * percentage));

      if (progress < duration) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [end, duration, trigger]);

  return <>{count}</>;
};


// --- Main App Component ---

interface AppProps {
  onViewFamilyCircle?: () => void;
  safetyMode?: 'personal' | 'family';
  setSafetyMode?: (mode: 'personal' | 'family') => void;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function App({ onViewFamilyCircle, safetyMode, setSafetyMode }: AppProps) {
  const { userPos, profile, setActiveTab } = useKavachStore();
  const [protectedMembers, setProtectedMembers] = useState<any[]>([]);
  const [activeAlertsList, setActiveAlertsList] = useState<any[]>([]);
  const [timelineUpdates, setTimelineUpdates] = useState<any[]>([]);
  const [geocodedLocations, setGeocodedLocations] = useState<Record<string, string>>({});

  const navigateToTracking = (memberId: string) => {
    window.history.pushState(null, '', `/track/${memberId}`);
    window.dispatchEvent(new Event('pushstate_changed'));
  };

  const [activeMemberId, setActiveMemberId] = useState('');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [showInviteScreen, setShowInviteScreen] = useState(false);
  const [showAddFirstPersonScreen, setShowAddFirstPersonScreen] = useState(false);
  const [addMethod, setAddMethod] = useState<'manual' | 'qr' | 'link'>('manual');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [isDefaultProtection, setIsDefaultProtection] = useState(true);

  const [guardianRequests, setGuardianRequests] = useState<any[]>([]);

  const handleAcceptGuardianRequest = async (id: string, name: string) => {
    const req = guardianRequests.find(r => r.id === id)?.rawReq;
    if (req) {
      await handleApproveRequest(req);
    } else {
      setGuardianRequests(prev => prev.filter(r => r.id !== id));
      toast.success(`Accepted Guardian Request from ${name}!`);
    }
  };

  const handleDeclineGuardianRequest = async (id: string, name: string) => {
    const req = guardianRequests.find(r => r.id === id)?.rawReq;
    if (req) {
      await handleDeclineRequest(req);
    } else {
      setGuardianRequests(prev => prev.filter(r => r.id !== id));
      toast.info(`Declined request from ${name}`);
    }
  };

  const handleAddManually = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error("Please enter a valid name and phone number");
      return;
    }
    try {
      const formattedPhone = newPhone.startsWith('+') ? newPhone : `+91${newPhone.trim()}`;
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const connectionId = `${profile.uid}_${Date.now()}`;
      
      await setDoc(doc(db, 'family_members', connectionId), {
        guardianUid: profile.uid,
        guardianName: profile.displayName || profile.name || 'Guardian',
        name: newName.trim(),
        phone: formattedPhone,
        relation: newRelation,
        status: 'Safe',
        battery: 100,
        isUnregistered: true,
        createdAt: serverTimestamp()
      });

      toast.success(`${newName} added to your protection list!`);
      setNewName('');
      setNewPhone('');
      setShowAddFirstPersonScreen(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to add: " + err.message);
    }
  };

  const scoreRef = useRef<HTMLDivElement>(null);
  const [scoreVisible, setScoreVisible] = useState(false);

  // Pairing request states
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showRequestSheet, setShowRequestSheet] = useState(false);

  // Success Connection States for Receiver
  const [isApprovedSuccess, setIsApprovedSuccess] = useState(false);
  const [approvedConnectionData, setApprovedConnectionData] = useState<any>(null);

  // Realtime approved request listener for Sender
  const [showSenderSuccessModal, setShowSenderSuccessModal] = useState(false);
  const [senderSuccessData, setSenderSuccessData] = useState<any>(null);
  const mountTimeRef = useRef(new Date());

  const [nearbyProtectorCountForAlert, setNearbyProtectorCountForAlert] = useState(0);
  const [nearbyProtectorAvatarsForAlert, setNearbyProtectorAvatarsForAlert] = useState<string[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setScoreVisible(entry.isIntersecting);
    }, { threshold: 0.1 });

    if (scoreRef.current) {
      observer.observe(scoreRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // 0. Listen to incoming pairing requests for this user
  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, 'pairing_requests'),
      where('receiverId', '==', profile.uid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPendingRequests(reqs);
    });
    return () => unsub();
  }, [profile?.uid]);

  // Sync live Firestore pendingRequests to guardianRequests cards
  useEffect(() => {
    if (pendingRequests && Array.isArray(pendingRequests)) {
      const mapped = pendingRequests.map((req: any) => ({
        id: req.id,
        name: req.senderName || 'Kavach User',
        gender: req.senderGender || 'female',
        text: `wants you to be ${req.senderGender === 'female' ? 'her' : 'his'} Guardian`,
        time: 'Pending Request',
        avatar: req.senderPhoto || '',
        rawReq: req
      }));
      setGuardianRequests(mapped);
    } else {
      setGuardianRequests([]);
    }
  }, [pendingRequests]);

  // Realtime listener for Sender to detect when their request is approved
  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, 'pairing_requests'),
      where('senderId', '==', profile.uid),
      where('status', '==', 'approved')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          const approvedAt = data.approvedAt?.toDate?.() || (data.approvedAt ? new Date(data.approvedAt.seconds * 1000) : null);
          
          if (approvedAt && approvedAt > mountTimeRef.current) {
            // Trigger Sender's Connected success screen
            setSenderSuccessData({
              id: change.doc.id,
              senderName: data.receiverName || 'Guardian',
              senderPhoto: data.receiverPhoto || '',
              receiverName: data.senderName || 'You',
              receiverPhoto: data.senderPhoto || ''
            });
            setShowSenderSuccessModal(true);
            toast.success(`🎉 Connection approved!`);
          }
        }
      });
    });
    return () => unsub();
  }, [profile?.uid]);

  const handleApproveRequest = async (req: any) => {
    try {
      // 1. Mark request approved and attach receiver info for sender's display
      await updateDoc(doc(db, 'pairing_requests', req.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        receiverName: profile.name || profile.displayName || 'Guardian',
        receiverPhoto: profile.photoURL || profile.photoUrl || ''
      });

      // 2. Write the actual pairing to both user docs using the ward payload
      const payload = req.wardPayload;
      if (payload && profile?.uid) {
        const { executePairingWrite } = await import('../../services/pairingService');
        await executePairingWrite(payload, profile);
      }

      setApprovedConnectionData({
        senderName: req.senderName,
        senderPhoto: req.senderPhoto,
        receiverName: profile.name || profile.displayName || 'You',
        receiverPhoto: profile.photoURL || profile.photoUrl || ''
      });
      setIsApprovedSuccess(true);
    } catch (e: any) {
      toast.error('Failed to approve: ' + (e.message || 'Unknown error'));
    }
  };

  const handleDeclineRequest = async (req: any) => {
    try {
      await updateDoc(doc(db, 'pairing_requests', req.id), {
        status: 'declined',
        declinedAt: serverTimestamp(),
      });
      setShowRequestSheet(false);
      setSelectedRequest(null);
      toast.info(`Request from ${req.senderName} declined.`);
    } catch (e: any) {
      toast.error('Failed to decline.');
    }
  };

  // Listen to citizens who added this user as a primary guardian
  useEffect(() => {
    if (!profile?.phoneNumber) return;

    const guardianPhone = profile.phoneNumber;
    const guardianPhoneClean = `+91${guardianPhone.replace(/\D/g, '').slice(-10)}`;
    const familyPhone = (profile as any)?.protectorVetting?.familyPhone || null;

    let primaryProtected: any[] = [];
    let directProtected: any[] = [];

    const mergeAndSet = () => {
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const m of [...primaryProtected, ...directProtected]) {
        const key = m.uid || m.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          merged.push(m);
        }
      }
      setProtectedMembers(merged);
    };

    const q1 = query(
      collection(db, 'users'),
      where('primaryGuardian.phone', 'in', [guardianPhone, guardianPhoneClean])
    );
    const unsub1 = onSnapshot(q1, (snap) => {
      primaryProtected = snap.docs.map(d => ({
        uid: d.id,
        name: d.data().displayName || d.data().name || 'Family Member',
        phone: d.data().phoneNumber || d.data().phone || '',
        avatar: d.data().photoURL || d.data().photoUrl || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
        battery: d.data().batteryLevel || d.data().battery || 100,
        lastLocation: d.data().lastLocation || null,
        lastActive: d.data().lastActive || null,
        relation: d.data().primaryGuardian?.relation || 'Family Member',
        isYou: false
      }));
      mergeAndSet();
    }, (err) => {
      console.error('Q1 protected error:', err);
    });

    let unsub2: (() => void) | null = null;
    if (familyPhone) {
      const familyPhoneClean = `+91${familyPhone.replace(/\D/g, '').slice(-10)}`;
      const q2 = query(
        collection(db, 'users'),
        where('phoneNumber', 'in', [familyPhone, familyPhoneClean])
      );
      unsub2 = onSnapshot(q2, (snap) => {
        directProtected = snap.docs.map(d => ({
          uid: d.id,
          name: d.data().displayName || d.data().name || 'Family Member',
          phone: d.data().phoneNumber || d.data().phone || '',
          avatar: d.data().photoURL || d.data().photoUrl || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
          battery: d.data().batteryLevel || d.data().battery || 100,
          lastLocation: d.data().lastLocation || null,
          lastActive: d.data().lastActive || null,
          relation: 'Family Member',
          isYou: false
        }));
        mergeAndSet();
      }, (err) => {
        console.error('Q2 protected error:', err);
      });
    }

    return () => {
      unsub1();
      unsub2?.();
    };
  }, [profile?.phoneNumber, (profile as any)?.protectorVetting?.familyPhone]);

  const allCircleMembers = protectedMembers;

  // 3. Listen to active SOS alerts
  useEffect(() => {
    if (!auth.currentUser || allCircleMembers.length === 0) return;

    const uids = allCircleMembers.map(m => m.uid).filter(Boolean);
    if (uids.length === 0) return;

    const q = query(
      collection(db, 'alerts'),
      where('status', 'in', ['active', 'responding', 'rescued_pending_victim_clearance'])
    );

    const unsubAlerts = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter((alert: any) => uids.includes(alert.victimUid));

      setActiveAlertsList(list);
    }, (err) => {
      console.warn("Error listening to alerts:", err);
    });

    return () => unsubAlerts();
  }, [allCircleMembers]);

  // 4. Reverse geocode locations
  useEffect(() => {
    allCircleMembers.forEach(async (member) => {
      if (member.lastLocation?.latitude && member.lastLocation?.longitude) {
        const key = `${member.lastLocation.latitude.toFixed(4)},${member.lastLocation.longitude.toFixed(4)}`;
        if (geocodedLocations[key]) return;

        try {
          const { getReverseMetadata } = await import('../../services/locationService');
          const meta = await getReverseMetadata(member.lastLocation.latitude, member.lastLocation.longitude);
          const name = meta.suburb !== 'General Sector' ? `${meta.suburb}, ${meta.city}` : meta.display.split(',')[0];
          setGeocodedLocations(prev => ({ ...prev, [key]: name }));
        } catch {
          setGeocodedLocations(prev => ({ ...prev, [key]: `${member.lastLocation.latitude.toFixed(4)}, ${member.lastLocation.longitude.toFixed(4)}` }));
        }
      }
    });
  }, [allCircleMembers, geocodedLocations]);

  // 5. Listen to checkins for updates feed
  useEffect(() => {
    if (!auth.currentUser || allCircleMembers.length === 0) return;
    const uids = allCircleMembers.map(m => m.uid).filter(Boolean);
    if (uids.length === 0) return;

    const q = query(
      collection(db, 'checkins'),
      where('userId', 'in', uids),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubCheckins = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        const member = allCircleMembers.find(m => m.uid === data.userId);

        let icon: any = Home;
        let iconBg = 'bg-emerald-500/20 text-emerald-400';

        const descLower = (data.desc || '').toLowerCase();
        if (descLower.includes('office') || descLower.includes('work')) {
          icon = Briefcase;
          iconBg = 'bg-blue-500/20 text-blue-400';
        } else if (descLower.includes('travel') || descLower.includes('way') || descLower.includes('moving')) {
          icon = Car;
          iconBg = 'bg-amber-500/20 text-amber-400';
        } else if (descLower.includes('college') || descLower.includes('school')) {
          icon = MapPin;
          iconBg = 'bg-purple-500/20 text-purple-400';
        }

        let timeStr = 'Just now';
        if (data.timestamp) {
          const diffMin = Math.round((Date.now() - data.timestamp) / 60000);
          if (diffMin < 1) timeStr = 'Just now';
          else if (diffMin < 60) timeStr = `${diffMin}m ago`;
          else if (diffMin < 1440) timeStr = `${Math.round(diffMin / 60)}h ago`;
          else timeStr = `${Math.round(diffMin / 1440)}d ago`;
        }

        return {
          id: doc.id,
          icon,
          iconBg,
          title: `${member?.name || data.author || 'Someone'} ${data.desc || 'posted an update'}`,
          time: timeStr
        };
      });
      setTimelineUpdates(list);
    }, (err) => {
      console.warn("Timeline subscription error:", err);
    });

    return () => unsubCheckins();
  }, [allCircleMembers]);

  const familyData = React.useMemo(() => {
    const data: Record<string, any> = {};

    allCircleMembers.forEach((member) => {
      const id = member.uid;
      const lat = member.lastLocation?.latitude;
      const lng = member.lastLocation?.longitude;

      const locKey = (lat && lng) ? `${lat.toFixed(4)},${lng.toFixed(4)}` : '';
      const resolvedLoc = locKey ? (geocodedLocations[locKey] || 'Resolving location...') : 'Location unavailable';

      const relation = member.relation || 'Guardian';
      let statusType: 'Safe' | 'Travelling' = 'Safe';
      let locationIcon: any = Home;

      const hasActiveAlert = activeAlertsList.some((a: any) => a.victimUid === member.uid);
      const isTravelling = member.isRideModeActive || false;

      if (hasActiveAlert) {
        statusType = 'Travelling';
      } else if (isTravelling) {
        statusType = 'Travelling';
        locationIcon = Car;
      } else {
        statusType = 'Safe';
        locationIcon = member.isYou ? ShieldCheck : Home;
      }

      let lastCheckInStr = 'No status yet';
      if (member.lastActive) {
        const ms = typeof member.lastActive.toMillis === 'function' ? member.lastActive.toMillis() : member.lastActive;
        const diffMin = Math.round((Date.now() - ms) / 60000);
        if (diffMin < 1) lastCheckInStr = 'Just now';
        else if (diffMin < 60) lastCheckInStr = `${diffMin} min ago`;
        else {
          const diffHr = Math.round(diffMin / 60);
          if (diffHr < 24) lastCheckInStr = `${diffHr} hr ago`;
          else lastCheckInStr = `${Math.round(diffHr / 24)} days ago`;
        }
      }

      data[id] = {
        uid: member.uid,
        name: member.name.toUpperCase(),
        relation: relation,
        status: hasActiveAlert ? 'SOS Alert Triggered' : (isTravelling ? `Travelling • ${resolvedLoc}` : `Safe • ${resolvedLoc}`),
        statusType: statusType,
        locationText: (lat && lng) ? '📍 Live Location Available' : '📍 Location History Available',
        locationDetail: hasActiveAlert ? 'Emergency SOS' : (isTravelling ? `Travelling • ${resolvedLoc}` : resolvedLoc),
        locationIcon: locationIcon,
        avatar: member.avatar,
        lastCheckIn: lastCheckInStr,
        battery: `${member.battery}%`,
        protection: hasActiveAlert ? 'Emergency' : (member.isUnregistered ? 'Pending invite' : 'Active'),
        isLive: !!member.lastActive && (Date.now() - (typeof member.lastActive.toMillis === 'function' ? member.lastActive.toMillis() : member.lastActive) < 300000),
        phone: member.phone,
        latitude: lat,
        longitude: lng
      };
    });

    return data;
  }, [allCircleMembers, geocodedLocations, activeAlertsList]);

  const activeActivities = React.useMemo(() => {
    const list: any[] = [];
    
    // Check real members
    Object.values(familyData).forEach((member: any) => {
      const hasActiveAlert = activeAlertsList.some((a: any) => a.victimUid === member.uid);
      if (hasActiveAlert) {
        list.push({
          type: 'sos',
          title: 'Emergency SOS Active',
          name: member.name,
          subtitle: 'Critical Alert',
          icon: AlertTriangle,
          iconBg: 'bg-red-500/10 text-red-500 border border-red-500/20',
          btnText: 'Track SOS',
          btnColor: 'border-red-500/30 text-red-500 hover:bg-red-500/10',
          memberId: member.uid
        });
      } else if (member.statusType === 'Travelling' || member.isRideModeActive) {
        list.push({
          type: 'ride',
          title: 'Ride Safe Active',
          name: member.name,
          subtitle: 'ETA 18 min',
          icon: Car,
          iconBg: 'bg-[#00D26A]/10 text-[#00D26A] border border-[#00D26A]/20',
          btnText: 'Track Now',
          btnColor: 'border-[#00D26A]/30 text-[#00D26A] hover:bg-[#00D26A]/10',
          memberId: member.uid
        });
      } else if (member.isLive) {
        list.push({
          type: 'location',
          title: 'Live Location Sharing',
          name: member.name,
          subtitle: `Since ${member.lastCheckIn || '5 min'}`,
          icon: MapPin,
          iconBg: 'bg-[#7C4DFF]/15 text-[#7C4DFF] border border-[#7C4DFF]/25',
          btnText: 'View Live',
          btnColor: 'border-[#7C4DFF]/30 text-[#7C4DFF] hover:bg-[#7C4DFF]/10',
          memberId: member.uid
        });
      }
    });
    
    return list;
  }, [familyData, activeAlertsList]);

  const activeAlert = React.useMemo(() => {
    if (activeAlertsList.length === 0) {
      return null;
    }
    const alert = activeAlertsList[0];
    const member = familyData[alert.victimUid];

    let distance = 2.4;
    if (userPos?.lat && userPos?.lng && alert.latitude && alert.longitude) {
      distance = getDistanceKm(userPos.lat, userPos.lng, alert.latitude, alert.longitude);
    }

    let startedAgo = '12 seconds ago';
    if (alert.createdAt || alert.timestamp) {
      const alertTime = alert.createdAt?.toMillis ? alert.createdAt.toMillis() : (alert.timestamp || Date.now());
      const diffSec = Math.round((Date.now() - alertTime) / 1000);
      if (diffSec < 60) startedAgo = `${diffSec} seconds ago`;
      else startedAgo = `${Math.round(diffSec / 60)} minutes ago`;
    }

    return {
      ...alert,
      name: member?.name || alert.victimName || 'Family Member',
      avatar: member?.avatar || 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=200&auto=format&fit=crop',
      locationName: alert.locationName || 'Connaught Place, New Delhi',
      startedAgo: startedAgo,
      distance: distance,
      phone: member?.phone || alert.victimPhone || ''
    };
  }, [activeAlertsList, familyData, userPos]);

  useEffect(() => {
    if (!activeAlert?.latitude || !activeAlert?.longitude) {
      setNearbyProtectorCountForAlert(0);
      setNearbyProtectorAvatarsForAlert([]);
      return;
    }
    
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'protector')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const prots = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          avatar: data.photoURL || data.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
          lat: data.lastLocation?.latitude,
          lng: data.lastLocation?.longitude
        };
      }).filter(p => {
        if (!p.lat || !p.lng) return false;
        const d = getDistanceKm(activeAlert.latitude, activeAlert.longitude, p.lat, p.lng);
        return d <= 2.5;
      });
      
      setNearbyProtectorCountForAlert(prots.length);
      setNearbyProtectorAvatarsForAlert(prots.map(p => p.avatar));
    });
    
    return () => unsub();
  }, [activeAlert?.id, activeAlert?.latitude, activeAlert?.longitude]);

  const displayProtectorCount = React.useMemo(() => {
    if (activeAlert) {
      return nearbyProtectorCountForAlert;
    }
    return 0;
  }, [activeAlert, nearbyProtectorCountForAlert]);

  const displayProtectorAvatars = React.useMemo(() => {
    if (activeAlert) {
      return nearbyProtectorAvatarsForAlert;
    }
    return [];
  }, [activeAlert, nearbyProtectorAvatarsForAlert]);

  useEffect(() => {
    const keys = Object.keys(familyData);
    if (keys.length > 0 && !familyData[activeMemberId]) {
      setActiveMemberId(keys[0]);
    }
  }, [familyData, activeMemberId]);

  const lastStateRef = useRef({ alerts: false, activities: false });

  useEffect(() => {
    const hasActiveSOSAlert = activeAlertsList.length > 0;

    const hasLiveActivities = Object.values(familyData).some((member: any) => 
      member.statusType === 'Travelling' || member.isRideModeActive || member.isLive
    );

    const newAlertStarted = hasActiveSOSAlert && !lastStateRef.current.alerts;
    const newActivityStarted = hasLiveActivities && !lastStateRef.current.activities;

    if ((newAlertStarted || newActivityStarted) && safetyMode !== 'family') {
      setSafetyMode?.('family');
      toast.info("Active alert or trip detected: Switched to Guardian Mode");
    }

    lastStateRef.current = { alerts: hasActiveSOSAlert, activities: hasLiveActivities };
  }, [activeAlertsList, familyData, safetyMode, setSafetyMode]);

  const activeMember = familyData[activeMemberId] || Object.values(familyData)[0] || {
    name: 'NO MEMBER',
    relation: '',
    status: 'Standby',
    statusType: 'Safe',
    locationText: '',
    locationDetail: '',
    locationIcon: Home,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    lastCheckIn: 'N/A',
    battery: '100%',
    protection: 'Inactive',
    isLive: false,
  };

  const inviteUrl = `${window.location.origin}/invite?ref=${auth.currentUser?.uid || 'user'}`;
  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Join my safety circle on Kavach: ' + inviteUrl)}`);
  };
  const handleShareSMS = () => {
    window.open(`sms:?&body=${encodeURIComponent('Join my safety circle on Kavach: ' + inviteUrl)}`);
  };
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert('Invite link copied to clipboard!');
  };
  const handleShareMore = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Kavach Safety Circle Invite',
        text: 'Join my safety circle on Kavach to stay secure and protected.',
        url: inviteUrl,
      }).catch((err) => console.log(err));
    } else {
      handleCopyLink();
    }
  };

  return (
    <>
      {/* INVITE BOTTOM SHEET MODAL (Matching Add Family Member Style) */}
      {showInviteScreen && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-end justify-center pointer-events-auto transition-opacity duration-300">
          <div className="w-full max-w-md bg-[#141A3A] border-t border-[#232A56] rounded-t-[28px] p-5 pb-8 flex flex-col items-center relative animate-slide-up shadow-2xl">
            {/* Drag Handle */}
            <div className="w-10 h-0.75 bg-[#232A56] rounded-full mb-5"></div>

            {/* Close Button */}
            <button
              onClick={() => setShowInviteScreen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Title & Subtitle */}
            <div className="text-center mb-6 mt-1">
              <h2 className="text-[20px] font-bold text-white tracking-wide font-display">Share Invite Link</h2>
              <p className="text-[12px] text-gray-400 mt-0.5 font-medium font-sans">Invite your family to join your safety circle</p>
            </div>

            {/* Options List */}
            <div className="w-full flex flex-col gap-2.5">
              {/* WhatsApp Card */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full bg-[#101633] border border-[#232A56] hover:bg-[#141A3A] transition-all rounded-[20px] p-3 flex items-center justify-between text-left group shadow-lg cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-[#00D26A]/15 flex items-center justify-center border border-[#232A56] group-hover:scale-105 transition-transform">
                    <svg className="w-5.5 h-5.5 text-[#00D26A]" style={{ fill: '#00D26A' }} viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.16 1.448 4.75 1.45 5.536.002 10.04-4.5 10.044-10.04.002-2.684-1.04-5.207-2.93-7.098C16.564 1.575 14.04 1.53 11.35 1.53c-5.536 0-10.037 4.5-10.04 10.043-.001 1.765.485 3.36 1.455 4.887l-.95 3.473 3.567-.935zm12.33-6.23c-.33-.165-1.95-.963-2.25-1.074-.3-.11-.52-.165-.74.165-.22.33-.85 1.074-1.04 1.29-.19.22-.385.247-.715.082-1.815-.91-2.98-1.51-4.04-3.33-.11-.2-.22-.38-.2-.55.19-.22.38-.44.57-.66.19-.22.25-.385.385-.66.13-.275.06-.52-.03-.685-.09-.165-.74-1.785-1.01-2.44-.27-.648-.54-.56-.74-.57-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.41-.3.33-1.15 1.127-1.15 2.75 0 1.62 1.18 3.19 1.35 3.41.17.22 2.33 3.56 5.65 4.99.79.34 1.4.54 1.88.7.792.25 1.51.21 2.08.13.63-.09 1.95-.8 2.22-1.57.27-.77.27-1.43.19-1.57-.08-.14-.3-.22-.63-.385z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-white leading-tight font-display">WhatsApp</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium font-sans">Share invite link via WhatsApp</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* SMS Card */}
              <button
                onClick={handleShareSMS}
                className="w-full bg-[#101633] border border-[#232A56] hover:bg-[#141A3A] transition-all rounded-[20px] p-3 flex items-center justify-between text-left group shadow-lg cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-[#7C4DFF]/15 flex items-center justify-center border border-[#232A56] group-hover:scale-105 transition-transform">
                    <svg className="w-5.5 h-5.5 text-[#7C4DFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-white leading-tight font-display">SMS</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium font-sans">Send invite via text message</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* Copy Link Card */}
              <button
                onClick={handleCopyLink}
                className="w-full bg-[#101633] border border-[#232A56] hover:bg-[#141A3A] transition-all rounded-[20px] p-3 flex items-center justify-between text-left group shadow-lg cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-slate-500/10 flex items-center justify-center border border-[#232A56] group-hover:scale-105 transition-transform">
                    <svg className="w-5.5 h-5.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-white leading-tight font-display">Copy Link</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium font-sans">Copy invite link to clipboard</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>

              {/* More Options Card */}
              <button
                onClick={handleShareMore}
                className="w-full bg-[#101633] border border-[#232A56] hover:bg-[#141A3A] transition-all rounded-[20px] p-3 flex items-center justify-between text-left group shadow-lg cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[14px] bg-slate-500/10 flex items-center justify-center border border-[#232A56] group-hover:scale-105 transition-transform">
                    <svg className="w-5.5 h-5.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-white leading-tight font-display">More Options</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 font-medium font-sans">Share using other system apps</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS For Animations */}
      <style>{`
        @keyframes dash {
          from { stroke-dashoffset: 264; }
          to { stroke-dashoffset: 21.12; }
        }
        @keyframes spin-dot {
          from { transform: rotate(0deg); }
          to { transform: rotate(331.2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(52,211,153,1); }
          50% { box-shadow: 0 0 20px rgba(52,211,153,0.8), 0 0 30px rgba(52,211,153,0.4); }
        }
        @keyframes grow-bar {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-dash {
          animation: dash 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-spin-dot {
          animation: spin-dot 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .-glow {
          animation: pulse-glow 2s infinite ease-in-out;
        }
        .animate-grow-bar {
          animation: grow-bar 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          transform-origin: bottom;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-fade-in-delayed {
          opacity: 0;
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>

      <div className="w-full text-slate-200 font-sans px-1 pt-1 pb-32 flex justify-center bg-transparent">
        <div className="w-full max-w-[480px] space-y-2.5">

          {activeAlert ? (
            /* ── ACTIVE ALERT TOP CARD ── */
            <SOSAlertCard 
              member={activeAlert} 
              onResolve={async () => {
                try {
                  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
                  await updateDoc(doc(db, 'alerts', activeAlert.id), {
                    status: 'cancelled',
                    closedAt: serverTimestamp(),
                    closureReason: 'guardian_resolved'
                  });
                } catch (err) {
                  console.error("Failed to resolve alert:", err);
                }
              }}
              onTrack={() => {
                navigateToTracking(activeAlert.victimUid || 'dummy-1');
              }}
            />
          ) : allCircleMembers.length === 0 ? (
            /* ── EMPTY STATE TOP CARD ── */
            <div 
              className="relative w-full overflow-hidden rounded-[26px] border border-[#2C1C72]/70 shadow-[0_0_0_1px_rgba(108,61,255,.12),0_0_24px_rgba(108,61,255,.08)]"
              style={{
                background: 'linear-gradient(180deg, #10102B 0%, #0C0C22 50%, #09091B 100%)'
              }}
            >
              {/* Image with fade */}
              <div className="relative w-full">
                <img
                  src="/guardian-crowd.png"
                  alt="No family members yet"
                  className="w-full h-[210px] object-cover object-center mx-auto mt-0 opacity-85 scale-x-102"
                />
                <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-[#0C0C22] to-transparent" />
              </div>
              {/* Text */}
              <div className="px-6 pt-1 pb-4 text-center relative z-10 -mt-1">
                <h2 className="text-[17px] font-bold text-[#F7F7FD] tracking-tight font-display">No One Under Your Protection Yet</h2>
                <p className="text-[11.5px] text-[#A6A9C8] mt-1.5 leading-relaxed font-sans max-w-[320px] mx-auto">
                  People you add as their guardian will appear here. You'll receive their updates and be able to help them in an emergency.
                </p>
              </div>
              {/* Buttons (Stacked Vertically to match reference image) */}
              <div className="flex flex-col gap-2.5 px-6 pb-6">
                <button
                  onClick={() => setShowAddFirstPersonScreen(true)}
                  className="w-full bg-[#6C3DFF] hover:bg-[#7B55FF] active:scale-95 text-white text-[13px] font-bold py-3 rounded-[16px] flex items-center justify-center gap-2 transition-all shadow-[0_8px_30px_rgba(108,61,255,.35)] cursor-pointer font-sans"
                >
                  <UserPlus size={16} strokeWidth={2.5} />
                  Add Your First Person
                </button>
                <button
                  onClick={() => setShowInviteScreen(true)}
                  className="w-full bg-[#0B0B22]/50 border border-[#2C1C72]/70 hover:bg-[#6C3DFF]/15 active:scale-95 text-white text-[13px] font-bold py-3 rounded-[16px] flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
                >
                  <QrCode size={16} className="text-[#a27bff]" strokeWidth={2} />
                  Share Your QR
                </button>
              </div>
            </div>
          ) : (
            /* ── PEOPLE UNDER YOUR PROTECTION CARD ── */
            <div
              className="w-full overflow-hidden rounded-[24px] p-5 border border-[#2C1C72] shadow-[0_0_0_1px_rgba(96,55,255,.18),0_0_18px_rgba(96,55,255,.08)] flex flex-col"
              style={{
                background: 'linear-gradient(180deg, #10102B 0%, #0C0C22 50%, #09091B 100%)',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}
            >
              <h3 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3 text-left">
                PEOPLE UNDER YOUR PROTECTION
              </h3>

              {/* Members List */}
              <div className="flex flex-col gap-2.5">
                {Object.values(familyData).slice(0, 3).map((member: any) => {
                  const hasActiveAlert = activeAlertsList.some((a: any) => a.victimUid === member.uid);
                  const isTravelling = member.statusType === 'Travelling';
                  const isExpanded = expandedMemberId === member.uid;
                  
                  return (
                    <div
                      key={member.uid}
                      onClick={() => {
                        setActiveMemberId(member.uid);
                        setExpandedMemberId(isExpanded ? null : member.uid);
                      }}
                      className={`bg-[#101633]/60 hover:bg-[#141A3A]/80 border ${
                        isExpanded ? 'border-[#2C1C72] shadow-[0_0_18px_rgba(96,55,255,.05)]' : 'border-[#232A56]/40 hover:border-[#7C4DFF]/40'
                      } rounded-[20px] p-3.5 flex flex-col transition-all duration-300 cursor-pointer group`}
                    >
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          {/* Avatar container */}
                          <div className="relative">
                            <div className={`w-11 h-11 rounded-full p-0.5 border ${
                              isExpanded ? 'border-[#00D26A] shadow-[0_0_8px_rgba(0,210,106,0.3)]' : hasActiveAlert ? 'border-red-500 ' : isTravelling ? 'border-amber-500' : 'border-indigo-500/30'
                            } bg-gradient-to-b from-transparent to-black/20 flex items-center justify-center`}>
                              <img
                                src={member.avatar || "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=200&auto=format&fit=crop"}
                                alt={member.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            </div>
                            {/* Live green dot indicator */}
                            {member.isLive && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00D26A] border-2 border-[#0C0C22] rounded-full" />
                            )}
                          </div>

                          {/* Name and Relation */}
                          <div className="text-left">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-[14px] font-bold text-white leading-none font-display tracking-tight">
                                {member.name}
                              </h4>
                              {isExpanded && (
                                <span className="bg-[#00D26A]/12 text-[#00D26A] text-[7.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  {member.relation}
                                </span>
                              )}
                            </div>
                            {!isExpanded && (
                              <span className="inline-block bg-[#7C4DFF]/12 text-[#a874ff] text-[8.5px] px-2 py-0.5 rounded-full font-bold mt-1 tracking-wide">
                                {member.relation}
                              </span>
                            )}
                            {isExpanded && (
                              <span className="text-[10px] text-slate-400 mt-1 font-sans flex items-center gap-1">
                                <Home size={10} className="text-slate-500" /> At Home
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right Status */}
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end text-right font-sans">
                            {hasActiveAlert ? (
                              <>
                                <div className="bg-red-500/12 text-[#FF2D2D] text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-[#FF2D2D] rounded-full" />
                                  SOS ACTIVE
                                </div>
                                <span className="text-[9px] text-[#FF2D2D] font-semibold mt-0.5">TAP TO TRACK</span>
                              </>
                            ) : isTravelling ? (
                              <>
                                <div className="bg-amber-500/12 text-amber-400 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <Car size={10} className="text-amber-400" />
                                  RIDE SAFE ACTIVE
                                </div>
                                {!isExpanded && <span className="text-[9.5px] text-slate-400 mt-0.5 font-medium">ETA 18 min</span>}
                              </>
                            ) : (
                              <>
                                <div className="bg-[#00D26A]/12 text-[#00D26A] text-[9.5px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <ShieldCheck size={11} className="text-[#00D26A]" />
                                  SAFE
                                </div>
                                {!isExpanded && <span className="text-[9.5px] text-slate-400 mt-0.5 font-medium">{member.lastCheckIn}</span>}
                              </>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                          )}
                        </div>
                      </div>

                      {/* Expandable Details Area */}
                      {isExpanded && (
                        <div 
                          className="mt-3.5 pt-3.5 border-t border-[#232A56]/30 flex flex-col gap-3.5 animate-fade-in"
                          onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking details content
                        >
                          {/* Details Grid */}
                          <div className="grid grid-cols-3 gap-2">
                            {/* Card 1: Last Checkin */}
                            <div className="bg-[#0B0B22] border border-[#232A56]/30 rounded-xl p-2.5 flex flex-col text-left">
                              <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase mb-1">LAST CHECK-IN</span>
                              <span className="text-[11px] font-bold text-white leading-tight">{member.lastCheckIn}</span>
                            </div>

                            {/* Card 2: Battery */}
                            <div className="bg-[#0B0B22] border border-[#232A56]/30 rounded-xl p-2.5 flex flex-col text-left">
                              <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase mb-1">BATTERY</span>
                              <span className="text-[11px] text-[#00D26A] font-bold flex items-center gap-1 leading-tight">
                                <Battery size={12} className="text-[#00D26A]" /> {member.battery}
                              </span>
                            </div>

                            {/* Card 3: Protection Status */}
                            <div className="bg-[#0B0B22] border border-[#232A56]/30 rounded-xl p-2.5 flex flex-col text-left">
                              <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase mb-1">PROTECTION</span>
                              <span className="text-[11px] text-[#00D26A] font-bold flex items-center gap-1 leading-tight">
                                <ShieldCheck size={12} className="text-[#00D26A] fill-[#00D26A]/10" /> Active
                              </span>
                            </div>
                          </div>

                          {/* Track Live Action Button */}
                          <button
                            onClick={() => {
                              navigateToTracking(member.uid);
                            }}
                            className="w-full bg-[#00D26A] hover:bg-[#00c060] text-[#0A0A25] font-black text-[12px] py-2.5 rounded-[12px] flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,210,106,0.25)] transition-all active:scale-[0.98] border-none cursor-pointer uppercase tracking-wider"
                          >
                            <MapPin size={14} className="text-[#0A0A25]" fill="currentColor" />
                            TRACK LIVE
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom View All button */}
              <button
                onClick={onViewFamilyCircle}
                className="w-full mt-3.5 pt-3 border-t border-white/[0.04] text-center text-[#7C4DFF] hover:text-[#916eff] text-[12px] font-bold tracking-wider uppercase bg-transparent border-none cursor-pointer transition-colors"
              >
                View All People
              </button>
            </div>
          )}

          {/* ── GUARDIAN REQUESTS CARD (1:1 Reference Design Match) ── */}
          <div className="bg-[#0B0B22] border border-[#2C1C72]/70 rounded-[22px] p-4 my-2.5 shadow-[0_0_0_1px_rgba(108,61,255,.12),0_0_24px_rgba(108,61,255,.08)] relative overflow-hidden font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-3 font-sans">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#a874ff]" />
                <h2 className="text-[11px] font-bold tracking-wider text-white uppercase">GUARDIAN REQUESTS</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-0.5 ${
                  guardianRequests.length > 0 ? 'bg-[#EF4444] text-white ' : 'bg-[#1e1744] text-[#a874ff]'
                }`}>
                  {guardianRequests.length}
                </span>
              </div>
              <button 
                onClick={() => toast.info(guardianRequests.length > 0 ? "Viewing pending requests" : "No pending requests")}
                className="text-[11px] text-[#a874ff] font-medium flex items-center hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer"
              >
                View All <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {guardianRequests.length > 0 ? (
              /* Grid Cards Container (Side-by-Side 2 Columns) */
              <div className="grid grid-cols-2 gap-2.5">
                {guardianRequests.map((req) => (
                  <div 
                    key={req.id}
                    className="bg-[#121027]/90 border border-white/[0.08] hover:border-[#7C4DFF]/50 transition-all rounded-[16px] p-3 flex flex-col justify-between min-w-0 shadow-sm hover:shadow-[0_4px_16px_rgba(124,77,255,0.15)]"
                  >
                    <div>
                      <div className="flex items-start gap-2">
                        <img 
                          src={req.avatar} 
                          alt={req.name} 
                          className="w-8.5 h-8.5 rounded-full object-cover border border-white/15 shrink-0 shadow-sm"
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <h4 className="text-[12px] font-bold text-white leading-tight truncate">{req.name}</h4>
                          <p className="text-[9.5px] text-slate-300 leading-tight font-normal mt-0.5 line-clamp-2">{req.text}</p>
                        </div>
                      </div>
                      <p className="text-[8.5px] text-slate-400 font-medium mt-2 mb-2 text-left">{req.time}</p>
                    </div>

                    {/* Compact Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-white/[0.04]">
                      <button
                        onClick={() => handleDeclineGuardianRequest(req.id, req.name)}
                        className="flex-1 py-1.5 px-1 bg-[#1c1936] hover:bg-[#28234a] text-slate-300 hover:text-white text-[10px] font-bold rounded-lg border border-white/10 transition-all cursor-pointer active:scale-95 text-center truncate"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptGuardianRequest(req.id, req.name)}
                        className="flex-1 py-1.5 px-1 bg-gradient-to-r from-[#7C4DFF] to-[#6035f5] hover:from-[#8b5cf6] hover:to-[#7C4DFF] text-white text-[10px] font-bold rounded-lg border border-white/10 transition-all cursor-pointer shadow-[0_2px_10px_rgba(124,77,255,0.35)] active:scale-95 text-center truncate"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Exact 1:1 Match of Reference Image 1 for Empty State */
              <div className="bg-[#070514] border border-white/[0.04] rounded-[18px] p-6 flex flex-col items-center justify-center text-center my-0.5 shadow-inner">
                {/* Glowing Center Icon Circle with double users */}
                <div className="w-18 h-18 rounded-full bg-[#161036]/80 border border-[#7C4DFF]/35 flex items-center justify-center text-[#a874ff] shadow-[0_0_25px_rgba(124,77,255,0.25)] mb-3.5 relative">
                  <Users size={28} />
                </div>

                <h3 className="text-[15px] font-medium text-white tracking-tight mb-1">No guardian requests</h3>
                <p className="text-[11px] text-slate-400 font-normal leading-relaxed max-w-[260px] mb-4">
                  When someone requests to be a guardian, you'll see it here.
                </p>

                <button 
                  onClick={() => setShowInviteScreen(true)}
                  className="bg-[#151033] border border-[#7C4DFF]/40 hover:bg-[#1e1748] text-[#a874ff] hover:text-white px-4.5 py-2 rounded-full text-[11px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-[0_4px_15px_rgba(124,77,255,0.15)] active:scale-95"
                >
                  <UserPlus size={14} strokeWidth={2} /> Invite Guardians
                </button>
              </div>
            )}
          </div>


          {/* LIVE STATUS OVERVIEW CARD */}
          <div className="bg-[#0B0B22] border border-[#2C1C72]/70 rounded-[20px] p-4 shadow-[0_0_0_1px_rgba(108,61,255,.12),0_0_24px_rgba(108,61,255,.08)]">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-4 font-sans">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#a874ff]" />
                <h2 className="text-[10.5px] font-semibold tracking-wider text-[#f1f1f4] uppercase">
                  LIVE STATUS OVERVIEW
                </h2>
              </div>

              <button className="text-[10.5px] text-[#a874ff] font-medium flex items-center hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer">
                View All <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {/* Content Section */}
            {activeActivities.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {activeActivities.map((activity, idx) => (
                  <div 
                    key={idx} 
                    className="flex flex-col gap-2 p-2.5 bg-[#101633]/40 border border-[#232A56]/40 rounded-[18px] shadow-sm relative overflow-hidden group"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Icon container */}
                      <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center ${activity.iconBg}`}>
                        <activity.icon size={16} />
                      </div>
                      {/* Text info */}
                      <div className="text-left flex-1 min-w-0 font-sans">
                        <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase">{activity.title}</span>
                        <h4 className="text-[12.5px] font-bold text-white mt-0.5 leading-tight truncate">{activity.name}</h4>
                        <p className="text-[9.5px] text-slate-400 mt-0.5 leading-none">{activity.subtitle}</p>
                      </div>
                    </div>
                    {/* Action Button */}
                    <button
                      onClick={() => {
                        navigateToTracking(activity.memberId);
                      }}
                      className={`w-full py-2 rounded-lg text-[9.5px] font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer bg-[#0c0d1b]/50 ${activity.btnColor}`}
                    >
                      <Navigation size={11} className="rotate-45" fill="currentColor" />
                      {activity.btnText}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-row items-center gap-4">

                {/* Map Image Area */}
                <div className="relative w-[160px] h-[60px] bg-[#140b28] rounded-[12px] overflow-hidden flex items-center justify-center border border-[#1a1036] shrink-0">
                  <img
                    src="/map.png"
                    alt="Live Activity Map"
                    className="w-full h-full object-cover opacity-60"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "https://placehold.co/160x60/140b28/a374ff?text=Map+Image";
                    }}
                  />
                </div>

                {/* Text Area */}
                <div className="flex-1 text-left">
                  <h3 className="text-[#F7F7FD] text-[9.5px] font-medium tracking-wide">
                    No Active Activities
                  </h3>
                  <p className="text-[#A6A9C8] text-[8.5px] font-normal leading-[1.4] mt-0.5">
                    Ride Safe, Live Location Sharing<br />
                    or Safe Timer updates will appear here.
                  </p>
                </div>

              </div>
            )}
          </div>


          {/* QUICK PROTECT ACTIONS */}
          <div className="bg-[#0B0B22] border border-[#2C1C72]/70 rounded-[20px] p-4 shadow-[0_0_0_1px_rgba(108,61,255,.12),0_0_24px_rgba(108,61,255,.08)] flex flex-col gap-4">
            <div className="flex justify-between items-center font-sans">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#a874ff]" />
                <h2 className="text-[10.5px] font-semibold tracking-wider text-[#f1f1f4] uppercase">QUICK PROTECT ACTIONS</h2>
              </div>
              <button className="text-[10.5px] text-[#a874ff] font-medium flex items-center hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer">
                Customise <Settings className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <IconButton
                icon={Navigation}
                label="Navigate"
                sublabel="Go to Location"
                onClick={() => {
                  if (activeMember?.latitude && activeMember?.longitude) {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeMember.latitude},${activeMember.longitude}`);
                  } else {
                    alert("Select a family member with active coordinates to navigate.");
                  }
                }}
              />
              <IconButton
                icon={Phone}
                label="Call Member"
                sublabel="Direct Call"
                onClick={() => {
                  if (activeMember?.phone) {
                    window.open(`tel:${activeMember.phone}`);
                  } else {
                    alert("No phone contact configured for the selected member.");
                  }
                }}
              />
              <IconButton icon={UserCheck} label="Alert Protectors" sublabel="Notify Nearby" />
              <IconButton icon={Share2} label="Share Location" sublabel="With Others" />
              <IconButton
                icon={AlertTriangle}
                label="SOS"
                sublabel="I Need Help"
                isSos={true}
                onClick={() => {
                  const state = useKavachStore.getState();
                  state.setSOSActive(!state.isSOSActive);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">


            {/* NEW ANIMATED PROTECTION SCORE */}
            {/* NEW ANIMATED PROTECTION SCORE */}
            <div ref={scoreRef}>
              <Card className="p-0 bg-[#0a0b12] border border-[#1f212e] overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center px-4 pt-3.5 pb-1.5 font-sans">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-3.5 h-3.5 text-[#a874ff]" />
                    <h2 className="text-[10.5px] font-semibold tracking-wider text-[#f1f1f4] uppercase">PROTECTION SCORE</h2>
                  </div>
                  <button className="text-[10.5px] text-[#a874ff] font-medium flex items-center hover:opacity-80 transition-opacity">
                    Learn more <ChevronRight className="w-3 h-3 ml-0.5" />
                  </button>
                </div>

                {/* Main Content */}
                <div className="flex flex-row items-center gap-4 px-2 py-2">

                  {/* Left: Circular Score */}
                  {/* Left: Circular Score */}
                  <div className="relative w-[115px] h-[115px] flex-shrink-0 animate-fade-in-delayed font-sans" style={{ animationDelay: '100ms' }}>
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00D26A" />
                          <stop offset="100%" stopColor="#00D26A" />
                        </linearGradient>
                      </defs>
                      {/* Background Track */}
                      <circle cx="50" cy="50" r="42" fill="transparent" stroke="#101633" strokeWidth="6" strokeLinecap="round" />
                      {/* Progress Track */}
                      <circle cx="50" cy="50" r="42" fill="transparent" stroke={allCircleMembers.length === 0 ? "#232A56" : "url(#ringGrad)"} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray="264" strokeDashoffset={allCircleMembers.length === 0 ? "264" : (scoreVisible ? "21.12" : "264")} className={scoreVisible && allCircleMembers.length > 0 ? "animate-dash" : ""} style={{ filter: allCircleMembers.length === 0 ? 'none' : 'drop-shadow(0px 0px 6px rgba(0,210,106,0.4))', transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </svg>

                    {/* Glowing Dot overlay */}
                    {allCircleMembers.length > 0 && (
                      <div className="absolute inset-0" style={{ transform: scoreVisible ? 'rotate(331.2deg)' : 'rotate(0deg)', transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                        {/* Top value mathematically derived from 50 - 42 radius = 8% */}
                        <div className="absolute top-[8%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] bg-white rounded-full border-[2px] border-[#00D26A] shadow-[0_0_8px_rgba(0,210,106,1)] -glow"></div>
                      </div>
                    )}

                    {/* Inner Score Texts */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-1.5">
                      <Shield className="absolute w-14 h-14 text-white/[0.02]" fill="currentColor" />
                      <div className="text-[24px] font-medium text-white leading-none tracking-tight z-10 drop-shadow-md">
                        <AnimatedNumber end={allCircleMembers.length === 0 ? 0 : 92} duration={1500} trigger={scoreVisible} />
                      </div>
                      <div className="text-[8.5px] text-slate-400 z-10 mt-0.5">/100</div>
                      <div className={`mt-1 text-[7px] font-semibold px-1.5 py-0.5 rounded-full z-10 border shadow-sm tracking-wider ${allCircleMembers.length === 0
                        ? 'bg-slate-900/80 text-slate-400 border-slate-700/50'
                        : 'bg-[#142C23] text-[#00D26A] border-[#00D26A]/20'
                        }`}>
                        {allCircleMembers.length === 0 ? 'INACTIVE' : 'EXCELLENT'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status and Chart */}
                  <div className="flex flex-col flex-1 w-full justify-center font-sans">
                    <div className="flex items-center gap-1.5 animate-fade-in-delayed" style={{ animationDelay: '200ms' }}>
                      <span className={`font-medium text-[16px] ${allCircleMembers.length === 0 ? 'text-slate-400' : 'text-[#00D26A]'}`}>
                        {allCircleMembers.length === 0 ? 'Inactive' : 'Excellent'}
                      </span>
                      {allCircleMembers.length === 0 ? (
                        <Shield className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-[#00D26A]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-[1.4] animate-fade-in-delayed" style={{ animationDelay: '300ms' }}>
                      {allCircleMembers.length === 0
                        ? 'Add people you protect to start improving your protection score.'
                        : <>You're doing great! Keep it up<br />to stay safe and secure.</>
                      }
                    </p>

                    <div className="w-full h-[1px] bg-white/5 my-3 animate-fade-in-delayed" style={{ animationDelay: '400ms' }}></div>

                    <div className="flex items-end justify-between h-[85px] px-1 w-full max-w-[260px]">
                      <AnimatedBar value={allCircleMembers.length === 0 ? 0 : 40} label="M" number={allCircleMembers.length === 0 ? "0" : "78"} isOrange={allCircleMembers.length === 0 ? false : true} delay={200} trigger={scoreVisible} />
                      <AnimatedBar value={allCircleMembers.length === 0 ? 0 : 60} label="T" number={allCircleMembers.length === 0 ? "0" : "85"} isOrange={false} delay={300} trigger={scoreVisible} />
                      <AnimatedBar value={allCircleMembers.length === 0 ? 0 : 70} label="W" number={allCircleMembers.length === 0 ? "0" : "90"} isOrange={false} delay={400} trigger={scoreVisible} />
                      <AnimatedBar value={allCircleMembers.length === 0 ? 0 : 85} label="T" number={allCircleMembers.length === 0 ? "0" : "95"} isOrange={false} delay={500} trigger={scoreVisible} />
                      <AnimatedBar value={allCircleMembers.length === 0 ? 0 : 65} label="F" number={allCircleMembers.length === 0 ? "0" : "88"} isOrange={false} delay={600} trigger={scoreVisible} />
                      <AnimatedBar value={allCircleMembers.length === 0 ? 0 : 75} label="S" number={allCircleMembers.length === 0 ? "0" : "92"} isOrange={false} delay={700} trigger={scoreVisible} />
                      <AnimatedBar value={allCircleMembers.length === 0 ? 0 : 80} label="S" number={allCircleMembers.length === 0 ? "0" : "94"} isOrange={false} delay={800} trigger={scoreVisible} />
                    </div>
                  </div>
                </div>

                {/* Bottom Tip to Improve Banner */}
                <div className="mx-2 mb-2.5 mt-1.5 p-2.5 px-3 bg-[#101633] border border-[#232A56] rounded-xl flex items-center justify-between animate-fade-in-delayed" style={{ animationDelay: '900ms' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#7C4DFF]/15 flex items-center justify-center flex-shrink-0 border border-[#7C4DFF]/20 shadow-inner">
                      <Shield className="w-4 h-4 text-[#7C4DFF] fill-[#7C4DFF]/20" />
                    </div>
                    <div>
                      <h4 className="text-[10.5px] font-normal text-white/90 leading-tight">Tip to improve</h4>
                      <p className="text-[10px] text-slate-400 leading-tight mt-1 pr-2 max-w-[240px]">Keep your location sharing and SOS features active for maximum protection.</p>
                    </div>
                  </div>
                  <button className="text-[11px] font-medium text-[#7C4DFF] flex flex-shrink-0 items-center whitespace-nowrap hover:text-indigo-300 transition-colors">
                    View Tips <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>

              </Card>
            </div>
          </div>

          {/* FAMILY PROTECTION OVERVIEW */}
          {/* TIPS FOR YOU CARD */}
          <div className="relative w-full bg-[#0B0B22] border border-[#2C1C72]/70 rounded-[20px] p-4 overflow-hidden flex flex-col gap-4 shadow-[0_0_0_1px_rgba(108,61,255,.12),0_0_24px_rgba(108,61,255,.08)]">
            {/* Background Shield Image */}
            <img
              src="/ShieldGraphic.png"
              alt="Shield Graphic"
              className="absolute right-3 bottom-3 w-[140px] h-[55px] object-contain object-bottom pointer-events-none z-0 mix-blend-lighten opacity-90"
            />

            {/* Header Section */}
            <div className="flex justify-between items-center relative z-10">
              {/* Left Header */}
              <h2 className="text-[#f1f1f4] text-[10.5px] font-semibold tracking-wider uppercase font-sans">
                Tips For You
              </h2>
              {/* Right Link */}
              <button
                onClick={onViewFamilyCircle}
                className="text-[#a874ff] text-[10.5px] font-medium hover:opacity-80 transition-opacity flex items-center gap-0.5"
              >
                View Tips <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Content Section */}
            <div className="flex items-center gap-4 relative z-10 w-full sm:w-[75%] font-sans">

              {/* Glowing Bulb Icon */}
              <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0" style={{
                background: '#1b0c3f',
                border: '1px solid #3d1c8c',
                boxShadow: '0 0 10px rgba(71, 31, 158, 0.3)'
              }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white">
                  <path d="M12 2.25a7.125 7.125 0 00-7.125 7.125c0 2.5 1.25 4.6 3.1 5.9.35.25.6.65.65 1.1l.1 2.3c.05.75.7 1.3 1.45 1.3h5.65c.75 0 1.4-.55 1.45-1.3l.1-2.3c.05-.45.3-.85.65-1.1 1.85-1.3 3.1-3.4 3.1-5.9A7.125 7.125 0 0012 2.25z" />
                  <path d="M9.75 21.75a2.25 2.25 0 004.5 0v-1.5h-4.5v1.5z" />
                </svg>
              </div>

              {/* Text Content */}
              <div className="flex flex-col">
                <p className="text-[#F7F7FD] text-[9.5px] font-medium tracking-wide leading-snug">
                  Add your family, friends or roommates
                </p>
                <p className="text-[#A6A9C8] text-[8.5px] mt-0.5 font-normal">
                  to start protecting them.
                </p>
              </div>

            </div>
          </div>

          {/* NEARBY PROTECTORS CARD */}
          <div className="bg-[#0B0B22] border border-[#2C1C72]/70 rounded-[20px] p-4 shadow-[0_0_0_1px_rgba(108,61,255,.12),0_0_24px_rgba(108,61,255,.08)] flex flex-col gap-4">
            {/* Header Section */}
            <div className="flex justify-between items-center">
              {/* Left Header */}
              <h2 className="text-[#f1f1f4] text-[10.5px] font-semibold tracking-wider uppercase font-sans">
                Nearby Protectors
              </h2>
              {/* Right Link */}
              <button
                className="text-[#a874ff] text-[10.5px] font-medium hover:opacity-80 transition-opacity"
              >
                View Nearby
              </button>
            </div>

            {/* Content Section */}
            {/* Content Section */}
            {activeAlert ? (
              <div className="flex items-center justify-between font-sans relative z-10 w-full">
                {/* Left Side: X Protectors nearby details */}
                <div className="flex flex-col text-left">
                  <p className="text-[17px] font-bold text-[#F7F7FD] tracking-tight leading-tight">
                    <span className="text-[#FFD215] font-black">{displayProtectorCount}</span> Protectors nearby
                  </p>
                  <p className="text-[9.5px] text-[#A6A9C8] mt-1.5 font-normal leading-normal">
                    Active within 2.5 km of {activeAlert.name}'s SOS location
                  </p>
                  {/* Overlapping Avatars Row */}
                  <div className="flex items-center -space-x-2 mt-3.5">
                    {displayProtectorAvatars.slice(0, 4).map((src, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0B0B22] overflow-hidden flex-shrink-0 shadow-md">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {displayProtectorCount > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-[#0B0B22] bg-[#141226] flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-[9.5px] font-bold text-[#a874ff]">+{displayProtectorCount - 4}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Animated Concentric Purple Radar with Shield */}
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  {/* Concentric rings */}
                  <div className="absolute inset-0 rounded-full border border-[#7C4DFF]/15 hidden opacity-35" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-[8px] rounded-full border border-[#7C4DFF]/25 " />
                  <div className="absolute inset-[16px] rounded-full bg-[#1b0c3f] border border-[#7C4DFF]/50 flex items-center justify-center shadow-[0_0_15px_rgba(124,77,255,0.45)]">
                    <div className="flex flex-col items-center justify-center text-[#7C4DFF]">
                      <Shield size={13} className="fill-[#7C4DFF]/20" />
                      <span className="text-[8.5px] font-black mt-0.5">3</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between font-sans relative z-10 w-full">
                <div className="flex items-center gap-3.5">
                  {/* Radar Icon */}
                  <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0" style={{
                    background: '#1b0c3f',
                    border: '1px solid #3d1c8c',
                    boxShadow: '0 0 10px rgba(71, 31, 158, 0.3)'
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white">
                      <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
                      <circle cx="12" cy="12" r="6" strokeOpacity="0.5" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    </svg>
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col text-left">
                    <p className="text-[#F7F7FD] text-[9.5px] font-medium tracking-wide leading-snug">
                      Protectors in your area
                    </p>
                    <p className="text-[#A6A9C8] text-[8.5px] mt-0.5 font-normal">
                      will help in emergencies.
                    </p>
                  </div>
                </div>

                {/* Avatar Row */}
                <div className="flex items-center -space-x-1.5 flex-shrink-0">
                  {[
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
                  ].map((src, i) => (
                    <div key={i} className="w-6.5 h-6.5 rounded-full border border-[#0a0b12] overflow-hidden flex-shrink-0">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-6.5 h-6.5 rounded-full border border-[#0a0b12] bg-[#141226] flex items-center justify-center flex-shrink-0">
                    <span className="text-[7.5px] font-bold text-[#a874ff]">+3</span>
                  </div>
                </div>
              </div>
            )}
          </div>



        </div>
      </div>

      {/* ── PENDING REQUESTS NOTIFICATION BANNER ── */}
      <AnimatePresence>
        {pendingRequests.length > 0 && !showRequestSheet && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-0 right-0 z-[9000] flex justify-center px-4"
          >
            <button
              onClick={() => {
                setSelectedRequest(pendingRequests[0]);
                setShowRequestSheet(true);
              }}
              className="w-full max-w-md bg-[#141A3A]/95 backdrop-blur-xl border border-[#7C4DFF]/40 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-[0_8px_32px_rgba(124,77,255,0.25)] cursor-pointer active:scale-95 transition-all"
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#7C4DFF]/20 border border-[#7C4DFF]/40 flex items-center justify-center">
                  <Bell size={16} className="text-[#7C4DFF]" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF2D2D] text-[9px] font-black text-white flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-[13px] font-black text-white">New Family Request</p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {pendingRequests[0].senderName} wants to join your circle
                </p>
              </div>
              <div className="flex gap-2">
                <span className="text-[11px] text-[#7C4DFF] font-bold">Review →</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REQUEST REVIEW BOTTOM SHEET ── */}
      <AnimatePresence>
        {showRequestSheet && selectedRequest && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRequestSheet(false)}
              className="fixed inset-0 z-[9500] bg-black/60 backdrop-blur-sm"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-[9600] flex justify-center"
            >
              <div className="w-full max-w-md bg-[#0C1020] border-t border-[#2B315F] rounded-t-[32px] px-5 pt-3 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,.55)] flex flex-col font-sans select-none min-h-[480px]">
                {/* Drag Handle */}
                <div className="w-12 h-1 bg-[#2B315F]/60 rounded-full mx-auto mb-4" />

                {isApprovedSuccess && approvedConnectionData ? (
                  /* Connected! Success Screen */
                  <div className="flex-1 flex flex-col items-center justify-between text-center py-4 font-sans h-full">
                    {/* Circle Pulsing Green Check Ring */}
                    <div className="relative w-24 h-24 rounded-full bg-[#00D26A]/10 border-[3.5px] border-[#00D26A] flex items-center justify-center shadow-[0_0_30px_rgba(0,210,106,0.35)] mt-4 mb-4">
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
                        transition={{ duration: 0.6 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </motion.svg>
                    </div>

                    <h2 className="text-white text-[22px] font-extrabold tracking-wide font-display">
                      Connected!
                    </h2>
                    <p className="text-[#848896] text-[14px] font-medium mt-1.5 leading-relaxed max-w-[240px]">
                      You are now each other's<br />
                      Mutual Guardian.
                    </p>

                    {/* Linked Avatars Row */}
                    <div className="flex items-center justify-center gap-5 mt-6 mb-7">
                      {/* Sender Avatar */}
                      <div className="w-[70px] h-[70px] rounded-full border-[3px] border-[#2B315F] overflow-hidden shadow-lg bg-[#141A3A] flex-shrink-0">
                        {approvedConnectionData.senderPhoto ? (
                          <img src={approvedConnectionData.senderPhoto} alt="sender" className="w-full h-full object-cover" />
                        ) : (
                          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop" alt="avatar" className="w-full h-full object-cover" />
                        )}
                      </div>

                      {/* Connection Link Icon */}
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      </div>

                      {/* Receiver Avatar */}
                      <div className="w-[70px] h-[70px] rounded-full border-[3px] border-[#2B315F] overflow-hidden shadow-lg bg-[#141A3A] flex-shrink-0">
                        {approvedConnectionData.receiverPhoto ? (
                          <img src={approvedConnectionData.receiverPhoto} alt="receiver" className="w-full h-full object-cover" />
                        ) : (
                          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop" alt="avatar" className="w-full h-full object-cover" />
                        )}
                      </div>
                    </div>

                    {/* Done Action Button */}
                    <button
                      onClick={() => {
                        setShowRequestSheet(false);
                        setSelectedRequest(null);
                        setIsApprovedSuccess(false);
                      }}
                      className="w-full bg-[#7C4DFF] hover:bg-[#6c3df0] active:scale-[0.98] transition-all text-white text-[16px] font-bold py-[17px] rounded-[18px] flex items-center justify-center shadow-[0_4px_20px_rgba(124,77,255,0.3)] cursor-pointer border-none font-display"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  /* Standard Review Invitation request detail view */
                  <>
                    {/* Back / Title header */}
                    <div className="flex items-center justify-between mb-6 w-full h-8 px-1">
                      <button onClick={() => setShowRequestSheet(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors border border-white/5">
                        <ArrowLeft size={18} className="text-white" strokeWidth={2.5} />
                      </button>
                      <h1 className="text-white text-[17px] font-semibold text-center tracking-wide">
                        Request Received
                      </h1>
                      <div className="w-8 h-8" />
                    </div>

                    {/* Overlapping Shield & Avatar Profile */}
                    <div className="relative w-full flex flex-col items-center justify-center mb-5 mt-2">
                      <div className="w-20 h-20 rounded-full bg-[#1b0c3f] border border-[#7C4DFF]/30 flex items-center justify-center relative shadow-[0_0_24px_rgba(124,77,255,0.15)]">
                        <svg width="38" height="38" viewBox="0 0 24 24" fill="currentColor" className="text-[#8A61FF]">
                          <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </div>
                      </div>

                      <div className="w-16 h-16 rounded-full border-[3px] border-[#0C1020] bg-[#141A3A] shadow-lg flex items-center justify-center overflow-hidden -mt-5 z-10">
                        {selectedRequest.senderPhoto ? (
                          <img src={selectedRequest.senderPhoto} alt={selectedRequest.senderName} className="w-full h-full object-cover" />
                        ) : (
                          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop" alt="avatar" className="w-full h-full object-cover" />
                        )}
                      </div>
                    </div>

                    {/* Bold Sender and Request message */}
                    <div className="text-center px-4 mb-6">
                      <h2 className="text-white text-[19px] font-extrabold tracking-wide">
                        {selectedRequest.senderName}
                      </h2>
                      <p className="text-[#848896] text-[13.5px] font-medium leading-relaxed mt-2.5 max-w-[285px] mx-auto">
                        wants to add you to his<br />
                        <span className="text-white font-bold">Family Circle</span> as your mutual guardian.
                      </p>
                    </div>

                    {/* Features Checklist Panel */}
                    <div className="bg-[#131A31] border border-[#2B315F] rounded-2xl p-4.5 flex flex-col gap-4 mb-7 text-left mx-1">
                      <div className="flex items-center gap-3">
                        <div className="w-6.5 h-6.5 rounded-lg bg-[#7C4DFF]/10 flex items-center justify-center shrink-0 border border-[#7C4DFF]/20">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C4DFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-[14px] text-gray-300 font-medium">You will receive SOS alerts.</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-6.5 h-6.5 rounded-lg bg-[#7C4DFF]/10 flex items-center justify-center shrink-0 border border-[#7C4DFF]/20">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C4DFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-[14px] text-gray-300 font-medium">You can view live location.</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-6.5 h-6.5 rounded-lg bg-[#7C4DFF]/10 flex items-center justify-center shrink-0 border border-[#7C4DFF]/20">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C4DFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-[14px] text-gray-300 font-medium">You can help each other in emergencies.</span>
                      </div>
                    </div>

                    {/* Accept and Decline Grid Buttons */}
                    <div className="flex gap-3 px-1">
                      <button
                        onClick={() => handleApproveRequest(selectedRequest)}
                        className="flex-1 bg-[#7C4DFF] hover:bg-[#6c3df0] active:scale-[0.98] transition-all text-white text-[15.5px] font-bold py-[17px] rounded-[18px] flex items-center justify-center shadow-[0_4px_20px_rgba(124,77,255,0.3)] cursor-pointer border-none font-display"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(selectedRequest)}
                        className="flex-1 bg-[#131A31] hover:bg-[#1C2443] border border-[#2B315F] active:scale-[0.98] transition-all text-gray-300 text-[15.5px] font-bold py-[17px] rounded-[18px] flex items-center justify-center cursor-pointer font-display"
                      >
                        Decline
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ADD YOUR FIRST PERSON FULL SCREEN OVERLAY ── */}
      {showAddFirstPersonScreen && createPortal(
        <div className="fixed inset-0 z-[2000000] bg-[#04050D] overflow-y-auto font-sans flex justify-center text-slate-100 selection:bg-[#6C3DFF]/30">
          <div className="w-full max-w-[440px] p-3 min-h-screen flex flex-col justify-start">
            <div className="relative min-h-[calc(100vh-24px)] w-full rounded-[28px] bg-[#070715] border border-[#2D1E72] overflow-hidden shadow-[0_0_0_1px_rgba(108,61,255,.12),0_0_40px_rgba(108,61,255,.10)] before:absolute before:inset-0 before:rounded-[28px] before:border before:border-white/[0.03] before:pointer-events-none flex flex-col pb-8">
            
            {/* === HEADER === */}
            <div className="px-6 pt-4 shrink-0">
              <button
                onClick={() => setShowAddFirstPersonScreen(false)}
                className="w-8 h-8 rounded-full bg-[#1A1A24] border border-[#2A2A35] flex items-center justify-center cursor-pointer hover:bg-[#252532] transition-colors"
              >
                <ArrowLeft size={16} className="text-white" />
              </button>

              <div className="text-center mt-1">
                <h1 className="text-[22px] font-bold text-white tracking-tight leading-tight">
                  Add Your First Person
                </h1>
                <p className="text-[11.5px] text-[#8C8CA1] mt-1 font-medium leading-relaxed max-w-[280px] mx-auto">
                  Add someone you want to protect.
                  <br />They will appear in your guardian list.
                </p>
              </div>
            </div>

            {/* === SHIELD ILLUSTRATION === */}
            <div className="relative w-full shrink-0 flex justify-center mt-1 px-4">
              <div className="relative w-full max-w-[390px] h-[185px] overflow-hidden">
                <img
                  src="/guardian-crowd.png"
                  alt="Guardian Crowd"
                  className="w-full h-full object-cover object-center scale-x-102 opacity-90"
                />
                {/* Soft bottom overlay to blend with dark background */}
                <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-[#070715] to-transparent" />
              </div>
            </div>

            {/* === MAIN CONTENT === */}
            <div className="px-6 relative z-40 mt-1">
              
              {/* Add Methods Selection */}
              <div className="text-left">
                <h2 className="text-[13px] font-bold text-white mb-2">How do you want to add?</h2>
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* Add Manually */}
                  <button
                    onClick={() => setAddMethod('manual')}
                    className={`flex flex-col items-center justify-start pt-3 pb-2.5 px-1 rounded-[16px] border transition-all duration-200 cursor-pointer h-[112px] ${
                      addMethod === 'manual'
                        ? 'bg-[#130E2A] border-[#7A4DFF] shadow-[inset_0_0_18px_rgba(122,77,255,.35),0_0_18px_rgba(122,77,255,.2)]'
                        : 'bg-[#0D0D1F] border-[#2A2157] shadow-[inset_0_1px_0_rgba(255,255,255,.02),0_10px_25px_rgba(0,0,0,.22)] hover:bg-[#0D0D1F]/95'
                    }`}
                  >
                    <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                      addMethod === 'manual' ? 'bg-[#6C3DFF] text-white shadow-[0_4px_12px_rgba(108,61,255,0.4)]' : 'bg-[#6C3DFF]/10 text-[#6C3DFF]'
                    }`}>
                      <UserPlus size={18} strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-bold leading-tight mb-0.5 text-white">Add Manually</span>
                    <span className="text-[9px] text-[#675C82] text-center font-medium leading-snug">Enter their details</span>
                  </button>

                  {/* Scan QR */}
                  <button
                    onClick={() => {
                      setAddMethod('qr');
                      setShowAddFirstPersonScreen(false);
                      onViewFamilyCircle?.();
                    }}
                    className={`flex flex-col items-center justify-start pt-3 pb-2.5 px-1 rounded-[16px] border transition-all duration-200 cursor-pointer h-[112px] ${
                      addMethod === 'qr'
                        ? 'bg-[#130E2A] border-[#00D26A] shadow-[inset_0_0_18px_rgba(0,210,106,.35),0_0_18px_rgba(0,210,106,.2)]'
                        : 'bg-[#0D0D1F] border-[#2A2157] shadow-[inset_0_1px_0_rgba(255,255,255,.02),0_10px_25px_rgba(0,0,0,.22)] hover:bg-[#0D0D1F]/95'
                    }`}
                  >
                    <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                      addMethod === 'qr' ? 'bg-[#00D26A] text-white shadow-[0_4px_12px_rgba(0,210,106,0.4)]' : 'bg-[#00D26A]/10 text-[#00D26A]'
                    }`}>
                      <QrCode size={18} strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-bold leading-tight mb-0.5 text-white">Scan QR Code</span>
                    <span className="text-[9px] text-[#675C82] text-center font-medium leading-snug">Scan their QR code</span>
                  </button>

                  {/* Share Link */}
                  <button
                    onClick={() => {
                      setAddMethod('link');
                      setShowAddFirstPersonScreen(false);
                      setShowInviteScreen(true);
                    }}
                    className={`flex flex-col items-center justify-start pt-3 pb-2.5 px-1 rounded-[16px] border transition-all duration-200 cursor-pointer h-[112px] ${
                      addMethod === 'link'
                        ? 'bg-[#130E2A] border-[#8A61FF] shadow-[inset_0_0_18px_rgba(138,97,255,.35),0_0_18px_rgba(138,97,255,.2)]'
                        : 'bg-[#0D0D1F] border-[#2A2157] shadow-[inset_0_1px_0_rgba(255,255,255,.02),0_10px_25px_rgba(0,0,0,.22)] hover:bg-[#0D0D1F]/95'
                    }`}
                  >
                    <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                      addMethod === 'link' ? 'bg-[#8A61FF] text-white shadow-[0_4px_12px_rgba(138,97,255,0.4)]' : 'bg-[#8A61FF]/10 text-[#8A61FF]'
                    }`}>
                      <Link size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] font-bold leading-tight mb-0.5 text-white">Share Invite Link</span>
                    <span className="text-[9px] text-[#675C82] text-center font-medium leading-snug">Send invite link</span>
                  </button>
                </div>
              </div>

              {/* Form Fields (Manual Mode) */}
              {addMethod === 'manual' && (
                <div className="mt-4 flex flex-col gap-2.5">
                  <h2 className="text-[13px] font-bold text-white mb-0">Person Details</h2>

                  {/* Full Name */}
                  <div className="flex items-center h-[46px] bg-[#0E0E21] border border-[#24204D] rounded-[16px] px-3 focus-within:border-[#6C3DFF] focus-within:shadow-[0_0_0_3px_rgba(108,61,255,.15)] transition-all">
                    <User size={18} className="text-[#7A6E9B] mr-3 shrink-0" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-transparent text-[13px] font-medium text-white focus:outline-none placeholder:text-[#727694]"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="flex items-center h-[46px] bg-[#0E0E21] border border-[#24204D] rounded-[16px] px-3 focus-within:border-[#6C3DFF] focus-within:shadow-[0_0_0_3px_rgba(108,61,255,.15)] transition-all">
                    <Phone size={18} className="text-[#7A6E9B] shrink-0" strokeWidth={1.5} />
                    <div className="flex items-center gap-1.5 ml-3 cursor-pointer shrink-0">
                      <svg width="18" height="12" viewBox="0 0 30 20" className="rounded-[2px] shrink-0 drop-shadow-sm">
                        <rect width="30" height="6.66" fill="#FF9933"/>
                        <rect y="6.66" width="30" height="6.66" fill="#FFFFFF"/>
                        <rect y="13.33" width="30" height="6.66" fill="#138808"/>
                        <circle cx="15" cy="10" r="2.8" stroke="#000080" strokeWidth="0.8" fill="none"/>
                        <circle cx="15" cy="10" r="0.8" fill="#000080"/>
                        <path d="M15,7.2 L15,12.8 M12.2,10 L17.8,10 M13,8 L17,12 M13,12 L17,8" stroke="#000080" strokeWidth="0.4" />
                      </svg>
                      <span className="text-[13px] font-medium text-white">+91</span>
                      <ChevronDown size={14} className="text-[#7A6E9B]" strokeWidth={2} />
                    </div>
                    <div className="h-5 w-[1px] bg-[#24204D] mx-3 shrink-0" />
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full bg-transparent text-[13px] font-medium text-white focus:outline-none placeholder:text-[#727694]"
                    />
                  </div>

                  {/* Relationship */}
                  <div className="relative">
                    <div className="flex items-center h-[46px] bg-[#0E0E21] border border-[#24204D] rounded-[16px] px-3 focus-within:border-[#6C3DFF] focus-within:shadow-[0_0_0_3px_rgba(108,61,255,.15)] transition-all">
                      <Users size={18} className="text-[#7A6E9B] mr-3 shrink-0" strokeWidth={1.5} />
                      <select
                        value={newRelation}
                        onChange={(e) => setNewRelation(e.target.value)}
                        className={`w-full bg-transparent text-[13px] font-medium focus:outline-none cursor-pointer appearance-none ${newRelation ? 'text-white' : 'text-[#727694]'}`}
                      >
                        <option value="" disabled hidden>Relationship</option>
                        <option value="Daughter" className="bg-[#0E0E21] text-white">Daughter</option>
                        <option value="Sister" className="bg-[#0E0E21] text-white">Sister</option>
                        <option value="Wife" className="bg-[#0E0E21] text-white">Wife</option>
                        <option value="Mother" className="bg-[#0E0E21] text-white">Mother</option>
                        <option value="Friend" className="bg-[#0E0E21] text-white">Friend</option>
                        <option value="Other" className="bg-[#0E0E21] text-white">Other</option>
                      </select>
                      <ChevronDown size={16} className="text-[#7A6E9B] pointer-events-none absolute right-3" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Protection Settings */}
                  <h2 className="text-[13px] font-bold text-white mt-1.5 mb-0.5">Protection Settings</h2>
                  <div className="flex items-center justify-between p-3 bg-[#111126] border border-[#28235A] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-[32px] h-[32px] rounded-full bg-[#6C3DFF]/15 text-[#8A61FF] flex items-center justify-center shrink-0">
                        <ShieldCheck size={16} strokeWidth={2} />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-white leading-tight">Default Protection</h4>
                        <p className="text-[9.5px] text-[#8C8CA1] font-medium mt-0.5 leading-snug max-w-[200px]">
                          They will share live location during SOS and critical alerts.
                        </p>
                      </div>
                    </div>
                    {/* iOS-style Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsDefaultProtection(!isDefaultProtection)}
                      className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isDefaultProtection ? 'bg-[#6C3DFF]' : 'bg-[#2A2A35]'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isDefaultProtection ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={handleAddManually}
                    className="w-full h-[46px] mt-1 bg-[#6C3DFF] hover:bg-[#5B33D6] active:scale-[0.98] text-white text-[13.5px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(108,61,255,0.4)] cursor-pointer"
                  >
                    Add to My Protection
                    <ChevronRight size={16} strokeWidth={2.5} />
                  </button>

                  {/* Secure Footer */}
                  <div className="flex items-center justify-center gap-1.5 mt-3 text-[#646478]">
                    <Lock size={12} />
                    <span className="text-[11px] font-medium">All data is end-to-end encrypted and secure.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
      {/* ── SENDER CONNECTION SUCCESS MODAL ── */}
      <AnimatePresence>
        {showSenderSuccessModal && senderSuccessData && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowSenderSuccessModal(false);
                setSenderSuccessData(null);
              }}
              className="fixed inset-0 z-[100000] bg-black/75 backdrop-blur-sm"
            />
            {/* Modal Screen */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-0 z-[100001] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-full max-w-sm bg-[#0C1020] border border-[#2B315F] rounded-[32px] px-6 pt-6 pb-8 shadow-2xl pointer-events-auto flex flex-col items-center text-center font-sans">
                {/* Close Button */}
                <div className="w-full flex justify-end mb-1">
                  <button 
                    onClick={() => {
                      setShowSenderSuccessModal(false);
                      setSenderSuccessData(null);
                    }} 
                    className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center cursor-pointer border-none text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Circle Pulsing Green Check Ring */}
                <div className="relative w-22 h-22 rounded-full bg-[#00D26A]/10 border-[3.5px] border-[#00D26A] flex items-center justify-center shadow-[0_0_24px_rgba(0,210,106,0.3)] mb-5">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00D26A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h2 className="text-white text-[21px] font-extrabold tracking-wide font-display">
                  Connected!
                </h2>
                <p className="text-[#848896] text-[13.5px] font-medium mt-1.5 leading-relaxed max-w-[220px]">
                  You are now each other's<br />
                  Mutual Guardian.
                </p>

                {/* Linked Avatars Row */}
                <div className="flex items-center justify-center gap-4 mt-7 mb-7">
                  {/* Sender Avatar */}
                  <div className="w-16 h-16 rounded-full border-[3px] border-[#2B315F] overflow-hidden shadow-lg bg-[#141A3A] flex-shrink-0">
                    {senderSuccessData.receiverPhoto ? (
                      <img src={senderSuccessData.receiverPhoto} alt="sender" className="w-full h-full object-cover" />
                    ) : (
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop" alt="avatar" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Connection Link Icon */}
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>

                  {/* Receiver Avatar */}
                  <div className="w-16 h-16 rounded-full border-[3px] border-[#2B315F] overflow-hidden shadow-lg bg-[#141A3A] flex-shrink-0">
                    {senderSuccessData.senderPhoto ? (
                      <img src={senderSuccessData.senderPhoto} alt="receiver" className="w-full h-full object-cover" />
                    ) : (
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop" alt="avatar" className="w-full h-full object-cover" />
                    )}
                  </div>
                </div>

                {/* Awesome Action Button */}
                <button
                  onClick={() => {
                    setShowSenderSuccessModal(false);
                    setSenderSuccessData(null);
                  }}
                  className="w-full bg-[#7C4DFF] hover:bg-[#6c3df0] active:scale-[0.98] transition-all text-white text-[15.5px] font-bold py-[15px] rounded-[16px] flex items-center justify-center shadow-[0_4px_16px_rgba(124,77,255,0.25)] cursor-pointer border-none font-display"
                >
                  Awesome!
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}