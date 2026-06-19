import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { auth, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface UseIdentityOnboardingProps {
  phone: string;
  setPhotoUrl: (url: string) => void;
  checkDuplicatePhone?: (phone: string) => Promise<boolean>;
}

export function useIdentityOnboarding({ phone, setPhotoUrl, checkDuplicatePhone }: UseIdentityOnboardingProps) {
  const [phoneState, setPhoneState] = useState<'idle' | 'otp_sent' | 'verified'>(phone ? 'verified' : 'idle');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [celebration, setCelebration] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const triggerCelebration = (msg: string) => {
    setCelebration(msg);
    setTimeout(() => setCelebration(''), 2000);
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (file: File): Promise<{ file: File; base64: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new globalThis.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 120;
          const MAX_HEIGHT = 120;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const base64 = canvas.toDataURL('image/jpeg', 0.5);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name || 'avatar.jpg', { type: 'image/jpeg' });
                resolve({ file: compressedFile, base64 });
              } else {
                resolve({ file, base64: event.target?.result as string });
              }
            }, 'image/jpeg', 0.5);
          } else {
            resolve({ file, base64: event.target?.result as string });
          }
        };
        img.onerror = () => {
          resolve({ file, base64: event.target?.result as string });
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve({ file, base64: '' });
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    triggerCelebration('📸 Photo Selected!');

    try {
      const { file: compressedFile, base64 } = await compressImage(file);
      setPhotoUrl(base64);

      const filePath = `avatars/${Math.random().toString(36).slice(2)}_${Date.now()}.jpeg`;
      let ok = false;
      
      try {
        const { error } = await Promise.race([
          supabase.storage.from('evidence').upload(filePath, compressedFile, { upsert: true }),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Supabase Timeout')), 3000))
        ]);
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(filePath);
          setPhotoUrl(publicUrl);
          ok = true;
        }
      } catch (err) {
        console.warn("Supabase upload failed or timed out:", err);
      }

      if (!ok) {
        try {
          const uid = auth.currentUser?.uid || 'anon';
          const fileRef = ref(storage, `avatars/${uid}_${Date.now()}.jpg`);
          await Promise.race([
            uploadBytes(fileRef, compressedFile),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Firebase Timeout')), 3000))
          ]);
          setPhotoUrl(await getDownloadURL(fileRef));
          ok = true;
        } catch (err) {
          console.warn("Firebase upload failed or timed out:", err);
        }
      }
    } catch (err) {
      console.error("Compression/Upload error:", err);
    }
    setIsUploading(false);
  };

  const startCamera = async () => {
    try {
      if (stream) stream.getTracks().forEach(t => t.stop());
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } }, audio: false
      });
      setStream(mediaStream);
      setIsCameraActive(true);
    } catch {
      toast.error("Camera access denied. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 120; canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, 120, 120);
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    setIsCameraActive(false);
    const base64 = canvas.toDataURL('image/jpeg', 0.5);
    setPhotoUrl(base64);
    triggerCelebration('📸 Identity Locked!');

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setIsUploading(true);
      const filePath = `avatars/${Math.random().toString(36).slice(2)}_${Date.now()}.jpeg`;
      const file = new File([blob], filePath, { type: 'image/jpeg' });
      let ok = false;
      
      try {
        const { error } = await Promise.race([
          supabase.storage.from('evidence').upload(filePath, file, { upsert: true }),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Supabase Timeout')), 3000))
        ]);
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(filePath);
          setPhotoUrl(publicUrl);
          ok = true;
        }
      } catch (err) {
        console.warn("Supabase upload failed or timed out:", err);
      }

      if (!ok) {
        try {
          const uid = auth.currentUser?.uid || 'anon';
          const fileRef = ref(storage, `avatars/${uid}_${Date.now()}.jpg`);
          await Promise.race([
            uploadBytes(fileRef, blob),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Firebase Timeout')), 3000))
          ]);
          setPhotoUrl(await getDownloadURL(fileRef));
          ok = true;
        } catch (err) {
          console.warn("Firebase upload failed or timed out:", err);
        }
      }
      setIsUploading(false);
    }, 'image/jpeg', 0.5);
  };

  const handleSendOTP = async () => {
    if (phone.length < 10) return;
    if (checkDuplicatePhone) {
      const dup = await checkDuplicatePhone(phone);
      if (dup) { toast.error("Phone already linked to another account."); return; }
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedOtp(otp);
    setPhoneOtp(otp);
    setPhoneState('otp_sent');
    toast.success(`OTP: ${otp}`, { duration: 15000 });
  };

  const handleVerifyOTP = () => {
    if (phoneOtp !== expectedOtp) { toast.error("Invalid OTP"); return; }
    setPhoneState('verified');
    triggerCelebration('🔒 Signal Secured!');
  };

  return {
    phoneState, setPhoneState, phoneOtp, setPhoneOtp, isUploading, isCameraActive, celebration,
    videoRef, fileInputRef, handleGalleryClick, handleFileChange, startCamera, capturePhoto, handleSendOTP, handleVerifyOTP
  };
}
