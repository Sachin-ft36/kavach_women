import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Clock, ShieldCheck, Play, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, setDoc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useKavachStore } from '../../state/useKavachStore';
import { toast } from 'sonner';

interface SafeArrivalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DESTINATIONS = [
  { name: 'College', icon: '🏫', latOffset: 0.005, lngOffset: 0.005 },
  { name: 'Office', icon: '🏢', latOffset: 0.008, lngOffset: -0.003 },
  { name: 'Coaching Center', icon: '📚', latOffset: -0.004, lngOffset: 0.006 },
  { name: 'Gym', icon: '💪', latOffset: 0.002, lngOffset: -0.005 },
  { name: 'Mall', icon: '🛍️', latOffset: -0.006, lngOffset: -0.002 }
];

export default function SafeArrivalManager({ isOpen, onClose }: SafeArrivalProps) {
  const { userPos } = useKavachStore();
  const [isActive, setIsActive] = useState(false);
  const [selectedDest, setSelectedDest] = useState(DESTINATIONS[0]);
  const [eta, setEta] = useState(25);
  const [gracePeriod, setGracePeriod] = useState(15); // minutes
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [journeyId, setJourneyId] = useState<string | null>(null);

  useEffect(() => {
    const activeEnd = localStorage.getItem('kavach_active_arrival_id');
    if (activeEnd) {
      setIsActive(true);
      setJourneyId(activeEnd);
      const savedDestName = localStorage.getItem('kavach_active_arrival_dest');
      const found = DESTINATIONS.find(d => d.name === savedDestName);
      if (found) setSelectedDest(found);
    }
  }, []);

  const handleStartTransit = async () => {
    if (!auth.currentUser) return;
    try {
      const id = auth.currentUser.uid;
      const targetCoords = [userPos.lng + selectedDest.lngOffset, userPos.lat + selectedDest.latOffset];
      const journeyRef = doc(db, 'journeys', id);

      await setDoc(journeyRef, {
        userId: id,
        userName: auth.currentUser.displayName || 'Family Member',
        destination: selectedDest.name,
        targetCoords,
        eta,
        gracePeriodMinutes: gracePeriod,
        status: 'active',
        startedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // Broadcast activity start
      await addDoc(collection(db, 'activities'), {
        userId: id,
        userName: auth.currentUser.displayName || 'Family Member',
        type: 'journey_started',
        message: `started journey to ${selectedDest.name}.`,
        timestamp: serverTimestamp()
      });

      localStorage.setItem('kavach_active_arrival_id', id);
      localStorage.setItem('kavach_active_arrival_dest', selectedDest.name);
      setJourneyId(id);
      setIsActive(true);
      toast.success(`Safe Arrival Activated: Tracking started for ${selectedDest.name}.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to start transit log.");
    }
  };

  const handleArrivalCheckIn = async () => {
    if (!auth.currentUser || !journeyId) return;

    // Check PIN validation from store
    const storedPin = useKavachStore.getState().safetyPin || '1234';
    if (pinInput !== storedPin) {
      toast.error("Invalid Security PIN");
      setPinInput('');
      return;
    }

    try {
      const journeyRef = doc(db, 'journeys', journeyId);
      await updateDoc(journeyRef, {
        status: 'completed',
        endedAt: serverTimestamp()
      });

      // Log success activity
      await addDoc(collection(db, 'activities'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Family Member',
        type: 'arrival',
        message: `arrived safely at ${selectedDest.name}.`,
        timestamp: serverTimestamp()
      });

      localStorage.removeItem('kavach_active_arrival_id');
      localStorage.removeItem('kavach_active_arrival_dest');
      setIsActive(false);
      setShowPinConfirm(false);
      setPinInput('');
      toast.success("Destination reached! Status set to Safe.");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Verification connection failed.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000000] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 font-sans text-white">
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-sm bg-[#0D1220] border border-[#1E293B] rounded-[28px] p-6 shadow-2xl relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
          <Navigation size={18} className="text-emerald-400 " />
          <h3 className="text-sm font-black uppercase tracking-wider">Safe Arrival Monitor</h3>
        </div>

        {isActive ? (
          <div className="space-y-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
              <span className="text-[9px] font-black text-emerald-400 tracking-widest uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full">
                Active Transit
              </span>
              <p className="text-2xl font-black italic mt-3 text-white">
                {selectedDest.icon} {selectedDest.name}
              </p>
              <div className="flex justify-center gap-6 mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <div>
                  <p>ETA</p>
                  <p className="text-white text-base font-black mt-0.5">{eta} Mins</p>
                </div>
                <div className="w-[1px] bg-white/10" />
                <div>
                  <p>Grace Period</p>
                  <p className="text-white text-base font-black mt-0.5">+{gracePeriod}m</p>
                </div>
              </div>
            </div>

            {showPinConfirm ? (
              <div className="space-y-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide text-center">
                  Enter 4-Digit Security PIN to Verify Drop-off
                </p>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-center text-2xl font-black tracking-[12px] text-white focus:outline-none focus:border-emerald-500"
                  placeholder="••••"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowPinConfirm(false); setPinInput(''); }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleArrivalCheckIn}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    Verify & Arrive
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowPinConfirm(true)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[3px] shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={15} /> Confirm Arrival
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Select Destination
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DESTINATIONS.map(d => (
                  <button
                    key={d.name}
                    onClick={() => setSelectedDest(d)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      selectedDest.name === d.name
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-slate-350'
                    }`}
                  >
                    <span className="text-lg">{d.icon}</span>
                    <span className="text-xs font-black tracking-wide truncate">{d.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  ETA (Minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={eta}
                  onChange={(e) => setEta(parseInt(e.target.value) || 25)}
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-center text-xs font-black tracking-wider outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Late Grace (Mins)
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(parseInt(e.target.value) || 15)}
                  className="w-full bg-white/[0.02] border border-white/5 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-center text-xs font-black tracking-wider outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleStartTransit}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[3px] shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play size={14} fill="currentColor" /> Start Safe Journey
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
