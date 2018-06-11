const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const expect = require('chai').expect;
const Crypt = require("./../src/Crypt");

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line no-param-reassign
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

describe("Testing Crypt", () => {
  it("Testing Different Length", () => {
    for (let i = 1; i < 1024; i += 1) {
      const crypt = Crypt(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const encrypted = crypt.encrypt(data);
      const output = crypt.decrypt(encrypted);
      expect(Buffer.compare(data, output)).to.equal(0);
    }
  });

  it("Testing Random Text", () => {
    const text = fs.readFileSync(path.join(__dirname, "data.txt"), "utf8");
    const words = text.split(" ");
    for (let i = 1; i < 1024; i += 1) {
      const crypt = Crypt(crypto.randomBytes(256));
      const randomText = shuffle(words).slice(0, Math.floor(Math.random() * words.length)).join(" ");
      const data = Buffer.from(randomText);
      const encrypted = crypt.encrypt(data);
      const output = crypt.decrypt(encrypted);
      expect(Buffer.compare(data, output)).to.equal(0);
    }
  });

  it("Testing Unique Representation", () => {
    for (let i = 1; i < 16; i += 1) {
      const crypt = Crypt(crypto.randomBytes(256));
      const data = crypto.randomBytes(i);
      const hashSet = {};
      for (let j = 0; j < 1024; j += 1) {
        hashSet[crypt.encrypt(data)] = true;
      }
      expect(Object.keys(hashSet).length).to.equal(1024);
    }
  });
});
