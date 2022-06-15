import crypto from 'crypto';
import { toUrlSafeBase64, fromUrlSafeBase64 } from './base64.js';

export const Crypter = (secret, encryption = 'aes-256-cbc', ivLength = 16) => {
  if (!Buffer.isBuffer(secret)) {
    throw new TypeError();
  }

  // hashed to be compatible with createCipheriv, not for security
  const hashedSecret = crypto.createHash('sha256')
    // https://nodejs.org/api/crypto.html#crypto_hash_update_data_inputencoding
    .update(secret)
    .digest();

  return {
    encrypt: (buffer) => {
      if (!Buffer.isBuffer(buffer)) {
        throw new TypeError();
      }

      const iv = crypto.randomBytes(ivLength);
      const cipher = crypto.createCipheriv(encryption, hashedSecret, iv);
      const rawEncrypted = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
      return toUrlSafeBase64(rawEncrypted);
    },
    decrypt: (base64) => {
      if (typeof base64 !== 'string') {
        throw new TypeError();
      }

      const rawEncrypted = fromUrlSafeBase64(base64);
      const iv = rawEncrypted.slice(0, ivLength);
      const decipher = crypto.createDecipheriv(encryption, hashedSecret, iv);
      return Buffer.concat([decipher.update(rawEncrypted.slice(ivLength)), decipher.final()]);
    }
  };
};
