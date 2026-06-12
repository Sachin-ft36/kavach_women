import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Sun, Moon, Zap } from 'lucide-react';

export function useWeatherSync(userPos: { lat: number, lng: number } | null) {
  const [weatherData, setWeatherData] = useState<any>(null);

  useEffect(() => {
    // Fallback to New Delhi coordinates if userPos is not available yet
    const lat = userPos && userPos.lat !== undefined ? userPos.lat : 28.6139;
    const lng = userPos && userPos.lng !== undefined ? userPos.lng : 77.2090;

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&hourly=temperature_2m,weather_code,precipitation_probability&timezone=auto`)
      .then(res => res.json())
      .then(data => setWeatherData(data))
      .catch(console.error);
  }, [userPos]);

  const getWeatherInfo = (code: number, isDay: boolean = true) => {
    // WMO Weather interpretation codes with Unsplash realistic backgrounds
    if (code === 0) return { 
        desc: 'Clear Sky', 
        icon: isDay ? React.createElement(Sun, { className: "text-amber-400" }) : React.createElement(Moon, { className: "text-indigo-300" }), 
        bg: 'bg-gradient-to-br from-blue-500 to-indigo-800',
        bgImage: isDay ? 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&q=80&w=1080' : 'https://images.unsplash.com/photo-1532704868953-d85f24176d73?auto=format&fit=crop&q=80&w=1080'
    };
    if (code <= 3) return { 
        desc: 'Partly Cloudy', 
        icon: React.createElement(Cloud, { className: "text-slate-200" }), 
        bg: 'bg-gradient-to-br from-slate-600 to-slate-900',
        bgImage: 'https://images.unsplash.com/photo-1534088568595-a066f410cbda?auto=format&fit=crop&q=80&w=1080'
    };
    if (code <= 48) return { 
        desc: 'Foggy', 
        icon: React.createElement(Cloud, { className: "text-slate-400" }), 
        bg: 'bg-gradient-to-br from-gray-500 to-gray-800',
        bgImage: 'https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?auto=format&fit=crop&q=80&w=1080'
    };
    if (code <= 55) return { 
        desc: 'Drizzle', 
        icon: React.createElement(Cloud, { className: "text-blue-300" }), 
        bg: 'bg-gradient-to-br from-slate-700 to-blue-900',
        bgImage: 'https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&q=80&w=1080'
    };
    if (code <= 65) return { 
        desc: 'Rainy', 
        icon: React.createElement(Droplets, { className: "text-blue-400" }), 
        bg: 'bg-gradient-to-br from-slate-800 to-blue-950',
        bgImage: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=1080'
    };
    if (code <= 75) return { 
        desc: 'Snow', 
        icon: React.createElement(Cloud, { className: "text-white" }), 
        bg: 'bg-gradient-to-br from-slate-400 to-slate-700',
        bgImage: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&q=80&w=1080'
    };
    if (code >= 95) return { 
        desc: 'Thunderstorm', 
        icon: React.createElement(Zap, { className: "text-amber-400" }), 
        bg: 'bg-gradient-to-br from-gray-900 to-black',
        bgImage: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0ce49?auto=format&fit=crop&q=80&w=1080'
    };
    return { 
        desc: 'Clear', 
        icon: React.createElement(Sun, { className: "text-amber-400" }), 
        bg: 'bg-gradient-to-br from-blue-500 to-indigo-800',
        bgImage: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&q=80&w=1080'
    };
  };

  const isDaytime = weatherData ? weatherData.current.is_day !== 0 : true;
  const currentInfo = weatherData ? getWeatherInfo(weatherData.current.weather_code, isDaytime) : null;

  return { weatherData, currentInfo, getWeatherInfo, isDaytime };
}
