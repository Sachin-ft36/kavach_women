# --- KAVACH CORE OBFUSCATION RULES ---

# Preserve line numbers for Crashlytics
-keepattributes SourceFile,LineNumberTable

# Capacitor / Android Bridge
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.NativePlugin public class *
-keep @com.getcapacitor.CapacitorPlugin public class *
-keepclassmembers class * {
  @com.getcapacitor.PluginMethod public *;
}

# Vosk Offline Speech Recognition (Native Libraries)
-keep class org.vosk.** { *; }
-keep class com.alphacephei.vosk.** { *; }
-keep class net.java.dev.jna.** { *; }

# Agora RTC SDK
-keep class io.agora.** { *; }

# OkHttp / Okio (SSL Pinning)
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class okio.** { *; }

# RootBeer (Root Detection)
-keep class com.scottyab.rootbeer.** { *; }

# App-specific Native Bridge
-keep class com.kavach.app.KavachNative { *; }
-keep class com.kavach.app.KavachService { *; }
