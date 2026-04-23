import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { auth } from '../firebase';

interface CallContextType {
  initiateCall: (targetUserId: string, targetName: string) => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => void;
  hangupCall: () => void;
  callState: 'idle' | 'calling' | 'ringing' | 'connected';
  remoteStream: MediaStream | null;
  callerName: string | null;
  activeCallUserId: string | null;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callerName, setCallerName] = useState<string | null>(null);
  const [activeCallUserId, setActiveCallUserId] = useState<string | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    // Determine signaling server URL (same as backend)
    const socketUrl = window.location.origin.includes('localhost') 
      ? 'http://localhost:3001' 
      : window.location.origin;

    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('KAVACH Signal: Connected to neural hub');
      if (auth.currentUser) {
        newSocket.emit('join', auth.currentUser.uid);
      }
    });

    newSocket.on('incoming-call', async ({ from, offer, fromName }) => {
      console.log('KAVACH Signal: Incoming tactical link from', fromName);
      setCallerName(fromName);
      setActiveCallUserId(from);
      setCallState('ringing');
      
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      setPeerConnection(pc);
    });

    newSocket.on('call-answered', async ({ answer }) => {
      console.log('KAVACH Signal: Tactical link established');
      setCallState('connected');
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        // Process any queued candidates
        pendingCandidates.current.forEach(candidate => {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });
        pendingCandidates.current = [];
      }
    });

    newSocket.on('ice-candidate', ({ candidate }) => {
      if (peerConnection && peerConnection.remoteDescription) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    newSocket.on('call-ended', () => {
      cleanupCall();
    });

    newSocket.on('call-failed', ({ reason }) => {
      console.warn('KAVACH Signal: Link failed:', reason);
      cleanupCall();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Re-sync socket join if user changes
  useEffect(() => {
    if (socket && auth.currentUser) {
      socket.emit('join', auth.currentUser.uid);
    }
  }, [socket, auth.currentUser]);

  const createPeerConnection = (targetUserId: string) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { to: targetUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log('KAVACH Signal: Receiving remote audio stream');
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupCall();
      }
    };

    return pc;
  };

  const cleanupCall = () => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    setCallState('idle');
    setRemoteStream(null);
    setCallerName(null);
    setActiveCallUserId(null);
    pendingCandidates.current = [];
  };

  const initiateCall = async (targetUserId: string, targetName: string) => {
    if (!socket || !auth.currentUser) return;

    try {
      setCallState('calling');
      setCallerName(targetName);
      setActiveCallUserId(targetUserId);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const pc = createPeerConnection(targetUserId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      setPeerConnection(pc);

      socket.emit('call-user', {
        to: targetUserId,
        offer,
        from: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Authorized Protector'
      });
    } catch (error) {
      console.error('KAVACH Signal: Microphone access denied or capture failed:', error);
      cleanupCall();
    }
  };

  const answerCall = async () => {
    if (!socket || !peerConnection || !activeCallUserId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      setCallState('connected');

      socket.emit('make-answer', { to: activeCallUserId, answer });
    } catch (error) {
      console.error('KAVACH Signal: Audio capture failed during handshake:', error);
      cleanupCall();
    }
  };

  const declineCall = () => {
    if (socket && activeCallUserId) {
      socket.emit('hangup', { to: activeCallUserId });
    }
    cleanupCall();
  };

  const hangupCall = () => {
    if (socket && activeCallUserId) {
      socket.emit('hangup', { to: activeCallUserId });
    }
    cleanupCall();
  };

  return (
    <CallContext.Provider value={{ initiateCall, answerCall, declineCall, hangupCall, callState, remoteStream, callerName, activeCallUserId }}>
      {children}
      {remoteStream && <AudioPlayer stream={remoteStream} />}
    </CallContext.Provider>
  );
};

const AudioPlayer = ({ stream }: { stream: MediaStream }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay hidden />;
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
