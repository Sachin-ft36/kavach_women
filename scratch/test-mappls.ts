import axios from 'axios';
import 'dotenv/config';

async function testMappls() {
  const clientId = process.env.VITE_MAPMYINDIA_CLIENT_ID;
  const clientSecret = process.env.VITE_MAPMYINDIA_CLIENT_SECRET;

  console.log("🛰️ TESTING MAPPLS KEYS...");
  console.log("ID:", clientId?.substring(0, 10) + "...");
  console.log("Secret:", clientSecret?.substring(0, 10) + "...");

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId || "");
    params.append('client_secret', clientSecret || "");

    const response = await axios.post('https://outpost.mapmyindia.com/api/security/oauth/token', 
      params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    console.log("✅ SUCCESS! Token received:", response.data.access_token.substring(0, 15) + "...");
  } catch (error: any) {
    console.error("❌ FAILED! Error:", error.response?.data || error.message);
  }
}

testMappls();
