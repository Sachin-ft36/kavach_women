import { GoogleGenerativeAI } from "@google/generative-ai";

const KEYS = [
  "AIzaSyCNEVlQJY-dtfXHOYKZzpIn36xwtqpf0Ks", 
  "AIzaSyBSq-JWoIYa_QYq5DTwsc2ijBSBX6S"
];

const MODELS = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
  "gemini-1.0-pro",
  "gemini-pro"
];

async function ultimateScan() {
  console.log("--- KAVACH ULTIMATE NEURAL SCAN ---");
  
  for (const key of KEYS) {
    console.log(`\nTesting Key: [${key.substring(0, 10)}...]`);
    const genAI = new GoogleGenerativeAI(key);
    
    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Respond with 'STABLE'");
        const response = await result.response;
        console.log(`  ✅ ${modelName}: SUCCESS! -> ${response.text().trim()}`);
        console.log(`\n>>> ACTION: UPDATE CODE TO KEY [${key}] AND MODEL [${modelName}] <<<`);
        return;
      } catch (e: any) {
        console.log(`  ❌ ${modelName}: FAILED (${e.message.substring(0, 50)}...)`);
      }
    }
  }
  console.log("\n[SYSTEM FATAL] No active neural link found. Check Google AI Studio for quota/billing.");
}

ultimateScan();
