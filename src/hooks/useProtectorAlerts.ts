import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useKavachStore } from '../store/useKavachStore';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { ShieldCheck } from 'lucide-react';
import React from 'react';

export const useProtectorAlerts = (user: any, profile: any, userPos: any, activeTab: string, isPcrOfficer: boolean, setInterceptActive: any, setIsInterceptHUDOpen: any, setIsNavigating: any) => {
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [activeInterceptAlert, setActiveInterceptAlert] = useState<any | null>(null);
  const [assignedDispatch, setAssignedDispatch] = useState<any | null>(null);
  const [distanceToVictim, setDistanceToVictim] = useState<{ [key: string]: string }>({});
  const [lastResolvedVictim, setLastResolvedVictim] = useState('');
  const [showSuccessMotivation, setShowSuccessMotivation] = useState(false);
  const [resolvingAlert, setResolvingAlert] = useState<any | null>(null);

  useEffect(() => {
    if (profile?.respondingToAlertId) {
      setRespondingToId(profile.respondingToAlertId);
    } else if (profile?.status !== 'responding') {
      setRespondingToId(null);
    }
  }, [profile?.respondingToAlertId, profile?.status]);

  useEffect(() => {
    if (!respondingToId) return;
    if (activeInterceptAlert && activeInterceptAlert.id === respondingToId) return;

    const found = activeAlerts.find(a => a.id === respondingToId);
    if (found) {
      setActiveInterceptAlert(found);
      return;
    }

    getDoc(doc(db, 'alerts', respondingToId)).then(snap => {
      if (snap.exists()) {
        setActiveInterceptAlert({ id: snap.id, ...snap.data() as any });
      }
    }).catch(() => { });
  }, [respondingToId, activeAlerts]);

  useEffect(() => {
    if (!user || !isPcrOfficer) return;

    const q = query(
      collection(db, 'dispatches'),
      where('officerUid', '==', user.uid),
      where('status', '==', 'dispatched')
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const dispatchDoc = snap.docs[0].data();
        const dispatchId = snap.docs[0].id;
        const alertId = dispatchDoc.alertId;
        
        setAssignedDispatch({ id: dispatchId, alertId, ...dispatchDoc });

        if (respondingToId !== alertId) {
          toast.success("🚨 HQ EMERGENCY DISPATCH ASSIGNED!");
          getDoc(doc(db, 'alerts', alertId)).then(alertSnap => {
            if (alertSnap.exists()) {
              const alertData = { id: alertId, ...alertSnap.data() as any };
              setActiveInterceptAlert(alertData);
              setRespondingToId(alertId);
              setIsInterceptHUDOpen(true);
              setInterceptActive(true);
              setIsNavigating(true);
            }
          });
        }
      } else {
        setAssignedDispatch(null);
      }
    });

    return () => unsub();
  }, [user, isPcrOfficer, respondingToId]);

  useEffect(() => {
    if (!respondingToId) return;

    const unsub = onSnapshot(doc(db, 'alerts', respondingToId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === 'resolved') {
          setLastResolvedVictim(data.victimName || data.userName || 'Citizen');
          setShowSuccessMotivation(true);
          setRespondingToId(null);
          setInterceptActive(false);
          setIsInterceptHUDOpen(false);
          setActiveInterceptAlert(null);
          setAssignedDispatch(null);

          if (assignedDispatch?.id) {
            updateDoc(doc(db, 'dispatches', assignedDispatch.id), {
              status: 'resolved',
              resolvedAt: serverTimestamp()
            }).catch(() => { });
          }

          if (user) {
            updateDoc(doc(db, 'users', user.uid), {
              currentDispatchStatus: 'idle',
              currentAlertId: null
            }).catch(() => { });
          }

          if (Capacitor.isNativePlatform()) {
            navigator.vibrate([100, 50, 100, 50, 200]);
          }
        }
      }
    });
    return () => unsub();
  }, [respondingToId, assignedDispatch]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;
  };

  useEffect(() => {
    if (!userPos) return;
    const newDistances: { [key: string]: string } = {};
    activeAlerts.forEach(alert => {
      const vLat = alert.latitude || alert.location?.latitude || alert.location?.lat || (alert.coords && alert.coords[0]);
      const vLng = alert.longitude || alert.location?.longitude || alert.location?.lng || (alert.coords && alert.coords[1]);
      if (vLat && vLng) {
        newDistances[alert.id] = calculateDistance(userPos.lat, userPos.lng, vLat, vLng);
      }
    });
    setDistanceToVictim(newDistances);
  }, [userPos, activeAlerts]);

  useEffect(() => {
    const q = query(collection(db, 'alerts'), where('status', 'in', ['active', 'responding', 'rescued_pending_victim_clearance']));
    const unsub = onSnapshot(q, (snap) => {
      const allAlerts = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));

      if (userPos && user) {
        const filtered = allAlerts.filter(alert => {
          if (alert.uid === user.uid || alert.victimUid === user.uid) return false;
          const vLat = alert.latitude || alert.location?.latitude || alert.location?.lat || (alert.coords && alert.coords[0]);
          const vLng = alert.longitude || alert.location?.longitude || alert.location?.lng || (alert.coords && alert.coords[1]);
          if (!vLat || !vLng) return false;

          const dLat = (vLat - userPos.lat) * Math.PI / 180;
          const dLon = (vLng - userPos.lng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(userPos.lat * Math.PI / 180) * Math.cos(vLat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = 6371 * c;

          const isResponding = alert.responderUid === user.uid;
          if (isResponding && dist <= 20) return true;

          const isTransit = !!alert.isTransitSOS;
          const isDebug = localStorage.getItem('kavach_debug_mode') === 'true' || alert.type === 'TEST_ALERT' || alert.type?.includes('TEST');
          if (isTransit || isDebug) {
            return dist <= 1000;
          }

          return dist <= 10;
        });

        // Sort: Women SOS first, then Protector Reports. Then by newest.
        filtered.sort((a, b) => {
          const aIsProtector = a.type === 'PROTECTOR_REPORT';
          const bIsProtector = b.type === 'PROTECTOR_REPORT';
          if (!aIsProtector && bIsProtector) return -1;
          if (aIsProtector && !bIsProtector) return 1;
          
          const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp || 0);
          const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp || 0);
          return timeB - timeA;
        });

        setActiveAlerts(filtered);
      } else {
        setActiveAlerts([]);
      }
    });
    return () => unsub();
  }, [userPos, user]);

  useEffect(() => {
    if (!user || !activeTab) return;
    const respondingAlert = activeAlerts.find(a => a.responderUid === user.uid);
    if (respondingAlert) {
      const alertRef = doc(db, 'alerts', respondingAlert.id);
      const unsub = onSnapshot(alertRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.status === 'resolved') {
            toast.success(`MISSION RESOLVED: Victim confirmed safety [${data.verification?.closureReason || 'Manual'}]`, {
              duration: 6000,
              icon: React.createElement(ShieldCheck, { className: "text-emerald-500" })
            });
            setIsInterceptHUDOpen(false);
            setInterceptActive(false);
            setActiveInterceptAlert(null);
            setAssignedDispatch(null);
          }
        }
      });
      return () => unsub();
    }
  }, [activeAlerts, user, activeTab]);

  return {
    activeAlerts, setActiveAlerts,
    respondingToId, setRespondingToId,
    activeInterceptAlert, setActiveInterceptAlert,
    assignedDispatch, setAssignedDispatch,
    distanceToVictim,
    lastResolvedVictim,
    showSuccessMotivation, setShowSuccessMotivation,
    resolvingAlert, setResolvingAlert
  };
};
