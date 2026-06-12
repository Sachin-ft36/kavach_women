import React, { createContext, useContext, useState, useRef } from 'react';
import { useKavachStore } from '../store/useKavachStore';
import { useCallSignaling } from './call_modules/useCallSignaling';
import { clearSignal, initiateCallAction, answerCallAction } from './call_modules/callActions';

interface CallContextType {
  initiateCall: (targetUserId: string, targetName: string, contextId?: string) => Promise<void>;
  answerCall: () => void;
  declineCall: () => void;
  hangupCall: () => void;
  callState: 'idle' | 'calling' | 'ringing' | 'connected';
  callerName: string | null;
  activeCallUserId: string | null;
}

const CallContext = createContext<CallContextType>({
  initiateCall: async () => {},
  answerCall: () => {},
  declineCall: () => {},
  hangupCall: () => {},
  callState: 'idle',
  callerName: null,
  activeCallUserId: null,
});

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [callerName, setCallerName] = useState<string | null>(null);
  const [activeCallUserId, setActiveCallUserId] = useState<string | null>(null);
  const [activeContextId, setActiveContextId] = useState<string | null>(null);
  const [zegoInstance, setZegoInstance] = useState<any>(null);
  const zegoContainerRef = useRef<HTMLDivElement>(null);
  const isJoiningRef = useRef(false);
  
  const { profile, user, activeAlertId } = useKavachStore();

  useCallSignaling(
    profile, user, activeAlertId, activeContextId,
    callState, setCallState, setCallerName, setActiveCallUserId, setActiveContextId,
    zegoInstance, setZegoInstance
  );

  const initiateCall = async (targetUid: string, targetName: string, contextId?: string) => {
    await initiateCallAction(
      targetUid, targetName, contextId, isJoiningRef, activeAlertId,
      setCallState, setCallerName, setActiveCallUserId, setActiveContextId,
      zegoContainerRef, setZegoInstance
    );
  };

  const answerCall = async () => {
    await answerCallAction(
      isJoiningRef, callState, activeAlertId, activeContextId,
      profile, setZegoInstance, zegoContainerRef, setCallState
    );
  };

  const declineCall = () => {
    setCallState('idle');
    if (zegoInstance) zegoInstance.destroy();
    clearSignal(undefined, activeAlertId, activeContextId);
    isJoiningRef.current = false;
  };

  const hangupCall = () => {
    if (zegoInstance) zegoInstance.destroy();
    setZegoInstance(null);
    setCallState('idle');
    clearSignal(undefined, activeAlertId, activeContextId);
    isJoiningRef.current = false;
  };

  return (
    <CallContext.Provider value={{ initiateCall, answerCall, declineCall, hangupCall, callState, callerName, activeCallUserId }}>
      {children}
      <div 
        ref={zegoContainerRef}
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '1px', 
          height: '1px', 
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }} 
      />
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
