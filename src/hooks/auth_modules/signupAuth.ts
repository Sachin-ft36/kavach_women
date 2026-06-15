import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export const handleSignup = async (
  loginEmail: string,
  loginPassword: string,
  phone: string,
  username: string,
  setLoading: (val: boolean) => void,
  setNeedsVerification: (val: boolean) => void
) => {
  const fullPhone = `+91 ${phone.trim()}`;
  const q = query(collection(db, "users"), where("phone", "==", fullPhone));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    toast.error("This phone number is already registered.");
    setLoading(false);
    return;
  }

  const userCred = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
  await updateProfile(userCred.user, { displayName: username });
  await sendEmailVerification(userCred.user);

  const profileData = {
    uid: userCred.user.uid,
    email: loginEmail,
    phone: fullPhone,
    username,
    role: 'citizen',
    createdAt: new Date().toISOString(),
    isRegistered: false,
    isVerified: false,
    verificationStatus: 'pending'
  };

  await setDoc(doc(db, 'users', userCred.user.uid), profileData);

  try {
    await supabase.from('profiles').insert({
      id: userCred.user.uid,
      email: loginEmail,
      role: 'citizen',
      is_verified: false,
      metadata: profileData
    });
  } catch (supabaseErr) {
    console.warn("Supabase profile insert on signup deferred:", supabaseErr);
  }

  toast.info("Verification link sent! Please verify your email.");
  setNeedsVerification(true);
  await signOut(auth);
  setLoading(false);
};
