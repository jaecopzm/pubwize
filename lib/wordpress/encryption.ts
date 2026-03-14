/**
 * WordPress Credential Encryption Utilities
 * Uses AES-256-GCM encryption for secure password storage
 */

// For Node.js environment (API routes)
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): string {
  const key = process.env.WORDPRESS_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "WORDPRESS_ENCRYPTION_KEY environment variable is not set"
    );
  }
  return key;
}

/**
 * Derive a key from the encryption key using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
}

/**
 * Encrypt a password using AES-256-GCM
 * Returns base64-encoded string: salt:iv:authTag:encryptedData
 */
export function encryptPassword(password: string): string {
  try {
    const encryptionKey = getEncryptionKey();

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from encryption key
    const key = deriveKey(encryptionKey, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the password
    let encrypted = cipher.update(password, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine salt, iv, authTag, and encrypted data
    const result = `${salt.toString("base64")}:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;

    return result;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt password");
  }
}

/**
 * Decrypt a password using AES-256-GCM
 * Expects base64-encoded string: salt:iv:authTag:encryptedData
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    const encryptionKey = getEncryptionKey();

    // Split the encrypted string
    const parts = encryptedPassword.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted password format");
    }

    const [saltB64, ivB64, authTagB64, encryptedData] = parts;

    // Convert from base64
    const salt = Buffer.from(saltB64, "base64");
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");

    // Derive key from encryption key
    const key = deriveKey(encryptionKey, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the password
    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt password");
  }
}

/**
 * Generate a random encryption key (for initial setup)
 * This should be run once and stored in environment variables
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("base64");
}
