import { useState, useEffect } from 'react';
import { db, storage } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { toast } from 'sonner';

export function useEvidenceViewer(alertId: string, isOpen: boolean) {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || !alertId) return;

    let active = true;

    const loadEvidence = async () => {
      try {
        const { supabase } = await import('../../../lib/supabase');
        const { data, error } = await supabase
          .from('evidence')
          .select('*')
          .eq('alert_id', alertId)
          .order('timestamp', { ascending: false });

        if (error) {
          console.error("Error fetching evidence:", error);
          return;
        }

        if (active) {
          const mappedData = (data || []).map(row => ({
            id: row.id,
            alertId: row.alert_id,
            type: row.type,
            url: row.url,
            hash: row.hash,
            digitalSignature: row.digital_signature,
            timestamp: row.timestamp ? { toMillis: () => new Date(row.timestamp).getTime(), toDate: () => new Date(row.timestamp) } : undefined,
            ...row.metadata
          }));
          setEvidence(mappedData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load evidence:", err);
      }
    };

    loadEvidence();

    let channel: any;
    import('../../../lib/supabase').then(({ supabase }) => {
      if (!active) return;
      channel = supabase
        .channel(`evidence:${alertId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'evidence', 
          filter: `alert_id=eq.${alertId}` 
        }, (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new;
            const mapped = {
              id: row.id,
              alertId: row.alert_id,
              type: row.type,
              url: row.url,
              hash: row.hash,
              digitalSignature: row.digital_signature,
              timestamp: row.timestamp ? { toMillis: () => new Date(row.timestamp).getTime(), toDate: () => new Date(row.timestamp) } : undefined,
              ...row.metadata
            };
            setEvidence(prev => [mapped, ...prev.filter(e => e.id !== mapped.id)]);
          } else if (payload.eventType === 'DELETE') {
            setEvidence(prev => prev.filter(e => e.id !== payload.old.id));
          }
        })
        .subscribe();
    });

    return () => {
      active = false;
      if (channel) {
        import('../../../lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel);
        });
      }
    };
  }, [alertId, isOpen]);

  // Load blobs from IndexedDB for video/audio
  useEffect(() => {
    if (evidence.length === 0) return;
    const loadBlobs = async () => {
      const { getVaultEntry } = await import('../../../lib/forensicVault');
      const newUrls: Record<string, string> = {};
      for (const item of evidence) {
        if (!item.vaultId) continue;
        try {
          const entry = await getVaultEntry(item.vaultId);
          if (entry) newUrls[item.vaultId] = URL.createObjectURL(entry.blob);
        } catch (e) { /* vault entry may not exist */ }
      }
      setBlobUrls(prev => {
        Object.values(prev).forEach(u => { try { URL.revokeObjectURL(u); } catch(e) {} });
        return newUrls;
      });
    };
    loadBlobs();
    return () => setBlobUrls(prev => {
      Object.values(prev).forEach(u => { try { URL.revokeObjectURL(u); } catch(e) {} });
      return {};
    });
  }, [evidence]);

  const handleReview = async (item: any) => {
    if (item.status === 'Reviewed') return;
    if (!window.confirm("CRITICAL: This will permanently delete the evidence file from the cloud to save space. The log will remain. Proceed?")) return;
    try {
      if (item.url && item.fileName) {
         const fileRef = ref(storage, `kavach_evidence/${alertId}/${item.fileName}`);
         await deleteObject(fileRef).catch(() => {});
      }
      
      const { supabase } = await import('../../../lib/supabase');
      const updatedMetadata = {
        ...item,
        status: 'Reviewed',
        reviewedBy: 'Command Center',
        reviewedAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('evidence')
        .update({
          url: '',
          metadata: updatedMetadata
        })
        .eq('id', item.id);

      if (error) throw error;
      
      toast.success("Evidence Reviewed", { description: "Cloud storage cleared." });
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleDownload = (item: any) => {
    const src = blobUrls[item.vaultId] || item.url;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = item.fileName || `kavach_evidence_${item.id}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const snapshots = evidence.filter(e => e.type === 'Snapshot' || e.type === 'CCTV_FEED');
  const audioLogs = evidence.filter(e => e.type === 'Audio Log');

  return {
    evidence,
    loading,
    blobUrls,
    snapshots,
    audioLogs,
    handleReview,
    handleDownload
  };
}
