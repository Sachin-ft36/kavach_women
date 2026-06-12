import React from 'react';
import { AlertTriangle, Radio, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectorAlertListProps {
  activeAlerts: any[];
  profile: any;
  setActiveInterceptAlert: (alert: any) => void;
  setActiveTab: (tab: string) => void;
  setIsNearbyHubOpen: (val: boolean) => void;
  setIsMedicalHubOpen: (val: boolean) => void;
}

export default function ProtectorAlertList({ activeAlerts, profile, setActiveInterceptAlert, setActiveTab, setIsNearbyHubOpen, setIsMedicalHubOpen }: ProtectorAlertListProps) {
  const isPcrOfficer = profile?.role === 'pcr_officer';

  return (
    <>
      {/* NEARBY AREA / ACTIVE ALERTS */}
      {activeAlerts.length === 0 ? (
        <div className="mx-5 bg-white rounded-[24px] shadow-lg border border-slate-200 flex flex-col overflow-hidden relative">
          <div className="bg-slate-800 p-5 border-b-4 border-emerald-600 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isPcrOfficer ? 'National Emergency Response Network' : 'Community Shield Network'}
              </p>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                {isPcrOfficer ? 'Active Surveillance' : 'Monitoring Area'}
              </h3>
            </div>
            <ShieldCheck size={28} className="text-emerald-500 opacity-90" />
          </div>

          <div className="p-8 flex flex-col items-center justify-center text-center bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-green-500 opacity-20" />
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm border border-slate-200 relative">
              <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" />
              <Radio size={24} className="text-slate-700" />
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1.5">
              {isPcrOfficer ? 'Sector Status: Secure' : 'Area Status: Safe'}
            </h4>
            <p className="text-xs text-slate-500 max-w-[220px] leading-relaxed font-medium">
              {isPcrOfficer 
                ? 'No active emergencies reported in your jurisdiction. Stay alert and ready to respond.'
                : 'No active emergencies reported nearby. Thank you for keeping your community safe.'}
            </p>
          </div>
          
          <div className="bg-slate-100 py-3 text-center border-t border-slate-200">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              {isPcrOfficer ? 'Govt. of India • Local Jurisdiction' : 'Verified Protector • Kavach Safety Network'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] p-5 shadow-lg border border-slate-100 flex flex-col justify-between overflow-hidden relative mx-5">
            <div className="flex justify-between items-start mb-4">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                  Emergency Alert
                </p>
                <h3 className="text-lg font-black text-slate-800">{activeAlerts.length} Active SOS</h3>
                <p className="text-[11px] text-slate-500 max-w-[160px] leading-snug">Immediate assistance required nearby.</p>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center mr-2 z-0">
                <div className="absolute inset-0 rounded-full border border-rose-100 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-rose-200" />
                <div className="w-8 h-8 bg-rose-50 rounded-full flex items-center justify-center relative z-10">
                  <AlertTriangle size={14} className="text-rose-600" fill="currentColor" />
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-2">
              {activeAlerts.slice(0, 3).map((alert: any) => {
                const name = alert.victimName || alert.userName || 'Unknown Victim';
                return (
                <div key={alert.id} className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-rose-100 transition-colors" onClick={() => setActiveInterceptAlert(alert)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-200/50 flex items-center justify-center text-rose-600 font-black text-xs">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{name}</p>
                      <p className="text-[9px] font-bold text-rose-600 uppercase mt-0.5">{alert.type || 'EMERGENCY'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-600">{alert.distance ? `${Number(alert.distance).toFixed(1)} km` : 'Nearby'}</p>
                    <button className="text-[9px] font-black text-white bg-rose-600 px-3 py-1.5 rounded-lg mt-1 shadow-sm">RESPOND</button>
                  </div>
                </div>
              )})}
              {activeAlerts.length > 3 && (
                <p className="text-center text-[10px] font-bold text-slate-500 mt-2 cursor-pointer">+{activeAlerts.length - 3} more alerts...</p>
              )}
            </div>
          </div>
      )}

      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-[24px] p-5 shadow-lg border border-slate-100 mt-4 mx-5 mb-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Recent Activity</p>
          {((profile?.recentActivity?.length > 0) || (profile?.activities?.length > 0)) && (
            <p className="text-[10px] font-bold text-blue-600 cursor-pointer">View All</p>
          )}
        </div>

        <div className="space-y-4">
          {(() => {
            const activities = profile?.recentActivity || profile?.activities || [];
            if (activities.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <Clock size={20} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No Recent Activity</p>
                  <p className="text-[10px] text-slate-400 mt-1">Your response history will appear here.</p>
                </div>
              );
            }

            return activities.map((activity: any, index: number) => (
              <div key={activity.id || index} className={`flex justify-between items-center ${index !== activities.length - 1 ? 'border-b border-slate-50 pb-4' : ''}`}>
                <div className="flex gap-3 items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${activity.status === 'Failed' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                    {activity.status === 'Failed' ? <AlertTriangle size={16} fill="currentColor" className="text-rose-500" /> : <CheckCircle2 size={16} fill="currentColor" className="text-emerald-500" />}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-800">{activity.type || 'Assistance'}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{activity.location || 'Unknown'} • <span className={`font-medium ${activity.status === 'Failed' ? 'text-rose-600' : 'text-emerald-600'}`}>{activity.status || 'Successful'}</span></p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">{activity.timestamp || activity.time || 'Recently'}</p>
              </div>
            ));
          })()}
        </div>
      </div>
    </>
  );
}
