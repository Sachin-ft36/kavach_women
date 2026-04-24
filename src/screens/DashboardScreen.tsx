import React from 'react';
import SOSButton from '../components/SOSButton';
import VictimMap from '../components/maps/VictimMap';
import RideModeHUD from '../components/RideModeHUD';
import { Shield, Activity, ShieldCheck, Map as MapIcon, Lock, Smartphone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useKavachStore } from '../store/useKavachStore';

export default function DashboardScreen() {
  const { setActiveTab, batteryLevel, gender, userPos, syncLocation } = useKavachStore();
  const { t } = useLanguage();

  // Force high-accuracy sync on dashboard entry
  React.useEffect(() => {
    syncLocation();
  }, []);

  return (
    <div className="bento-grid overflow-y-auto pb-40 scroll-smooth">
      {/* National Neural Network Status */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-4 p-4 sm:p-6 bg-gradient-to-r from-card-bg to-[#0d0d0f] border-accent-blue/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse shadow-[0_0_10px_rgba(0,122,255,0.5)]" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-[3px] text-accent-blue">{t('neural_online')}</span>
          </div>
          <div className="flex gap-6 justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <p className="text-[8px] text-text-dim font-bold uppercase tracking-wider">{t('background_sync') || "Background Sync"}</p>
              <p className="text-[10px] font-black italic text-green-500 uppercase tracking-tight">{t('active_persistent')}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[8px] text-text-dim font-bold uppercase tracking-wider">{t('threat_level')}</p>
              <p className="text-[10px] font-black italic text-accent-blue uppercase tracking-tight">{t('optimal_secure')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SOS Hero Card */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#1a0a0a_0%,#0F0F11_100%)] border-2 border-accent-red/10 min-h-[340px] shadow-2xl">
        <div className="bento-card-title absolute top-6 left-6 right-6">
          <span>{t('emergency_response')}</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-accent-red rounded-full animate-ping" />
            <div className="w-1 h-1 bg-accent-red rounded-full opacity-50" />
          </div>
        </div>
        
        {gender === 'female' ? (
          <SOSButton />
        ) : (
          <div className="text-center p-8 space-y-6">
            <div className="w-20 h-20 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mx-auto shadow-inner">
              <Shield size={40} className="text-white opacity-20" />
            </div>
            <div>
              <h3 className="font-black italic uppercase text-accent-blue leading-tight mb-2 tracking-tighter text-xl">{t('tactical_disabled')}</h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[2px] leading-relaxed max-w-[200px] mx-auto opacity-60">
                Unauthorized Identity detected. Emergency response reserved for authorized female citizens.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Ride Mode HUD - Tactical Cab/Auto Safety */}
      <section className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col gap-4">
        <RideModeHUD />
      </section>

      {/* Safety Score & Leaderboard */}
      <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
        <section className="bento-card border-l-4 border-l-accent-blue">
          <div className="bento-card-title">
            <span>{t('neural_link_link')}</span>
            <Activity size={14} className="text-accent-blue animate-pulse" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black italic text-accent-blue leading-none uppercase tracking-tighter">{t('synced') || "SYNCED"}</div>
            <p className="text-[8px] text-gray-500 font-mono font-bold uppercase mt-3 tracking-widest opacity-60">
              LOC: {userPos?.[0]?.toFixed(3)}N / {userPos?.[1]?.toFixed(3)}E
            </p>
          </div>
        </section>

        <section className="bento-card border-l-4 border-l-green-600">
          <div className="bento-card-title">
            <span>{t('grid_status')}</span>
            <ShieldCheck size={14} className="text-green-600" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black italic text-green-600 leading-none tracking-tighter uppercase">{t('optimal_secure')?.split('/')[0] || "OPTIMAL"}</div>
            <p className="text-[8px] text-gray-500 font-mono font-bold uppercase mt-3 tracking-widest opacity-60">SHIELD: {t('verified') || "VERIFIED"}</p>
          </div>
        </section>
      </div>

      {/* Map Card — Tactical High-Fidelity HUD */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 p-0 group overflow-hidden min-h-[340px] border-accent-blue/10">
        <div className="absolute inset-0 z-10 pointer-events-none p-5">
          <div className="bento-card-title flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapIcon size={14} className="text-accent-blue" />
              {t('rakshak_network')}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-accent-blue">Satellite High-Def</span>
            </div>
          </div>
        </div>
        <div className="h-full w-full">
          <VictimMap hideHeader />
        </div>
      </section>

      {/* Lower Tactical Grid */}
      <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
        <section className="bento-card aspect-square sm:aspect-auto flex flex-col justify-between group cursor-pointer" onClick={() => setActiveTab('vault')}>
          <div className="bento-card-title">{t('vault')}</div>
          <div>
            <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white mb-2">
              <Lock size={18} />
            </div>
            <p className="text-lg font-black italic">4.2 GB</p>
            <p className="text-[8px] text-accent-blue font-bold uppercase tracking-widest mt-1">Encrypted Logs</p>
          </div>
        </section>

        <section className="bento-card aspect-square sm:aspect-auto flex flex-col justify-between group cursor-pointer" onClick={() => setActiveTab('contacts')}>
          <div className="bento-card-title">CIRCLE</div>
          <div>
            <div className="flex -space-x-2 mb-2">
              {[1, 2].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-card-bg bg-accent-blue/20 flex items-center justify-center text-[10px] font-bold">G{i}</div>
              ))}
            </div>
            <h3 className="text-sm font-black italic uppercase leading-none mb-1">Guardians</h3>
            <p className="text-[8px] text-text-dim font-bold uppercase tracking-widest">3 Active Links</p>
          </div>
        </section>
        
        <section className="bento-card col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-2 bg-[#020512] border-accent-blue/20 cursor-pointer group" onClick={() => setActiveTab('radar')}>
          <div className="bento-card-title flex justify-between items-center text-accent-blue">
            <span>PROTECTOR RADAR</span>
            <div className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse shadow-[0_0_10px_#0A84FF]" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue group-hover:bg-accent-blue group-hover:text-white transition-all">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-lg font-black uppercase tracking-tight italic">Scan 1KM Radius</p>
              <p className="text-xs text-text-dim leading-tight">View and secure-call verified protectors near you.</p>
            </div>
          </div>
        </section>
      </div>

      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-3 gap-4">
        <div className="bento-card-title col-span-3">MISSION TELEMETRY</div>
        <SensorStat value="ACTIVE" label={t('sensor_scanner')} />
        <SensorStat value="0.02G" label={t('sensor_gforce')} />
        <SensorStat value={batteryLevel ? `${batteryLevel}%` : "SYNC"} label={t('sensor_battery' as any)} />
      </section>

      {/* Special Cell — Direct Anonymous Help */}
      <section className="bento-card col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-[#1a0a2e] to-black border-purple-500/20 cursor-pointer group" onClick={() => setActiveTab('special_cell')}>
        <div className="bento-card-title flex justify-between items-center">
          <span>SPECIAL CELL</span>
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_#a855f7]" />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-black italic uppercase tracking-tighter">Zero-FIR Node</p>
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">Anonymous Report Active</p>
          </div>
        </div>
      </section>

      {/* Decoy Calculator — Silent System */}
      <section className="bento-card col-span-1 border-white/5 cursor-pointer group" onClick={() => setActiveTab('decoy')}>
        <div className="bento-card-title">PRECISION</div>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-black transition-all">
            <Smartphone size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest">Calc Utility</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SensorStat({ value, label }: { value: string, label: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
      <span className="text-xl font-bold block">{value}</span>
      <span className="text-[9px] text-text-dim font-bold uppercase tracking-tighter">{label}</span>
    </div>
  );
}

function ShieldItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
      <span className="text-[12px] text-text-dim">{label}</span>
      <span className="text-[10px] font-bold text-accent-blue tracking-widest">{status}</span>
    </div>
  );
}
