import React from 'react';
import { ShieldCheck, Activity, MapPin, Car, Lock, Smartphone } from 'lucide-react';
import { useKavachStore } from '../../state/useKavachStore';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import { KavachSafe } from '../../services/KavachNative';

interface Props {
  vehicleNo: string;
  setVehicleNo: (no: string) => void;
  destinationQuery: string;
  setDestinationQuery: (q: string) => void;
  selectedDestination: any;
  setSelectedDestination: (d: any) => void;
  setIsRideActive: (b: boolean) => void;
}

export default function RideSafeConfig({
  vehicleNo, setVehicleNo, destinationQuery, setDestinationQuery,
  selectedDestination, setSelectedDestination, setIsRideActive
}: Props) {
  const { userPos, setRideMode, setVoiceTriggerActive } = useKavachStore();

  const handleStartRide = async () => {
    if (!selectedDestination) { toast.error("Please search and select a valid destination."); return; }
    if (!vehicleNo) { toast.error("Please enter vehicle number for tactical logging."); return; }
    const plateRegex = /^([A-Z]{2}[ -]?[0-9]{1,2}(?:[ -]?[A-Z]{1,3})?[ -]?[0-9]{1,4}|[0-9]{2}[ -]?BH[ -]?[0-9]{4}[ -]?[A-Z]{1,2}|[0-9]{1,3}[ -]?(CD|CC|UN)[ -]?[0-9]{1,4}|[\^↑]?[0-9]{2}[A-Z][0-9]{4,6}[A-Z])$/i;
    if (!plateRegex.test(vehicleNo.trim())) { toast.error("Invalid Format! Enter valid format (e.g. MH01AB1234)"); return; }

    setIsRideActive(true);
    setRideMode(true, {
      vehicleNo, status: 'active', startTime: Date.now(),
      destination: selectedDestination.place_name, destinationEloc: selectedDestination.eLoc,
      targetCoords: selectedDestination.center, deviationDistance: 0, warningsIssued: 0
    });
    setVoiceTriggerActive(true);
    KavachSafe.triggerHapticPulse();
    toast.success("Ride Safe Protocol Engaged. Monitoring Active.");

    // 📡 SMART SMS FALLBACK CHECK
    try {
      const citizenUid = auth.currentUser?.uid;
      if (citizenUid) {
        let guardians: any[] = [];
        const gCol = collection(db, 'users', citizenUid, 'guardians');
        const gSnap = await getDocs(gCol);
        guardians = gSnap.docs.map(d => d.data());

        if (guardians.length === 0) {
          const gStr = localStorage.getItem('kavach_guardian_cache');
          if (gStr) guardians = JSON.parse(gStr);
        }

        const guardianPhones = guardians.map((g: any) => g.phone).filter(Boolean);
        for (const phone of guardianPhones) {
          const cleanPhone = `+91${phone.replace(/\D/g, '').slice(-10)}`;
          const userQuery = query(
            collection(db, 'users'), 
            where('phoneNumber', 'in', [phone, cleanPhone]), 
            limit(1)
          );
          const userSnap = await getDocs(userQuery);
          if (userSnap.empty) {
            // Guardian doesn't have app, send high-priority SMS containing secure tracking link
            const trackingLink = `${window.location.origin}/track/${citizenUid}`;
            const smsMessage = `🚨 KAVACH Alert: ${auth.currentUser?.displayName || 'Kavach User'} is on a 'Safe Ride' and added you as Guardian. Track her live location securely here: ${trackingLink}`;
            await KavachSafe.broadcastEmergencySMS({
              numbers: [phone],
              message: smsMessage
            });
            console.log(`📡 SMART SMS FALLBACK: Fallback SMS dispatched to unregistered guardian (${phone}).`);
          }
        }
      }
    } catch (err) {
      console.warn("Smart SMS fallback check failed (non-fatal):", err);
    }
  };

  const handleShareWhatsApp = () => {
    const googleMapsLink = userPos ? `https://www.google.com/maps?q=${userPos.lat},${userPos.lng}` : "GPS signal pending...";
    const kavachHubLink = `https://kavach-women.web.app/track/${auth.currentUser?.uid}`;
    const msg = `🚨 *KAVACH TACTICAL ALERT*\n\nRide Safe Protocol: *ACTIVE MONITORING*\n\n*Vehicle:* ${vehicleNo || 'Not Specified'}\n\n📍 *CURRENT LOCATION (Snapshot):*\n${googleMapsLink}\n\n📡 *LIVE MOVEMENT TRACKER (Real-time):*\n${kavachHubLink}\n\n_Note: Live tracker updates movement every 3 seconds. System is linked to Police Command Hub._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="pointer-events-auto">
      <div className="text-center space-y-3 sm:space-y-4 mb-4 sm:mb-0">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 " />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl sm:rounded-[30px] flex items-center justify-center mx-auto shadow-2xl border border-white/20">
            <ShieldCheck size={32} className="text-white sm:size-[40px]" />
          </div>
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tighter">Ride Safe Protocol</h2>
          <p className="text-[9px] sm:text-[10px] text-blue-500 font-black uppercase tracking-[3px] sm:tracking-[4px]">National Strategic Command Hub</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['256-bit AES', Lock], ['Device Lock', Smartphone], ['Police Verified', ShieldCheck]].map(([label, Icon], i) => (
          <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
            <Icon size={16} className="mx-auto text-gray-500 mb-2" />
            <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">{label as string}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4 sm:space-y-6 mt-6">
        <div className="bg-white/[0.03] p-5 sm:p-8 rounded-3xl sm:rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Car size={60} className="text-white sm:size-[80px]" /></div>
          <div className="relative z-10 space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-[3px] !text-white !opacity-100 flex items-center gap-2">
                <Activity size={14} className="!text-white" /> Journey Configuration
              </label>
              <div className="space-y-3">
                <div className="relative z-20">
                  <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-blue-400"><MapPin size={16} className="sm:size-[18px]" /></div>
                  <input
                    id="kavach-mappls-auto" value={destinationQuery}
                    onChange={(e) => { setDestinationQuery(e.target.value); if (selectedDestination && e.target.value !== selectedDestination.name) setSelectedDestination(null); }}
                    placeholder="Search Destination"
                    className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white placeholder:text-white/60 focus:outline-none focus:border-blue-400 transition-all shadow-inner"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-blue-400"><Car size={16} className="sm:size-[18px]" /></div>
                  <input
                    value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                    placeholder="e.g. MH 01 AB 1234"
                    className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 bg-white/10 border border-white/20 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-white placeholder:text-white/60 focus:outline-none focus:border-blue-400 transition-all shadow-inner uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
              <button onClick={handleShareWhatsApp} className="w-full py-4 sm:py-5 bg-white text-black rounded-xl sm:rounded-[24px] text-[10px] sm:text-[11px] font-black uppercase tracking-[2px] sm:tracking-[3px] text-center hover:bg-gray-100 active:scale-98 transition-all shadow-xl italic">
                Emergency Connect (WhatsApp/SMS)
              </button>
              <button onClick={handleStartRide} className="w-full py-4 sm:py-5 bg-[#2563EB] text-white rounded-xl sm:rounded-[24px] text-[10px] sm:text-[11px] font-black uppercase tracking-[2px] sm:tracking-[3px] text-center shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all italic">
                Initiate Active Journey Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
