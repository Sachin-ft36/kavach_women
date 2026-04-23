# 🛡️ KAVACH Master Guide: Building from Scratch

Yeh guide aapko KAVACH system ke har ek purze (component) ko samajhne aur khud se banane mein madad karegi.

---

## 1. Project Ki Buniyad (Architecture)
KAVACH teen bade pillars par khada hai:
1. **Frontend (React)**: Jo UI aap dekhte hain (Buttons, Maps, Dashboards).
2. **Bridge (Capacitor)**: Ek rasta jo React ko phone ke asli hardware (Camera, SMS, GPS) se jodta hai.
3. **Backend (Firebase)**: Jahan users ka data aur alerts save hote hain.

---

## 2. Frontend: Mission Control (`App.tsx`)
`App.tsx` app ka dimag hai.
- **Neural Link**: Yeh check karta hai ki user logged in hai ya nahi (`onAuthStateChanged`).
- **Role Control**: Yeh decide karta hai ki user **Citizen** hai (victim), **Protector** hai (rakshak), ya **Admin** (Home Ministry).
- **Telemetry**: Har 45 seconds mein yeh user ki location Firebase mein bhejta hai taaki emergency mein help pahunch sake.

---

## 3. The "Ghost Bridge" (`MainActivity.java`)
Websites ko SMS bhejne ya Call karne ki permission nahi hoti. Isliye humne **Ghost Bridge** banaya hai.
- **JavascriptInterface**: Humne Java mein ek class banayi `KavachDirect` aur use WebView mein inject kar diya.
- **Direct Access**: Jab aap React mein code likhte hain `window.KavachDirect.sendSms()`, toh phone ka asli Java code run hota hai jo permissions check karke turant SMS bhej deta hai.

---

## 4. Hardware Persistence (`KavachService.java`)
App band hone ke baad bhi KAVACH kaise kaam karta hai? Iska raaz hai **Foreground Service**.
- **START_STICKY**: Iska matlab hai agar phone service ko kill bhi kar de, toh woh khud ko dobara zinda kar legi.
- **Sensor Monitoring**: Yeh background mein Accelerometer (Shake sensor) ko track karta hai. Agar phone zor se hile (shake), toh yeh app open kiye bina SOS trigger kar deta hai.
- **Background Siren**: Yeh `MediaPlayer` ko use karke siren bajata hai. Humne ise `ALARM` stream par set kiya hai taaki volume full rahe.

---

## 5. Tactical Messaging (`KavachMessagingService.java`)
Yeh Firebase Cloud Messaging (FCM) ko handle karta hai.
- **Silent Signals**: Jab admin kisi victim ke paas protector bhejta hai, toh yeh service background mein "Action Signal" receive karti hai.
- **Immediate Siren**: Agar signal milta hai `start_siren`, toh yeh turant ek system notification dikhati hai jisme siren ki awaaz bajti hai, chahe app closed ho.

---

## 6. Onboarding: Identity Anchoring (`Onboarding.tsx`)
User ko pehli baar app par laana.
- **Identity Verification**: User se unka Mobile aur Aadhaar maangna.
- **Android 15 Permissions**: Android 15 par permissions mushkil hain, isliye humne yahan "Restricted Settings" bypass ka logic likha hai taaki user ko protocol error na aaye.

---

## 7. Security: Home Ministry Lockdown
- **Zero-Trust**: Humne code mein `singh.sachin16559@gmail.com` ko hard-code kiya hai.
- **No Bypassing**: Agar koi dusra user admin dashboard ka URL ya component access karne ki koshish karega, toh `App.tsx` use turant block kar dega (Deadbolt routing).

---

## 💡 Aapko Kya Karna Chahiye (Next Steps)?
1. **Frontend**: React aur Tailwind CSS seekhein UI banane ke liye.
2. **Native**: Java/Kotlin seekhein `AndroidManifest.xml` aur Services samajhne ke liye.
3. **Linking**: Capacitor documentation padhein taaki aap apna khud ka Plugin bana sakein.

---

**KAVACH Team - Mission Ready! 🇮🇳🛡️**
