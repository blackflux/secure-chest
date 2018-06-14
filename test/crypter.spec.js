// @flow
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const { Crypter, toUrlSafeBase64, fromUrlSafeBase64 } = require("./../src/crypter");
const constants = require("./../src/constants");

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line no-param-reassign, // $FlowFixMe
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

describe("Testing Crypter", () => {
  it("Testing Non Buffer Secret (Error)", () => {
    // $FlowFixMe
    expect(() => Crypter("")).to.throw(TypeError);
  });

  it("Testing Non Buffer Encrypt Input (Error)", () => {
    // $FlowFixMe
    expect(() => Crypter(crypto.randomBytes(128)).encrypt("")).to.throw(TypeError);
  });

  it("Testing Non String Decrypt Input (Error)", () => {
    // $FlowFixMe
    expect(() => Crypter(crypto.randomBytes(128)).decrypt(crypto.randomBytes(0))).to.throw(TypeError);
  });

  it("Testing Invalid Gzip Mode (Error)", () => {
    // $FlowFixMe
    expect(() => Crypter(crypto.randomBytes(128), { gzip: "invalid" })).to.throw(TypeError);
  });

  it("Test Gzip Modes Force vs Never", () => {
    const secret = crypto.randomBytes(256);
    const crypterGzip = Crypter(secret, { gzip: constants.GZIP_MODE.FORCE });
    const crypterPlain = Crypter(secret, { gzip: constants.GZIP_MODE.NEVER });
    const data = Buffer.from("0".repeat(1024), "utf8");
    const encryptedGzip = crypterGzip.encrypt(data);
    const encryptedPlain = crypterPlain.encrypt(data);
    expect(encryptedGzip.length).to.be.below(encryptedPlain.length);
    // cross extract
    const decryptedGzip = crypterPlain.decrypt(encryptedGzip);
    const decryptedPlain = crypterGzip.decrypt(encryptedPlain);
    expect(Buffer.compare(decryptedGzip, data)).to.equal(0);
    expect(Buffer.compare(decryptedGzip, decryptedPlain)).to.equal(0);
  });

  it("Testing Custom Base64 Encoding", () => {
    for (let i = 1; i < 2048; i += 1) {
      const data = crypto.randomBytes(i);
      const encoded = toUrlSafeBase64(data);
      expect(["0", "1", "2"]).to.contain(encoded[encoded.length - 1]);
      expect(/^[A-Za-z0-9\-_]+$/g.test(encoded)).to.equal(true);
      const decoded = fromUrlSafeBase64(encoded);
      expect(Buffer.compare(data, decoded)).to.equal(0);
    }
  });

  it("Testing Different Length", () => {
    for (let i = 1; i < 1024; i += 1) {
      const crypter = Crypter(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const encrypted = crypter.encrypt(data);
      expect(["0", "1", "2"]).to.contain(encrypted[encrypted.length - 1]);
      expect(/^[A-Za-z0-9\-_]+$/g.test(encrypted)).to.equal(true);
      const output = crypter.decrypt(encrypted);
      expect(Buffer.compare(data, output)).to.equal(0);
    }
  });

  it("Testing Random Text", () => {
    const text = fs.readFileSync(path.join(__dirname, "data.txt"), "utf8");
    const words = text.split(" ");
    for (let i = 1; i < 1024; i += 1) {
      const crypter = Crypter(crypto.randomBytes(256));
      const randomText = shuffle(words).slice(0, Math.floor(Math.random() * words.length)).join(" ");
      const data = Buffer.from(randomText, "utf8");
      const encrypted = crypter.encrypt(data);
      const output = crypter.decrypt(encrypted);
      expect(Buffer.compare(data, output)).to.equal(0);
    }
  });

  it("Testing Unique Representation", () => {
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

  it("Testing Incorrect Secret", () => {
    for (let i = 1; i < 2048; i += 1) {
      const crypter1 = Crypter(crypto.randomBytes(256));
      const crypter2 = Crypter(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const encrypted = crypter1.encrypt(data);
      try {
        const output = crypter2.decrypt(encrypted);
        expect(Buffer.compare(data, output)).to.not.equal(0);
      } catch (e) {
        expect(e.message).to.contain(":bad decrypt");
      }
    }
  });

  it("Testing Incorrect IV", () => {
    for (let i = 1; i < 2048; i += 1) {
      const crypter = Crypter(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const encrypted = crypter.encrypt(data);
      const newIV = crypto.randomBytes(128);
      const buffer = fromUrlSafeBase64(encrypted);
      newIV.copy(buffer);
      const modifiedEncrypted = toUrlSafeBase64(buffer);
      try {
        const output = crypter.decrypt(modifiedEncrypted);
        expect(Buffer.compare(data, output)).to.not.equal(0);
      } catch (e) {
        expect([
          ":bad decrypt",
          "incorrect header check",
          "unknown compression method"
        ].some(needle => e.message.indexOf(needle) !== -1)).to.equal(true);
      }
    }
  });
});
