import fs from 'fs';
const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log('--- USERS ---');
  usersSnap.forEach(doc => {
    console.log(doc.id, JSON.stringify(doc.data(), null, 2));
  });

  const alertsSnap = await getDocs(collection(db, 'alerts'));
  console.log('--- ALERTS ---');
  alertsSnap.forEach(doc => {
    console.log(doc.id, JSON.stringify(doc.data(), null, 2));
  });
  process.exit(0);
}
run();
