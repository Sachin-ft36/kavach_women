import Foundation
import Capacitor
import Speech
import AVFoundation

@objc(KavachPlugin)
public class KavachPlugin: CAPPlugin {
    
    private static var instance: KavachPlugin?
    
    public override func load() {
        super.load()
        KavachPlugin.instance = self
    }
    
    public static func getInstance() -> KavachPlugin? {
        return instance
    }
    
    @objc public func triggerPanicExternally() {
        self.notifyListeners("sosTriggered", data: ["source": "shadow"])
        self.notifyListeners("onPanicTrigger", data: [:])
    }
    
    private let audioEngine = AVAudioEngine()
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "hi-IN"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var isListening = false
    
    @objc func startVoiceSentinel(_ call: CAPPluginCall) {
        if isListening {
            call.resolve()
            return
        }
        
        SFSpeechRecognizer.requestAuthorization { authStatus in
            guard authStatus == .authorized else {
                call.reject("Speech recognition authorization denied")
                return
            }
            
            do {
                try self.startSilentListening()
                self.isListening = true
                call.resolve()
            } catch {
                call.reject("Failed to start iOS voice sentinel: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func stopVoiceSentinel(_ call: CAPPluginCall) {
        if isListening {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
            recognitionRequest?.endAudio()
            recognitionTask?.cancel()
            isListening = false
        }
        call.resolve()
    }
    
    private func startSilentListening() throws {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.playAndRecord, mode: .measurement, options: [.duckOthers, .defaultToSpeaker])
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else { return }
        
        // 🔒 ON-DEVICE PROCESSOR: Eliminates lag, reduces battery consumption, and runs fully offline!
        if speechRecognizer?.supportsOnDeviceRecognition == true {
            recognitionRequest.requiresOnDeviceRecognition = true
        }
        
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        inputNode.removeTap(onBus: 0) // Flush stale audio taps
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { (buffer, _) in
            self.recognitionRequest?.append(buffer)
        }
        
        audioEngine.prepare()
        try audioEngine.start()
        
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { result, error in
            if let result = result {
                let transcription = result.bestTranscription.formattedString.lowercased()
                
                // Matches keywords (English & Hindi)
                if transcription.contains("kavach help") || 
                   transcription.contains("help help") || 
                   transcription.contains("bachao") || 
                   transcription.contains("बचाओ") {
                    
                    print("🚨 KAVACH iOS VOICE TRIGGER ACTIVATED via transcription: \(transcription)")
                    
                    // 📡 Instant React-UI Bridge trigger via listener broadcasts
                    self.notifyListeners("sosTriggered", data: ["source": "voice"])
                    self.notifyListeners("onPanicTrigger", data: [:])
                }
            }
            if error != nil {
                // Auto-recovery mechanism for background audio interruption
                self.restartVoiceSentinelSilently()
            }
        }
    }
    
    private func restartVoiceSentinelSilently() {
        guard isListening else { return }
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        try? startSilentListening()
    }
    
    @objc func triggerHapticPulse(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
            call.resolve()
        }
    }
}
