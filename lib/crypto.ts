// AES-256-GCM encryption using Web Crypto API (Cloudflare Workers compatible)
// encryptPacked / decryptPacked store salt+iv+ciphertext in a single Uint8Array,
// making each encrypted field self-contained (no separate salt/iv columns needed).

const PBKDF2_ITERATIONS = 100_000;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function buf(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

async function deriveKey(masterKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    buf(new TextEncoder().encode(masterKey)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: buf(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(plaintext: string, masterKey: string): Promise<{ ciphertext: ArrayBuffer; salt: Uint8Array; iv: Uint8Array }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(masterKey, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: buf(iv) },
    key,
    buf(new TextEncoder().encode(plaintext)),
  );
  return { ciphertext, salt, iv };
}

export async function decrypt(ciphertext: ArrayBuffer, salt: Uint8Array, iv: Uint8Array, masterKey: string): Promise<string> {
  const key = await deriveKey(masterKey, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: buf(iv) },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plainBuffer);
}

// Self-contained format: [16 bytes salt][12 bytes iv][ciphertext...]
export async function encryptPacked(plaintext: string, masterKey: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(masterKey, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: buf(iv) },
    key,
    buf(new TextEncoder().encode(plaintext)),
  );
  const packed = new Uint8Array(16 + 12 + ciphertext.byteLength);
  packed.set(salt, 0);
  packed.set(iv, 16);
  packed.set(new Uint8Array(ciphertext), 28);
  return packed;
}

export async function decryptPacked(packed: Uint8Array, masterKey: string): Promise<string> {
  const salt = packed.slice(0, 16);
  const iv = packed.slice(16, 28);
  const ciphertext = packed.slice(28);
  return decrypt(buf(ciphertext), salt, iv, masterKey);
}
