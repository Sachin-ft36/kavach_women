import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Props {
  user: any;
  activeAlerts?: any[];
}

export default function AddressCell({ user, activeAlerts = [] }: Props) {
  const activeAlert = activeAlerts.find(a => a.userId === user.id || a.id === user.id);
  
  const lat = activeAlert ? (activeAlert.latitude || activeAlert.lat) : (user.latitude || user.lat || user.lastLat || user.currentLat);
  const lng = activeAlert ? (activeAlert.longitude || activeAlert.lng) : (user.longitude || user.lng || user.lastLng || user.currentLng || user.long);
  
  const [address, setAddress] = useState<string>(activeAlert?.locationName || activeAlert?.address || user.city || user.address || 'Sector Unknown');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeAlert && (activeAlert.locationName || activeAlert.address)) {
        setAddress(activeAlert.locationName || activeAlert.address);
        return;
    }
    if (!lat || !lng) return;
    
    const fetchAddr = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data.display_name) setAddress(data.display_name);
      } catch (e) {
        console.error("Directory Address Sync Failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAddr();
  }, [lat, lng, activeAlert]);

  return (
    <div className="flex items-center gap-3">
       <div className={cn(
         "w-8 h-8 rounded-full flex items-center justify-center transition-all relative",
         activeAlert ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40" : (lat && lng) ? "bg-rose-500/10 text-rose-500" : "bg-gray-100 text-gray-400"
       )}>
          {activeAlert ? <AlertTriangle size={14} className="animate-pulse" /> : <MapPin size={14} className={(lat && lng) ? "animate-bounce" : ""} />}
          {activeAlert && <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20" />}
       </div>
       <div className="flex flex-col max-w-[220px]">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-tight leading-tight italic",
            activeAlert ? "text-rose-600 underline decoration-rose-600/30" : "text-rose-500"
          )}>
            {loading ? "Neural Mapping..." : address}
          </span>
          <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            {activeAlert ? "LIVE SOS LOCATION LINKED" : (lat && lng) ? "Verified Precision Signal" : "Registered Home Sector"}
          </span>
       </div>
    </div>
  );
}
