import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Headphones, Play, Pause, Disc, ArrowRight,
  CloudRain, Waves, TreePine, Moon, Bird, Plus, Check,
  SkipBack, SkipForward, Leaf, Brain, Heart, Clock, ChevronRight
} from 'lucide-react';
import { useKavachStore } from '../../../state/useKavachStore';

interface CalmSpaceCardProps {
  isNight: boolean;
}

// ─── AMBIENT EFFECT ENGINES (Web Audio API) ────────────────────────────
type EffectEngine = (ctx: AudioContext, masterGain: GainNode) => () => void;

const rainEngine: EffectEngine = (ctx, master) => {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Pink noise generation for a softer, warmer, and less harsh rain tone
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11; // Softer base volume
    b6 = white * 0.115926;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Very warm bandpass filter for a cozy, soft rain pattern
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 850; // Centered at a warmer frequency range
  bp.Q.value = 0.45;

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1600; // Shaves off high sizzle for a misty, soft drop sound

  source.connect(bp);
  bp.connect(lp);
  lp.connect(master);
  source.start();
  return () => { try { source.stop(); } catch {} };
};

const oceanEngine: EffectEngine = (ctx, master) => {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) d[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.12;
  lfoGain.gain.value = 0.35;
  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  lfo.start();
  source.connect(lp);
  lp.connect(master);
  source.start();
  return () => {
    try { source.stop(); } catch {}
    try { lfo.stop(); } catch {}
  };
};

const birdEngine: EffectEngine = (ctx, master) => {
  const intervals: ReturnType<typeof setInterval>[] = [];

  // ── Soft morning wind ambience ──────────────────────────────────────
  const windBuf = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = windBuf.getChannelData(ch);
    let b = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      b = 0.997 * b + 0.003 * w;
      d[i] = b * 0.18;
    }
  }
  const wind = ctx.createBufferSource();
  wind.buffer = windBuf;
  wind.loop = true;
  const windLp = ctx.createBiquadFilter();
  windLp.type = 'lowpass';
  windLp.frequency.value = 320;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.55;
  wind.connect(windLp);
  windLp.connect(windGain);
  windGain.connect(master);
  wind.start();

  // ── Natural chirp synthesizer using FM + harmonics ──────────────────
  // Patterns: [freqHz, numNotes, noteGap, vibrato, duration, gain]
  const birdSpecies = [
    { baseFreq: 3200, notes: 4, gap: 0.09, vib: 60,  dur: 0.13, vol: 0.11 }, // small songbird
    { baseFreq: 2100, notes: 2, gap: 0.18, vib: 30,  dur: 0.22, vol: 0.09 }, // robin-like
    { baseFreq: 4100, notes: 6, gap: 0.05, vib: 80,  dur: 0.08, vol: 0.08 }, // warbler-like fast trill
    { baseFreq: 1600, notes: 3, gap: 0.22, vib: 20,  dur: 0.28, vol: 0.10 }, // deeper wood thrush
    { baseFreq: 2800, notes: 2, gap: 0.14, vib: 50,  dur: 0.16, vol: 0.09 }, // finch-like
  ];

  const chirp = (species: typeof birdSpecies[0]) => {
    const t0 = ctx.currentTime + 0.01;
    for (let n = 0; n < species.notes; n++) {
      const t = t0 + n * species.gap;
      const freq = species.baseFreq * (0.88 + Math.random() * 0.26);

      // Carrier oscillator (main tone)
      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(freq, t);
      carrier.frequency.linearRampToValueAtTime(freq * (1.08 + Math.random() * 0.18), t + species.dur * 0.45);
      carrier.frequency.exponentialRampToValueAtTime(freq * (0.82 + Math.random() * 0.1), t + species.dur);

      // Vibrato LFO for natural wobble
      const vibLfo = ctx.createOscillator();
      const vibGain = ctx.createGain();
      vibLfo.type = 'sine';
      vibLfo.frequency.value = 18 + Math.random() * 12;
      vibGain.gain.value = species.vib * (0.6 + Math.random() * 0.8);
      vibLfo.connect(vibGain);
      vibGain.connect(carrier.frequency);

      // Harmonic overtone (+1 octave, soft)
      const harmonic = ctx.createOscillator();
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(freq * 2, t);
      harmonic.frequency.linearRampToValueAtTime(freq * 2.12, t + species.dur * 0.45);
      harmonic.frequency.exponentialRampToValueAtTime(freq * 1.65, t + species.dur);

      const harmGain = ctx.createGain();
      harmGain.gain.value = 0;
      harmGain.gain.setValueAtTime(0, t);
      harmGain.gain.linearRampToValueAtTime(species.vol * 0.35, t + 0.015);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, t + species.dur);

      // Envelope on carrier
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(species.vol, t + 0.018);
      env.gain.setValueAtTime(species.vol, t + species.dur * 0.6);
      env.gain.exponentialRampToValueAtTime(0.0001, t + species.dur);

      carrier.connect(env);
      env.connect(master);
      harmonic.connect(harmGain);
      harmGain.connect(master);

      carrier.start(t);
      carrier.stop(t + species.dur + 0.02);
      harmonic.start(t);
      harmonic.stop(t + species.dur + 0.02);
      vibLfo.start(t);
      vibLfo.stop(t + species.dur + 0.02);
    }
  };

  // Schedule random bird calls from different species
  const scheduleChirp = () => {
    const species = birdSpecies[Math.floor(Math.random() * birdSpecies.length)];
    if (Math.random() > 0.15) chirp(species);
    const nextIn = 1200 + Math.random() * 3500;
    const id = setTimeout(scheduleChirp, nextIn);
    intervals.push(id as any);
  };

  // Start with 2 initial birds calling at slightly different times
  const id1 = setTimeout(() => { chirp(birdSpecies[0]); scheduleChirp(); }, 300);
  const id2 = setTimeout(() => { chirp(birdSpecies[2]); }, 1400);
  intervals.push(id1 as any, id2 as any);

  return () => {
    try { wind.stop(); } catch {}
    intervals.forEach(id => { try { clearTimeout(id as any); clearInterval(id as any); } catch {} });
  };
};

