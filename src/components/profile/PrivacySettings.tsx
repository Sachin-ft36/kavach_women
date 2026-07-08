import React, { useState } from 'react';
import { ArrowLeft, Shield, ShieldCheck, ChevronRight, User, Clock, MapPin, Activity, Lock, Database, Download, Trash2, MessageSquare, PhoneCall, Bell, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface PrivacySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacySettings({ isOpen, onClose }: PrivacySettingsProps) {
  const [activityStatus, setActivityStatus] = useState(true);
  const [profileVis, setProfileVis] = useState('Friends');
  const [lastSeenVis, setLastSeenVis] = useState('Friends');
  const [locationVis, setLocationVis] = useState('Friends');
  const [msgVis, setMsgVis] = useState('Friends');
  const [callVis, setCallVis] = useState('Friends');

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
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">Privacy Settings</h1>
              <p className="text-[11px] text-gray-400 mt-0.5 font-normal">You're in control of your data and privacy</p>
            </div>
          </div>

          {/* Glowing Lock Shield Icon */}
          <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Lock size={15} className="text-purple-400" />
          </div>
        </header>

        {/* Top Banner Card */}
        <section className="bg-gradient-to-br from-[#1b103c]/90 to-[#0e0724]/95 border border-[#302157] rounded-[18px] p-3.5 flex items-center gap-3.5 relative overflow-hidden text-left shadow-lg">
          {/* Shield Outline Icon */}
          <div className="w-12 h-12 shrink-0 relative flex items-center justify-center bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <div className="absolute inset-0 flex items-center justify-center text-purple-400 opacity-20 ">
              <Shield className="w-9 h-9" />
            </div>
            <User className="w-5 h-5 text-purple-400 relative z-10" />
          </div>

          <div className="flex-1">
            <h2 className="text-[13px] font-semibold text-white">Your Privacy, Your Choice</h2>
            <p className="text-[10px] text-slate-400 font-normal leading-relaxed mt-0.5">
              Manage what information is visible, who can see it, and how your data is used.
            </p>
            <span 
              onClick={() => toast.info("Privacy learning center opening...")}
              className="text-[10px] font-medium text-[#a855f7] hover:text-[#c084fc] inline-flex items-center gap-1 mt-1.5 cursor-pointer"
            >
              Learn more about privacy &gt;
            </span>
          </div>
        </section>

        {/* PROFILE VISIBILITY */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Profile Visibility</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* Profile Visibility Dropdown */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <User size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Profile Visibility</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose who can see your profile</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select 
                  value={profileVis} 
                  onChange={(e) => { setProfileVis(e.target.value); toast.success(`Profile visibility set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-slate-300 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer"
                >
                  <option value="Everyone">Everyone</option>
                  <option value="Friends">Friends</option>
                  <option value="Nobody">Nobody</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Last Seen Dropdown */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Clock size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Last Seen</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose who can see your last seen</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select 
                  value={lastSeenVis} 
                  onChange={(e) => { setLastSeenVis(e.target.value); toast.success(`Last seen visibility set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-slate-300 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer"
                >
                  <option value="Everyone">Everyone</option>
                  <option value="Friends">Friends</option>
                  <option value="Nobody">Nobody</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Location Visibility Dropdown */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <MapPin size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Location Visibility</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose who can see your live location</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select 
                  value={locationVis} 
                  onChange={(e) => { setLocationVis(e.target.value); toast.success(`Location visibility set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-slate-300 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer"
                >
                  <option value="Everyone">Everyone</option>
                  <option value="Friends">Friends</option>
                  <option value="Nobody">Nobody</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Activity Status Toggle */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                  <Activity size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Activity Status</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Show when you're active</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button 
                  onClick={() => {
                    setActivityStatus(!activityStatus);
                    toast.success(`Activity status toggled ${!activityStatus ? 'ON' : 'OFF'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-colors ${activityStatus ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${activityStatus ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Data Sharing */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors group cursor-pointer" onClick={() => toast.info("Data Sharing controls opening...")}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <User size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Data Sharing</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Control how your data is used</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-650 group-hover:text-slate-400 transition-colors ml-2" />
            </div>

          </div>
        </section>

        {/* PERMISSIONS & DATA */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Permissions &amp; Data</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* Permission Manager */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors group cursor-pointer" onClick={() => toast.info("App Permission settings opening...")}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Lock size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Permission Manager</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Manage app permissions</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-650 group-hover:text-slate-400 transition-colors ml-2" />
            </div>

            {/* Data Usage */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors group cursor-pointer" onClick={() => toast.info("Data Usage breakdown loading...")}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Database size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Data Usage</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">View how your data is used in the app</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-650 group-hover:text-slate-400 transition-colors ml-2" />
            </div>

            {/* Download Your Data */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors group cursor-pointer">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <div className="w-8.5 h-8.5 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Download size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Download Your Data</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Get a copy of your data</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => toast.success("Data export request sent! Check your email soon.")}
                  className="border border-[#7C4DFF]/40 text-[#a874ff] hover:bg-[#7C4DFF]/10 px-2.5 py-1 rounded text-[9.5px] font-semibold cursor-pointer bg-transparent"
                >
                  Request
                </button>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Clear Local Data */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors group cursor-pointer">
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <div className="w-8.5 h-8.5 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Clear Local Data</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Clear cached data from this device</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => {
                    localStorage.removeItem('kavach_guardian_cache');
                    toast.success("Local cache cleared successfully!");
                  }}
                  className="border border-red-500/30 text-red-400 hover:bg-red-500/10 px-2.5 py-1 rounded text-[9.5px] font-semibold cursor-pointer bg-transparent"
                >
                  Clear
                </button>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

          </div>
        </section>

        {/* COMMUNICATION PRIVACY */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Communication Privacy</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* Message Privacy */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                  <MessageSquare size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Message Privacy</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose who can message you</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select 
                  value={msgVis} 
                  onChange={(e) => { setMsgVis(e.target.value); toast.success(`Message privacy set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-slate-300 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer"
                >
                  <option value="Everyone">Everyone</option>
                  <option value="Friends">Friends</option>
                  <option value="Nobody">Nobody</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Call Privacy */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <PhoneCall size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Call Privacy</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose who can call you</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select 
                  value={callVis} 
                  onChange={(e) => { setCallVis(e.target.value); toast.success(`Call privacy set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-slate-300 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer"
                >
                  <option value="Everyone">Everyone</option>
                  <option value="Friends">Friends</option>
                  <option value="Nobody">Nobody</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.01] transition-colors group cursor-pointer" onClick={() => toast.info("Privacy Notification settings loading...")}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Bell size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Notification Preferences</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Manage what notifications you receive</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-650 group-hover:text-slate-400 transition-colors ml-2" />
            </div>

          </div>
        </section>

        {/* Footer Safety Card */}
        <div className="bg-[#051c14] border border-[#064e3b]/35 rounded-[16px] p-3.5 flex items-center justify-between gap-3 text-left">
          <div className="flex items-start gap-3 flex-1 pr-2">
            <div className="w-8.5 h-8.5 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck size={16} className="fill-emerald-400/10" />
            </div>
            <div>
              <h4 className="text-[12.5px] font-medium text-white">Your data is secure with KAVACH</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                We use industry-standard encryption and never share your personal data.
              </p>
            </div>
          </div>
          <button 
            onClick={() => toast.info("Privacy Policy document loading...")}
            className="border border-[#10b981]/30 text-[#10b981] hover:bg-[#10b981]/10 px-2.5 py-1.5 rounded-lg text-[9.5px] font-semibold cursor-pointer transition-all flex items-center gap-1 shrink-0 bg-transparent"
          >
            <FileText size={11} /> Policy
          </button>
        </div>

        {/* Bottom Lock Commitment */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-normal">
          <Lock size={11} /> KAVACH is committed to protecting your privacy.
        </div>

      </div>
    </div>
  );
}
