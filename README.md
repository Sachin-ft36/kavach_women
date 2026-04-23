# KAVACH: National Safety & Emergency Response Ecosystem 🛡️🦾🇮🇳

**KAVACH** is a robust, zero-trust emergency response infrastructure designed to provide immediate safety assistance to citizens through a decentralized network of verified protectors and a high-command administrative grid. It leverages real-time telemetry, forensic data collection, and tactical proximity engines to minimize emergency response times.

---

## 🏗️ System Architecture & Workflow

The KAVACH ecosystem operates as a **tri-tier tactical network**:

1.  **Citizen Tier (Victim)**:
    *   **Triggers**: Survival-hardened SOS triggers including physical button (4s hold-to-abort) and high-sensitivity shake detection (Delta 15).
    *   **Tactical HUD**: Activates a Live Evidence Vault (Audio/Video streaming) and a Mission Persistence Layer that survives app restarts.
    *   **Signaling**: Broadcasts encrypted SOS signals to guardians and nearby Protectors via Firebase Cloud Sync and WhatsApp protocols.

2.  **Rakshak Tier (Protector)**:
    *   **Proximity Engine**: A real-time filtering system using the Haversine formula to detect active SOS alerts within a **1km tactical radius**.
    *   **Live Patrol Map**: High-precision Leaflet-based navigation grid that tracks responders via `watchPosition` telemetry.
    *   **Gamified Merit System**: XP-based rewards (XP synchronized via Firestore) to incentivize high-speed emergency resolution.

3.  **Command Tier (MHA/Admin)**:
    *   **Super Cell Dashboard**: A global fleet monitoring system restricted to high-clearance administrators (`singh.sachin16559@gmail.com`).
    *   **Forensic Audit**: Real-time access to the `mission_ledger` for tracking responder actions and reviewing forensic evidence snapshots.

---

## 🛠️ Technical Stack

*   **Core Framework**: React (Vite) with **TypeScript** for type-safe tactical operations.
*   **Native Bridge**: **Capacitor** (Cross-platform Android deployment).
*   **Backend Infrastructure**: **Firebase** (Firestore for NoSQL real-time sync, Auth for RBAC, Storage for Forensic Evidence).
*   **Geospatial Engine**: **Leaflet.js** with Routing Machine for real-time mission navigation.
*   **UI/UX Architecture**: **Bento Grid** design system with **Framer Motion** for high-performance micro-animations.
*   **Sensors Integration**: High-frequency **DeviceMotionEvent** for shake detection and Geolocation API for persistent telemetry.

---

## 🚀 Key Technical Highlights

### 1. Zero-Failure Persistence Layer
Implemented a **Mission Persistence Engine** using `localStorage` and Firestore synchronization. If the application is minimized, backgrounded, or crashes during an active SOS, the state is immediately recovered upon restart, ensuring the safety link remains unbreakable.

### 2. High-Sensitivity Tactical Triggers
Re-engineered the shake-to-trigger engine with a **Delta-15 sensitivity threshold**. It uses a rolling buffer for motion data to filter background noise (walking/running) from actual distress movements (violent shaking), triggering a 10-second tactical countdown with haptic feedback.

### 3. Haversine Proximity Engine
Designed a real-time proximity engine that filters the global alert stream locally on the responder's device. This reduces server load and ensures responders only see alerts within their immediate **intervenable range (1km)**.

### 4. Forensic Evidence Vault
Integrated a secured evidence system that captures high-frequency snapshots and audio logs during active SOS sessions. These assets are encrypted and uploaded to a cloud-secured storage layer, serving as high-integrity forensic evidence for legal proceedings.

---

## 🔧 Installation & Deployment

1.  **Sync Dependencies**:
    ```bash
    npm install
    ```
2.  **Development Boot**:
    ```bash
    npm run dev -- --port 3001
    ```
3.  **Android Deployment**:
    ```bash
    npm run build
    ```
    ```bash
    npx cap sync android
    ```
    ```bash
    npx cap open android
    ```

---

## 📜 Ethical Mission Statement
KAVACH is built on the principle of **Zero-Trust Safety**. Every mission action is logged, every protector is verified, and every byte of data is secured to ensure that the national safety grid remains uncompromised and mission-ready.

**Developed by: KAVACH National Cell** 🛡️🇮🇳
