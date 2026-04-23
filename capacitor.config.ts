import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kavach.app',
  appName: 'Kavach',
  webDir: 'dist',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com', 'phone'],
      googleClientId: "1052169617522-6ubmqvfcifqejt7bd4tae0h8tscuao7o.apps.googleusercontent.com",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
