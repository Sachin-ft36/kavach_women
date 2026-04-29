import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ShieldAlert, Zap, AlertCircle, CheckCircle2, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useKavachStore } from '../store/useKavachStore';
import { useLanguage } from '../contexts/LanguageContext';

const API_KEY = "AIzaSyCNEVlQJY-dtfXHOYKZzpIn36xwtqpf0Ks"; // TACTICAL OVERRIDE
const genAI = new GoogleGenerativeAI(API_KEY);

interface SOSAnalysis {
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'POTENTIAL';
  probability: number;
  reasoning: string;
  safetyPlan: string[];
}

export default function AIScanner({ context, imageData }: { context: string, imageData?: string }) {
  const { t } = useLanguage();
  const { userPos, batteryLevel } = useKavachStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SOSAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeSituation = async () => {
    if (!API_KEY) {
      setError("AI Engine Offline: Mission-critical API key missing.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // TACTICAL FIX: gemini-1.5-flash + json enforcement
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { 
          responseMimeType: "application/json",
          temperature: 0.1 // Precision Mode
        }
      });
      
      const prompt = `
        ACT AS KAVACH TACTICAL NEURAL COMMANDER.
        ANALYZE THIS EMERGENCY SOS EVENT IMMEDIATELY.
        
        MISSION_TELEMETRY:
        Position: ${userPos?.[0]}, ${userPos?.[1]}
        Battery: ${batteryLevel}%
        Event Context: ${context}
        Evidence: ${imageData ? "Visual Proof Attached" : "Telemetry Only"}

        GOAL: Assess threat level and return a 3-step life-saving survival protocol.
        
        YOU MUST RETURN ONLY A VALID JSON OBJECT WITH THIS STRUCTURE:
        {
          "threatLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "POTENTIAL",
          "probability": number (0-100),
          "reasoning": "string (tactical assessment)",
          "safetyPlan": ["3 clear tactical steps"]
        }
      `;

      const parts = [prompt];
      if (imageData) {
        parts.push({
          inlineData: {
            data: imageData.split(',')[1],
            mimeType: "image/png"
          }
        } as any);
      }

      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();
      
      // With application/json, we get clean data
      setAnalysis(JSON.parse(text));
    } catch (err: any) {
      console.error("AI Analysis Failed:", err);
      setError(`Neural Failure: ${err.message || "Interruption"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    analyzeSituation();
  }, [context, imageData]);

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-2xl flex items-start gap-3"
      >
        <AlertTriangle className="text-accent-red shrink-0" size={18} />
        <div>
          <p className="text-[10px] font-black uppercase text-accent-red tracking-widest">Fallback Engaged</p>
          <p className="text-xs font-bold text-white/80 mt-1">1. Seek crowded area. 2. Contact 112. 3. Trust your instincts.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Analysis Status HUD */}
      <section className="bg-card-bg/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse" />
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-accent-blue">Neural Scanner</h3>
          </div>
          {isAnalyzing && <Loader2 size={14} className="animate-spin text-accent-blue" />}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-8 space-y-4"
              >
                <div className="relative">
                   <div className="w-16 h-16 border-4 border-accent-blue/10 rounded-full" />
                   <div className="absolute inset-0 w-16 h-16 border-t-4 border-accent-blue rounded-full animate-spin" />
                   <Brain className="absolute inset-0 m-auto text-accent-blue" size={24} />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent-blue animate-pulse">Analyzing Threat Vector...</p>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[2px] mt-1">KAVACH Neural Link Active</p>
                </div>
              </motion.div>
            ) : analysis ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Probability Meter */}
                <div className="flex items-center justify-between">
                   <div>
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">SOS Probability</p>
                      <h4 className={`text-2xl font-black italic mt-1 ${analysis.probability > 70 ? 'text-accent-red' : 'text-accent-blue'}`}>
                        {analysis.probability}% {analysis.threatLevel}
                      </h4>
                   </div>
                   <div className={`p-3 rounded-xl ${analysis.threatLevel === 'CRITICAL' ? 'bg-accent-red/20 border border-accent-red/30' : 'bg-accent-blue/20 border border-accent-blue/30'}`}>
                      <ShieldAlert size={24} className={analysis.threatLevel === 'CRITICAL' ? 'text-accent-red' : 'text-accent-blue'} />
                   </div>
                </div>

                {/* Tactical Reasoning */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                   <p className="text-[8px] text-accent-blue font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Sparkles size={10} /> AI Reasoning
                   </p>
                   <p className="text-xs font-bold text-white/80 leading-relaxed italic uppercase tracking-tight">
                     "{analysis.reasoning}"
                   </p>
                </div>

                {/* Safety Plan Checklist */}
                <div className="space-y-3">
                   <p className="text-[10px] font-black text-accent-red uppercase tracking-widest flex items-center gap-2">
                     <Zap size={12} className="fill-current" /> Survival Protocol:
                   </p>
                   <div className="grid gap-2">
                      {analysis.safetyPlan.map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-red-600/5 border border-red-600/10 rounded-xl"
                        >
                          <div className="w-5 h-5 rounded-lg bg-red-600 flex items-center justify-center text-[10px] font-black text-white italic">
                            {idx + 1}
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-tighter text-white/90">
                            {step}
                          </p>
                        </motion.div>
                      ))}
                   </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
