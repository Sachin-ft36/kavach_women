// 🚨 Web Audio API Police Siren Synthesizer (Browser Fallback/Cross-Platform)
let audioCtx: AudioContext | null = null;
let sirenOscillator: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let sirenInterval: any = null;

export const startWebSiren = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (sirenOscillator) return;

    sirenOscillator = audioCtx.createOscillator();
    sirenGain = audioCtx.createGain();

    sirenOscillator.type = 'square';
    sirenGain.gain.value = 0.8; // LOUD

    sirenOscillator.connect(sirenGain);
    sirenGain.connect(audioCtx.destination);

    sirenOscillator.start();

    let isHigh = false;
    sirenInterval = setInterval(() => {
      isHigh = !isHigh;
      if (sirenOscillator && audioCtx) {
        sirenOscillator.frequency.setTargetAtTime(isHigh ? 1200 : 700, audioCtx.currentTime, 0.1);
      }
    }, 450); // fast alternating police siren
  } catch (e) {
    console.error("Web Audio API not supported", e);
  }
};

export const stopWebSiren = () => {
  if (sirenOscillator) {
    try {
      sirenOscillator.stop();
      sirenOscillator.disconnect();
    } catch (e) { }
    sirenOscillator = null;
  }
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
};
