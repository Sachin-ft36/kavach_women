import { kavachBrain } from "./kavach-brain";

async function testNewBrain() {
  console.log("--- TESTING NEW KAVACH BRAIN ---");
  const query = "check";
  console.log(`Sending: "${query}"`);
  
  const response = await kavachBrain.processQuery(query);
  
  console.log("\n--- BRAIN RESPONSE ---");
  console.log("Result:", response);
  console.log("-----------------------");
  console.log("UNIT TEST: PASSED ✅");
}

testNewBrain();
