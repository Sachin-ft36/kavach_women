import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, MapPin, Phone, Navigation, ChevronRight, Users, Building2, Loader2, Car } from 'lucide-react';
import { useKavachStore } from '../store/useKavachStore';
import { useNearbyHubData } from '../hooks/useNearbyHubData';

interface NearbyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode?: 'all' | 'protectors_only';
}

export default function NearbyHubModal({ isOpen, onClose, viewMode = 'all' }: NearbyHubModalProps) {
  const { userPos } = useKavachStore();
  const { loading, policeStations, protectors, livePcrs, fetchRealData } = useNearbyHubData(userPos);

  useEffect(() => {
    if (isOpen) fetchRealData();
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000000] bg-[#0A0A0B] flex flex-col p-6 pt-12 overflow-hidden"
      >
        <header className="flex justify-between items-center mb-8">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white flex items-center gap-2 group active:scale-95 transition-all"
          >
            <ChevronRight size={16} className="rotate-180" />
            <span className="text-[10px] font-black uppercase tracking-widest">Safe Zone</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
            {loading && <Loader2 size={10} className="animate-spin text-cyan-400" />}
            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest italic">
              {loading ? "Scanning National Grid..." : "Live Safety Network Active"}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-10 scrollbar-hide pr-1">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
              {viewMode === 'protectors_only' ? 'NEARBY PROTECTORS' : 'POLICE / PROTECTOR HUB'}
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[3px]">
              {viewMode === 'protectors_only' ? 'Verified Community Responders & PCRs' : 'Authorized Local Support Nodes'}
            </p>
          </div>

          {/* 🚨 NATIONAL HELPLINES */}
          {viewMode === 'all' && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => window.open('tel:1090')} className="p-4 bg-[#141416] border border-[#2A2A2D] rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                <span className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest">Women Helpline</span>
                <span className="text-xl font-black text-white italic">1090</span>
              </button>
              <button onClick={() => window.open('tel:1930')} className="p-4 bg-[#141416] border border-[#2A2A2D] rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Cyber Crime</span>
                <span className="text-xl font-black text-white italic">1930</span>
              </button>
            </div>
          )}

          {/* 🚔 LIVE PCR PATROL CARS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <Car size={16} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Live PCR Patrol Units</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{livePcrs.length} Active</span>
              </div>
            </div>

            <div className="grid gap-3">
              {livePcrs.length > 0 ? livePcrs.map((pcr, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx}
                  className="p-4 bg-[#141416] border border-[#2A2A2D] rounded-2xl space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-white uppercase italic truncate max-w-[200px] flex items-center gap-2">
                        🚔 {pcr.name}
                      </h4>
                      <p className="text-[9px] text-blue-400 font-bold uppercase mt-1.5 flex items-center gap-1.5">
                        <MapPin size={10} /> {pcr.dist} AWAY • {pcr.status}
                      </p>
                    </div>
                    <div className="px-2 py-1 bg-[#1A1A1D] border border-[#3A3A3D] rounded-md">
                      <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">ON-DUTY</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => window.open(`tel:${pcr.phone}`)} className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                      <Phone size={12} /> Emergency
                    </button>
                    <button
                      onClick={() => {
                        useKavachStore.getState().setPendingNavigationTarget({
                          lat: pcr.lat,
                          lng: pcr.lng,
                          name: pcr.name
                        });
                      }}
                      className="py-3 bg-[#1A1A1D] border border-[#3A3A3D] hover:bg-[#2A2A2D] text-white rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      <Navigation size={12} /> Track Route
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center">
                  <p className="text-[10px] text-gray-600 font-bold uppercase italic">
                    Searching live police networks...
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 🚓 OFFICIAL POLICE NODES */}
          {viewMode === 'all' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Building2 size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Real-time Police Locations</span>
                </div>
                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{policeStations.length} Nodes</span>
              </div>

              <div className="grid gap-3">
                {policeStations.length > 0 ? policeStations.map((station, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx}
                    className="p-4 bg-[#141416] border border-[#2A2A2D] rounded-2xl space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white uppercase italic truncate max-w-[200px]">{station.name}</h4>
                        <p className="text-[9px] text-cyan-400 font-bold uppercase mt-1.5 flex items-center gap-1.5">
                          <MapPin size={10} /> {station.dist} AWAY • {station.status}
                        </p>
                      </div>
                      <div className="px-2 py-1 bg-[#1A1A1D] border border-[#3A3A3D] rounded-md">
                        <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Official</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => window.open(`tel:${station.phone}`)} className="py-3 bg-white text-black rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-gray-200">
                        <Phone size={12} /> Call
                      </button>
                      <button
                        onClick={() => {
                          if (station.lat && station.lng) {
                            useKavachStore.getState().setPendingNavigationTarget({
                              lat: station.lat,
                              lng: station.lng,
                              name: station.name
                            });
                          }
                        }}
                        className="py-3 bg-[#1A1A1D] border border-[#3A3A3D] hover:bg-[#2A2A2D] text-white rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                      >
                        <Navigation size={12} /> Navigate
                      </button>
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-10 border-2 border-dashed border-white/5 rounded-3xl text-center">
                    <p className="text-[10px] text-gray-600 font-bold uppercase italic">
                      {loading ? "Searching Grid..." : "No official nodes found in 10km. Patrol units notified."}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 🤝 COMMUNITY PROTECTORS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <Users size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Verified Community Responders</span>
            </div>
            <div className="grid gap-3">
              {protectors.map((p, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-[24px] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white relative">
                      <Users size={18} />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase italic">{p.name}</h4>
                      <p className="text-[8px] text-amber-500 font-bold uppercase tracking-widest mt-0.5">{p.profession} • {p.dist}</p>
                    </div>
                  </div>
                  <button className="px-5 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                    Alert
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-auto pt-6 border-t border-white/5 flex items-center gap-3">
          <Shield size={16} className="text-gray-600 shrink-0" />
          <p className="text-[8px] text-gray-600 font-bold uppercase leading-relaxed tracking-widest">
            Kavach uses satellite triangulation and OSM grid to locate verified safety nodes across India.
          </p>
        </footer>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
