import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Users,
  User,
  Map as MapIcon,
  Bell,
  Activity,
  Settings,
  Clock,
  MapPin,
  Phone,
  ShieldAlert,
  Zap,
  Cpu,
  FileText,
  AlertTriangle,
  Gavel,
  ShieldCheck,
  CheckCircle2,
  Car,
  MessageSquare,
  History,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  MessageCircle,
  Box,
  ChevronDown,
  LogOut,
  Navigation,
  Globe,
  Database,
  Layers,
  ClipboardList
} from 'lucide-react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  where
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { IncidentRecord, UserProfile, ZeroFIRRecord, JourneyRecord } from '../../domain/types';

// High-Fidelity Tactical Modules
import KavachMap from '../maps/KavachMap';
import { SuperCellSidebar } from './SuperCellSidebar';
import { SuperCellHeader } from './SuperCellHeader';
import { TransitIntelligence } from './TransitIntelligence';
import { KavachDirectory } from './KavachDirectory';
import { TacticalComms } from './TacticalComms';
import { WomenSafetyOPS } from './WomenSafetyOPS';
import { JusticeBlockModal } from './JusticeBlockModal';
import { NationalOverview } from './NationalOverview';
import { StateNexusCommand } from './StateNexusCommand';
import { TransitTrack } from './TransitTrack';
import { ProtectorTrack } from './ProtectorTrack';
import { ProtectorManagement } from './ProtectorManagement';
import { SOSManagement } from './SOSManagement';
import { NodesControl } from './NodesControl';
import { JusticeLedger } from './JusticeLedger';
import { NationalEmergencyTicker } from './NationalEmergencyTicker';
import { NeuralAnalytics } from './NeuralAnalytics';
import { BanAppeals } from './BanAppeals';
import { SuperCellRouter } from './SuperCellRouter';
import { ProtectorReportsLedger } from './ProtectorReportsLedger';
import { ShiftLogs } from './ShiftLogs';
import { VettingDesk } from './VettingDesk';

const INDIAN_STATES_AND_UTS = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

const getStateVariations = (stateName: string): string[] => {
  const name = stateName.toLowerCase().trim();
  const variations = [name];

  if (name === 'uttar pradesh') variations.push('up', 'u.p.', 'uttarpradesh');
  else if (name === 'maharashtra') variations.push('mh', 'm.h.');
  else if (name === 'delhi') variations.push('dl', 'd.l.');
  else if (name === 'karnataka') variations.push('ka', 'k.a.');
  else if (name === 'rajasthan') variations.push('rj', 'r.j.');
  else if (name === 'west bengal') variations.push('wb', 'w.b.');
  else if (name === 'madhya pradesh') variations.push('mp', 'm.p.');
  else if (name === 'andhra pradesh') variations.push('ap', 'a.p.');
  else if (name === 'jammu and kashmir') variations.push('jk', 'j&k', 'j & k', 'jammu & kashmir');
  else if (name === 'punjab') variations.push('pb', 'p.b.');
  else if (name === 'haryana') variations.push('hr', 'h.r.');
  else if (name === 'gujarat') variations.push('gj', 'g.j.');
  else if (name === 'bihar') variations.push('br', 'b.r.');
  else if (name === 'tamil nadu') variations.push('tn', 't.n.');
  else if (name === 'telangana') variations.push('ts', 't.s.');

  return variations;
};

const matchesState = (selectedState: string, text: string) => {
  if (!text) return false;
  const lowerText = text.toLowerCase().trim();
  const selectedVariations = getStateVariations(selectedState);

  if (selectedVariations.includes(lowerText)) return true;

  return selectedVariations.some(variation => {
    if (variation.length <= 4) {
      const regex = new RegExp(`\\b${variation.replace('.', '\\.')}\\b`, 'i');
      return regex.test(lowerText);
    }
    return lowerText.includes(variation);
  });
};

