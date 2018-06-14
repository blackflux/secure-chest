// @flow
const crypto = require('crypto');
const expect = require('chai').expect;
const {
  Chester,
  DecryptionIntegrityError,
  DecryptionSignatureError,
  DecryptionTimeTravelError,
  DecryptionExpiredError
} = require("./../src/chester");

describe("Testing Chester", () => {
  it("Testing Non Buffer and non String Secret (Error)", () => {
    // $FlowFixMe
    expect(() => Chester(0)).to.throw(TypeError);
  });

  it("Testing Non String Lock Input (Error)", () => {
    // $FlowFixMe
    expect(() => Chester("").lock(1)).to.throw(TypeError);
  });

  it("Testing Non String Lock Context (Error)", () => {
    // $FlowFixMe
    expect(() => Chester("").lock("", 1)).to.throw(TypeError);
  });

  it("Testing Non String Unlock Input (Error)", () => {
    // $FlowFixMe
    expect(() => Chester("").unlock(1)).to.throw(TypeError);
  });

  it("Testing Non String Unlock Context (Error)", () => {
    // $FlowFixMe
    expect(() => Chester("").unlock("", 1)).to.throw(TypeError);
  });

  it("Testing Different Length", () => {
    for (let i = 1; i < 1024; i += 1) {
      const chester = Chester(crypto.randomBytes(256));
      const data = crypto.randomBytes(i).toString("utf8");
      const chest = chester.lock(data);
      const output = chester.unlock(chest);
      expect(data).to.equal(output);
    }
  });

  it("Testing String Secret", () => {
    const chester = Chester(crypto.randomBytes(256).toString("utf8"));
    const data = crypto.randomBytes(256).toString("utf8");
    const chest = chester.lock(data);
    const output = chester.unlock(chest);
    expect(data).to.equal(output);
  });

  it("Testing Context", () => {
    const chester = Chester(crypto.randomBytes(256));
    const data = crypto.randomBytes(256).toString("utf8");
    const context = crypto.randomBytes(256).toString("utf8");
    const chest = chester.lock(data, context);
    const output = chester.unlock(chest, context);
    expect(data).to.equal(output);
  });

  it("Testing Context Mismatch", () => {
    const chester = Chester(crypto.randomBytes(256));
    const data = crypto.randomBytes(256).toString("utf8");
    const context = crypto.randomBytes(256).toString("utf8");
    const context2 = crypto.randomBytes(256).toString("utf8");
    const chest = chester.lock(data, context);
    expect(() => chester.unlock(chest, context2)).to.throw(DecryptionSignatureError);
  });

  it("Testing Integrity Error", () => {
    const chester1 = Chester(Buffer.from([0x00]));
    const chester2 = Chester(Buffer.from([0x01]));
    const data = Buffer.from([0x00]).toString("utf8");
    const chest = chester1.lock(data);
    expect(() => chester2.unlock(chest)).to.throw(DecryptionIntegrityError);
  });

  it("Testing Signature Error", () => {
    const chester = Chester(crypto.randomBytes(256));
    // eslint-disable-next-line no-underscore-dangle
    const crypter = chester._crypter;
    const data = crypto.randomBytes(256).toString("utf8");
    const chest = chester.lock(data);
    const decrypted = crypter.decrypt(chest);
    Buffer.alloc(16).copy(decrypted);
    const encrypted = crypter.encrypt(decrypted);
    expect(() => chester.unlock(encrypted)).to.throw(DecryptionSignatureError);
  });

  it("Testing Time Travel Error", () => {
    const secret = crypto.randomBytes(256);
    // $FlowFixMe - flow doesn't understand destructuring
    const chester1 = Chester(secret, { zeroTime: 0 });
    const chester2 = Chester(secret);
    const data = crypto.randomBytes(256).toString("utf8");
    const chest = chester1.lock(data);
    expect(() => chester2.unlock(chest)).to.throw(DecryptionTimeTravelError);
  });

  it("Testing Expired Error", () => {
    const secret = crypto.randomBytes(256);
    const chester1 = Chester(secret);
    // $FlowFixMe - flow doesn't understand destructuring
    const chester2 = Chester(secret, { zeroTime: 0 });
    const data = crypto.randomBytes(256).toString("utf8");
    const chest = chester1.lock(data);
    expect(() => chester2.unlock(chest)).to.throw(DecryptionExpiredError);
  });
});
