import React from 'react';
import { Calculator, Map, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  setIsStealthDisguised: (val: boolean) => void;
  setIsSafeHavenMapOpen: (val: boolean) => void;
  setSafeHavenTarget: (val: any) => void;
  nearbyCount: number;
}

export default function SosHeader({ setIsStealthDisguised, setIsSafeHavenMapOpen, setSafeHavenTarget, nearbyCount }: Props) {
  return (
    <div className="relative z-10 flex items-center justify-between gap-2 mb-5">
      {/* HIDE */}
      <button
        onClick={() => {
          setIsStealthDisguised(true);
          toast.success("APP HIDDEN");
        }}
        className="h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6 rounded-full border border-blue-500/30 bg-white/5 backdrop-blur-xl flex items-center gap-2 text-white shadow-lg flex-shrink-0"
      >
        <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
        <span className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-wide whitespace-nowrap">
          HIDE
        </span>
      </button>

      {/* Protectors Map */}
      <button
        onClick={() => {
          setSafeHavenTarget(null);
          setIsSafeHavenMapOpen(true);
        }}
        className="flex-1 h-10 sm:h-12 md:h-14 px-3 sm:px-4 md:px-8 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-xl flex items-center justify-center gap-2 text-blue-300 shadow-lg min-w-0"
      >
        <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
        <span className="text-[10px] sm:text-xs md:text-sm font-semibold truncate">
          Protectors Map
        </span>
      </button>

      {/* IN RANGE */}
      <div className="h-10 sm:h-12 md:h-14 px-2 sm:px-3 md:px-5 rounded-full border border-blue-500/30 bg-white/5 backdrop-blur-xl flex items-center gap-1.5 text-blue-200 shadow-lg flex-shrink-0">
        <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-[14px] md:h-[14px]" />
        <span className="text-[9px] sm:text-[10px] md:text-xs font-bold whitespace-nowrap">
          {nearbyCount} IN RANGE
        </span>
      </div>
    </div>
  );
}
