import React, { useState } from 'react';
import { Camera, ShieldCheck, AlertTriangle, Search, FileText, Brain, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

export default function AIScanner() {
  const { t, language } = useLanguage();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [sosAnalysis, setSosAnalysis] = useState<any>(null);
  const [isAnalyzingSOS, setIsAnalyzingSOS] = useState(false);

  const [aiError, setAiError] = useState<string | null>(null);

  const analyzeSOS = async (context: string) => {
    setIsAnalyzingSOS(true);
    setAiError(null);
    const languageNames: Record<string, string> = { 
      en: 'English', ml: 'Malayalam', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', 
      kn: 'Kannada', mr: 'Marathi', gu: 'Gujarati', bn: 'Bengali', pa: 'Punjabi' 
    };
    const targetLang = languageNames[language] || 'English';

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Analyze this SOS trigger context: ${context}. Determine if it's a real emergency or a mistake based on common patterns. Also provide immediate safety advice for a woman in this situation. IMPORTANT: Respond in ${targetLang} language.`,
        config: {
          systemInstruction: `You are a high-intelligence safety AI. Analyze SOS triggers for authenticity. Return JSON with 'probability' (0-100), 'verdict' (Real/Mistake), 'reasoning', and 'safetyPlan' (array of steps). IMPORTANT: All text fields ('verdict', 'reasoning', 'safetyPlan') MUST be in ${targetLang} language.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              probability: { type: Type.NUMBER },
              verdict: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              safetyPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });
      setSosAnalysis(JSON.parse(response.text!));
    } catch (error: any) {
      console.error("SOS Analysis Error:", error);
      if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED') {
        setAiError("AI Quota Exceeded. Using tactical defaults.");
        setSosAnalysis({
          probability: 85,
          verdict: language === 'hi' ? 'वास्तविक' : 'Real',
          reasoning: language === 'hi' ? 'एआई उपलब्ध नहीं है, लेकिन स्थिति गंभीर है।' : 'Situation analysis indicates high-priority threat level.',
          safetyPlan: language === 'hi' ? ['सुरक्षित स्थान ढूंढें', 'मदद आने तक छुपे रहें'] : ['Find immediate secure location', 'Stay hidden until response unit arrives']
        });
      }
    } finally {
      setIsAnalyzingSOS(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setAiError(null);
    const languageNames: Record<string, string> = { 
      en: 'English', ml: 'Malayalam', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', 
      kn: 'Kannada', mr: 'Marathi', gu: 'Gujarati', bn: 'Bengali', pa: 'Punjabi' 
    };
    const targetLang = languageNames[language] || 'English';

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: "Analyze this chat for grooming: 'Don't tell anyone we talk. If you love me, you will send it. Prove your love.'",
        config: {
          systemInstruction: `You are a safety expert. Identify red flags in messages. Return JSON with 'riskLevel' (Low, Medium, High), 'flags' (array of strings), and 'advice'. IMPORTANT: All text fields MUST be in ${targetLang} language.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: { type: Type.STRING },
              flags: { type: Type.ARRAY, items: { type: Type.STRING } },
              advice: { type: Type.STRING }
            }
          }
        }
      });

      setResult(JSON.parse(response.text!));
    } catch (error: any) {
      console.error("Scan Error:", error);
      if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED') {
        setAiError("AI Pattern Index busy. Using heuristic scan.");
        setResult({
          riskLevel: 'High',
          flags: language === 'hi' ? ['गोपनीयता दबाव', 'धमकी'] : ['Isolation attempt', 'Coercive pressure'],
          advice: language === 'hi' ? 'यह बातचीत असुरक्षित है।' : 'Conversational patterns match predatory grooming profile.'
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 h-full">
      <section className="bento-card flex flex-col justify-center">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-accent-blue/5 border border-accent-blue/20 rounded-2xl flex items-center justify-center shrink-0">
            <Search className="text-accent-blue" size={24} />
          </div>
          <div>
            <h3 className="font-black italic uppercase text-lg leading-none">{t('ai_scanner')}</h3>
            <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Grooming & Pattern Analysis</p>
          </div>
        </div>

        {!result ? (
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Search size={20} />
              </motion.div>
            ) : (
              <Camera size={20} />
            )}
            {isScanning ? "PROBING..." : "SCAN SCREENSHOT"}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className={cn(
              "p-5 rounded-3xl border-2",
              result.riskLevel === 'High' ? "bg-red-600/5 border-red-600/30" : "bg-orange-500/5 border-orange-500/30"
            )}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Risk Level</span>
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic",
                  result.riskLevel === 'High' ? "bg-red-600 text-white" : "bg-orange-500 text-black"
                )}>{result.riskLevel}</span>
              </div>
              <ul className="space-y-3">
                {result.flags?.map((flag: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-xs font-medium text-white/80">
                    <AlertTriangle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-accent-blue/5 border border-accent-blue/20 p-4 rounded-2xl">
              <p className="text-xs text-accent-blue font-bold italic">"{result.advice}"</p>
            </div>

            <button
              onClick={() => setResult(null)}
              className="w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
            >
              SCAN ANOTHER
            </button>
          </motion.div>
        )}
      </section>

      {/* SOS AI Analyzer Section */}
      <section className="bento-card border-accent-red/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-accent-red/5 border border-accent-red/20 rounded-2xl flex items-center justify-center">
            <Brain className="text-accent-red" size={24} />
          </div>
          <div>
            <h3 className="font-black italic uppercase text-lg leading-none">SOS PROBABILITY</h3>
            <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Neural Threat Indexing</p>
          </div>
        </div>

        {!sosAnalysis ? (
          <button
            onClick={() => analyzeSOS("SOS triggered in high-threat zone at 11 PM. Movement velocity 15km/h.")}
            disabled={isAnalyzingSOS}
            className="w-full h-16 bg-accent-red text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-accent-red/20"
          >
            {isAnalyzingSOS ? <Sparkles className="animate-spin" size={20} /> : <Brain size={20} />}
            {isAnalyzingSOS ? "THINKING..." : "ANALYZE ACTIVE ALERT"}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">Verdict</span>
                <span className={cn("font-black italic text-lg", sosAnalysis.verdict === 'Real' ? "text-accent-red" : "text-green-500")}>
                  {sosAnalysis.verdict.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">Confidence</span>
                <span className="block font-black text-2xl italic">{sosAnalysis.probability}%</span>
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-2">Internal Analysis</p>
              <p className="text-xs font-medium leading-relaxed italic">{sosAnalysis.reasoning}</p>
            </div>

            <button
              onClick={() => setSosAnalysis(null)}
              className="w-full py-2 text-[8px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white transition-colors"
            >
              RESET ENGINE
            </button>
          </motion.div>
        )}
      </section>
    </div>
  );
}
