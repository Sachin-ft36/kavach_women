# 🔒 Kavach: Lock Screen Background Processing & Wake-up Guide
> **MISSION-CRITICAL BACKGROUND SERVICES** · FOR ANDROID & iOS LIFECYCLE MANAGEMENT

Bhai, yeh tumne mobile development ka sabse important aur technically deep-dive sawaal pucha hai! 

Modern operating systems (Android and iOS) battery bachane ke liye **Lock Screen par standard background apps ko freeze (sleep mode) kar dete hain**. Is wajah se tumhara regular JavaScript code aur standard bluetooth scans phone lock hone par pause ho jayenge.

Kavach app ko lock screen par aur background me **100% active rakhne ke liye** niche diye gaye native configurations zaroori hain:

---

## 🤖 1. For Android: Foreground Service & Lock-Screen Overlay

Android me app ko zinda rakhne aur lock screen ke upar achanak alert video screen dikhane ke liye hume tin configurations karni padengi:

### A. Persistent Foreground Service (Humara Background Security guard)
Hume ek Android Foreground Service banani hogi jiska status notification user ke bar-screen par dikhta rahe. Isse Android OS app ko kabhi kill nahi karega.
* **Libary to use:** `react-native-foreground-service` ya `expo-task-manager`.
* **AndroidManifest.xml Configuration:**
```xml
<!-- Background Bluetooth and Service Permissions -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE"/>
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>

<service 
  android:name="com.kavach.BackgroundBleService"
  android:foregroundServiceType="connectedDevice" 
  android:enabled="true" 
  android:exported="false">
</service>
```

### B. Show app on top of Lock Screen (Activity Overlay)
Jab wearable ka panic button dabe, toh lock screen khule bina direct **Emergency Dispatch Overlay Screen** samne aa jani chahiye:
* **MainActivity.java/kt Configuration:**
```java
// Android system ko force karna ki lock screen ke upar activity render kare
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        setShowWhenLocked(true)
        setTurnScreenOn(true)
        val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
        keyguardManager.requestDismissKeyguard(this, null)
    } else {
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )
    }
}
```

---

## 🍏 2. For iOS: CoreBluetooth Background State Restoration

Apple ke background policies bohot strict hain. Lekin iOS **Emergency/Safety BLE devices** ke liye background execution allow karta hai:

### A. Info.plist Configuration (BLE background mode permission)
Hume Xcode me background modes me "Acts as a Bluetooth LE accessory" check karna padega:
```xml
<key>UIBackgroundModes</key>
<array>
  <string>bluetooth-central</string>
  <string>location</string>
</array>
```

### B. State Restoration Key (CoreBluetooth code)
Locket trigger aate he iOS background thread ko instant wake up karega:
```swift
// Swift code to restore BLE connection state in background
let manager = CBCentralManager(
    delegate: self, 
    queue: nil, 
    options: [CBCentralManagerOptionRestoreIdentifierKey: "KavachBleRestoreID"]
)
```

### C. Live Activities (Lock screen rich notifications)
iOS 16+ me, emergency trigger hone par, location updates lock screen par **Live Activity Widget** ban kar chalti rahengi (jaise Zomato ki delivery screen lock screen par dikhti hai), jisse police car ka distance live dikhta rahega.

---

## 💡 Quick Summary Checklist:
1. **Permission:** User se `ACCESS_BACKGROUND_LOCATION` (Always Allow) background permissions leni hogi, varna lock screen pe GPS off ho jata hai.
2. **Waking Screen (WakeLock):** CPU ko wake-state me rakhne ke liye tiny WakeLock ping use karenge.
3. **Notification Channel:** Critical Alerts status set karna hoga taaki silent mode me bhi alarm shor machaye!
