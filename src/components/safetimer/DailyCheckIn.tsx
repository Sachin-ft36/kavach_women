import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  Home, Building2, Car, ShoppingBag, Dumbbell, Coffee,
  MapPin, Bell, X, ChevronRight, CheckCircle2, Users,
  CloudSun, ChevronDown, Check, ShieldCheck, MoreHorizontal, Plus, Camera
} from 'lucide-react';
import { doc, getDoc, updateDoc, setDoc, addDoc, collection, serverTimestamp, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, auth, logTelemetryEvent } from '../../firebase';
import { useKavachStore } from '../../state/useKavachStore';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import ShareCheckIn from './ShareCheckIn';
import CheckInCamera from './CheckInCamera';

interface DailyCheckInProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyCheckIn({ isOpen, onClose }: DailyCheckInProps) {
  const [streakCount, setStreakCount] = useState(15);
  const [healthScore, setHealthScore] = useState(92);
  const [selectedStatus, setSelectedStatus] = useState("Reached Home");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showShareScreen, setShowShareScreen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);  // LOCAL camera state

  const { guardianCache, isCameraActive, setIsCameraActive } = useKavachStore();

  // Real user data state
  const [displayName, setDisplayName] = useState("Citizen");
  const [locationName, setLocationName] = useState("Connaught Place, Delhi");
  const [weatherInfo, setWeatherInfo] = useState("26°C • Haze");
  const [realActivities, setRealActivities] = useState<any[]>([]);
  const [userPhoto, setUserPhoto] = useState<string>("https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=120&h=120");

  // No Firestore snapshot for stories — built directly from guardianCache for instant render

  const dynamicStories = useMemo(() => {
    const list: Array<{
      name: string;
      img: string;
      isAdd?: boolean;
      badge?: number;
      dot?: boolean;
    }> = [
        { name: "My Story", img: userPhoto, isAdd: true }
      ];

    const activeCircle = (guardianCache || []).filter((g: any) => {
      if (!g || g.isMock || g.status === 'pending' || g.isPending === true || g.accepted === false) return false;
      return true;
    });

    activeCircle.forEach((g: any, index: number) => {
      let avatar = g.photoUrl || g.photoURL || g.photo;
      if (!avatar || avatar.trim() === "" || avatar.startsWith("data:") || avatar.includes("placeholder")) {
        const relation = (g.relation || g.relationName || "").toLowerCase();
        const name = (g.name || "").toLowerCase();
        if (relation.includes("mother") || relation.includes("mom") || relation.includes("sister") || relation.includes("daughter") || name.includes("mother") || name.includes("mom")) {
          avatar = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=100&h=100";
        } else {
          avatar = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=100&h=100";
        }
      }

      list.push({
        name: g.name ? g.name.split(' ')[0] : "Member",
        img: avatar,
        badge: index === 0 ? 3 : index === 1 ? 2 : undefined,
        dot: index === 2 ? true : undefined
      });
    });

    return list;
  }, [guardianCache, userPhoto]);

  // Time formatting helper
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Fetch user data
  useEffect(() => {
    if (!isOpen) return;
    if (auth?.currentUser) {
      setDisplayName(auth.currentUser.displayName ? auth.currentUser.displayName.split(' ')[0] : "Citizen");
      if (auth.currentUser.photoURL) {
        setUserPhoto(auth.currentUser.photoURL);
      }
    }
    const fetchUserData = async () => {
      if (!auth?.currentUser) return;
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setStreakCount(data.streak || 15);
          setHealthScore(data.safetyHealthScore || 92);
          if (data.name) {
            setDisplayName(data.name.split(' ')[0]);
          } else if (data.displayName) {
            setDisplayName(data.displayName.split(' ')[0]);
          }
          if (data.photoUrl || data.photoURL) {
            setUserPhoto(data.photoUrl || data.photoURL);
          }
        }
      } catch (err) {
        console.error("Error fetching checkin details:", err);
      }
    };
    fetchUserData();
  }, [isOpen]);

  // Geolocation & Weather
  useEffect(() => {
    if (!isOpen) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const weatherData = await weatherRes.json();
          if (weatherData?.current_weather?.temperature !== undefined) {
            const temp = Math.round(weatherData.current_weather.temperature);
            setWeatherInfo(`${temp}°C • Live`);
          }

          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const geoData = await geoRes.json();
          if (geoData && geoData.address) {
            const city = geoData.address.city || geoData.address.town || geoData.address.suburb || geoData.address.state || "Delhi";
            const road = geoData.address.road || geoData.address.suburb || "";
            setLocationName(`${road ? road + ', ' : ''}${city}`);
          }
        } catch (err) {
          console.error("Reverse geocoding/weather API failed:", err);
        }
      },
      (error) => {
        console.warn("Geolocation access denied:", error);
      }
    );
  }, [isOpen]);

  // Real-time activities subscription
  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const acts: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let actIcon = Home;
        let actColor = "text-[#4ade80]";
        if (data.message?.toLowerCase().includes("office") || data.message?.toLowerCase().includes("work")) {
          actIcon = Building2;
          actColor = "text-[#60a5fa]";
        } else if (data.message?.toLowerCase().includes("travel") || data.message?.toLowerCase().includes("way")) {
          actIcon = Car;
          actColor = "text-[#fcd34d]";
        } else if (data.message?.toLowerCase().includes("gym") || data.message?.toLowerCase().includes("workout")) {
          actIcon = Dumbbell;
          actColor = "text-[#e879f9]";
        }

        acts.push({
          id: doc.id,
          name: data.userName || "Family Member",
          action: data.message || "Completed check-in",
          time: data.timestamp ? formatTimeAgo(data.timestamp.toDate()) : "Just now",
          icon: actIcon,
          iconColor: actColor,
          img: data.userPhoto || `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 50) + 1}`
        });
      });
      setRealActivities(acts);
    }, (err) => {
      console.warn("Activities query subscription error:", err);
    });
    return () => unsubscribe();
  }, [isOpen]);

  // Reset camera active state when check-in is closed
  useEffect(() => {
    if (!isOpen) {
      setIsCameraActive(false);
      setCapturedPhoto(null);
    }
  }, [isOpen, setIsCameraActive]);

  const handleQuickCheckIn = async (status: string) => {
    toast.success(`Check-in: ${status} (Broadcasted)`);
    if (auth?.currentUser) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const checkInRef = doc(db, 'users', auth.currentUser.uid, 'dailyCheckIns', todayStr);

        await setDoc(checkInRef, {
          timestamp: serverTimestamp(),
          status: 'safe',
          activityStatus: status,
          sharedWithGroups: ["Family"]
        });

        const newStreak = streakCount + 1;
        const newScore = Math.min(105, healthScore + 2);

        await updateDoc(userRef, {
          streak: newStreak,
          safetyHealthScore: newScore,
          computedStatus: `🟢 Safe (${status})`,
          lastSeen: serverTimestamp()
        });

        await addDoc(collection(db, 'activities'), {
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || 'Family Member',
          type: 'checkin',
          message: `completed safety check-in: "${status}"`,
          timestamp: serverTimestamp()
        });

        setStreakCount(newStreak);
        setHealthScore(newScore);
        logTelemetryEvent('checkin_completed', { streak: newStreak, status });
        onClose();
      } catch (err) {
        console.error(err);
      }
    } else {
      onClose();
    }
  };

  const topNavItems = [
    { name: "Reached Home", icon: Home },
    { name: "Reached Office", icon: Building2 },
    { name: "Travelling", icon: Car },
    { name: "Gym", icon: Dumbbell },
    { name: "More", icon: MoreHorizontal }
  ];

  const recentActivities = [
    { name: "Mom", action: "Reached Home", time: "2m ago", icon: Home, iconColor: "text-[#4ade80]", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=100&h=100" },
    { name: "Riya", action: "Travelling", time: "15m ago", icon: Car, iconColor: "text-[#fcd34d]", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=100&h=100" },
    { name: "Aman", action: "Reached Office", time: "25m ago", icon: Building2, iconColor: "text-[#60a5fa]", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=100&h=100" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500000] bg-[#05060F] text-white font-sans flex flex-col overflow-y-auto selection:bg-transparent pb-28">
      {showShareScreen ? (
        <ShareCheckIn
          onBack={() => setShowShareScreen(false)}
          onDone={(selectedGroups, selectedContacts) => {
            handleQuickCheckIn(selectedStatus);
          }}
          capturedPhoto={capturedPhoto}
          selectedStatus={selectedStatus}
        />
      ) : (
        <>
          {/* ── HEADER (Profile & Weather) ── */}
          <div className="w-full max-w-[480px] mx-auto px-4 pt-2.5 min-[380px]:pt-4 shrink-0 pointer-events-auto">
            <header className="flex items-center justify-between pt-0.5 min-[380px]:pt-1">
              <div className="flex items-center gap-1.5 min-[380px]:gap-2">
                <div className="relative">
                  <img
                    src={userPhoto}
                    alt="Profile"
                    className="w-7 h-7 min-[380px]:w-8.5 min-[380px]:h-8.5 rounded-full border border-purple-500 object-cover"
                  />
                  <div
                    onClick={onClose}
                    className="absolute bottom-0 right-0 bg-[#FBBF24] hover:bg-yellow-500 rounded-full w-3 h-3 min-[380px]:w-3.5 min-[380px]:h-3.5 flex items-center justify-center border border-[#0c071d] cursor-pointer"
                  >
                    <ChevronDown size={7} className="text-black font-extrabold" />
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] min-[380px]:text-[12.5px] font-bold text-white flex items-center gap-0.5 leading-none">
                    Hi, {displayName}! <span className="text-xs">👋</span>
                  </span>
                  <span className="text-[8px] min-[380px]:text-[9.5px] text-gray-400 mt-0.5">Stay Safe, Stay Connected</span>
                </div>
              </div>

              <div className="bg-[#120a2b]/85 border border-[#26154d] rounded-full pl-2 pr-2.5 py-0.5 min-[380px]:pl-2.5 min-[380px]:pr-3 min-[380px]:py-1 flex items-center gap-1 min-[380px]:gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <MapPin size={8} className="text-white" />
                    <span className="text-[8.5px] min-[380px]:text-[10px] font-bold text-white leading-none truncate max-w-[90px] min-[380px]:max-w-[110px]">{locationName}</span>
                  </div>
                  <span className="text-[7.5px] min-[380px]:text-[8px] text-gray-400 mt-0.5">{weatherInfo}</span>
                </div>
                <CloudSun size={12} className="text-yellow-400 min-[380px]:w-[15px] min-[380px]:h-[15px]" />
              </div>
            </header>
          </div>

          {/* ── 1. TOP STORIES SECTION ── */}
          <div className="w-full max-w-[480px] mx-auto flex items-start gap-3 min-[380px]:gap-4 px-4 pt-2 pb-2 min-[380px]:pt-3 min-[380px]:pb-3 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {dynamicStories.map((story, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-[380px]:gap-1.5 flex-shrink-0 cursor-pointer">
                <div className="relative">
                  <div className={`w-[44px] h-[44px] min-[380px]:w-[56px] min-[380px]:h-[56px] rounded-full p-[1.5px] min-[380px]:p-[2px] ${story.isAdd ? 'border border-white/30' : 'bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-orange-400'}`}>
                    <img src={story.img} className="w-full h-full rounded-full border-[1.5px] min-[380px]:border-[2px] border-[#07050a] object-cover" alt={story.name} />
                  </div>
                  {story.isAdd && (
                    <div className="absolute bottom-0 right-0 bg-[#c084fc] w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 rounded-full flex items-center justify-center border border-[#07050a]">
                      <Plus size={9} className="text-white font-bold min-[380px]:w-[12px] min-[380px]:h-[12px]" />
                    </div>
                  )}
                  {story.badge && (
                    <div className="absolute bottom-0 right-0 bg-[#ef4444] text-[8px] min-[380px]:text-[10px] font-bold text-white w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 rounded-full flex items-center justify-center border border-[#07050a]">
                      {story.badge}
                    </div>
                  )}
                  {story.dot && (
                    <div className="absolute bottom-0.5 right-0 bg-[#22c55e] w-2.5 h-2.5 min-[380px]:w-3.5 min-[380px]:h-3.5 rounded-full border border-[#07050a]" />
                  )}
                </div>
                <span className="text-[8.5px] min-[380px]:text-[10px] font-semibold text-gray-300">{story.name}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1 min-[380px]:gap-1.5 flex-shrink-0 cursor-pointer">
              <div className="w-[44px] h-[44px] min-[380px]:w-[56px] min-[380px]:h-[56px] rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10">
                <MoreHorizontal size={16} className="text-gray-400 min-[380px]:w-[20px] min-[380px]:h-[20px]" />
              </div>
              <span className="text-[8.5px] min-[380px]:text-[10px] font-semibold text-gray-400">View All</span>
            </div>
          </div>

          {/* ── TOP NAV TABS ── */}
          <div className="w-full max-w-[480px] mx-auto px-4 py-1.5 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden flex gap-1.5 min-[380px]:gap-2.5 relative z-[60] pointer-events-auto">
            {topNavItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedStatus === item.name;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    console.log("Selected status changed to:", item.name);
                    setSelectedStatus(item.name);
                  }}
                  className={`relative z-[70] pointer-events-auto flex flex-col items-center justify-center min-w-[54px] min-[380px]:min-w-[78px] h-[58px] min-[380px]:h-[80px] rounded-[12px] min-[380px]:rounded-[20px] px-1 min-[380px]:px-2 transition-all flex-shrink-0 border cursor-pointer ${isSelected
                    ? 'bg-gradient-to-tr from-[#9000FF] via-[#ec4899] to-[#3b82f6] border-none text-white shadow-[0_0_20px_rgba(144,0,255,0.45)]'
                    : 'bg-[#120a2b]/80 border-[#26154d] text-[#9CA3AF] hover:text-white'
                    }`}
                >
                  <Icon size={16} className="mb-0.5 min-[380px]:mb-1.5 min-[380px]:w-6 min-[380px]:h-6" strokeWidth={1.5} />
                  <span className={`text-[7.5px] min-[380px]:text-[9.5px] font-semibold tracking-wide ${isSelected ? 'text-white' : ''}`}>{item.name}</span>

                  {isSelected && (
                    <div className="absolute -top-0.5 -right-0.5 bg-white rounded-full w-4.5 h-4.5 min-[380px]:w-6 min-[380px]:h-6 flex items-center justify-center border-2 border-[#0c071d] shadow-md z-[80] pointer-events-none">
                      <Check size={8} className="min-[380px]:w-3 min-[380px]:h-3 text-black font-bold" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── 3. STATIC CAMERA PLACEHOLDER VIEWFINDER ── */}
          <div className="relative w-full aspect-[9/12.5] overflow-hidden shrink-0 bg-zinc-900">
            <div
              onClick={() => {
                setIsCameraActive(true);
              }}
              className="absolute inset-0 cursor-pointer z-20 overflow-hidden"
            >
              {/* Background Sunset Image */}
              <img
                src="/assets/camers_assests/taptoopen.png"
                alt="Tap to open camera"
                className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/5 pointer-events-none" />

              {/* Top Text Content on Image */}
              <div className="absolute top-[5%] left-5 right-5 flex flex-col items-start gap-2.5 text-left select-none pointer-events-none">
                {/* Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-950/10 backdrop-blur-sm">
                  <span className="text-[11px]">🌸</span>
                  <span className="text-[9px] font-semibold text-purple-200 tracking-wider uppercase">DAILY CHECK-IN</span>
                </div>

                {/* Heading */}
                <h2 className="text-[24px] min-[360px]:text-[26px] font-black leading-tight tracking-tight bg-gradient-to-r from-purple-300 via-fuchsia-200 to-purple-400 bg-clip-text text-transparent">
                  Your Day.<br />Their Peace. <span className="inline-block">💜</span>
                </h2>

                {/* Subtext */}
                <p className="text-[11.5px] min-[360px]:text-[12.5px] leading-relaxed text-gray-200 max-w-[280px] font-medium drop-shadow-md">
                  Take a quick photo, share your update with people who care, and build your daily safety habit.
                </p>

                {/* Three Step Feature Row */}
                <div className="flex items-start justify-start gap-2.5 inline-flex">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-black/15 backdrop-blur-sm"
                      style={{ boxShadow: '0 0 0 1.5px rgba(144,0,255,0.7), 0 0 0 3px rgba(144,0,255,0.12)' }}>
                      <Camera size={19} className="text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Click Photo</span>
                    <span className="text-[7.5px] text-gray-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">In 5 sec</span>
                  </div>
                  <div className="w-px h-11 bg-white/20 flex-shrink-0" />
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-black/15 backdrop-blur-sm"
                      style={{ boxShadow: '0 0 0 1.5px rgba(144,0,255,0.7), 0 0 0 3px rgba(144,0,255,0.12)' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-[19px] h-[19px] text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Share Instantly</span>
                    <span className="text-[7.5px] text-gray-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">With your circle</span>
                  </div>
                  <div className="w-px h-11 bg-white/20 flex-shrink-0" />
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center bg-black/15 backdrop-blur-sm"
                      style={{ boxShadow: '0 0 0 1.5px rgba(144,0,255,0.7), 0 0 0 3px rgba(144,0,255,0.12)' }}>
                      <ShieldCheck size={19} className="text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Stay Consistent</span>
                    <span className="text-[7.5px] text-gray-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Build your habit</span>
                  </div>
                </div>

                {/* Safety Streak Banner */}
                <div className="flex items-center justify-between gap-3 w-full rounded-[16px] px-4 py-3"
                  style={{ background: 'linear-gradient(135deg, rgba(13,7,29,0.92) 0%, rgba(30,10,60,0.92) 100%)', border: '1px solid rgba(144,0,255,0.18)' }}>
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="text-[20px] flex-shrink-0">⭐</span>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-[12px] font-black text-white leading-tight">Start Your Safety Streak Today!</span>
                      <span className="text-[9.5px] text-gray-400 mt-1 leading-tight">Check-in daily, stay consistent, earn achievements.</span>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0 flex items-center justify-center w-[40px] h-[40px]">
                    <span className="text-[26px]">📅</span>
                    <span className="absolute -top-0.5 -right-0.5 text-[11px]">🔥</span>
                    <span className="absolute top-0 left-0 text-[8px] text-yellow-300">✦</span>
                  </div>
                </div>
              </div>

              {/* Quick SOS Button */}
              <div
                className="absolute top-[80%] min-h-[700px]:top-[87%] left-[18%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto flex flex-col items-center gap-0.5 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]);
                    toast.success("SOS Dispatch Signal Broadcasted");
                  }}
                  className="w-[40px] min-[380px]:w-[48px] h-[40px] min-[380px]:h-[48px] rounded-full bg-[#0d071d]/85 flex items-center justify-center active:scale-95 transition-all duration-200"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(236,72,153,0.08) 0%, transparent 70%)',
                    boxShadow: '0 0 0 1.2px rgba(144,0,255,0.6), 0 0 12px rgba(236,72,153,0.25)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="min-[380px]:w-[24px] min-[380px]:h-[24px]">
                    <defs>
                      <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#c026d3" />
                      </linearGradient>
                    </defs>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="url(#bellGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="url(#bellGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </button>
                <span className="text-[7.5px] min-[380px]:text-[8.5px] font-bold text-white tracking-wide whitespace-nowrap drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] mt-0.5">Quick SOS</span>
                <span className="text-[6.5px] min-[380px]:text-[7px] text-gray-400 tracking-wide whitespace-nowrap drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Send Alert</span>
                <div className="w-5 min-[380px]:w-6 h-[1.5px] rounded-full bg-gradient-to-r from-[#9000FF] to-[#ec4899] mt-0.5" />
              </div>

              {/* Glowing Orbit Rings & Camera Button - CLICKABLE */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCamera(true);
                }}
                className="absolute top-[78%] min-h-[700px]:top-[85%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center select-none z-30 pointer-events-auto cursor-pointer bg-transparent border-0 outline-none p-0 m-0"
              >
                <div className="relative flex items-center justify-center w-[85px] h-[85px] min-[380px]:w-[115px] min-[380px]:h-[115px]">
                  <div
                    className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none"
                    style={{
                      maskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 80%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 72%, transparent 80%)'
                    }}
                  >
                    <div className="absolute inset-[2.5px] min-[380px]:inset-[3px] rounded-full animate-[spin_20s_linear_infinite] flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-[1px] min-[380px]:border-[1.2px] border-dotted border-fuchsia-400/50" />
                      <div className="absolute -top-[2px] min-[380px]:-top-[3px] left-1/2 -translate-x-1/2 w-[5px] min-[380px]:w-[6.5px] h-[5px] min-[380px]:h-[6.5px] rounded-full bg-white shadow-[0_0_10px_#ec4899,0_0_20px_#ec4899,0_0_4px_#fff] border border-white/40 z-20" />
                      <div className="absolute -bottom-[2px] min-[380px]:-bottom-[3px] left-1/2 -translate-x-1/2 w-[5px] min-[380px]:w-[6.5px] h-[5px] min-[380px]:h-[6.5px] rounded-full bg-white shadow-[0_0_10px_#ec4899,0_0_20px_#ec4899,0_0_4px_#fff] border border-white/40 z-20" />
                      <div className="absolute left-[-2px] min-[380px]:left-[-3px] top-1/2 -translate-y-1/2 w-[5px] min-[380px]:w-[6.5px] h-[5px] min-[380px]:h-[6.5px] rounded-full bg-white shadow-[0_0_10px_#ec4899,0_0_20px_#ec4899,0_0_4px_#fff] border border-white/40 z-20" />
                      <div className="absolute right-[-2px] min-[380px]:right-[-3px] top-1/2 -translate-y-1/2 w-[5px] min-[380px]:w-[6.5px] h-[5px] min-[380px]:h-[6.5px] rounded-full bg-white shadow-[0_0_10px_#ec4899,0_0_20px_#ec4899,0_0_4px_#fff] border border-white/40 z-20" />
                    </div>
                  </div>

                  <div className="relative w-[58px] h-[58px] min-[380px]:w-[76px] min-[380px]:h-[76px] rounded-full p-[3px] min-[380px]:p-[4px] bg-gradient-to-tr from-[#9000FF] via-[#ec4899] to-[#ff7a00] flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.35)] min-[380px]:shadow-[0_0_20px_rgba(236,72,153,0.45)] transition-all duration-300 hover:scale-105 active:scale-95 z-10">
                    <div className="w-full h-full bg-[#0d071d] rounded-full flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] w-[26px] h-[26px] min-[380px]:w-[34px] min-[380px]:h-[34px]"
                      >
                        <path
                          d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
                          fill="currentColor"
                        />
                        <circle cx="12" cy="13" r="3.5" fill="#b982fc" />
                        <circle cx="12" cy="13" r="3.5" stroke="#0d071d" strokeWidth="0.8" />
                        <circle cx="18.2" cy="10.8" r="0.8" fill="#0d071d" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center mt-[-6px] min-[380px]:mt-[-10px] gap-0.5 font-sans w-max">
                  <span className="text-[7.5px] min-[380px]:text-[9px] font-bold text-white tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap">
                    TAP TO OPEN THE CAMERA
                  </span>
                  <span className="text-[6.5px] min-[380px]:text-[7.5px] text-gray-300 font-bold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] whitespace-nowrap">
                    For quick actions & check-in
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* ── 4. BOTTOM PANELS (Outside Camera Area, Scrollable) ── */}
          <div className="w-full max-w-[480px] mx-auto flex flex-col gap-4 px-4 py-4 shrink-0 z-10 relative pointer-events-auto">
            {/* Panel 2: Recent Activity */}
            <div className="bg-[#12111a] border border-white/10 rounded-[24px] p-4 shadow-2xl mb-8">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[13px] font-medium text-gray-300">Recent Activity</span>
                <button className="text-[11px] font-semibold text-[#a855f7] flex items-center hover:text-purple-400 cursor-pointer">
                  View All <ChevronRight size={12} className="ml-0.5" />
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {(realActivities.length > 0 ? realActivities : recentActivities).map((activity, idx) => {
                  const ActIcon = activity.icon;
                  const iconColorHex = activity.iconColor.replace('text-[', '').replace(']', '');

                  return (
                    <div key={idx} className="flex gap-3 bg-[#1a1924] border border-white/5 rounded-[20px] p-3 min-w-[155px] flex-shrink-0">
                      <div className="flex flex-col items-center justify-between py-0.5 gap-2">
                        <div className="relative w-[34px] h-[34px]">
                          <img src={activity.img} alt={activity.name} className="w-full h-full rounded-full object-cover border border-[#2a2935]" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] rounded-full border-2 border-[#1a1924] bg-green-500" />
                        </div>
                        <ActIcon
                          size={15}
                          className={activity.iconColor}
                          style={{ filter: `drop-shadow(0px 0px 5px ${iconColorHex})` }}
                        />
                      </div>

                      <div className="flex flex-col justify-between py-0.5">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-gray-100 leading-tight">{activity.name}</span>
                          <span className="text-[11px] text-gray-400 leading-tight mt-[1px]">{activity.action}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 leading-tight mt-1">{activity.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fullscreen Camera Component - Portal to body, max z-index */}
      {showCamera && ReactDOM.createPortal(
        <CheckInCamera
          isOpen={true}
          onClose={() => setShowCamera(false)}
          onPhotoCaptured={(photo) => {
            setCapturedPhoto(photo);
            setShowCamera(false);
            setShowShareScreen(true);
          }}
        />,
        document.body
      )}
    </div>
  );
}
