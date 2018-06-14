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

Web-safe encryption and signing of data. Intendet to temporarily store data with untrusted third party. Useful when storing data on the server is inconvenient, expensive or impossible. 

Data is first signed and then encrypted with a timestamp. This allows to check data for consistency and freshness while making it impossible to obtain data without knowing the secret.

Encoded Data is Url Safe and satisfies the regular expression `^[A-Za-z0-9\-_]+$`. 

## Getting Started

    $ npm i --save secure-chest

## Implementation Details

### Security

