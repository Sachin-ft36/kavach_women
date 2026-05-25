import axios from 'axios';
import 'dotenv/config';

async function testMapplsSearch() {
  const restKey = "wyzopujjvzdbyogtdyzhbguilecucgwgfpmg";
  const url = `https://search.mappls.com/search/places/nearby/json`;
  
  try {
    console.log("Testing Mappls Search WITHOUT Referer...");
    const responseNoReferer = await axios.get(url, {
      params: {
        keywords: "POLICE",
        refLocation: "28.6139,77.2090", // Delhi center coordinates
        access_token: restKey
      },
      headers: { 'Accept': 'application/json' }
    });
    console.log("Response without referer:", responseNoReferer.data);
  } catch (error: any) {
    console.error("No Referer call failed:", error.response?.data || error.message);
  }

  try {
    console.log("\nTesting Mappls Search WITH Referer header...");
    const responseWithReferer = await axios.get(url, {
      params: {
        keywords: "POLICE",
        refLocation: "28.6139,77.2090",
        access_token: restKey
      },
      headers: { 
        'Accept': 'application/json',
        'Referer': 'http://localhost:3000',
        'Origin': 'http://localhost:3000'
      }
    });
    console.log("Response with referer:", responseWithReferer.data);
  } catch (error: any) {
    console.error("With Referer call failed:", error.response?.data || error.message);
  }
}

testMapplsSearch();
