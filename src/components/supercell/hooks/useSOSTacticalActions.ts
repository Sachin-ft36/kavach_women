import { useState } from 'react';
import { toast } from 'sonner';
import { db } from '../../../firebase';
import { doc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export function useSOSTacticalActions(victimData: any, victimId: string | null, pendingAppeal: any, selectedAlert: any) {
  const [isWarnModalOpen, setIsWarnModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isOverriding, setIsOverriding] = useState(false);

  const handleAction = async (type: 'warn' | 'ban') => {
    if (!victimData) return;
    if (type === 'warn') setIsWarnModalOpen(true);
    else if (type === 'ban') {
      if (!window.confirm("CRITICAL: Block SOS access?")) return;
      await updateDoc(doc(db, 'users', (victimData as any).id || victimId), { isSOSBlocked: true, sosBlockedReason: "Repeated Grid Misuse" });
      toast.error("SOS Access Revoked");
    }
  };

  const triggerSovereignOverride = async () => {
    if (!selectedAlert) return;
    setIsOverriding(true);
    try {
      await updateDoc(doc(db, 'alerts', selectedAlert.id), {
        isSovereignOverrideActive: true,
        priority: 'SOVEREIGN_CRITICAL'
      });
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'protector')));
      const batchPromises = snap.docs.map(pDoc => 
        updateDoc(doc(db, 'users', pDoc.id), {
          currentMissionId: selectedAlert.id,
          missionStatus: 'REDIRECTED',
          isUnderSovereignCommand: true
        })
      );
      await Promise.all(batchPromises);
      toast.error("SOVEREIGN OVERRIDE ACTIVE");
      setIsOverrideModalOpen(false);
    } catch (e) { toast.error("Override Failed"); }
    finally { setIsOverriding(false); }
  };

  const handleRestoreAccess = async (uid: string) => {
    if (!window.confirm("COMMAND CENTER: Restore full tactical access?")) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        isSOSBlocked: false,
        isPermanentlyBlocked: false,
        sosBlockedReason: null,
        hasPendingWarning: false,
        sosStrikeCount: 0
      });

      if (pendingAppeal?.id) {
        await updateDoc(doc(db, 'appeals', pendingAppeal.id), {
          status: 'resolved',
          resolvedAt: serverTimestamp(),
          resolvedBy: 'SuperCell Command'
        });
      }

      toast.success("Access Restored. National Grid Updated.");
    } catch (e) { toast.error("Restoration Failed."); }
  };

  const handlePermanentBan = async (uid: string) => {
    if (!window.confirm("CRITICAL: Enforce Permanent Terminal Ban? This identity will be blacklisted.")) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        isSOSBlocked: true,
        isPermanentlyBlocked: true,
        sosBlockedReason: "Permanent Grid Exclusion by SuperCell Command"
      });

      if (pendingAppeal?.id) {
        await updateDoc(doc(db, 'appeals', pendingAppeal.id), {
          status: 'rejected',
          resolvedAt: serverTimestamp(),
          resolvedBy: 'SuperCell Command'
        });
      }

      toast.error("Identity Blacklisted. Terminal Ban Active.");
    } catch (e) { toast.error("Ban Failed."); }
  };

  return {
    isWarnModalOpen,
    setIsWarnModalOpen,
    isOverrideModalOpen,
    setIsOverrideModalOpen,
    isOverriding,
    handleAction,
    triggerSovereignOverride,
    handleRestoreAccess,
    handlePermanentBan
  };
}
