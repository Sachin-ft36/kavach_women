import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, CheckCircle, X, Shield, Gavel, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface TacticalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (input?: string) => void;
  title: string;
  description: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  showInput?: boolean;
  inputPlaceholder?: string;
  selectOptions?: string[];
}

export default function TacticalModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = 'info',
  confirmText = 'Proceed',
  cancelText = 'Cancel',
  showCancel = true,
  showInput = false,
  inputPlaceholder = 'Enter details...',
  selectOptions
}: TacticalModalProps) {
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (selectOptions && selectOptions.length > 0) {
      setInputValue(selectOptions[0]);
    } else {
      setInputValue('');
    }
  }, [isOpen, selectOptions]);

  const configs = {
    danger: { 
      gradient: 'from-red-500 to-rose-600', 
      text: 'text-red-500', 
      glow: 'shadow-red-500/20',
      icon: ShieldAlert,
      accent: 'bg-red-500'
    },
    warning: { 
      gradient: 'from-amber-400 to-orange-500', 
      text: 'text-amber-500', 
      glow: 'shadow-amber-500/10',
      icon: AlertTriangle,
      accent: 'bg-amber-500'
    },
    info: { 
      gradient: 'from-blue-500 to-indigo-600', 
      text: 'text-blue-600', 
      glow: 'shadow-blue-500/20',
      icon: Shield,
      accent: 'bg-blue-600'
    },
    success: { 
      gradient: 'from-emerald-400 to-teal-600', 
      text: 'text-emerald-500', 
      glow: 'shadow-emerald-500/20',
      icon: CheckCircle,
      accent: 'bg-emerald-500'
    },
  };

  const Config = configs[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200000] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0F172A]/85 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-[340px] bg-white rounded-[48px] shadow-[0_40px_80px_rgba(0,0,0,0.4)] overflow-hidden border border-white/40"
          >
            {/* 🌟 Glowing Gradient Indicator */}
            <div className={cn("h-[4px] w-full bg-gradient-to-r", Config.gradient)} />
            <div className={cn("absolute top-0 left-0 right-0 h-4 opacity-30 blur-md bg-gradient-to-r", Config.gradient)} />
            
            <div className="p-8 pb-10 space-y-8">
              <div className="flex flex-col items-center text-center space-y-5">
                {/* 🛡️ Glass Icon Circle */}
                <div className="relative group">
                  <div className={cn("absolute inset-0 blur-xl opacity-20 group-hover:opacity-40 transition-opacity", Config.accent)} />
                  <div className="relative w-20 h-20 rounded-full bg-[#F8FAFC] border border-gray-100 flex items-center justify-center shadow-inner overflow-hidden">
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
                    <Config.icon size={36} className={cn("relative z-10", Config.text)} strokeWidth={1.5} />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-[#1E293B] tracking-tight leading-none">
                    {title}
                  </h3>
                  <div className="flex justify-center">
                    <p className="text-[12px] font-medium text-[#64748B] leading-relaxed max-w-[240px]">
                      {description}
                    </p>
                  </div>
                </div>
              </div>

              {showInput && (
                <div className="space-y-2">
                  {selectOptions ? (
                    <div className="relative group/select">
                      <select
                        autoFocus
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 pr-12 text-sm text-[#1E293B] font-bold outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer relative z-10"
                      >
                        {selectOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none z-20 group-hover/select:text-blue-500 transition-colors">
                        <ChevronDown size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      autoFocus
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={inputPlaceholder}
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 text-sm text-[#1E293B] font-bold outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onConfirm(showInput ? inputValue : undefined);
                    setInputValue('');
                  }}
                  className={cn(
                    "w-full py-5 text-white rounded-2xl text-[12px] font-black uppercase tracking-[2px] shadow-2xl transition-all active:scale-[0.98] bg-gradient-to-br",
                    Config.gradient,
                    Config.glow
                  )}
                >
                  {confirmText}
                </button>
                {showCancel && (
                  <button
                    onClick={onClose}
                    className="w-full py-5 bg-[#F1F5F9]/50 backdrop-blur-sm border border-[#E2E8F0] text-[#64748B] rounded-2xl text-[12px] font-black uppercase tracking-[2px] hover:bg-gray-100 transition-all active:scale-[0.98]"
                  >
                    {cancelText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
