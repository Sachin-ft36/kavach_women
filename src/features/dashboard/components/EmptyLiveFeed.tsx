import React from 'react';
import { ShieldCheck, Car, Users, ChevronRight, Heart, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface EmptyLiveFeedProps {
  isNight: boolean;
  themeFolder: string;
}

export const EmptyLiveFeed = ({ isNight, themeFolder }: EmptyLiveFeedProps) => {
  return (
    <div className="flex flex-col w-full h-full relative z-10">
      {/* Upper Image Section */}
      <div className="w-full relative flex items-center justify-center">
        <img 
          src={isNight ? "/assets/dashboard_assets/night/empty.png" : "/assets/dashboard_assets/night/empty.png"} 
          alt="No updates"
          className="w-full object-contain object-top"
          style={{ maxHeight: '160px' }}
        />
        <div className={`absolute bottom-0 w-full h-12 bg-gradient-to-t ${isNight ? 'from-[#0b0e20] to-transparent' : 'from-[#FFF8F1] to-transparent'}`} />
      </div>

      {/* Content Section */}
      <div className={`flex flex-col items-center flex-1 px-6 pb-6 ${isNight ? 'bg-[#0b0e20]' : 'bg-[#FFF8F1]'}`}>
        
        <h3 className={`text-[18px] font-bold mt-2 mb-2 tracking-tight ${isNight ? 'text-white' : 'text-[#1e293b]'}`}>No updates yet 😔</h3>
        <p className={`text-[13px] text-center leading-[1.4] w-full mb-6 ${isNight ? 'text-[#9ca3af]' : 'text-slate-500'}`}>
          When your loved ones check-in, start a ride, or share updates, it will appear here instantly.
        </p>

        <button 
          onClick={() => toast.info("Connecting with family...")}
          className={`w-[85%] py-3.5 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-[0_0_20px_rgba(76,53,117,0.15)] border mb-6 ${isNight ? 'bg-[#0f1123]/80 border-[#4c3575] hover:bg-[#1a1c36] text-white' : 'bg-white border-[#16a34a]/40 hover:bg-slate-50 text-slate-800'}`}
        >
          <div className="relative flex items-center justify-center">
            <Users size={18} className={isNight ? 'text-[#a855f7]' : 'text-[#16a34a]'} />
            <Heart size={8} className={`absolute -top-1 -right-1 fill-current ${isNight ? 'text-[#a855f7]' : 'text-[#16a34a]'}`} />
          </div>
          <span className="text-[14px] font-bold tracking-wide">Connect with Family</span>
          <ChevronRight size={16} className={isNight ? 'text-white/60' : 'text-slate-400'} />
        </button>

        <div className="w-full flex flex-col gap-3 mb-4 px-2">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isNight ? 'text-[#a855f7]' : 'text-[#16a34a]'}`}>HOW TO GET UPDATES</span>
            <div className={`h-[1px] flex-1 ${isNight ? 'bg-white/5' : 'bg-black/5'}`} />
          </div>

          <div className="flex items-center justify-between gap-3 w-full">
            <div className={`flex-1 flex flex-col items-center justify-center text-center gap-1.5 p-2 rounded-[12px] border ${isNight ? 'bg-[#0b0e20] border-[#1e2540]' : 'bg-white/60 border-black/5 backdrop-blur-sm'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isNight ? 'bg-[#082a20]' : 'bg-emerald-50'}`}>
                <ShieldCheck size={14} className={isNight ? 'text-[#00d070]' : 'text-[#059669]'} strokeWidth={2.5} />
              </div>
              <span className={`text-[10px] font-medium leading-[1.2] ${isNight ? 'text-white/90' : 'text-slate-700'}`}>Ask to<br/>check-in</span>
            </div>
            
            <div className={`flex-1 flex flex-col items-center justify-center text-center gap-1.5 p-2 rounded-[12px] border ${isNight ? 'bg-[#0b0e20] border-[#1e2540]' : 'bg-white/60 border-black/5 backdrop-blur-sm'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isNight ? 'bg-[#0a204a]' : 'bg-blue-50'}`}>
                <Car size={14} className={isNight ? 'text-[#2d7fff]' : 'text-blue-600'} strokeWidth={2.5} />
              </div>
              <span className={`text-[10px] font-medium leading-[1.2] ${isNight ? 'text-white/90' : 'text-slate-700'}`}>Start a<br/>ride</span>
            </div>

            <div className={`flex-1 flex flex-col items-center justify-center text-center gap-1.5 p-2 rounded-[12px] border ${isNight ? 'bg-[#0b0e20] border-[#1e2540]' : 'bg-white/60 border-black/5 backdrop-blur-sm'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isNight ? 'bg-[#2a134a]' : 'bg-purple-50'}`}>
                <Users size={14} className={isNight ? 'text-[#a855f7]' : 'text-purple-600'} strokeWidth={2.5} />
              </div>
              <span className={`text-[10px] font-medium leading-[1.2] ${isNight ? 'text-white/90' : 'text-slate-700'}`}>Add<br/>members</span>
            </div>
          </div>
        </div>

        <div className={`w-[98%] mt-auto mb-2 p-3 rounded-[12px] flex items-center justify-between border ${isNight ? 'bg-[#0b0e20] border-[#1e2540]' : 'bg-white/40 border-black/5 backdrop-blur-sm'}`}>
          <div className="flex items-center gap-2">
            <Sparkles size={14} className={isNight ? 'text-[#fcd34d] fill-[#fcd34d]' : 'text-amber-400'} />
            <span className={`text-[11px] font-medium tracking-wide ${isNight ? 'text-white/80' : 'text-slate-600'}`}>
              Stay <span className={isNight ? 'text-[#a855f7]' : 'text-[#16a34a] font-bold'}>connected</span>, stay <span className={isNight ? 'text-[#2d7fff]' : 'text-[#16a34a] font-bold'}>protected</span>.
            </span>
          </div>
          <Heart size={14} className={isNight ? 'text-[#a855f7]' : 'text-[#16a34a]'} strokeWidth={2.5} />
        </div>

      </div>
    </div>
  );
};
