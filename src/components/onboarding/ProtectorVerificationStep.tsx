import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { ShieldCheck, Briefcase, MessageSquare, CheckSquare, MapPin, Loader2, Info } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { toast } from 'sonner';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA';

interface ProtectorVerificationStepProps {
  data: {
    fullName: string;
    address: string;
    occupation: string;
    customOccupation: string;
    reason: string;
    agreement: boolean;
  };
  setData: (data: any) => void;
}

const OCCUPATIONS = [
  'Army',
  'Ex-Army',
  'Police',
  'Ex-Police',
  'Doctor',
  'Engineer',
  'Student',
  'Other'
];

export default function ProtectorVerificationStep({ data, setData }: ProtectorVerificationStepProps) {
  const [isLocating, setIsLocating] = useState(false);

  const handleFetchLocation = async () => {
    // 🛡️ PRIVACY GUARD: VERIFY HOME STATUS
    const confirmHome = window.confirm("SECURITY ALERT: This will fetch your CURRENT location. Please ensure you are at your PERMANENT RESIDENCE / HOME BASE before proceeding. If you are at an office or public place, please enter your address manually.");
    
    if (!confirmHome) return;

    setIsLocating(true);
    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const { latitude, longitude } = position.coords;

      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=address`);
      const json = await res.json();
      
      if (json.features && json.features.length > 0) {
        setData({ ...data, address: json.features[0].place_name });
        toast.success("Home Base Synchronized");
      }
    } catch (e) {
      toast.error("Geolocation Failed. Please enter manually.");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="text-left">
        <h2 className="text-2xl font-black text-[#0F172A] flex items-center gap-2">
          <ShieldCheck className="text-blue-600" size={24} />
          Protector Verification
        </h2>
        <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-tight">
          Establish your operative profile for the national grid
        </p>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => setData({ ...data, fullName: e.target.value })}
            placeholder="As per Government ID"
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>

        {/* City / Address */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-end px-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Permanent Residence Address</label>
            <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest italic flex items-center gap-1">
               <Info size={8} /> Use Fetch only at Home
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              placeholder="House No, Building, Area, City"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 pr-12 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <button 
              type="button"
              onClick={handleFetchLocation}
              disabled={isLocating}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 active:scale-90 transition-all disabled:opacity-50 group"
            >
              {isLocating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              {/* Tooltip */}
              <div className="absolute bottom-full mb-3 right-0 w-48 p-3 bg-gray-900 text-[8px] font-bold text-white uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl leading-relaxed">
                 🛡️ Security: Use this only when you are at your PERMANENT HOME BASE.
              </div>
            </button>
          </div>
        </div>

        {/* Occupation Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professional Background</label>
          <div className="relative">
            <select
              value={data.occupation}
              onChange={(e) => setData({ ...data, occupation: e.target.value })}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none transition-all"
            >
              <option value="">Select Occupation</option>
              {OCCUPATIONS.map(occ => (
                <option key={occ} value={occ}>{occ}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Briefcase size={14} className="text-gray-400" />
            </div>
          </div>
        </div>

        {/* Custom Occupation */}
        {data.occupation === 'Other' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Specify Occupation</label>
            <input
              type="text"
              value={data.customOccupation}
              onChange={(e) => setData({ ...data, customOccupation: e.target.value })}
              placeholder="Your profession"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </motion.div>
        )}

        {/* Why become a protector? */}
        <div className="space-y-1.5 pt-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
             <MessageSquare size={10} /> Why do you want to become a protector?
          </label>
          <textarea
            value={data.reason}
            onChange={(e) => setData({ ...data, reason: e.target.value })}
            placeholder="Share your motivation..."
            rows={3}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
          />
        </div>

        {/* Responsibility Checkbox */}
        <button 
          onClick={() => setData({ ...data, agreement: !data.agreement })}
          className={cn(
            "w-full p-4 rounded-2xl border transition-all flex items-start gap-3 text-left",
            data.agreement ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"
          )}
        >
          <div className={cn(
            "mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all",
            data.agreement ? "bg-green-600 border-green-600" : "bg-white border-gray-300"
          )}>
            {data.agreement && <CheckSquare size={12} className="text-white" />}
          </div>
          <p className={cn(
            "text-[10px] font-black uppercase tracking-tight leading-relaxed",
            data.agreement ? "text-green-700" : "text-gray-500"
          )}>
            I agree to respond responsibly and respectfully during emergency situations.
          </p>
        </button>
      </div>
    </div>
  );
}
