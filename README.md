# Secure Chest

[![Build Status](https://img.shields.io/travis/simlu/secure-chest/master.svg)](https://travis-ci.org/simlu/secure-chest)
[![Test Coverage](https://img.shields.io/coveralls/simlu/secure-chest/master.svg)](https://coveralls.io/github/simlu/secure-chest?branch=master)
[![Greenkeeper Badge](https://badges.greenkeeper.io/simlu/secure-chest.svg)](https://greenkeeper.io/)
[![Dependencies](https://david-dm.org/simlu/secure-chest/status.svg)](https://david-dm.org/simlu/secure-chest)
[![NPM](https://img.shields.io/npm/v/secure-chest.svg)](https://www.npmjs.com/package/secure-chest)
[![Downloads](https://img.shields.io/npm/dt/secure-chest.svg)](https://www.npmjs.com/package/secure-chest)
[![Semantic-Release](https://github.com/simlu/js-gardener/blob/master/assets/icons/semver.svg)](https://github.com/semantic-release/semantic-release)
[![Gardener](https://github.com/simlu/js-gardener/blob/master/assets/badge.svg)](https://github.com/simlu/js-gardener)
[![Gitter](https://github.com/simlu/js-gardener/blob/master/assets/icons/gitter.svg)](https://gitter.im/simlu/secure-chest)

Sign and Encrypt Data

## Use Case

Web-safe encryption and signing of data. Intended for storing data with untrusted third party. Useful when storing data on the server is expensive, inconvenient or impossible. 

Data is first signed and then, together with a timestamp, encrypted into a "chest" using a secret. Data can be extracted again and checked for consistency and freshness using the same secret.

Encoded Data is Url Safe and satisfies the regular expression `^[A-Za-z0-9\-_]+$`. 

## Getting Started

    $ npm i --save secure-chest

## Chester

Exposes main functionality.

### Parameters

#### secret

Type: `string` or `Buffer`<br>

Define the secret that is used to encrypt the data. If string is provided it is converted into a Buffer using the provided encoding.

#### name

Type: `string`<br>
Default: `default`

Name of this Chester. A Chester can not open chests if a Chester with a different name but the same secret
locked them. This is mainly ease-of-life, so one can use the same secret for different Chester.

Internally the input is merged with the provided secret and passed into the Crypter.

#### encoding

Type: `string`<br>
Default: `utf8`

The encoding used to convert between strings and Buffers. For most cases `utf8` is suitable.

#### zeroTime

Type: `number`<br>
Default: `1514764800`

Used to delay the year [2038 problem](https://en.wikipedia.org/wiki/Year_2038_problem). This should not be changes.

Since the timestamp is stored as 4 bytes, using this offset the overflow is delayed for 48 years.

#### maxAgeInSec

Type: `number`<br>
Default: `60`

Maximum age before this token is considered expired and a `DecryptionExpiredError` is thrown. When this value is changed
it is automatically changed for all previously created tokens as well, since only the timestamp is stored with the token.

#### encryption

See Cryper below

#### ivLength

See Cryper below

### Errors

#### DecryptionError

General Base Error that all other decryption errors inherit from.

#### DecryptionIntegrityError

The provided data could not be decrypted. This can be an indication for invalid data or an incorrect secret or name.

#### DecryptionSignatureError

The data was decrypted successfully, however the signature does not match. This can sometimes indicate invalid data or an incorrect secret or name.

However if a different context is passed, this error is also thrown.

#### DecryptionTimeTravelError

The chest is not valid yet. This usually only happens when the zeroTime is changed.

#### DecryptionExpiredError

The chest has expired.

### Functions

#### lock

`lock(treasure, ...context)`

Create and "lock" a new chest. This takes the data to encrypt as its first argument and all additional arguments are
considered context. 

When unlocking a chest where a context has been provided to lock it, the unlocking is only
successful if the context is provided the same way to the unlock function. Otherwise a DecryptionSignatureError
is thrown.

#### unlock

`unlock(chest, ...context)`

Unlock a chest and returns data. This takes the data to decrypt as its first argument and all additional arguments are
considered context.

This method can throw various errors (see section).

#### _crypter

Exposes the underlying Crypter that is used. Useful for debugging.

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

Used to encrypt and decrypt data using `aes-256-cbc` with a `16` bit random IV by default (see notes below).

Deals only with Buffers and produced web-safe base64 and hence is encoding independent.

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

Define the secret that is used to encrypt the data. Internally this gets hashed to produce a suitable key.

#### encryption

Type: `string`<br>
Default: `aes-256-cbc`

Defines the encryption type. IV length must be adjusted accordingly when changed.

#### ivLength

Type: `number`<br>
Default: `16`

Defines the length of the IV. Must be compatible with the encryption.

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

## Utility Functions

The functions `toUrlSafeBase64` and `fromUrlSafeBase64` are exposed. 

## Implementation Notes

This project is considered complete and won't see any major features or changes.

Input values are heavily checked and a `TypeError` is raised if they are not as expected.

## Security Observations

GZip is only used when this shortens the output. One bit in IV indicates this and hence only `len - 1` bits are truly random. Acceptable when `len(IV) >= 16` bytes.