export const SuperCellShell = ({ viewMode = 'COMMAND', onTabChange }: { viewMode?: string, onTabChange?: (m: string) => void }) => {
  const [activeAlerts, setActiveAlerts] = useState<IncidentRecord[]>([]);
  const [missionHistory, setMissionHistory] = useState<IncidentRecord[]>([]);
  const [activeJourneys, setActiveJourneys] = useState<JourneyRecord[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [verifiedProtectors, setVerifiedProtectors] = useState<UserProfile[]>([]);
  const [pendingProtectors, setPendingProtectors] = useState<UserProfile[]>([]);
  const [activeFirs, setActiveFirs] = useState<ZeroFIRRecord[]>([]);
  const [userStatusMap, setUserStatusMap] = useState<Record<string, UserProfile>>({});
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [isSovereignActive, setIsSovereignActive] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 🛰️ TACTICAL SUB-VIEW
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);

  const [selectedProtectorId, setSelectedProtectorId] = useState<string | null>(null);
  const [selectedFir, setSelectedFir] = useState<ZeroFIRRecord | null>(null);
  const [isFirModalOpen, setIsFirModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, type: string, title: string, description: string, confirmText?: string, onConfirm?: () => void}>({ isOpen: false, type: 'info', title: '', description: '', confirmText: '', onConfirm: () => { } });
  const [selectedVettingUserId, setSelectedVettingUserId] = useState<string | null>(null);

  // 🗺️ STATE SHARD FILTERING ENGINE
  const [selectedState, setSelectedState] = useState<string>(() => localStorage.getItem('kavach_selected_state') || 'ALL');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserEmail(user.email || '');
      }
    });
    return () => unsubscribe();
  }, []);

  const detectedAdminState = React.useMemo(() => {
    if (!currentUserEmail) return null;

    const email = currentUserEmail.toLowerCase().trim();

    // 1. Home Ministry Check (ONLY singh.sachin16559@gmail.com can view ALL)
    if (email === 'singh.sachin16559@gmail.com') {
      return 'ALL';
    }

    // 2. District Admin Check — FORMAT: district.state.adminsachin@kavach.gov.in
    //    e.g. rewa.mp.adminsachin@kavach.gov.in
    if (email.includes('adminsachin@')) {
      const localPart = email.split('@')[0]; // e.g. 'rewa.mp.adminsachin'
      const parts = localPart.replace('.adminsachin', '').split('.');
      if (parts.length >= 2) {
        // parts[0]=district, parts[1]=state abbreviation
        // Resolve state abbreviation to full name
        const stateAbbr = parts[1];
        const STATE_ABBR_MAP: Record<string, string> = {
          'mp': 'Madhya Pradesh', 'up': 'Uttar Pradesh', 'dl': 'Delhi',
          'mh': 'Maharashtra', 'rj': 'Rajasthan', 'hr': 'Haryana',
          'pb': 'Punjab', 'gj': 'Gujarat', 'tn': 'Tamil Nadu',
          'ka': 'Karnataka', 'ap': 'Andhra Pradesh', 'ts': 'Telangana',
          'wb': 'West Bengal', 'br': 'Bihar', 'jh': 'Jharkhand',
          'uk': 'Uttarakhand', 'hp': 'Himachal Pradesh', 'jk': 'Jammu & Kashmir',
          'la': 'Ladakh', 'ga': 'Goa', 'as': 'Assam', 'mn': 'Manipur',
          'ml': 'Meghalaya', 'mz': 'Mizoram', 'nl': 'Nagaland', 'sk': 'Sikkim',
          'tr': 'Tripura', 'ar': 'Arunachal Pradesh', 'ct': 'Chhattisgarh',
          'or': 'Odisha', 'kl': 'Kerala', 'ch': 'Chandigarh'
        };
        const resolvedState = STATE_ABBR_MAP[stateAbbr] || stateAbbr.toUpperCase();
        // Store district for filterByState to use
        sessionStorage.setItem('kavach_admin_district', parts[0]);
        sessionStorage.setItem('kavach_admin_state', resolvedState);
        return resolvedState;
      }
      // State-only admin: state.adminsachin@kavach.gov.in
      const statePart = localPart.replace('.adminsachin', '');
      for (const state of INDIAN_STATES_AND_UTS) {
        const variations = getStateVariations(state);
        if (variations.some(v => statePart === v.replace(/\s+/g, '') || statePart === v.replace(/\s+/g, '_'))) {
          sessionStorage.removeItem('kavach_admin_district');
          sessionStorage.setItem('kavach_admin_state', state);
          return state;
        }
      }
    }

    return null;
  }, [currentUserEmail]);

  // District filter — non-null if district admin is logged in
  const detectedAdminDistrict = React.useMemo(() => {
    return sessionStorage.getItem('kavach_admin_district') || null;
  }, [currentUserEmail]);


  useEffect(() => {
    if (detectedAdminState) {
      setSelectedState(detectedAdminState);
    } else if (currentUserEmail && currentUserEmail !== 'singh.sachin16559@gmail.com') {
      // If NOT sachin, they must never see 'ALL'. So if selectedState is 'ALL', fallback immediately.
      setSelectedState(prev => prev === 'ALL' ? 'Uttar Pradesh' : prev);
    }
  }, [detectedAdminState, currentUserEmail]);

  useEffect(() => {
    localStorage.setItem('kavach_selected_state', selectedState);
  }, [selectedState]);

  const filterByState = (itemBase: IncidentRecord | UserProfile | ZeroFIRRecord | JourneyRecord) => {
    if (!itemBase) return false;
    if (selectedState === 'ALL') return true;

    const item = itemBase as Record<string, any>;

    // 🏙️ DISTRICT FILTER — if district admin logged in, only show items from that district/city
    if (detectedAdminDistrict) {
      const district = detectedAdminDistrict.toLowerCase();
      // Check ALL possible city/address fields (sosService nests under 'location', ZeroFIR under 'incidentLocation')
      const city = (
        item.city ||
        item.location?.city ||
        item.incidentLocation?.city ||
        ''
      ).toLowerCase();
      const addr = (
        item.address ||
        item.locationName ||
        item.fullAddress ||
        item.location?.address ||
        item.incidentLocation?.display ||
        item.policeStation ||
        item.policeStationGeo?.address ||
        ''
      ).toLowerCase();
      const state = (item.state || '').toLowerCase();
      // Must match district in city OR address, AND state must match
      const districtMatch = city.includes(district) || addr.includes(district);
      const stateMatch = !state || state === 'national' || matchesState(selectedState, state);
      return districtMatch && stateMatch;
    }

    // 🛰️ FAIL-SAFE: We used to leak 'national' or 'unknown' state alerts to all dashboards,
    // but that causes regional dashboard pollution. They must now only appear in the National HQ.

    // 1. Direct State Matches
    if (item.state && matchesState(selectedState, item.state)) return true;

    // 2. Substring Matches inside address/location fields
    if (item.address && matchesState(selectedState, item.address)) return true;
    if (item.locationName && matchesState(selectedState, item.locationName)) return true;
    if (item.incidentAddress && matchesState(selectedState, item.incidentAddress)) return true;
    if (item.city && matchesState(selectedState, item.city)) return true;
    if (item.fullAddress && matchesState(selectedState, item.fullAddress)) return true;

    // 3. Resolve user profile for alerts / FIRs / journeys
    const uUid = String(item.victimUid || item.userId || item.uid);
    if (uUid && uUid !== "undefined" && userStatusMap[uUid]) {
      const profile = userStatusMap[uUid];
      if (profile.state && matchesState(selectedState, profile.state)) return true;
      if (profile.address && matchesState(selectedState, profile.address)) return true;
      if (profile.city && matchesState(selectedState, profile.city)) return true;
      if (profile.fullAddress && matchesState(selectedState, profile.fullAddress)) return true;
    }

    return false;
  };

  const filteredUserStatusMap = React.useMemo(() => {
    const filtered: Record<string, UserProfile> = {};

    // 1. Find all user IDs who have matched alerts/FIRs in selectedState
    const userIdsWithAlertsInSelectedState = new Set<string>();
    activeAlerts.forEach(alert => {
      if (filterByState(alert)) {
        const rec = alert as Record<string, any>;
        const uUid = String(rec.victimUid || rec.userId || rec.uid);
        if (uUid && uUid !== "undefined") userIdsWithAlertsInSelectedState.add(uUid);
      }
    });
    missionHistory.forEach(mission => {
      if (filterByState(mission)) {
        const rec = mission as Record<string, any>;
        const uUid = String(rec.victimUid || rec.userId || rec.uid);
        if (uUid && uUid !== "undefined") userIdsWithAlertsInSelectedState.add(uUid);
      }
    });
    activeFirs.forEach(fir => {
      if (filterByState(fir)) {
        const rec = fir as Record<string, any>;
        const uUid = String(rec.victimUid || rec.userId || rec.uid);
        if (uUid && uUid !== "undefined") userIdsWithAlertsInSelectedState.add(uUid);
      }
    });

    // 2. Include existing users if they match directly or via alerts
    Object.entries(userStatusMap).forEach(([uid, user]) => {
      if (selectedState === 'ALL') {
        filtered[uid] = user;
      } else if (filterByState(user) || userIdsWithAlertsInSelectedState.has(uid) || userIdsWithAlertsInSelectedState.has(user.id)) {
        filtered[uid] = user;
      }
    });

    // 3. Inject high-fidelity fallback profiles for active/resolved alerts or FIRs if they don't exist in userStatusMap
    if (selectedState !== 'ALL') {
      const injectFromList = (list: (IncidentRecord | ZeroFIRRecord)[], role: string) => {
        list.forEach(itemBase => {
          if (!filterByState(itemBase)) return;
          const item = itemBase as Record<string, any>;
          const uid = String(item.victimUid || item.userId || item.uid);
          if (uid && uid !== "undefined" && !filtered[uid] && !userStatusMap[uid]) {
            filtered[uid] = {
              id: uid,
              name: item.victimName || item.userName || 'Anonymous citizen',
              role: role,
              gender: item.gender || 'FEMALE',
              phoneNumber: item.phoneNumber || item.phone || 'DATA_NOT_SYNCED',
              email: item.email || 'N/A',
              aadhaar: item.aadhaar || item.aadhar || 'DATA_NOT_SYNCED',
              state: selectedState,
              city: item.city || item.address || 'Sector Unknown',
              address: item.address || item.city || 'Sector Unknown',
              isVerified: true
            };
          }
        });
      };

      injectFromList(activeAlerts, 'citizen');
      injectFromList(missionHistory, 'citizen');
      injectFromList(activeFirs, 'citizen');
    }

    return filtered;
  }, [userStatusMap, selectedState, activeAlerts, missionHistory, activeFirs]);

  const filteredActiveAlerts = activeAlerts.filter(filterByState);
  const filteredMissionHistory = missionHistory.filter(filterByState);
  const filteredVerifiedProtectors = verifiedProtectors.filter(filterByState);
  const filteredPendingProtectors = pendingProtectors.filter(filterByState);
  const filteredActiveFirs = activeFirs.filter(filterByState);
  const filteredActiveJourneys = activeJourneys.filter(filterByState);

  // 🛰️ STRATEGIC INTELLIGENCE LEDGER (Notifications)
  const [notifications, setNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem('kavach_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const playBeep = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      audio.volume = 0.3;
      audio.play();
    } catch (e) { console.error('Audio fail', e); }
  };

  const addNotification = (type: string, title: string, description: string, data?: any) => {
    const newNotif = {
      id: Date.now(),
      type,
      title,
      description,
      timestamp: new Date(),
      data
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 50);
      localStorage.setItem('kavach_notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => prev + 1);
    playBeep();

    // 🚀 AUTO-EXPAND FOR CRITICAL INTEL
    if (type === 'SOS') {
      setIsLedgerOpen(true);
    }
  };

  useEffect(() => {
    // 🛡️ RE-LINKED TO PRIMARY USER REGISTRIES (Unified Sync)
    const syncCollection = (collName: string) => {
      return onSnapshot(collection(db, collName), (snapshot) => {
        setUserStatusMap(prev => {
          const newMap = { ...prev };
          snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() } as UserProfile;
            newMap[doc.id] = data;
          });
          return newMap;
        });

        // Update lists for protectors specifically
        if (collName === 'users' || collName === 'male_users' || collName === 'women_users') {
          const vProts: UserProfile[] = [];
          const pProts: UserProfile[] = [];
          snapshot.forEach(doc => {
            const data = { id: doc.id, ...(doc.data() as UserProfile), originCollection: collName };
            if (data.role?.toLowerCase() === 'protector') {
              if (data.isVerified || data.verified) vProts.push(data);
              else pProts.push(data);
            }
          });

          setVerifiedProtectors(prev => {
            const combined = [...prev.filter(p => p.originCollection !== collName), ...vProts];
            // 🛡️ DEDUPLICATE BY ID
            const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
            return unique;
          });
          setPendingProtectors(prev => {
            const combined = [...prev.filter(p => p.originCollection !== collName), ...pProts];
            // 🛡️ DEDUPLICATE BY ID
            const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
            return unique;
          });
        }
      });
    };

    const unsubUsers = syncCollection('users');
    const unsubWomen = syncCollection('women_users');
    const unsubMales = syncCollection('male_users');

    // 🔴 RE-LINKED TO OFFICIAL 'alerts' REGISTRY
    const unsubscribeAlerts = onSnapshot(query(collection(db, 'alerts'), orderBy('timestamp', 'desc')), (snapshot) => {
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncidentRecord));
      setActiveAlerts(alerts.filter(a => a.status && ['active', 'Active', 'ACTIVE', 'responding', 'Responding'].includes(a.status)));
      setMissionHistory(alerts.filter(a => a.status && !['active', 'Active', 'ACTIVE', 'responding', 'Responding'].includes(a.status)));
    });

    // 🏛️ JUSTICE LEDGER SYNC (Unified to zero_firs)
    const unsubscribeFirs = onSnapshot(query(collection(db, 'zero_firs'), orderBy('timestamp', 'desc')), (snapshot) => {
      setActiveFirs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ZeroFIRRecord)));
    });

    const unsubJourneys = onSnapshot(query(collection(db, 'journeys'), where('status', 'in', ['active', 'emergency'])), (snapshot) => {
      setActiveJourneys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JourneyRecord)));
    });

    return () => { unsubUsers(); unsubWomen(); unsubMales(); unsubscribeAlerts(); unsubscribeFirs(); unsubJourneys(); };
  }, []);

  // 🛰️ NOTIFICATION OBSERVERS
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('kavach_notified_ids');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    let hasChanges = false;
    const newIds = new Set(notifiedIds);

    // SOS Alerts
    activeAlerts.forEach(alert => {
      if (!newIds.has(alert.id)) {
        addNotification('SOS', 'CRITICAL SOS ALERT', `Victim at ${alert.address || 'Unknown Location'} needs immediate dispatch.`, alert);
        newIds.add(alert.id);
        hasChanges = true;
      }
    });

    // Safe Journey Alerts (Emergency)
    activeJourneys.filter(j => j.status === 'emergency').forEach(journey => {
      if (!newIds.has(journey.id)) {
        addNotification('JOURNEY', 'TRANSIT EMERGENCY', `Safe Journey intercept protocol triggered for user ${journey.userId}.`, journey);
        newIds.add(journey.id);
        hasChanges = true;
      }
    });

    // FIR Notifications
    activeFirs.forEach(fir => {
      if (!newIds.has(fir.id)) {
        addNotification('FIR', 'LEGAL FILING', `New FIR filed: Case ID ${fir.caseId || fir.id.slice(0, 8).toUpperCase()}.`, fir);
        newIds.add(fir.id);
        hasChanges = true;
      }
    });

    // Protector Vetting
    pendingProtectors.forEach(prot => {
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

  // 🛰️ STRATEGIC SHARD MAPPING (State -> Sector Bridge)
  const sectorMap: Record<string, string> = {
    'MP': 'CENTRAL', 'MADHYA PRADESH': 'CENTRAL', 'CHHATTISGARH': 'CENTRAL',
    'DELHI': 'NORTH', 'NCR': 'NORTH', 'UP': 'NORTH', 'UTTAR PRADESH': 'NORTH', 'RAJASTHAN': 'NORTH', 'PUNJAB': 'NORTH', 'HARYANA': 'NORTH',
    'KARNATAKA': 'SOUTH', 'TAMIL NADU': 'SOUTH', 'TN': 'SOUTH', 'KERALA': 'SOUTH', 'AP': 'SOUTH', 'TELANGANA': 'SOUTH',
    'MAHARASHTRA': 'WEST', 'GUJARAT': 'WEST', 'GOA': 'WEST',
    'WB': 'EAST', 'WEST BENGAL': 'EAST', 'BIHAR': 'EAST', 'ODISHA': 'EAST'
  };

  const handleApproveProtector = async (userId: string) => {
    try {
      const protector = [...pendingProtectors, ...verifiedProtectors].find(p => p.id === userId);
      const coll = protector?.originCollection || 'users';

      await updateDoc(doc(db, coll, userId), {
        isVerified: true,
        verified: true,
        verificationDate: new Date()
      });
      toast.success('Protector Verified Successfully');
    } catch (error) {
      console.error('Approval Error:', error);
      toast.error('Failed to verify protector');
    }
  };

  const NavItem = ({ id, label, icon: Icon }: any) => {
    const isActive = viewMode === id;
    return (
      <button
        onClick={() => onTabChange?.(id)}
        className={cn(
          "w-full flex flex-col items-center py-3.5 px-1 transition-all duration-200 relative group cursor-pointer",
          isActive
            ? "bg-blue-50 text-blue-600 border-l-2 border-blue-600"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
        )}
      >
        <Icon size={18} className={cn("mb-1.5 transition-transform", isActive ? "scale-110 text-blue-600" : "text-slate-400 group-hover:text-slate-700")} />
        <span className={cn(
          "text-[6px] font-black uppercase tracking-[0.5px] text-center leading-none transition-colors",
          isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700"
        )}>{label}</span>
        {isActive && <motion.div layoutId="navIndicator" className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-600" />}
      </button>
    );
  };

  const renderContent = () => {

    switch (viewMode) {
      case 'COMMAND':
        return (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === 'DASHBOARD' && (
              <NationalOverview
                activeAlerts={filteredActiveAlerts} // Show filtered shard
                verifiedProtectors={filteredVerifiedProtectors} // Show filtered shard
                pendingProtectors={filteredPendingProtectors} // Show filtered shard
                zeroFirs={filteredActiveFirs}
                selectedState={selectedState}
                isSovereignActive={isSovereignActive}
                onNavigate={(tab, alertId) => {
                  if (tab === 'VERIFICATION') {
                    if (alertId) setSelectedVettingUserId(alertId);
                  } else {
                    if (alertId) setSelectedAlertId(alertId);
                  }
                  const viewMap: Record<string, string> = {
                    'ALERTS': 'SOS',
                    'SAFETY': 'SOS',
                    'REPORTS': 'DATA',
                    'FIR': 'FIR',
                    'PROTECTORS': 'PROTECTORS'
                  };
                  const targetTab = viewMap[tab] || tab;
                  if (targetTab === 'PROTECTORS' && alertId) setSelectedProtectorId(alertId);

                  // 🚀 GLOBAL REDIRECTION
                  onTabChange?.(targetTab);
                }}
                onApproveProtector={handleApproveProtector}
                onDispatchSpecial={async (alertId, protectorIds) => {
                  try {
                    const alertRef = doc(db, 'alerts', alertId);
                    await updateDoc(alertRef, {
                      status: 'responding',
                      dispatchedAt: new Date(),
                      activeResponders: protectorIds.map(pid => ({
                        id: pid,
                        status: 'dispatched',
                        timestamp: new Date()
                      }))
                    });
                    toast.success(`Special Force Dispatched to ${protectorIds.length} Nodes`);
                  } catch (error) {
                    console.error('Dispatch Error:', error);
                    toast.error('Tactical Dispatch Failed');
                  }
                }}
              />
            )}
          </div>
        );
      case 'VERIFICATION':
        return (
          <VettingDesk 
            userStatusMap={userStatusMap} 
            selectedState={selectedState} 
            detectedAdminDistrict={detectedAdminDistrict}
            initialSelectedUserId={selectedVettingUserId}
            onSelectUser={(uid) => setSelectedVettingUserId(uid)}
          />
        );
      case 'SOS':
        return (
          <SOSManagement
            externalSelectedId={selectedAlertId}
            verifiedProtectors={filteredVerifiedProtectors}
            activeAlerts={filteredActiveAlerts}
            historicalAlerts={filteredMissionHistory}
            userStatusMap={filteredUserStatusMap}
            onViewReplay={(alertId) => {
              setActiveMissionId(alertId);
              onTabChange?.('TRACK');
            }}
          />
        );
      case 'FIR':
        return (
          <JusticeLedger
            zeroFirs={filteredActiveFirs}
            viewMode="JUSTICE"
            onViewFir={(fir) => {
              setSelectedFir(fir);
              setIsFirModalOpen(true);
            }}
            userStatusMap={filteredUserStatusMap}
          />
        );
      case 'PROTECTORS':
        return (
          <ProtectorManagement
            externalSelectedId={selectedProtectorId}
            onViewReplay={(id) => { setActiveMissionId(id); onTabChange?.('TRACK'); }}
            verifiedProtectors={filteredVerifiedProtectors}
            pendingProtectors={filteredPendingProtectors}
            userStatusMap={filteredUserStatusMap}
            onSelectPendingProtector={(id) => {
              setSelectedVettingUserId(id);
              onTabChange?.('VERIFICATION');
            }}
          />
        );
      case 'TRACK':
        return (
          <ProtectorTrack
            activeMissionId={activeMissionId}
            onClearMission={() => setActiveMissionId(null)}
            isSovereignActive={isSovereignActive}
            userStatusMap={filteredUserStatusMap}
            selectedState={selectedState}
            detectedAdminDistrict={detectedAdminDistrict}
          />
        );
      case 'DATA':
        return <KavachDirectory womenUsers={Object.values(filteredUserStatusMap).filter(u => u.role?.toLowerCase() === 'citizen')} protectors={filteredVerifiedProtectors} selectedState={selectedState} isSovereignActive={isSovereignActive} />;
      case 'ANALYTICS':
        return (
          <NeuralAnalytics
            activeAlerts={filteredActiveAlerts}
            activeJourneys={filteredActiveJourneys}
            verifiedProtectors={filteredVerifiedProtectors}
            justiceLedger={filteredActiveFirs}
            selectedState={selectedState}
            detectedAdminDistrict={detectedAdminDistrict}
          />
        );
      case 'CHAT':
        return <TacticalComms />;
      case 'TRANSIT':
        return (
          <TransitTrack
            isSovereignActive={isSovereignActive}
            userStatusMap={filteredUserStatusMap}
            externalSelectedId={selectedAlertId}
            selectedState={selectedState}
            detectedAdminDistrict={detectedAdminDistrict}
          />
        );
      case 'GUIDES':
        return <WomenSafetyOPS />;
      case 'MAP':
        return (
          <div className="flex-1 bg-[#0F172A] rounded-[40px] overflow-hidden m-8">
            <KavachMap
              mode="command"
              activeAlerts={filteredActiveAlerts}
              activeProtectors={filteredVerifiedProtectors}
              activeJourneys={filteredActiveJourneys}
              // Command mode in KavachMap will route to MapplsCommandMap/CommandMap and pass these props down
              {...{activeFirs: filteredActiveFirs, pendingProtectors: [], selectedAlertId, isSovereignActive, showHeatmap, selectedState}}
              useMapboxFallback={useMapboxFallback}
              onFallback={() => setUseMapboxFallback(true)}
            />
          </div>
        );
      case 'SHIFTS':
        return <ShiftLogs selectedState={selectedState} detectedAdminDistrict={detectedAdminDistrict} />;
      case 'APPEALS':
        return <BanAppeals />;
      case 'REPORTS':
        return <ProtectorReportsLedger />;
      case 'SETTINGS':
        return (
          <StateNexusCommand
            selectedState={selectedState}
            womenUsers={Object.values(userStatusMap).filter(u => u.role?.toLowerCase() === 'citizen')}
            verifiedProtectors={filteredVerifiedProtectors}
            pendingProtectors={filteredPendingProtectors}
            activeAlerts={filteredActiveAlerts}
            zeroFirs={filteredActiveFirs}
            onAlertClick={(id) => setSelectedAlertId(id)}
            onViewFir={(fir) => {
              setSelectedAlertId(fir.id);
              // Handle FIR navigation if needed
            }}
            isSovereignActive={isSovereignActive}
            userStatusMap={userStatusMap}
          />
        );
      default:
        return <div className="flex-1 flex flex-col items-center justify-center opacity-20"><History size={80} className="mb-6" /><p className="text-sm font-black uppercase tracking-[5px]">Module Linked - Scanning...</p></div>;
    }
  };

  return (
    <div className="relative w-full h-screen flex bg-[#0F172A] font-['Outfit'] overflow-hidden max-h-screen text-white">
      <TacticalModal config={modalConfig} setModalConfig={setModalConfig} />
      <SuperCellSidebar viewMode={viewMode} onTabChange={onTabChange || (() => {})} />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperCellHeader
          selectedState={selectedState}
          detectedAdminDistrict={detectedAdminDistrict}
          notifications={notifications}
          setNotifications={setNotifications}
          isSovereignActive={isSovereignActive}
          setIsSovereignActive={setIsSovereignActive}
          showHeatmap={showHeatmap}
          setShowHeatmap={setShowHeatmap}
          unreadCount={unreadCount}
          setUnreadCount={setUnreadCount}
          setModalConfig={setModalConfig}
          onTabChange={onTabChange || (() => {})}
        />
        <NationalEmergencyTicker isActive={isSovereignActive} gridNodeCount={verifiedProtectors.length + activeAlerts.length} />
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {renderContent()}
        </main>
      </div>
      <JusticeBlockModal
        fir={selectedFir}
        isOpen={isFirModalOpen}
        onClose={() => {
          setIsFirModalOpen(false);
          setSelectedFir(null);
        }}
      />
    </div>
  );
};

const TacticalModal = ({ config, setModalConfig }: any) => {
  const [inputText, setInputText] = useState("");
  if (!config.isOpen) return null;
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 backdrop-blur-xl bg-black/40">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
        <div className={cn("h-2", config.type === 'danger' ? "bg-red-600" : config.type === 'warning' ? "bg-yellow-500" : "bg-blue-600")} />
        <div className="p-10 text-center"><h3 className="text-xl font-black text-gray-900 uppercase mb-2">{config.title}</h3><p className="text-gray-400 text-[10px] font-bold uppercase mb-8">{config.description}</p>
          {config.showInput && (<select value={inputText} onChange={(e) => setInputText(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-sm font-bold mb-8 outline-none"><option value="">Select Reason...</option>{config.selectOptions?.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}</select>)}
          <div className="flex gap-4"><button onClick={() => setModalConfig({ isOpen: false })} className="flex-1 py-4 bg-gray-100 text-gray-900 text-[10px] font-black uppercase rounded-2xl">Cancel</button><button onClick={() => config.onConfirm(inputText)} className={cn("flex-1 py-4 text-white text-[10px] font-black uppercase rounded-2xl", config.type === 'danger' ? "bg-red-600" : config.type === 'warning' ? "bg-yellow-500" : "bg-blue-600")}>{config.confirmText}</button></div>
        </div>
      </motion.div>
    </div>
  );
};
