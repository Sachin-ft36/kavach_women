/**
 * Kavach Data Retention & Compliance Cron Job
 * 
 * Government compliance requires strict data lifecycle management:
 * 1. Telemetry Data (Hot Data): Purge after 90 days.
 * 2. Incident Evidence (Cold Archive): Retain for 7 Years.
 * 3. Audit Ledger (Zero FIR/Dispatches): Permanent.
 * 
 * Deploy this script as a Google Cloud Function triggered by Cloud Scheduler.
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin (assuming default credentials in GCP)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const executeRetentionPolicy = async () => {
  console.log('⚖️ [COMPLIANCE] Executing Kavach Data Retention Policy...');
  
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(now - ninetyDaysMs);

  try {
    // 1. Purge Old Telemetry (Hot Data) from active alerts collection
    // Note: We only delete if status is 'CLOSED' and it's older than 90 days.
    const alertsRef = db.collection('alerts');
    const oldAlertsSnapshot = await alertsRef
      .where('status', '==', 'CLOSED')
      .where('lastUpdated', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
      .get();

    const batch = db.batch();
    let deletedCount = 0;

    oldAlertsSnapshot.forEach((doc) => {
      // Move to Cold Archive (7 Years) if not already there, then delete from Hot Data
      const incidentData = doc.data();
      const archiveRef = db.collection('incident_archive').doc(doc.id);
      
      batch.set(archiveRef, {
        ...incidentData,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        retentionExpiry: new Date(now + (7 * 365 * 24 * 60 * 60 * 1000)) // 7 Years
      }, { merge: true });

      batch.delete(doc.ref);
      deletedCount++;
    });

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`✅ [COMPLIANCE] Purged ${deletedCount} 90-day-old telemetry records to Cold Archive.`);
    } else {
      console.log(`✅ [COMPLIANCE] No hot telemetry records met the 90-day expiration threshold.`);
    }

  } catch (error) {
    console.error('❌ [COMPLIANCE] Data Retention Execution Failed:', error);
    throw error;
  }
};

// If running locally as a script:
if (require.main === module) {
    executeRetentionPolicy().then(() => process.exit(0)).catch(() => process.exit(1));
}
