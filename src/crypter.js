// @flow
const crypto = require('crypto');
const urlSafeBase64 = require("./url-safe-base64");

module.exports.Crypter = (secret: Buffer, encryption: string = 'aes-256-cbc', ivLength: number = 16) => {
  if (!Buffer.isBuffer(secret)) {
    throw new TypeError();
  }

  // hashed to be compatible with createCipheriv, not for security
  const hashedSecret = crypto.createHash('sha256')
    // https://nodejs.org/api/crypto.html#crypto_hash_update_data_inputencoding
    .update(secret)
    .digest();

  return {
    encrypt: (buffer: Buffer) => {
      if (!Buffer.isBuffer(buffer)) {
        throw new TypeError();
      }

      const iv = crypto.randomBytes(ivLength);
      const cipher = crypto.createCipheriv(encryption, hashedSecret, iv);
      const rawEncrypted = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
      return urlSafeBase64.encode(rawEncrypted);
    },
    decrypt: (base64: string) => {
      if (typeof base64 !== 'string') {
        throw new TypeError();
      }

      const rawEncrypted = urlSafeBase64.decode(base64);
      const iv = rawEncrypted.slice(0, ivLength);
      const decipher = crypto.createDecipheriv(encryption, hashedSecret, iv);
      return Buffer.concat([decipher.update(rawEncrypted.slice(ivLength)), decipher.final()]);
    }
  };
};
