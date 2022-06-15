import { expect } from 'chai';
import { describe } from 'node-tdd';
import * as index from '../src/index.js';

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