const forestEngine: EffectEngine = (ctx, master) => {
  const bufSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  source.connect(lp);
  lp.connect(master);
  source.start();
  const intervals: ReturnType<typeof setInterval>[] = [];
  const id = setInterval(() => {
    if (Math.random() > 0.3) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 2000 + Math.random() * 2000;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(g);
      g.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  }, 1500 + Math.random() * 2500);
  intervals.push(id);
  return () => {
    try { source.stop(); } catch {}
    intervals.forEach(clearInterval);
  };
};

const healingEngine: EffectEngine = (ctx, master) => {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 528;
  gainNode.gain.value = 0.08;
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 528 * 2;
  g2.gain.value = 0.03;
  osc.connect(gainNode);
  gainNode.connect(master);
  osc2.connect(g2);
  g2.connect(master);
  osc.start();
  osc2.start();
  return () => {
    try { osc.stop(); } catch {}
    try { osc2.stop(); } catch {}
  };
};

// ─── EFFECT DEFINITIONS ────────────────────────────────────────────────
const EFFECTS = [
  { id: 'rain',    label: 'Rain',    icon: CloudRain, engine: rainEngine,    color: '#38BDF8' }, // morning sky blue
  { id: 'ocean',   label: 'Ocean',   icon: Waves,     engine: oceanEngine,   color: '#2DD4BF' }, // fresh teal
  { id: 'birds',   label: 'Birds',   icon: Bird,      engine: birdEngine,    color: '#86EFAC' }, // fresh morning green
  { id: 'forest',  label: 'Forest',  icon: TreePine,  engine: forestEngine,  color: '#4ADE80' }, // fresh morning green
  { id: 'healing', label: 'Healing', icon: Moon,      engine: healingEngine, color: '#FB7185' }, // soft sunrise rose
];

const SESSION_DURATION = 25 * 60;

