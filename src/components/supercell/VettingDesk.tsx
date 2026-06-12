import React from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import { useVettingLogic } from '../../hooks/useVettingLogic';
import VettingUserCard from './vetting/VettingUserCard';
import VettingDetailPanel from './vetting/VettingDetailPanel';

// ─────────────────────────────────────────────
//  VettingDesk — Identity Vetting Desk (SuperCell)
//  Orchestrator — 784 lines → ~110 lines
// ─────────────────────────────────────────────

interface VettingDeskProps {
  userStatusMap: Record<string, any>;
  selectedState: string;
  detectedAdminDistrict?: string | null;
  initialSelectedUserId?: string | null;
  onSelectUser?: (userId: string | null) => void;
}

export const VettingDesk: React.FC<VettingDeskProps> = ({
  userStatusMap, selectedState, detectedAdminDistrict, initialSelectedUserId, onSelectUser
}) => {
  const {
    searchTerm, setSearchTerm,
    filterRole, setFilterRole,
    activeSubTab, setActiveSubTab,
    selectedUserId, setSelectedUserId,
    rejectionReason, setRejectionReason,
    isActionLoading,
    filteredUsers, selectedUser,
    pendingCount, approvedCount, rejectedCount,
    handleApprove, handleReject
  } = useVettingLogic({ userStatusMap, selectedState, detectedAdminDistrict, initialSelectedUserId, onSelectUser });

  const subTabs = [
    { key: 'pending', label: `Pending (${pendingCount})`, color: 'bg-blue-600 shadow-blue-500/10' },
    { key: 'approved', label: `Approved (${approvedCount})`, color: 'bg-emerald-600 shadow-emerald-500/10' },
    { key: 'rejected', label: `Rejected (${rejectedCount})`, color: 'bg-rose-600 shadow-rose-500/10' },
  ] as const;

  const statCards = [
    { count: pendingCount, label: 'Awaiting Vetting', sub: 'PENDING', bg: 'bg-[#121c38] border-blue-500/20', numColor: 'text-blue-400', subColor: 'text-blue-400' },
    { count: approvedCount, label: 'Approved Grid Members', sub: 'ACTIVE', bg: 'bg-[#0b211a] border-emerald-500/20', numColor: 'text-emerald-400', subColor: 'text-emerald-400' },
    { count: rejectedCount, label: 'Rejected Proposals', sub: 'REJECTED', bg: 'bg-[#260e15] border-rose-500/20', numColor: 'text-rose-400', subColor: 'text-rose-400' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] text-slate-100 overflow-hidden font-['Outfit']">

      {/* ── Header ── */}
      <div className="border-b border-slate-800 bg-[#0d1324] px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="text-blue-500 w-6 h-6 animate-pulse" />
            Identity Vetting Desk
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Reviewing sector registrations for:{' '}
            <span className="text-blue-400">{selectedState}{detectedAdminDistrict ? ` — ${detectedAdminDistrict.toUpperCase()}` : ''}</span>
          </p>
        </div>

        <div className="flex gap-4">
          {statCards.map(({ count, label, sub, bg, numColor, subColor }) => (
            <div key={sub} className={`${bg} border rounded-2xl px-5 py-2.5 flex items-center gap-3`}>
              <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center font-black ${numColor}`}>{count}</div>
              <div>
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">{label}</p>
                <p className={`text-xs font-black font-mono ${subColor}`}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-[#0d1324] px-8 py-4 border-b border-slate-800 flex gap-4 items-center justify-between flex-wrap">
        <div className="flex bg-[#070b12] rounded-2xl p-1 border border-slate-800 shrink-0">
          {subTabs.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => { setActiveSubTab(key); setSelectedUserId(null); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === key ? `${color} text-white shadow-lg` : 'text-slate-400 hover:text-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 items-center flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text" placeholder="Search by name, email, phone..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#070b12] border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <select
            value={filterRole} onChange={e => setFilterRole(e.target.value as any)}
            className="bg-[#070b12] border border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">ALL ROLES</option>
            <option value="citizen">CITIZENS</option>
            <option value="protector">PROTECTORS</option>
            <option value="pcr_officer">PCR OFFICERS</option>
          </select>
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: User List */}
        <div className="w-[380px] border-r border-slate-800 overflow-y-auto bg-[#080c16] shrink-0">
          <div className="p-4 space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-4 opacity-50">
                <ShieldCheck size={48} className="mx-auto text-slate-600 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">No users found in this sector</p>
              </div>
            ) : filteredUsers.map((u: any) => (
              <VettingUserCard
                key={u.id}
                user={u}
                isSelected={selectedUserId === u.id}
                onSelect={() => { setSelectedUserId(u.id); }}
              />
            ))}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <VettingDetailPanel
          selectedUser={selectedUser}
          activeSubTab={activeSubTab}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          isActionLoading={isActionLoading}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    </div>
  );
};
