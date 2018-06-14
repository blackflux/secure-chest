// @flow
const crypto = require("crypto");
const { Crypter } = require("./crypter");


class EncryptionError extends Error {}
class EncryptionJsonError extends EncryptionError {}
class DecryptionError extends Error {}
class DecryptionIntegrityError extends DecryptionError {}
class DecryptionSignatureError extends DecryptionError {}
class DecryptionTimeTravelError extends DecryptionError {}
class DecryptionExpiredError extends DecryptionError {}
class DecryptionJsonError extends DecryptionError {}
module.exports.EncryptionError = EncryptionError;
module.exports.EncryptionJsonError = EncryptionJsonError;
module.exports.DecryptionError = DecryptionError;
module.exports.DecryptionIntegrityError = DecryptionIntegrityError;
module.exports.DecryptionSignatureError = DecryptionSignatureError;
module.exports.DecryptionTimeTravelError = DecryptionTimeTravelError;
module.exports.DecryptionExpiredError = DecryptionExpiredError;
module.exports.DecryptionJsonError = DecryptionJsonError;


const getZerodUnixTime = (zeroTime: number) => Math.floor(new Date() / 1000) - zeroTime;
const computeSignature = (secret, encoding, ...input) => input
  .reduce((p, c) => p.update(c, encoding), crypto.createHmac('md5', secret)).digest();


module.exports.Chester = (secret: string | Buffer, {
  name = "default",
  encoding = "utf8",
  zeroTime = 1514764800,
  maxAgeInSec = 60,
  encryption = 'aes-256-cbc',
  ivLength = 16
}: {
  name?: string,
  encoding?: 'utf8' | 'ascii' | 'latin1' | 'binary',
  zeroTime?: number,
  maxAgeInSec?: number,
  encryption?: string,
  ivLength?: number
} = {}) => {
  if (!Buffer.isBuffer(secret) && typeof secret !== 'string') {
    throw new TypeError();
  }

  const crypter = Crypter(Buffer.concat([
    typeof secret === "string" ? Buffer.from(secret, encoding) : secret,
    Buffer.from(name, encoding)
  ]), { encryption, ivLength });

  const lock = (treasure: string, ...contexts: string[]) => {
    if (typeof treasure !== 'string') {
      throw new TypeError();
    }
    if (contexts.some(c => typeof c !== 'string')) {
      throw new TypeError();
    }

    const timestamp = getZerodUnixTime(zeroTime);
    const timestampBuffer = Buffer.alloc(4);
    timestampBuffer.writeUInt32BE(timestamp, 0);
    const treasureBuffer = Buffer.from(treasure, encoding);
    const signatureBuffer = computeSignature(
      secret,
      encoding,
      treasureBuffer,
      timestampBuffer,
      ...contexts.map(c => Buffer.from(c, encoding))
    );

    const bytes = Buffer.concat([signatureBuffer, timestampBuffer, treasureBuffer]);
    return crypter.encrypt(bytes);
  };

  const unlock = (chest: string, ...contexts: string[]) => {
    if (typeof chest !== 'string') {
      throw new TypeError();
    }
    if (contexts.some(c => typeof c !== 'string')) {
      throw new TypeError();
    }

    let bytes;
    try {
      bytes = crypter.decrypt(chest);
    } catch (e) {
      throw new DecryptionIntegrityError(e);
    }
    const signatureBufferStored = bytes.slice(0, 16);
    const timestampBuffer = bytes.slice(16, 20);
    const treasureBuffer = bytes.slice(20);
    const timestamp = timestampBuffer.readUInt32BE(0);
    const signatureBufferComputed = computeSignature(
      secret,
      encoding,
      treasureBuffer,
      timestampBuffer,
      ...contexts.map(c => Buffer.from(c, encoding))
    );
    if (Buffer.compare(signatureBufferStored, signatureBufferComputed) !== 0) {
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
  };

  return {
    _crypter: crypter,
    lock,
    unlock,
    lockObj: (treasure: Object, ...contexts: string[]) => {
      if (!(treasure instanceof Object)) {
        throw new TypeError();
      }
      try {
        return lock(JSON.stringify(treasure), ...contexts);
      } catch (e) {
        throw new EncryptionJsonError(e);
      }
    },
    unlockObj: (chest: string, ...contexts: string[]) => {
      const str = unlock(chest, ...contexts);
      try {
        return JSON.parse(str);
      } catch (e) {
        throw new DecryptionJsonError(e);
      }
    }
  };
};
