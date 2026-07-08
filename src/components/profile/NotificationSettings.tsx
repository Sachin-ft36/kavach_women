import React, { useState } from 'react';
import { ArrowLeft, Bell, BellOff, ShieldAlert, Star, ShieldCheck, ChevronRight, Shield, Volume2, CheckCircle2, MessageSquare, Sliders } from 'lucide-react';
import { toast } from 'sonner';
import NotificationHeroBanner from './NotificationHeroBanner';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const [notificationMode, setNotificationMode] = useState('All');
  const [guardianAlerts, setGuardianAlerts] = useState(true);
  const [protectorUpdates, setProtectorUpdates] = useState(true);
  const [locationCheckins, setLocationCheckins] = useState(true);
  const [appUpdates, setAppUpdates] = useState(true);
  const [reportsActivity, setReportsActivity] = useState(false);
  const [vibration, setVibration] = useState(true);
  const [showPreview, setShowPreview] = useState(true);

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
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">Notifications</h1>
              <p className="text-[11px] text-gray-400 mt-0.5 font-normal">Manage how and when you're notified</p>
            </div>
          </div>
          <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Bell size={15} />
          </div>
        </header>

        {/* Hero Banner */}
        <NotificationHeroBanner />

        {/* NOTIFICATION MODE */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#c084fc] tracking-wider uppercase mb-1.5 px-1">Notification Mode</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] p-3 flex items-center justify-between shadow-sm">
            <div className="min-w-0 flex-1">
              <h4 className="text-[12px] font-medium text-white">Notification Mode</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Choose how you want to receive notifications.</p>
            </div>
            {/* Button selectors: All, Important, None */}
            <div className="bg-[#121020] border border-[#222135] p-0.5 rounded-lg flex items-center shrink-0">
              {['All', 'Important', 'None'].map(mode => (
                <button
                  key={mode}
                  onClick={() => { setNotificationMode(mode); toast.success(`Mode set to ${mode}`); }}
                  className={`px-3 py-1 rounded-md text-[9.5px] font-semibold transition-all cursor-pointer border-none ${
                    notificationMode === mode ? 'bg-[#6035f5] text-white' : 'text-slate-400 hover:text-slate-200 bg-transparent'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ALERT PREFERENCES */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#c084fc] tracking-wider uppercase mb-1.5 px-1">Alert Preferences</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* SOS Alerts */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <ShieldAlert size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">SOS Alerts</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Get notified about SOS triggers and emergencies</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-red-400 mr-1">Always</span>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Guardian Alerts */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Star size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Guardian Alerts</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Alerts from your guardians and family</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button 
                  onClick={() => {
                    setGuardianAlerts(!guardianAlerts);
                    toast.success(`Guardian alerts ${!guardianAlerts ? 'enabled' : 'disabled'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${guardianAlerts ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${guardianAlerts ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Protector Updates */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-450 shrink-0">
                  <Shield size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Protector Updates</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mission updates and protector activity</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button 
                  onClick={() => {
                    setProtectorUpdates(!protectorUpdates);
                    toast.success(`Protector updates ${!protectorUpdates ? 'enabled' : 'disabled'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${protectorUpdates ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${protectorUpdates ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Location & Check-ins */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Location &amp; Check-ins</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Alerts for check-ins, safe arrival and location sharing</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button 
                  onClick={() => {
                    setLocationCheckins(!locationCheckins);
                    toast.success(`Location alerts ${!locationCheckins ? 'enabled' : 'disabled'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${locationCheckins ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${locationCheckins ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* App Updates */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-[#7c4eff]/10 flex items-center justify-center text-[#9f80ff] shrink-0">
                  <Bell size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">App Updates &amp; Announcements</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">New features, tips and important announcements</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button 
                  onClick={() => {
                    setAppUpdates(!appUpdates);
                    toast.success(`App updates ${!appUpdates ? 'enabled' : 'disabled'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${appUpdates ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${appUpdates ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Reports & Activity */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400 shrink-0">
                  <MessageSquare size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Reports &amp; Activity</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">FIR updates, reports and other activity</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button 
                  onClick={() => {
                    setReportsActivity(!reportsActivity);
                    toast.success(`Reports & activity alerts ${!reportsActivity ? 'enabled' : 'disabled'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${reportsActivity ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${reportsActivity ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* QUIET HOURS */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#c084fc] tracking-wider uppercase mb-1.5 px-1">Quiet Hours</h3>
          <div 
            onClick={() => toast.info("Configure quiet hours intervals...")}
            className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] p-3 flex items-center justify-between shadow-sm cursor-pointer group hover:bg-[#141226] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8.5 h-8.5 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                <BellOff size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[12px] font-medium text-white">Quiet Hours</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Pause non-critical notifications during these hours</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-bold text-purple-400">10:00 PM – 7:00 AM</span>
              <ChevronRight size={13} className="text-slate-650" />
            </div>
          </div>
        </section>

        {/* ADDITIONAL SETTINGS */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#c084fc] tracking-wider uppercase mb-1.5 px-1">Additional Settings</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* Vibration */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <Sliders size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Vibration</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Vibrate for notifications</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button 
                  onClick={() => {
                    setVibration(!vibration);
                    toast.success(`Vibration toggled ${!vibration ? 'ON' : 'OFF'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${vibration ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${vibration ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Notification Sound */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors cursor-pointer group" onClick={() => toast.info("Open Sound picker popup")}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Volume2 size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Notification Sound</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Play sound for notifications</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold text-purple-400">KAVACH Alert</span>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Show Preview */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400 shrink-0">
                  <MessageSquare size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Show Preview</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Show notification content on lock screen</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button 
                  onClick={() => {
                    setShowPreview(!showPreview);
                    toast.success(`Show preview toggled ${!showPreview ? 'ON' : 'OFF'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${showPreview ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showPreview ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Footer Important Warning Banner */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[12px] p-3 flex items-center justify-between gap-3 text-left">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={16} className="text-[#00e599] shrink-0 mt-0.5" />
            <p className="text-[9.5px] text-slate-400 leading-normal">
              <span className="text-white font-semibold">Important:</span> SOS and critical safety alerts will always reach you, even in Quiet Hours.
            </p>
          </div>
          <span className="bg-[#00e599]/15 text-[#00e599] text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0">
            Always On
          </span>
        </div>

      </div>
    </div>
  );
}
