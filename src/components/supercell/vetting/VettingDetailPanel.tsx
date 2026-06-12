import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { VettingPhotoZoomModal } from './subcomponents/VettingPhotoZoomModal';
import { VettingIdentityBanner } from './subcomponents/VettingIdentityBanner';
import { VettingDataGrid } from './subcomponents/VettingDataGrid';
import { VettingActionDesk } from './subcomponents/VettingActionDesk';

interface Props {
  selectedUser: any;
  activeSubTab: 'pending' | 'approved' | 'rejected';
  rejectionReason: string;
  setRejectionReason: (r: string) => void;
  isActionLoading: boolean;
  onApprove: (userId: string, gender: string) => void;
  onReject: (userId: string, gender: string) => void;
}

export default function VettingDetailPanel({
  selectedUser, activeSubTab, rejectionReason,
  setRejectionReason, isActionLoading, onApprove, onReject
}: Props) {
  const [zoomPhoto, setZoomPhoto] = useState(false);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center opacity-30 p-12 text-center space-y-4">
        <ShieldAlert size={64} className="text-slate-500 animate-pulse" />
        <div className="space-y-1.5">
          <p className="text-sm font-black uppercase tracking-[5px] text-slate-400">Select an Identity File</p>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
            Click on any profile card on the left panel to review full demographic and biometric details.
          </p>
        </div>
      </div>
    );
  }

  const u = selectedUser;

  return (
    <div className="flex-1 bg-[#090d18] overflow-y-auto flex flex-col">
      <VettingPhotoZoomModal isOpen={zoomPhoto} onClose={() => setZoomPhoto(false)} user={u} />

      <div className="p-8 space-y-8 flex-1 flex flex-col justify-between max-w-4xl">
        <div className="space-y-8">
          <VettingIdentityBanner user={u} onZoom={() => setZoomPhoto(true)} />
          <VettingDataGrid user={u} />
        </div>

        <VettingActionDesk
          user={u}
          activeSubTab={activeSubTab}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          isActionLoading={isActionLoading}
          onApprove={onApprove}
          onReject={onReject}
        />
      </div>
    </div>
  );
}
