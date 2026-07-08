import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Lock, Users, Home, Building2, User, Camera, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ShareCheckInProps {
  onBack: () => void;
  onDone: (selectedGroups: string[], selectedContacts: string[]) => void;
  capturedPhoto: string | null;
  selectedStatus: string;
}

export default function ShareCheckIn({ onBack, onDone, capturedPhoto, selectedStatus }: ShareCheckInProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'contacts'>('all');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['Family']);
  const [selectedContacts, setSelectedContacts] = useState<string[]>(['Mom', 'Rohit (Bf)']);

  const groups = [
    { id: 'Family', name: 'Family ❤️', count: 5, icon: Users, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    { id: 'Friends', name: 'Friends 👭', count: 8, icon: Users, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { id: 'Office', name: 'Office 👩‍💼', count: 6, icon: Building2, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { id: 'Hostel', name: 'Hostel 🏡', count: 4, icon: Home, color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  ];

  const contacts = [
    { id: 'Mom', name: 'Mom', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?fit=crop&w=100&h=100', online: true },
    { id: 'Dad', name: 'Dad', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=100&h=100', online: true },
    { id: 'Rohit (Bf)', name: 'Rohit (Bf)', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=100&h=100', online: true },
    { id: 'Best Friend', name: 'Best Friend', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=100&h=100', online: true },
    { id: 'Ankita', name: 'Ankita', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?fit=crop&w=100&h=100', online: true },
  ];

  const toggleGroup = (id: string) => {
    if (selectedGroups.includes(id)) {
      setSelectedGroups(selectedGroups.filter(g => g !== id));
    } else {
      setSelectedGroups([...selectedGroups, id]);
    }
  };

  const toggleContact = (id: string) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(c => c !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto px-4 pt-4 flex flex-col h-full z-[100000] pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={onBack} 
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex flex-col items-center text-center">
          <h2 className="text-[17px] font-black text-white tracking-wide">Share With</h2>
          <span className="text-[10px] text-gray-400 font-semibold mt-0.5">Choose who can see this</span>
        </div>
        <div className="w-9 h-9" /> {/* Spacer */}
      </div>

      {/* Captured Preview thumbnail */}
      {capturedPhoto && (
        <div className="bg-[#120e2b]/80 border border-[#2a1758]/40 rounded-2xl p-2.5 flex items-center gap-3 mb-4 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <img src={capturedPhoto} className="w-[50px] h-[70px] rounded-lg object-cover border border-white/10" alt="check-in status snapshot" />
          <div className="flex flex-col justify-center text-left">
            <span className="text-[12px] font-bold text-white">Status: {selectedStatus}</span>
            <span className="text-[9.5px] text-[#c084fc] font-semibold mt-1">Photo captured & encrypted</span>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="bg-[#120f1e]/90 border border-white/5 rounded-full p-1 flex gap-1 mb-5">
        {(['all', 'groups', 'contacts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer border-none",
              activeTab === tab 
                ? "bg-gradient-to-tr from-[#9000FF] via-[#ec4899] to-[#3b82f6] text-white shadow-lg"
                : "text-gray-400 hover:text-white bg-transparent"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 overflow-y-auto pr-1 pb-4 flex-1">
        {/* Groups List */}
        {(activeTab === 'all' || activeTab === 'groups') && (
          <div className="flex flex-col text-left">
            <h3 className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-2.5 px-1">Groups</h3>
            <div className="flex flex-col gap-2">
              {groups.map((group) => {
                const GroupIcon = group.icon;
                const isSelected = selectedGroups.includes(group.id);
                return (
                  <div 
                    key={group.id} 
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      "flex items-center justify-between bg-[#120f1e]/75 border rounded-[20px] p-3 cursor-pointer transition-all active:scale-[0.99] hover:bg-[#120f1e]/90",
                      isSelected ? "border-[#ec4899]/50 shadow-[0_0_12px_rgba(236,72,153,0.15)]" : "border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center border", group.color)}>
                        <GroupIcon size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-gray-100">{group.name}</span>
                        <span className="text-[10px] text-gray-400 font-semibold mt-0.5">{group.count} Members</span>
                      </div>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected 
                        ? "bg-[#ec4899] border-[#ec4899] text-white shadow-[0_0_8px_#ec4899]" 
                        : "border-white/20 bg-transparent"
                    )}>
                      {isSelected && <Check size={12} className="stroke-[3.5px]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contacts List */}
        {(activeTab === 'all' || activeTab === 'contacts') && (
          <div className="flex flex-col text-left">
            <h3 className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-2.5 px-1">Contacts</h3>
            <div className="flex flex-col gap-2">
              {contacts.map((contact) => {
                const isSelected = selectedContacts.includes(contact.id);
                return (
                  <div 
                    key={contact.id} 
                    onClick={() => toggleContact(contact.id)}
                    className={cn(
                      "flex items-center justify-between bg-[#120f1e]/75 border rounded-[20px] p-3 cursor-pointer transition-all active:scale-[0.99] hover:bg-[#120f1e]/90",
                      isSelected ? "border-[#ec4899]/50 shadow-[0_0_12px_rgba(236,72,153,0.15)]" : "border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9">
                        <img src={contact.photo} className="w-full h-full rounded-full object-cover border border-white/10" alt={contact.name} />
                        {contact.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-[9px] h-[9px] rounded-full border-2 border-[#120f1e] bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-gray-100">{contact.name}</span>
                        <span className="text-[9.5px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 " /> Online
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[#ec4899] hover:bg-white/10 active:scale-95 transition-all">
                        <Camera size={14} />
                      </button>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected 
                          ? "bg-[#ec4899] border-[#ec4899] text-white shadow-[0_0_8px_#ec4899]" 
                          : "border-white/20 bg-transparent"
                      )}>
                        {isSelected && <Check size={12} className="stroke-[3.5px]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Done Button Container */}
      <div className="pt-3 pb-6 flex flex-col items-center gap-3 bg-[#05060F] border-t border-white/5">
        <button
          onClick={() => onDone(selectedGroups, selectedContacts)}
          className="w-full py-3.5 rounded-[24px] bg-gradient-to-tr from-[#9000FF] via-[#ec4899] to-[#3b82f6] text-white font-extrabold text-[13.5px] uppercase tracking-widest shadow-[0_8px_25px_rgba(144,0,255,0.4)] cursor-pointer hover:opacity-95 active:scale-[0.98] transition-all border-none"
        >
          DONE
        </button>
        <span className="text-[9px] text-gray-400 font-bold tracking-wider flex items-center gap-1 uppercase">
          <Lock size={10} className="text-gray-400" /> Only selected people can see this
        </span>
      </div>
    </div>
  );
}
