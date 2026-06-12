import { useState, useEffect } from 'react';

interface Notification {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  data?: any;
}

interface UseSuperCellNotificationsParams {
  activeAlerts: any[];
  activeJourneys: any[];
  activeFirs: any[];
  pendingProtectors: any[];
}

export function useSuperCellNotifications(params: UseSuperCellNotificationsParams) {
  const { activeAlerts, activeJourneys, activeFirs, pendingProtectors } = params;

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('kavach_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('kavach_notified_ids');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const playBeep = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.3;
      audio.play();
    } catch (e) { console.error('Audio fail', e); }
  };

  const addNotification = (type: string, title: string, description: string, data?: any) => {
    const newNotif: Notification = { id: Date.now(), type, title, description, timestamp: new Date(), data };
    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 50);
      localStorage.setItem('kavach_notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => prev + 1);
    playBeep();
    if (type === 'SOS') setIsLedgerOpen(true);
  };

  useEffect(() => {
    let hasChanges = false;
    const newIds = new Set(notifiedIds);

    activeAlerts.forEach(alert => {
      if (!newIds.has(alert.id)) {
        addNotification('SOS', 'CRITICAL SOS ALERT', `Victim at ${alert.address || 'Unknown Location'} needs immediate dispatch.`, alert);
        newIds.add(alert.id);
        hasChanges = true;
      }
    });

    activeJourneys.filter((j: any) => j.status === 'emergency').forEach((journey: any) => {
      if (!newIds.has(journey.id)) {
        addNotification('JOURNEY', 'TRANSIT EMERGENCY', `Safe Journey intercept protocol triggered for user ${journey.userId}.`, journey);
        newIds.add(journey.id);
        hasChanges = true;
      }
    });

    activeFirs.forEach((fir: any) => {
      if (!newIds.has(fir.id)) {
        addNotification('FIR', 'LEGAL FILING', `New FIR filed: Case ID ${fir.caseId || fir.id.slice(0, 8).toUpperCase()}.`, fir);
        newIds.add(fir.id);
        hasChanges = true;
      }
    });

    pendingProtectors.forEach((prot: any) => {
      if (!newIds.has(prot.id)) {
        addNotification('VETTING', 'PROTECTOR PENDING', `${prot.name || 'Operative'} is awaiting credentials verification.`, prot);
        newIds.add(prot.id);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setNotifiedIds(newIds);
      localStorage.setItem('kavach_notified_ids', JSON.stringify(Array.from(newIds)));
    }
  }, [activeAlerts, activeJourneys, activeFirs, pendingProtectors]);

  return {
    notifications,
    setNotifications,
    isLedgerOpen,
    setIsLedgerOpen,
    unreadCount,
    setUnreadCount
  };
}
