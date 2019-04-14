class EncryptionError extends Error {}
class EncryptionJsonError extends EncryptionError {}
class DecryptionError extends Error {}
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
