import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle, RouteOff, Clock } from 'lucide-react';
import { useKavachStore } from '../state/useKavachStore';
import { executeEmergencyBlast } from '../services/sosService';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';
import { toast } from 'sonner';

export default function RideDeviationPopup() {
  const { 
    isRideDeviationAlertActive, 
    setIsRideDeviationAlertActive, 
    rideDeviationType,
    user,
    userPos,
    updateRideData,
    setRideGracePeriodEndsAt,
    isSOSActive
  } = useKavachStore();
  
  const [timeLeft, setTimeLeft] = useState(120); // 120 seconds Dead Man's Switch
  const [reasonInput, setReasonInput] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  useEffect(() => {
    if (!isRideDeviationAlertActive) return;
    
    setTimeLeft(120);
    setShowReasonInput(false);
    setReasonInput('');

    // Trigger aggressive haptics on native platforms
    if (Capacitor.isNativePlatform() && navigator.vibrate) {
      navigator.vibrate([1000, 500, 1000, 500, 1000]);
    }

    // Trigger Native High-Priority Lock Screen Intent / Notification
    KavachSafe.showUrgentNotification({
      title: "SECURITY ALERT",
      body: "Suspicious Stop/Deviation Detected. Please confirm safety.",
      id: "ride_alert",
      sound: "alarm"
    });

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoEscalation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRideDeviationAlertActive]);

  const handleAutoEscalation = () => {
    // 🚨 Time expired without user response! Trigger Guardian SOS (Yellow Alert / Stage 2)
    setIsRideDeviationAlertActive(false);
    updateRideData({ warningsIssued: 1, alertLevel: 'YELLOW' });
    toast.error("NO RESPONSE DETECTED! ESCALATING ALERTS...", { duration: 5000 });
    
    const store = useKavachStore.getState();
    store.setActiveTab('sos');
    store.setSOSActive(true, null, 'ride', null);
  };

  const handleIAmSafe = () => {
    setShowReasonInput(true);
  };

  const handleSubmitReason = () => {
    if (!reasonInput.trim()) {
      toast.error("Please provide a reason to override the alert.");
      return;
    }
    
    // Clear alert, reset warnings, trigger route recalculation (by clearing path)
    setIsRideDeviationAlertActive(false);
    
    // Set a 10 minute grace period to prevent spamming
    setRideGracePeriodEndsAt(Date.now() + 10 * 60 * 1000);
    
    updateRideData({ 
      warningsIssued: 0, 
      path: [], // Force route recalculation from current position
      deviationDistance: 0 
    });
    
    toast.success("Security Override Accepted. 10 Min Grace Period Active.");
  };

  if (!isRideDeviationAlertActive || isSOSActive) return null;

  const isDeviation = rideDeviationType === 'ROUTE_DEVIATION_BREACH';

  return (
    <div className="fixed inset-0 z-[2000050] flex items-center justify-center p-4">
      {/* Sober Dark Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.95, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Solid Red Warning Header */}
        <div className="bg-red-600 p-4 text-center flex flex-col items-center justify-center border-b-4 border-red-700">
           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-inner">
             {isDeviation ? <RouteOff size={24} className="text-red-600" /> : <Clock size={24} className="text-red-600" />}
           </div>
           <h2 className="text-lg font-bold text-white tracking-widest uppercase">
             Security Alert
           </h2>
        </div>

        <div className="p-6 text-center space-y-6 relative z-10">
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase">
              {isDeviation ? "Route Deviation" : "Suspicious Stop"}
            </h3>
            <p className="text-sm font-medium text-gray-600 mt-2">
              {isDeviation ? "The vehicle has left the verified path. Please confirm your safety." : "The vehicle has been stationary for over 5 minutes. Please confirm your safety."}
            </p>
          </div>

          <div className="py-4 border-y border-gray-200 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Auto-Escalation In</p>
            <div className="text-5xl font-black text-red-600 tabular-nums">
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showReasonInput ? (
              <motion.div 
                key="actions"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-3 pt-2"
              >
                <button
                  onClick={handleAutoEscalation}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <AlertTriangle size={18} /> Send SOS Now
                </button>
                <button
                  onClick={handleIAmSafe}
                  className="w-full py-4 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <ShieldCheck size={18} /> I Am Safe
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="reason"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-4 pt-2 text-left"
              >
                <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Reason for {isDeviation ? 'Deviation' : 'Stop'}:</p>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={e => setReasonInput(e.target.value)}
                  placeholder="e.g., Heavy Traffic, Road Block..."
                  className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-500 transition-all"
                  autoFocus
                />
                <button
                  onClick={handleSubmitReason}
                  disabled={!reasonInput.trim()}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-md active:scale-95 transition-all"
                >
                  Confirm Safety
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
