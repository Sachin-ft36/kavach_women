import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { ShieldCheck, Briefcase, MessageSquare, CheckSquare, MapPin, Loader2, Info, Car, ShieldAlert, Award } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { toast } from 'sonner';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FjaGluc2luZ2g0NCIsImEiOiJjbW9jaGtvajYwMHJrMm9zNHAxOTNiaWR2In0.VgCw_PcpPvNKFWQv_B3-lA';

interface ProtectorVerificationStepProps {
  role: 'citizen' | 'protector' | 'pcr_officer' | null;
  data: {
    fullName: string;
    address: string;
    occupation: string;
    customOccupation: string;
    reason: string;
    agreement: boolean;
    // PCR specific
    badgeId?: string;
    vehicleNo?: string;
    rank?: string;
    thanaName?: string;
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

const POLICE_RANKS = [
  'Constable',
  'Head Constable',
  'Assistant Sub-Inspector (ASI)',
  'Sub-Inspector (SI)',
  'Inspector',
  'Deputy Superintendent (DSP)',
  'Additional SP / SP'
];

export default function ProtectorVerificationStep({ role, data, setData }: ProtectorVerificationStepProps) {
  const [isLocating, setIsLocating] = useState(false);
  const isPcrRoute = role === 'pcr_officer';

  const handleFetchLocation = async () => {
    const confirmHome = window.confirm(
      isPcrRoute 
        ? "SECURITY ALERT: This will fetch your CURRENT coordinates. Please ensure you are at your ASSIGNED POLICE STATION or HOME BASE."
        : "SECURITY ALERT: This will fetch your CURRENT location. Please ensure you are at your PERMANENT RESIDENCE / HOME BASE before proceeding."
    );
    
    if (!confirmHome) return;

    setIsLocating(true);
    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const { latitude, longitude } = position.coords;

      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=address`);
      const json = await res.json();
      
      if (json.features && json.features.length > 0) {
        setData({ ...data, address: json.features[0].place_name });
        toast.success(isPcrRoute ? "Precinct Coordinates Synchronized" : "Home Base Synchronized");
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
          {isPcrRoute ? (
            <>
              <ShieldAlert className="text-rose-600 animate-pulse" size={24} />
              Police PCR Vetting
            </>
          ) : (
            <>
              <ShieldCheck className="text-blue-600" size={24} />
              Protector Verification
            </>
          )}
        </h2>
        <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-tight">
          {isPcrRoute 
            ? "Configure your active patrol unit for tactical dispatch commands"
            : "Establish your operative profile for the national safety grid"
          }
        </p>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {isPcrRoute ? "Officer Full Name" : "Full Name"}
          </label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => setData({ ...data, fullName: e.target.value })}
            placeholder={isPcrRoute ? "As per Service Records" : "As per Government ID"}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>

        {/* PCR Specific Details */}
        {isPcrRoute && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Rank / Designation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Police Rank</label>
              <div className="relative">
                <select
                  value={data.rank || ''}
                  onChange={(e) => setData({ ...data, rank: e.target.value, occupation: 'Police' })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none transition-all"
                >
                  <option value="">Select Rank</option>
                  {POLICE_RANKS.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Award size={14} className="text-gray-400" />
                </div>
              </div>
            </div>

            {/* Badge / ID Number & PCR Vehicle Number in Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Badge ID</label>
                <input
                  type="text"
                  value={data.badgeId || ''}
                  onChange={(e) => setData({ ...data, badgeId: e.target.value.toUpperCase() })}
                  placeholder="e.g. MP-2291"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PCR Vehicle No</label>
                <input
                  type="text"
                  value={data.vehicleNo || ''}
                  onChange={(e) => setData({ ...data, vehicleNo: e.target.value.toUpperCase() })}
                  placeholder="e.g. MP-04-PCR-12"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Assigned Police Station Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Thana / Police Precinct</label>
              <input
                type="text"
                value={data.thanaName || ''}
                onChange={(e) => setData({ ...data, thanaName: e.target.value })}
                placeholder="e.g. Bhopal Bypass Chowki Police Station"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </motion.div>
        )}

        {/* Address / Station Coordinates */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-end px-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {isPcrRoute ? "Operational Precinct Address" : "Permanent Residence Address"}
            </label>
            <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest italic flex items-center gap-1">
               <Info size={8} /> Use Fetch only at Base
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              placeholder={isPcrRoute ? "Station Street, Sector Details, Area" : "House No, Building, Area, City"}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 pr-12 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <button 
              type="button"
              onClick={handleFetchLocation}
              disabled={isLocating}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 active:scale-90 transition-all disabled:opacity-50 group"
            >
              {isLocating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              <div className="absolute bottom-full mb-3 right-0 w-48 p-3 bg-gray-900 text-[8px] font-bold text-white uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl leading-relaxed">
                 🛡️ Security: Use this only when you are at your PERMANENT/OFFICIAL STATION.
              </div>
            </button>
          </div>
        </div>

        {/* Standard Occupation Dropdown for Civilian */}
        {!isPcrRoute && (
          <>
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
          </>
        )}

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
            {isPcrRoute 
              ? "I confirm my active law enforcement profile is accurate and official duties are logged."
              : "I agree to respond responsibly and respectfully during emergency situations."
            }
          </p>
        </button>
      </div>
    </div>
  );
}
