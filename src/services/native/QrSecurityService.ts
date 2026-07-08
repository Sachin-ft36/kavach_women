export const QrSecurityService = {
  generateSignature: async (uid: string, nonce: string, expiresAt: number): Promise<string> => {
    try {
      const secret = "kavach_gov_grade_safety_secret_key_2026";
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const data = encoder.encode(`${uid}:${nonce}:${expiresAt}`);
      
      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      
      const signatureBuffer = await window.crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        data
      );
      
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      console.error("Signature generation failed:", e);
      return "";
    }
  },

  verifySignature: async (uid: string, nonce: string, expiresAt: number, signature: string): Promise<boolean> => {
    try {
      const generated = await QrSecurityService.generateSignature(uid, nonce, expiresAt);
      return generated === signature;
    } catch (e) {
      return false;
    }
  }
};
