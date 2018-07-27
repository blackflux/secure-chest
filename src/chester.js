// @flow
const crypto = require("crypto");
const zlib = require('zlib');
const constants = require("./constants");
const errors = require("./errors");
const { Crypter } = require("./crypter");


const getZerodUnixTime = (zeroTime: number) => Math.floor(new Date() / 1000) - zeroTime;
const computeSignature = (secret, encoding, ...input) => input
  .reduce((p, c) => p.update(c, encoding), crypto.createHmac('md5', secret)).digest();

type options = {
  name?: string,
  encoding?: $Keys<typeof constants.ENCODING>,
  zeroTime?: number,
  maxAgeInSec?: number,
  gzip?: $Keys<typeof constants.GZIP_MODE>,
  gzipLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
  encryption?: string,
  ivLength?: number
};

module.exports.Chester = (secret: string | Buffer, {
  name = "default",
  encoding = constants.ENCODING.utf8,
  zeroTime = 1514764800,
  maxAgeInSec = 60,
  gzip = constants.GZIP_MODE.AUTO,
  gzipLevel = 9, // zlib.constants.Z_BEST_COMPRESSION
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

  const lock = (treasure: string, { contexts = [] }: { contexts: string[] } = {}) => {
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
      const inputGzip = zlib.gzipSync(treasureBuffer, { level: gzipLevel });
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

  const unlock = (chest: string, { contexts = [], expire = true }: { contexts?: string[], expire?: boolean } = {}) => {
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
      throw new errors.DecryptionIntegrityError(e);
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
      throw new errors.DecryptionSignatureError();
    }
    const ageInSec = getZerodUnixTime(zeroTime) - timestamp;
    if (ageInSec < 0) {
      throw new errors.DecryptionTimeTravelError();
    }
    if (expire && ageInSec > maxAgeInSec) {
      throw new errors.DecryptionExpiredError();
    }
    if (useGzip) {
      try {
        return zlib.gunzipSync(treasureBuffer).toString(encoding);
      } catch (e) {
        throw new errors.DecryptionGunzipError(e);
      }
    }
    return treasureBuffer.toString(encoding);
  };

  return {
    lock,
    unlock,
    lockObj: (treasure: Object, opts: any = {}) => {
      if (!(treasure instanceof Object)) {
        throw new TypeError();
      }
      try {
        return lock(JSON.stringify(treasure), opts);
      } catch (e) {
        throw new errors.EncryptionJsonError(e);
      }
    },
    unlockObj: (chest: string, opts: any = {}) => {
      const str = unlock(chest, opts);
      try {
        return JSON.parse(str);
      } catch (e) {
        throw new errors.DecryptionJsonError(e);
      }
    }
  };
};
