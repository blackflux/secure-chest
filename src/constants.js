// @flow
const GZIP_MODE = Object.freeze({
  auto: 'auto',
  force: 'force',
  never: 'never'
});
module.exports.GZIP_MODE = GZIP_MODE;

const ENCODING = Object.freeze({
  utf8: 'utf8',
  ascii: 'ascii',
  latin1: 'latin1',
  binary: 'binary'
});
module.exports.ENCODING = ENCODING;
