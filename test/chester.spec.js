const crypto = require('crypto');
const expect = require('chai').expect;
const { describe } = require('node-tdd');
const constants = require('../src/constants');
const {
  EncryptionJsonError,
  DecryptionIntegrityError,
  DecryptionSignatureError,
  DecryptionTimeTravelError,
  DecryptionExpiredError,
  DecryptionGunzipError,
  DecryptionJsonError
} = require('../src/errors');
const urlSafeBase64 = require('../src/url-safe-base64');
const { Crypter } = require('../src/crypter');
const { Chester } = require('../src/chester');

describe('Testing Chester', () => {
  let secret;
  let chester;
  let crypter;

  beforeEach(() => {
    secret = crypto.randomBytes(256);
    chester = Chester(secret);
    crypter = Crypter(Buffer.concat([secret, Buffer.from('default', 'utf8')]));
  });

  it('Testing Non Buffer and non String Secret (Error)', () => {
    expect(() => Chester(0)).to.throw(TypeError);
  });

  it('Testing Empty String (Error)', () => {
    expect(() => Chester('')).to.throw(TypeError);
  });

  it('Testing Empty Buffer (Error)', () => {
    expect(() => Chester(Buffer.alloc(0))).to.throw(TypeError);
  });

  it('Testing Non String Lock Input (Error)', () => {
    expect(() => Chester('secret').lock(1)).to.throw(TypeError);
  });

  it('Testing Non String Lock Context (Error)', () => {
    expect(() => Chester('secret').lock('', { contexts: [1] })).to.throw(TypeError);
  });

  it('Testing Non String Unlock Input (Error)', () => {
    expect(() => Chester('secret').unlock(1)).to.throw(TypeError);
  });

  it('Testing Non String Unlock Context (Error)', () => {
    expect(() => Chester('secret').unlock('', { contexts: [1] })).to.throw(TypeError);
  });

  it('Testing Non Object UnlockObj Input (Error)', () => {
    expect(() => Chester('secret').lockObj(1)).to.throw(TypeError);
  });

  it('Testing Invalid Zero Time (Error)', () => {
    expect(() => Chester('secret', { zeroTime: null })).to.throw(TypeError);
    expect(() => Chester('secret', { zeroTime: -1 })).to.throw(TypeError);
  });

  it('Testing Negative Max Age In Seconds (Error)', () => {
    expect(() => Chester('secret', { maxAgeInSec: null })).to.throw(TypeError);
    expect(() => Chester('secret', { maxAgeInSec: -1 })).to.throw(TypeError);
  });

  it('Testing Invalid Encoding (Error)', () => {
    expect(() => Chester('secret', { encoding: 'invalid' })).to.throw(TypeError);
  });

  it('Testing Invalid Gzip Mode (Error)', () => {
    expect(() => Chester('secret', { gzip: 'invalid' })).to.throw(TypeError);
  });

  it('Testing JSON', () => {
    const data = { property: 'value' };
    const chest = chester.lockObj(data);
    const output = chester.unlockObj(chest);
    expect(data).to.deep.equal(output);
  });

  it('Testing Different Length', () => {
    for (let i = 1; i < 1024; i += 1) {
      const chester1 = Chester(crypto.randomBytes(256));
      const data = crypto.randomBytes(i).toString('utf8');
      const chest = chester1.lock(data);
      const output = chester1.unlock(chest);
      expect(data).to.equal(output);
    }
  });

  it('Testing String Secret', () => {
    const chester1 = Chester(crypto.randomBytes(256).toString('utf8'));
    const data = crypto.randomBytes(256).toString('utf8');
    const chest = chester1.lock(data);
    const output = chester1.unlock(chest);
    expect(data).to.equal(output);
  });

  describe('Testing "DecryptionIntegrityError"', {
    cryptoSeed: '9d01b414-a1d4-4661-8312-55cf9bf5ab8b', timestamp: 1583442033
  }, () => {
    it('Testing Secret Mismatch', () => {
      const chester1 = Chester(crypto.randomBytes(256));
      const chester2 = Chester(crypto.randomBytes(256));
      const data = crypto.randomBytes(4096).toString('utf8');
      const chest = chester1.lock(data);
      expect(() => chester2.unlock(chest)).to.throw(DecryptionIntegrityError);
    });

    it('Testing Name Mismatch', () => {
      const chester1 = Chester(secret, { name: 'chester1' });
      const chester2 = Chester(secret, { name: 'chester2' });
      const data = crypto.randomBytes(4096).toString('utf8');
      const chest = chester1.lock(data);
      expect(() => chester2.unlock(chest)).to.throw(DecryptionIntegrityError);
    });

    it('Testing Integrity Error', () => {
      expect(() => chester.unlock(urlSafeBase64.encode(crypto.randomBytes(4096))))
        .to.throw(DecryptionIntegrityError);
    });
  });

  it('Testing Context', () => {
    const data = crypto.randomBytes(256).toString('utf8');
    const context = crypto.randomBytes(256).toString('utf8');
    const chest = chester.lock(data, { contexts: [context] });
    const output = chester.unlock(chest, { contexts: [context] });
    expect(data).to.equal(output);
  });

  it('Testing Context Mismatch', () => {
    const data = crypto.randomBytes(256).toString('utf8');
    const context = crypto.randomBytes(256).toString('utf8');
    const context2 = crypto.randomBytes(256).toString('utf8');
    const context3 = crypto.randomBytes(256).toString('utf8');
    const dataSingleContext = chester.lock(data, { contexts: [context] });
    const dataDoubleContext = chester.lock(data, { contexts: [context, context2] });
    expect(() => chester.unlock(dataSingleContext, { contexts: [context2] }))
      .to.throw(DecryptionSignatureError);
    expect(() => chester.unlock(dataSingleContext, { contexts: [context, context2] }))
      .to.throw(DecryptionSignatureError);
    expect(() => chester.unlock(dataDoubleContext, { contexts: [context, context3] }))
      .to.throw(DecryptionSignatureError);
    expect(() => chester.unlock(dataDoubleContext, { contexts: [context, context2, context3] }))
      .to.throw(DecryptionSignatureError);
  });

  it('Testing Signature Error', () => {
    const data = crypto.randomBytes(256).toString('utf8');
    const chest = chester.lock(data);
    const decrypted = crypter.decrypt(chest);
    Buffer.alloc(16).copy(decrypted);
    const encrypted = crypter.encrypt(decrypted);
    expect(() => chester.unlock(encrypted)).to.throw(DecryptionSignatureError);
  });

  it('Testing Time Travel Error', () => {
    const chester1 = Chester(secret, { zeroTime: 0 });
    const chester2 = Chester(secret);
    const data = crypto.randomBytes(256).toString('utf8');
    const chest = chester1.lock(data);
    expect(() => chester2.unlock(chest)).to.throw(DecryptionTimeTravelError);
  });

  it('Testing Expired Error', () => {
    const chester1 = Chester(secret);
    const chester2 = Chester(secret, { zeroTime: 0 });
    const data = crypto.randomBytes(256).toString('utf8');
    const chest = chester1.lock(data);
    expect(() => chester2.unlock(chest, { expire: false })).to.not.throw(DecryptionExpiredError);
    expect(() => chester2.unlock(chest)).to.throw(DecryptionExpiredError);
  });

  it('Testing Decryption Json Error', () => {
    const data = '{';
    const chest = chester.lock(data);
    expect(() => chester.unlockObj(chest)).to.throw(DecryptionJsonError);
  });

  it('Testing Encryption Json Error', () => {
    const obj = {};
    obj.recursive = obj;
    expect(() => chester.lockObj(obj)).to.throw(EncryptionJsonError);
  });

  it('Test Gzip Modes Force vs Never', () => {
    const chesterGzip = Chester(secret, { gzip: constants.GZIP_MODE.FORCE });
    const chesterPlain = Chester(secret, { gzip: constants.GZIP_MODE.NEVER });
    const data = '0'.repeat(1024);
    const encryptedGzip = chesterGzip.lock(data);
    const encryptedPlain = chesterPlain.lock(data);
    expect(encryptedGzip.length).to.be.below(encryptedPlain.length);
    // cross extract
    const decryptedGzip = chesterPlain.unlock(encryptedGzip);
    const decryptedPlain = chesterGzip.unlock(encryptedPlain);
    expect(decryptedGzip).to.equal(data);
    expect(decryptedGzip).to.equal(decryptedPlain);
  });

  it('Test Invalid Gzip Content', () => {
    const chesterPlain = Chester(secret, { gzip: constants.GZIP_MODE.NEVER });
    const data = '0'.repeat(1024);
    const encrypted = chesterPlain.lock(data);
    const raw = crypter.decrypt(encrypted);
    // eslint-disable-next-line no-bitwise
    raw[0] |= 1;
    const invalid = crypter.encrypt(raw);
    expect(() => chester.unlock(invalid)).to.throw(DecryptionGunzipError);
  });
});
