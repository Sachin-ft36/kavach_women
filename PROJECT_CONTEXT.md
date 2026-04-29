# KAVACH: MISSION LOG & ARCHITECTURE CONTEXT

## 🚀 Project Overview
KAVACH is a high-stakes Women's Safety Ecosystem featuring real-time SOS triggers, native sensor integration (shake-to-sos), and a specialized tactical dashboard (SuperCell) for emergency responders.

## 🧠 Key Logic & Memory (Important for New Conversations)

### 1. Role-Based Navigation (Strict Gating)
- **Problem**: Admin/Protector dashboards were showing standard "Women Safety" icons in the bottom nav.
- **Solution**: Implemented `hideNav` prop in `Layout.tsx`. 
- **Implementation**: In `App.tsx`, we pass `hideNav={true}` when the user is an Admin or Protector. This removes the standard mobile bottom bar for a clean tactical view.

### 2. Firestore Stability (Internal Assertion Failed Fix)
- **Problem**: Firestore was crashing with index corruption errors during high-frequency updates.
- **Solution**: 
    - **Disabled Persistence**: IndexedDB persistence is turned OFF in `src/firebase.ts`.
    - **Local Timestamps**: Replaced `serverTimestamp()` with local `new Date()` objects in high-traffic update areas (like telemetry/SOS updates) to bypass SDK assertion crashes.

### 3. SuperCell Dashboard (Tactical Hub)
- **Features**: Live evidence vault, mass-resolution of alerts, real-time victim telemetry.
- **UI Design**: Uses a "Forensic Intelligence" aesthetic with high-visibility pulse badges and glowing containers.

### 4. Native Bridge (KavachNative)
- **Plugin**: `KavachPlugin` handles Shake Detection, Silent SMS, and Continuous Siren.
- **Events**: Listens for `sosTriggered` event from Android native code.

## 🛠️ Ongoing Tasks
- [ ] Implement Audit Logs for Mass Resolution.
- [ ] Refine Evidence Vault to handle background photo/audio uploads reliably.
- [ ] Optimize `SuperCellDashboard.tsx` (File size is large, make incremental edits).

---
*Bhai, jab bhi naya chat shuru ho, is file ko read karne bol dena!*
