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

// ── Vault Export / Import ─────────────────────────────────────────────────────
// Формат .ndrive:
//   [4 bytes magic "NDVX"] [4 bytes version=1] [32 bytes salt] [12 bytes iv]
//   [N bytes AES-GCM ciphertext of JSON payload]
// JSON payload: { account: LocalAccount, files: EncryptedFile[], folders: Folder[] }
// Файл зашифрован новым ключом, выведенным из пароля + свежей соли

const MAGIC = new Uint8Array([0x4E, 0x44, 0x56, 0x58]); // "NDVX"
const VERSION = new Uint8Array([0x00, 0x00, 0x00, 0x01]);

export async function exportVault(password: string, payload: object): Promise<Blob> {
  const salt = randomSalt();
  const key = await deriveKey(password, salt);
  const json = new TextEncoder().encode(JSON.stringify(payload));
  const { iv, ciphertext } = await encryptData(key, json);

  const total = MAGIC.length + VERSION.length + salt.length + iv.length + ciphertext.byteLength;
  const out = new Uint8Array(total);
  let offset = 0;
  out.set(MAGIC, offset); offset += MAGIC.length;
  out.set(VERSION, offset); offset += VERSION.length;
  out.set(salt, offset); offset += salt.length;
  out.set(iv, offset); offset += iv.length;
  out.set(new Uint8Array(ciphertext), offset);

  return new Blob([out], { type: 'application/octet-stream' });
}

export async function importVault(password: string, buffer: ArrayBuffer): Promise<object> {
  const bytes = new Uint8Array(buffer);
  let offset = 0;

  const magic = bytes.slice(offset, offset + 4); offset += 4;
  if (magic[0] !== 0x4E || magic[1] !== 0x44 || magic[2] !== 0x56 || magic[3] !== 0x58) {
    throw new Error('Неверный формат файла. Ожидается .ndrive архив NovaDrive.');
  }
  offset += 4; // version
  const salt = bytes.slice(offset, offset + 32); offset += 32;
  const iv = bytes.slice(offset, offset + 12); offset += 12;
  const ciphertext = bytes.slice(offset).buffer;

  const key = await deriveKey(password, salt);
  let decrypted: ArrayBuffer;
  try {
    decrypted = await decryptData(key, iv, ciphertext);
  } catch {
    throw new Error('Неверный пароль или повреждённый архив.');
  }

  const json = new TextDecoder().decode(decrypted);
  return JSON.parse(json);
}