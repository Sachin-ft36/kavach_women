import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Shield, MapPin, Bell, Activity, Clock, Phone, Navigation,
  CheckCircle2, Camera, User, ChevronRight, Info, Heart,
  ShieldCheck, MessageSquare, AlertCircle, RefreshCw, Layers,
  LocateFixed, PhoneCall, Globe, Zap, Cpu, Car, Volume2, ShieldAlert, Award, Lock
} from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import { supabase } from '../lib/supabase';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, arrayUnion, getDoc, addDoc } from 'firebase/firestore';
import { useCall } from '../contexts/CallContext';
import { cn } from '../lib/utils';
import TacticalModal from './TacticalModal';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import VictimMap from './maps/VictimMap';
import MapplsVictimMap from './maps/MapplsVictimMap';
import NearbyHubModal from './NearbyHubModal';
import MedicalHubModal from './MedicalHubModal';
import PCROfficerDashboard from './PCROfficerDashboard';

export default function ProtectorDashboard() {
  const { language } = useLanguage();
  const { initiateCall } = useCall();
  const { user, profile, userPos, isEmergencyOverrideRequested, activeTab } = useKavachStore();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [rescuePhoto, setRescuePhoto] = useState<string | null>(null);
  const [resolvingAlert, setResolvingAlert] = useState<any | null>(null);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [respondingToId, setRespondingToId] = useState<string | null>(null);
  const [handshakeInput, setHandshakeInput] = useState('');
  const [isNearbyHubOpen, setIsNearbyHubOpen] = useState(false);
  const [isMedicalHubOpen, setIsMedicalHubOpen] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);

  const [showTacticalPledge, setShowTacticalPledge] = useState<{ isOpen: boolean, alertId: string | null }>({ isOpen: false, alertId: null });
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);
  const [showUplinkActive, setShowUplinkActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [distanceToVictim, setDistanceToVictim] = useState<{ [key: string]: string }>({});
  const [isInterceptHUDOpen, setIsInterceptHUDOpen] = useState(false);
  const [activeInterceptAlert, setActiveInterceptAlert] = useState<any | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { setInterceptActive } = useKavachStore();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isBriefingPlaying, setIsBriefingPlaying] = useState(false);
  const [showSuccessMotivation, setShowSuccessMotivation] = useState(false);
  const [lastResolvedVictim, setLastResolvedVictim] = useState('');

  // 🚔 PCR OFFICER SPECIFIC STATS
  const [isOnDuty, setIsOnDuty] = useState(profile?.isOnDuty || false);
  const [assignedDispatch, setAssignedDispatch] = useState<any | null>(null);
  const isPcrOfficer = profile?.role === 'pcr_officer';

  // 🛰️ PCR SHIFT MANAGEMENT STATES (per-shift, resets on duty toggle)
  const [shiftVehicle, setShiftVehicle] = useState(profile?.vehicleNo || '');
  const [shiftZone, setShiftZone] = useState(profile?.thanaName || '');
  const [shiftPartner, setShiftPartner] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem('kavach_shift_start_time');
    return saved ? new Date(saved) : (profile?.isOnDuty ? new Date() : null);
  });
  const [isCarScreenOpen, setIsCarScreenOpen] = useState(false);
  const [carSpeed, setCarSpeed] = useState(0);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [isMegaphoneActive, setIsMegaphoneActive] = useState(false);
  const [showShiftCompleteModal, setShowShiftCompleteModal] = useState(false);
  const [shiftStats, setShiftStats] = useState({ duration: '08 Hours 15 Mins', responses: 0 });
  const [inactivityCountdown, setInactivityCountdown] = useState<number | null>(null);
  const [isInactivityTriggered, setIsInactivityTriggered] = useState(false);
  const [etaTimer, setEtaTimer] = useState('01:48.6');
  const [shiftElapsedSeconds, setShiftElapsedSeconds] = useState(0);
  const [etaRemainingMs, setEtaRemainingMs] = useState(108600); // 1 min 48.6 seconds in ms
  // Legacy aliases — kept for old JSX until full redesign
  const [isCarLinked, setIsCarLinked] = useState(false);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [isCarScreenSimulationOpen, setIsCarScreenSimulationOpen] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [hudPinInput, setHudPinInput] = useState('');
  const [couplingPin] = useState('8920');

  const selectedRank = profile?.rank || 'Constable';
  const dynamicVehicleNo = shiftVehicle || profile?.vehicleNo || 'PCR-TBD';
  const customBadgeCode = profile?.badgeId || 'IND-POL-00000';
  const customJurisdiction = shiftZone || profile?.address || profile?.thanaName || 'Unassigned Zone';

  useEffect(() => {
    if (profile?.isOnDuty !== undefined) {
      setIsOnDuty(profile.isOnDuty);
      if (profile.isOnDuty && !shiftStartTime) {
        const saved = localStorage.getItem('kavach_shift_start_time');
        const startTime = saved ? new Date(saved) : new Date();
        setShiftStartTime(startTime);
        if (!saved) {
          localStorage.setItem('kavach_shift_start_time', startTime.toISOString());
        }
      } else if (!profile.isOnDuty) {
        setShiftStartTime(null);
        localStorage.removeItem('kavach_shift_start_time');
      }
    }
  }, [profile?.isOnDuty]);

  // 🚔 Sync local respondingToId state with user profile responding state in real-time
  useEffect(() => {
    if (profile?.respondingToAlertId) {
      setRespondingToId(profile.respondingToAlertId);
    } else if (profile?.status !== 'responding') {
      setRespondingToId(null);
    }
  }, [profile?.respondingToAlertId, profile?.status]);

  // 📺 Global viewport and layout synchronization when widescreen CarPlay is open
  useEffect(() => {
    useKavachStore.setState({ isOverlayActive: isCarScreenOpen });
    return () => {
      useKavachStore.setState({ isOverlayActive: false });
    };
  }, [isCarScreenOpen]);

  // Simulate Speed & Route progress in real-time on Car MDT (with real countdown and realistic fluctuations)
  useEffect(() => {
    if (!isCarScreenOpen) return;
    
    // When responding starts, reset ETA if it was uninitialized
    if (respondingToId && etaRemainingMs === 108600) {
      setEtaRemainingMs(108600);
    }

    const interval = setInterval(() => {
      // 1. Calculate realistic car speed (fluctuating realistically around 79 km/h when navigating)
      if (respondingToId) {
        if (isNavigating) {
          setCarSpeed(prev => {
            const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
            const nextSpeed = prev === 0 ? 79 : prev + delta;
            return Math.max(72, Math.min(86, nextSpeed));
          });
          
          // 2. Countdown ETA in milliseconds
          setEtaRemainingMs(prev => {
            if (prev <= 100) return 0;
            return prev - 100;
          });
        } else {
          // Decelerate realistically if not navigating (standby/arrived)
          setCarSpeed(prev => Math.max(0, prev - 4));
        }
      } else {
        if (isOnDuty) {
          // On patrol: cruising speed 20 to 35 km/h
          setCarSpeed(prev => {
            if (prev > 45) return prev - 8;
            const delta = Math.floor(Math.random() * 3) - 1; // -1 to +1
            const nextSpeed = prev === 0 ? 24 : prev + delta;
            return Math.max(18, Math.min(35, nextSpeed));
          });
        } else {
          setCarSpeed(0);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isCarScreenOpen, respondingToId, isNavigating, isOnDuty, etaRemainingMs]);

  // Format ETA string in real-time (mm:ss.d)
  useEffect(() => {
    if (respondingToId && isNavigating) {
      const totalTenths = Math.floor(etaRemainingMs / 100);
      const minutes = Math.floor(totalTenths / 600);
      const seconds = Math.floor((totalTenths % 600) / 10);
      const tenths = totalTenths % 10;
      
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      setEtaTimer(`${mm}:${ss}.${tenths}`);
    } else if (respondingToId) {
      setEtaTimer('01:48.6');
    } else {
      setEtaTimer('—');
    }
  }, [etaRemainingMs, respondingToId, isNavigating]);

  // Shift elapsed time tracker
  useEffect(() => {
    if (!isOnDuty || !shiftStartTime) return;
    const timer = setInterval(() => {
      setShiftElapsedSeconds(Math.floor((Date.now() - shiftStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOnDuty, shiftStartTime]);

  const formatShiftTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };


  // 🔄 AUTO-SYNC: If respondingToId is set but activeInterceptAlert is null (e.g. race condition,
  // component re-render, or Car HUD opened before alert was fetched), re-hydrate from activeAlerts.
  useEffect(() => {
    if (!respondingToId) return;
    if (activeInterceptAlert && activeInterceptAlert.id === respondingToId) return; // already correct

    // Try to find it in the local activeAlerts array first (fastest path)
    const found = activeAlerts.find(a => a.id === respondingToId);
    if (found) {
      setActiveInterceptAlert(found);
      return;
    }

    // Fallback: fetch directly from Firestore
    getDoc(doc(db, 'alerts', respondingToId)).then(snap => {
      if (snap.exists()) {
        setActiveInterceptAlert({ id: snap.id, ...snap.data() as any });
      }
    }).catch(() => {});
  }, [respondingToId, activeAlerts]);

  // 🚨 INACTIVITY MONITOR: Escalation to District Command Cell on zero-motion deadlock
  useEffect(() => {
    if (!respondingToId) {
      setInactivityCountdown(null);
      setIsInactivityTriggered(false);
      return;
    }

    // Set countdown to 15 seconds initially if active distress and speed is zero
    if (carSpeed === 0 && !isInactivityTriggered) {
      if (inactivityCountdown === null) {
        setInactivityCountdown(15);
      }
    } else {
      // Officer is moving, reset countdown
      setInactivityCountdown(null);
    }
  }, [respondingToId, carSpeed, isInactivityTriggered]);

  useEffect(() => {
    if (inactivityCountdown === null || inactivityCountdown <= 0) {
      if (inactivityCountdown === 0 && !isInactivityTriggered && respondingToId) {
        setIsInactivityTriggered(true);
        toast.error("⚠️ STANDSTILL CRITICAL WARNING: Inactivity Escalated to HQ Supercell!");
        // Update alert in Firestore so HQ receives critical warning
        updateDoc(doc(db, 'alerts', respondingToId), {
          inactivityEscalated: true,
          inactiveOfficerName: profile?.name || 'PCR Officer',
          inactiveOfficerVehicle: profile?.vehicleNo || 'PCR-TBD',
          inactivityTriggeredAt: serverTimestamp()
        }).catch(() => {});
      }
      return;
    }

    const timer = setTimeout(() => {
      setInactivityCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [inactivityCountdown, isInactivityTriggered, respondingToId, profile]);

  // Sync duty state directly with Firestore + manage shift lifecycle
  const handleToggleDuty = async () => {
    if (!user) return;
    const targetState = !isOnDuty;
    setIsOnDuty(targetState);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isOnDuty: targetState,
        currentVehicle: targetState ? dynamicVehicleNo : null,
        currentZone: targetState ? customJurisdiction : null,
        lastUpdated: serverTimestamp()
      });
      
      if (targetState) {
        // SHIFT START
        setShiftStartTime(new Date());
        setShiftElapsedSeconds(0);
        toast.success(`🚔 Shift Started — Vehicle: ${dynamicVehicleNo} | Zone: ${customJurisdiction}`);
        if ('speechSynthesis' in window) {
          const msg = new SpeechSynthesisUtterance(`Shift started. Patrol unit ${dynamicVehicleNo} is now active in ${customJurisdiction}.`);
          window.speechSynthesis.speak(msg);
        }
      } else {
        // SHIFT END — release all resources
        setIsCarScreenOpen(false);
        setIsSirenActive(false);
        setIsMegaphoneActive(false);

        const elapsed = shiftElapsedSeconds;
        const durationFormatted = formatShiftTime(elapsed);
        const responses = activeAlerts.filter(a => a.responderUid === user.uid).length;

        // SAVE SHIFT LOG TO FIRESTORE (Persisted audit trail for Supercell monitoring)
        try {
          await addDoc(collection(db, 'shift_logs'), {
            officerUid: user.uid,
            officerName: profile?.name || 'Officer',
            officerBadge: profile?.badgeId || 'IND-POL-00000',
            vehicleNo: dynamicVehicleNo,
            zone: customJurisdiction,
            partner: shiftPartner || 'Solo Patrol',
            startTime: shiftStartTime ? shiftStartTime.toISOString() : new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: durationFormatted,
            durationSeconds: elapsed,
            responsesCount: responses,
            state: profile?.state || 'Uttar Pradesh',
            city: profile?.city || 'Rewa',
            timestamp: serverTimestamp()
          });
        } catch (err) {
          console.error("Failed to save shift log to Firestore:", err);
        }

        setShiftStartTime(null);
        setShiftElapsedSeconds(0);
        localStorage.removeItem('kavach_shift_start_time');

        // Release active dispatch back to HQ queue
        if (assignedDispatch) {
          try {
            await updateDoc(doc(db, 'dispatches', assignedDispatch.id), {
              status: 'pending',
              officerUid: null,
              officerName: null,
              lastUpdated: serverTimestamp()
            });
          } catch (err) {
            console.error("Failed to release dispatch on shift close:", err);
          }
          setAssignedDispatch(null);
        }
        
        // Build shift summary from real data
        setShiftStats({
          duration: durationFormatted,
          responses: responses
        });
        setShowShiftCompleteModal(true);
        
        if ('speechSynthesis' in window) {
          const msg = new SpeechSynthesisUtterance("Shift ended. Vehicle released. Stay safe.");
          window.speechSynthesis.speak(msg);
        }
      }
    } catch (e) {
      toast.error("Duty sync failed. Check connection.");
      setIsOnDuty(!targetState);
    }

  };

  // Real-time listener for incoming Supercell dispatch instructions (Dispatches matching this officer)
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
        
        // Find or map matching alert coordinates
        const alertId = dispatchDoc.alertId;
        setAssignedDispatch({ id: dispatchId, alertId, ...dispatchDoc });
        
        // If not already responding, light up the intercept HUD!
        if (respondingToId !== alertId) {
          toast.success("🚨 HQ EMERGENCY DISPATCH ASSIGNED!");
          // Fetch alert payload
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
          setActiveInterceptAlert(null); // Clear active CarPlay alert tracking state
          setAssignedDispatch(null);     // Clear dispatch ticket state
          
          // Complete dispatch record status
          if (assignedDispatch?.id) {
            updateDoc(doc(db, 'dispatches', assignedDispatch.id), {
              status: 'resolved',
              resolvedAt: serverTimestamp()
            }).catch(() => {});
          }

          // Reset PCR user state
          if (user) {
            updateDoc(doc(db, 'users', user.uid), {
              currentDispatchStatus: 'idle',
              currentAlertId: null
            }).catch(() => {});
          }
          
          // 🎊 Haptic Victory Pulse
          if (Capacitor.isNativePlatform()) {
             navigator.vibrate([100, 50, 100, 50, 200]);
          }
        }
      }
    });
    return () => unsub();
  }, [respondingToId, assignedDispatch]);

  const handleVoiceBriefing = (isManual = false) => {
    if (isBriefingPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsBriefingPlaying(false);
      return;
    }

    if (isBriefingPlaying) return;

    const audioPath = '/voice/protectorenglish.mp3';
    const audio = new Audio(audioPath);
    audioRef.current = audio;
    
    setIsBriefingPlaying(true);

    audio.onended = () => {
      setIsBriefingPlaying(false);
      localStorage.setItem('kavach_protector_briefing_completed', 'true');
    };

    audio.play().catch(err => {
      setIsBriefingPlaying(false);
      console.log("Voice blocked by browser autoplay policy.");
    });
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
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
        newDistances[alert.id] = calculateDistance(userPos[0], userPos[1], vLat, vLng);
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
          if (alert.uid === user.uid) return false;
          const vLat = alert.latitude || alert.location?.latitude || alert.location?.lat || (alert.coords && alert.coords[0]);
          const vLng = alert.longitude || alert.location?.longitude || alert.location?.lng || (alert.coords && alert.coords[1]);
          if (!vLat || !vLng) return false;
          
          const dLat = (vLat - userPos[0]) * Math.PI / 180;
          const dLon = (vLng - userPos[1]) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(userPos[0] * Math.PI / 180) * Math.cos(vLat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = 6371 * c;
          
          const isResponding = alert.responderUid === user.uid;
          if (isResponding && dist <= 20) return true;
          
          // We keep the alert in the list even if it's assigned to someone else, 
          // so we can show "Assigned to PCR-01" instead of just making it disappear (unprofessional).
          // if (alert.status === 'responding' && alert.responderUid && alert.responderUid !== user.uid) {
          //   return false;
          // }
          
          // Transit alerts or debug testing
          const isTransit = !!alert.isTransitSOS;
          const isDebug = localStorage.getItem('kavach_debug_mode') === 'true' || alert.type === 'TEST_ALERT' || alert.type?.includes('TEST');
          if (isTransit || isDebug) {
            return dist <= 1000;
          }
          
          return dist <= 10;
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
              icon: <ShieldCheck className="text-emerald-500" />
            });
            setIsInterceptHUDOpen(false);
            setInterceptActive(false);
            setActiveInterceptAlert(null); // Reset active CarPlay target state
            setAssignedDispatch(null);     // Reset dispatch state
          }
        }
      });
      return () => unsub();
    }
  }, [activeAlerts, user, activeTab]);

  useEffect(() => {
    const isJustLoggedIn = sessionStorage.getItem('kavach_just_logged_in');
    if (isJustLoggedIn) {
      handleVoiceBriefing();
      const playOnInteract = () => {
        handleVoiceBriefing();
        document.removeEventListener('click', playOnInteract);
      };
      document.addEventListener('click', playOnInteract);
    }
  }, []);

  const handleStartHelp = (alertId: string) => {
    setShowTacticalPledge({ isOpen: true, alertId });
  };

  const [isProcessingResponse, setIsProcessingResponse] = useState(false);

  const confirmTacticalResponse = async () => {
    if (isProcessingResponse) return;
    const alertId = showTacticalPledge.alertId;
    if (!alertId || !user) return;

    setIsProcessingResponse(true);
    
    // 🛡️ TACTICAL GUARD: Prevent duplicate responders
    const alertDoc = await getDoc(doc(db, 'alerts', alertId));
    if (!alertDoc.exists()) return;
    
    const alertData = alertDoc.data();
    
    // 🛑 EXCLUSIVE LOCK CHECK (Ola/Uber Logic Server-side validation)
    if (alertData.responderUid && alertData.responderUid !== user.uid) {
      toast.error("🚨 ALERT ALREADY INTERCEPTED! Another PCR unit is already en-route.");
      setIsProcessingResponse(false);
      setShowTacticalPledge({ isOpen: false, alertId: null });
      return;
    }

    const isAlreadyResponding = (alertData.activeResponders || []).some((r: any) => r.uid === user.uid);
    
    setRespondingToId(alertId);
    setShowTacticalPledge({ isOpen: false, alertId: null });

    try {
      const state = useKavachStore.getState();
      const responderData = {
        uid: user.uid,
        name: state.profile?.name || user.displayName || 'Protector Saathi',
        photo: state.profile?.photoURL || user.photoURL || '',
        phone: state.profile?.phone || user.phoneNumber || '',
        joinedAt: isAlreadyResponding ? (alertData.activeResponders.find((r: any) => r.uid === user.uid)?.joinedAt || Date.now()) : Date.now()
      };

      if (!isAlreadyResponding) {
        await updateDoc(doc(db, 'alerts', alertId), {
          status: 'responding',
          activeResponders: arrayUnion(responderData),
          responderUid: user.uid,
          responderName: state.profile?.name || user.displayName || 'Protector Saathi'
        });
        
        // ⚡ SUPABASE MISSION LOG
        supabase
          .from('missions')
          .insert({
            alert_id: alertId.startsWith('alert_') ? undefined : alertId,
            protector_id: user.uid,
            status: 'en_route',
            merit_earned: 0
          })
          .then(({ error }) => {
            if (error) console.error("⚡ SUPABASE: Mission Sync Failed.", error);
          });
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        status: 'responding',
        respondingToAlertId: alertId,
        lastUpdated: serverTimestamp()
      });

      // 🛰️ UPDATE GLOBAL STATE
      useKavachStore.setState({ 
        respondingToAlertId: alertId 
      });

      const activeAlert = activeAlerts.find(a => a.id === alertId);
      if (activeAlert) {
        useKavachStore.setState({ activeAlertId: alertId });
        setActiveInterceptAlert(activeAlert);
        if (!isCarScreenOpen) {
          setIsInterceptHUDOpen(true);
        }
        setInterceptActive(true);
        setIsNavigating(true);
      }
      setShowUplinkActive(true);
      toast.success("Grid Connection Stabilized.");
    } catch (error) {
      toast.error("Tactical Uplink Failed.");
    } finally {
      setIsProcessingResponse(false);
    }
  };

  const handleSelfDispatch = async (alertId: string) => {
    if (!user || isProcessingResponse) return;
    setIsProcessingResponse(true);
    try {
      const alertDoc = await getDoc(doc(db, 'alerts', alertId));
      if (!alertDoc.exists()) return;
      const alertData = alertDoc.data();

      // 🛑 EXCLUSIVE LOCK CHECK (Ola/Uber Logic Server-side validation)
      if (alertData.responderUid && alertData.responderUid !== user.uid) {
        toast.error("🚨 ALERT ALREADY INTERCEPTED! Another PCR unit is already en-route.");
        setIsProcessingResponse(false);
        return;
      }

      setRespondingToId(alertId);
      
      const responderData = {
        uid: user.uid,
        name: profile?.name || user.displayName || 'PCR Officer',
        photo: profile?.photoURL || user.photoURL || '',
        phone: profile?.phone || user.phoneNumber || '',
        joinedAt: Date.now()
      };
      
      // Update Alert Document
      await updateDoc(doc(db, 'alerts', alertId), {
        status: 'responding',
        activeResponders: arrayUnion(responderData),
        responderUid: user.uid,
        responderName: profile?.name || user.displayName || 'PCR Officer'
      });
      
      // Update User Document
      await updateDoc(doc(db, 'users', user.uid), {
        status: 'responding',
        respondingToAlertId: alertId,
        currentDispatchStatus: 'dispatched',
        currentAlertId: alertId,
        lastUpdated: serverTimestamp()
      });
      
      // Write Dispatch ticket to Firestore so HQ sees it
      const dispatchId = 'self_dispatch_' + Date.now();
      await addDoc(collection(db, 'dispatches'), {
        pcrId: profile?.vehicleNo || 'PCR-TBD',
        pcrName: profile?.name || 'PCR Officer',
        officerUid: user.uid,
        alertId: alertId,
        alertLocation: {
          lat: alertData.latitude || alertData.location?.lat || alertData.coords?.[0] || 0,
          lng: alertData.longitude || alertData.location?.lng || alertData.coords?.[1] || 0,
          name: alertData.locationName || alertData.address || 'Distress Node'
        },
        victimName: alertData.victimName || alertData.userName || 'Citizen',
        dispatchedAt: serverTimestamp(),
        status: 'dispatched',
        isRealOfficer: true,
        isSelfDispatched: true
      });
      
      // Update local state
      setAssignedDispatch({
        id: dispatchId,
        alertId,
        victimName: alertData.victimName || alertData.userName || 'Citizen'
      });
      
      const activeAlert = { id: alertId, ...alertData };
      useKavachStore.setState({ 
        respondingToAlertId: alertId,
        activeAlertId: alertId 
      });
      
      setActiveInterceptAlert(activeAlert);
      if (!isCarScreenOpen) {
        setIsInterceptHUDOpen(true);
      }
      setInterceptActive(true);
      setIsNavigating(true);
      
      toast.success("🔴 DIRECT SOS BROADCAST LOCKED! INTERCEPTING IMMEDIATELY.");
      
      if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance("Direct SOS locked. Commencing high-speed intercept.");
        window.speechSynthesis.speak(msg);
      }
    } catch (e) {
      toast.error("Self-Dispatch lock failed.");
    } finally {
      setIsProcessingResponse(false);
    }
  };

  const handleResolveAlert = async () => {
    if (!resolvingAlert) return;
    if (handshakeInput !== resolvingAlert.handshakeCode) {
      toast.error("Invalid Tactical Handshake Code. Access Denied.");
      return;
    }
    try {
      const alertRef = doc(db, 'alerts', resolvingAlert.id);
      await updateDoc(alertRef, {
        status: 'rescued_pending_victim_clearance',
        verification: {
          closureReason: resolutionSummary,
          handshakeCode: handshakeInput,
          rescuePhotoUrl: rescuePhoto,
          resolvedAt: serverTimestamp(),
          verifiedBy: user?.uid
        }
      });
      toast.success("Verification Uplinked. Awaiting Victim Clearance.");
      setResolvingAlert(null);
      setHandshakeInput('');
      setResolutionSummary('');
      setRescuePhoto(null);
      setRespondingToId(null);
    } catch (e) {
      toast.error("Failed to finalize.");
    }
  };

  const maskName = (name: string) => {
    if (!name || name === 'Kavach Citizen') return name;
    const parts = name.split(' ');
    return parts.map(part => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(Math.min(part.length - 1, 7));
    }).join(' ');
  };

  // ----------------------------------------------------
  // 🚔 RENDER VIEW 1: POLICE PCR MDT — professional redesign
  // ----------------------------------------------------
  if (isPcrOfficer) {
    return (
      <>
        <PCROfficerDashboard
          user={user}
          profile={profile}
          userPos={userPos}
          activeAlerts={activeAlerts}
          assignedDispatch={assignedDispatch}
          activeInterceptAlert={activeInterceptAlert}
          respondingToId={respondingToId}
          isNavigating={isNavigating}
          distanceToVictim={distanceToVictim}
          isSirenActive={isSirenActive}
          carSpeed={carSpeed}
          etaTimer={etaTimer}
          shiftElapsedSeconds={shiftElapsedSeconds}
          formatShiftTime={formatShiftTime}
          shiftVehicle={shiftVehicle}
          setShiftVehicle={setShiftVehicle}
          shiftZone={shiftZone}
          setShiftZone={setShiftZone}
          shiftPartner={shiftPartner}
          setShiftPartner={setShiftPartner}
          isOnDuty={isOnDuty}
          handleToggleDuty={handleToggleDuty}
          setIsSirenActive={setIsSirenActive}
          setActiveInterceptAlert={setActiveInterceptAlert}
          setIsInterceptHUDOpen={setIsInterceptHUDOpen}
          setInterceptActive={setInterceptActive}
          setIsNavigating={setIsNavigating}
          handleStartHelp={handleStartHelp}
          setResolvingAlert={setResolvingAlert}
          maskName={maskName}
          fileInputRef={fileInputRef}
          isCarScreenOpen={isCarScreenOpen}
          setIsCarScreenOpen={setIsCarScreenOpen}
        />

        {/* Tactical Response Pledge Modal */}
        <TacticalModal
          isOpen={showTacticalPledge.isOpen}
          onClose={() => setShowTacticalPledge({ isOpen: false, alertId: null })}
          onConfirm={confirmTacticalResponse}
          type="info"
          title="Accept Emergency Response"
          description="You will be assigned to this SOS. Your location and ETA will be shared with HQ and the victim."
          confirmText="ACCEPT & RESPOND"
        />

        {/* Handshake Closure Modal */}
        {resolvingAlert && (
          <div className="fixed inset-0 z-[200000] flex items-center justify-center p-6 animate-none">
            <div
              onClick={() => setResolvingAlert(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-[340px] bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-slate-800 animate-none">
              <h2 className="text-base font-black text-slate-900 uppercase text-center mb-1">Incident Closure</h2>
              <p className="text-[8px] text-slate-500 text-center uppercase tracking-widest mb-5">FIR Handshake — BNSS Protocol</p>
              <div className="space-y-4">
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Evidence Photo</p>
                  <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setRescuePhoto(URL.createObjectURL(f)); }} />
                  <div onClick={() => fileInputRef.current?.click()}
                    className="h-24 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer overflow-hidden">
                    {rescuePhoto
                      ? <img src={rescuePhoto} className="w-full h-full object-cover" alt="Evidence" />
                      : <div className="text-center text-slate-400"><Camera size={20} className="mx-auto mb-1" /><p className="text-[7px] uppercase">Capture Photo</p></div>}
                  </div>
                </div>
                <textarea value={resolutionSummary} onChange={e => setResolutionSummary(e.target.value)}
                  placeholder="Brief case summary..." rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-900 outline-none resize-none" />
                <div className="text-center">
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest mb-2">Victim Safety PIN</p>
                  <div className="flex gap-2 justify-center">
                    {[0,1,2,3].map(i => (
                      <input key={i} type="text" maxLength={1} value={handshakeInput[i] || ''}
                        onChange={e => { const v = e.target.value; if (v && handshakeInput.length < 4) setHandshakeInput(handshakeInput + v); else if (!v) setHandshakeInput(handshakeInput.slice(0,-1)); }}
                        className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-black text-blue-600 outline-none" placeholder="•" />
                    ))}
                  </div>
                </div>
                <button onClick={handleResolveAlert}
                  className="w-full py-4 bg-emerald-605 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[2px] cursor-pointer shadow-md">
                  SUBMIT CLOSURE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full-screen Intercept Navigation HUD */}
        {isInterceptHUDOpen && activeInterceptAlert && (
          <div className="fixed inset-0 z-[2000000] bg-white animate-none">
            {!useMapboxFallback ? (
              <MapplsVictimMap
                activeAlerts={[activeInterceptAlert]}
                isInterceptMode={true}
                isNavigating={isNavigating}
                distance={distanceToVictim[activeInterceptAlert.id] || '---'}
                onToggleNav={() => setIsNavigating(!isNavigating)}
                onResolve={() => { setResolvingAlert(activeInterceptAlert); setIsInterceptHUDOpen(false); setInterceptActive(false); setIsNavigating(false); }}
                onClose={() => { setIsInterceptHUDOpen(false); setInterceptActive(false); setIsNavigating(false); }}
                onFallback={() => setUseMapboxFallback(true)}
              />
            ) : (
              <VictimMap
                activeAlerts={[activeInterceptAlert]}
                isInterceptMode={true}
                isNavigating={isNavigating}
                distance={distanceToVictim[activeInterceptAlert.id] || '---'}
                onToggleNav={() => setIsNavigating(!isNavigating)}
                onResolve={() => { setResolvingAlert(activeInterceptAlert); setIsInterceptHUDOpen(false); setInterceptActive(false); setIsNavigating(false); }}
                onClose={() => { setIsInterceptHUDOpen(false); setInterceptActive(false); setIsNavigating(false); }}
              />
            )}
          </div>
        )}

        {/* Mission Success */}
        {showSuccessMotivation && (
          <div className="fixed inset-0 z-[3000000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-8 text-center text-slate-800 animate-none">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-8 space-y-6 shadow-2xl animate-none">
              <ShieldCheck size={64} className="text-emerald-600 mx-auto" />
              <div>
                <p className="text-[9px] text-emerald-600 uppercase tracking-[4px]">Case Resolved</p>
                <h2 className="text-2xl font-black uppercase italic text-slate-900">Mission Complete</h2>
                <p className="text-[10px] text-slate-500 mt-2">{lastResolvedVictim} is safe. Log updated in HQ.</p>
              </div>
              <button onClick={() => setShowSuccessMotivation(false)}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] cursor-pointer shadow-md">
                RETURN TO PATROL
              </button>
            </div>
          </div>
        )}

        {/* Shift Complete Summary */}
        {showShiftCompleteModal && (
          <div className="fixed inset-0 z-[3000000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 text-slate-800 animate-none">
            <div className="w-full max-w-[320px] bg-white border border-slate-200 rounded-3xl p-6 space-y-5 text-center shadow-2xl animate-none">
              <Car size={40} className="text-sky-600 mx-auto" />
              <div>
                <p className="text-[8px] text-sky-600 uppercase tracking-[3px]">Shift Concluded</p>
                <h2 className="text-xl font-black uppercase text-slate-900">Duty Debrief</h2>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-left">
                {[['Duration', shiftStats.duration], ['Responses', `${shiftStats.responses} Incidents`], ['Vehicle', dynamicVehicleNo], ['Zone', customJurisdiction]].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                    <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">{k}</span>
                    <span className="text-[9px] font-black text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowShiftCompleteModal(false)}
                className="w-full py-3 bg-sky-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[2px] cursor-pointer shadow-md">
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ----------------------------------------------------
  // 👥 RENDER VIEW 2: STANDARD CIVILIAN PROTECTOR VIEW
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans overflow-x-hidden relative animate-none">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#1E40AF 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="px-6 pt-10 flex justify-between items-end mb-6">
        <div>
          <h1 className="text-[22px] font-black text-slate-800 tracking-tighter uppercase italic leading-none">Protector</h1>
          <p className="text-[8px] font-bold text-blue-600 uppercase tracking-[2px] mt-1.5">Mission Control Dashboard</p>
        </div>
      </div>

      <div className="px-6">
        <div className="relative h-[380px] w-full rounded-[40px] bg-white overflow-hidden shadow-sm border border-slate-200">
          {!useMapboxFallback ? (
            <MapplsVictimMap activeAlerts={activeAlerts} mapStyle={mapStyle === 'dark' ? 'streets' : mapStyle} onFallback={() => setUseMapboxFallback(true)} />
          ) : (
            <VictimMap activeAlerts={activeAlerts} mapStyle={mapStyle === 'dark' ? 'streets' : mapStyle} />
          )}
          <div className="absolute inset-x-6 top-6 flex justify-between pointer-events-none">
            <div className="px-4 py-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
              <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Network Online</span>
            </div>
            <button 
              onClick={() => {
                const nextStyle = mapStyle === 'streets' ? 'satellite' : 'streets';
                setMapStyle(nextStyle);
                toast.success(`Map Mode: ${nextStyle.toUpperCase()}`);
              }}
              className="w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-700 pointer-events-auto hover:bg-slate-50 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Layers size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 🛠️ TACTICAL RESOURCE HUB TRIGGERS */}
      <div className="px-6 mt-4 grid grid-cols-2 gap-3">
        <button 
          onClick={() => setIsNearbyHubOpen(true)}
          className="p-3.5 bg-white border border-slate-200 text-slate-850 rounded-[24px] flex flex-col items-center justify-center gap-1.5 shadow-sm hover:bg-slate-50 active:scale-95 transition-all group relative overflow-hidden cursor-pointer"
        >
          <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <Shield size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 italic">Police Station</span>
          <span className="text-[5px] text-slate-500 font-bold uppercase tracking-[1.5px] mt-0.5">HQ & Local Outposts</span>
        </button>

        <button 
          onClick={() => setIsMedicalHubOpen(true)}
          className="p-3.5 bg-white border border-slate-200 text-slate-850 rounded-[24px] flex flex-col items-center justify-center gap-1.5 shadow-sm hover:bg-slate-50 active:scale-95 transition-all group relative overflow-hidden cursor-pointer"
        >
          <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-600">
            <Activity size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5 italic">Medical Hub</span>
          <span className="text-[5px] text-slate-500 font-bold uppercase tracking-[1.5px] mt-0.5">Ambulance & Trauma</span>
        </button>
      </div>

      <div className="px-6 mt-6">
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[2px] flex items-center gap-2"><Activity size={14} className="text-blue-600" /> Urgent Dispatch</h3>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-705 px-2.5 py-1 rounded-full shadow-sm"><span className="text-[7px] font-black uppercase tracking-wider">{activeAlerts.length} Critical Units</span></div>
        </div>
        <div className="space-y-6">
          {activeAlerts.length > 0 ? (
            activeAlerts.map((alert) => {
              const isMeResponding = (alert.activeResponders || []).some((r: any) => r.uid === user?.uid);
              return (
                <div key={alert.id} className="relative group animate-none">
                  <div className="bg-white rounded-[24px] p-3.5 shadow-sm border border-slate-200 overflow-hidden transition-all duration-550">
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-full">
                        <div className="w-1 h-1 bg-blue-600 rounded-full" />
                        <span className="text-[6px] font-black text-blue-600 uppercase tracking-[1.5px]">Mission Active</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <div className="w-0.5 h-0.5 bg-slate-200 rounded-full" />
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">#{alert.id.slice(-4).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 mb-4.5">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="relative w-10 h-10 bg-slate-100 rounded-[16px] flex items-center justify-center text-slate-600 border border-slate-200 shadow-sm overflow-hidden">
                            <Shield size={16} strokeWidth={1} className="opacity-40" />
                          </div>
                        </div>
                        <div className="space-y-0">
                          <h4 className="text-md font-black text-slate-800 tracking-tighter uppercase italic leading-none">{maskName(alert.victimName)}</h4>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-50 flex items-center justify-center"><MapPin size={6} className="text-blue-500" /></div>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[1px] truncate max-w-[100px]">{alert.isTransitSOS ? `Vehicle: ${alert.vehicleNo}` : (alert.locationName || 'Unidentified Sector')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[16px] shadow-sm">
                          <p className="text-md font-black text-slate-850 tracking-tighter leading-none">{distanceToVictim[alert.id] || '---'}</p>
                          <p className="text-[6px] font-black text-blue-600/40 uppercase tracking-widest mt-0.5 text-right">Distance</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => isMeResponding ? (setActiveInterceptAlert(alert), setIsInterceptHUDOpen(true), setInterceptActive(true)) : handleStartHelp(alert.id)} 
                          className={cn(
                            "py-2.5 rounded-[16px] text-[8px] font-black uppercase tracking-[2px] shadow-sm transition-all active:scale-[0.97] cursor-pointer", 
                            isMeResponding ? "bg-blue-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
                          )}
                        >
                          {isMeResponding ? '✓ Intercept HUD' : 'Start Help'}
                        </button>
                        
                        <button 
                          onClick={() => initiateCall(alert.uid || alert.victimUid || '', alert.victimName || 'Citizen', alert.id)}
                          className="py-2.5 bg-white border border-slate-200 text-slate-805 rounded-[16px] text-[8px] font-black uppercase tracking-[2px] shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Phone size={10} className="text-blue-600" />
                          Call Victim
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 bg-white rounded-[32px] border border-slate-200 text-center flex flex-col items-center justify-center p-8 space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500"><Shield size={20} /></div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Standing By</h4>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[2px]">No incoming distress signals in your coordinates.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vetting Overlay Confirmation */}
      <TacticalModal isOpen={showTacticalPledge.isOpen} onClose={() => setShowTacticalPledge({ isOpen: false, alertId: null })} onConfirm={confirmTacticalResponse} type="info" title="Emergency Response Activated" description="Your live activity and route will now be monitored securely while you assist the victim." confirmText="START RESPONSE" />

      {/* Handshake Closure modal */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-none">
          <div onClick={() => setResolvingAlert(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-[340px] bg-white rounded-[40px] p-6 shadow-2xl border border-slate-200 text-slate-800 animate-none">
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-1 bg-emerald-500 rounded-full mb-4" />
              <h2 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">Safety Confirmation</h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Capture a verification photo and confirm safe status.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex justify-between"><span>Capture Verification Photo</span><span className="text-emerald-600">VERIFIED</span></p>
                <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setRescuePhoto(URL.createObjectURL(file));
                }} />
                <div onClick={() => fileInputRef.current?.click()} className="relative w-full h-32 rounded-[24px] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all hover:bg-slate-100">
                  {rescuePhoto ? <img src={rescuePhoto} className="w-full h-full object-cover" alt="Safety Proof" /> : <div className="flex flex-col items-center text-slate-400"><Camera size={32} strokeWidth={1} /><span className="text-[8px] font-black uppercase mt-2 tracking-[3px]">Capture Photo</span></div>}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Tactical Summary (Closure Reason)</p>
                <textarea value={resolutionSummary} onChange={(e) => setResolutionSummary(e.target.value)} placeholder="e.g. Victim safe, suspect fled..." className="w-full h-20 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[10px] font-bold text-slate-900 outline-none focus:border-blue-500 transition-all resize-none" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Victim Safety Code</p>
                <div className="flex gap-2 justify-center">
                  {[0, 1, 2, 3].map(i => (
                    <input key={i} type="text" maxLength={1} value={handshakeInput[i] || ''} onChange={(e) => {
                      const val = e.target.value;
                      if (val && handshakeInput.length < 4) setHandshakeInput(handshakeInput + val);
                      else if (!val) setHandshakeInput(handshakeInput.slice(0, -1));
                    }} className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-black text-blue-600 outline-none focus:border-blue-500 transition-all" placeholder="•" />
                  ))}
                </div>
              </div>
              <div className="pt-2 space-y-2">
                <button onClick={handleResolveAlert} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[2px] shadow-md cursor-pointer">CONFIRM SAFE STATUS</button>
                <button onClick={() => setResolvingAlert(null)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[20px] text-[11px] font-black uppercase tracking-[2px] cursor-pointer">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Intercept HUD */}
      {isInterceptHUDOpen && activeInterceptAlert && (
        <div className="fixed inset-0 z-[2000000] bg-white animate-none">
          <div className="absolute inset-0">
            {!useMapboxFallback ? (
              <MapplsVictimMap activeAlerts={[activeInterceptAlert]} isInterceptMode={true} isNavigating={isNavigating} distance={distanceToVictim[activeInterceptAlert.id] || '---'} onToggleNav={() => setIsNavigating(!isNavigating)} onResolve={() => { setResolvingAlert(activeInterceptAlert); setIsInterceptHUDOpen(false); setInterceptActive(false); setIsNavigating(false); }} onClose={() => { setIsInterceptHUDOpen(false); setInterceptActive(false); setIsNavigating(false); }} onFallback={() => setUseMapboxFallback(true)} />
            ) : (
              <VictimMap activeAlerts={[activeInterceptAlert]} isInterceptMode={true} isNavigating={isNavigating} distance={distanceToVictim[activeInterceptAlert.id] || '---'} onToggleNav={() => setIsNavigating(!isNavigating)} onResolve={() => { setResolvingAlert(activeInterceptAlert); setIsInterceptHUDOpen(false); setInterceptActive(false); setIsNavigating(false); }} onClose={() => { setIsInterceptHUDOpen(false); setInterceptActive(false); setIsNavigating(false); }} />
            )}
          </div>
          <div className="absolute inset-x-0 top-0 pt-16 px-6 pointer-events-none">
            <div className={cn("backdrop-blur-xl rounded-3xl p-4 border shadow-lg flex items-center justify-between transition-all duration-700", (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "bg-emerald-50/95 border-emerald-200" : "bg-white/95 border-slate-200")}>
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all shadow-sm", (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "bg-emerald-600" : "bg-blue-600")}>
                  {(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? <CheckCircle2 size={20} /> : <Navigation size={20} />}
                </div>
                <div>
                  <p className={cn("text-[8px] font-black uppercase tracking-[2px]", (parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "text-emerald-700" : "text-blue-600")}>{(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "TARGET REACHED" : "Tactical Intercept Active"}</p>
                  <h2 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter leading-none mt-1">{(parseInt(distanceToVictim[activeInterceptAlert.id]) < 15 || distanceToVictim[activeInterceptAlert.id] === '0m') ? "INITIATE CLEARANCE" : "LIVE TARGET LOCK"}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <NearbyHubModal isOpen={isNearbyHubOpen} onClose={() => setIsNearbyHubOpen(false)} />
      <MedicalHubModal isOpen={isMedicalHubOpen} onClose={() => setIsMedicalHubOpen(false)} />

      {/* Success / Mission Complete celebration */}
      {showSuccessMotivation && (
        <div className="fixed inset-0 z-[3000000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-8 text-center text-slate-800 animate-none">
          <div className="bg-white border border-slate-200 rounded-[40px] p-10 max-w-md w-full space-y-8 shadow-2xl relative animate-none">
            <div className="relative mx-auto w-40 h-40">
              <div className="relative w-full h-full rounded-full border border-slate-200 flex items-center justify-center bg-slate-50">
                <ShieldCheck size={80} className="text-amber-500" strokeWidth={1} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-amber-600 text-[10px] font-black uppercase tracking-[6px]">Grid Victory Secured</p>
                <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-slate-900">Mission Accomplished</h2>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 space-y-4">
                <p className="text-sm font-bold text-slate-700 uppercase leading-relaxed tracking-tight italic">
                  "The citizen {lastResolvedVictim} is safe. Your tactical response ensured the safety grid remained unbroken."
                </p>
                <div className="h-px w-12 bg-slate-200 mx-auto" />
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-[4px]">Kavach Honor: Unblemished</p>
              </div>
            </div>
            <button onClick={() => setShowSuccessMotivation(false)} className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[4px] shadow-md active:scale-95 transition-all cursor-pointer">
              Return to Grid
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
