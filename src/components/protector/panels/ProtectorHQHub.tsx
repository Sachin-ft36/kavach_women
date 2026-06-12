import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Radio, MapPin, Search, ChevronRight, Activity, AlertTriangle, Phone, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectorHQHubProps {
  profile: any;
  userPos: any;
  activeInterceptAlert?: any;
}

export default function ProtectorHQHub({ profile, userPos, activeInterceptAlert }: ProtectorHQHubProps) {
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [pcrEta, setPcrEta] = useState(5); // Simulated starting ETA in minutes

  // Simulate PCR van moving closer
  React.useEffect(() => {
    if (activeInterceptAlert && pcrEta > 1) {
      const timer = setInterval(() => {
        setPcrEta(prev => Math.max(1, prev - 1));
      }, 60000); // decreases 1 min every 60s
      return () => clearInterval(timer);
    }
  }, [activeInterceptAlert, pcrEta]);

  // Mock PCR vehicles for demonstration
  const pcrVehicles = [
    { id: 'PCR-7A', name: 'Sector 62 Beat Car', status: 'Patrolling', distance: '1.2 km', crew: 3 },
    { id: 'PCR-9B', name: 'Central Bypass Unit', status: 'Responding', distance: '3.4 km', crew: 4 },
    { id: 'PCR-2C', name: 'Highway Intercept', status: 'Standby', distance: '5.1 km', crew: 2 },
  ];

  const handleRequestBackup = () => {
    toast.success('Backup request sent to Central HQ. A PCR unit is being dispatched to your coordinates.');
  };

  const handleSubmitReport = () => {
    if (!reportText.trim()) {
      toast.error('Please enter report details.');
      return;
    }
    setIsSubmittingReport(true);
    setTimeout(() => {
      toast.success('Patrol report submitted to HQ successfully.');
      setReportText('');
      setIsSubmittingReport(false);
    }, 1500);
  };

  return (
    <div className="px-5 pb-6 space-y-4">
      {/* SECTOR JURISDICTION INFO */}
      <div className="bg-white rounded-[24px] p-5 shadow-lg border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] z-0 opacity-50" />
        <div className="relative z-10">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <MapPin size={10} /> Active Jurisdiction
          </p>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            {profile?.zone || profile?.city || 'Sector Alpha Beat'}
          </h3>
          <div className="flex items-center gap-3 mt-3">
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
              <Activity size={10} /> Optimal Safety Level
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Last sweep: 10 mins ago
            </div>
          </div>
        </div>
      </div>

      {/* HQ UPLINK (QUICK ACTIONS) */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleRequestBackup}
          className="bg-slate-800 text-white p-4 rounded-2xl shadow-lg border border-slate-700 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <Shield size={20} className="text-blue-400" />
          </div>
          <div className="text-center">
            <span className="block text-xs font-black uppercase tracking-widest">HQ Backup</span>
            <span className="block text-[9px] text-slate-400">Request Unit</span>
          </div>
        </button>

        <button 
          onClick={() => window.location.href = 'tel:112'}
          className="bg-rose-50 text-rose-600 p-4 rounded-2xl shadow-sm border border-rose-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Phone size={20} className="text-rose-500" />
          </div>
          <div className="text-center">
            <span className="block text-xs font-black uppercase tracking-widest">Control Room</span>
            <span className="block text-[9px] text-rose-400">Direct Line (112)</span>
          </div>
        </button>
      </div>

      {/* ACTIVE PCR UNITS */}
      <div className="bg-white rounded-[24px] p-5 shadow-lg border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Radio size={12} className="text-blue-500" /> Nearby PCR Units
          </p>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="space-y-3">
          {/* DYNAMIC PCR RESPONDING TO YOUR ALERT */}
          {activeInterceptAlert && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="p-4 rounded-xl border border-rose-200 bg-rose-50 shadow-sm relative overflow-hidden"
             >
               <div className="absolute right-0 top-0 bottom-0 w-1 bg-rose-500" />
               <div className="flex items-start justify-between">
                 <div>
                   <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                     <AlertTriangle size={10} /> Dispatched to your location
                   </p>
                   <h4 className="text-sm font-black text-slate-800 uppercase">PCR Van DL-1C</h4>
                   <p className="text-xs font-bold text-slate-600 mt-0.5">Assigned to: {activeInterceptAlert.userName || 'Victim'}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-2xl font-black text-rose-600 leading-none">{pcrEta}<span className="text-sm">m</span></p>
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live ETA</p>
                 </div>
               </div>
             </motion.div>
          )}

          {pcrVehicles.map((pcr, i) => (
            <motion.div 
              key={pcr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">
                  {pcr.id.split('-')[1]}
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-800 uppercase">{pcr.name}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${pcr.status === 'Patrolling' ? 'bg-emerald-500' : pcr.status === 'Responding' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    {pcr.status} • {pcr.distance}
                  </p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* SHIFT / PATROL LOGGING */}
      <div className="bg-white rounded-[24px] p-5 shadow-lg border border-slate-100">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <FileText size={12} className="text-blue-500" /> Quick Patrol Log
        </p>
        <textarea
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          placeholder="Log suspicious activity, sector clearance, or handover notes to HQ..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none h-20 mb-3"
        />
        <button 
          onClick={handleSubmitReport}
          disabled={isSubmittingReport}
          className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmittingReport ? 'Submitting to HQ...' : 'Submit Log to Command'}
        </button>
      </div>

    </div>
  );
}
