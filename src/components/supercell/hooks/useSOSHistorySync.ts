import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { IncidentRecord, UserProfile } from '../../../state/slices/types';

export function useSOSHistorySync(
  historicalAlerts: IncidentRecord[],
  activeAlerts: IncidentRecord[],
  userStatusMap: Record<string, UserProfile>,
  sidebarTab: 'LIVE' | 'HISTORY',
  selectedAlertId: string | null,
  selectedVictimId: string | null,
  searchTerm: string
) {
  const [pendingAppeal, setPendingAppeal] = useState<any>(null);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, any[]> = {};
    historicalAlerts.forEach(alert => {
      const vUid = (alert as any).victimUid || (alert as any).uid || (alert as any).userId;
      if (vUid) {
        if (!groups[vUid]) groups[vUid] = [];
        if (!groups[vUid].some(a => a.id === alert.id)) {
          groups[vUid].push(alert);
        }
      }
    });
    return groups;
  }, [historicalAlerts]);

  const uniqueHistoricalParticipants = useMemo(() => {
    return Object.keys(groupedHistory).map(uid => {
      const participantAlerts = groupedHistory[uid];
      const profile = userStatusMap[uid];
      return {
        uid,
        name: profile?.name || participantAlerts[0]?.victimName || 'Unknown Citizen',
        count: participantAlerts.length,
        lastTimestamp: participantAlerts[0]?.timestamp,
        role: profile?.role || 'CITIZEN'
      };
    }).sort((a, b) => (b.lastTimestamp?.toMillis() || 0) - (a.lastTimestamp?.toMillis() || 0));
  }, [groupedHistory, userStatusMap]);

  const filteredAlerts = sidebarTab === 'LIVE' 
    ? activeAlerts.filter(a => (a as any).victimName?.toLowerCase().includes(searchTerm.toLowerCase()) || (a as any).id.toLowerCase().includes(searchTerm.toLowerCase()))
    : uniqueHistoricalParticipants.filter(v => v.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedAlert = (sidebarTab === 'LIVE' ? activeAlerts : historicalAlerts).find(a => (a as any).id === selectedAlertId);
  const victimHistory = (sidebarTab === 'HISTORY' && selectedVictimId) ? (groupedHistory[selectedVictimId] || []) : [];
  
  const victimId = sidebarTab === 'LIVE' 
    ? ((selectedAlert as any)?.victimUid || (selectedAlert as any)?.uid || (selectedAlert as any)?.userId) 
    : selectedVictimId;

  const firstHistoryAlert = victimHistory[0];
  const alertPhone = sidebarTab === 'LIVE' 
    ? ((selectedAlert as any)?.phone || (selectedAlert as any)?.victimPhone || (selectedAlert as any)?.phoneNumber)
    : ((firstHistoryAlert as any)?.phone || (firstHistoryAlert as any)?.victimPhone || (firstHistoryAlert as any)?.phoneNumber);

  const findVictimProfile = () => {
    if (victimId && userStatusMap[victimId]) return userStatusMap[victimId];
    if (alertPhone) {
      const profileByPhone = Object.values(userStatusMap).find((u: any) => 
        u.phoneNumber === alertPhone || u.phone === alertPhone
      );
      if (profileByPhone) return profileByPhone;
    }
    const victimName = (sidebarTab === 'LIVE' ? (selectedAlert as any)?.victimName : (firstHistoryAlert as any)?.victimName);
    if (victimName) {
      const profileByName = Object.values(userStatusMap).find((u: any) => 
        (u.name || u.userName || '').toLowerCase() === victimName.toLowerCase()
      );
      if (profileByName) return profileByName;
    }
    return null;
  };

  const victimDataFromAlert = {
    name: (sidebarTab === 'LIVE' ? ((selectedAlert as any)?.victimName || (selectedAlert as any)?.userName) : (firstHistoryAlert as any)?.victimName) || 'UNIDENTIFIED CITIZEN',
    phoneNumber: alertPhone || 'NO PHONE RECORD',
    aadhar: (sidebarTab === 'LIVE' ? (selectedAlert as any)?.aadhar : (firstHistoryAlert as any)?.aadhar) || 'UNLINKED'
  };

  const victimData = findVictimProfile() || victimDataFromAlert;

  useEffect(() => {
    if (victimId && (victimData as any)?.isSOSBlocked) {
      const q = query(collection(db, 'appeals'), where('userId', '==', victimId), where('status', '==', 'pending'));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setPendingAppeal({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setPendingAppeal(null);
        }
      });
      return () => unsub();
    } else {
      setPendingAppeal(null);
    }
  }, [victimId, (victimData as any)?.isSOSBlocked]);

  return {
    filteredAlerts,
    selectedAlert,
    victimHistory,
    victimData,
    pendingAppeal,
    victimId
  };
}
