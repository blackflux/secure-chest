const expect = require('chai').expect;
const { describe } = require('node-tdd');
const errors = require('../src/errors');

const errorNames = Object.keys(errors);

describe('Testing Chester Errors', () => {
  const validateError = (error, message) => {
    expect(error).to.have.property('message').and.equal(message);
    expect(String(error)).to.equal(`${error.name}: ${message}`);
  };

  it('Default Constructor', () => {
    errorNames.forEach((errorName) => {
      const error = new errors[errorName]();
      validateError(error, '');
    });
  });

  it('Message Passed to Constructor', () => {
    errorNames.forEach((errorName) => {
      const errorMessage = "It's by design!";
      const error = new errors[errorName](errorMessage);
      validateError(error, errorMessage);
    });
  });
});
