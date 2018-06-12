const crypto = require('crypto');
const zlib = require('zlib');

/*
* Security Observations
*
* GZip encoding is only used when this actually shortens the output. The IV is overloaded to store
* one byte indicating this. Hence the IV only truly uses bits - 1 of its length.
*
* This seems acceptable when the iv is 16 bytes long, since hash collision probabilities are similar.
* */

const toUrlSafeBase64 = input => input
  .toString('base64')
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=*$/, m => m.length);
module.exports.toUrlSafeBase64 = toUrlSafeBase64;

const fromUrlSafeBase64 = input => Buffer.from(input
  .replace(/[012]$/, m => '='.repeat(parseInt(m, 10)))
  .replace(/_/g, "/")
  .replace(/-/g, "+"), 'base64');
module.exports.fromUrlSafeBase64 = fromUrlSafeBase64;

module.exports.Crypter = (secret, encryption = 'aes-256-cbc', ivLength = 16) => {
  const secretHash = crypto.createHash('sha256').update(secret, 'utf-8').digest();

  return {
    encrypt: (input) => {
      const inputGzip = zlib.gzipSync(input, { level: 9 });
      const useGzip = input.length > inputGzip.length;
      const inputShortest = useGzip ? inputGzip : input;

      const iv = crypto.randomBytes(ivLength);
      // eslint-disable-next-line no-bitwise
      iv[0] = useGzip ? iv[0] | 1 : iv[0] & ~1;
      const cipher = crypto.createCipheriv(encryption, secretHash, iv);
      const rawEncrypted = Buffer.concat([iv, cipher.update(inputShortest), cipher.final()]);
      return toUrlSafeBase64(rawEncrypted);
    },
    decrypt: (input) => {
      const rawEncrypted = fromUrlSafeBase64(input);
      const iv = rawEncrypted.slice(0, ivLength);
      const decipher = crypto.createDecipheriv(encryption, secretHash, iv);
      const output = Buffer.concat([decipher.update(rawEncrypted.slice(ivLength)), decipher.final()]);
      // eslint-disable-next-line no-bitwise
      const useGzip = rawEncrypted[0] & 1;
      return useGzip ? zlib.gunzipSync(output) : output;
    }
  };
};
