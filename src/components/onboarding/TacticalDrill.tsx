import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Users, ShieldCheck, Fingerprint, Lock, Smartphone, Activity } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface DrillScene {
  id: number;
  title: string;
  desc: string;
  icon: React.ReactNode;
  animation: React.ReactNode;
}

export default function TacticalDrill({ onComplete }: { onComplete: () => void }) {
  const [currentScene, setCurrentScene] = useState(0);
  const { t, language } = useLanguage();

  const getScenes = (): DrillScene[] => {
    const isEn = language === 'en';
    
    return [
      {
        id: 0,
        title: isEn ? "HOW TO START SOS" : "SOS कैसे शुरू करें (Triggers)",
        desc: isEn 
          ? "No need to unlock your phone. Simply Shake your device, press the Volume Down Button 3 times, or shout 'KAVACH HELP' 3 times to trigger an SOS."
          : "Emergency mein phone unlock karne ki zarurat nahi. Phone hilaayein (Shake), Volume Down button 3 baar dabayein, ya 3 baar 'KAVACH HELP' chillayein. SOS turant shuru ho jayega.",
        icon: <Zap className="text-yellow-500" />,
        animation: (
          <div className="relative w-48 h-64 bg-white/5 border-2 border-white/10 rounded-[32px] overflow-hidden">
            <motion.div 
              animate={{ x: [0, 10, -10, 0], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            >
               <Smartphone size={60} className="text-white/20" />
               <div className="text-[8px] font-black text-accent-red animate-pulse">SHAKE DETECTED</div>
            </motion.div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full" />
          </div>
        )
      },
      {
        id: 1,
        title: isEn ? "SENTINEL WATCH" : "सेंटीनेल वॉच (Tactical Siren)",
        desc: isEn 
          ? "Upon activation, KAVACH begins silent video recording and triggers a high-decibel Tactical Siren to deter threats and alert bystanders."
          : "SOS activate hote hi KAVACH video record shuru kar deta hai aur ek bahut zor se Siren bajata hai taaki dushman dar jaye aur log madad ko aayein.",
        icon: <Activity className="text-accent-red" />,
        animation: (
          <div className="relative w-48 h-48 flex items-center justify-center">
             <motion.div 
               animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
               transition={{ repeat: Infinity, duration: 1 }}
               className="absolute inset-0 bg-accent-red/20 rounded-full"
             />
             <div className="relative z-10 w-24 h-24 bg-accent-red rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,0,0,0.5)]">
                <Zap size={40} className="text-white animate-bounce" />
                <div className="text-[8px] font-black text-white mt-1">SIREN ON</div>
             </div>
          </div>
        )
      },
      {
        id: 2,
        title: isEn ? "GUARDIAN MESH" : "गार्जियन लिंक (Family Connect)",
        desc: isEn 
          ? "Your emergency contacts receive an instant SOS link with your live location and a real-time video feed to monitor your safety."
          : "Aapke parivaar aur doston ko turant SMS jayega jisme aapki live location aur video dekhne ka link hoga. Wo aapko har pal monitor kar sakenge.",
        icon: <Users className="text-accent-blue" />,
        animation: (
          <div className="relative w-64 h-64 flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border border-dashed border-accent-blue/30 rounded-full" 
            />
            <div className="relative z-10 w-16 h-16 bg-accent-blue rounded-2xl flex items-center justify-center">
              <Shield size={32} className="text-white" />
            </div>
            {[0, 120, 240].map(angle => (
              <motion.div
                key={angle}
                style={{ position: 'absolute', transform: `rotate(${angle}deg) translateY(-100px)` }}
                className="w-10 h-10 bg-white/10 rounded-full border border-white/20 flex items-center justify-center"
              >
                <Users size={16} className="text-accent-blue" />
              </motion.div>
            ))}
            <div className="absolute -bottom-4 text-[7px] font-black text-accent-blue uppercase tracking-widest">REAL-TIME GUARDIAN UPLINK</div>
          </div>
        )
      },
      {
        id: 3,
        title: isEn ? "PROTECTOR NETWORK" : "प्रोटेक्टर नेटवर्क (1KM Proximity)",
        desc: isEn 
          ? "Verified police and volunteers within a 1KM radius receive your distress signal and intercept your location for immediate assistance."
          : "1KM ke andar jitne bhi Police aur verified volunteers hain, unhe aapka signal milega aur wo turant aapki location par intercept ke liye pahuchenge.",
        icon: <ShieldCheck className="text-green-500" />,
        animation: (
          <div className="relative w-64 h-48 bg-black border border-accent-blue/20 rounded-2xl overflow-hidden p-4">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#0A84FF22_0%,transparent_70%)]" />
            <motion.div 
              animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-accent-blue rounded-full"
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-accent-red rounded-full shadow-[0_0_15px_red]" />
            {[1,2,3].map(i => (
               <motion.div
                 key={i}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 style={{ top: `${20 + i*20}%`, left: `${10 + i*25}%` }}
                 className="absolute flex items-center gap-1"
               >
                 <div className="w-2 h-2 bg-accent-blue rounded-full shadow-[0_0_8px_#0A84FF]" />
                 <span className="text-[6px] font-black text-accent-blue uppercase">Protector Nearby</span>
               </motion.div>
            ))}
          </div>
        )
      },
      {
        id: 4,
        title: isEn ? "ZERO-FIR JUSTICE" : "जीरो-FIR न्याय (Justice)",
        desc: isEn 
          ? "Submit digital reports directly to the Special Cell. Choose 'Masked' mode to report incidents anonymously while securing justice."
          : "Bina Police station gaye app se hi complaint bhejien. 'Masked' chun kar aap apni pehchan chhupa kar bhi dushman ki report kar sakte hain.",
        icon: <Shield className="text-purple-500" />,
        animation: (
          <div className="flex gap-4">
             <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                <div className="w-10 h-10 bg-gray-500/20 rounded-full mx-auto flex items-center justify-center text-gray-500 mb-2"><Users size={18} /></div>
                <div className="text-[8px] font-black text-gray-500">MASKED (SECRET)</div>
             </div>
             <div className="p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-2xl text-center scale-110">
                <div className="w-10 h-10 bg-accent-blue/20 rounded-full mx-auto flex items-center justify-center text-accent-blue mb-2"><ShieldCheck size={18} /></div>
                <div className="text-[8px] font-black text-accent-blue">UNMASKED (FIR)</div>
             </div>
          </div>
        )
      },
      {
        id: 5,
        title: isEn ? "SECURE BLACKBOX" : "सुरक्षित ब्लैकबॉक्स (Evidence)",
        desc: isEn 
          ? "Your forensic evidence is hashed and locked in a digital vault that cannot be deleted, ensuring foolproof proof for legal proceedings."
          : "Aapka saboot (Photos/Videos) ek aise digital vault mein lock ho jata hai jise koi delete nahi kar sakta. Ye court mein pakka saboot hai.",
        icon: <Lock className="text-orange-500" />,
        animation: (
          <div className="flex flex-col items-center gap-6">
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-br from-orange-600/30 to-black border-2 border-orange-500/30 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(255,165,0,0.2)]"
            >
              <Lock size={40} className="text-orange-500" />
            </motion.div>
            <div className="text-[8px] font-black text-orange-400 uppercase tracking-[4px]">EVIDENCE SECURED IN BLACKBOX</div>
          </div>
        )
      },
      {
        id: 6,
        title: isEn ? "MISSION READY" : "मिशन के लिए तैयार (Mission Ready)",
        desc: isEn 
          ? "KAVACH is now your ultimate shield. Stay safe, stay connected, and welcome to the secure tactical grid."
          : "KAVACH ab aapki shield hai. Safe rahein, connected rahein. Tactical grid mein swagat hai.",
        icon: <Shield className="text-accent-blue" />,
        animation: (
          <div className="text-center space-y-4">
             <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center border-4 border-accent-blue mx-auto"
             >
                <Shield size={60} className="text-accent-blue" />
             </motion.div>
             <div className="text-xl font-black italic text-white uppercase tracking-tighter animate-pulse">MISSION READY</div>
          </div>
        )
      }
    ];
  };

  const scenes = getScenes();

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentScene < scenes.length - 1) {
        setCurrentScene(prev => prev + 1);
      }
    }, 8000); // 8 seconds per scene for careful reading
    return () => clearInterval(timer);
  }, [currentScene]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center p-8">
      <div className="w-full flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-blue/20 rounded-xl flex items-center justify-center text-accent-blue">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black italic uppercase text-white leading-none">Tactical Drill</h2>
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">Mission Briefing v2.4</p>
          </div>
        </div>
        <div className="text-[10px] font-black text-white/40 italic">SCENE {currentScene + 1}/{scenes.length}</div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center gap-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center gap-8"
          >
            <div className="p-8 bg-white/5 rounded-[40px] border border-white/10 shadow-2xl">
              {scenes[currentScene].animation}
            </div>

            <div className="space-y-4 max-w-sm">
              <div className="flex items-center justify-center gap-3">
                {scenes[currentScene].icon}
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                  {scenes[currentScene].title}
                </h3>
              </div>
              <p className="text-xs text-gray-400 font-medium leading-relaxed px-4">
                {scenes[currentScene].desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2">
          {scenes.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${i === currentScene ? 'w-8 bg-accent-blue' : 'w-2 bg-white/10'}`} 
            />
          ))}
        </div>
      </div>

      <div className="w-full pt-12 space-y-4">
        <div className="flex gap-4">
          {currentScene > 0 && (
            <button
              onClick={() => setCurrentScene(prev => prev - 1)}
              className="flex-1 py-6 bg-white/5 border border-white/10 text-white rounded-[28px] font-black uppercase tracking-[2px] text-[10px] active:scale-95 transition-all"
            >
              PREVIOUS
            </button>
          )}
          
          {currentScene === scenes.length - 1 ? (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={onComplete}
              className="flex-[2] py-6 bg-white text-black rounded-[28px] font-black uppercase tracking-[2px] text-[10px] shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
            >
              START MISSION
            </motion.button>
          ) : (
            <button
              onClick={() => setCurrentScene(prev => prev + 1)}
              className="flex-[2] py-6 bg-white/10 border border-white/20 text-white rounded-[28px] font-black uppercase tracking-[2px] text-[10px] active:scale-95 transition-all"
            >
              NEXT SCENE
            </button>
          )}
        </div>

        <button 
          onClick={onComplete}
          className="w-full py-4 text-[9px] text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors"
        >
          Skip Drill
        </button>
      </div>
    </div>
  );
}
