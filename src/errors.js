/* eslint-disable max-classes-per-file */

class NamedError extends Error {
  constructor(message, ...args) {
    super(message, ...args);
    this.message = this.message || this.constructor.name;
  }

  toJSON() {
    return { message: this.message };
  }
}
class EncryptionError extends NamedError {}
class EncryptionJsonError extends EncryptionError {}
class DecryptionError extends NamedError {}
class DecryptionIntegrityError extends DecryptionError {}
class DecryptionSignatureError extends DecryptionError {}
class DecryptionTimeTravelError extends DecryptionError {}
class DecryptionExpiredError extends DecryptionError {}
class DecryptionGunzipError extends DecryptionError {}
class DecryptionJsonError extends DecryptionError {}
module.exports.EncryptionError = EncryptionError;
module.exports.EncryptionJsonError = EncryptionJsonError;
module.exports.DecryptionError = DecryptionError;
module.exports.DecryptionIntegrityError = DecryptionIntegrityError;
module.exports.DecryptionSignatureError = DecryptionSignatureError;
module.exports.DecryptionTimeTravelError = DecryptionTimeTravelError;
module.exports.DecryptionExpiredError = DecryptionExpiredError;
module.exports.DecryptionGunzipError = DecryptionGunzipError;
module.exports.DecryptionJsonError = DecryptionJsonError;
