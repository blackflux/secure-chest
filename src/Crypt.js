const crypto = require('crypto');
const zlib = require('zlib');

module.exports = (secret, encryption = 'aes-256-cbc', ivLength = 16) => {
  const secretHash = crypto.createHash('sha256').update(secret, 'utf-8').digest();

  return {
    encrypt: (input) => {
      const iv = crypto.randomBytes(ivLength);
      const cipher = crypto.createCipheriv(encryption, secretHash, iv);
      const inputZipped = zlib.gzipSync(input, { level: 9 });
      const rawEncrypted = Buffer.concat([iv, cipher.update(inputZipped), cipher.final()]);
      return rawEncrypted
        .toString('base64')
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=*$/, m => m.length);
    },
    decrypt: (input) => {
      const rawEncrypted = Buffer.from(input
        .replace(/[012]$/, m => '='.repeat(parseInt(m, 10)))
        .replace(/_/g, "/")
        .replace(/-/g, "+"), 'base64');
      const iv = rawEncrypted.slice(0, ivLength);
      const decipher = crypto.createDecipheriv(encryption, secretHash, iv);
      const outputZipped = Buffer.concat([decipher.update(rawEncrypted.slice(ivLength)), decipher.final()]);
      return zlib.gunzipSync(outputZipped);
    }
  };
};
