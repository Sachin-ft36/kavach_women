import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Sun, Moon, MapPin, EyeOff, User, LogOut, ThermometerSun, ThermometerSnowflake, Activity, Zap, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useKavachStore } from '../store/useKavachStore';

interface WeatherScreenProps {
  onClose: () => void;
  userPhoto?: string | null;
  displayName?: string;
  uid?: string;
  onLogout: () => void;
}

export default function WeatherScreen({ onClose, userPhoto, displayName, uid, onLogout }: WeatherScreenProps) {
  const { userPos } = useKavachStore();
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    // Fallback to New Delhi coordinates if userPos is not available yet
    const lat = userPos && userPos[0] !== undefined ? userPos[0] : 28.6139;
    const lng = userPos && userPos[1] !== undefined ? userPos[1] : 77.2090;

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto`)
      .then(res => res.json())
      .then(data => setWeatherData(data))
      .catch(console.error);
  }, [userPos]);

  const getWeatherInfo = (code: number, isDay: boolean = true) => {
    // WMO Weather interpretation codes with Unsplash realistic backgrounds
    if (code === 0) return { 
        desc: 'Clear Sky', 
        icon: isDay ? <Sun className="text-amber-400" /> : <Moon className="text-indigo-300" />, 
        bg: 'bg-gradient-to-br from-blue-500 to-indigo-800',
        bgImage: isDay ? 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&q=80&w=1080' : 'https://images.unsplash.com/photo-1532704868953-d85f24176d73?auto=format&fit=crop&q=80&w=1080'
    };
    if (code <= 3) return { 
        desc: 'Partly Cloudy', 
        icon: <Cloud className="text-slate-200" />, 
        bg: 'bg-gradient-to-br from-slate-600 to-slate-900',
        bgImage: 'https://images.unsplash.com/photo-1534088568595-a066f410cbda?auto=format&fit=crop&q=80&w=1080'
    };
    if (code <= 48) return { 
        desc: 'Foggy', 
        icon: <Cloud className="text-slate-400" />, 
        bg: 'bg-gradient-to-br from-gray-500 to-gray-800',
        bgImage: 'https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?auto=format&fit=crop&q=80&w=1080'
    };
    if (code <= 55) return { 
        desc: 'Drizzle', 
        icon: <Cloud className="text-blue-300" />, 
        bg: 'bg-gradient-to-br from-slate-700 to-blue-900',
        bgImage: 'https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&q=80&w=1080'
    };
    if (code <= 65) return { 
        desc: 'Rainy', 
        icon: <Droplets className="text-blue-400" />, 
        bg: 'bg-gradient-to-br from-slate-800 to-blue-950',
        bgImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=1080'
    };
    if (code <= 75) return { 
        desc: 'Snow', 
        icon: <Cloud className="text-white" />, 
        bg: 'bg-gradient-to-br from-slate-400 to-slate-700',
        bgImage: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&q=80&w=1080'
    };
    if (code >= 95) return { 
        desc: 'Thunderstorm', 
        icon: <Zap className="text-amber-400" />, 
        bg: 'bg-gradient-to-br from-gray-900 to-black',
        bgImage: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0ce49?auto=format&fit=crop&q=80&w=1080'
    };
    return { 
        desc: 'Clear', 
        icon: <Sun className="text-amber-400" />, 
        bg: 'bg-gradient-to-br from-blue-500 to-indigo-800',
        bgImage: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&q=80&w=1080'
    };
  };

  const isDaytime = weatherData ? weatherData.current.is_day !== 0 : true;
  const currentInfo = weatherData ? getWeatherInfo(weatherData.current.weather_code, isDaytime) : null;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans p-4 sm:p-6 pb-20 relative overflow-hidden selection:bg-blue-500/30">
      {/* Dynamic Background */}
      {currentInfo?.bgImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out scale-105"
          style={{ backgroundImage: `url(${currentInfo.bgImage})` }}
        />
      )}
      <div className={cn("absolute inset-0 opacity-80 mix-blend-multiply transition-colors duration-1000", currentInfo?.bg || 'bg-slate-900')} />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none mix-blend-overlay" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />
      
      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 backdrop-blur-xl bg-white/5 p-3 sm:px-5 rounded-[24px] border border-white/10 shadow-lg">
          <div className="flex items-center gap-2 pl-1">
            <Cloud className="text-blue-400" size={24} strokeWidth={2.5} />
            <h1 className="text-xl font-black tracking-tight text-white">Weather<span className="text-blue-400 font-medium">Pro</span></h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden shadow-sm backdrop-blur-xl transition-all active:scale-95">
              {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={18} className="text-white/80" />}
            </button>
            <div className="w-[1px] h-6 bg-white/10 mx-1" />
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95 backdrop-blur-xl">
              <EyeOff size={18} />
            </button>
          </div>
        </header>

        <AnimatePresence>
          {isProfileOpen && (
            <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[28px] p-5 shadow-2xl mb-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden shrink-0 border border-white/20">
                  {userPhoto ? <img src={userPhoto} className="w-full h-full object-cover" /> : <User size={24} className="text-white/60" />}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{displayName}</p>
                  <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest">ID: {uid?.slice(0, 8)}</p>
                </div>
              </div>
              <button onClick={onLogout} className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-100 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                <LogOut size={14} />
                Logout Account
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Current Weather Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-2xl p-6 sm:p-8 rounded-[40px] mb-8 shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-white/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-all group-hover:bg-white/10" />
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin size={12} className="text-blue-300" />
                <p className="text-white/70 font-black text-[10px] uppercase tracking-[0.2em]">Live Radar</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-[80px] font-black text-white leading-none tracking-tighter" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                  {weatherData ? Math.round(weatherData.current.temperature_2m) : '--'}°
                </p>
              </div>
              <p className="text-blue-100 font-bold text-lg mt-2 flex items-center gap-2">
                {currentInfo?.icon}
                {currentInfo?.desc || 'Loading Radar...'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 relative z-10 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5 hover:bg-white/10 transition-colors">
               <ThermometerSun size={16} className="text-red-300 mb-1" />
               <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest mb-0.5">High</span>
               <span className="text-sm font-black text-white">{weatherData ? Math.round(weatherData.daily.temperature_2m_max[0]) : '--'}°</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5 hover:bg-white/10 transition-colors">
               <ThermometerSnowflake size={16} className="text-blue-300 mb-1" />
               <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest mb-0.5">Low</span>
               <span className="text-sm font-black text-white">{weatherData ? Math.round(weatherData.daily.temperature_2m_min[0]) : '--'}°</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5 hover:bg-white/10 transition-colors">
               <Droplets size={16} className="text-teal-300 mb-1" />
               <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest mb-0.5">Humidity</span>
               <span className="text-sm font-black text-white">{weatherData ? weatherData.current.relative_humidity_2m : '--'}%</span>
            </div>
          </div>
        </motion.div>

        {/* Hourly Forecast */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Hourly Forecast</p>
            <Activity size={14} className="text-white/40" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {weatherData ? (() => {
              const now = new Date().getTime();
              const startIndex = weatherData.hourly.time.findIndex((t: string) => new Date(t).getTime() >= now - 3600000);
              const safeIndex = startIndex >= 0 ? startIndex : 0;
              
              return weatherData.hourly.time.slice(safeIndex, safeIndex + 12).map((timeStr: string, index: number) => {
                const date = new Date(timeStr);
                const hours = date.getHours().toString().padStart(2, '0');
                const temp = Math.round(weatherData.hourly.temperature_2m[safeIndex + index]);
                const code = weatherData.hourly.weather_code[safeIndex + index];
                const info = getWeatherInfo(code, date.getHours() > 5 && date.getHours() < 19);

                return (
                  <div key={index} className="snap-start min-w-[76px] bg-white/10 backdrop-blur-xl border border-white/10 rounded-[24px] p-4 flex flex-col items-center gap-3 shadow-lg transition-transform hover:-translate-y-1">
                    <span className="text-[10px] font-black text-white/60">{hours}:00</span>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center drop-shadow-md">
                       {React.cloneElement(info.icon as any, { size: 16 })}
                    </div>
                    <span className="text-base font-black text-white">{temp}°</span>
                  </div>
                );
              });
            })() : [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="min-w-[76px] bg-white/5 backdrop-blur-xl border border-white/5 rounded-[24px] p-4 flex flex-col items-center gap-3 shadow-lg animate-pulse">
                <div className="h-3 w-8 bg-white/10 rounded-full"></div>
                <div className="w-8 h-8 bg-white/10 rounded-full" />
                <div className="h-4 w-6 bg-white/10 rounded-full"></div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Additional Weather Insights */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 space-y-4"
        >
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Atmospheric Data</p>
            <Wind size={14} className="text-white/40" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] p-5 shadow-lg group hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Wind size={14} className="text-blue-300" />
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Wind</span>
              </div>
              <p className="text-2xl font-black text-white">{weatherData ? weatherData.current.wind_speed_10m : '--'} <span className="text-sm font-bold text-white/50">km/h</span></p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] p-5 shadow-lg group hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <ThermometerSun size={14} className="text-orange-300" />
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Feels Like</span>
              </div>
              <p className="text-2xl font-black text-white">{weatherData ? Math.round(weatherData.current.apparent_temperature) : '--'}°</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] p-5 shadow-lg group hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Sun size={14} className="text-yellow-300" />
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">UV Index</span>
              </div>
              <p className="text-2xl font-black text-white">{weatherData ? Math.round(weatherData.daily.uv_index_max[0]) : '--'} <span className="text-sm font-bold text-white/50">Max</span></p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] p-5 shadow-lg group hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Cloud size={14} className="text-slate-300" />
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Rainfall</span>
              </div>
              <p className="text-2xl font-black text-white">{weatherData ? weatherData.current.precipitation : '--'} <span className="text-sm font-bold text-white/50">mm</span></p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
