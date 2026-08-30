import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY_RAW = process.env.MENTAL_HEALTH_ENCRYPTION_KEY || "digimind_secret_mental_health_encryption_key_2026_aes256!!";

// Create a deterministic 32-byte Key from SECRET_KEY_RAW using SHA-256
function getSecretKey(): Buffer {
  return crypto.createHash("sha256").update(SECRET_KEY_RAW).digest();
}

/**
 * Encrypts sensitive text using AES-256-GCM authenticated encryption.
 * Output format: enc_v1:<ivHex>:<tagHex>:<ciphertextHex>
 */
export function encryptSensitiveText(text: string | null | undefined): string | null {
  if (text === null || text === undefined || typeof text !== "string" || text.trim() === "") {
    return text ?? null;
  }
  
  // If already encrypted, return as is
  if (text.startsWith("enc_v1:")) {
    return text;
  }

  try {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const key = getSecretKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");
    return `enc_v1:${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Kesalahan Enkripsi Data Mental Health:", error);
    return text;
  }
}

/**
 * Decrypts sensitive text encrypted with AES-256-GCM.
 * Seamlessly handles legacy unencrypted plaintext.
 */
export function decryptSensitiveText(encryptedText: string | null | undefined): string {
  if (!encryptedText || typeof encryptedText !== "string") {
    return "";
  }

  // If plaintext (not encrypted), return as is for backward compatibility
  if (!encryptedText.startsWith("enc_v1:")) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 4) {
      return encryptedText;
    }

    const [, ivHex, tagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(tagHex, "hex");
    const key = getSecretKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Kesalahan Dekripsi Data Mental Health:", error);
    return "[Data Terenkripsi Terproteksi]";
  }
}
