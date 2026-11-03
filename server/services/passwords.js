/**
 * Password hashing.
 *
 * PBKDF2-SHA256 on WebCrypto, which exists in both a Worker and modern Node, so
 * there is one implementation and no native module to compile.
 *
 * A password is never stored. Each row keeps its salt, its iteration count and
 * the derived hash, so the cost can be raised later without invalidating the
 * passwords already in the table.
 */

/**
 * Cloudflare refuses PBKDF2 above 100,000 iterations - "Pbkdf2 failed:
 * iteration counts above 100000 are not supported" - and it refuses it at
 * runtime, not at build time, so a higher number deploys fine and then fails
 * every sign-up. This is the highest count the platform accepts.
 *
 * Each row stores its own count, so this can be raised on another runtime
 * without invalidating passwords already in the table.
 */
const ITERATIONS = 100000;
const KEY_BYTES = 32;

function toHex(bytes) {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function randomHex(byteCount) {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

async function derive(password, saltHex, iterations) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex), iterations, hash: 'SHA-256' },
    key,
    KEY_BYTES * 8
  );

  return toHex(new Uint8Array(bits));
}

/**
 * Compares two hex strings without an early exit, so the time taken does not
 * reveal how much of the value matched.
 */
function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** @returns {Promise<{hash: string, salt: string, iterations: number}>} */
async function hash(password) {
  const salt = randomHex(16);
  return {
    hash: await derive(password, salt, ITERATIONS),
    salt,
    iterations: ITERATIONS,
  };
}

/** @returns {Promise<boolean>} */
async function verify(password, stored) {
  if (!stored || !stored.hash || !stored.salt) return false;

  const attempt = await derive(password, stored.salt, stored.iterations || ITERATIONS);
  return equal(attempt, stored.hash);
}

/**
 * Session tokens are stored only as their SHA-256, so a database dump cannot be
 * replayed as a login.
 */
async function hashToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(token)));
  return toHex(new Uint8Array(digest));
}

function newToken() {
  return randomHex(32);
}

module.exports = { ITERATIONS, hash, verify, hashToken, newToken };
