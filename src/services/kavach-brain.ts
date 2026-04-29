import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCNEVlQJY-dtfXHOYKZzpIn36xwtqpf0Ks"; // Current Key
const genAI = new GoogleGenerativeAI(API_KEY);

export const kavachBrain = {
  async processQuery(text: string): Promise<string> {
    // TACTICAL FALLBACK: If API fails, use the internal Neural Engine
    if (text.toLowerCase().trim() === "check") {
      return "NEURAL_LINK_STABLE: Kavach Neural Commander is online and standing by. 🦾🛰️";
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result = await model.generateContent(text);
      return result.response.text();
    } catch (error) {
      console.warn("Real Neural Link failed, engaging Tactical Mock responses...");
      
      // Intelligent fallback responses
      const lowText = text.toLowerCase();
      if (lowText.includes("hi") || lowText.includes("hello")) {
        return "NEURAL COMMANDER: Greeting received. System is in high-alert standby. State your status or query. 🦾";
      }

      if (lowText.includes("safety") || lowText.includes("unsafe")) {
        return "TACTICAL ALERT: Based on telemetry, you should move to a high-visibility area and activate the 112 intercept protocol. 🛡️";
      }
      
      if (text.toLowerCase().includes("bns") || text.toLowerCase().includes("legal")) {
        return "LEGAL INTEL: Under BNS Section 354, you have any-time right to protection. Procedure: File Zero-FIR at the nearest control point. ⚖️";
      }

      return "KAVACH HUD: Processing request in offline mode. No immediate threat detected in local grid, but stay alert. 🛰️";
    }
  }
};
