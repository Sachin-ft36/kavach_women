import React from 'react';
import { motion } from 'motion/react';
import {
  Radar, Activity, Navigation, ShieldAlert, ShieldCheck,
  Fingerprint, Zap, TrendingUp, Cpu, Power, Bell, Maximize2,
  Shield, Phone, User, Lock
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { toast } from 'sonner';
import { PredictiveIntelResult } from '../../../lib/predictiveIntel';
import { useCall } from '../../../contexts/CallContext';

interface Props {
  selectedJourney: any;
  predictiveResults: PredictiveIntelResult | null;
  isAnalyzing: boolean;
  mlLatency: number;
  isSovereignActive?: boolean;
  selectedJourneyId: string | null;
  resolveIdentity: (item: any) => string;
  onClose: () => void;
}

export default function TransitPredictiveHUD({
  selectedJourney, predictiveResults, isAnalyzing, mlLatency,
  isSovereignActive, selectedJourneyId, resolveIdentity, onClose
}: Props) {
  const { initiateCall } = useCall();
  const [isProcessingCommand, setIsProcessingCommand] = React.useState(false);

  const handleRemoteOverride = async (type: 'LOCKOUT' | 'SIREN' | 'SNAPSHOT') => {
    if (!selectedJourneyId) return;
    if (!isSovereignActive) {
      toast.error('AUTHORIZATION DENIED', { description: 'Activate Sovereign Override for hardware intervention.' });
      return;
    }
    setIsProcessingCommand(true);
    try {
      await updateDoc(doc(db, 'journeys', selectedJourneyId), {
        remoteCommand: type,
        commandTimestamp: new Date(),
        commandStatus: 'pending',
        commandOrigin: 'SUPERCELL_TRANSIT_HUD'
      });
      toast.success(`${type} INITIATED`, { description: `Command broadcasted to device firmware: ${selectedJourneyId.slice(0, 8)}`, duration: 3000 });
    } catch (error) {
      toast.error('HARDWARE BRIDGE FAILURE', { description: 'Failed to establish secure link with node firmware.' });
    } finally {
      setIsProcessingCommand(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="absolute bottom-10 inset-x-10 z-40 pointer-events-none"
    >
      <div className="max-w-[95%] w-full mx-auto bg-black/85 backdrop-blur-3xl rounded-[30px] py-4 px-6 border border-white/10 shadow-2xl flex flex-col pointer-events-auto transition-all">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all', predictiveResults?.isBreached ? 'bg-rose-600 shadow-rose-600/40' : 'bg-cyan-600 shadow-cyan-600/40')}>
              {predictiveResults?.isBreached ? <ShieldAlert size={24} /> : isAnalyzing ? <Activity size={24} className="animate-spin" /> : <Radar size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[8px] font-black text-cyan-400 uppercase tracking-[3px]">Predictive Transit HUD</p>
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-white/5 rounded-full border border-white/10">
                  <Cpu size={7} className="text-cyan-400" />
                  <span className="text-[6px] font-black text-gray-500 uppercase tracking-widest">{mlLatency}ms Pipeline</span>
                </div>
                {predictiveResults?.isBreached && (
                  <div className="bg-rose-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">500m Breach Lockout</div>
                )}
              </div>
              <h2 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">{resolveIdentity(selectedJourney)}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Hardware Override Controls */}
            <div className="flex items-center gap-1.5 bg-white/5 p-1.5 rounded-2xl border border-white/10">
              {([
                { type: 'LOCKOUT' as const, icon: <Power size={16} />, color: 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-500' },
                { type: 'SIREN' as const, icon: <Bell size={16} />, color: 'bg-amber-600 shadow-amber-600/20 hover:bg-amber-500' },
                { type: 'SNAPSHOT' as const, icon: <Maximize2 size={16} />, color: 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-500' },
              ]).map(({ type, icon, color }) => (
                <button
                  key={type}
                  onClick={() => handleRemoteOverride(type)}
                  disabled={isProcessingCommand}
                  className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-all', isSovereignActive ? `${color} text-white shadow-xl` : 'bg-white/5 text-gray-500')}
                  title={type}
                >
                  {isProcessingCommand && type === 'LOCKOUT' ? <Activity size={16} className="animate-spin" /> : icon}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="px-4 py-1.5 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center">
              <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Vector Velocity</span>
              <div className="flex items-center gap-1.5 text-white">
                <TrendingUp size={12} className="text-cyan-400" />
                <span className="text-sm font-black italic tabular-nums leading-none">{predictiveResults?.speed || '--'} KM/H</span>
              </div>
            </div>

            <div className="px-4 py-1.5 bg-blue-600/10 rounded-xl border border-blue-500/30 flex flex-col items-center">
              <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Verification Code</span>
              <div className="flex items-center gap-1.5 text-white">
                <Fingerprint size={12} className="text-blue-400" />
                <span className="text-sm font-black italic tracking-[0.15em] leading-none">{selectedJourney?.handshakeCode || '----'}</span>
              </div>
            </div>

            <div className="px-4 py-1.5 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center">
              <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Node Power</span>
              <div className="flex items-center gap-1.5 text-white">
                <Zap size={12} className={cn((selectedJourney?.batteryLevel || 100) < 20 ? 'text-rose-500' : 'text-emerald-400')} />
                <span className="text-sm font-black italic tabular-nums leading-none">{selectedJourney?.batteryLevel || '--'}%</span>
              </div>
            </div>

            <button onClick={onClose} className="p-3 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-colors"><Maximize2 size={16} /></button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/5 py-2.5 px-4 rounded-2xl border border-white/10">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Heading Angle</p>
            <div className="flex items-center gap-2 text-cyan-400">
              <Navigation size={16} style={{ transform: `rotate(${predictiveResults?.bearing || 0}deg)` }} />
              <span className="text-lg font-black italic tracking-tighter leading-none">{predictiveResults?.bearing || '--'}°</span>
            </div>
          </div>
          <div className="bg-white/5 py-2.5 px-4 rounded-2xl border border-white/10">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Safe Route Deviation</p>
            <div className={cn('text-lg font-black italic tracking-tighter leading-none', predictiveResults?.isBreached ? 'text-rose-500' : predictiveResults?.isWarning ? 'text-amber-500' : 'text-emerald-500')}>
              {predictiveResults?.deviationDist || '0.00'} KM
            </div>
          </div>
          <div className="col-span-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 py-2.5 px-4 rounded-2xl border border-cyan-500/20 flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-0.5">Active Countermeasure</p>
              <h4 className="text-sm font-black text-white uppercase italic tracking-tighter leading-none">
                {predictiveResults?.isBreached ? 'SuperCell Lockout Initiated' : 'Proactive Path Clear'}
              </h4>
            </div>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center border', predictiveResults?.isBreached ? 'bg-rose-500/20 border-rose-500/40 text-rose-500' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-500')}>
              {predictiveResults?.isBreached ? <Lock size={16} /> : <ShieldCheck size={16} />}
            </div>
          </div>
        </div>

        {/* Responders */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 leading-none">
            <Shield size={10} className="text-blue-500" /> Active Tactical Responders (Interceptors)
          </p>
          <div className="flex flex-wrap gap-2.5">
            {selectedJourney?.activeResponders?.map((responder: any) => (
              <div key={responder.uid} className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-3.5 py-1.5 rounded-xl shadow-xl">
                <div className="w-6 h-6 rounded-lg bg-[#0F172A] border border-white/10 flex items-center justify-center overflow-hidden">
                  {responder.photo ? <img src={responder.photo} className="w-full h-full object-cover" /> : <User size={10} className="text-blue-400" />}
                </div>
                <div>
                  <p className="text-[9px] font-black text-white uppercase italic leading-none">{responder.name}</p>
                  <p className="text-[6.5px] font-black text-blue-400 uppercase tracking-widest mt-1 leading-none">{responder.phone}</p>
                </div>
                <button onClick={() => initiateCall(responder.uid, responder.name, selectedJourneyId || undefined)} className="ml-3 w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white shadow-lg active:scale-95 transition-all">
                  <Phone size={10} />
                </button>
              </div>
            ))}
            {(!selectedJourney?.activeResponders || selectedJourney.activeResponders.length === 0) && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-3.5 py-1.5 rounded-xl opacity-40">
                <Shield size={10} className="text-gray-500" />
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-wide">No interceptors active on this vector</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
