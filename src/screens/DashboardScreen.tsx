import React from 'react';
import {
  CloudSun, ChevronRight, Users, User, MapPin, Shield, Star, Target,
  BadgeCheck, ShieldCheck, Info, Home, Plane, Briefcase, GraduationCap,
  Plus, Clock, Phone, EyeOff, Car, Lock, PhoneCall, Activity, CheckCircle2, HelpCircle, ArrowUpRight,
  AlertTriangle, Check,
  Mic, Bell, Home as HomeIcon, Zap, Radio, Power, Smartphone, UserCheck, Heart, UserPlus, Flame, Trophy,
  UserCircle2, BellRing, HeartPulse, X, PlayCircle, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useKavachStore } from '../state/useKavachStore';
import { Capacitor } from '@capacitor/core';
import { KavachSafe } from '../services/KavachNative';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import SOSButton from '../components/SOSButton';
import RideSafeOverlay from '../components/RideSafeOverlay';
import FakeCallModal from '../components/FakeCallModal';
import SafeTimerModal from '../components/SafeTimerModal';
import NearbyHubModal from '../components/NearbyHubModal';
import MedicalHubModal from '../components/MedicalHubModal';
import ShadowProtectMode from '../components/ShadowProtectMode';
import KavachAIChat from '../components/KavachAIChat';
import SafeHavenMap from '../components/maps/SafeHavenMap';
import WarningOverlay from '../components/WarningOverlay';
import BannedOverlay from '../components/BannedOverlay';
import ProtectorRatingModal from '../components/ProtectorRatingModal';
import LocationSelectorModal from '../components/LocationSelectorModal';
import FamilyCircleDetail from '../components/FamilyCircleDetail';
import InteractiveFamilyCircle from '../components/guardian/InteractiveFamilyCircle';
import QuickPairQr from '../components/guardian/QuickPairQr';
import FamilyProtectionOverview from '../components/guardian/FamilyProtectionOverview';
import AddMemberBottomSheet from '../components/guardian/AddMemberBottomSheet';
import YourFamilyList from '../components/guardian/YourFamilyList';
import GuardianRequestsPage from '../components/guardian/GuardianRequestsPage';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit, where, getDocs } from 'firebase/firestore';
import { useDashboardLogic } from './hooks/useDashboardLogic';

const SHIELD_BASE64_IMAGE = "data:image/jpeg;base64,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";

import { useProtection } from '../hooks/useProtection';
import { useKavachTheme } from '../providers/ThemeProvider';
import { useTimeTheme } from '../hooks/useTimeTheme';

import { InsightCard } from '../features/dashboard/components/InsightCard';
import { DashboardHero } from '../features/dashboard/components/DashboardHero';
import { QuickActions } from '../features/dashboard/components/QuickActions';
import { SafetyStreakCard } from '../features/dashboard/components/SafetyStreakCard';
import { LiveSafetyFeed } from '../features/dashboard/components/LiveSafetyFeed';
import { TodaysInsights } from '../features/dashboard/components/TodaysInsights';
import { CommunityNearYou } from '../features/dashboard/components/CommunityNearYou';
import { MoodCheckInCard } from '../features/dashboard/components/MoodCheckInCard';
import { CalmSpaceCard } from '../features/dashboard/components/CalmSpaceCard';
import { SafetyStoriesCard } from '../features/dashboard/components/SafetyStoriesCard';
import { LiveActivityCard } from '../features/dashboard/components/LiveActivityCard';
import { TodayStreakCard } from '../features/dashboard/components/TodayStreakCard';
import { InviteCard } from '../features/dashboard/components/InviteCard';

