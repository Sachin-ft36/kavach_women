import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  MapPin, 
  Camera, 
  Users, 
  Settings, 
  AlertTriangle,
  EyeOff,
  Eye,
  Lock,
  LayoutDashboard,
  User,
  LogOut,
  Upload,
  Zap,
  Navigation,
  Globe,
  Trophy,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface LayoutProps {
  children: React.ReactNode;
  isGhostMode: boolean;
  onToggleGhost: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: 'citizen' | 'protector' | 'admin';
  setRole: (role: 'citizen' | 'protector' | 'admin') => void;
  setGender: (gender: 'female' | 'male') => void;
}

export default function Layout({ children, isGhostMode, onToggleGhost, activeTab, setActiveTab, role, setRole, setGender }: LayoutProps) {
  const { t, language, setLanguage } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleRoleSwitch = async () => {
    if (!user) return;
    try {
      const newRole = role === 'citizen' ? 'protector' : 'citizen';
      
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        role: newRole,
        lastRoleChange: new Date()
      });

      // Update Local State in App.tsx
      setRole(newRole);
      
      // Update local storage for persistence
      localStorage.setItem('kavach_role', newRole);
      
      // Close profile menu
      setIsProfileOpen(false);
      
      console.log(`KAVACH: Mission Mode Switched to ${newRole.toUpperCase()}`);
    } catch (error) {
      console.error("Role switch failed:", error);
      alert("Failed to switch mission mode.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const userPhoto = user?.photoURL || userData?.photoURL;
  const uid = userData?.aadhaarMasked || 'XXXX-XXXX-XXXX';
  const gender = userData?.gender || 'female';
  const displayName = user?.displayName || userData?.name || 'Kavach User';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // In a real app, we would upload this to Firebase Storage
        console.log("Photo upload simulated:", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isGhostMode) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] text-[#1C1E21] font-sans p-4">
        <div className="max-w-md mx-auto">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold lowercase tracking-tight">Weather</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm"
              >
                {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={20} className="text-gray-400" />}
              </button>
              <button onClick={onToggleGhost} className="p-2 text-gray-300">
                <EyeOff size={20} />
              </button>
            </div>
          </header>
          
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xl mb-6 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-sm">
                    {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={24} className="text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm tracking-tight">{role === 'protector' ? t('protector') : t('citizen')}</p>
                    <p className="text-[10px] text-gray-400 font-mono">ID: {(uid || "").replace(/-/g, '').slice(0, 8)}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg"
                >
                  {t('logout') || 'LOGOUT'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-blue-50 p-6 rounded-2xl mb-6 shadow-sm border border-blue-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 font-medium">New Delhi</p>
                <p className="text-5xl font-black text-blue-900 leading-none">32°C</p>
                <p className="text-blue-600 font-bold mt-1">Haze & Sunny</p>
              </div>
              <div className="w-16 h-16 bg-yellow-400 rounded-full blur-xl opacity-20 animate-pulse" />
            </div>
            <div className="flex justify-between text-[10px] text-blue-400 font-black uppercase tracking-widest pt-4 border-t border-blue-100">
              <span>H: 38° L: 26°</span>
              <span>Humidity: 45%</span>
              <span>UV: High</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hourly Forecast</p>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="min-w-[60px] bg-gray-50 rounded-2xl p-3 flex flex-col items-center gap-2">
                  <span className="text-[9px] font-bold text-gray-500">{12 + i}:00</span>
                  <div className="w-6 h-6 bg-yellow-400/20 rounded-full" />
                  <span className="text-xs font-black">3{i}°</span>
                </div>
              ))}
            </div>
            
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Local News</p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl flex gap-4 items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 bg-gray-200 rounded-full w-3/4" />
                  <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-accent-red selection:text-white p-4 sm:p-6 pb-32">
      {/* Top Bar */}
      <header className="relative z-[9999] flex justify-between items-center mb-4 sm:mb-6 max-w-7xl mx-auto px-1 sm:px-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-base sm:text-lg shrink-0",
              role === 'admin' ? "bg-accent-blue shadow-[0_0_15px_rgba(0,122,255,0.5)]" : "bg-accent-red shadow-[0_4px_12px_rgba(255,59,48,0.2)]"
            )}>
              {role === 'admin' ? <Shield size={16} /> : 'K'}
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter truncate italic">
              {role === 'admin' ? 'CELL-9' : 'KAVACH'} 
            </h1>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[8px] font-mono font-bold text-accent-blue uppercase tracking-widest">
              PRTCL 4.0 // MHA_GRID_AUTH
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-card-bg border border-border/50 rounded-lg p-0.5">
            {['en', 'hi', 'ml'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang as any)}
                className={cn(
                  "px-2 py-1 rounded text-[8px] font-bold uppercase transition-all",
                  language === lang ? "bg-accent-blue text-white" : "text-gray-600 hover:text-gray-400"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
          <button 
            onClick={onToggleGhost}
            className="p-2 sm:p-2.5 bg-card-bg border border-border hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all"
            title="Ghost Mode"
          >
            <Eye size={16} className="text-text-dim" />
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-1.5 sm:gap-2 bg-card-bg border border-border hover:bg-white/10 p-1 pr-3 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl transition-all"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-accent-blue/20 flex items-center justify-center overflow-hidden border border-accent-blue/30">
                {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={14} className="text-accent-blue" />}
              </div>
              <span className="text-[9px] font-black text-accent-blue uppercase tracking-widest hidden xs:inline">Profile</span>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-64 bg-card-bg/95 border border-border rounded-[32px] p-6 shadow-2xl z-[100] backdrop-blur-3xl"
                >
                  <div className="space-y-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-3xl bg-accent-blue/10 border-2 border-accent-blue/30 flex items-center justify-center overflow-hidden">
                          {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={32} className="text-accent-blue" />}
                        </div>
                        <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors shadow-lg">
                          <Upload size={14} />
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-black italic uppercase text-lg leading-tight tracking-tighter">
                          {displayName}
                        </h3>
                        <p className="text-[9px] text-accent-blue font-bold uppercase tracking-[2px] mt-1 font-mono">
                          {role === 'admin' ? t('admin') : role === 'protector' ? t('protector') : t('citizen')} // {gender.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Mission ID</span>
                        <span className="text-[10px] font-mono text-white truncate max-w-[140px]">
                          {user?.email || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Tactical Phone</span>
                        <span className="text-[10px] font-mono text-accent-blue font-black">
                          {userData?.phoneNumber || 'NOT ANCHORED'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Aadhaar Link</span>
                        <span className="text-[10px] font-mono text-white">
                          {userData?.aadhaar ? `**** ${userData.aadhaar.slice(-4)}` : 'NO LINK'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Status</span>
                        <span className="text-[10px] font-black text-green-500 italic uppercase tracking-widest">Shield Active</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* GENDER-BASED MISSION LOCK: Only females can switch roles freely */}
                      {gender === 'female' && (
                        <button 
                          onClick={handleRoleSwitch}
                          className={cn(
                            "w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border shadow-sm",
                            role === 'citizen' 
                              ? "bg-accent-blue text-white border-accent-blue/30" 
                              : "bg-accent-red text-white border-accent-red/30"
                          )}
                        >
                          {role === 'citizen' ? (
                            <><Zap size={14} /> {t('join_protector')}</>
                          ) : (
                            <><Shield size={14} /> {t('home')}</>
                          )}
                        </button>
                      )}

                      <button 
                        onClick={handleLogout}
                        className="w-full py-4 bg-white/5 text-gray-500 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <LogOut size={14} /> {t('logout') || 'LOGOUT'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={onToggleGhost}
            className="p-2.5 bg-card-bg border border-border hover:bg-white/10 rounded-2xl transition-all"
            title="Ghost Mode"
          >
            <Eye size={18} className="text-text-dim" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 pointer-events-none">
        <div className="max-w-md mx-auto bg-card-bg/90 backdrop-blur-3xl border border-border rounded-3xl p-2 flex justify-between items-center shadow-2xl pointer-events-auto">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label={t('home')}
          />
          
          {role === 'citizen' && (
            <>
              <NavButton 
                active={activeTab === 'radar'} 
                onClick={() => setActiveTab('radar')}
                icon={<Globe size={20} className="text-accent-blue" />}
                label="RADAR"
              />
              <NavButton 
                active={activeTab === 'contacts'} 
                onClick={() => setActiveTab('contacts')}
                icon={<Users size={20} />}
                label="CONTACTS"
              />
              <NavButton 
                active={activeTab === 'special_cell'} 
                onClick={() => setActiveTab('special_cell')}
                icon={<ShieldCheck size={20} className="text-purple-500" />}
                label="POLICE"
              />
              <NavButton 
                active={activeTab === 'vault'} 
                onClick={() => setActiveTab('vault')}
                icon={<Upload size={20} />}
                label="VAULT"
              />
            </>
          )}

          {role === 'protector' && (
            <NavButton 
              active={activeTab === 'rewards'} 
              onClick={() => setActiveTab('rewards')}
              icon={<Trophy size={20} />}
              label={t('rakshak_merit') || 'Merit'}
            />
          )}

          {role === 'admin' && (
            <>
              <NavButton 
                active={activeTab === 'verify'} 
                onClick={() => setActiveTab('verify')}
                icon={<UserCheck size={20} />}
                label="VERIFY"
              />
              <NavButton 
                active={activeTab === 'rewards'} 
                onClick={() => setActiveTab('rewards')}
                icon={<Trophy size={20} />}
                label="Audit Rewards"
              />
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, isSOS }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isSOS?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center flex-1 h-14 transition-all duration-300 relative",
        active ? "text-white" : "text-text-dim",
        isSOS && "text-accent-red"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-all duration-300",
        active && !isSOS && "bg-accent-blue/10 scale-110",
        active && isSOS && "bg-accent-red/10 scale-125"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[8px] font-black uppercase tracking-[0.15em] mt-1 transition-opacity",
        active ? "opacity-100" : "opacity-0"
      )}>{label}</span>
      
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute -bottom-1 w-1 h-1 bg-current rounded-full"
        />
      )}
    </button>
  );
}