export const CalmSpaceCard = React.memo(({ isNight }: CalmSpaceCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION);
  const [activeEffects, setActiveEffects] = useState<Set<string>>(new Set());

  // Real-time synchronization states for CalmSpaceScreen storage tracks
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isKavachPlaying, setIsKavachPlaying] = useState(false);
  const [kavachTime, setKavachTime] = useState(0);
  const [kavachDuration, setKavachDuration] = useState(0);

  const latestFrequenciesRef = useRef<{ frequencies: number[]; isSilent: boolean } | null>(null);

  // Sync event listener effect
  useEffect(() => {
    const onSongChange = (e: Event) => {
      const song = (e as CustomEvent).detail;
      setCurrentTrack(song);
    };

    const onPlayStateChange = (e: Event) => {
      const { isPlaying: playing } = (e as CustomEvent).detail;
      setIsKavachPlaying(playing);
    };

    const onTimeUpdate = (e: Event) => {
      const { currentTime, duration } = (e as CustomEvent).detail;
      setKavachTime(currentTime);
      setKavachDuration(duration);
    };

    const onFrequencyUpdate = (e: Event) => {
      latestFrequenciesRef.current = (e as CustomEvent).detail;
    };

    window.addEventListener('kavach-song-change', onSongChange);
    window.addEventListener('kavach-play-state-change', onPlayStateChange);
    window.addEventListener('kavach-time-update', onTimeUpdate);
    window.addEventListener('kavach-frequency-data', onFrequencyUpdate);

    // Eagerly request current playing song state if already playing
    window.dispatchEvent(new CustomEvent('kavach-request-current-song'));

    return () => {
      window.removeEventListener('kavach-song-change', onSongChange);
      window.removeEventListener('kavach-play-state-change', onPlayStateChange);
      window.removeEventListener('kavach-time-update', onTimeUpdate);
      window.removeEventListener('kavach-frequency-data', onFrequencyUpdate);
    };
  }, []);

  // Refs
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const visualizerRef = useRef<HTMLDivElement | null>(null);
  const effectCleanupsRef = useRef<Map<string, () => void>>(new Map());
  const effectGainsRef = useRef<Map<string, GainNode>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '00:00';
    const totalSecs = Math.floor(sec);
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Ensure AudioContext is alive
  const getCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Toggle main Meditation track play/pause
  const togglePlay = useCallback(() => {
    const ctx = getCtx();
    if (!htmlAudioRef.current) {
      htmlAudioRef.current = new Audio('/voice/meditiation.mp3');
      htmlAudioRef.current.loop = true;
      htmlAudioRef.current.volume = 1.0; // Max volume for main song

      // Create and connect Analyser node for live song tone feedback
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128; // Small size to match our 36-bar layout
      analyser.smoothingTimeConstant = 0.88; // Butter-smooth average
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(htmlAudioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioSourceRef.current = source;
    }
    setIsPlaying(prev => {
      if (prev) {
        htmlAudioRef.current?.pause();
        return false;
      } else {
        htmlAudioRef.current?.play().catch(() => {});
        return true;
      }
    });
  }, [getCtx]);

  // Toggle an ambient effect layer
  const toggleEffect = useCallback((effectId: string) => {
    const ctx = getCtx();
    setActiveEffects(prev => {
      const next = new Set(prev);
      if (next.has(effectId)) {
        // ── Remove effect: fade out then cleanup ──
        const gainNode = effectGainsRef.current.get(effectId);
        if (gainNode && audioCtxRef.current) {
          gainNode.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.4);
        }
        setTimeout(() => {
          effectCleanupsRef.current.get(effectId)?.();
          effectCleanupsRef.current.delete(effectId);
          effectGainsRef.current.delete(effectId);
        }, 600);
        next.delete(effectId);
      } else {
        // ── Add effect: create gain node & start engine ──
        const master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
        effectGainsRef.current.set(effectId, master);

        const effect = EFFECTS.find(e => e.id === effectId);
        if (effect) {
          const cleanup = effect.engine(ctx, master);
          effectCleanupsRef.current.set(effectId, cleanup);
          // Fade in — extremely soft background level (volume 0.12)
          master.gain.setTargetAtTime(0.12, ctx.currentTime, 0.8);
        }
        next.add(effectId);
      }
      return next;
    });
  }, [getCtx]);

  // Countdown timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            htmlAudioRef.current?.pause();
            setIsPlaying(false);
            return SESSION_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };

  // Mute / unmute ambient effects when Firebase storage song pauses / resumes
  }, [isPlaying]);

  useEffect(() => {
    // No effects active — nothing to suspend
    if (effectGainsRef.current.size === 0) return;

    // Ensure AudioContext exists (created when any effect was activated)
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (isKavachPlaying) {
      // Song resumed — bring back ambient effects
      ctx.resume().catch(() => {});
    } else {
      // Song paused — silence ALL ambient effects immediately
      ctx.suspend().catch(() => {});
    }
  }, [isKavachPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      htmlAudioRef.current?.pause();
      effectCleanupsRef.current.forEach(fn => fn());
      if (timerRef.current) clearInterval(timerRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  // Real-time Audio Visualizer animation loop using requestAnimationFrame
  useEffect(() => {
    let animationFrameId: number;
    
    const updateVisualizer = () => {
      if (!visualizerRef.current) return;
      const bars = visualizerRef.current.children;
      if (!bars || bars.length === 0) return;

      const isAnimating = isPlaying || isKavachPlaying;
      
      if (!isAnimating) {
        // Smoothly decay bars to minimum height when paused
        for (let i = 0; i < bars.length; i++) {
          const bar = bars[i] as HTMLDivElement;
          const currentH = parseFloat(bar.style.height || '15');
          if (currentH > 15) {
            bar.style.height = `${currentH - (currentH - 15) * 0.15}%`;
          } else {
            bar.style.height = '15%';
          }
        }
        animationFrameId = requestAnimationFrame(updateVisualizer);
        return;
      }

      const hasAnalyser = isPlaying && analyserRef.current;
      let dataArray: Uint8Array | null = null;
      if (hasAnalyser) {
        const bufferLength = analyserRef.current!.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyserRef.current!.getByteFrequencyData(dataArray);
      }

      // Check if we have broadcast frequency data from the active parent song
      const parentFreqs = latestFrequenciesRef.current;
      const useParentFreqs = isKavachPlaying && parentFreqs && !parentFreqs.isSilent;

      // Base time driven by actual song progress time if streaming, or performance.now if local
      const songProgress = kavachDuration > 0 ? (kavachTime / kavachDuration) : 0;
      const t = isKavachPlaying ? kavachTime : (performance.now() / 1000);
      
      // Calculate dynamic procedural beat values synced to the actual playback clock (t)
      // Since t stops moving when paused, the visualizer stops bouncing!
      const pulseSpeed = 1.83; 
      const bassPulse = Math.pow(Math.sin(t * Math.PI * pulseSpeed), 4);
      const snarePulse = Math.pow(Math.cos(t * Math.PI * pulseSpeed + 0.4), 6);
      const melodyActivity = Math.sin(t * 7.5) * Math.cos(t * 3.2) * 0.5 + 0.5;

      // Energy factor based on where the song is in its progress (simulate intro/chorus/outro)
      let energyFactor = 1.0;
      if (isKavachPlaying && kavachDuration > 0) {
        if (songProgress < 0.08) {
          // Intro: quiet build-up
          energyFactor = 0.35 + (songProgress / 0.08) * 0.65;
        } else if (songProgress > 0.85) {
          // Outro: decay to silence
          energyFactor = Math.max(0.15, 1.0 - ((songProgress - 0.85) / 0.15));
        }
      }

      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i] as HTMLDivElement;
        let targetHeight = 15; // Minimum height

        if (dataArray) {
          // Case 1: Real local audio analyser data (voice meditation)
          const binIndex = Math.min(dataArray.length - 1, Math.floor((i / bars.length) * 40));
          const rawValue = dataArray[binIndex] || 0;
          targetHeight = Math.max(15, (rawValue / 255) * 100);
        } else if (useParentFreqs && parentFreqs) {
          // Case 2: Real broadcast frequency data from parent screen player (Firebase category songs)
          const freqs = parentFreqs.frequencies;
          const binIndex = Math.min(freqs.length - 1, Math.floor((i / bars.length) * 45));
          const rawValue = freqs[binIndex] || 0;
          targetHeight = Math.max(15, (rawValue / 255) * 100);
        } else {
          // Case 3: Procedural beat sync driven by the audio playback timeline (kavachTime)
          const normalizedPos = i / (bars.length - 1);
          
          if (normalizedPos < 0.25) {
            // Bass bars (0% to 25%) - react strongly to bassPulse
            const weight = (0.25 - normalizedPos) / 0.25;
            targetHeight = 15 + (bassPulse * 65 * weight * energyFactor) + (Math.random() * 10);
          } else if (normalizedPos >= 0.25 && normalizedPos < 0.7) {
            // Mid bars (25% to 70%) - react to snarePulse and melodyActivity
            const weight = 1 - Math.abs(normalizedPos - 0.47) / 0.22;
            targetHeight = 15 + (snarePulse * 45 * weight * energyFactor) + (melodyActivity * 30 * (1 - weight) * energyFactor) + (Math.random() * 8);
          } else {
            // Highs (70% to 100%) - jittery high-frequency chatter
            const weight = (normalizedPos - 0.7) / 0.3;
            const jitter = Math.sin(t * 22 + i) * Math.cos(t * 37 - i) * 0.5 + 0.5;
            targetHeight = 15 + (jitter * 35 * weight * energyFactor) + (Math.random() * 6);
          }
        }

        // Clamp to max 100%
        bar.style.height = `${Math.min(100, targetHeight)}%`;
      }

      animationFrameId = requestAnimationFrame(updateVisualizer);
    };

    animationFrameId = requestAnimationFrame(updateVisualizer);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isKavachPlaying]);

  const [activeTheme, setActiveTheme] = useState<'peace' | 'focus' | 'relax'>('peace');

  // Custom Symmetrical Lotus SVG Icon
  const LotusIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-3.1 3.5-5 8.1-5 13 0 2.8 2.2 5 5 5s5-2.2 5-5c0-4.9-1.9-9.5-5-13Z" />
      <path d="M12 20c-3.1-3.5-7-5.5-10-5.5 1 4.5 4.5 8 9 9Z" />
      <path d="M12 20c3.1-3.5 7-5.5 10-5.5-1 4.5-4.5 8-9 9Z" />
    </svg>
  );

  const LeafIcon = () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  );

  // Symmetrical audio visualizer waveform data
  const wave = [
    3, 4, 3, 5, 8, 6, 10, 15, 12, 20, 25, 22, 30, 40, 35, 45, 38, 48,
    42, 50, 32, 38, 28, 20, 22, 15, 12, 18, 10, 8, 6, 5, 3, 4, 3, 2
  ];

  return (
    <div className={`flex-1 rounded-[24px] p-1.5 flex flex-col justify-start gap-2.5 border ${
      isNight ? 'bg-[#120F22] border-[#30254C] shadow-[0_20px_60px_rgba(0,0,0,0.45)]' : 'bg-white border-slate-200/50 shadow-sm'
    } h-[280px] relative overflow-hidden font-sans`}>
      
      {/* Subtle Outer Glow Decoration */}
      <div className={`absolute -top-20 -right-20 w-32 h-32 bg-[#A855F7] blur-[60px] rounded-full pointer-events-none ${
        isNight ? 'opacity-20' : 'opacity-[0.04]'
      }`}></div>

      {/* HEADER */}
      <div className="flex justify-between items-start z-10 relative">
        <div className="flex gap-1 items-center">
          {/* Glowing Lotus Icon */}
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            isNight 
              ? 'bg-[#24183D] text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]' 
              : 'bg-purple-50 text-[#7C4DFF] border border-purple-100/50'
          }`}>
            <LotusIcon />
          </div>
          <div className="text-left">
            <h2 className={`font-black text-[10px] tracking-wide leading-none ${isNight ? 'text-white' : 'text-slate-800'}`}>CALM SPACE</h2>
            <p className={`text-[7.5px] mt-1 leading-none ${isNight ? 'text-[#B8B2CC]' : 'text-slate-500'}`}>
              {currentTrack ? `${currentTrack.category} Session` : '2 min break'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => useKavachStore.getState().setActiveTab('calm_space')}
          className={`flex items-center text-[7px] font-bold hover:opacity-85 transition-colors group cursor-pointer border-none bg-transparent ${
            isNight ? 'text-[#C56EFF]' : 'text-purple-600'
          }`}
        >
          View All
          <ChevronRight className="w-2 h-2 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* HERO IMAGE SECTION */}
      <div 
        onClick={() => useKavachStore.getState().setActiveTab('calm_space')}
        className={`relative w-full h-[90px] rounded-[12px] overflow-hidden group cursor-pointer border z-10 mt-1 ${
          isNight ? 'border-[#30254C]/30' : 'border-slate-100/50'
        }`}
      >
        <img 
          src={currentTrack?.img || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=300&q=80'} 
          alt={currentTrack?.title || 'Heart Mantra'} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
        />
        {/* Overlay Gradients to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#090713]/85 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#090713]/80 via-transparent to-transparent opacity-60"></div>
        
        {/* Image Content */}
        <div className="absolute inset-0 p-2 flex flex-col justify-between text-left">
          {/* Top Row: Title */}
          <div className="flex justify-between items-start w-full">
            <h3 className="text-white font-black text-[11.5px] tracking-tight leading-none">
              {currentTrack?.title || 'Heart Mantra'}
            </h3>
          </div>
          
          {/* Bottom Row: Subtitle */}
          <div>
            <p className="text-[#C56EFF] text-[7.5px] font-medium leading-none">
              {currentTrack ? (currentTrack.subtitle || 'Playing from storage') : 'Aks & Lakshmi'}
            </p>
          </div>
        </div>
      </div>

      {/* AUDIO VISUALIZER */}
      <div 
        ref={visualizerRef}
        className="flex items-end justify-center h-6 gap-[1.5px] px-1 z-10 relative mt-[-8px]"
      >
        {wave.map((height, i) => {
          return (
            <div 
              key={i}
              className="flex-1 rounded-full visualizer-bar"
              style={{
                height: '15%',
                background: 'linear-gradient(180deg, #A855F7 0%, #FF4FC9 50%, #8B5CFF 100%)',
                opacity: i % 2 === 0 ? 1 : 0.7,
                transformOrigin: 'bottom',
                transition: 'height 0.08s ease-out'
              }}
            />
          );
        })}
      </div>

      {/* PLAYER CONTROLS */}
      <div className="flex items-center justify-center gap-4 z-10 relative">
        <button 
          onClick={() => {
            if (currentTrack) {
              window.dispatchEvent(new CustomEvent('kavach-cmd-prev'));
            }
          }}
          className={`w-[21px] h-[21px] rounded-full border flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
            isNight 
              ? 'bg-[#181329] border-[#30254C] text-white hover:bg-[#24183D]' 
              : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <SkipBack className="w-2.5 h-2.5 fill-current" />
        </button>
        
        {/* Floating Play Button */}
        <button 
          onClick={() => {
            if (currentTrack) {
              window.dispatchEvent(new CustomEvent('kavach-cmd-play-pause'));
            } else {
              togglePlay();
            }
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer border-0"
          style={{
            background: 'linear-gradient(135deg, #A855F7 0%, #FF4FC9 50%, #FF7A00 100%)',
            boxShadow: '0 3px 8px rgba(255,79,201,0.35)'
          }}
        >
          {(currentTrack ? isKavachPlaying : isPlaying) ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        <button 
          onClick={() => {
            if (currentTrack) {
              window.dispatchEvent(new CustomEvent('kavach-cmd-next'));
            }
          }}
          className={`w-[21px] h-[21px] rounded-full border flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
            isNight 
              ? 'bg-[#181329] border-[#30254C] text-white hover:bg-[#24183D]' 
              : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <SkipForward className="w-2.5 h-2.5 fill-current" />
        </button>
      </div>

      {/* PROGRESS BAR */}
      {(() => {
        const isSongPlaying = !!currentTrack;
        const totalDuration = isSongPlaying ? kavachDuration : SESSION_DURATION;
        const currentTimeVal = isSongPlaying ? kavachTime : (SESSION_DURATION - timeLeft);
        const progressPercent = (currentTimeVal / (totalDuration || 1)) * 100;
        
        return (
          <div className="flex items-center gap-2 z-10 relative px-0.5">
            <span className={`text-[6.5px] font-bold tabular-nums leading-none ${isNight ? 'text-[#A7A3BC]' : 'text-slate-400'}`}>{formatTime(currentTimeVal)}</span>
            <div 
              onClick={(e) => {
                if (isSongPlaying && totalDuration > 0) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percent = clickX / rect.width;
                  const newSeekTime = percent * totalDuration;
                  window.dispatchEvent(new CustomEvent('kavach-cmd-seek', { detail: newSeekTime }));
                }
              }}
              className={`flex-1 h-1 rounded-full relative cursor-pointer ${isNight ? 'bg-[#2C2642]' : 'bg-slate-100'}`}
            >
              <div 
                className="absolute left-0 top-0 h-full rounded-full"
                style={{ 
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #A855F7 0%, #FF4FC9 100%)' 
                }}
              >
                {/* Thumb */}
                <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full ${
                  isNight ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]' : 'bg-[#FF4FC9] shadow-[0_0_6px_rgba(255,79,201,0.5)]'
                }`}></div>
              </div>
            </div>
            <span className={`text-[6.5px] font-bold tabular-nums leading-none ${isNight ? 'text-[#A7A3BC]' : 'text-slate-400'}`}>{formatTime(totalDuration)}</span>
          </div>
        );
      })()}


      {/* AMBIENT SOUND ICONS — inner card */}
      <div className={`rounded-[14px] border px-2 py-1.5 z-10 relative mx-[1px] ${
        isNight ? 'bg-[#0D0B1A] border-[#2997FF]/20' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Card heading */}
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[6.5px] font-black uppercase tracking-widest ${isNight ? 'text-[#2997FF]' : 'text-purple-500'}`}>
            🎵 Ambient Mix
          </span>
          <span className={`text-[5.5px] font-medium ${isNight ? 'text-white/30' : 'text-slate-400'}`}>
            Tap to activate
          </span>
        </div>
        <div className="flex justify-between items-center px-0.5 gap-1.5 w-full">
          {EFFECTS.map(sound => {
            const isActive = activeEffects.has(sound.id);
            const Icon = sound.icon;
            return (
              <div key={sound.id} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <button
                  onClick={() => toggleEffect(sound.id)}
                  className={`w-[24px] h-[24px] rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? isNight 
                        ? 'bg-[#24183D] border-transparent' 
                        : 'bg-purple-50 border-transparent shadow-sm'
                      : isNight
                        ? 'bg-[#181329] border-[#30254C] hover:border-[#30254C]/80'
                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                  style={isActive ? { 
                    boxShadow: `0 0 8px ${sound.color}40`,
                    color: sound.color 
                  } : {
                    color: isNight ? '#8A85A3' : '#64748B'
                  }}
                >
                  <Icon className="w-[12px] h-[12px]" strokeWidth={isActive ? 2.5 : 2} />
                </button>
                <span className={`text-[6px] font-black tracking-tighter transition-colors mt-0.5 leading-none text-center truncate w-full ${
                  isActive 
                    ? isNight ? 'text-white' : 'text-slate-800' 
                    : isNight ? 'text-[#6C6785]' : 'text-slate-400'
                }`}>
                  {sound.id === 'healing' ? 'White Noise' : sound.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
});

CalmSpaceCard.displayName = 'CalmSpaceCard';
