import React, { useState } from 'react';
import MapplsVictimMap from '../maps/MapplsVictimMap';
import { Users, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';
import { useKavachStore } from '../../store/useKavachStore';
import { executeEmergencyBlast } from '../../services/sosService';

interface ProtectorMapContainerProps {
  setIsNearbyHubOpen: (val: boolean) => void;
  setIsMedicalHubOpen: (val: boolean) => void;
  setActiveTab: (val: string) => void;
  setHubViewMode?: (mode: 'all' | 'protectors_only') => void;
}

export default function ProtectorMapContainer({ setIsNearbyHubOpen, setIsMedicalHubOpen, setActiveTab, setHubViewMode }: ProtectorMapContainerProps) {
  const user = useKavachStore(state => state.user);
  const userPos = useKavachStore(state => state.userPos);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const handleTriggerAlert = () => {
    setShowWarningModal(false);
    localStorage.setItem('kavach_last_protector_alert', Date.now().toString());
    toast.success("Incident Broadcasted to Network!");
    executeEmergencyBlast(user, userPos, { type: 'PROTECTOR_REPORT', handshakeCode: '0000' });
  };

  return (
    <div className="px-5 pb-6">
      {/* LIVE AREA MAP (WHITE CARD) */}
      <div className="bg-white rounded-[24px] shadow-lg border border-slate-100 overflow-hidden relative mb-4">
        <div className="w-full h-[350px]">
          <MapplsVictimMap />
        </div>
      </div>

      {/* QUICK ACTIONS (EXACT ICONS) */}
      <div className="bg-white rounded-[24px] p-5 shadow-lg border border-slate-100 flex justify-between items-center">
        <div className="flex flex-col items-center gap-2 cursor-pointer w-1/4" onClick={() => { setHubViewMode?.('all'); setIsNearbyHubOpen(true); }}>
          <div className="text-blue-600 mb-1">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l1 2h18l1-2-10-5z" />
              <path d="M4 10v4c0 4.4 3.6 8 8 8s8-3.6 8-8v-4H4zm8 9c-2.8 0-5-2.2-5-5v-2h10v2c0 2.8-2.2 5-5 5z" fillOpacity="0.8" />
            </svg>
          </div>
          <div className="text-center">
            <span className="block text-xs font-black text-slate-800">Police</span>
            <span className="block text-[9px] text-slate-500">Request</span>
          </div>
        </div>

        <div className="w-px h-10 bg-slate-200" />

        <div className="flex flex-col items-center gap-2 cursor-pointer w-1/4" onClick={() => setIsMedicalHubOpen(true)}>
          <div className="text-rose-500 mb-1">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="7" width="20" height="14" rx="3" fillOpacity="0.9" />
              <path d="M8 7V5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M12 10v8M8 14h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-center">
            <span className="block text-xs font-black text-slate-800">Medical</span>
            <span className="block text-[9px] text-slate-500">Request</span>
          </div>
        </div>

        <div className="w-px h-10 bg-slate-200" />

        <div className="flex flex-col items-center gap-2 cursor-pointer w-1/4" onClick={() => { setHubViewMode?.('protectors_only'); setIsNearbyHubOpen(true); }}>
          <div className="text-purple-500 mb-1">
            <Users size={32} fill="currentColor" className="opacity-90" />
          </div>
          <div className="text-center">
            <span className="block text-xs font-black text-slate-800">Nearby</span>
            <span className="block text-[9px] text-slate-500">Protectors</span>
          </div>
        </div>

        <div className="w-px h-10 bg-slate-200" />

        <div className="flex flex-col items-center gap-2 cursor-pointer w-1/4" onClick={() => {
          const lastAlert = localStorage.getItem('kavach_last_protector_alert');
          const now = Date.now();
          if (lastAlert && now - parseInt(lastAlert) < 300000) { // 5 minutes cooldown
            const left = Math.ceil((300000 - (now - parseInt(lastAlert))) / 60000);
            toast.error(`Anti-Spam Active: Please wait ${left} mins before raising another alert.`);
            return;
          }
          setShowWarningModal(true);
        }}>
          <div className="text-orange-500 mb-1">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2a6 6 0 0 0-6 6v4l-2 3v2h16v-2l-2-3V8a6 6 0 0 0-6-6z" fillOpacity="0.9" />
              <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2z" />
              <path d="M12 2v2" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 4l1 1" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M15 4l-1 1" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-center">
            <span className="block text-xs font-black text-slate-800">Raise</span>
            <span className="block text-[9px] text-slate-500">Alert</span>
          </div>
        </div>
      </div>
      {/* WARNING MODAL */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertOctagon size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Warning: Legal Notice</h3>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Raising a fake alert or misusing this feature is a serious offense. 
                <br /><br />
                <span className="font-bold text-red-600">Doing so will result in an immediate permanent ban of your Protector account and potential legal action.</span>
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 flex gap-3">
              <button 
                onClick={() => setShowWarningModal(false)}
                className="flex-1 px-4 py-3 bg-white text-slate-700 text-sm font-bold rounded-xl border border-slate-200 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleTriggerAlert}
                className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
