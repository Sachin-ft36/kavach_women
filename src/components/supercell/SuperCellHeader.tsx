import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Bell, BookOpen, History, ShieldAlert, Car, Gavel, Users, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface SuperCellHeaderProps {
  selectedState: string;
  detectedAdminDistrict: string | null;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  isSovereignActive: boolean;
  setIsSovereignActive: (active: boolean) => void;
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setModalConfig: React.Dispatch<React.SetStateAction<any>>;
  onTabChange: (id: string) => void;
}

export const SuperCellHeader = ({
  selectedState,
  detectedAdminDistrict,
  notifications,
  setNotifications,
  isSovereignActive,
  setIsSovereignActive,
  showHeatmap,
  setShowHeatmap,
  unreadCount,
  setUnreadCount,
  setModalConfig,
  onTabChange
}: SuperCellHeaderProps) => {
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  return (
    <header className="h-16 bg-[#0B0F19] border-b border-white/5 px-8 flex items-center justify-between z-40 shrink-0">
      {/* 🏛️ SOVEREIGN COMMAND HEADER: AUTHORIZED PERSONNEL ONLY */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-950/30 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-sm">
            <Shield size={16} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[10px] font-black text-white uppercase leading-none tracking-tighter italic">
              {selectedState === 'ALL' ? 'Kavach Supercell HQ' : detectedAdminDistrict ? `${detectedAdminDistrict.toUpperCase()} DISTRICT HQ` : `${selectedState} Grid HQ`}
            </h1>
            <p className="text-[7px] font-bold text-gray-500 uppercase tracking-[0.1em] mt-1">
              {selectedState === 'ALL' ? 'National Command Grid' : detectedAdminDistrict ? 'District Jurisdiction Grid' : 'State Jurisdiction Grid'}
            </p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-white/10" />

        <div className="flex items-center gap-2.5 animate-in fade-in duration-300">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[8px] font-black uppercase tracking-[2.5px] text-emerald-400 leading-none">
            {selectedState === 'ALL' ? 'SECURED NATIONAL COMMAND HQ' : detectedAdminDistrict ? `SECURED ${detectedAdminDistrict.toUpperCase()} DISTRICT COMMAND` : `SECURED ${selectedState} STATE COMMAND`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* 🛰️ STRATEGIC INTELLIGENCE LEDGER (THE BOOK) */}
        <div className="relative">
          <button
            onClick={() => {
              setIsLedgerOpen(!isLedgerOpen);
              setUnreadCount(0);
            }}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative group",
              isLedgerOpen ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-white/5 text-gray-400 hover:text-blue-400 border border-white/5"
            )}
          >
            <Bell size={20} className={cn(unreadCount > 0 && "animate-bounce")} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isLedgerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute top-full right-0 mt-4 w-[400px] bg-[#1E293B] border border-white/10 rounded-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] z-[100] overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen size={18} className="text-blue-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[2px] text-white">Intelligence Ledger</h3>
                  </div>
                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{notifications.length} Records</span>
                </div>

                <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2">
                  {notifications.length === 0 ? (
                    <div className="py-20 text-center opacity-20">
                      <History size={40} className="mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white">No New Intel</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            // 🚀 TACTICAL REDIRECT
                            const tabMap: Record<string, any> = {
                              'SOS': 'SOS',
                              'JOURNEY': 'ANALYTICS',
                              'FIR': 'FIR',
                              'VETTING': 'DATA'
                            };
                            const targetTab = tabMap[n.type] || 'COMMAND';
                            onTabChange(targetTab);

                            // 🧹 AUTO-DISMISS
                            setNotifications(prev => prev.filter(item => item.id !== n.id));
                            setIsLedgerOpen(false);
                          }}
                          className="p-4 rounded-2xl hover:bg-gray-50 transition-all group/item border border-transparent hover:border-gray-100 cursor-pointer active:scale-[0.98]"
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              n.type === 'SOS' ? "bg-rose-50 text-rose-600" :
                                n.type === 'JOURNEY' ? "bg-amber-50 text-amber-600" :
                                  n.type === 'FIR' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                            )}>
                              {n.type === 'SOS' ? <ShieldAlert size={14} /> : n.type === 'JOURNEY' ? <Car size={14} /> : n.type === 'FIR' ? <Gavel size={14} /> : <Users size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn("text-[9px] font-black uppercase tracking-wider",
                                  n.type === 'SOS' ? "text-rose-600" :
                                    n.type === 'JOURNEY' ? "text-amber-600" :
                                      n.type === 'FIR' ? "text-emerald-600" : "text-blue-600"
                                )}>{n.title}</span>
                                <span className="text-[7px] font-bold text-gray-400">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-[10px] font-bold text-gray-600 leading-relaxed truncate">{n.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setNotifications([])}
                  className="w-full py-4 bg-black/20 text-[8px] font-black uppercase tracking-[2px] text-gray-500 hover:text-rose-400 transition-colors border-t border-white/5"
                >
                  Purge Intelligence Log
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* 🛰️ TACTICAL CONTROL CLUSTER */}
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[20px] border border-white/5">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={cn(
              "px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              showHeatmap ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Activity size={12} />
            Neural Load
          </button>
          <button
            onClick={() => {
              if (!isSovereignActive) {
                setModalConfig({
                  isOpen: true,
                  type: 'danger',
                  title: 'Sovereign Override',
                  description: 'Initiating National Tactical Lockout. This protocol overrides all regional dispatch systems. Confirm authorization?',
                  confirmText: 'Execute Lockout',
                  onConfirm: () => {
                    setIsSovereignActive(true);
                    setModalConfig({ isOpen: false });
                    toast.error("NATIONAL GRID LOCKOUT ACTIVE", {
                      description: "Protocol 00-X initiated. Regional nodes bypassed.",
                      duration: 5000
                    });
                  }
                });
              } else {
                setIsSovereignActive(false);
                toast.success("Sovereign Control Restored", {
                  description: "National grid back to standard ops."
                });
              }
            }}
            className={cn(
              "px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              isSovereignActive ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <ShieldAlert size={12} />
            Override
          </button>
        </div>

        <div className="h-8 w-[1px] bg-gray-100 mx-2" />
      </div>
    </header>
  );
};
