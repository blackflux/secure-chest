// @flow
// eslint-disable-next-line import/no-extraneous-dependencies
const gardener = require('js-gardener');

if (require.main === module) {
  gardener({
    author: 'Lukas Siemon',
    eslint: {
      rules: { 'flow-enforce': 1 }
    },
    ci: ['circle']
  }).catch(() => process.exit(1));
}
