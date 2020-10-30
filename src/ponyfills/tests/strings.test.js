import chai from 'chai';
import * as strings from '../strings.js';

const { expect } = chai;

describe('strings', () => {
  describe('hashCode', () => {
    const string1 = JSON.stringify({
      id: 123,
      type: 'hybrid',
      disabled: false,
      value: 'console.log("HELLO")'
    })
    const string2 = JSON.stringify({
      id: 123,
      type: 'hybrid',
      disabled: false,
      value: 'console.log("HI")'
    })

    it('should produce a consistant hash for a stringified JSON object', () => {
      const value = strings.hashCode(string1)

      expect(value).to.be.equal(1414479601)
    });

    it('should produce a different hash for two different stringified JSON objects', () => {
      const value1 = strings.hashCode(string1)
      const value2 = strings.hashCode(string2)

      expect(value1).to.not.be.equal(value2)
      expect(value1).to.be.equal(1414479601)
      expect(value2).to.be.equal(1283140696)
    });
  })
})
