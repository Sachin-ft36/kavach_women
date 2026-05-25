# ⚙️ Kavach Wearables: Industrial Manufacturing Blueprint
> **CONFIDENTIAL PRODUCTION MANUAL** · MASS ASSEMBLY & BILL OF MATERIALS (BOM)  
> **Target Audience:** Hardware Engineers, Assembly Line Leads, and EMS Suppliers.

---

## 📿 PRODUCT 1: The Kavach SOS Smart Pendant (Heart Necklace)

An ultra-compact, low-power BLE safety wearable designed to look like a high-end gold heart pendant while hiding a robust tactical transmission circuit inside.

```
                  [ FRONT VIEW ]                           [ BACK EXPLODED VIEW ]
                  
                     /\  /\                                     / \  / \
                    /  \/  \                                   |   \/   | <── Top Gold Shell
                   |   🔴   | <── Micro-LED Button            | [===]  | <── BLE Circular PCB
                    \      /                                   | ( O )  | <── CR2032 Battery
                     \    /                                     \      /
                      \  /                                       \    / <── Bottom Gold Shell
                       \/                                         \  /
                                                                   \/
```

### 1. Technical Dimensions & Form Factor
* **Outer Casing:** Polished Zinc-Alloy with **18K Gold PVD Plating** (anti-tarnish, hypoallergenic).
* **Pendant Dimensions:** Width: `25.0 mm`, Height: `24.2 mm`, Thickness: `7.5 mm`.
* **PCB Form Factor:** Circular shape, Max Diameter: `21.8 mm`, Thickness: `1.2 mm` (4-layer FR4 board).
* **IP Rating:** **IP67 Waterproof** (dust-tight, protected against water immersion up to 1m for 30 minutes).

### 2. Bill of Materials (BOM) - Pendant Node
| Component Name | Manufacturer Part No (MPN) | Package/Size | Est. Unit Price (₹) | Key Function |
| :--- | :--- | :--- | :--- | :--- |
| **BLE SoC Chip** | Nordic Semiconductor `nRF52832-QFAA` | QFN48 (6x6 mm) | ₹145 | Core system MCU & BLE radio antenna. |
| **Tactile Push Button** | C&K Components `PTS810` | SMT (4.2 x 3.2 mm) | ₹12 | Dynamic click actuator for alert. |
| **LDO Regulator** | Texas Instruments `TLV70218` | SOT-23-5 | ₹8 | Steps battery down to stable 1.8V. |
| **Coin Battery Holder** | Keystone Electronics `3000` | SMT | ₹15 | Secure clip for CR2032 Lithium Cell. |
| **Vibration Motor** | Vybronics `VC0825B002L` | Coin Type (8mm) | ₹25 | Haptic feedback vibration on button click. |
| **Micro-LED Cyan** | Wurth Elektronik `150060CS75000` | 0603 SMT | ₹5 | Status indicator light pulsing blue. |
| **Antenna Match** | Johanson Technology `2450BM14G0011` | 0603 SMT | ₹12 | Matched 2.4GHz chip balun antenna. |

### 3. Assembly & Manufacturing Pipeline
1. **SMT Assembly:** Pick-and-place high-precision SMD components onto the circular 4-layer PCB.
2. **Firmware Flashing:** Bootloader and BLE Stack flashed via **SWD (Serial Wire Debug)** pogo-pins on the back of the board.
3. **Battery Insertion:** Fit standard Panasonic CR2032 Lithium battery into the holder.
4. **Resin Casting & Seal:** Place the PCB inside the bottom gold shell, lay the silicon seal ring, place the transparent laser-cut micro-LED dome, and ultrasonic-weld the top gold shell to make it 100% waterproof.

---

## ⌚ PRODUCT 2: The Kavach SOS Smartwatch (Safety Band)

A rugged, medical-grade silicone smart wristband equipped with real-time fall-detection sensors and independent tracking.

```
       [ TOP VIEW ]                                   [ EXPLODED DESIGN ]
       
    ┌────────────────┐                                  ┌───────────────┐ <── Curved Glass
    │  K A V A C H   │                                  ├───────────────┤ <── 0.96" TFT Display
    │  🔴 15:46 LIVE  │ <── 0.96" TFT OLED Screen       │[  ESP32-S3   ]│ <── Rectangular PCB
    │  98% STRESS    │                                  ├───────────────┤ <── 150mAh Li-Po Battery
    └────────────────┘                                  └───────────────┘ <── Silicon Back Plate
     (  )        (  )  <── Hypoallergenic Strap
```

