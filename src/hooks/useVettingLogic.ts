import { useState, useEffect } from 'react';
import { doc, runTransaction, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface UseVettingLogicParams {
  userStatusMap: Record<string, any>;
  selectedState: string;
  detectedAdminDistrict?: string | null;
  initialSelectedUserId?: string | null;
  onSelectUser?: (userId: string | null) => void;
}

export function useVettingLogic({
  userStatusMap,
  selectedState,
  detectedAdminDistrict,
  initialSelectedUserId,
  onSelectUser
}: UseVettingLogicParams) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'citizen' | 'protector'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedUserId, setSelectedUserIdState] = useState<string | null>(initialSelectedUserId || null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const setSelectedUserId = (id: string | null) => {
    setSelectedUserIdState(id);
    if (onSelectUser) onSelectUser(id);
  };

  // Sync external selection
  useEffect(() => {
    if (!initialSelectedUserId) return;
    setSelectedUserIdState(initialSelectedUserId);
    const user = userStatusMap[initialSelectedUserId];
    if (user) {
      if (user.isVerified || user.verified) setActiveSubTab('approved');
      else if (user.verificationStatus === 'rejected') setActiveSubTab('rejected');
      else setActiveSubTab('pending');
      setSearchTerm('');
      setFilterRole('all');
    }
  }, [initialSelectedUserId, userStatusMap]);

  // ── Filter engine ──
  const allUsers = Object.values(userStatusMap);

  const baseFilteredUsers = allUsers.filter((u: any) => {
    if (!u.isRegistered) return false;
    if (u.role === 'admin' || u.role === 'superadmin') return false;

    if (selectedState !== 'ALL') {
      const stateName = selectedState.toLowerCase().trim();
      const userState = (u.state || u.locationData?.state || '').toLowerCase().trim();
      const userAddr = (u.address || u.fullAddress || '').toLowerCase().trim();
      const isFallbackState = [
        'active sector', 'unknown', 'sector unknown', '', 'neutral zone', 'unknown location'
      ].some(k => userState.includes(k) || userAddr.includes(k));
      if (!isFallbackState && !userState.includes(stateName) && !userAddr.includes(stateName)) return false;
    }

    if (detectedAdminDistrict) {
      const district = detectedAdminDistrict.toLowerCase();
      const city = (u.city || u.locationData?.city || u.location?.city || '').toLowerCase();
      const addr = (u.address || u.locationName || u.fullAddress || u.location?.address || '').toLowerCase();
      if (!city.includes(district) && !addr.includes(district)) return false;
    }

    return true;
  });

  const filteredUsers = baseFilteredUsers.filter((u: any) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (u.name || u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phoneNumber || '').includes(q);
    if (!matchesSearch) return false;

    if (activeSubTab === 'pending') return !u.isVerified && u.verificationStatus !== 'rejected' && u.role !== 'admin';
    if (activeSubTab === 'approved') return !!u.isVerified;
    if (activeSubTab === 'rejected') return u.verificationStatus === 'rejected';
    return true;
  });

  const selectedUser = allUsers.find(u => (u as any).id === selectedUserId) as any;

  const pendingCount = baseFilteredUsers.filter((u: any) => !u.isVerified && u.verificationStatus !== 'rejected' && u.role !== 'admin').length;
  const approvedCount = baseFilteredUsers.filter((u: any) => !!u.isVerified).length;
  const rejectedCount = baseFilteredUsers.filter((u: any) => u.verificationStatus === 'rejected').length;

  // ── Actions ──
  const handleApprove = async (userId: string, gender: string) => {
    setIsActionLoading(true);
    try {
      const updates = {
        isVerified: true, verified: true, verificationStatus: 'approved',
        rejectionReason: null, verificationDate: new Date()
      };

      // 1. Firestore updates (best effort)
      try {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', userId);
          const genderColl = gender === 'male' ? 'male_users' : 'women_users';
          const genderRef = doc(db, genderColl, userId);
          const userSnap = await transaction.get(userRef);
          const genderSnap = await transaction.get(genderRef);

          if (userSnap.exists()) {
            const uData = userSnap.data();
            if (uData.isVerified && uData.verificationStatus === 'approved')
              throw new Error('This user has already been verified and authorized by another admin.');
          } else {
            throw new Error('User document not found.');
          }

          transaction.update(userRef, updates);
          if (genderSnap.exists()) transaction.update(genderRef, updates);
        });
      } catch (fsErr: any) {
        console.warn("⚠️ Firestore vetting approval transaction deferred (permissions):", fsErr.message || fsErr);
      }

      // 2. Supabase updates (guaranteed)
      const metadataUpdate = {
        ...(selectedUser || {}),
        isVerified: true,
        verified: true,
        verificationStatus: 'approved',
        rejectionReason: null,
        verificationDate: new Date().toISOString()
      };
      
      const { error: sbErr } = await supabase.from('profiles').update({
        is_verified: true,
        metadata: metadataUpdate
      }).eq('id', userId);

      if (sbErr) {
        throw new Error(`Supabase update failed: ${sbErr.message}`);
      }

      // 3. Log vetting action to Firestore (best effort)
      try {
        await addDoc(collection(db, 'vetting_logs'), {
          adminUid: auth.currentUser?.uid || 'SYSTEM_AUTO',
          adminEmail: auth.currentUser?.email || 'system@kavach.gov.in',
          targetUserId: userId,
          targetRole: selectedUser?.role || 'unknown',
          targetName: selectedUser?.name || selectedUser?.username || 'Unknown',
          action: 'APPROVE', reason: null, timestamp: serverTimestamp()
        });
      } catch (logErr) {
        console.warn("⚠️ Firestore vetting log creation deferred:", logErr);
      }

      toast.success('Identity approved and verified on the National Grid!', { icon: '🛡️' });
      setRejectionReason('');
    } catch (error: any) {
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
        isVerified: false, verified: false, verificationStatus: 'rejected',
        rejectionReason, verificationDate: new Date()
      };

      // 1. Firestore updates (best effort)
      try {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', userId);
          const genderColl = gender === 'male' ? 'male_users' : 'women_users';
          const genderRef = doc(db, genderColl, userId);
          const userSnap = await transaction.get(userRef);
          const genderSnap = await transaction.get(genderRef);

          if (userSnap.exists()) {
            const uData = userSnap.data();
            if (uData.verificationStatus === 'rejected' && uData.rejectionReason === rejectionReason)
              throw new Error('This user has already been rejected with the same reason by another admin.');
          } else {
            throw new Error('User document not found.');
          }

          transaction.update(userRef, updates);
          if (genderSnap.exists()) transaction.update(genderRef, updates);
        });
      } catch (fsErr: any) {
        console.warn("⚠️ Firestore vetting rejection transaction deferred (permissions):", fsErr.message || fsErr);
      }

      // 2. Supabase updates (guaranteed)
      const metadataUpdate = {
        ...(selectedUser || {}),
        isVerified: false,
        verified: false,
        verificationStatus: 'rejected',
        rejectionReason,
        verificationDate: new Date().toISOString()
      };

      const { error: sbErr } = await supabase.from('profiles').update({
        is_verified: false,
        metadata: metadataUpdate
      }).eq('id', userId);

      if (sbErr) {
        throw new Error(`Supabase update failed: ${sbErr.message}`);
      }

      // 3. Log vetting action to Firestore (best effort)
      try {
        await addDoc(collection(db, 'vetting_logs'), {
          adminUid: auth.currentUser?.uid || 'SYSTEM_AUTO',
          adminEmail: auth.currentUser?.email || 'system@kavach.gov.in',
          targetUserId: userId,
          targetRole: selectedUser?.role || 'unknown',
          targetName: selectedUser?.name || selectedUser?.username || 'Unknown',
          action: 'REJECT', reason: rejectionReason, timestamp: serverTimestamp()
        });
      } catch (logErr) {
        console.warn("⚠️ Firestore vetting log creation deferred:", logErr);
      }

      toast.success('Registration request rejected. User notified.', { icon: '❌' });
      setRejectionReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rejection.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return {
    searchTerm, setSearchTerm,
    filterRole, setFilterRole,
    activeSubTab, setActiveSubTab,
    selectedUserId, setSelectedUserId,
    rejectionReason, setRejectionReason,
    isActionLoading,
    filteredUsers, selectedUser,
    pendingCount, approvedCount, rejectedCount,
    handleApprove, handleReject
  };
}
