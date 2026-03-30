/**
 * Utility to obfuscate internal IDs for public URLs
 * This is NOT for security, but for aesthetics and hiding raw sequential IDs
 */

const SALT = 54321;
const MULTIPLIER = 12345;

/** 
 * Encodes a numeric ID into a short alphanumeric string 
 * e.g. 1 -> "1au9"
 */
export const encodeId = (id: number | string): string => {
  const numId = typeof id === "string" ? parseInt(id) : id;
  if (isNaN(numId)) return String(id);
  
  const obfuscated = numId * MULTIPLIER + SALT;
  return obfuscated.toString(36);
};

/** 
 * Decodes an obfuscated string back into a numeric ID 
 */
export const decodeId = (encoded: string): number => {
  try {
    const obfuscated = parseInt(encoded, 36);
    if (isNaN(obfuscated)) return 0;
    
    const original = (obfuscated - SALT) / MULTIPLIER;
    return Math.round(original);
  } catch {
    return 0;
  }
};
