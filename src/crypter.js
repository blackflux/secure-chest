// @flow
const crypto = require('crypto');
const zlib = require('zlib');
const constants = require("./constants");

const toUrlSafeBase64 = (input: Buffer) => input
  .toString('base64')
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=*$/, m => m.length.toString());
module.exports.toUrlSafeBase64 = toUrlSafeBase64;

const fromUrlSafeBase64 = (input: string) => Buffer.from(input
  .replace(/[012]$/, m => '='.repeat(parseInt(m, 10)))
  .replace(/_/g, "/")
  .replace(/-/g, "+"), 'base64');
module.exports.fromUrlSafeBase64 = fromUrlSafeBase64;

module.exports.Crypter = (secret: Buffer, {
  gzip = constants.GZIP_MODE.AUTO,
  encryption = 'aes-256-cbc',
  ivLength = 16
}: {
  gzip?: $Keys<typeof constants.GZIP_MODE>,
  encryption?: string,
  ivLength?: number
} = {}) => {
  if (!Buffer.isBuffer(secret)) {
    throw new TypeError();
  }
  if (Object.keys(constants.GZIP_MODE).indexOf(gzip) === -1) {
    throw new TypeError();
  }

  const secretHash = crypto.createHash('sha256')
    // https://nodejs.org/api/crypto.html#crypto_hash_update_data_inputencoding
    .update(secret)
    .digest();

  return {
    encrypt: (buffer: Buffer) => {
      if (!Buffer.isBuffer(buffer)) {
        throw new TypeError();
      }

      let input = buffer;
      let useGzip = false;
      if (gzip !== constants.GZIP_MODE.NEVER) {
        const inputGzip = zlib.gzipSync(buffer, { level: 9 /* zlib.constants.Z_BEST_COMPRESSION */ });
        if (gzip === constants.GZIP_MODE.FORCE || buffer.length > inputGzip.length) {
          input = inputGzip;
          useGzip = true;
        }
      }

      const iv = crypto.randomBytes(ivLength);
      // eslint-disable-next-line no-bitwise
      iv[0] = useGzip ? iv[0] | 1 : iv[0] & ~1;
      const cipher = crypto.createCipheriv(encryption, secretHash, iv);
      const rawEncrypted = Buffer.concat([iv, cipher.update(input), cipher.final()]);
      return toUrlSafeBase64(rawEncrypted);
    },
    decrypt: (base64: string) => {
      if (typeof base64 !== 'string') {
        throw new TypeError();
      }

      const rawEncrypted = fromUrlSafeBase64(base64);
      const iv = rawEncrypted.slice(0, ivLength);
      const decipher = crypto.createDecipheriv(encryption, secretHash, iv);
      const output = Buffer.concat([decipher.update(rawEncrypted.slice(ivLength)), decipher.final()]);
      // eslint-disable-next-line no-bitwise
      const useGzip = rawEncrypted[0] & 1;
      return useGzip ? zlib.gunzipSync(output) : output;
    }
  };
};
