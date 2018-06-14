// @flow
const expect = require('chai').expect;
const index = require('./../src/index');

describe("Testing Index", () => {
  it("Testing Include", () => {
    expect(index).to.have.keys(
      "Crypter",
      "toUrlSafeBase64",
      "fromUrlSafeBase64",
      "Chester",
      "EncryptionError",
      "EncryptionJsonError",
      "DecryptionError",
      "DecryptionExpiredError",
      "DecryptionIntegrityError",
      "DecryptionSignatureError",
      "DecryptionTimeTravelError"
    );
  });
});
