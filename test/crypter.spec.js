const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const urlSafeBase64 = require('../src/url-safe-base64');
const { Crypter } = require('../src/crypter');

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line no-param-reassign
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

describe('Testing Crypter', () => {
  it('Testing Non Buffer Secret (Error)', () => {
    expect(() => Crypter('')).to.throw(TypeError);
  });

  it('Testing Non Buffer Encrypt Input (Error)', () => {
    expect(() => Crypter(crypto.randomBytes(128)).encrypt('')).to.throw(TypeError);
  });

  it('Testing Non String Decrypt Input (Error)', () => {
    expect(() => Crypter(crypto.randomBytes(128)).decrypt(crypto.randomBytes(0))).to.throw(TypeError);
  });

  it('Testing Custom Base64 Encoding', () => {
    for (let i = 1; i < 2048; i += 1) {
      const data = crypto.randomBytes(i);
      const encoded = urlSafeBase64.encode(data);
      expect(['0', '1', '2']).to.contain(encoded[encoded.length - 1]);
      expect(/^[A-Za-z0-9\-_]+$/g.test(encoded)).to.equal(true);
      const decoded = urlSafeBase64.decode(encoded);
      expect(Buffer.compare(data, decoded)).to.equal(0);
    }
  });

  it('Testing Different Length', () => {
    for (let i = 1; i < 1024; i += 1) {
      const crypter = Crypter(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const encrypted = crypter.encrypt(data);
      expect(['0', '1', '2']).to.contain(encrypted[encrypted.length - 1]);
      expect(/^[A-Za-z0-9\-_]+$/g.test(encrypted)).to.equal(true);
      const output = crypter.decrypt(encrypted);
      expect(Buffer.compare(data, output)).to.equal(0);
    }
  });

  it('Testing Random Text', () => {
    const text = fs.readFileSync(path.join(__dirname, 'data.txt'), 'utf8');
    const words = text.split(' ');
    for (let i = 1; i < 1024; i += 1) {
      const crypter = Crypter(crypto.randomBytes(256));
      const randomText = shuffle(words).slice(0, Math.floor(Math.random() * words.length)).join(' ');
      const data = Buffer.from(randomText, 'utf8');
      const encrypted = crypter.encrypt(data);
      const output = crypter.decrypt(encrypted);
      expect(Buffer.compare(data, output)).to.equal(0);
    }
  });

  it('Testing Unique Representation', () => {
    for (let i = 1; i < 16; i += 1) {
      const crypter = Crypter(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const hashSet = {};
      for (let j = 0; j < 1024; j += 1) {
        hashSet[crypter.encrypt(data)] = true;
      }
      expect(Object.keys(hashSet).length).to.equal(1024);
    }
  });

  it('Testing Incorrect Secret', () => {
    for (let i = 1; i < 2048; i += 1) {
      const crypter1 = Crypter(crypto.randomBytes(256));
      const crypter2 = Crypter(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const encrypted = crypter1.encrypt(data);
      try {
        const output = crypter2.decrypt(encrypted);
        expect(Buffer.compare(data, output)).to.not.equal(0);
      } catch (e) {
        expect(e.message).to.contain(':bad decrypt');
      }
    }
  });

  it('Testing Incorrect IV', () => {
    for (let i = 1; i < 2048; i += 1) {
      const crypter = Crypter(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const encrypted = crypter.encrypt(data);
      const newIV = crypto.randomBytes(128);
      const buffer = urlSafeBase64.decode(encrypted);
      newIV.copy(buffer);
      const modifiedEncrypted = urlSafeBase64.encode(buffer);
      try {
        const output = crypter.decrypt(modifiedEncrypted);
        expect(Buffer.compare(data, output)).to.not.equal(0);
      } catch (e) {
        expect([
          ':bad decrypt',
          'incorrect header check',
          'unknown compression method'
        ].some((needle) => e.message.indexOf(needle) !== -1)).to.equal(true);
      }
    }
  });
});
