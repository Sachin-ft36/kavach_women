import React, { useState, useEffect } from 'react';
import { Shield, MapPin, AlertCircle, Users, Bell, CheckCircle2, Navigation, Phone, Search, Filter, Activity, Database, Lock, Gavel, History, FileText, Trophy, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import RakshakMap from './RakshakMap';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs, updateDoc, doc, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function SuperCellDashboard() {
  const { t } = useLanguage();
  const isAdmin = auth.currentUser?.email === 'singh.sachin16559@gmail.com';
  
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-xl rounded-3xl border border-accent-red/20">
        <div className="w-20 h-20 bg-accent-red/10 rounded-2xl flex items-center justify-center text-accent-red mb-6 border border-accent-red/20 shadow-[0_0_50px_rgba(255,59,48,0.2)]">
          <Lock size={40} />
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-white">Identity Mismatch</h2>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px] leading-relaxed max-w-[320px]">
          Neural link rejected. This Command Console is reserved exclusively for National Home Ministry Personnel.
        </p>
      </div>
    );
  }

  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProtectors: 1240,
    activeEmergencies: 0,
    resolvedToday: 45,
    networkHealth: '99.9%'
  });
  const [mapFocus, setMapFocus] = useState<[number, number] | null>(null);
  const [protectors, setProtectors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    // 1. Listen for ALL active alerts across the country
    const alertQuery = query(
      collection(db, 'alerts'),
      where('status', '==', 'active'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeAlerts = onSnapshot(alertQuery, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: (doc.data().timestamp as any)?.toDate().toLocaleTimeString() || 'Just now'
      }));
      setActiveAlerts(alerts);
      setStats(prev => ({ ...prev, activeEmergencies: alerts.length }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'alerts');
    });

    // 2. Listen for ALL active users for Real-time Stats
    const userQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(userQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      const protectorsCount = users.filter((u: any) => u.role === 'protector').length;
      const citizenCount = users.filter((u: any) => u.role === 'citizen').length;

      setStats(prev => ({
        ...prev,
        totalProtectors: protectorsCount,
        networkHealth: citizenCount > 0 ? '99.9%' : 'Initializing...'
      }));

      // Update protectors list for merit grant
      setProtectors(users.filter((u: any) => u.role === 'protector').slice(0, 10));
    }, (error) => {
      console.warn("Stats monitor failed:", error);
    });

    return () => {
      unsubscribeAlerts();
      unsubscribeUsers();
    };
  }, []);

  const logMissionAction = async (action: string, details: string) => {
    try {
      await addDoc(collection(db, 'mission_ledger'), {
        adminEmail: auth.currentUser?.email,
        action,
        details,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn("Ledger Sync Failed:", err);
    }
  };

  const approveMission = async (alertId: string) => {
    try {
      const resolverEmail = auth.currentUser?.email || 'MHA Admin';
      
      await updateDoc(doc(db, 'alerts', alertId), { 
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        resolvedBy: resolverEmail
      });
      
      logMissionAction('MISSION_RESOLVED', `Mission ${alertId} closed by Command. Responder credited.`);
    } catch (error) {
      console.error("Mission Approval Failed:", error);
    }
  };

  return (
    <div className="bento-grid">
      {/* Ministry Header */}
      <section className="bento-card col-span-1 md:col-span-4 lg:col-span-4 row-span-1 bg-black p-8 border-l-4 border-l-accent-red">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-accent-red/10 rounded-xl flex items-center justify-center text-accent-red border border-accent-red/30 shadow-lg">
              <Shield size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">{t('command_control')}</h1>
              <p className="text-[10px] text-accent-red font-mono font-bold uppercase tracking-[4px] opacity-80">{t('mha_grid')}</p>
            </div>
          </div>
          <div className="hidden md:flex gap-12">
            <StatItem icon={<Activity size={18} />} label={t('network_health')} value={stats.networkHealth} color="text-green-500" />
            <StatItem icon={<Users size={18} />} label={t('protectors_active')} value={stats.totalProtectors.toString()} color="text-accent-blue" />
            <StatItem icon={<AlertCircle size={18} />} label={t('live_sos')} value={stats.activeEmergencies.toString()} color="text-accent-red" />
          </div>
        </div>
      </section>

      {/* Global Command Map */}
      <section className="bento-card col-span-1 md:col-span-3 lg:col-span-3 row-span-3 p-0 group overflow-hidden relative border-white/5">
        <div className="absolute top-8 left-8 z-10">
          <div className="bg-black/80 backdrop-blur-xl px-6 py-3 rounded-xl border border-white/20 shadow-2xl">
            <span className="text-[10px] font-mono font-bold tracking-[3px] text-white opacity-80">{t('global_view')}</span>
          </div>
        </div>
        <div className="h-[400px] md:h-[600px] lg:h-full">
          <RakshakMap hideHeader centerOverride={mapFocus} />
        </div>
      </section>

      {/* Live Feed */}
      <section className="bento-card col-span-1 md:col-span-1 lg:col-span-1 row-span-3 flex flex-col border-white/5">
        <div className="bento-card-title flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity size={16} className="text-accent-red" />
            <span className="text-[11px] font-mono font-bold tracking-[2px]">{t('live_feed_feed')}</span>
          </div>
          <span className="text-[9px] font-black text-gray-600 tracking-widest">{t('real_threat') || "REAL-TIME"}</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          <AnimatePresence>
            {activeAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setMapFocus(alert.coords)}
                className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-mono font-bold text-accent-red uppercase tracking-widest">{alert.type}</span>
                    <span className="text-[8px] text-gray-500 font-mono font-bold">{alert.time}</span>
                  </div>
                  <h4 className="text-[12px] font-black italic tracking-tight">{alert.victimName}</h4>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight mb-4">{alert.location}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        approveMission(alert.id);
                      }}
                      className="flex-1 py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg active:scale-95"
                    >
                      {t('mission_approval')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="px-4 py-3 bg-white/5 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                    >
                      {t('vault')}
                    </button>
                  </div>
                
                {/* Home Ministry Data Panel (Unmasked) */}
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3 font-mono">
                  <div className="flex justify-between items-center text-[8px]">
                    <span className="text-gray-500 font-bold uppercase tracking-widest">{t('identity_anchors')}</span>
                    <span className="text-accent-blue font-black tracking-tighter">{alert.victimPhone || 'N/A'} • {alert.victimAadhaar || 'N/A'}</span>
                  </div>
                  
                  <div className="bg-black p-3 rounded-xl border border-white/5">
                    <p className="text-[7px] font-black text-gray-600 uppercase tracking-[3px] mb-2">{t('tactical_responders')}</p>
                    <div className="space-y-1.5">
                      {alert.responders && alert.responders.length > 0 ? (
                        alert.responders.map((r: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-[8px] font-bold text-white uppercase tracking-tight">{r.name}</span>
                            <span className="text-[8px] text-green-500 font-black italic uppercase tracking-widest">{t('deploying')}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[8px] text-gray-600 italic uppercase tracking-widest text-center py-1">No Active Deployments</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {activeAlerts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
                <CheckCircle2 size={56} className="mb-6 opacity-40 text-green-500" />
                <p className="text-[11px] font-black italic uppercase tracking-[3px]">{t('all_clear')}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Evidence & Legal Card */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 row-span-1 grid grid-cols-2 gap-4 border-white/5">
        <div className="bento-card-title col-span-2 flex items-center gap-3">
          <Database size={16} className="text-accent-blue" />
          <span className="text-[11px] font-mono font-bold tracking-[2px]">{t('legal_vault')}</span>
        </div>
        <div className="bg-white/2 p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-accent-blue/10 transition-all cursor-pointer">
          <Lock size={32} className="text-accent-blue/40 group-hover:text-accent-blue transition-colors mb-2" />
          <span className="text-[9px] font-black uppercase tracking-widest">{t('command_center')}</span>
          <span className="text-[8px] text-gray-600 font-mono font-bold uppercase mt-1">{t('court_admissible')}</span>
        </div>
        <div className="bg-white/2 p-6 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-accent-red/10 transition-all cursor-pointer">
          <Gavel size={32} className="text-accent-red/40 group-hover:text-accent-red transition-colors mb-2" />
          <span className="text-[9px] font-black uppercase tracking-widest">{t('zero_fir_portal')}</span>
          <span className="text-[8px] text-gray-600 font-mono font-bold uppercase mt-1">{t('direct_prosecution')}</span>
        </div>
      </section>

      {/* Mission Ledger & Protector Merit */}
      <section className="bento-card col-span-1 md:col-span-4 lg:col-span-4 border-white/5 space-y-8">
        <div>
          <div className="bento-card-title mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-500">
              <Database size={16} />
              <span className="text-[11px] font-mono font-bold tracking-[3px] uppercase">{t('audit_log')}</span>
            </div>
          </div>
          <div className="bg-black/80 rounded-xl border border-white/10 p-6 overflow-x-auto shadow-2xl">
            <table className="w-full text-left text-[9px] font-mono font-bold">
              <thead className="text-gray-600 uppercase tracking-[3px] border-b border-white/20">
                <tr>
                  <th className="pb-4">TIMESTAMP</th>
                  <th className="pb-4">OP_IDENTITY</th>
                  <th className="pb-4">PROFILE</th>
                  <th className="pb-4">MISSION_LOG</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                <tr className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="py-4">16:47:22</td>
                  <td className="py-4 opacity-100 text-accent-blue uppercase">{auth.currentUser?.email?.split('@')[0]}@MHA</td>
                  <td className="py-4 text-accent-blue font-black uppercase tracking-widest">GRID_SYNC</td>
                  <td className="py-4 leading-relaxed">SECURE_TUNNEL_ESTABLISHED: National Safety Grid Synced with Local Node.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Protector Merit Management */}
        <div className="pt-8 border-t border-white/5">
          <div className="bento-card-title mb-6 flex items-center gap-3 text-accent-blue">
            <Trophy size={16} />
            <span className="text-[11px] font-mono font-bold tracking-[3px] uppercase">Protector Merit Management</span>
          </div>
          
          {/* Tactical Search Filter */}
          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text"
              placeholder="SEARCH PROTECTOR BY NAME OR IDENTITY..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest focus:border-accent-blue/50 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {protectors
              .filter(p => !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.email?.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((p, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue font-black italic">
                    {p.name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black italic uppercase tracking-tight">{p.name || 'Verified Protector'}</p>
                    <p className="text-[8px] text-gray-500 font-mono font-bold uppercase">{p.xp || 0} XP</p>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if(confirm(`Grant 50 Merit XP to ${p.name}?`)) {
                      await updateDoc(doc(db, 'users', p.uid), {
                        xp: increment(50)
                      });
                      logMissionAction('MERIT_GRANTED', `50 XP awarded to Protector ${p.uid} by Command.`);
                    }
                  }}
                  className="px-3 py-2 bg-accent-blue/20 text-accent-blue rounded-lg text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Grant Merit
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatItem({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-white/5", color)}>
        {icon}
      </div>
      <div>
        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{label}</p>
        <p className={cn("text-lg font-black leading-tight", color)}>{value}</p>
      </div>
    </div>
  );
}
