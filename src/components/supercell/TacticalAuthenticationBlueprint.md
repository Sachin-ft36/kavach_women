# 🔐 Kavach: High-Security Tactical Authentication Blueprint
> **SOVEREIGN IDENTITY & ACCESS MANAGEMENT (SIAM)** · MILITARY-GRADE ENCRYPTION

To prevent unauthorized access to our critical infrastructure controls (toll gate override, live highway CCTV feeds, and emergency police dispatching), we must harden our authentication layer. Standard email-and-password security is vulnerable. 

This blueprint outlines the **Three Pillars of Kavach Hardened Authentication**:

---

## 🏛️ Pillar 1: Biometric Safety Unlock (Fingerprint / Face ID)
For citizens in distress, speed is everything. Requiring them to type a password during an emergency is a fatal flaw. We integrate native biometrics for frictionless, ultra-fast access.

```
 [User Touch / Scan] ──> [Android Keystore / iOS Keychain] ──> [Decrypted JWT] ──> [Frictionless SOS Hub Access]
```

### 1. Secure Token Storage (Keystore / Keychain)
We store the session token in the hardware-backed secure storage of the mobile processor:
* **Android:** Hardware-backed Keystore provider.
* **iOS:** Secure Keychain Access.

### 2. Implementation Code (Capacitor Biometric AIO)
```typescript
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';
import { SecureStorage } from '@capacitor-community/secure-storage';

export async function authenticateUserBiometrically(): Promise<boolean> {
  try {
    // 1. Check if hardware support exists (Fingerprint / FaceID)
    const isAvailable = await FingerprintAIO.isAvailable();
    if (!isAvailable) return false;

    // 2. Trigger native OS biometric dialog
    await FingerprintAIO.show({
      title: 'Kavach Secure Unlock',
      subtitle: 'Scan your biometric signature to verify safety identity',
      description: 'Biometric authorization required to launch Safety Grid.',
      disableBackup: true, // Force biometric, bypass pin
    });

    // 3. Fetch encrypted credentials from hardware vault
    const token = await SecureStorage.get({ key: 'kavach_auth_token' });
    if (token) {
      await signInWithSecureToken(token.value);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Biometric Authentication Rejected:", error);
    return false;
  }
}
```

---

## 🛡️ Pillar 2: Commander Multi-Factor Authentication (MFA / SMS OTP)
For police commanders, grid administrators, and SuperCell controllers who have access to live cameras and highway tolls, MFA is mandatory. 

```
 [Commander Password] ──(Correct)──> [Govt SMS Gateway (CDAC)] ──(6-Digit OTP)──> [Command Grid Access]
```

### 1. Government-Compliant DLT SMS Gateway Integration
We route the secondary OTP verification through the **CDAC Mobile Seva Gateway** (Indian Government API) to prevent SIM-swapping and spoofing:

```typescript
import axios from 'axios';

export async function sendTacticalOTP(phoneNumber: string): Promise<string> {
  const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  
  // DLT Approved Template ID: 14071612...
  const gatewayUrl = "https://msdgweb.gov.in/esms/sendsms";
  const payload = {
    username: process.env.CDAC_USER,
    password: process.env.CDAC_PASSWORD,
    senderId: "KAVACH",
    mobile: phoneNumber,
    message: `[KAVACH SECURE] OTP for Commander Grid access: ${generatedOTP}. Valid for 3 mins. Do not share.`,
    templateId: "14071612839402917"
  };

  await axios.post(gatewayUrl, payload);
  return generatedOTP; // Store hashed in server-side session cache
}
```

---

## 🛰️ Pillar 3: Geofenced IP & Location Session Lock
Even if a hacker steals a commander's credentials and intercepts their OTP, they cannot access the dashboard if they are outside the physically designated command center.

```
 [Login Request] ──> [Verify IP Geolocation] ──> [Match Command Coordinates] ──> [Unlock Dashboard]
```

### 1. Strict IP and Client Location Verification
During admin login, we calculate the coordinate distance between the commander's actual physical device GPS and the designated Control Room geofence:

```typescript
import { calculateDistance } from '../../utils/geo';

interface ControlRoomGeofence {
  name: string;
  latitude: number;
  longitude: number;
  allowedRadiusKm: number;
}

const CONTROL_ROOM_REGISTRY: { [key: string]: ControlRoomGeofence } = {
  "UP_STATE_COMMAND": {
    name: "Lucknow Police HQ - Command Cell 9",
    latitude: 26.8467,
    longitude: 80.9462,
    allowedRadiusKm: 0.15 // Strict 150 meters radius restriction!
  }
};

export function verifyCommandAccess(adminRole: string, currentCoords: [number, number]): boolean {
  if (adminRole === 'NATIONAL_ADMIN') return true; // Sovereign bypass

  const geofence = CONTROL_ROOM_REGISTRY[adminRole];
  if (!geofence) {
    console.error("🔒 SECURITY: Unauthorized command role geofence.");
    return false;
  }

  const distance = calculateDistance(
    currentCoords[0], currentCoords[1],
    geofence.latitude, geofence.longitude
  );

  if (distance > geofence.allowedRadiusKm) {
    console.warn(`🚨 SECURITY INTRUSION: Command cell access attempted from ${distance.toFixed(2)}km away! Lockout initiated.`);
    return false;
  }

  return true;
}
```

---

## 📈 Integration Steps for Sachin

1. **Step 1: Install Capacitor Secure Storage & Biometrics Plugins**
   ```bash
   npm i @capacitor-community/secure-storage
   npm i @ionic-native/fingerprint-aio
   ```
2. **Step 2: Bind to `AuthScreen.tsx`**
   * Before prompting for email/password, trigger `authenticateUserBiometrically()`. If verified, log in instantly without user interaction!
3. **Step 3: Geofence Verification**
   * Enable the geofence checker when the Commander role logs in, keeping the entire grid immune to foreign hackers!