### 1. Technical Dimensions & Form Factor
* **Strap Material:** Medical-Grade Hypoallergenic Silicone with double-buckle lock.
* **Casing Dimensions:** Width: `38.0 mm`, Height: `18.0 mm`, Thickness: `10.5 mm`.
* **PCB Form Factor:** Rectangular board, Size: `34.0 mm x 14.5 mm` (4-layer FR4 board).
* **IP Rating:** **IP68 Swimproof** (dust-tight, protected against continuous water immersion).

### 2. Bill of Materials (BOM) - Smartwatch Node
| Component Name | Manufacturer Part No (MPN) | Package/Size | Est. Unit Price (₹) | Key Function |
| :--- | :--- | :--- | :--- | :--- |
| **MCU Module** | Espressif Systems `ESP32-S3-MINI-1` | SMT Module | ₹210 | Dual-core Wi-Fi/BLE MCU for calculations. |
| **IMU Sensor** | TDK InvenSense `MPU-6050` | QFN24 (4x4 mm) | ₹75 | 3-Axis Gyroscope & 3-Axis Accelerometer. |
| **OLED Display** | Solomon Systech `SSD1306` | 0.96" SPI Panel | ₹120 | Visual telemetry feedback screen. |
| **Li-Po Battery** | Custom Polymer `301530` | 3.7V 150mAh | ₹65 | Battery with protection circuit board. |
| **Charging IC** | Microchip `MCP73831` | SOT-23-5 | ₹12 | Direct USB Magnetic charging manager. |
| **Heart Rate Sensor** | Analog Devices `MAX30102` | SMT (5.6x3.3 mm) | ₹95 | Integrated pulse oximeter & heart rate sensor. |

### 3. Fall-Detection Sensor Math Logic (MPU6050)
The watch continuously samples acceleration at **100 Hz** across the X, Y, and Z axes. The resultant acceleration vector $g_{total}$ is calculated:

$$g_{total} = \sqrt{a_x^2 + a_y^2 + a_z^2}$$

#### Threshold Algorithm:
1. **Free-Fall Phase:** If $g_{total}$ drops below **0.4g** for more than 150ms.
2. **Impact Phase:** Immediately followed by a massive spike where $g_{total}$ exceeds **3.5g** within 300ms.
3. **Immobility Phase:** If the user remains completely still (variance in $g_{total} < 0.05g$) for **10 seconds** post-impact:
   * **Result:** **TRIGGER SOS ALERT!** Send emergency signal to app and sound a 5-second beep on the watch giving the user a chance to cancel in case of a false alarm.

---

## 🔬 QA (Quality Assurance) & Testing Standards

To maintain **0% hardware failure rates**, every batch must clear these three factory line tests:

1. **WPC RF Calibrator (Radio Test):**
   * Placed inside a Faraday shielding box.
   * Measures BLE RSSI (Received Signal Strength Indicator) at a 5-meter simulated distance. Must be $\ge -65\text{ dBm}$.
2. **Pressure Leak Test (Waterproof Test):**
   * Submerged under 2 bar air pressure for 60 seconds. Sensor checks for micro-drops in pressure to ensure no seal leaks exist.
3. **Drop Shock Test:**
   * Pendant and watch are dropped from **1.5 meters** onto concrete 10 times consecutively. Board must remain fully functional.

This blueprint is ready to be delivered to any contract manufacturer in India (like **Dixon Technologies** or **Optiemus Electronics**) for direct assembly line pricing and tooling estimates!

---

## 📐 Smart Pendant Exploded Assembly Diagram

Use this exploded-view visual to understand exactly how the components stack vertically and connect to form the finished **Kavach SOS Smart Pendant**:

![Kavach SOS Smart Pendant Exploded Assembly Diagram](C:\Users\hp\.gemini\antigravity\brain\905a886f-4175-4690-9645-2b5f6b723a1c\smart_pendant_exploded_view_1779532913411.png)
