const expect = require('chai').expect;
const errors = require('./../src/errors');

const errorNames = Object.keys(errors);

describe('Testing Chester Errors', () => {
  const validateError = (error, expectedMessage) => {
    expect(error).to.have.property('message').and.equal(expectedMessage);
    expect(JSON.stringify(error)).to.equal(`{"message":"${expectedMessage}"}`);
  };

  it('Default Constructor', () => {
    errorNames.forEach((errorName) => {
      const error = new errors[errorName]();
      validateError(error, errorName);
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
