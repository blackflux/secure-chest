# Secure Chest

[![Build Status](https://img.shields.io/travis/simlu/secure-chest/master.svg)](https://travis-ci.org/simlu/secure-chest)
[![Test Coverage](https://img.shields.io/coveralls/simlu/secure-chest/master.svg)](https://coveralls.io/github/simlu/secure-chest?branch=master)
[![Dependencies](https://david-dm.org/simlu/secure-chest/status.svg)](https://david-dm.org/simlu/secure-chest)
[![NPM](https://img.shields.io/npm/v/secure-chest.svg)](https://www.npmjs.com/package/secure-chest)
[![Downloads](https://img.shields.io/npm/dt/secure-chest.svg)](https://www.npmjs.com/package/secure-chest)
[![Semantic-Release](https://github.com/simlu/js-gardener/blob/master/assets/icons/semver.svg)](https://github.com/semantic-release/semantic-release)
[![Gardener](https://github.com/simlu/js-gardener/blob/master/assets/badge.svg)](https://github.com/simlu/js-gardener)
[![Gitter](https://github.com/simlu/js-gardener/blob/master/assets/icons/gitter.svg)](https://gitter.im/simlu/secure-chest)

Web-safe Encryption and Signing of Data

## Use Case

Intended for storing data with untrusted party. Useful when storing data on server is expensive, forbidden, inconvenient or impossible. 

Data is first signed and then, together with a timestamp, encrypted into a "chest" using a secret. Data can be extracted again and checked for consistency and freshness using the same secret.

Encoded Data is Url Safe and satisfies the regular expression `^[A-Za-z0-9\-_]+$`. Internally Gzip is used when this shortens the tokens.

## Getting Started

    $ npm i --save secure-chest


Below is an example flow that allows users to be signed in without persisting any information on the server.

<!-- eslint-disable import/no-unresolved, import/no-extraneous-dependencies, no-undef -->
```js
const { Chester } = require("secure-chest");
const { DecryptionExpiredError } = require("secure-chest").errors;

const chester = Chester("SECRET-ENCRYPTION-KEY", {
  name: "facebook-auth",
  maxAgeInSec: 60 * 60 // require re-auth every hour
});

// ... facebook oauth flow ...

const token = getFacebookSessionToken();
const chest = chester.lockObj({ token });

// ... store chest with client ...

// ... time passes ...

// .. client makes request and provides chest ...

try {
  if (isValidFacebookUser(chester.unlockObj(chest))) {
    // welcome back
  }
} catch (e) {
  if (e instanceof DecryptionExpiredError) {
    // ... re-authenticate with facebook ...
  }
}
```

Or to create an unsubscribe link without storing information on the server one could use it as follows.

<!-- eslint-disable import/no-unresolved, import/no-extraneous-dependencies, no-undef, no-unused-vars -->
```js
const { Chester } = require("secure-chest");
const { DecryptionExpiredError } = require("secure-chest").errors;

const chester = Chester("SECRET-ENCRYPTION-KEY", {
  name: "email-unsubscribe",
  maxAgeInSec: 60 * 60 * 24 * 90 // link is valid for 90 days
});

// could also include hashed password-salt if unsubscribe links should be invalidated when password changes
const unsubscribeLink = `https://domain.com/unsubscribe?token=${chester.lockObj({ userId, userEmail })}`;

// ... generate and send email to user ...

// ... user clicks unsubscribe link ...

const token = getQueryParam("token");

try {
  const info = chester.unlockObj(token);
  const user = findUser(info.userId, info.userEmail);
  if (user) {
    unsubscribe(user);
  } else {
    // user does not exist or email address was changed
  }
} catch (e) {
  if (e instanceof DecryptionExpiredError) {
    // unsubscribe link has expired
  }
}
```

## Chester

Exposes main functionality.

Uses GZip internally when this shortens the output.

### Parameters

#### secret

Type: `string` or `Buffer`<br>

Secret used to encrypt data. If `string` is provided it is converted into `Buffer` internally using provided encoding.

#### name

Type: `string`<br>
Default: `default`

Name of this Chester. A Chester can not open chests if Chester with different name but same secret
locked them. Ease-of-life, so one can use same secret for different Chester.

Internally name is merged with provided secret and passed into underlying Crypter.

#### encoding

Type: `constants.ENCODING`<br>
Default: `constants.ENCODING.utf8`

Encoding used to convert between strings and Buffers. For most cases `utf8` is suitable.

#### zeroTime

Type: `number`<br>
Default: `1514764800`

Used to delay year [2038 problem](https://en.wikipedia.org/wiki/Year_2038_problem). Should never be changed.

Necessary since timestamp is stored as 4 bytes.

#### maxAgeInSec

Type: `number`<br>
Default: `60`

Maximum age in seconds before chest expires and `DecryptionExpiredError` is thrown when trying to unlock it. 

When value is changed it is automatically changed for all previously created chests, since chests only store a timestamp.

#### gzip

Type: `constant.GZIP_MODE`<br>
Default: `constant.GZIP_MODE.AUTO`

Overwrite gzip mode. By default gzip mode is only used when output is shortened.

#### gzipLevel

Type: `zlib.constants.*`
Default: `zlib.constants.Z_BEST_COMPRESSION`

Desired zlib compression.

#### encryption

See Cryper below

#### ivLength

See Cryper below

### Errors

Exported from top level `errors`.

#### EncryptionError

General Encryption Error that all Encryption Errors inherit from.

#### EncryptionJsonError

Thrown from `lockObj` when `JSON.stringify` fails. 

#### DecryptionError

General Decryption Error that all Decryption Errors inherit from.

#### DecryptionIntegrityError

Provided data can not be decrypted. Can be indication for invalid data or incorrect secret or name.

#### DecryptionSignatureError

Data was decrypted successfully, but signature did not match. Can also indicate invalid data or an incorrect secret or name.

Also thrown when context was changed.

#### DecryptionTimeTravelError

The chest is not valid yet. This usually only happens when the zeroTime is changed.

#### DecryptionExpiredError

The chest has expired.

#### DecryptionGunzipError

The gzip content of the chest is invalid. This should never happen.

#### DecryptionJsonError

Thrown from `unlockObj` when `JSON.parse` fails. 

### Functions

#### lock

`lock(treasure, options = {})`

Create and "lock" new chest. Takes data to encrypt as first argument and optional options as second argument.

#### lockObj

Wraps `lock`, and `JSON.stringify` is applied to first argument. On failure `EncryptionJsonError` is thrown.

#### unlock

`unlock(chest, options = {})`

Unlock a chest and returns data. Takes data to decrypt as first argument and options as optional second argument.

This method can throw various errors (see section).

#### unlockObj

Wraps `unlock`, and `JSON.parse` is applied to return value. On failure `DecryptionJsonError` is thrown.

### Options

#### contexts
Type: `String[]`<br>

When unlocking chest where contexts have been provided to lock it, unlocking requires the contexts to be identical.
Useful for IP address or User-Agent if changes should invalidate the chest.


### Example

<!-- eslint-disable import/no-unresolved, import/no-extraneous-dependencies -->
```js
const Chester = require("secure-chest").Chester;

const chester = Chester("SECRET-ENCRYPTION-KEY");
const data = "Some Text";
const chest = chester.lock(data);
chester.unlock(chest);
// => "Some Text"
```

## Crypter

Used to encrypt and decrypt data using `aes-256-cbc` with `16` bit random IV by default.

Deals only with Buffers and produced web-safe base64 and hence is encoding independent.

*Important*: Errors are not explicitly handled.

### Functions

#### encrypt

`encrypt(Buffer)`

Takes a Buffer and encrypts it as a web-safe base64 encoded string.

#### decrypt

`decrypt(Base64)`

Takes a web-safe base64 encoded string and decrypts it into a Buffer.

### Parameters

#### secret

Type: `Buffer`<br>

Secret used to encrypt data. Internally this gets hashed.

#### encryption

Type: `string`<br>
Default: `aes-256-cbc`

Defines encryption algorithm. IV length must be compatible.

#### ivLength

Type: `number`<br>
Default: `16`

Defines length of IV. Must be compatible with encryption.

### Example

<!-- eslint-disable import/no-unresolved, import/no-extraneous-dependencies -->
```js
const crypto = require('crypto');
const Crypter = require("secure-chest").Crypter;

const crypter = Crypter(crypto.randomBytes(64));

const data = crypto.randomBytes(64);
const encrypted = crypter.encrypt(data); // non-deterministic due to IV
const decrypted = crypter.decrypt(encrypted);

Buffer.compare(data, decrypted);
// => 0
```

## Constants

### GZIP_MODE

Values `AUTO`, `NEVER`, `FORCE`

Defines gzip mode used internally.

### ENCODING

Values `utf8`, `ascii`, `latin1`, `binary`

Defines encoding for string to buffer conversions.

## Utility Functions

The functions `toUrlSafeBase64` and `fromUrlSafeBase64` are exposed.

`toUrlSafeBase64(Buffer)`
 
`fromUrlSafeBase64(Base64)` 

## Implementation Notes

This project is considered complete and won't see any major features or changes.

Input values are heavily checked and `TypeError` is raised if invalid.

## Signature Observations

By default GZip is only used when this shortens the output. One bit in the signature indicates if gzip is used and hence only `len - 1` bits are the "true" signature.
 
Acceptable since signature is `16` bytes and this doesn't increase collisions significantly.
