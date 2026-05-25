# 📿 Kavach Smart Wearable (SOS Necklace) Integration Guide
> **DEVELOPMENT BLUEPRINT** · BLE & NB-IoT HARDWARE SYNCHRONIZATION

This blueprint outlines how to connect a physical smart necklace (pendant, ring, or band) containing an SOS panic button directly to the Kavach mobile/web ecosystem.

---

## 📡 Option A: Bluetooth Low Energy (BLE) Grid (Highly Commercial)
The most practical consumer-grade solution. The necklace acts as a BLE Peripheral, and the user's smartphone acts as the BLE Central node.

```
[Physical SOS Necklace] ──(BLE GATT Broadcast)──> [Kavach App (Background BLE Service)] ──(Firestore/HTTPS)──> [Kavach Command Grid]
```

### 1. The Wearable Hardware Layout
* **Microcontroller:** **Nordic nRF52832** or **nRF52840** (ultra-small, low-power BLE SoC).
* **Power Source:** Rechargeable Li-Po battery or coin cell (CR2032) lasting up to 1-2 years.
* **Actuator:** A tactile button embedded inside the pendant.
* **Firmware Logic (C / Zephyr RTOS):**
  * By default, the device is in **Deep Sleep (Low Power Mode)**.
  * When the button is pressed (or double-tapped to avoid false triggers), it wakes up, advertises its UUID, and updates a custom GATT characteristic value to `0x01` (SOS Triggered).

### 2. React Native App-Side Integration (BLE Receiver)
To listen to the physical button click even when the app is in the background, we integrate `react-native-ble-plx` or standard Web Bluetooth APIs:

```typescript
import { BleManager } from 'react-native-ble-plx';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const manager = new BleManager();
const KAVACH_SERVICE_UUID = "1802"; // Immediate Alert Service
const KAVACH_CHAR_UUID = "2A06";    // Alert Level Characteristic

export function initializeWearableListener(userUid: string, userCoordinates: [number, number]) {
  console.log("🛰️ KAVACH BLE: Initializing Background Scan for Smart Wearables...");

  manager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.error("BLE Scan Error:", error);
      return;
    }

    // Identify our registered smart necklace
    if (device?.name?.includes("KavachPendant") || device?.id === "REGISTERED_WEARABLE_MAC") {
      manager.stopDeviceScan();
      
      device.connect()
        .then(connectedDevice => connectedDevice.discoverAllServicesAndCharacteristics())
        .then(connectedDevice => {
          // Monitor the button characteristic
          connectedDevice.monitorCharacteristicForService(
            KAVACH_SERVICE_UUID,
            KAVACH_CHAR_UUID,
            async (charError, characteristic) => {
              if (charError) {
                console.error("Characteristic monitor error:", charError);
                return;
              }

              // Decode characteristic payload (e.g., 0x01 = Pressed)
              const payload = characteristic?.value;
              if (payload === "AQ==") { // Base64 for 0x01
                console.log("🚨 KAVACH ALERT: Physical Necklace Panic Button Pressed!");
                
                // Trigger the live SOS in Firestore immediately!
                await addDoc(collection(db, 'alerts'), {
                  victimUid: userUid,
                  status: 'active',
                  timestamp: new Date(),
                  location: {
                    latitude: userCoordinates[0],
                    longitude: userCoordinates[1]
                  },
                  triggerSource: 'PHYSICAL_WEARABLE_BLE'
                });
              }
            }
          );
        });
    }
  });
}
```

---

## 🛰️ Option B: Standalone Cellular IoT (NB-IoT/LTE-M) (No Phone Needed)
For maximum safety, where the device operates even if the user's phone is dead, stolen, or out of range.

```
[Smart Necklace] ──(Cellular LTE-M/NB-IoT)──> [EMQX MQTT Broker] ──(Cloud Backend)──> [Firestore Alert Node]
```

### 1. The Wearable Hardware Layout
* **Microcontroller & Modem:** **Nordic nRF9160** or **Quectel BG95-M3** (supporting Cellular IoT + GPS).
* **Network Card:** A micro-SIM slot containing an IoT eSIM (supporting global roaming like hologram.io or Airtel IoT).
* **Sensing:** A built-in GPS/GNSS receiver to calculate independent location.

### 2. Standalone IoT Microcontroller Firmware Flow
When the necklace button is pressed:
1. **Wake Up:** Instantly power up the GPS/GNSS module.
2. **Triangulate:** Fetch the high-precision longitude and latitude.
3. **Transmit:** Open a secure TCP/UDP socket and send a lightweight binary payload (or MQTT over TLS 1.3) directly to the Kavach central server.

```json
{
  "wearable_id": "IMB-KAV-905a886f",
  "battery_pct": 89,
  "coords": [26.8467, 80.9467],
  "timestamp": "2026-05-23T00:19:17Z"
}
```

### 3. Server-Side Direct Trigger Handler (Go/Node.js Endpoint)
The central server maps the incoming `wearable_id` to the registered citizen's `uid` and inserts the alert:

```javascript
app.post('/api/iot/wearable-trigger', async (req, res) => {
  const { wearable_id, coords, battery_pct } = req.body;
  
  // 1. Look up user registered to this wearable ID
  const userQuery = await db.collection('users').where('wearableId', '==', wearable_id).limit(1).get();
  if (userQuery.empty) {
    return res.status(404).send("Wearable not registered");
  }
  
  const userData = userQuery.docs[0].data();
  const userUid = userQuery.docs[0].id;
  
  // 2. Instantiate a priority SOS Alert
  await db.collection('alerts').add({
    victimUid: userUid,
    victimName: userData.name,
    status: 'active',
    timestamp: new Date(),
    location: {
      latitude: coords[0],
      longitude: coords[1]
    },
    triggerSource: `SMART_NECKLACE_IOT_BATT_${battery_pct}%`
  });

  return res.status(200).send("SOS Broadcasted");
});
```

---

## 🛠️ Step-by-Step Implementation Action Plan for Sachin

1. **Step 1: Buy a prototype BLE Development Board**
   * Get an **nRF52840 Dongle** or **ESP32 BLE Development Board** (costs around ₹500 - ₹1500).
   * Program a basic Arduino C code to configure it as a BLE server with a simple button trigger.
2. **Step 2: Add Web Bluetooth in the React web client**
   * Utilize `navigator.bluetooth.requestDevice` in your browser UI to scan, pair, and test the button click.
3. **Step 3: Map to Firebase**
   * Link the characteristic monitor to your existing state triggers so it updates Firestore instantly, lighting up the command dashboards automatically.
