const expect = require('chai').expect;
const errors = require('./../src/errors');

const errorNames = Object.keys(errors);

describe('Testing Chester Errors', () => {
  it('Default Constructor', () => {
    errorNames.forEach((errorName) => {
      const error = new errors[errorName]();
      expect(error).to.have.property('message').and.equal(errorName);
      expect(JSON.stringify(error)).to.equal(`{"message":"${errorName}"}`);
    });
  });

  it('Message Passed to Constructor', () => {
    errorNames.forEach((errorName) => {
      const error = new errors[errorName]("It's by design!");
      expect(error).to.have.property('message').and.equal("It's by design!");
      expect(JSON.stringify(error)).to.equal('{"message":"It\'s by design!"}');
    });
  });
});
