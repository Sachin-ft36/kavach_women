import React, { useState } from 'react';
import { MapPin, X, Search, Navigation, Compass, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useKavachStore } from '../state/useKavachStore';
import { toast } from 'sonner';
import { searchLocation } from '../services/locationService';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PRESETS = [
  { name: 'Rewa', lat: 24.5362, lng: 81.3037, state: 'Madhya Pradesh' },
  { name: 'Indore', lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' }
];

export default function LocationSelectorModal({ isOpen, onClose }: LocationSelectorModalProps) {
  const { userPos, setUserPos, syncLocation } = useKavachStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: typeof QUICK_PRESETS[0]) => {
    setUserPos({ lat: preset.lat, lng: preset.lng });
    toast.success(`Location set to ${preset.name}`);
    onClose();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const coords = await searchLocation(searchQuery);
      if (coords) {
        setUserPos({ lat: coords[0], lng: coords[1] });
        toast.success(`Location updated to ${searchQuery}`);
        onClose();
      } else {
        toast.error('Location not found. Please try a different query.');
      }
    } catch (err) {
      toast.error('Failed to search location.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetToGPS = async () => {
    setIsSyncing(true);
    try {
      const pos = await syncLocation();
      if (pos) {
        toast.success('Synced with live GPS location');
        onClose();
      } else {
        toast.error('Could not fetch live GPS. Check location permissions.');
      }
    } catch (err) {
      toast.error('Error syncing location.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#0F0E3E] p-6 shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #16124B 0%, #0C0B31 100%)'
        }}
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        <div className="flex justify-between items-start mb-5 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <MapPin size={22} />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        <h3 className="text-xl font-extrabold text-white tracking-tight leading-none uppercase italic">
          Location Override
        </h3>
        <p className="text-[9px] text-violet-400 font-bold uppercase tracking-[2.5px] mt-1.5 mb-6">
          Set Geofence & Weather Anchor
        </p>

        {/* Live GPS Sync Button */}
        <button
          onClick={handleResetToGPS}
          disabled={isSyncing}
          className="w-full flex items-center justify-between p-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-900/30 transition-all active:scale-[0.98] mb-5"
        >
          <div className="flex items-center gap-2.5">
            <Navigation size={15} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live GPS Location'}</span>
          </div>
          <Compass size={14} className="opacity-60" />
        </button>

        {/* Search form */}
        <form onSubmit={handleSearch} className="relative mb-5">
          <input
            type="text"
            placeholder="Search city (e.g., Rewa, MP)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-2xl py-3 pl-10 pr-4 text-xs font-semibold text-white placeholder-slate-400 outline-none transition-all"
          />
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/15 active:scale-95 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </form>

        {/* Presets */}
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Quick Presets
          </span>
          <div className="space-y-2">
            {QUICK_PRESETS.map((preset) => {
              const isSelected =
                Math.abs(userPos.lat - preset.lat) < 0.01 &&
                Math.abs(userPos.lng - preset.lng) < 0.01;

              return (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'bg-violet-950/40 border-violet-500/30 text-white'
                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] text-slate-300'
                  }`}
                >
                  <div>
                    <span className="block text-xs font-bold">{preset.name}</span>
                    <span className="block text-[8px] text-slate-400 uppercase tracking-wider mt-0.5">
                      {preset.state} • {preset.lat.toFixed(2)}°, {preset.lng.toFixed(2)}°
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
