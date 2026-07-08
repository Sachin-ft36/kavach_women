import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Headphones, 
  ShieldCheck, 
  MessageSquare, 
  Mail, 
  Phone, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  User, 
  Paperclip, 
  Upload, 
  Send,
  Lock,
  Compass
} from 'lucide-react';
import { toast } from 'sonner';

interface ContactSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactSupport({ isOpen, onClose }: ContactSupportProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter your message");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Support ticket sent successfully!");
      setName('');
      setCategory('');
      setMessage('');
    }, 1500);
  };

  const supportMethods = [
    {
      title: 'Chat with us',
      desc: 'Instant support from our team',
      icon: <MessageSquare size={18} className="text-white" />,
      iconBg: 'bg-[#7c4dff] shadow-[0_0_12px_rgba(124,77,255,0.4)]',
      border: 'border-[#7c4dff]/20 hover:border-[#7c4dff]/50'
    },
    {
      title: 'Email us',
      desc: "We'll reply within 24 hours",
      icon: <Mail size={18} className="text-white" />,
      iconBg: 'bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.4)]',
      border: 'border-[#10b981]/20 hover:border-[#10b981]/50'
    },
    {
      title: 'Call us',
      desc: 'Talk to our support team',
      icon: <Phone size={18} className="text-white fill-white/10" />,
      iconBg: 'bg-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.4)]',
      border: 'border-[#f59e0b]/20 hover:border-[#f59e0b]/50'
    },
    {
      title: 'Submit a ticket',
      desc: 'Create a ticket for detailed help',
      icon: <FileText size={18} className="text-white" />,
      iconBg: 'bg-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.4)]',
      border: 'border-[#3b82f6]/20 hover:border-[#3b82f6]/50'
    }
  ];

  const socialChannels = [
    {
      name: 'WhatsApp',
      handle: '+91 98765 43210',
      time: 'Mon - Sun | 24/7',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-450 fill-emerald-500/10" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
      iconBg: 'bg-emerald-500/10 border-emerald-500/15',
      timeColor: 'text-emerald-500'
    },
    {
      name: 'Twitter',
      handle: '@KavachSupport',
      time: 'Mon - Sun | 24/7',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-sky-400 fill-sky-500/10" stroke="currentColor" strokeWidth="2">
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
        </svg>
      ),
      iconBg: 'bg-sky-500/10 border-sky-500/15',
      timeColor: 'text-sky-400'
    },
    {
      name: 'Instagram',
      handle: 'kavach.app',
      time: 'Mon - Sun | 24/7',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-rose-400 fill-rose-500/10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
      iconBg: 'bg-rose-500/10 border-rose-500/15',
      timeColor: 'text-rose-400'
    }
  ];

  return (
    <div className="fixed inset-0 z-[1000] bg-[#07050f] overflow-y-auto px-4 pt-6 pb-24 font-sans text-slate-200 selection:bg-[#8b5cf6]/30">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        
        {/* Header Section */}
        <header className="flex items-center justify-between mb-1 relative overflow-visible">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-slate-300 bg-[#121020]/90 border border-[#2b254d] hover:bg-[#1a1630] rounded-full transition-colors cursor-pointer shadow-md"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-left">
              <h1 className="text-lg font-black text-white tracking-tight leading-tight">Contact Support</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">We're here to help you 24/7</p>
            </div>
          </div>
          
          {/* Header 3D Headphones Graphic */}
          <div className="absolute right-[-10px] top-[-22px] w-24 h-24 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full text-[#7c4dff]">
              {/* Outer Star particles */}
              <text x="12" y="32" fill="#c084fc" fontSize="9" className="">✦</text>
              <text x="82" y="35" fill="#8b5cf6" fontSize="9" className=" delay-300">✦</text>
              <text x="86" y="70" fill="#a855f7" fontSize="7" className=" delay-150">✦</text>
              
              {/* Headset Arc Band */}
              <path d="M 25 50 A 25 25 0 0 1 75 50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="drop-shadow-[0_0_12px_rgba(124,77,255,0.6)]" />
              <path d="M 20 50 A 30 30 0 0 1 80 50" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
              
              {/* Left Ear Cushion */}
              <rect x="18" y="44" width="10" height="20" rx="5" fill="currentColor" className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]" />
              <rect x="23" y="47" width="3" height="14" rx="1.5" fill="#c084fc" />
              
              {/* Right Ear Cushion */}
              <rect x="72" y="44" width="10" height="20" rx="5" fill="currentColor" className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]" />
              <rect x="74" y="47" width="3" height="14" rx="1.5" fill="#c084fc" />
              
              {/* Speech Bubble inside Headphones */}
              <g transform="translate(36, 40)" className="drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]">
                <rect x="0" y="0" width="28" height="18" rx="6" fill="#1b123a" stroke="currentColor" strokeWidth="1.5" />
                <path d="M 6 18 L 10 22 L 12 18 Z" fill="#1b123a" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter" />
                {/* Dots inside bubble */}
                <circle cx="8" cy="9" r="1.5" fill="currentColor" />
                <circle cx="14" cy="9" r="1.5" fill="currentColor" />
                <circle cx="20" cy="9" r="1.5" fill="currentColor" />
              </g>
              
              {/* Microphone Extension */}
              <path d="M 24 60 Q 30 72 42 70" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="43" cy="70" r="2.5" fill="#c084fc" />
            </svg>
          </div>
        </header>

        {/* Safety Priority Banner */}
        <div className="bg-gradient-to-r from-[#170e30] to-[#0a061a] border border-[#3c228a]/40 rounded-[20px] p-4 flex items-center justify-between gap-4 shadow-lg text-left relative overflow-hidden">
          <div className="flex items-center gap-3.5 relative z-10 flex-1 min-w-0">
            {/* Double Circle Shield Badge */}
            <div className="w-11 h-11 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/25 flex items-center justify-center text-[#c084fc] shrink-0">
              <ShieldCheck size={22} className="fill-[#8b5cf6]/10" />
            </div>
            
            <div className="min-w-0">
              <h4 className="text-[13px] font-extrabold text-white leading-tight">Your safety is our priority</h4>
              <p className="text-[10.5px] text-slate-450 mt-1 leading-normal pr-1">
                Our support team is ready to assist you with any issue or query.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] text-[9.5px] font-extrabold shrink-0 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block "></span>
            Available 24/7
          </div>
        </div>

        {/* How can we help you? Section */}
        <section className="text-left">
          <h3 className="text-[13px] font-black text-white mb-3 tracking-wide px-1">How can we help you?</h3>
          <div className="grid grid-cols-4 gap-2">
            {supportMethods.map((method, idx) => (
              <div 
                key={idx}
                onClick={() => toast.info(`Starting process: ${method.title}`)}
                className={`bg-[#0d0c1b] border ${method.border} rounded-[20px] p-2.5 pt-4 pb-4 flex flex-col items-center justify-between text-center cursor-pointer transition-all shadow-md group hover:-translate-y-0.5 min-h-[135px]`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${method.iconBg} mb-3.5`}>
                  {method.icon}
                </div>
                <div className="flex flex-col items-center justify-start flex-1 w-full">
                  <h4 className="text-[10.5px] font-bold text-white leading-tight mb-1.5">{method.title}</h4>
                  <p className="text-[8.5px] text-slate-450 leading-tight w-full mt-auto font-medium line-clamp-2">{method.desc}</p>
                </div>
                <ChevronRight size={12} className="text-slate-600 group-hover:text-white transition-colors mt-2" />
              </div>
            ))}
          </div>
        </section>

        {/* Send us a message form */}
        <section className="text-left bg-[#0c0a1a] border border-[#1e1a3a] rounded-[24px] p-5 shadow-xl">
          <div>
            <h3 className="text-[13.5px] font-extrabold text-white leading-tight">Send us a message</h3>
            <p className="text-[11px] text-slate-450 mt-1">Fill in the details below and we'll get back to you.</p>
          </div>

          <form onSubmit={handleSend} className="flex flex-col gap-3.5 mt-5">
            
            {/* Category Select */}
            <div className="bg-[#0e0c1f] border border-[#222135] rounded-[16px] p-3 flex items-center gap-3.5 relative">
              <MessageSquare size={18} className="text-[#a855f7] shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Select a category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-transparent border-none outline-none text-[12.5px] text-white w-full p-0 font-semibold focus:ring-0 cursor-pointer"
                >
                  <option value="" disabled className="bg-[#0c0a1a]">Choose the type of issue</option>
                  <option value="SOS/Emergency Setup" className="bg-[#0c0a1a]">SOS / Emergency Setup</option>
                  <option value="Account Settings" className="bg-[#0c0a1a]">Account Settings</option>
                  <option value="Location & GPS" className="bg-[#0c0a1a]">Location & GPS</option>
                  <option value="Guardians Setup" className="bg-[#0c0a1a]">Guardians Setup</option>
                  <option value="Bug Report" className="bg-[#0c0a1a]">Bug Report</option>
                </select>
              </div>
              <ChevronDown size={16} className="text-slate-500 shrink-0 pointer-events-none" />
            </div>

            {/* Name Input */}
            <div className="bg-[#0e0c1f] border border-[#222135] rounded-[16px] p-3 flex items-center gap-3.5">
              <User size={18} className="text-[#a855f7] shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Your Name</label>
                <input 
                  type="text" 
                  placeholder="Enter your name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent border-none outline-none text-[12.5px] text-white w-full p-0 font-semibold focus:ring-0 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Message Area */}
            <div className="bg-[#0e0c1f] border border-[#222135] rounded-[16px] p-3 flex items-start gap-3.5 min-h-[110px] relative">
              <MessageSquare size={18} className="text-[#a855f7] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 text-left h-full">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1.5">Message</label>
                <textarea 
                  placeholder="Describe your issue or query in detail..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  className="bg-transparent border-none outline-none text-[12.5px] text-white w-full p-0 font-semibold focus:ring-0 placeholder-slate-500 resize-none h-16"
                />
                <span className="absolute bottom-2.5 right-3 text-[8.5px] font-bold text-slate-600">
                  {message.length}/1000
                </span>
              </div>
            </div>

            {/* Attachment Area */}
            <div className="bg-[#0e0c1f] border border-[#222135] rounded-[16px] p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <Paperclip size={18} className="text-slate-450 shrink-0" />
                <div className="min-w-0 text-left">
                  <h4 className="text-[12.5px] font-semibold text-slate-300 leading-tight">Attach screenshots or files (Optional)</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">JPG, PNG, PDF up to 10MB</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => toast.info("Opening file chooser...")}
                className="bg-[#1b123a] border border-[#7c4dff]/30 text-[#c084fc] hover:bg-[#2b1650] hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Upload size={11} /> Attach File
              </button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-[#7c4dff] hover:bg-[#8b5cf6] text-white py-3.5 rounded-[16px] text-[13px] font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer border-none disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send size={14} className="fill-white/10" /> Send Message
                </>
              )}
            </button>

          </form>
        </section>

        {/* Other ways to reach us */}
        <section className="text-left">
          <h3 className="text-[13px] font-black text-white mb-2.5 px-1">Other ways to reach us</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {socialChannels.map((chan, idx) => (
              <div 
                key={idx}
                onClick={() => toast.info(`Opening ${chan.name} channel`)}
                className="bg-[#0c0a1a] border border-[#222135] rounded-[20px] p-3 flex flex-col items-center text-center cursor-pointer hover:border-[#8b5cf6]/30 transition-all shadow-md group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${chan.iconBg} mb-2.5 shadow-inner`}>
                  {chan.icon}
                </div>
                <h4 className="text-[12px] font-bold text-white group-hover:text-[#a855f7] transition-colors leading-tight mb-0.5">{chan.name}</h4>
                <p className="text-[10px] font-semibold text-slate-300 leading-normal truncate w-full">{chan.handle}</p>
                <p className={`text-[8.5px] font-bold mt-1 ${chan.timeColor}`}>{chan.time}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Confidential footer */}
        <div 
          onClick={() => toast.info("All Support conversations are End-to-End Encrypted.")}
          className="bg-[#0a0c16] border border-[#1b1735]/40 rounded-[20px] p-4 flex items-center justify-between gap-4 shadow-md text-left cursor-pointer group hover:bg-[#0e1022] transition-all"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-450 shrink-0 shadow-sm">
              <ShieldCheck size={20} className="fill-emerald-500/5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-bold text-white leading-tight">Your conversations are safe with us</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-normal pr-1">
                All chats and messages are encrypted and confidential.
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            className="border border-[#7c4dff]/45 text-[#c084fc] hover:text-white hover:bg-[#7c4dff]/15 px-3 py-1.5 rounded-full text-[10px] font-semibold shrink-0 cursor-pointer bg-transparent flex items-center gap-1.5 transition-all"
          >
            Privacy Policy <ChevronRight size={11} />
          </button>
        </div>

      </div>
    </div>
  );
}
