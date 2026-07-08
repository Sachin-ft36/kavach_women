import React, { useState } from 'react';
import { ArrowLeft, Moon, Sun, Monitor, Palette, Eye, Sliders, ToggleLeft, ToggleRight, Sparkles, Check, ChevronRight, Info } from 'lucide-react';
import { toast } from 'sonner';
import NotificationHeroBanner from './NotificationHeroBanner';
import { useUIStore } from '../../state/uiStore';
import { useKavachStore } from '../../state/useKavachStore';
interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeSettings({ isOpen, onClose }: ThemeSettingsProps) {
  const timeThemeOverride = useUIStore((state) => state.timeThemeOverride);
  const setTimeThemeOverride = useUIStore((state) => state.setTimeThemeOverride);
  const setActiveTab = useKavachStore((state) => state.setActiveTab);
  
  const [primaryColor, setPrimaryColor] = useState('Purple');
  const [accentColor, setAccentColor] = useState('Pink');
  const [iconStyle, setIconStyle] = useState('Rounded');
  const [textSize, setTextSize] = useState('Medium');
  const [trueBlack, setTrueBlack] = useState(true);
  const [blueLight, setBlueLight] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0b0914] overflow-y-auto px-4 pt-6 pb-24 font-sans text-slate-200">
      <div className="max-w-md mx-auto flex flex-col gap-4">

        {/* Header */}
        <header className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8.5 h-8.5 flex items-center justify-center text-slate-300 bg-[#121020]/80 border border-[#222135] hover:bg-[#1a1730] rounded-full active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="text-left">
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">Theme</h1>
              <p className="text-[11px] text-gray-400 mt-0.5 font-normal">Customize the look and feel of KAVACH</p>
            </div>
          </div>
          <div className="w-8.5 h-8.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Palette size={15} />
          </div>
        </header>

        {/* Showcase Banner */}
        <NotificationHeroBanner />

        {/* SELECT THEME */}
        <section className="text-left">
          <div className="flex justify-between items-center mb-2.5 px-1">
            <h3 className="text-[10px] font-semibold text-[#c084fc] tracking-wider uppercase">Select Time Theme</h3>
            <span className="text-[9px] text-gray-400 font-medium">Automatic or Manual</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Auto (System Default) Card */}
            <div
              onClick={() => { setTimeThemeOverride('auto'); toast.success("Theme set to Automatic"); setActiveTab('dashboard'); onClose(); }}
              className="relative cursor-pointer transition-all active:scale-95 flex flex-col rounded-[14px] overflow-hidden shrink-0 w-[100px]"
              style={{ border: timeThemeOverride === 'auto' ? '1.5px solid #8b5cf6' : '1.5px solid rgba(80,70,120,0.3)', background: 'linear-gradient(160deg,#14112a 0%,#0c0a1e 100%)' }}
            >
              <div className="relative w-full overflow-hidden" style={{ height: '60px' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #100e26 50%, #d4cded 50%)' }} />
                <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
                  <Monitor size={12} className="text-white/80" />
                </div>
              </div>
              <div className="absolute top-1.5 right-1.5">
                {timeThemeOverride === 'auto'
                  ? <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#8b5cf6', boxShadow: '0 2px 8px rgba(139,92,246,0.7)' }}><Check size={8} strokeWidth={3} color="white" /></div>
                  : <div className="w-4 h-4 rounded-full" style={{ border: '1.5px solid rgba(120,100,160,0.35)' }} />}
              </div>
              <div className="p-2 pt-1 text-left">
                <span className="text-[10px] font-bold text-white block">Auto</span>
                <p className="text-[7.5px] leading-tight mt-0.5" style={{ color: 'rgba(160,150,200,0.7)' }}>Syncs with real time</p>
              </div>
            </div>

            {/* Morning Card */}
            <div
              onClick={() => { setTimeThemeOverride('morning'); toast.success("Theme set to Morning"); setActiveTab('dashboard'); onClose(); }}
              className="relative cursor-pointer transition-all active:scale-95 flex flex-col rounded-[14px] overflow-hidden shrink-0 w-[100px]"
              style={{ border: timeThemeOverride === 'morning' ? '1.5px solid #22c55e' : '1.5px solid rgba(80,70,120,0.3)', background: 'linear-gradient(160deg,#1e293b 0%,#0f172a 100%)' }}
            >
              <div className="relative w-full flex items-center justify-center" style={{ height: '60px', background: 'linear-gradient(180deg,#cffafe 0%,#e0f2fe 100%)' }}>
                 <Sun size={18} className="text-amber-500" />
              </div>
              <div className="absolute top-1.5 right-1.5">
                {timeThemeOverride === 'morning'
                  ? <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#22c55e', boxShadow: '0 2px 8px rgba(34,197,94,0.7)' }}><Check size={8} strokeWidth={3} color="white" /></div>
                  : <div className="w-4 h-4 rounded-full" style={{ border: '1.5px solid rgba(120,100,160,0.35)' }} />}
              </div>
              <div className="p-2 pt-1 text-left">
                <span className="text-[10px] font-bold text-white block">Morning</span>
                <p className="text-[7.5px] leading-tight mt-0.5" style={{ color: 'rgba(160,150,200,0.7)' }}>Fresh & bright</p>
              </div>
            </div>

            {/* Afternoon Card */}
            <div
              onClick={() => { setTimeThemeOverride('afternoon'); toast.success("Theme set to Afternoon"); setActiveTab('dashboard'); onClose(); }}
              className="relative cursor-pointer transition-all active:scale-95 flex flex-col rounded-[14px] overflow-hidden shrink-0 w-[100px]"
              style={{ border: timeThemeOverride === 'afternoon' ? '1.5px solid #FF9333' : '1.5px solid rgba(80,70,120,0.3)', background: 'linear-gradient(160deg,#1e293b 0%,#0f172a 100%)' }}
            >
              <div className="relative w-full flex items-center justify-center" style={{ height: '60px', background: 'linear-gradient(180deg,#ffedd5 0%,#fed7aa 100%)' }}>
                 <Sun size={18} className="text-orange-500" />
              </div>
              <div className="absolute top-1.5 right-1.5">
                {timeThemeOverride === 'afternoon'
                  ? <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#FF9333', boxShadow: '0 2px 8px rgba(255,147,51,0.7)' }}><Check size={8} strokeWidth={3} color="white" /></div>
                  : <div className="w-4 h-4 rounded-full" style={{ border: '1.5px solid rgba(120,100,160,0.35)' }} />}
              </div>
              <div className="p-2 pt-1 text-left">
                <span className="text-[10px] font-bold text-white block">Afternoon</span>
                <p className="text-[7.5px] leading-tight mt-0.5" style={{ color: 'rgba(160,150,200,0.7)' }}>Warm & clear</p>
              </div>
            </div>

            {/* Evening Card */}
            <div
              onClick={() => { setTimeThemeOverride('evening'); toast.success("Theme set to Evening"); setActiveTab('dashboard'); onClose(); }}
              className="relative cursor-pointer transition-all active:scale-95 flex flex-col rounded-[14px] overflow-hidden shrink-0 w-[100px]"
              style={{ border: timeThemeOverride === 'evening' ? '1.5px solid #a855f7' : '1.5px solid rgba(80,70,120,0.3)', background: 'linear-gradient(160deg,#1e293b 0%,#0f172a 100%)' }}
            >
              <div className="relative w-full flex items-center justify-center" style={{ height: '60px', background: 'linear-gradient(180deg,#f3e8ff 0%,#e9d5ff 100%)' }}>
                 <Moon size={18} className="text-purple-500" />
              </div>
              <div className="absolute top-1.5 right-1.5">
                {timeThemeOverride === 'evening'
                  ? <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#a855f7', boxShadow: '0 2px 8px rgba(168,85,247,0.7)' }}><Check size={8} strokeWidth={3} color="white" /></div>
                  : <div className="w-4 h-4 rounded-full" style={{ border: '1.5px solid rgba(120,100,160,0.35)' }} />}
              </div>
              <div className="p-2 pt-1 text-left">
                <span className="text-[10px] font-bold text-white block">Evening</span>
                <p className="text-[7.5px] leading-tight mt-0.5" style={{ color: 'rgba(160,150,200,0.7)' }}>Calm twilight</p>
              </div>
            </div>

            {/* Night Card */}
            <div
              onClick={() => { setTimeThemeOverride('night'); toast.success("Theme set to Night"); setActiveTab('dashboard'); onClose(); }}
              className="relative cursor-pointer transition-all active:scale-95 flex flex-col rounded-[14px] overflow-hidden shrink-0 w-[100px]"
              style={{ border: timeThemeOverride === 'night' ? '1.5px solid #3b82f6' : '1.5px solid rgba(80,70,120,0.3)', background: 'linear-gradient(160deg,#14112a 0%,#0c0a1e 100%)' }}
            >
              <div className="relative w-full flex items-center justify-center" style={{ height: '60px', background: 'linear-gradient(180deg,#1e1b4b 0%,#0f172a 100%)' }}>
                 <Moon size={18} className="text-blue-400" />
              </div>
              <div className="absolute top-1.5 right-1.5">
                {timeThemeOverride === 'night'
                  ? <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#3b82f6', boxShadow: '0 2px 8px rgba(59,130,246,0.7)' }}><Check size={8} strokeWidth={3} color="white" /></div>
                  : <div className="w-4 h-4 rounded-full" style={{ border: '1.5px solid rgba(120,100,160,0.35)' }} />}
              </div>
              <div className="p-2 pt-1 text-left">
                <span className="text-[10px] font-bold text-white block">Night</span>
                <p className="text-[7.5px] leading-tight mt-0.5" style={{ color: 'rgba(160,150,200,0.7)' }}>Dark & focused</p>
              </div>
            </div>

          </div>
        </section>

        {/* THEME CUSTOMIZATION */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Theme Customization</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">

            {/* Primary Color */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Palette size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Primary Color</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose your primary theme color</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={primaryColor}
                  onChange={(e) => { setPrimaryColor(e.target.value); toast.success(`Primary color set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-purple-400 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer"
                >
                  <option value="Purple">Purple</option>
                  <option value="Indigo">Indigo</option>
                  <option value="Emerald">Emerald</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Accent Color */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
                  <Palette size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Accent Color</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose highlighting accent color</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={accentColor}
                  onChange={(e) => { setAccentColor(e.target.value); toast.success(`Accent color set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-purple-400 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer"
                >
                  <option value="Pink">Pink</option>
                  <option value="Violet">Violet</option>
                  <option value="Teal">Teal</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Icon Style */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Sliders size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Icon Style</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Select preferred style of icons</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={iconStyle}
                  onChange={(e) => { setIconStyle(e.target.value); toast.success(`Icon style set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-purple-400 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer"
                >
                  <option value="Rounded">Rounded</option>
                  <option value="Sharp">Sharp</option>
                  <option value="Minimal">Minimal</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Text Size */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                  <Sliders size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Text Size</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Adjust text size for better readability</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={textSize}
                  onChange={(e) => { setTextSize(e.target.value); toast.success(`Text size set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-purple-400 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer"
                >
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

          </div>
        </section>

        {/* EXTRAS */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Extras</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">

            {/* True Black Mode */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-[#a855f7]/10 flex items-center justify-center text-[#a855f7] shrink-0">
                  <Sparkles size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[12px] font-medium text-white">True Black Mode</h4>
                    <span className="bg-[#a855f7]/25 text-[#d8b4fe] text-[7.5px] px-1 py-0.2 rounded font-semibold tracking-wide uppercase">
                      PRO
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Use pure black background for AMOLED screens</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button
                  onClick={() => {
                    setTrueBlack(!trueBlack);
                    toast.success(`True Black Mode toggled ${!trueBlack ? 'ON' : 'OFF'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${trueBlack ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${trueBlack ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Reduce Blue Light */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Eye size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Reduce Blue Light</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Warmer colors for comfortable night use</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button
                  onClick={() => {
                    setBlueLight(!blueLight);
                    toast.success(`Blue light reduction toggled ${!blueLight ? 'ON' : 'OFF'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${blueLight ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${blueLight ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Footer info box */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-[12px] p-3 flex items-start gap-2.5 text-left">
          <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[9.5px] text-slate-400 leading-relaxed">
            Your style, your safety. A personalized experience that keeps you focused and protected.
          </p>
        </div>

      </div>
    </div>
  );
}
