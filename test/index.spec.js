const expect = require('chai').expect;
const { describe } = require('node-tdd');
const index = require('../src/index');

describe('Testing Index', () => {
  it('Testing Include', () => {
    expect(index).to.have.keys(
      'constants',
      'errors',
      'toUrlSafeBase64',
      'fromUrlSafeBase64',
      'Crypter',
      'Chester'
    );
    expect(index.constants).to.have.keys(
      'ENCODING',
      'GZIP_MODE'
    );
    expect(index.errors).to.have.keys(
      'EncryptionError',
      'EncryptionJsonError',
      'DecryptionError',
      'DecryptionExpiredError',
      'DecryptionIntegrityError',
      'DecryptionSignatureError',
      'DecryptionTimeTravelError',
      'DecryptionGunzipError',
      'DecryptionJsonError'
    );
  });
});
