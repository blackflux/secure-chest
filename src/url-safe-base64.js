const encode = input => input
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=*$/, m => m.length.toString());
module.exports.encode = encode;

const decode = input => Buffer.from(input
  .replace(/[012]$/, m => '='.repeat(parseInt(m, 10)))
  .replace(/_/g, '/')
  .replace(/-/g, '+'), 'base64');
module.exports.decode = decode;
