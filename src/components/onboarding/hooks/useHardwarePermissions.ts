import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { KavachNative } from '../../../services/KavachNative';
import { toast } from 'sonner';

export function useHardwarePermissions(step: number) {
  const [perms, setPerms] = useState({
    sms: 'prompt',
    call: 'prompt',
    camera: 'prompt',
    location: 'prompt',
    microphone: 'prompt'
  });
  const [overlayGranted, setOverlayGranted] = useState(false);
  const [fullScreenGranted, setFullScreenGranted] = useState(true);
  const [batteryExempt, setBatteryExempt] = useState(false);

  const checkHardwareStatus = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const o = await KavachNative.isOverlayPermissionGranted().catch(() => ({ granted: false }));
      setOverlayGranted(o.granted);
    } catch (e) { }

    try {
      const fs = await KavachNative.hasFullScreenIntentPermission().catch(() => ({ granted: true }));
      setFullScreenGranted(fs.granted);
    } catch (e) { }

    try {
      const b = await KavachNative.isIgnoringBatteryOptimizations().catch(() => ({ isExempt: false }));
      setBatteryExempt(b.isExempt);
    } catch (e) { }

    try {
      const p = await KavachNative.checkSafetyPermissions().catch(() => ({ sms: 'prompt', call: 'prompt', microphone: 'prompt' }));
      const geo = await Geolocation.checkPermissions().catch(() => ({ location: 'prompt' } as any));
      const cam = await Camera.checkPermissions().catch(() => ({ camera: 'prompt' } as any));

      setPerms({
        sms: p.sms || 'prompt',
        call: p.call || 'prompt',
        location: geo.location || 'prompt',
        camera: cam.camera || 'prompt',
        microphone: p.microphone || 'prompt'
      });
    } catch (e) { }
  };

  useEffect(() => {
    let checkInterval: any;
    const isShieldsStep = step === 5;

    if (isShieldsStep && Capacitor.isNativePlatform()) {
      checkHardwareStatus();
      checkInterval = setInterval(checkHardwareStatus, 1000);
      const listener = import('@capacitor/app').then(m => m.App.addListener('appStateChange', (state) => {
        if (state.isActive) checkHardwareStatus();
      }));
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') checkHardwareStatus();
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (checkInterval) clearInterval(checkInterval);
        listener.then(l => l.remove());
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [step]);

  const handleShieldToggle = async (id: string) => {
    if (!Capacitor.isNativePlatform()) {
      if (id === 'lifeline') setBatteryExempt(!batteryExempt);
      if (id === 'evidence') setOverlayGranted(!overlayGranted);
      if (id === 'guardian') setPerms({ sms: 'granted', call: 'granted', location: 'granted', camera: 'granted', microphone: 'granted' });
      return;
    }
    try {
      if (id === 'guardian') {
        await KavachNative.requestSensitivePermissions();
        await Geolocation.requestPermissions();
        await Camera.requestPermissions();
        await checkHardwareStatus();
      } else if (id === 'lifeline') {
        toast.info("Opening Battery Settings...");
        await KavachNative.openBatterySettings();
      } else if (id === 'evidence') {
        toast.info("Opening Settings...");
        if (!overlayGranted) {
          await KavachNative.openOverlaySettings();
        } else if (!fullScreenGranted) {
          await KavachNative.openFullScreenIntentSettings();
        }
      }
    } catch (e: any) {
      toast.error("Toggle Error: " + (e?.message || e));
    }
  };

  return {
    perms,
    setPerms,
    overlayGranted,
    setOverlayGranted,
    fullScreenGranted,
    setFullScreenGranted,
    batteryExempt,
    setBatteryExempt,
    handleShieldToggle
  };
}
