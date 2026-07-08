import React, { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { motion, AnimatePresence } from 'motion/react';
import { MapPinOff, AlertTriangle } from 'lucide-react';

export default function PermissionWarningOverlay() {
  const [hasLocationPermission, setHasLocationPermission] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const checkPermission = async () => {
      try {
        const status = await Geolocation.checkPermissions();
        setHasLocationPermission(status.location === 'granted');
      } catch (e) {
        // Handle web fallback or errors
        setHasLocationPermission(true); 
      }
    };

    checkPermission();
    // Poll every 10 seconds just in case they revoke it in settings while app is open
    interval = setInterval(checkPermission, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {!hasLocationPermission && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-red-600 shadow-lg"
        >
          <div className="pt-10 pb-4 px-4 flex items-start gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-full mt-1">
              <MapPinOff size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-yellow-300" />
                Critical Failure: GPS Offline
              </h3>
              <p className="text-[10px] font-medium leading-relaxed mt-1 opacity-90">
                Kavach requires "Always On" Location permission to dispatch SOS coordinates to your guardians and nearby responders. 
              </p>
              <button 
                onClick={async () => {
                  try {
                    await Geolocation.requestPermissions();
                  } catch(e) {}
                }}
                className="mt-2 text-[9px] font-black uppercase tracking-[2px] bg-white text-red-600 px-3 py-1.5 rounded-full shadow-sm hover:scale-105 transition-all"
              >
                Enable Location Now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
