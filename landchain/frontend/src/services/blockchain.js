/**
 * Client-side SHA-256 hashing for document verification preview.
 * Uses the Web Crypto API — same raw-byte hashing as the backend.
 */

/**
 * Hash a File object and return lowercase hex string (no 0x prefix).
 * @param {File} file
 * @returns {Promise<string>} 64-character lowercase hex digest
 */
export async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
