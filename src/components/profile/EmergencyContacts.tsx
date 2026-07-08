import React, { useState } from 'react';
import { ArrowLeft, UserPlus, PhoneCall, MessageSquare, Plus, Bell, MessageSquareCode, ShieldCheck, ChevronRight, Info, Check, Star, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyContactsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencyContacts({ isOpen, onClose }: EmergencyContactsProps) {
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Neha Singh', phone: '+91 98765 43210', category: 'Guardian', type: 'Primary', active: true, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 2, name: 'Rohit Singh', phone: '+91 91234 56789', category: 'Brother', type: 'Priority', active: true, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 3, name: 'Maa', phone: '+91 99887 76655', category: 'Family', type: 'Secondary', active: true, image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
    { id: 4, name: 'Rajesh Kumar', phone: '+91 90000 11122', category: 'Neighbour', type: 'Secondary', active: true, image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }
  ]);

  const [alertPref, setAlertPref] = useState('SMS, Call & Push');
  const [msgType, setMsgType] = useState('Default Message');

  if (!isOpen) return null;

  const toggleContact = (id: number) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, active: !c.active } : c));
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      toast.success(`${contact.name} status updated`);
    }
  };

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
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">Emergency Contacts</h1>
              <p className="text-[11px] text-gray-400 mt-0.5 font-normal">People who will be notified during an emergency</p>
            </div>
          </div>
          <button 
            onClick={() => toast.info("Add contact popup")}
            className="w-8.5 h-8.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 cursor-pointer"
          >
            <UserPlus size={15} />
          </button>
        </header>

        {/* Stay Connected SOS Pulser Banner */}
        <section
          className="relative overflow-hidden rounded-[18px] p-4 flex items-center gap-3 text-left shadow-xl"
          style={{ background: 'linear-gradient(135deg,#1a0508 0%,#0d0306 100%)', border: '1px solid rgba(180,30,60,0.25)' }}
        >
          {/* Background glow */}
          <div className="pointer-events-none absolute -left-6 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle,rgba(220,30,60,0.18) 0%,transparent 70%)' }} />

          {/* SOS circle with floating icons */}
          <div className="relative shrink-0 w-28 h-28 flex items-center justify-center">
            {/* Pulsing rings */}
            <div className="absolute w-[88%] h-[88%] rounded-full bg-red-500/10 " />
            <div className="absolute w-[72%] h-[72%] rounded-full bg-red-500/15 " />
            {/* SOS button */}
            <div
              className="relative z-10 w-18 h-18 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#e53e3e 0%,#9b1c1c 100%)', boxShadow: '0 0 28px rgba(220,40,60,0.6), 0 6px 18px rgba(0,0,0,0.45)' }}
            >
              <span className="text-[13px] font-black text-white tracking-widest">SOS</span>
            </div>
            {/* Floating: phone top-left */}
            <div className="absolute top-[2px] left-[2px] w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(180,30,60,0.25)', border: '1px solid rgba(220,50,70,0.3)', zIndex: 20 }}>
              <PhoneCall size={9.5} color="#f87171" />
            </div>
            {/* Floating: chat bottom-left */}
            <div className="absolute bottom-[2px] left-[2px] w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(80,60,180,0.25)', border: '1px solid rgba(120,90,200,0.3)', zIndex: 20 }}>
              <MessageSquare size={9.5} color="#a78bfa" />
            </div>
            {/* Floating: pin top-right */}
            <div className="absolute top-[2px] right-[2px] w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(180,30,60,0.2)', border: '1px solid rgba(220,50,70,0.25)', zIndex: 20 }}>
              <ShieldAlert size={9.5} color="#f87171" />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[12.5px] font-bold text-white leading-snug mb-0.5">Stay connected in critical moments</h2>
            <p className="text-[8.5px] leading-relaxed" style={{ color: 'rgba(200,180,200,0.8)' }}>
              When you trigger an SOS, your emergency contacts will be alerted instantly with your live location and can take quick action.
            </p>
            {/* Feature badges */}
            <div className="flex flex-col gap-0.5 mt-1.5">
              <div className="flex items-center gap-1.5 text-[8px] font-semibold" style={{ color: '#f87171' }}>
                <Bell size={8} /><span>Instant Alerts</span>
                <span className="text-[7.5px] font-normal" style={{ color: 'rgba(200,180,200,0.6)' }}>SMS, Call &amp; Push</span>
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-semibold" style={{ color: '#f87171' }}>
                <ShieldCheck size={8} /><span>Live Location</span>
                <span className="text-[7.5px] font-normal" style={{ color: 'rgba(200,180,200,0.6)' }}>Real-time updates</span>
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-semibold" style={{ color: '#f87171' }}>
                <Check size={8} /><span>Your Safety</span>
                <span className="text-[7.5px] font-normal" style={{ color: 'rgba(200,180,200,0.6)' }}>Always our priority</span>
              </div>
            </div>
          </div>
        </section>

        {/* EMERGENCY CONTACTS LIST */}
        <section className="text-left">
          <div className="flex justify-between items-baseline mb-2 px-1">
            <h3 className="text-[10.5px] font-bold text-[#a855f7] tracking-wider uppercase">Emergency Contacts ({contacts.length}/5)</h3>
            <span className="text-[9.5px] font-medium" style={{ color: '#f87171' }}>You can add 1 more contact</span>
          </div>

          <div className="flex flex-col gap-2">
            {contacts.map((c, index) => (
              <div key={c.id} className="rounded-[14px] p-2.5 flex items-center justify-between shadow-sm relative" style={{ background: 'rgba(14,12,28,0.95)', border: '1px solid rgba(60,50,100,0.35)' }}>
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Number badge */}
                  <div
                    className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ background: 'rgba(180,30,60,0.2)', border: '1.2px solid rgba(220,50,70,0.35)' }}
                  >
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img src={c.image} alt={c.name} className="w-10 h-10 rounded-full object-cover" style={{ border: '1.5px solid rgba(100,80,180,0.4)' }} />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#0e0c1c]" style={{ background: '#00e599' }} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-[12px] font-bold text-white leading-tight">{c.name}</h4>
                      <span
                        className="text-[7px] px-1 py-0.2 rounded font-bold tracking-wider uppercase"
                        style={{ background: 'rgba(14,100,220,0.15)', color: '#c084fc', border: '0.5px solid rgba(160,120,220,0.25)' }}
                      >
                        {c.category}
                      </span>
                    </div>
                    <p className="text-[9.5px] mt-0.5" style={{ color: 'rgba(180,170,220,0.7)' }}>{c.phone}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => toast.success(`Calling ${c.name}...`)} className="flex items-center gap-1 cursor-pointer bg-transparent border-none" style={{ fontSize: '9px', color: 'rgba(200,190,230,0.85)' }}>
                        <PhoneCall size={9} color="#00e599" /> Call
                      </button>
                      <span style={{ color: 'rgba(120,110,160,0.4)', fontSize: '8px' }}>|</span>
                      <button onClick={() => toast.success(`SMS dialog opened for ${c.name}`)} className="flex items-center gap-1 cursor-pointer bg-transparent border-none" style={{ fontSize: '9px', color: 'rgba(200,190,230,0.85)' }}>
                        <MessageSquare size={9} color="#a78bfa" /> SMS
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {/* Role badge */}
                  {c.type === 'Primary' && (
                    <span className="text-[7.5px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wide flex items-center gap-0.5" style={{ background: 'transparent', border: '1.2px solid #f87171', color: '#f87171' }}>
                      <svg width="7.5" height="7.5" viewBox="0 0 24 24" fill="#f87171"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z"/></svg> PRIMARY
                    </span>
                  )}
                  {c.type === 'Priority' && (
                    <span className="text-[7.5px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wide flex items-center gap-0.5" style={{ background: 'transparent', border: '1.2px solid #f59e0b', color: '#f59e0b' }}>
                      <Star size={6.5} className="fill-amber-400" /> PRIORITY
                    </span>
                  )}
                  {c.type === 'Secondary' && (
                    <span className="text-[7.5px] px-1.5 py-0.5 rounded-md font-medium uppercase tracking-wide" style={{ background: 'transparent', border: '1.2px solid rgba(100,90,140,0.5)', color: 'rgba(160,150,200,0.8)' }}>
                      SECONDARY
                    </span>
                  )}

                  {/* Toggle */}
                  <button
                    onClick={() => toggleContact(c.id)}
                    className={`w-9 h-4.5 rounded-full relative transition-colors shrink-0 ${c.active ? 'bg-[#6035f5]' : 'bg-slate-700'}`}
                  >
                    <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${c.active ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Emergency Contact */}
            <div
              onClick={() => toast.info("Add contact popup")}
              className="rounded-[14px] p-3.5 flex items-center gap-3 cursor-pointer transition-all active:scale-95"
              style={{ background: 'rgba(14,12,28,0.7)', border: '1px solid rgba(60,50,100,0.3)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#6035f5 0%,#4820c8 100%)', boxShadow: '0 4px 12px rgba(96,53,245,0.4)' }}
              >
                <Plus size={18} color="white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="text-[12px] font-bold text-white block">Add Emergency Contact</span>
                <span className="text-[9px]" style={{ color: 'rgba(160,150,200,0.7)' }}>Add a trusted person who can help you in case of an emergency.</span>
              </div>
              <ChevronRight size={16} color="rgba(140,120,200,0.6)" />
            </div>

          </div>
        </section>

        {/* ALERT SETTINGS */}
        <section className="text-left">
          <h3 className="text-[10px] font-semibold text-[#a855f7] tracking-wider uppercase mb-1.5 px-1">Alert Settings</h3>
          <div className="bg-[#0d0c1b] border border-[#222135] rounded-[12px] divide-y divide-[#222135] overflow-hidden shadow-sm">
            
            {/* Alert Preferences */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bell size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Alert Preferences</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Choose how your contacts are notified</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select 
                  value={alertPref} 
                  onChange={(e) => { setAlertPref(e.target.value); toast.success(`Alert preference set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-purple-400 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer"
                >
                  <option value="SMS, Call & Push">SMS, Call &amp; Push</option>
                  <option value="SMS Only">SMS Only</option>
                  <option value="Call Only">Call Only</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

            {/* Message to Send */}
            <div className="flex items-center justify-between py-2.5 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-450 shrink-0">
                  <MessageSquareCode size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-medium text-white">Message to Send</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Customize the message sent during SOS</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <select 
                  value={msgType} 
                  onChange={(e) => { setMsgType(e.target.value); toast.success(`SOS message set to ${e.target.value}`); }}
                  className="bg-[#121020] border border-[#222135] text-[9.5px] text-purple-400 font-medium px-2 py-0.8 rounded focus:outline-none cursor-pointer"
                >
                  <option value="Default Message">Default Message</option>
                  <option value="Custom message">Custom message</option>
                </select>
                <ChevronRight size={13} className="text-slate-650" />
              </div>
            </div>

          </div>
        </section>

        {/* Footer info box */}
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-[12px] p-3 flex items-start gap-2.5 text-left">
          <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[9.5px] text-slate-400 leading-relaxed">
            Your information is always safe. Your contacts are secure and will only be used during emergencies.
          </p>
        </div>

      </div>
    </div>
  );
}
