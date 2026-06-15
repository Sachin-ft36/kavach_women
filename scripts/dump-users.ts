import { auth, db } from '../src/firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
  try {
    // Authenticate as admin
    console.log("Authenticating as admin...");
    const cred = await signInWithEmailAndPassword(auth, 'admin@kavach.gov.in', 'Singhsachin@#0012');
    console.log("Logged in successfully. UID:", cred.user.uid);

    const snap = await getDocs(collection(db, 'users'));
    console.log(`TOTAL USERS: ${snap.size}`);
    snap.forEach(d => {
      const data = d.data();
      console.log(`- ID: ${d.id}, Name: ${data.name || data.username || data.displayName}, Role: ${data.role}, isRegistered: ${data.isRegistered}, isVerified: ${data.isVerified}, state: ${data.state}`);
    });
  } catch (e) {
    console.error("Error running script:", e);
  }
}

main();
