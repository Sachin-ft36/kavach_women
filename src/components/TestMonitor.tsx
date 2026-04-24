import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Map, Shield, User, Navigation, X, ExternalLink, Activity, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProtectorMap from './maps/ProtectorMap';
import { cn } from '../lib/utils';

export default function TestMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [selectedAlertCoords, setSelectedAlertCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen for live alerts across the whole system
    const q = query(
      collection(db, 'alerts'),
      where('status', '==', 'active'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));
      setActiveAlerts(alerts);
      
      // Auto-select the first alert if one exists and nothing is selected
      if (alerts.length > 0 && !selectedAlertCoords) {
        setSelectedAlertCoords(alerts[0].coords);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'alerts');
    });

    return () => unsubscribe();
  }, [selectedAlertCoords]);

  return (
    <>
      <div className="fixed top-6 left-6 z-[9999] pointer-events-auto">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-accent-blue text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(10,132,255,0.4)] flex items-center gap-2 hover:scale-105 transition-all"
        >
          <Activity size={14} className="animate-pulse" />
          Safety Lab: Test Monitor
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-y-6 left-6 w-[400px] z-[9999] bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-accent-blue" />
                <h3 className="font-black italic uppercase text-lg tracking-tighter">Protector Monitor</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Map Preview (Protector perspective) */}
            <div className="h-64 bg-white/5 relative group">
              <div className="absolute inset-0 z-10 p-4 pointer-events-none">
                <div className="bg-black/60 backdrop-blur px-2 py-1 rounded text-[8px] font-bold text-accent-blue border border-accent-blue/30 w-fit">
                  LIVE SATELLITE FEED (SIMULATED)
                </div>
              </div>
              <div className="h-full opacity-60">
                <ProtectorMap hideHeader />
              </div>
              <div className="absolute bottom-4 right-4 z-20">
                <button 
                  onClick={() => window.location.href = '#map'}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-lg text-white backdrop-blur border border-white/10 transition-all pointer-events-auto"
                >
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>

            {/* Active Alerts List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Incoming SOS Events</p>
                <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[8px] font-black animate-pulse">LIVE DATA</span>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="py-12 text-center text-gray-500 space-y-2">
                  <Activity size={32} className="mx-auto opacity-10" />
                  <p className="text-xs italic">Waiting for SOS trigger...</p>
                  <p className="text-[8px] uppercase font-bold tracking-widest text-accent-blue">Go to SOS tab and press button</p>
                </div>
              ) : (
                activeAlerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => setSelectedAlertCoords(alert.coords)}
                    className={cn(
                      "w-full text-left bg-white/5 border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10",
                      selectedAlertCoords === alert.coords && "border-accent-blue bg-accent-blue/5"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-[10px] font-black italic text-red-500 uppercase">Alert Active</span>
                      </div>
                      <span className="text-[8px] font-mono text-gray-400">ID: {alert.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                        <User size={20} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm italic uppercase">{alert.victimName}</p>
                        <p className="text-[10px] text-accent-blue font-bold tracking-widest">{alert.location}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                        <p className="text-[8px] text-gray-500 uppercase font-bold">Latitude</p>
                        <p className="text-[10px] font-mono">{alert.coords[0].toFixed(5)}</p>
                      </div>
                      <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                        <p className="text-[8px] text-gray-500 uppercase font-bold">Longitude</p>
                        <p className="text-[10px] font-mono">{alert.coords[1].toFixed(5)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-6 bg-accent-blue/5 border-t border-white/5 space-y-4">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">System Readiness</p>
                <button 
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                      stream.getTracks().forEach(t => t.stop());
                      alert("Permission GRANTED! Camera and Microphone are ready.");
                    } catch (e: any) {
                      alert("Permission DENIED: " + e.message + "\nPlease enable Camera/Mic in your browser address bar.");
                    }
                  }}
                  className="w-full bg-white/5 border border-white/10 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Camera size={14} /> Test Camera/Mic Permissions
                </button>
              </div>
              <p className="text-[9px] text-gray-400 leading-relaxed italic">
                <span className="text-accent-blue font-black uppercase tracking-widest block not-italic mb-1">Testing Note:</span>
                This monitor shows exactly what verified protectors see in real-time. Use the location service on your device to see the coordinates update as you move.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
