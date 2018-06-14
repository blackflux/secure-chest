// @flow
const GZIP_MODE = Object.freeze({
  AUTO: 'AUTO',
  FORCE: 'FORCE',
  NEVER: 'NEVER'
});
module.exports.GZIP_MODE = GZIP_MODE;

const ENCODING = Object.freeze({
  utf8: 'utf8',
  ascii: 'ascii',
  latin1: 'latin1',
  binary: 'binary'
});
module.exports.ENCODING = ENCODING;
