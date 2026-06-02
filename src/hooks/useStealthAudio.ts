import { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

// ⚠️ IMPORTANT: Replace with the actual Agora App ID generated from agora.io
export const AGORA_APP_ID = "989160effa7f461490a2d0cc54994cdb";

export const useStealthAudio = (channelName: string | null) => {
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(false);
  const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'FAILED'>('DISCONNECTED');
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // 1. Initialize Agora WebRTC Client
    clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    const client = clientRef.current;

    // 2. Handle incoming live audio stream from Victim's Phone
    const handleUserPublished = async (user: any, mediaType: "audio" | "video") => {
      await client.subscribe(user, mediaType);

      if (mediaType === "audio" && user.audioTrack) {
        // Automatically play the live microphone stream!
        user.audioTrack.play();
        setIsLiveStreamActive(true);
        console.log("🎙️ KAVACH STEALTH AUDIO: Receiving live victim microphone telemetry.");

        // 🔴 START AUTOMATIC EVIDENCE RECORDING
        try {
          const track = user.audioTrack.getMediaStreamTrack();
          const stream = new MediaStream([track]);
          const recorder = new MediaRecorder(stream);
          
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          
          recorder.onstop = () => {
            if (audioChunksRef.current.length === 0) return;
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            
            // Auto download evidence for Command Center
            const a = document.createElement('a');
            a.href = url;
            a.download = `Kavach_Audio_Evidence_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            audioChunksRef.current = []; // reset for next stream
            console.log("💾 KAVACH: Stealth Audio Evidence Saved to Disk.");
          };
          
          recorder.start();
          mediaRecorderRef.current = recorder;
        } catch(e) { 
          console.error("KAVACH RECORDING ERROR: Could not start MediaRecorder", e);
        }
      }
    };

    const handleUserUnpublished = (user: any, mediaType: "audio" | "video") => {
      if (mediaType === "audio") {
        setIsLiveStreamActive(false);
        console.log("🛑 KAVACH STEALTH AUDIO: Stream disconnected by victim device.");
        // Stop recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }
    };

    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      client.leave();
      client.removeAllListeners();
    };
  }, []);

  const startStealthStream = async () => {
    if (!channelName || !clientRef.current) return;

    try {
      setConnectionState('CONNECTING');
      
      // 3. Join the Secure Channel audience/listener. Token can be null for testing without auth.
      // Force channel-emergency for native Android sync
      await clientRef.current.join(AGORA_APP_ID, "channel-emergency", null, null);
      setConnectionState('CONNECTED');
    } catch (error) {
      console.error("KAVACH STEALTH AUDIO ERROR:", error);
      setConnectionState('FAILED');
    }
  };

  const stopStealthStream = async () => {
    if (clientRef.current) {
      await clientRef.current.leave();
    }
    setConnectionState('DISCONNECTED');
    setIsLiveStreamActive(false);
  };

  return {
    isLiveStreamActive,
    connectionState,
    startStealthStream,
    stopStealthStream
  };
};
