import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
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
  const [isCancelledByVictim, setIsCancelledByVictim] = useState(false);
  const [deEscalationReason, setDeEscalationReason] = useState('');

  // 🚫 Blacklist: Victim UIDs this protector has stood down from — hide for 3 hours (10800000 ms)
  const getAbortedBlacklist = (): Record<string, number> => {
    try {
      const stored = localStorage.getItem(`kavach_aborted_victims_${user?.uid || 'anon'}`);
      const list = stored ? JSON.parse(stored) : {};
      
      // Clean expired entries
      const now = Date.now();
      const cleaned: Record<string, number> = {};
      Object.entries(list).forEach(([vid, expiry]) => {
        if (Number(expiry) > now) {
          cleaned[vid] = Number(expiry);
        }
      });
      return cleaned;
    } catch { return {}; }
  };

  const addToAbortedBlacklist = (victimUid: string) => {
    if (!victimUid) return;
    try {
      const existing = getAbortedBlacklist();
      existing[victimUid] = Date.now() + 3 * 60 * 60 * 1000; // 3 Hours expiry
      localStorage.setItem(`kavach_aborted_victims_${user?.uid || 'anon'}`, JSON.stringify(existing));
      setAbortedVictims(existing);
    } catch { }
  };

  // Reactive blacklist state so filter re-runs when a new victim is added
  const [abortedVictims, setAbortedVictims] = useState<Record<string, number>>(getAbortedBlacklist);

  // Refs for tracking stagnant response status
  const lastPositionCheckRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const startResponseTimeRef = useRef<number | null>(null);
  const lastWarningTimeRef = useRef<number>(0);

  // Monitor responder movement stagnation during active mission
  useEffect(() => {
    if (respondingToId) {
      startResponseTimeRef.current = Date.now();
      if (userPos) {
        lastPositionCheckRef.current = { lat: userPos.lat, lng: userPos.lng, time: Date.now() };
      } else {
        lastPositionCheckRef.current = null;
      }
    } else {
      startResponseTimeRef.current = null;
      lastPositionCheckRef.current = null;
      lastWarningTimeRef.current = 0;
    }
  }, [respondingToId]);

  useEffect(() => {
    if (!respondingToId || !userPos) return;

    const now = Date.now();

    // Give 15 seconds grace period after starting the response before checking stagnation
    if (startResponseTimeRef.current && now - startResponseTimeRef.current < 15000) {
      return;
    }

    if (!lastPositionCheckRef.current) {
      lastPositionCheckRef.current = { lat: userPos.lat, lng: userPos.lng, time: now };
      return;
    }

    const elapsedCheck = now - lastPositionCheckRef.current.time;
    if (elapsedCheck >= 30000) {
      const lat1 = lastPositionCheckRef.current.lat;
      const lon1 = lastPositionCheckRef.current.lng;
      const lat2 = userPos.lat;
      const lon2 = userPos.lng;

      const R = 6371e3; // meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distMeters = R * c;

      // If moved less than 20 meters in 30 seconds, warn them
      if (distMeters < 20) {
        if (now - lastWarningTimeRef.current >= 30000) {
          lastWarningTimeRef.current = now;
          toast.error("🚨 STAGNATION WARNING: You are not moving! Fake response is strictly prohibited and will negatively impact your Kavach rating.", {
            duration: 10000,
            action: {
              label: "I AM MOVING",
              onClick: () => {
                lastPositionCheckRef.current = { lat: userPos.lat, lng: userPos.lng, time: Date.now() };
              }
            }
          });

          if ('speechSynthesis' in window) {
            const msg = new SpeechSynthesisUtterance("Warning. You have not moved. Fake response detected. Please proceed to the target location immediately.");
            window.speechSynthesis.speak(msg);
          }
        }
      } else {
        lastPositionCheckRef.current = { lat: userPos.lat, lng: userPos.lng, time: now };
      }
    }
  }, [userPos, respondingToId]);

  // 🛡️ WORKLOAD SELF-CORRECTION PROTOCOL (Auto-Heal Capacity Locks)
  useEffect(() => {
    if (user && profile && !profile.respondingToAlertId && (profile.activeMissionsCount || 0) > 0) {
      console.log("🔧 KAVACH SYSTEM HEAL: Resetting dangling activeMissionsCount for idle protector:", user.uid);
      updateDoc(doc(db, 'users', user.uid), {
        activeMissionsCount: 0
      }).catch(() => {});
    }
  }, [user, profile]);

  useEffect(() => {
    if (profile?.respondingToAlertId) {
      setRespondingToId(profile.respondingToAlertId);
      setIsInterceptHUDOpen(true);
      setInterceptActive(true);
    } else if (profile?.status !== 'responding') {
      setRespondingToId(null);
    }
  }, [profile?.respondingToAlertId, profile?.status, setIsInterceptHUDOpen, setInterceptActive]);

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
              currentAlertId: null,
              respondingToAlertId: null,
              status: 'idle'
            }).catch(() => { });
          }

          if (Capacitor.isNativePlatform()) {
            navigator.vibrate([100, 50, 100, 50, 200]);
          }
        } else if (data.status === 'cancelled' || data.status === 'aborted' || data.status === 'closed') {
          setLastResolvedVictim(data.victimName || data.userName || 'Citizen');
          setIsCancelledByVictim(true);
          setDeEscalationReason(data.closureReason || data.verification?.closureReason || 'Citizen Standdown / Resolved');
          setShowSuccessMotivation(true);

          setRespondingToId(null);
          setInterceptActive(false);
          setIsInterceptHUDOpen(false);
          setActiveInterceptAlert(null);
          setAssignedDispatch(null);

          if (assignedDispatch?.id) {
            updateDoc(doc(db, 'dispatches', assignedDispatch.id), {
              status: data.status,
              resolvedAt: serverTimestamp()
            }).catch(() => { });
          }

          if (user) {
            updateDoc(doc(db, 'users', user.uid), {
              currentDispatchStatus: 'idle',
              currentAlertId: null,
              respondingToAlertId: null,
              status: 'idle'
            }).catch(() => { });
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

      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isDebug = localStorage.getItem('kavach_debug_mode') === 'true' || isLocalhost;

      if (user || isDebug) {
        const filtered = allAlerts.filter(alert => {
          // 🚫 Never show alerts from victims this protector stood down from in the last 3 hours
          const alertVictimUid = alert.victimUid || alert.uid;
          if (alertVictimUid && abortedVictims[alertVictimUid]) {
            const expiry = abortedVictims[alertVictimUid];
            if (Date.now() < expiry) {
              return false; // Still within 3-hour cooldown
            }
          }

          // Production Guard: Cannot respond to your own SOS alert (Safe String check)
          const isOwnSOS = user?.uid && alert.victimUid && (String(alert.victimUid) === String(user.uid));
          const isOwnSOSAlternative = user?.uid && alert.uid && (String(alert.uid) === String(user.uid));
          if (isOwnSOS || isOwnSOSAlternative) return false;

          const vLat = alert.latitude || alert.location?.latitude || alert.location?.lat || (alert.coords && alert.coords[0]);
          const vLng = alert.longitude || alert.location?.longitude || alert.location?.lng || (alert.coords && alert.coords[1]);
          if (!vLat || !vLng) return false;

          const isResponding = alert.responderUid === user?.uid;
          if (isResponding) return true;

          const isTransit = !!alert.isTransitSOS;
          const isAlertDebug = alert.type === 'TEST_ALERT' || alert.type?.includes('TEST') || isDebug;
          
          if (isTransit || isAlertDebug) {
            return true; // Bypass distance limit for local testing / debug mode
          }

          if (!userPos) return false; // If not debug and no location, distance cannot be calculated

          const dLat = (vLat - userPos.lat) * Math.PI / 180;
          const dLon = (vLng - userPos.lng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(userPos.lat * Math.PI / 180) * Math.cos(vLat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = 6371 * c;

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
  }, [userPos, user, abortedVictims]);

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
    resolvingAlert, setResolvingAlert,
    isCancelledByVictim, setIsCancelledByVictim,
    deEscalationReason, setDeEscalationReason,
    addToAbortedBlacklist,
    setAbortedVictims
  };
};
