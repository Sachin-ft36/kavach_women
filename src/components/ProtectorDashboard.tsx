import React, { useState, useEffect } from 'react';
import { Shield, MapPin, AlertCircle, Users, Bell, Phone, Navigation, CheckCircle2, Activity, ShieldAlert, User, Lock, Zap, PhoneCall, ShieldCheck, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import RakshakMap from './RakshakMap';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';
import { registerPlugin } from '@capacitor/core';

import { useCall } from '../contexts/CallContext';

export default function ProtectorDashboard() {
  const { t } = useLanguage();
  const { initiateCall, callState, hangupCall } = useCall();
  const [mapFocus, setMapFocus] = useState<[number, number] | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [proximityAlert, setProximityAlert] = useState<any>(null);
  const [points, setPoints] = useState(0);
  const [rank, setRank] = useState(42);
  const user = auth.currentUser;

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error("KAVACH Patrol Error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthReady(true);
        console.log("KAVACH: Auth Handshake verified. Engaging Grid.");
      } else {
        setIsAuthReady(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setPoints(data.xp || 0);
      }
    });
    return () => unsubscribe();
  }, [user, isAuthReady]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const [allAlerts, setAllAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthReady) return;
    
    console.log("KAVACH: Initiating Secure Alert Feed...");
    // Listen for ALL active alerts
    const q = query(
      collection(db, 'alerts'), 
      where('status', '==', 'active'), 
      orderBy('timestamp', 'desc'), 
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllAlerts(alerts);
    }, (error) => {
      console.warn("KAVACH: Firestore Handshake Delay. Retrying...");
      handleFirestoreError(error, OperationType.LIST, 'alerts');
    });
    
    return () => unsubscribe();
  }, [isAuthReady]);

  const [isAlarmActive, setIsAlarmActive] = useState(false);

  const toggleSiren = async (start: boolean) => {
    try {
      const KavachPlugin = registerPlugin<any>('KavachPlugin');
      const KavachDirect = (window as any).KavachDirect;
      
      if (start) {
        setIsAlarmActive(true);
        // Engagement: Try Plugin then Fallback
        try { await KavachPlugin.startContinuousSiren(); }
        catch { if (KavachDirect?.startSirenBypass) KavachDirect.startSirenBypass(); }
      } else {
        setIsAlarmActive(false);
        try { await KavachPlugin.stopContinuousSiren(); }
        catch { if (KavachDirect?.stopSirenBypass) KavachDirect.stopSirenBypass(); }
      }
    } catch (e) {
      console.warn("Siren Bridge Compromised:", e);
    }
  };

  // Reactive Proximity Filter: Updates as the Protector MOVES or NEW ALERTS arrive
  useEffect(() => {
    if (!userLocation || !user) return;

    const proximate = allAlerts.map(alert => {
      const dist = alert.coords ? calculateDistance(userLocation[0], userLocation[1], alert.coords[0], alert.coords[1]) : null;
      return { ...alert, distanceKm: dist, isProximate: dist !== null && dist <= 1.0 };
    }).filter(a => a.isProximate && a.victimUid !== user.uid); // SELF-FILTER: Don't show own mission alerts

    // Continuous Alarm Logic: Trigger if NEW proximate alert is detected
    const hasNewAlert = proximate.some(a => !activeAlerts.some(existing => existing.id === a.id));
    if (hasNewAlert && !isAlarmActive) {
      toggleSiren(true);
    }

    setActiveAlerts(proximate);

    // Dynamic Focus: Focus map on newest proximate alerts
    const newest = proximate.find(a => !activeAlerts.some(existing => existing.id === a.id));
    if (newest) {
      setProximityAlert(newest);
      setMapFocus(newest.coords);
    }
  }, [allAlerts, userLocation]);

  const handleCall = (e: React.MouseEvent, alert: any) => {
    e.stopPropagation();
    initiateCall(alert.victimUid, alert.victimName || 'Verified Citizen');
  };

  const handleNavigate = (e: React.MouseEvent, coords: [number, number]) => {
    e.stopPropagation();
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`, '_blank');
  };

  const logDeployment = async (alertId: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        responders: arrayUnion({ uid: auth.currentUser.uid, name: auth.currentUser.displayName || 'Protector', timestamp: new Date().toISOString() })
      });
    } catch (err) { console.warn("MHA Logging Failed:", err); }
  };

  return (
    <div className="bento-grid relative p-4 bg-[#0a0a0a] text-white">
      <AnimatePresence>
        {isAlarmActive && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] w-full max-w-xs"
          >
            <div className="bg-red-600 p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-red-500/50 animate-pulse">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-white animate-bounce" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Continuous Siren Active</span>
              </div>
              <button 
                onClick={() => toggleSiren(false)}
                className="px-4 py-2 bg-black/30 hover:bg-black/50 text-white text-[9px] font-black uppercase rounded-lg transition-all"
              >
                Silence
              </button>
            </div>
          </motion.div>
        )}

        {callState !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-[32px] p-10 text-center space-y-8 shadow-2xl">
              <div className="relative mx-auto w-24 h-24 bg-accent-blue/10 border border-accent-blue/30 rounded-3xl flex items-center justify-center text-accent-blue">
                <div className="absolute inset-0 bg-accent-blue/20 rounded-3xl animate-ping" />
                <PhoneCall size={40} className="relative z-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-2">
                  {callState === 'calling' ? 'ENCRYPTING LINK...' : 'SECURE LINE ACTIVE'}
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[3px]">Kavach Secure Line - Verified Connection</p>
              </div>
              <button 
                onClick={hangupCall} 
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-lg border border-red-500/30"
              >
                Terminate Connection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 text-accent-blue mb-2">
              <Shield size={16} />
              <span className="text-[10px] font-black uppercase tracking-[3px] italic">{t('protector_status_active')}</span>
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{t('on_duty')}</h2>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={async () => {
                if (confirm("DEACTIVATE MISSION GRID? This will terminate the Neural Link and background sensors.")) {
                  try {
                    const KavachPlugin = registerPlugin<any>('KavachPlugin');
                    const KavachDirect = (window as any).KavachDirect;
                    
                    // Kill Service
                    try { await KavachPlugin.stopService(); }
                    catch { /* Fallback not needed for stop usually */ }
                    
                    // Silence Siren
                    await toggleSiren(false);
                    
                    alert("MISSION DEACTIVATED. Systems Offline.");
                  } catch (e) {
                    console.error("Kill Switch Failure:", e);
                  }
                }
              }}
              className="px-6 py-4 bg-red-600/10 border border-red-600/30 text-red-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600/20 transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.2)]"
            >
              Kill Switch
            </button>
            <button 
              onClick={() => {
                (registerPlugin<any>('KavachPlugin')).triggerAlarmStation({
                  title: "🛡️ KAVACH ALARM TEST",
                  body: "ALARM STATION OPERATIONAL. THIS IS A TACTICAL DRILL."
                }).catch((e: any) => console.error("Alarm Bridge Failed:", e));
              }}
              className="px-6 py-4 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-accent-blue/20 transition-all active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              Test Alarm Station
            </button>
          </div>
        </div>

      {/* Map View Card - Tactical Grid Alignment */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 row-span-2 p-0 group overflow-hidden border-2 border-accent-blue/20 min-h-[450px]">
        <div className="absolute inset-x-0 top-0 z-10 pointer-events-none p-6 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[3px] text-white italic">
              {t('rakshak_network')} // LIVE TRACKING ACTIVE
            </span>
          </div>
        </div>
        <div className="relative h-full w-full group-hover:scale-105 transition-all duration-700">
          <RakshakMap hideHeader centerOverride={mapFocus} />
        </div>
      </section>

      {/* Active Alerts HUD */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 bg-[#080808] border border-white/5 p-6">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-600" />
            <span className="text-[10px] font-black uppercase tracking-[3px] italic">{t('active_alerts')}</span>
          </div>
          <div className="text-[10px] font-mono font-bold text-gray-600 uppercase">Telemetry: Online</div>
        </div>
        <div className="space-y-4">
          {activeAlerts.map((alert) => (
            <motion.div key={alert.id} className="bg-[#1a1a1a] border border-white/10 p-4 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <Zap size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono font-bold text-red-500 uppercase tracking-widest">{alert.type}</span>
                    {alert.isProximate && <span className="text-[8px] font-mono font-bold bg-red-500 text-white px-2 py-0.5 rounded uppercase">{t('immediate_range')}</span>}
                  </div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase">{alert.location}</p>
                </div>
              </div>
              
              {alert.metadata && (
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-mono font-bold uppercase">{t('victim_status')}</span>
                    <span className="text-green-500">{alert.metadata.threatLevel}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500 font-mono font-bold uppercase">{t('distance')}</span>
                    <span className="text-white font-black">{alert.distanceKm?.toFixed(2)}km</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Lock size={12} className="text-accent-blue" />
                      <span className="text-gray-500 font-mono font-bold uppercase">{t('security_mask')}</span>
                    </div>
                    <span className="text-accent-blue font-black font-mono">Kavach Secure Line</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button 
                  onClick={(e) => handleNavigate(e, alert.coords)} 
                  className="px-6 py-4 rounded-xl bg-white text-black font-black flex items-center justify-center transition-all active:scale-95 shadow-lg"
                  title={t('navigate')}
                >
                  <Navigation size={18} />
                </button>
                <button 
                  onClick={(e) => handleCall(e, alert)} 
                  className="px-6 py-4 rounded-xl bg-white/5 text-white flex items-center justify-center border border-white/10 transition-all active:scale-95"
                  title={t('call')}
                >
                  <Phone size={18} />
                </button>
                <button onClick={async (e) => { 
                  e.stopPropagation(); 
                  const resolverEmail = auth.currentUser?.email || 'Protector';
                  
                  if(confirm(t('confirm_safety'))) {
                    try {
                      // MISSION AUDIT & RESOLUTION
                      await updateDoc(doc(db, 'alerts', alert.id), { 
                        status: 'resolved',
                        resolvedAt: serverTimestamp(),
                        resolvedBy: resolverEmail
                      });
                      
                      // ATOMIC MERIT AWARD (Grant points only on successful resolve)
                      if (user) {
                        await updateDoc(doc(db, 'users', user.uid), {
                          xp: increment(100)
                        });
                        console.log("KAVACH: Mission Merit XP Granted.");
                      }
                    } catch (err) {
                      console.error("Resolution sync failed:", err);
                    }
                  }
                }} className="flex-1 py-4 rounded-xl bg-green-600/10 text-green-500 flex items-center justify-center gap-2 border border-green-500/20 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                  <CheckCircle2 size={16} /> {t('resolve')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Network Stats Card */}
      <section className="bento-card col-span-1 md:col-span-1 lg:col-span-1 row-span-1 grid grid-cols-2 gap-4">
        <div className="bento-card-title col-span-2">NETWORK STATS</div>
        <div className="text-center">
          <span className="text-2xl font-black block">12</span>
          <span className="text-[8px] text-gray-500 font-bold uppercase">Nearby Protectors</span>
        </div>
        <div className="text-center">
          <span className="text-2xl font-black block text-green-500">100%</span>
          <span className="text-[8px] text-gray-500 font-bold uppercase">Response Rate</span>
        </div>
      </section>

      {/* Verification Card */}
      <section className="bento-card col-span-1 md:col-span-1 lg:col-span-1 row-span-1">
        <div className="bento-card-title">CREDENTIALS</div>
        <div className="mt-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-500">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-bold">UID VERIFIED</p>
            <p className="text-[10px] text-gray-500 uppercase">Police ID Linked</p>
          </div>
        </div>
      </section>

      {/* National Rewards Card (GAMIFICATION) */}
      <section className="bento-card col-span-1 md:col-span-1 lg:col-span-2 bg-gradient-to-br from-[#0a1525] to-card-bg border-accent-blue/20">
        <div className="bento-card-title flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-yellow-500" />
            NATIONAL LEADERBOARD
          </div>
          <span className="text-[10px] font-black text-accent-blue uppercase tracking-widest">Global Rank: #{rank}</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 border border-yellow-500/30">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <p className="text-2xl font-black italic">{points} XP</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Rakshak Merit Points</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-accent-blue font-black uppercase tracking-widest mb-1">Badges Earned</p>
            <div className="flex gap-2 justify-end">
              {['🛡️', '⚡', '👁️'].map((b, i) => (
                <div key={i} className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10" title="First Responder">
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
