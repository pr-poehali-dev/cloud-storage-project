// Web Crypto API — AES-GCM 256-bit, всё происходит только в браузере
// Никаких серверов, никаких запросов — zero-knowledge архитектура

const PBKDF2_ITERATIONS = 310_000; // OWASP 2023 recommendation

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(key: CryptoKey, data: ArrayBuffer): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return { iv, ciphertext };
}

export async function decryptData(key: CryptoKey, iv: Uint8Array, ciphertext: ArrayBuffer): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
}

export function randomSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const key = await deriveKey(password, salt);
  const testData = new TextEncoder().encode('novadrive-verify');
  const { iv, ciphertext } = await encryptData(key, testData);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

export function uint8ToBase64(u8: Uint8Array): string {
  return btoa(String.fromCharCode(...u8));
}

export function base64ToUint8(b64: string): Uint8Array {
  return new Uint8Array(base64ToBuffer(b64));
}
