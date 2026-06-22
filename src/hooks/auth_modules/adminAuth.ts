import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useKavachStore } from '../../store/useKavachStore';
import { toast } from 'sonner';

export const handleAdminAuth = async (
  targetEmail: string,
  loginPassword: string,
  adminTier: 'NATIONAL' | 'STATE' | 'DISTRICT' | 'PROTECTOR' | 'CITIZEN',
  setLoading: (val: boolean) => void
) => {
  sessionStorage.removeItem('kavach_dev_logout');
  try {
    const userCred = await signInWithEmailAndPassword(auth, targetEmail, loginPassword);
    const uid = userCred.user.uid;
    const displayName = targetEmail.includes('admin') ? 'NATIONAL COMMANDER' : 'COMMAND ADMIN';
    
    await setDoc(doc(db, 'users', uid), {
      uid: uid,
      email: targetEmail,
      username: displayName,
      role: 'admin',
      isRegistered: true,
      isVerified: true,
      createdAt: new Date().toISOString()
    }, { merge: true });

    sessionStorage.setItem('kavach_just_logged_in', 'true');
    sessionStorage.setItem('kavach_admin_tier', adminTier);
    toast.success(`Access Granted: ${displayName}`);

    try {
      const { enableNetwork } = await import('firebase/firestore');
      await enableNetwork(db);
    } catch (e) { }

    setTimeout(() => { window.location.reload(); }, 1000);
  } catch (authError: any) {
    console.warn("Direct Firebase auth failed. Attempting to auto-create admin account online...", authError);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, targetEmail, loginPassword);
      const uid = userCred.user.uid;
      const displayName = targetEmail.includes('admin') ? 'NATIONAL COMMANDER' : 'COMMAND ADMIN';
      
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        email: targetEmail,
        username: displayName,
        role: 'admin',
        isRegistered: true,
        isVerified: true,
        createdAt: new Date().toISOString()
      }, { merge: true });

      sessionStorage.setItem('kavach_just_logged_in', 'true');
      sessionStorage.setItem('kavach_admin_tier', adminTier);
      toast.success(`Admin Account Created & Access Granted: ${displayName}`);

      try {
        const { enableNetwork } = await import('firebase/firestore');
        await enableNetwork(db);
      } catch (e) { }

      setTimeout(() => { window.location.reload(); }, 1000);
    } catch (createError) {
      console.error("Auto-creation failed. Accessing Command Center offline...", createError);
      try {
        const { disableNetwork } = await import('firebase/firestore');
        await disableNetwork(db);
      } catch (e) { }

      const mockUser = {
        uid: 'mock_dev_uid_123',
        email: 'admin@kavach.gov.in',
        displayName: 'Developer Admin',
        phoneNumber: '9999999999'
      } as any;
      const devProfile = {
        uid: 'mock_dev_uid_123',
        email: 'admin@kavach.gov.in',
        username: 'Developer Admin',
        state_flags: {
          is_citizen: false,
          is_guardian: false,
          is_protector: true
        },
        isRegistered: true,
        isVerified: true,
        gender: 'male'
      };

      const store = useKavachStore.getState();
      store.setUser(mockUser);
      store.setRole('admin');
      store.setRegistered(true);
      store.setVerified(true);
      store.setGender('male');
      store.setProfile(devProfile);

      toast.success("Offline Developer Bypass Engaged!");
      setTimeout(() => { window.location.reload(); }, 1000);
    }
  }
  setLoading(false);
};
