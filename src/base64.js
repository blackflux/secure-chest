export const toUrlSafeBase64 = (input) => input
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=*$/, (m) => m.length.toString());

export const fromUrlSafeBase64 = (input) => Buffer.from(input
  .replace(/[012]$/, (m) => '='.repeat(parseInt(m, 10)))
  .replace(/_/g, '/')
  .replace(/-/g, '+'), 'base64');
