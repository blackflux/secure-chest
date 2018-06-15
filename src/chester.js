// @flow
const crypto = require("crypto");
const zlib = require('zlib');
const { Crypter } = require("./crypter");
const constants = require("./constants");


class EncryptionError extends Error {}
class EncryptionJsonError extends EncryptionError {}
class DecryptionError extends Error {}
class DecryptionIntegrityError extends DecryptionError {}
class DecryptionSignatureError extends DecryptionError {}
class DecryptionTimeTravelError extends DecryptionError {}
class DecryptionExpiredError extends DecryptionError {}
class DecryptionGunzipError extends DecryptionError {}
class DecryptionJsonError extends DecryptionError {}
module.exports.EncryptionError = EncryptionError;
module.exports.EncryptionJsonError = EncryptionJsonError;
module.exports.DecryptionError = DecryptionError;
module.exports.DecryptionIntegrityError = DecryptionIntegrityError;
module.exports.DecryptionSignatureError = DecryptionSignatureError;
module.exports.DecryptionTimeTravelError = DecryptionTimeTravelError;
module.exports.DecryptionExpiredError = DecryptionExpiredError;
module.exports.DecryptionGunzipError = DecryptionGunzipError;
module.exports.DecryptionJsonError = DecryptionJsonError;


const getZerodUnixTime = (zeroTime: number) => Math.floor(new Date() / 1000) - zeroTime;
const computeSignature = (secret, encoding, ...input) => input
  .reduce((p, c) => p.update(c, encoding), crypto.createHmac('md5', secret)).digest();

type options = {
  name?: string,
  encoding?: $Keys<typeof constants.ENCODING>,
  zeroTime?: number,
  maxAgeInSec?: number,
  gzip?: $Keys<typeof constants.GZIP_MODE>,
  encryption?: string,
  ivLength?: number
};

module.exports.Chester = (secret: string | Buffer, {
  name = "default",
  encoding = constants.ENCODING.utf8,
  zeroTime = 1514764800,
  maxAgeInSec = 60,
  gzip = constants.GZIP_MODE.AUTO,
  encryption = 'aes-256-cbc',
  ivLength = 16
}: options = {}) => {
  if (!Buffer.isBuffer(secret) && typeof secret !== 'string') {
    throw new TypeError();
  }
  if (Object.keys(constants.ENCODING).indexOf(encoding) === -1) {
    throw new TypeError();
  }
  if (Object.keys(constants.GZIP_MODE).indexOf(gzip) === -1) {
    throw new TypeError();
  }

  const crypter = Crypter(Buffer.concat([
    typeof secret === "string" ? Buffer.from(secret, encoding) : secret,
    Buffer.from(name, encoding)
  ]), encryption, ivLength);

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
    let treasureBuffer = Buffer.from(treasure, encoding);

    let useGzip = false;
    if (gzip !== constants.GZIP_MODE.NEVER) {
      const inputGzip = zlib.gzipSync(treasureBuffer, { level: 9 /* zlib.constants.Z_BEST_COMPRESSION */ });
      if (gzip === constants.GZIP_MODE.FORCE || treasureBuffer.length > inputGzip.length) {
        treasureBuffer = inputGzip;
        useGzip = true;
      }
    }

    const signatureBuffer = computeSignature(
      secret,
      encoding,
      treasureBuffer,
      timestampBuffer,
      ...contexts.map(c => Buffer.from(c, encoding))
    );
    // eslint-disable-next-line no-bitwise
    signatureBuffer[0] = useGzip ? signatureBuffer[0] | 1 : signatureBuffer[0] & ~1;

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
    // eslint-disable-next-line no-bitwise
    const useGzip = (signatureBufferStored[0] & 1) !== 0;
    // eslint-disable-next-line no-bitwise
    signatureBufferComputed[0] = useGzip ? signatureBufferComputed[0] | 1 : signatureBufferComputed[0] & ~1;

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
    if (useGzip) {
      try {
        return zlib.gunzipSync(treasureBuffer).toString(encoding);
      } catch (e) {
        throw new DecryptionGunzipError(e);
      }
    }
    return treasureBuffer.toString(encoding);
  };

  return {
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
