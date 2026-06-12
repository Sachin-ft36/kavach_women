import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export function useMissionAudit(user: any, isOpen: boolean, onClose: () => void) {
  const [history, setHistory] = useState<any[]>([]);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isIssuingWarning, setIsIssuingWarning] = useState(false);
  const [selectedEvidenceAlertId, setSelectedEvidenceAlertId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchMissionHistory();
    }
  }, [isOpen, user]);

  const fetchMissionHistory = async () => {
    setLoading(true);
    try {
      const userId = user.id || user.uid;
      
      const q = query(
        collection(db, 'alerts'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );

      const snap = await getDocs(q);
      const allAlerts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const historicalData = allAlerts.filter(h => {
        const isVictimMatch = h.victimUid === userId || h.uid === userId;
        const isResponderMatch = h.responderUid === userId || (h.activeResponders || []).some((r: any) => r.uid === userId);
        
        const isUserInvolved = isVictimMatch || isResponderMatch;
        const isNotActive = !['active', 'responding', 'Active', 'Responding'].includes(h.status);
        
        return isUserInvolved && isNotActive;
      });

      setHistory(historicalData);

      const gSnap = await getDocs(collection(db, 'users', userId, 'guardians'));
      setGuardians(gSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Audit Fetch Error:", e);
      try {
        const fallbackSnap = await getDocs(collection(db, 'alerts'));
        const userId = user.id || user.uid;
        const fallbackData = fallbackSnap.docs
          .map(d => ({ id: d.id, ...d.data() as any }))
          .filter(h => (h.victimUid === userId || h.uid === userId || h.responderUid === userId))
          .filter(h => !['active', 'responding'].includes(h.status?.toLowerCase()))
          .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setHistory(fallbackData);
      } catch (err) {
        console.error("Critical Audit Failure:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIssueWarning = async () => {
    if (!user?.id) return;
    setIsIssuingWarning(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        hasPendingWarning: true,
        warningMessage: `⚠️ KAVACH DISCIPLINARY: Misuse of SOS protocol detected. Your account is under forensic review.`,
        lastWarningAt: serverTimestamp(),
        warningCount: (user.warningCount || 0) + 1,
        systemStatus: 'UNDER_FORENSIC_REVIEW'
      });
      toast.success(`COMMAND CENTER: Formal warning issued to ${user.name}.`);
      onClose();
    } catch (e) {
      toast.error("Failed to issue institutional warning.");
    } finally {
      setIsIssuingWarning(false);
    }
  };

  const falseAlertCount = history.filter(h => h.closureReason === 'Accidentally triggered SOS').length;
  const integrityScore = Math.max(0, 100 - (falseAlertCount * 25));

  return {
    history,
    guardians,
    loading,
    isIssuingWarning,
    selectedEvidenceAlertId,
    setSelectedEvidenceAlertId,
    handleIssueWarning,
    falseAlertCount,
    integrityScore
  };
}
