import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { ShieldCheck, Briefcase, MessageSquare, CheckSquare, MapPin, Loader2, Info, Car, ShieldAlert, Award } from 'lucide-react';
import { useServiceNumberCheck } from './hooks/useServiceNumberCheck';
import { useHomeBaseLocation } from './hooks/useHomeBaseLocation';
import { PcrSpecificFields, LocationField, ServiceNumberInput } from './components/VerificationFields';

interface ProtectorVerificationStepProps {
  role: 'citizen' | 'protector' | 'guardian' | null;
  data: {
    fullName: string;
    address: string;
    occupation: string;
    customOccupation: string;
    reason: string;
    agreement: boolean;
    serviceNumber?: string;
    isServiceNumberValid?: boolean;
    badgeId?: string;
    vehicleNo?: string;
    rank?: string;
    thanaName?: string;
    testingPasscode?: string;
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
  const isPcrRoute = false;

  const { checking, checkResult } = useServiceNumberCheck(data, setData);
  const { isLocating, handleFetchLocation } = useHomeBaseLocation(data, setData, isPcrRoute);

  return (
    <div className="space-y-6 pb-6">
      <div className="text-left">
        <h2 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
          {isPcrRoute ? (
            <>
              <ShieldAlert className="text-rose-600 " size={22} />
              Police PCR Vetting
            </>
          ) : (
            <>
              <ShieldCheck className="text-blue-600" size={22} />
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
        {/* Full Name - Only displayed for PCR Officer, as Civilian name is verified in Step 1 */}
        {isPcrRoute && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Officer Full Name
            </label>
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
              placeholder="As per Service Records"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
        )}

        {/* PCR Specific Details */}
        {isPcrRoute && (
          <PcrSpecificFields data={data} setData={setData} POLICE_RANKS={POLICE_RANKS} />
        )}

        {/* Address / Station Coordinates */}
        {(isPcrRoute || !data.address) && (
          <LocationField data={data} setData={setData} isPcrRoute={isPcrRoute} isLocating={isLocating} handleFetchLocation={handleFetchLocation} />
        )}

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

            {/* 🪖 Army / Police Service Number — Conditional */}
            {['Army', 'Ex-Army', 'Police', 'Ex-Police'].includes(data.occupation) && (
              <ServiceNumberInput data={data} setData={setData} checking={checking} checkResult={checkResult} />
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

      {/* Background Shield */}
      <div className="absolute right-[-10%] top-[20%] text-[#10B981] opacity-[0.03] pointer-events-none">
        <ShieldCheck size={280} className="stroke-[1]" />
      </div>
    </div>
  );
}
