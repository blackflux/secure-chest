const expect = require('chai').expect;
const errors = require('./../src/errors');

const errorNames = Object.keys(errors);

const validateError = (error, expectedMessage) => {
  expect(error).to.have.property('message').and.equal(expectedMessage);
  expect(JSON.stringify(error)).to.equal(`{"message":"${expectedMessage}"}`);
};

describe('Testing Chester Errors', () => {
  it('Default Constructor', () => {
    errorNames.forEach((errorName) => {
      validateError(new errors[errorName](), errorName);
    });
  });

  it('Message Passed to Constructor', () => {
    errorNames.forEach((errorName) => {
      validateError(new errors[errorName]("It's by design!"), "It's by design!");
    });
  });
});
