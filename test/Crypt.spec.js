const crypto = require('crypto');
const expect = require('chai').expect;
const Crypt = require("./../src/Crypt");

describe("Testing Crypt", () => {
  const crypt = Crypt(crypto.randomBytes(256));

  it("Testing Different Length", () => {
    for (let i = 1; i < 1024; i += 1) {
      const data = crypto.randomBytes(i);
      const encrypted = crypt.encrypt(data);
      const output = crypt.decrypt(encrypted);
      expect(Buffer.compare(data, output)).to.equal(0);
    }
  });
});
