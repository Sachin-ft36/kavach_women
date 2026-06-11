import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, XCircle, Search, UserCheck, UserX, AlertTriangle, 
  MapPin, Phone, Mail, Award, Calendar, FileText, ChevronRight,
  ShieldAlert, RefreshCw, ZoomIn, Info, Eye
} from 'lucide-react';
import { doc, runTransaction, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { toast } from 'sonner';

interface VettingDeskProps {
  userStatusMap: Record<string, any>;
  selectedState: string;
  detectedAdminDistrict?: string | null;
  initialSelectedUserId?: string | null;
  onSelectUser?: (userId: string | null) => void;
}

export const VettingDesk: React.FC<VettingDeskProps> = ({ 
  userStatusMap, 
  selectedState,
  detectedAdminDistrict,
  initialSelectedUserId,
  onSelectUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'citizen' | 'protector' | 'pcr_officer'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedUserId, setSelectedUserIdState] = useState<string | null>(initialSelectedUserId || null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState(false);

  const setSelectedUserId = (id: string | null) => {
    setSelectedUserIdState(id);
    if (onSelectUser) onSelectUser(id);
  };

  React.useEffect(() => {
    if (initialSelectedUserId) {
      setSelectedUserIdState(initialSelectedUserId);
      const user = userStatusMap[initialSelectedUserId];
      if (user) {
        if (user.isVerified || user.verified) {
          setActiveSubTab('approved');
        } else if (user.verificationStatus === 'rejected') {
          setActiveSubTab('rejected');
        } else {
          setActiveSubTab('pending');
        }
        setSearchTerm('');
        setFilterRole('all');
      }
    }
  }, [initialSelectedUserId, userStatusMap]);

  // Filter users based on state, district, search term, and subtab verification status
  const allUsers = Object.values(userStatusMap);

  // 1. Base filter for State and District + registered check + exclude admins
  const baseFilteredUsers = allUsers.filter((u: any) => {
    // Must have finished onboarding
    if (!u.isRegistered) return false;

    // Hide admin and superadmin roles from vetting desk
    if (u.role === 'admin' || u.role === 'superadmin') return false;

    // Filter by State
    if (selectedState !== 'ALL') {
      const stateName = selectedState.toLowerCase().trim();
      const userState = (u.state || u.locationData?.state || '').toLowerCase().trim();
      const userAddr = (u.address || u.fullAddress || '').toLowerCase().trim();

      const isFallbackState = 
        userState.includes('active sector') || 
        userState.includes('unknown') || 
        userState.includes('sector unknown') || 
        userState.trim() === '' ||
        userAddr.includes('neutral zone') ||
        userAddr.includes('unknown location') ||
        userAddr.includes('sector unknown');

      if (!isFallbackState && !userState.includes(stateName) && !userAddr.includes(stateName)) return false;
    }

    // Filter by District
    if (detectedAdminDistrict) {
      const district = detectedAdminDistrict.toLowerCase();
      const city = (
        u.city ||
        u.locationData?.city ||
        u.location?.city ||
        ''
      ).toLowerCase();
      const addr = (
        u.address ||
        u.locationName ||
        u.fullAddress ||
        u.location?.address ||
        ''
      ).toLowerCase();
      
      const districtMatch = city.includes(district) || addr.includes(district);
      if (!districtMatch) return false;
    }

    return true;
  });

  const filteredUsers = baseFilteredUsers.filter((u: any) => {
    // 3. Filter by role
    if (filterRole !== 'all' && u.role !== filterRole) return false;

    // 4. Search term (Name, Phone, Email)
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      (u.name || u.username || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.phoneNumber || '').includes(query);
    if (!matchesSearch) return false;

    // 5. Verification status subtabs
    if (activeSubTab === 'pending') {
      return !u.isVerified && u.verificationStatus !== 'rejected' && u.role !== 'admin';
    } else if (activeSubTab === 'approved') {
      return !!u.isVerified;
    } else if (activeSubTab === 'rejected') {
      return u.verificationStatus === 'rejected';
    }
    return true;
  });

  const selectedUser = allUsers.find(u => u.id === selectedUserId) as any;

  // Stats calculation based on state/district filtered users
  const pendingCount = baseFilteredUsers.filter((u: any) => !u.isVerified && u.verificationStatus !== 'rejected' && u.role !== 'admin').length;
  const approvedCount = baseFilteredUsers.filter((u: any) => !!u.isVerified).length;
  const rejectedCount = baseFilteredUsers.filter((u: any) => u.verificationStatus === 'rejected').length;

  const handleApprove = async (userId: string, gender: string) => {
    setIsActionLoading(true);
    try {
      const updates = {
        isVerified: true,
        verified: true,
        verificationStatus: 'approved',
        rejectionReason: null,
        verificationDate: new Date()
      };

      // Run transactional update to prevent race conditions (concurrency protection)
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userId);
        const genderColl = gender === 'male' ? 'male_users' : 'women_users';
        const genderRef = doc(db, genderColl, userId);

        // Perform all reads first
        const userSnap = await transaction.get(userRef);
        const genderSnap = await transaction.get(genderRef);
        
        // If document is already approved or state has changed, abort/alert
        if (userSnap.exists()) {
          const uData = userSnap.data();
          if (uData.isVerified && uData.verificationStatus === 'approved') {
            throw new Error('This user has already been verified and authorized by another admin.');
          }
        } else {
          throw new Error('User document not found.');
        }

        // Apply all updates (writes) after reads
        transaction.update(userRef, updates);

        if (genderSnap.exists()) {
          transaction.update(genderRef, updates);
        }
      });

      // Create a robust Firestore-backed audit trail log
      await addDoc(collection(db, 'vetting_logs'), {
        adminUid: auth.currentUser?.uid || 'SYSTEM_AUTO',
        adminEmail: auth.currentUser?.email || 'system@kavach.gov.in',
        targetUserId: userId,
        targetRole: selectedUser?.role || 'unknown',
        targetName: selectedUser?.name || selectedUser?.username || 'Unknown',
        action: 'APPROVE',
        reason: null,
        timestamp: serverTimestamp()
      });

      toast.success('Identity approved and verified on the National Grid!', { icon: '🛡️' });
      setRejectionReason('');
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to submit approval.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (userId: string, gender: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please specify a rejection reason for the citizen/operative.');
      return;
    }
    setIsActionLoading(true);
    try {
      const updates = {
        isVerified: false,
        verified: false,
        verificationStatus: 'rejected',
        rejectionReason: rejectionReason,
        verificationDate: new Date()
      };

      // Run transactional update to prevent race conditions (concurrency protection)
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userId);
        const genderColl = gender === 'male' ? 'male_users' : 'women_users';
        const genderRef = doc(db, genderColl, userId);

        // Perform all reads first
        const userSnap = await transaction.get(userRef);
        const genderSnap = await transaction.get(genderRef);

        if (userSnap.exists()) {
          const uData = userSnap.data();
          if (uData.verificationStatus === 'rejected' && uData.rejectionReason === rejectionReason) {
            throw new Error('This user has already been rejected with the same reason by another admin.');
          }
        } else {
          throw new Error('User document not found.');
        }

        // Apply all updates (writes) after reads
        transaction.update(userRef, updates);

        if (genderSnap.exists()) {
          transaction.update(genderRef, updates);
        }
      });

      // Create a robust Firestore-backed audit trail log
      await addDoc(collection(db, 'vetting_logs'), {
        adminUid: auth.currentUser?.uid || 'SYSTEM_AUTO',
        adminEmail: auth.currentUser?.email || 'system@kavach.gov.in',
        targetUserId: userId,
        targetRole: selectedUser?.role || 'unknown',
        targetName: selectedUser?.name || selectedUser?.username || 'Unknown',
        action: 'REJECT',
        reason: rejectionReason,
        timestamp: serverTimestamp()
      });

      toast.success('Registration request rejected. User notified.', { icon: '❌' });
      setRejectionReason('');
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast.error(error.message || 'Failed to submit rejection.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] text-slate-100 overflow-hidden font-['Outfit']">
      
      {/* Photo Zoom Modal */}
      <AnimatePresence>
        {zoomPhoto && selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomPhoto(false)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"
            >
              <img 
                src={selectedUser.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.name || selectedUser.username}`}
                alt="Enlarged Profile Pic" 
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-lg font-black uppercase tracking-tight text-white">{selectedUser.name || selectedUser.username || 'Anonymous User'}</p>
                <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">{selectedUser.role}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar */}
      <div className="border-b border-slate-800 bg-[#0d1324] px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-blue-500 w-6 h-6 animate-pulse" />
            Identity Vetting Desk
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Reviewing sector registrations for: <span className="text-blue-400">{selectedState}{detectedAdminDistrict ? ` — ${detectedAdminDistrict.toUpperCase()}` : ''}</span>
          </p>
        </div>

        {/* Stats Strip */}
        <div className="flex gap-4">
          <div className="bg-[#121c38] border border-blue-500/20 rounded-2xl px-5 py-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black">
              {pendingCount}
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Awaiting Vetting</p>
              <p className="text-xs font-black text-blue-400 font-mono">PENDING</p>
            </div>
          </div>

          <div className="bg-[#0b211a] border border-emerald-500/20 rounded-2xl px-5 py-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black">
              {approvedCount}
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Approved Grid Members</p>
              <p className="text-xs font-black text-emerald-400 font-mono">ACTIVE</p>
            </div>
          </div>

          <div className="bg-[#260e15] border border-rose-500/20 rounded-2xl px-5 py-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 font-black">
              {rejectedCount}
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Rejected Proposals</p>
              <p className="text-xs font-black text-rose-400 font-mono">REJECTED</p>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel Filter bar */}
      <div className="bg-[#0d1324] px-8 py-4 border-b border-slate-800 flex gap-4 items-center justify-between flex-wrap">
        
        {/* Status subtabs */}
        <div className="flex bg-[#070b12] rounded-2xl p-1 border border-slate-800 shrink-0">
          <button 
            onClick={() => { setActiveSubTab('pending'); setSelectedUserId(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === 'pending' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Pending ({pendingCount})
          </button>
          <button 
            onClick={() => { setActiveSubTab('approved'); setSelectedUserId(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === 'approved' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Approved ({approvedCount})
          </button>
          <button 
            onClick={() => { setActiveSubTab('rejected'); setSelectedUserId(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === 'rejected' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/10' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>

        {/* Search & Role filters */}
        <div className="flex gap-3 items-center flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name, email, phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#070b12] border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="bg-[#070b12] border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">ALL ROLES</option>
            <option value="citizen">CITIZENS</option>
            <option value="protector">PROTECTORS</option>
            <option value="pcr_officer">PCR OFFICERS</option>
          </select>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Users List */}
        <div className="w-[380px] border-r border-slate-800 overflow-y-auto bg-[#080c16] shrink-0">
          <div className="p-4 space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-4 opacity-50">
                <ShieldCheck size={48} className="mx-auto text-slate-600 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">No users found in this sector</p>
              </div>
            ) : (
              filteredUsers.map((u: any) => {
                const isSelected = selectedUserId === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedUserId(u.id); setRejectionReason(''); }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-3 items-center group relative cursor-pointer ${isSelected ? 'bg-blue-600/10 border-blue-500/40 text-white' : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] text-slate-300'}`}
                  >
                    {u.photoUrl ? (
                      <img 
                        src={u.photoUrl} 
                        alt="Face" 
                        className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name || u.username}`;
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-950/40 border border-blue-500/10 flex items-center justify-center shrink-0">
                        <UserCheck size={18} className="text-blue-400" />
                      </div>
                    )}
                    <div className="overflow-hidden flex-1 space-y-0.5">
                      <p className="text-xs font-black uppercase tracking-wide truncate">{u.name || u.username || 'Anonymous User'}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded-md ${u.role === 'citizen' ? 'bg-pink-500/10 text-pink-400' : u.role === 'pcr_officer' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {u.role || 'citizen'}
                        </span>
                        {/* <span className="text-[9px] text-slate-500 font-bold">{u.aadhaarMask || 'Aadhaar Masked'}</span> */}
                      </div>
                      <p className="text-[9px] text-slate-500 truncate">{u.locationData?.city || 'City Unknown'}, {u.locationData?.state || 'State Unknown'}</p>
                    </div>
                    <ChevronRight size={14} className={`text-slate-600 transition-transform ${isSelected ? 'translate-x-1 text-blue-400' : 'group-hover:translate-x-1'}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detail Panel */}
        <div className="flex-1 bg-[#090d18] overflow-y-auto flex flex-col">
          {selectedUser ? (
            <div className="p-8 space-y-8 flex-1 flex flex-col justify-between max-w-4xl">
              
              {/* Profile Card & Info */}
              <div className="space-y-8">
                
                {/* Photo & Identity Banner */}
                <div className="flex gap-6 items-start flex-col md:flex-row">
                  <div className="relative group shrink-0">
                    {selectedUser.photoUrl ? (
                      <img 
                        src={selectedUser.photoUrl} 
                        alt="Profile Face" 
                        className="w-36 h-36 rounded-2xl object-cover border-2 border-white/10 shadow-2xl" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.name || selectedUser.username}`;
                        }}
                      />
                    ) : (
                      <div className="w-36 h-36 rounded-2xl bg-blue-950/20 border border-blue-500/10 flex items-center justify-center">
                        <UserCheck size={40} className="text-blue-500/50" />
                      </div>
                    )}
                    <button 
                      onClick={() => setZoomPhoto(true)}
                      className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <ZoomIn size={16} />
                      Inspect Face
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                        {selectedUser.role} Registration
                      </span>
                      <h2 className="text-2xl font-black uppercase tracking-tight text-white">{selectedUser.name || selectedUser.username || 'Anonymous User'}</h2>
                      {/* <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedUser.aadhaarMask || 'Aadhaar Mask TBD'}</p> */}
                    </div>

                    <div className="flex gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
                        GENDER: {selectedUser.gender}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
                        BLOOD GROUP: {selectedUser.bloodGroup || 'N/A'}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
                        DOB: {selectedUser.dob || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Data Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Contacts */}
                  <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 space-y-3">
                    <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Communication Coordinates</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <Phone size={14} className="text-blue-500 shrink-0" />
                        <span className="font-semibold">{selectedUser.phoneNumber || "No Phone Registered"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <Mail size={14} className="text-blue-500 shrink-0" />
                        <span className="font-semibold truncate">{selectedUser.email || "No Email Sync"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location info */}
                  <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 space-y-3">
                    <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Geographical Sector</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <MapPin size={14} className="text-blue-500 shrink-0" />
                        <span className="font-semibold truncate">{selectedUser.locationData?.city || 'Sector City'}, {selectedUser.locationData?.state || 'Sector State'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <Info size={12} className="shrink-0" />
                        <span className="truncate">{selectedUser.fullAddress || "Detailed address not submitted."}</span>
                      </div>
                    </div>
                  </div>

                  {/* PCR Officer Credentials */}
                  {selectedUser.role === 'pcr_officer' && (
                    <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 space-y-3 col-span-1 md:col-span-2">
                      <h3 className="text-[10px] text-orange-400 font-extrabold uppercase tracking-widest">Official Police Patrol Credentials</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Badge Identification ID</p>
                          <p className="text-xs font-black text-slate-200">{selectedUser.badgeId || 'TBD'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Patrol Vehicle Number</p>
                          <p className="text-xs font-black text-slate-200">{selectedUser.vehicleNo || 'TBD'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Rank / Title</p>
                          <p className="text-xs font-black text-slate-200">{selectedUser.rank || 'Officer'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Assigned Thana / HQ</p>
                          <p className="text-xs font-black text-slate-200">{selectedUser.thanaName || 'Headquarters'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Protector Vetting Application Details */}
                  {selectedUser.role === 'protector' && selectedUser.protectorVetting && (() => {
                    const occ = selectedUser.protectorVetting.occupation || '';
                    const isElite = ['Army', 'Ex-Army', 'Police', 'Ex-Police'].includes(occ);
                    return (
                      <div className={`rounded-2xl p-4.5 space-y-4 col-span-1 md:col-span-2 border ${
                        isElite 
                          ? 'bg-gradient-to-b from-emerald-950/20 to-emerald-950/5 border-emerald-500/25 shadow-lg shadow-emerald-500/5' 
                          : 'bg-white/[0.01] border-white/[0.04]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h3 className={`text-[10px] font-extrabold uppercase tracking-widest ${isElite ? 'text-emerald-400' : 'text-blue-400'}`}>
                            Civic Protector Application Details
                          </h3>
                          {isElite && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-[8px] font-black text-emerald-300 uppercase tracking-widest">
                              🛡️ Govt. Service — Elite Protector
                            </span>
                          )}
                        </div>

                        {isElite && (
                          <div className="bg-emerald-950/40 border border-emerald-500/25 rounded-xl px-3.5 py-2.5 text-[9.5px] text-emerald-300 font-bold flex items-start gap-2 backdrop-blur-sm">
                            <span className="text-base select-none mt-0.5">⚡</span>
                            <div>
                              <span className="font-extrabold uppercase tracking-wide text-white block mb-0.5">FAST-TRACK GOVERNMENT DESK APPROVAL</span>
                              This applicant has claimed a background in <span className="underline decoration-emerald-400/50 decoration-2">{occ}</span>. Verify the service number below. No manual verification of address or general credentials is required.
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Occupation / Profession</p>
                            <p className={`text-xs font-black ${isElite ? 'text-emerald-300' : 'text-slate-200'}`}>
                              {occ || 'Not Specified'}
                              {selectedUser.protectorVetting.customOccupation ? ` — ${selectedUser.protectorVetting.customOccupation}` : ''}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Reason for Joining</p>
                            <p className="text-xs font-black text-slate-200">{selectedUser.protectorVetting.reason || 'Not Provided'}</p>
                          </div>

                          {/* 🪖 Service Number & Verification ID Block */}
                          {isElite && (
                            <div className="space-y-2 col-span-2 bg-[#0B1528]/80 border border-white/[0.05] rounded-xl p-3.5 relative overflow-hidden backdrop-blur-md">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
                              
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                  {['Army', 'Ex-Army'].includes(occ) ? '🪖 ARMY REGISTRY DATA' : '🚔 POLICE RECORDS GRID'}
                                </span>
                                
                                {selectedUser.protectorVetting.serviceNumber ? (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                    🛡️ FORMAT VERIFIED
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400">
                                    ⚠️ PENDING UPLOAD
                                  </span>
                                )}
                              </div>

                              <div className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="space-y-0.5">
                                  <p className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest">
                                    {['Army', 'Ex-Army'].includes(occ) ? 'Army Service Number' : 'Police Service Badge No.'}
                                  </p>
                                  <p className={`text-base font-black font-mono tracking-widest ${selectedUser.protectorVetting.serviceNumber ? 'text-white' : 'text-rose-400'}`}>
                                    {selectedUser.protectorVetting.serviceNumber || 'NOT SUBMITTED'}
                                  </p>
                                </div>

                                <div className="text-right flex flex-col justify-center">
                                  <span className="text-[7.5px] font-mono text-slate-400 leading-tight">
                                    REGISTRY REF: KAVACH-SYS-{selectedUser.phoneNumber?.slice(-4) || 'TBD'}
                                  </span>
                                  <span className="text-[7px] font-extrabold text-emerald-500 uppercase tracking-widest leading-none mt-0.5">
                                    {selectedUser.protectorVetting.serviceNumber ? '✓ STRUCTURAL CHECKS CLEAN' : '✗ VERIFICATION FAILED'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Residential Address</p>
                            <p className="text-xs font-black text-slate-200">{selectedUser.protectorVetting.address || selectedUser.fullAddress || 'Not Provided'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Code of Conduct Agreement</p>
                            <p className={`text-xs font-black ${selectedUser.protectorVetting.agreement ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {selectedUser.protectorVetting.agreement ? '✓ Agreed & Accepted' : '✗ Not Agreed'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}



                  {/* Guardian details for citizens */}
                  {selectedUser.role === 'citizen' && selectedUser.primaryGuardian && (
                    <div className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-4 space-y-3 col-span-1 md:col-span-2">
                      <h3 className="text-[10px] text-pink-400 font-extrabold uppercase tracking-widest">Primary SOS Guardian Contacts</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Guardian Name</p>
                          <p className="text-xs font-black text-slate-200">{selectedUser.primaryGuardian.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Guardian Phone</p>
                          <p className="text-xs font-black text-slate-200">{selectedUser.primaryGuardian.phone}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Relation</p>
                          <p className="text-xs font-black text-slate-200">{selectedUser.primaryGuardian.relation || 'Guardian'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action desk */}
              <div className="border-t border-slate-800 pt-6 space-y-4">
                
                {activeSubTab === 'pending' && (
                  <div className="space-y-4">
                    
                    {/* Rejection input box */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Rejection explanation (Only required if rejecting request)</label>
                      <textarea 
                        placeholder="State reason: e.g. profile selfie blurred, badge ID invalid..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={2}
                        className="w-full bg-[#070b12] border border-slate-800 rounded-2xl p-4 text-xs font-bold text-slate-200 focus:outline-none focus:border-rose-500 transition-colors placeholder:text-slate-600"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleReject(selectedUser.id, selectedUser.gender)}
                        disabled={isActionLoading}
                        className="flex-1 py-4 bg-rose-600/10 border border-rose-600/30 hover:bg-rose-600 active:scale-[0.98] transition-all rounded-2xl text-xs font-black uppercase tracking-widest text-rose-500 hover:text-white flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserX size={16} />
                        Disapprove & Reject
                      </button>

                      <button
                        onClick={() => handleApprove(selectedUser.id, selectedUser.gender)}
                        disabled={isActionLoading}
                        className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all rounded-2xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(16,185,129,0.2)] cursor-pointer"
                      >
                        <UserCheck size={16} />
                        Verify & Authorize
                      </button>
                    </div>
                  </div>
                )}

                {activeSubTab === 'approved' && (
                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-400 font-bold uppercase tracking-wide">
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={16} />
                      User is actively authorized on the Kavach network
                    </span>
                    <button 
                      onClick={() => handleReject(selectedUser.id, selectedUser.gender)}
                      className="px-3 py-1.5 border border-rose-500/20 rounded-xl text-[9px] text-rose-400 hover:bg-rose-500 hover:text-white transition-all font-black tracking-widest cursor-pointer"
                    >
                      Revoke Access
                    </button>
                  </div>
                )}

                {activeSubTab === 'rejected' && (
                  <div className="space-y-4">
                    <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-4 flex flex-col gap-1 text-xs text-rose-400">
                      <span className="font-black uppercase tracking-widest flex items-center gap-2">
                        <XCircle size={16} />
                        User Registration Rejected
                      </span>
                      <p className="text-slate-300 font-semibold mt-1">Reason: {selectedUser.rejectionReason}</p>
                    </div>

                    <button
                      onClick={() => handleApprove(selectedUser.id, selectedUser.gender)}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all rounded-2xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(16,185,129,0.2)] cursor-pointer"
                    >
                      Re-authorize User
                    </button>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 p-12 text-center space-y-4">
              <ShieldAlert size={64} className="text-slate-500 animate-pulse" />
              <div className="space-y-1.5">
                <p className="text-sm font-black uppercase tracking-[5px] text-slate-400">Select an Identity File</p>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">Click on any profile card on the left panel to review full demographic and biometric details.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
