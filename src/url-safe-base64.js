export const encode = (input) => input
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=*$/, (m) => m.length.toString());

export const decode = (input) => Buffer.from(input
  .replace(/[012]$/, (m) => '='.repeat(parseInt(m, 10)))
  .replace(/_/g, '/')
  .replace(/-/g, '+'), 'base64');
