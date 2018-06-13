const crypto = require("crypto");
const { Crypter } = require("./crypter");


class DecryptionError extends Error {}
class DecryptionIntegrityError extends DecryptionError {}
class DecryptionSignatureError extends DecryptionError {}
class DecryptionTimeTravelError extends DecryptionError {}
class DecryptionExpiredError extends DecryptionError {}
module.exports.DecryptionError = DecryptionError;
module.exports.DecryptionIntegrityError = DecryptionIntegrityError;
module.exports.DecryptionSignatureError = DecryptionSignatureError;
module.exports.DecryptionTimeTravelError = DecryptionTimeTravelError;
module.exports.DecryptionExpiredError = DecryptionExpiredError;


const getZerodUnixTime = zeroTime => Math.floor(new Date() / 1000) - zeroTime;
const computeSignature = (secret, ...input) => crypto.createHmac('md5', secret).update(...input).digest();


module.exports.Chester = (secret, {
  name = "default",
  encoding = "utf8",
  zeroTime = 1514764800,
  maxAgeInSec = 60
} = {}) => {
  const crypter = Crypter((secret instanceof Buffer ? secret.toString(encoding) : secret) + name);

  return {
    lock: (treasure) => {
      const timestamp = getZerodUnixTime(zeroTime);
      const timestampBuffer = Buffer.alloc(4);
      timestampBuffer.writeUInt32BE(timestamp);
      const treasureBuffer = Buffer.from(treasure, encoding);
      const signatureBuffer = computeSignature(secret, treasureBuffer, timestampBuffer);

      const bytes = Buffer.concat([signatureBuffer, timestampBuffer, treasureBuffer]);
      return crypter.encrypt(bytes);
    },
    unlock: (chest) => {
      let bytes;
      try {
        bytes = crypter.decrypt(chest);
      } catch (e) {
        throw new DecryptionIntegrityError();
      }
      const signatureBuffer = bytes.slice(0, 16);
      const timestampBuffer = bytes.slice(16, 20);
      const treasureBuffer = bytes.slice(20);
      const timestamp = timestampBuffer.readUInt32BE(0);
      if (Buffer.compare(signatureBuffer, computeSignature(secret, treasureBuffer, timestampBuffer)) !== 0) {
        throw new DecryptionSignatureError();
      }
      const ageInSec = getZerodUnixTime(zeroTime) - timestamp;
      if (ageInSec < 0) {
        throw new DecryptionTimeTravelError();
      }
      if (ageInSec > maxAgeInSec) {
        throw new DecryptionExpiredError();
      }
      return treasureBuffer.toString(encoding);
    }
  };
};
