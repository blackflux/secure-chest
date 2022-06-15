/* eslint-disable max-classes-per-file */

class NamedError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }

  toString() {
    return `${this.name}: ${this.message}`;
  }
}
export class EncryptionError extends NamedError {}
export class EncryptionJsonError extends EncryptionError {}
export class DecryptionError extends NamedError {}
export class DecryptionIntegrityError extends DecryptionError {}
export class DecryptionSignatureError extends DecryptionError {}
export class DecryptionTimeTravelError extends DecryptionError {}
export class DecryptionExpiredError extends DecryptionError {}
export class DecryptionGunzipError extends DecryptionError {}
export class DecryptionJsonError extends DecryptionError {}
