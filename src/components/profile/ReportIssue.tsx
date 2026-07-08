import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  ChevronRight, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  Mail, 
  Info, 
  Clock, 
  Send,
  Check,
  Bug,
  Shield,
  User,
  CreditCard,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

interface ReportIssueProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportIssue({ isOpen, onClose }: ReportIssueProps) {
  const [selectedType, setSelectedType] = useState('bug');
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an issue title");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a detailed description");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Thank you! Your report has been submitted.");
      setTitle('');
      setDateTime('');
      setDescription('');
      onClose();
    }, 1500);
  };

  const issueTypes = [
    {
      id: 'bug',
      title: 'Bug Report',
      desc: "Something isn't working correctly",
      icon: <Bug size={20} className="text-[#a855f7]" />,
      bg: 'bg-[#a855f7]/10 border-[#a855f7]/20'
    },
    {
      id: 'safety',
      title: 'Safety Concern',
      desc: 'Feels unsafe or inappropriate',
      icon: <Shield size={20} className="text-red-400" />,
      bg: 'bg-red-500/10 border-red-500/20'
    },
    {
      id: 'account',
      title: 'Account Issue',
      desc: 'Login, profile or account related',
      icon: <User size={20} className="text-amber-500" />,
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'payment',
      title: 'Payment Issue',
      desc: 'Transaction or billing problems',
      icon: <CreditCard size={20} className="text-[#3b82f6]" />,
      bg: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'feature',
      title: 'Feature Request',
      desc: 'Suggest a new feature or idea',
      icon: <Lightbulb size={20} className="text-emerald-400" />,
      bg: 'bg-emerald-500/10 border-emerald-500/20'
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
              <h1 className="text-lg font-black text-white tracking-tight leading-tight">Report an Issue</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Help us improve KAVACH by letting us know</p>
            </div>
          </div>
          
          {/* Header Warning/Document Graphic */}
          <div className="absolute right-[-10px] top-[-22px] w-24 h-24 pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full text-red-500">
              {/* Star particles */}
              <text x="15" y="30" fill="#ef4444" fontSize="8" className="">✦</text>
              <text x="88" y="42" fill="#b91c1c" fontSize="8" className=" delay-200">✦</text>
              
              {/* Document background lines */}
              <g transform="translate(48, 20)" opacity="0.25">
                <rect x="0" y="0" width="30" height="38" rx="4" fill="none" stroke="white" strokeWidth="2.5" />
                <line x1="6" y1="10" x2="24" y2="10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="6" y1="18" x2="24" y2="18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="6" y1="26" x2="16" y2="26" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </g>
              
              {/* Alert Triangle */}
              <g transform="translate(18, 30)" className="drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]">
                <polygon points="30,5 5,48 55,48" fill="#1d0d12" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" />
                <polygon points="30,9 9,44 51,44" fill="#ef4444" opacity="0.9" />
                <text x="27.5" y="38" fill="white" fontSize="24" fontWeight="black">!</text>
              </g>
            </svg>
          </div>
        </header>

        {/* Feedback Banner */}
        <div className="bg-gradient-to-r from-[#170e30] to-[#0a061a] border border-[#3c228a]/40 rounded-[20px] p-5 px-6 flex items-center justify-between gap-5 shadow-lg text-left">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/25 flex items-center justify-center text-[#c084fc] shrink-0">
              <ShieldCheck size={22} className="fill-[#8b5cf6]/10" />
            </div>
            
            <div className="min-w-0">
              <h4 className="text-[12.5px] font-bold text-white leading-tight">Your feedback helps make KAVACH safer for everyone.</h4>
              <p className="text-[10px] text-slate-400 mt-2 leading-normal pr-1 font-medium">
                We review every report and take necessary action.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#10b981] text-[9.5px] font-extrabold shrink-0 shadow-sm">
            <Lock size={11} /> 100% Confidential
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* 1. Select the Type of Issue */}
          <section className="text-left bg-[#0c0a1a] border border-[#1e1a3a] rounded-[24px] p-4 shadow-xl">
            <h3 className="text-[10.5px] font-extrabold text-[#a855f7] tracking-[0.1em] uppercase mb-4 px-1">1. Select the type of issue</h3>
            
            <div className="flex flex-col gap-3">
              {/* Custom CSS to hide scrollbars */}
              <style>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
                .no-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              
              {/* Horizontal Scrollable Row for Issue Cards */}
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
                {issueTypes.map((type) => (
                  <div 
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`shrink-0 w-[115px] snap-center bg-[#0f0e26] border rounded-[20px] p-2.5 pt-3.5 pb-4 flex flex-col items-center justify-start text-center cursor-pointer transition-all shadow-md group relative min-h-[145px] ${
                      selectedType === type.id ? 'border-[#8b5cf6] shadow-[0_0_12px_rgba(139,92,246,0.15)]' : 'border-[#22213b]'
                    }`}
                  >
                    {/* Checkmark indicator for selected */}
                    {selectedType === type.id && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white border border-[#0f0e26] shadow-sm z-10">
                        <Check size={9} strokeWidth={3.5} />
                      </div>
                    )}
                    
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${type.bg} mb-3.5 shadow-inner`}>
                      {type.icon}
                    </div>
                    
                    <div className="flex flex-col items-center justify-start flex-1 w-full">
                      <h4 className="text-[10px] font-bold text-white leading-tight mb-2 tracking-tight">
                        {type.id === 'bug' ? (
                          <>Bug<br />Report</>
                        ) : type.id === 'safety' ? (
                          <>Safety<br />Concern</>
                        ) : type.id === 'account' ? (
                          <>Account<br />Issue</>
                        ) : type.id === 'payment' ? (
                          <>Payment<br />Issue</>
                        ) : (
                          <>Feature<br />Request</>
                        )}
                      </h4>
                      <p className="text-[8px] text-slate-455 leading-tight w-full mt-auto font-medium">
                        {type.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Dot Indicators */}
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full transition-all ${selectedType === 'bug' || selectedType === 'safety' ? 'bg-[#8b5cf6] w-4' : 'bg-slate-700'}`}></span>
                <span className={`w-1.5 h-1.5 rounded-full transition-all ${selectedType === 'account' ? 'bg-[#8b5cf6] w-4' : 'bg-slate-700'}`}></span>
                <span className={`w-1.5 h-1.5 rounded-full transition-all ${selectedType === 'payment' || selectedType === 'feature' ? 'bg-[#8b5cf6] w-4' : 'bg-slate-700'}`}></span>
              </div>
            </div>
          </section>

          {/* 2. Tell Us More */}
          <section className="text-left bg-[#0c0a1a] border border-[#1e1a3a] rounded-[24px] p-5 shadow-xl flex flex-col gap-3.5">
            <h3 className="text-[10.5px] font-extrabold text-[#a855f7] tracking-[0.1em] uppercase mb-1 px-1">2. Tell us more</h3>
            
            {/* Issue Title */}
            <div className="bg-[#0e0c1f] border border-[#222135] rounded-[16px] p-3.5 flex items-center gap-3.5 relative">
              <MessageSquare size={18} className="text-[#a855f7] shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Issue Title*</label>
                <input 
                  type="text" 
                  placeholder="Briefly describe your issue" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  className="bg-transparent border-none outline-none text-[12.5px] text-white w-full p-0 font-semibold focus:ring-0 placeholder-slate-500"
                />
              </div>
              <span className="absolute bottom-1 right-3.5 text-[8px] font-bold text-slate-600">
                {title.length}/80
              </span>
            </div>

            {/* When did this happen */}
            <div className="bg-[#0e0c1f] border border-[#222135] rounded-[16px] p-3.5 flex items-center gap-3.5 cursor-pointer hover:border-slate-800 transition-colors">
              <Calendar size={18} className="text-[#a855f7] shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">When did this happen?</label>
                <input 
                  type="text" 
                  placeholder="Select date and time" 
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="bg-transparent border-none outline-none text-[12.5px] text-white w-full p-0 font-semibold focus:ring-0 placeholder-slate-500"
                />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Calendar size={14} className="text-slate-500" />
                <ChevronRight size={14} className="text-slate-500" />
              </div>
            </div>

            {/* Description textarea */}
            <div className="bg-[#0e0c1f] border border-[#222135] rounded-[16px] p-3.5 flex items-start gap-3.5 min-h-[120px] relative">
              <FileText size={18} className="text-[#a855f7] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 text-left h-full">
                <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1.5">Describe the issue in detail*</label>
                <textarea 
                  placeholder="Please provide as much detail as possible..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  className="bg-transparent border-none outline-none text-[12.5px] text-white w-full p-0 font-semibold focus:ring-0 placeholder-slate-500 resize-none h-16"
                />
                <span className="absolute bottom-2.5 right-3.5 text-[8.5px] font-bold text-slate-600">
                  {description.length}/1000
                </span>
              </div>
            </div>

          </section>

          {/* 3. Add Screenshots or Videos */}
          <section className="text-left bg-[#0c0a1a] border border-[#1e1a3a] rounded-[24px] p-5 shadow-xl">
            <h3 className="text-[10.5px] font-extrabold text-[#a855f7] tracking-[0.1em] uppercase mb-4 px-1">3. Add screenshots or videos (optional)</h3>
            
            <div className="border border-dashed border-[#222135] rounded-[16px] p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <ImageIcon size={18} />
                </div>
                <div className="min-w-0 text-left">
                  <h4 className="text-[12.5px] font-semibold text-slate-300 leading-tight">Attach screenshots or screen recording</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">JPG, PNG, MP4 up to 20MB</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => toast.info("Opening file chooser...")}
                className="bg-[#1b123a] border border-[#7c4dff]/30 text-[#c084fc] hover:bg-[#2b1650] hover:text-white px-3.5 py-2 rounded-xl text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Upload size={11} /> Attach Files
              </button>
            </div>
          </section>

          {/* 4. How Should We Contact You */}
          <section className="text-left bg-[#0c0a1a] border border-[#1e1a3a] rounded-[24px] p-5 shadow-xl">
            <h3 className="text-[10.5px] font-extrabold text-[#a855f7] tracking-[0.1em] uppercase mb-4 px-1">4. How should we contact you?</h3>
            
            <div className="bg-[#0e0c1f] border border-[#222135] rounded-[16px] p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-400/10 flex items-center justify-center text-slate-400 shrink-0">
                  <Mail size={18} />
                </div>
                <div className="min-w-0 text-left">
                  <h4 className="text-[12.5px] font-semibold text-slate-300 leading-tight">Email</h4>
                  <p className="text-[10.5px] text-slate-450 mt-0.5 truncate">your.email@example.com</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => toast.info("Update contact email support")}
                className="text-[#a855f7] hover:text-[#c084fc] text-[12px] font-bold shrink-0 flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                Change <ChevronRight size={14} />
              </button>
            </div>
          </section>

          {/* What happens next banner */}
          <div className="bg-[#0a0c16] border border-[#1b1735]/40 rounded-[20px] p-4 flex items-center justify-between gap-4 shadow-md text-left">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/15 flex items-center justify-center text-[#3b82f6] shrink-0 shadow-sm">
                <Info size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold text-white leading-tight">What happens next?</h4>
                <p className="text-[10.5px] text-slate-450 mt-1 leading-normal pr-1">
                  Our support team will review your report and get back to you within 24-48 hours.
                </p>
              </div>
            </div>
            
            <div className="bg-[#0f1b35] border border-blue-900/30 rounded-xl p-2 px-3 shrink-0 text-center flex flex-col items-center">
              <span className="text-[11px] font-bold text-[#3b82f6] tracking-tight flex items-center gap-1">
                <Clock size={11} /> 24-48 hours
              </span>
              <span className="text-[8px] text-slate-450 font-semibold mt-0.5">Response time</span>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isSubmitting}
            className="bg-[#7c4dff] hover:bg-[#8b5cf6] text-white py-3.5 rounded-[16px] text-[13px] font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer border-none disabled:opacity-60"
          >
            {isSubmitting ? (
              <span>Submitting...</span>
            ) : (
              <>
                <Send size={14} className="fill-white/10" /> Submit Report
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