export default function DashboardScreen() {
  const { themeTokens } = useKavachTheme();
  const { protectionState, riskState, protectionIndex, triggerSOS, cancelSOS } = useProtection();

  const {
    batteryLevel, gender, userPos, syncLocation,
    setFakeCallActive, isBatteryExempt, setBatteryExempt,
    isSOSActive, isRideModeActive, rideData, updateRideData,
    setBriefingActive, verifiedProtectorCount, setOverlayActive,
    setActiveTab, setIsFirFlowActive, isVoiceTriggerActive, setVoiceTriggerActive,
    pendingNavigationTarget, setPendingNavigationTarget,
    isVaultOpen, setIsVaultOpen,
    isAIChatOpen, setIsAIChatOpen,
    isShadowOpen, setIsShadowOpen,
    isFakeCallHubOpen, setIsFakeCallHubOpen,
    isSafeTimerOpen, setIsSafeTimerOpen,
    isNearbyHubOpen, setIsNearbyHubOpen,
    isMedicalHubOpen, setIsMedicalHubOpen,
    isRideSafeOpen, setIsRideSafeOpen,
    isRideActive, setIsRideActive,
    isSafeHavenMapOpen, setIsSafeHavenMapOpen,
    vehicleNo, setVehicleNo,
    isBriefingPlaying, setIsBriefingPlaying,
    ratingAlert, setRatingAlert,
    toggleOverlay, handleVoiceBriefing
  } = useDashboardLogic();

  const { guardianCache, profile } = useKavachStore();
  const localGuardian = guardianCache?.[0] || null;

  const userName = profile?.name || profile?.displayName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'User';

  // Dynamic Weather state based on user location coords (initialized from localStorage cache for instant rendering)
  const [weatherTemp, setWeatherTemp] = React.useState<number | null>(() => {
    const cached = localStorage.getItem('kavach_cached_temp');
    return cached ? parseInt(cached, 10) : null;
  });
  const [weatherCode, setWeatherCode] = React.useState<number | null>(() => {
    const cached = localStorage.getItem('kavach_cached_weathercode');
    return cached ? parseInt(cached, 10) : null;
  });
  const [cityName, setCityName] = React.useState<string>(() => {
    return localStorage.getItem('kavach_cached_city') || 'Indore';
  });
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = React.useState(false);
  const [isFamilyCircleDetailOpen, setIsFamilyCircleDetailOpen] = React.useState(false);
  const [isPairingQrOpen, setIsPairingQrOpen] = React.useState(false);
  const [isAddMemberSheetOpen, setIsAddMemberSheetOpen] = React.useState(false);
  const [isGuardianRequestsOpen, setIsGuardianRequestsOpen] = React.useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = React.useState(0);
  const [pairingMode, setPairingMode] = React.useState<'generate' | 'scan'>('generate');
  const [isActive, setIsActive] = React.useState(true);
  const [isAllToolsOpen, setIsAllToolsOpen] = React.useState(false);
  const isGuardianOfSomeone = (profile as any)?.isGuardian || localStorage.getItem('kavach_is_guardian') === 'true';
  const [safetyMode, setSafetyMode] = React.useState<'personal' | 'family'>('personal');

  const [updates, setUpdates] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!auth.currentUser?.uid) return;
    const q = query(
      collection(db, 'pairing_requests'),
      where('receiverId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingRequestsCount(snapshot.size);
    }, (err) => {
      console.warn("Requests count fetch failed:", err);
    });
    return () => unsub();
  }, [auth.currentUser?.uid]);

  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  React.useEffect(() => {
    if (!auth.currentUser) return;
    const currentUid = auth.currentUser.uid;

    const fetchCircleCheckins = async () => {
      let targetUids = [currentUid];

      try {
        const guardianPhones = (guardianCache || []).map((g: any) => g.phone).filter(Boolean);
        if (guardianPhones.length > 0) {
          const usersQ = query(
            collection(db, 'users'),
            where('phoneNumber', 'in', guardianPhones)
          );
          const usersSnap = await getDocs(usersQ);
          usersSnap.forEach((doc) => {
            if (doc.id && !targetUids.includes(doc.id)) {
              targetUids.push(doc.id);
            }
          });
        }
      } catch (err) {
        console.warn("Could not resolve circle UIDs in dashboard:", err);
      }

      const q = query(
        collection(db, 'checkins'),
        where('userId', 'in', targetUids),
        orderBy('timestamp', 'desc'),
        limit(3)
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const dbUpdates: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          dbUpdates.push({
            id: doc.id,
            author: data.author || 'Member',
            desc: data.desc || '',
            time: data.timestamp ? formatTimeAgo(data.timestamp) : (data.time || 'Just now'),
            statusDotColor: data.statusDotColor || 'bg-[#10b981]'
          });
        });
        setUpdates(dbUpdates);
      }, (err) => {
        console.warn("Dashboard updates fetch failed:", err);
      });

      return unsub;
    };

    let activeUnsub: (() => void) | null = null;
    fetchCircleCheckins().then((unsub) => {
      activeUnsub = unsub;
    });

    return () => {
      if (activeUnsub) activeUnsub();
    };
  }, [guardianCache]);

  React.useEffect(() => {
    setOverlayActive(isAllToolsOpen || isAddMemberSheetOpen || isPairingQrOpen);
    return () => {
      setOverlayActive(false);
    };
  }, [isAllToolsOpen, isAddMemberSheetOpen, isPairingQrOpen, setOverlayActive]);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  React.useEffect(() => {
    const handleOpenPairingQr = () => {
      setIsAddMemberSheetOpen(true);
    };
    window.addEventListener('open-pairing-qr', handleOpenPairingQr);
    return () => {
      window.removeEventListener('open-pairing-qr', handleOpenPairingQr);
    };
  }, []);

  const { timeOfDay, themeFolder } = useTimeTheme();

  React.useEffect(() => {
    if (!userPos?.lat || !userPos?.lng) return;

    const fetchWeatherAndCity = async () => {
      try {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${userPos.lat}&longitude=${userPos.lng}&current_weather=true`
        );
        const weatherData = await weatherRes.json();
        if (weatherData?.current_weather?.temperature !== undefined) {
          const temp = Math.round(weatherData.current_weather.temperature);
          setWeatherTemp(temp);
          localStorage.setItem('kavach_cached_temp', temp.toString());
        }
        if (weatherData?.current_weather?.weathercode !== undefined) {
          const code = weatherData.current_weather.weathercode;
          setWeatherCode(code);
          localStorage.setItem('kavach_cached_weathercode', code.toString());
        }

        const { reverseGeocode } = await import('../utils/geoUtils');
        const geoInfo = await reverseGeocode(userPos.lat, userPos.lng);
        if (geoInfo?.city) {
          const newCity = geoInfo.city;
          setCityName(prev => {
            if (prev !== newCity) {
              localStorage.setItem('kavach_cached_city', newCity);
              return newCity;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Weather/City fetch failed:', err);
      }
    };

    // Fetch immediately on coordinates available/loaded
    fetchWeatherAndCity();

    // Setup 2-hour interval (2 * 60 * 60 * 1000 = 7200000ms)
    const intervalId = setInterval(fetchWeatherAndCity, 7200000);

    return () => clearInterval(intervalId);
  }, [userPos?.lat, userPos?.lng]);

  const displayFamilyMembers = React.useMemo(() => {
    const capitalize = (s: string) => s ? s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';
    // Only show members who are registered app users and accepted
    const activeCircle = (guardianCache || []).filter((g: any) => {
      if (!g || g.isMock || g.status === 'pending' || g.isPending === true || g.accepted === false) return false;
      if (g.status === 'accepted' || g.accepted === true || g.isVerified === true || g.uid) return true;
      return false;
    });
    return activeCircle.slice(0, 4).map((guardian: any) => {
      const relation = (guardian.relation || 'Guardian').toLowerCase();
      let status = 'Active';
      let color = '#10B981';
      let textColor = 'text-emerald-400';
      let icon = Home;

      if (relation.includes('dad') || relation.includes('father')) {
        status = 'Travelling';
        color = '#F59E0B';
        textColor = 'text-amber-400';
        icon = Plane;
      } else if (relation.includes('brother') || relation.includes('son')) {
        status = 'At Work';
        color = '#3B82F6';
        textColor = 'text-blue-400';
        icon = Briefcase;
      } else if (relation.includes('sister') || relation.includes('daughter')) {
        status = 'Reached College';
        color = '#8B5CF6';
        textColor = 'text-purple-400';
        icon = GraduationCap;
      }

      const appPhotoUrl = guardian.photoUrl || guardian.photoURL || guardian.displayPhotoUrl || null;

      return {
        name: capitalize(guardian.name || 'Guardian'),
        status: capitalize(status),
        color,
        textColor,
        icon,
        img: appPhotoUrl
      };
    });
  }, [guardianCache]);

  const familyCircleList = React.useMemo(() => {
    return displayFamilyMembers || [];
  }, [displayFamilyMembers]);

  const activeLocalGuardian = React.useMemo(() => {
    if (!localGuardian) return null;
    const appPhotoUrl = (localGuardian as any)?.photoUrl || (localGuardian as any)?.photoURL || (localGuardian as any)?.displayPhotoUrl || null;
    return {
      name: localGuardian.name || 'Nearby Trusted Person',
      img: appPhotoUrl,
      relation: 'Neighbour • Same Area',
      distance: '1.8 KM Away',
      eta: '6 Min',
      isMock: false
    };
  }, [localGuardian]);


  const isOnline = navigator.onLine;
  const isNight = timeOfDay === 'night';

  return (
    <div className={`min-h-screen flex justify-center font-sans text-slate-200 transition-colors duration-1000`} style={{ background: isNight ? '#080713' : 'linear-gradient(180deg, #9AA8C6 0%, #F9EAD8 10%, #FBEAD6 22%, #FAEEE4 45%, #F7F3EE 70%, #ECE9EA 100%)' }}>
      {/* Mobile Constraint Container */}
      <div className={`w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col pb-0 transition-colors duration-1000`} style={{ background: isNight ? 'linear-gradient(180deg, #120B25 0%, #080713 100%)' : 'transparent' }}>

        {/* Global Dashboard Background Image (Only for Day mode) */}
        {!isNight && (
          <img src={`/assets/dashboard_assets/${themeFolder}/background.${themeFolder === 'afternoon' ? 'png' : 'jpeg'}`} alt="Dashboard Background" className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-opacity duration-1000 opacity-[0.85]" />
        )}

        {/* Abstract Background Glows */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#1E1B4B]/30 to-transparent pointer-events-none" />

        {/* MAIN SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-[6px] pt-1.5 space-y-[6px] pb-[200px] scrollbar-hide z-10 relative">

          {/* 🛡️ TOP HERO PREMIUM DASHBOARD BANNER */}
          <div className="mx-[-6px] mt-[-6px]">
            <DashboardHero
              isNight={isNight}
              protectionIndex={protectionIndex}
              displayFamilyMembers={familyCircleList}
              isRideActive={isRideActive}
              updates={updates}
              SHIELD_BASE64_IMAGE={SHIELD_BASE64_IMAGE}
              toggleOverlay={toggleOverlay}
              setIsFamilyCircleDetailOpen={setIsFamilyCircleDetailOpen}
            />
          </div>

          {/* ⚡ QUICK SAFETY ACTIONS */}
          {safetyMode === 'personal' && (
            <>
              <QuickActions
                safetyMode={safetyMode}
                isNight={isNight}
                toggleOverlay={toggleOverlay}
                setIsFakeCallHubOpen={setIsFakeCallHubOpen}
                setIsSafeTimerOpen={setIsSafeTimerOpen}
                setIsAllToolsOpen={setIsAllToolsOpen}
                setIsRideSafeOpen={setIsRideSafeOpen}
              />

              {/* 8. MOOD CHECK-IN & CALM SPACE CARDS (Stacked vertically for full width) */}
              <div className="flex flex-row gap-[8px] w-full px-[6px] mt-1.5">
                <div className="flex-1 min-w-0">
                  <MoodCheckInCard isNight={isNight} />
                </div>
                <div className="flex-1 min-w-0">
                  <CalmSpaceCard isNight={isNight} />
                </div>
              </div>

              {/* 9. INVITE CARD (Directly below Mood/Calm row) */}
              <InviteCard isNight={isNight} />
            </>
          )}

          {/* 🏡 PERSONAL SAFETY DASHBOARD CONTENT */}
          {safetyMode === 'personal' && (
            <div className="flex flex-col gap-0 w-full font-sans z-10 mt-1.5">
              {/* 2x2 GRID (4 beautiful cards matching user mockup screenshot) */}
              <div className="flex flex-col gap-[8px] w-full px-[6px]">
                {/* ROW 1: LIVE ACTIVITY & TODAY'S STREAK */}
                <div className="flex flex-row gap-[8px] w-full">
                  <div className="flex-1 min-w-0">
                    <LiveActivityCard isNight={isNight} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <TodayStreakCard isNight={isNight} />
                  </div>
                </div>
              </div>

              {/* 7. COMMUNITY NEAR YOU (Accurate Screenshot Design) */}
              <CommunityNearYou
                isNight={isNight}
                verifiedProtectorCount={verifiedProtectorCount}
                setIsNearbyHubOpen={setIsNearbyHubOpen}
                toggleOverlay={toggleOverlay}
              />
            </div>
          )}

          <RideSafeOverlay isOpen={isRideSafeOpen} onClose={() => toggleOverlay(setIsRideSafeOpen, false)} isRideActive={isRideActive} setIsRideActive={setIsRideActive} vehicleNo={vehicleNo} setVehicleNo={setVehicleNo} />
          <SafeTimerModal isOpen={isSafeTimerOpen} onClose={() => toggleOverlay(setIsSafeTimerOpen, false)} />
          <NearbyHubModal isOpen={isNearbyHubOpen} onClose={() => toggleOverlay(setIsNearbyHubOpen, false)} />
          <MedicalHubModal isOpen={isMedicalHubOpen} onClose={() => toggleOverlay(setIsMedicalHubOpen, false)} />
          <ShadowProtectMode isOpen={isShadowOpen} onClose={() => toggleOverlay(setIsShadowOpen, false)} />
          <FakeCallModal isOpen={isFakeCallHubOpen} onClose={() => toggleOverlay(setIsFakeCallHubOpen, false)} />
          <KavachAIChat isOpen={isAIChatOpen} onClose={() => toggleOverlay(setIsAIChatOpen, false)} />
          <FamilyCircleDetail isOpen={isFamilyCircleDetailOpen} onClose={() => setIsFamilyCircleDetailOpen(false)} />

          {isSafeHavenMapOpen && (
            <SafeHavenMap
              onClose={() => {
                setIsSafeHavenMapOpen(false);
                setPendingNavigationTarget(null);
              }}
              initialTarget={pendingNavigationTarget || undefined}
            />
          )}

          <WarningOverlay />
          <BannedOverlay />

          <ProtectorRatingModal
            isOpen={ratingAlert !== null}
            onClose={() => setRatingAlert(null)}
            alertId={ratingAlert?.id || ''}
            responders={ratingAlert?.responders || []}
          />

          {/* Conditional Footer only for Family Safety Mode */}
          {safetyMode === 'family' && (
            <div className="px-5 py-3.5 border-t border-[#1C1B38]/60 bg-[#05071B]/95 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-2.5 font-sans">
                <div className="w-8 h-8 bg-[#7C4DFF]/20 rounded-full flex items-center justify-center border border-[#7C4DFF]/30">
                  <Shield className="w-4 h-4 text-white fill-white" />
                </div>
                <div className="text-left">
                  <div className="text-[12px] font-semibold text-white">Protection is Active 24×7</div>
                  <div className="text-[9px] text-slate-400 max-w-[170px] mt-0.5">We are always here to keep your family safe and secure.</div>
                </div>
              </div>
              <button className="bg-[#101633] hover:bg-[#101633]/80 text-[#7C4DFF] px-2.5 py-1.5 rounded-xl text-[9px] font-bold flex items-center gap-1 transition-colors border-none cursor-pointer">
                <PlayCircle className="w-3 h-3" /> How It Works
              </button>
            </div>
          )}

          {/* Tailwind Custom Animations for Wave and Pulsing Effects */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes wave {
                0% { transform: rotate(0deg); }
                10% { transform: rotate(14deg); }
                20% { transform: rotate(-8deg); }
                30% { transform: rotate(14deg); }
                40% { transform: rotate(-4deg); }
                50% { transform: rotate(10deg); }
                60% { transform: rotate(0deg); }
                100% { transform: rotate(0deg); }
              }
              .animate-wave {
                animation: wave 2.5s infinite;
              }
            `}} />
          {/* 🚨 SOS BUTTON — integrated into the scrollable Home feed instead of floating fixed above the bottom navbar */}
          <div className="w-full px-[6px] mt-2 mb-6 pointer-events-auto">
            <SOSButton forceIsNight={isNight} />
          </div>
        </div>

      </div>
    </div>
  );
}