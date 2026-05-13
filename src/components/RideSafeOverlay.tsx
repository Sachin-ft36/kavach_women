import React from 'react';
import { Shield, Activity, ShieldCheck, MapPin, Lock, Smartphone, Users, ChevronRight, Car, Zap, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { useKavachStore } from '../store/useKavachStore';
import { auth } from '../firebase';
import VictimMap from './maps/VictimMap';
import { toast } from 'sonner';
import { KavachSafe } from '../services/KavachNative';

interface RideSafeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isRideActive: boolean;
  setIsRideActive: (active: boolean) => void;
  vehicleNo: string;
  setVehicleNo: (no: string) => void;
}

export default function RideSafeOverlay({ 
  isOpen, 
  onClose, 
  isRideActive, 
  setIsRideActive, 
  vehicleNo, 
  setVehicleNo 
}: RideSafeOverlayProps) {
  const { userPos, batteryLevel, updateRideData, setRideMode, setVoiceTriggerActive, setSOSActive } = useKavachStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A0A0B] flex flex-col overflow-hidden font-sans">
      {/* Tactical Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent_70%)]" />

      <div className="relative z-10 flex flex-col h-full p-4 sm:p-6 pt-6 sm:pt-10">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <button 
            onClick={() => {
              onClose();
              setIsRideActive(false);
            }}
            className="p-2 sm:p-3 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white shadow-xl hover:bg-white/10 transition-all flex items-center gap-1.5 sm:gap-2 group"
          >
            <ChevronRight size={16} className="rotate-180 sm:size-[18px]" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{isRideActive ? 'Stop' : 'Exit'}</span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600/10 border border-blue-500/20 rounded-full">
             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
             <span className="text-[7px] sm:text-[8px] font-black text-blue-500 uppercase tracking-[2px]">Monitoring Active</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pb-24 scrollbar-hide">
          {!isRideActive ? (
            <>
              {/* Trust Hero Section */}
              <div className="text-center space-y-3 sm:space-y-4 mb-4 sm:mb-0">
                 <div className="relative inline-block">
                    <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl sm:rounded-[30px] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20 border border-white/20">
                       <ShieldCheck size={32} className="text-white sm:size-[40px]" />
                    </div>
                 </div>
                 <div className="space-y-0.5 sm:space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter">Ride Safe Protocol</h2>
                    <p className="text-[9px] sm:text-[10px] text-blue-500 font-black uppercase tracking-[3px] sm:tracking-[4px]">National Strategic Command Hub</p>
                 </div>
              </div>

              {/* Information HUD */}
              <div className="grid grid-cols-3 gap-3">
                 <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <Lock size={16} className="mx-auto text-gray-500 mb-2" />
                    <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">256-bit AES</span>
                 </div>
                 <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <Smartphone size={16} className="mx-auto text-gray-500 mb-2" />
                    <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Device Lock</span>
                 </div>
                 <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
                    <ShieldCheck size={16} className="mx-auto text-gray-500 mb-2" />
                    <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Police Verified</span>
                 </div>
              </div>

              {/* Configuration Grid */}
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white/[0.03] p-5 sm:p-8 rounded-3xl sm:rounded-[40px] border border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Car size={60} className="text-white sm:size-[80px]" />
                  </div>
                  
                  <div className="relative z-10 space-y-4 sm:space-y-6">
                    <div className="space-y-1.5 sm:space-y-2">
                       <label className="text-[8px] sm:text-[9px] font-black uppercase tracking-[1.5px] sm:tracking-[2px] text-gray-500 flex items-center gap-2">
                          <Activity size={10} className="text-blue-500" />
                          Journey Configuration
                       </label>
                       <div className="relative">
                          <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-blue-500/50">
                             <Car size={16} className="sm:size-[18px]" />
                          </div>
                          <input 
                            value={vehicleNo}
                            onChange={(e) => setVehicleNo(e.target.value)}
                            placeholder="Enter Vehicle No"
                            className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all focus:bg-white/10"
                          />
                       </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
                      <button 
                        onClick={async () => {
                          const googleMapsLink = userPos ? `https://www.google.com/maps?q=${userPos[0]},${userPos[1]}` : "GPS signal pending...";
                          const kavachHubLink = `${window.location.origin}/track/${auth.currentUser?.uid}`;
                          
                          const msg = `🚨 *KAVACH TACTICAL ALERT*\n\nRide Safe Protocol: *ACTIVE MONITORING*\n\n*Vehicle:* ${vehicleNo || 'Not Specified'}\n\n📍 *CURRENT LOCATION (Snapshot):*\n${googleMapsLink}\n\n📡 *LIVE MOVEMENT TRACKER (Real-time):*\n${kavachHubLink}\n\n_Note: Live tracker updates movement every 3 seconds. System is linked to Police Command Hub._`;
                          
                          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="w-full py-4 sm:py-5 bg-white text-black rounded-xl sm:rounded-[24px] text-[10px] sm:text-[11px] font-black uppercase tracking-[2px] sm:tracking-[3px] text-center hover:bg-gray-100 active:scale-98 transition-all shadow-xl italic"
                      >
                         Emergency Connect (WhatsApp/SMS)
                      </button>
                      
                      <button 
                        onClick={() => {
                          if (!vehicleNo) {
                            toast.error("Please enter vehicle number for tactical logging.");
                            return;
                          }
                          setIsRideActive(true);
                          setRideMode(true, {
                            vehicleNo,
                            status: 'active',
                            startTime: Date.now(),
                            destination: 'Tactical Monitoring',
                            targetCoords: null,
                            deviationDistance: 0,
                            warningsIssued: 0
                          });
                          setVoiceTriggerActive(true);
                          KavachSafe.triggerHapticPulse();
                          toast.success("Ride Safe Protocol Engaged. Monitoring Active.");
                        }}
                        className="w-full py-4 sm:py-5 bg-[#2563EB] text-white rounded-xl sm:rounded-[24px] text-[10px] sm:text-[11px] font-black uppercase tracking-[2px] sm:tracking-[3px] text-center shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group italic"
                      >
                         Initiate Active Journey Mode
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 opacity-40">
                   <Shield size={12} className="text-blue-500" />
                   <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Secured by National Tactical Grid</p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="relative h-64 bg-gray-100 rounded-[32px] sm:rounded-[40px] overflow-hidden border border-[#E5E7EB] shadow-inner">
                 <VictimMap />
                 <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Supercell Live Sync</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] border border-[#E5E7EB] shadow-sm">
                   <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <Activity size={18} className="text-emerald-500 sm:size-[20px]" />
                      <span className="text-[7px] sm:text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Normal</span>
                   </div>
                   <h5 className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 mb-0.5 tracking-widest">Route Status</h5>
                   <p className="text-[10px] sm:text-xs font-black text-gray-900 uppercase">Stable Movement</p>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] border border-[#E5E7EB] shadow-sm">
                   <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <Smartphone size={18} className="text-amber-500 sm:size-[20px]" />
                      <span className="text-[7px] sm:text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Live</span>
                   </div>
                   <h5 className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 mb-0.5 tracking-widest">Neural Listening</h5>
                   <p className="text-[10px] sm:text-xs font-black text-gray-900 uppercase">"Kavach Help"</p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] border border-[#E5E7EB] shadow-sm flex items-center justify-between">
                 <div>
                    <h5 className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 mb-0.5 tracking-widest">Active Vehicle</h5>
                    <p className="text-base sm:text-lg font-black text-gray-900 uppercase italic tracking-tighter">{vehicleNo}</p>
                 </div>
                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-900">
                    <Car size={20} className="sm:size-[24px]" />
                 </div>
              </div>

              <button 
                onClick={() => {
                  setSOSActive(true, null, 'ride');
                  onClose();
                }}
                className="w-full py-5 sm:py-6 bg-red-600 text-white rounded-[24px] sm:rounded-[32px] text-[10px] sm:text-xs font-black uppercase tracking-[2.5px] sm:tracking-[3px] flex flex-col items-center justify-center gap-1 shadow-2xl shadow-red-600/30 active:scale-95 transition-all"
              >
                 <span>Trigger Interception Protocol</span>
                 <span className="text-[7px] sm:text-[8px] opacity-60 font-bold">Manual SOS Force Override</span>
              </button>

              <button 
                onClick={() => {
                  setIsRideActive(false);
                  setRideMode(false);
                  toast.success("Ride Safely Completed. Telemetry Disconnected.");
                }}
                className="w-full py-5 sm:py-6 bg-white text-black border-2 border-emerald-500/30 rounded-[24px] sm:rounded-[32px] text-[10px] sm:text-xs font-black uppercase tracking-[2.5px] sm:tracking-[3px] flex flex-col items-center justify-center gap-1 shadow-xl active:scale-95 transition-all hover:bg-emerald-500/5"
              >
                 <span className="flex items-center gap-2">
                   <ShieldCheck size={16} className="text-emerald-500 sm:size-[18px]" />
                   Mark as Safe & End Session
                 </span>
                 <span className="text-[7px] sm:text-[8px] opacity-60 font-bold text-gray-500">Securely Terminate Tracking</span>
              </button>

              <div className="text-center p-4">
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    The system is silently monitoring your journey. <br/>
                    In case of danger, shake phone or shout "Kavach Help".
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
