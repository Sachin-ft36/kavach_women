import axios from 'axios';
import 'dotenv/config';

async function testToken() {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.VITE_MAPMYINDIA_CLIENT_ID || "");
    params.append('client_secret', process.env.VITE_MAPMYINDIA_CLIENT_SECRET || "");

    console.log("Requesting token...");
    const response = await axios.post('https://outpost.mapmyindia.com/api/security/oauth/token', 
      params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    console.log("Token response:", response.data);
  } catch (error: any) {
    console.error("Token fetch failed:", error.response?.data || error.message);
  }
}

testToken();
