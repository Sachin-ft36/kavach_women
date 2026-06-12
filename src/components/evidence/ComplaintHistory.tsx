import React from 'react';
import { History, FileText, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function ComplaintHistory({ firs }: { firs: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <History size={18} className="text-[#2563EB]" />
          <h3 className="text-xs font-black text-[#1E293B] uppercase tracking-[3px]">Complaint History</h3>
        </div>
        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-full">
          {firs.length} {firs.length === 1 ? 'Report' : 'Reports'} Filed
        </span>
      </div>

      <div className="grid gap-5">
        {firs.length > 0 ? (
          firs.map((fir) => (
            <motion.div
              key={fir.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-[#F1F5F9] rounded-[28px] p-5 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-8">
                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#2563EB] group-hover:bg-[#2563EB]/5 transition-all shrink-0">
                    <FileText size={22} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#1E293B] text-base sm:text-lg mb-0.5 truncate">{fir.offenseType}</h4>
                    <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-widest">Case ID: {fir.firId}</p>
                  </div>
                </div>
                
                <div className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border self-start sm:self-center shadow-sm",
                  fir.status === 'RESOLVED' ? "bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]" :
                  fir.status === 'ACTION_TAKEN' ? "bg-[#FFF7ED] text-[#9A3412] border-[#FFEDD5]" :
                  "bg-[#EFF6FF] text-[#1E40AF] border-[#DBEAFE]"
                )}>
                  {fir.status === 'RESOLVED' ? 'Resolved' : fir.status === 'ACTION_TAKEN' ? 'Under Review' : 'Submitted'}
                </div>
              </div>

              <div className="mt-5 p-4 sm:p-5 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9]">
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed italic line-clamp-2">
                  "{fir.victimStatement || fir.statement}"
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-50 text-[#64748B]">
                <div className="flex items-center gap-2">
                  <Clock size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {fir.timestamp?.toDate ? fir.timestamp.toDate().toLocaleString() : 'Just Now'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#166534] bg-[#F0FDF4] px-3 py-1 rounded-lg">
                  <CheckCircle size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Submitted</span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white border-2 border-dashed border-[#F1F5F9] rounded-[32px] p-12 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <FileText size={32} />
            </div>
            <div>
              <h4 className="font-bold text-[#1E293B] uppercase tracking-widest text-xs">No records found</h4>
              <p className="text-[11px] text-[#64748B] mt-1">Start a complaint to register your first report.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
