import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

let confirmationResult: ConfirmationResult | null = null;

export const setupRecaptcha = (containerId: string) => {
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        toast.error('Recaptcha expired. Please try again.');
      }
    });
  }
};

export const sendPhoneOTP = async (phoneNumber: string, containerId: string, setLoading: (b: boolean) => void): Promise<boolean> => {
  setLoading(true);
  try {
    setupRecaptcha(containerId);
    const appVerifier = (window as any).recaptchaVerifier;
    
    // Formatting to E.164 format for India if needed
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/\D/g, '')}`;
    
    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    toast.success('OTP sent successfully!');
    setLoading(false);
    return true;
  } catch (error: any) {
    console.error("Failed to send OTP", error);
    toast.error(error.message || 'Failed to send OTP. Try again.');
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      (window as any).recaptchaVerifier = null;
    }
    setLoading(false);
    return false;
  }
};

export const verifyPhoneOTP = async (otpCode: string, setLoading: (b: boolean) => void): Promise<boolean> => {
  if (!confirmationResult) {
    toast.error('No OTP session found. Please request OTP again.');
    return false;
  }
  
  setLoading(true);
  try {
    const result = await confirmationResult.confirm(otpCode);
    const user = result.user;
    
    // Check if user exists in Firestore, if not create basic provisional record
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        phone: user.phoneNumber,
        state_flags: {
          is_citizen: true,
          is_guardian: false,
          is_protector: false
        },
        account_status: 'PROVISIONAL',
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp()
      });
    }
    
    toast.success('Phone verified successfully!');
    setLoading(false);
    return true;
  } catch (error: any) {
    console.error("Invalid OTP", error);
    toast.error('Invalid OTP. Please check and try again.');
    setLoading(false);
    return false;
  }
};
