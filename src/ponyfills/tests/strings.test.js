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
  });

  describe('endsWith', () => {
    it('should match strings endings', () => {
      expect(strings.endsWith('A String Example', 'ple')).to.be.equal(true);
      expect(strings.endsWith('A String Example', 'pl')).to.be.equal(false);
      expect(strings.endsWith('A String Example', 'ple', 15)).to.be.equal(false);
      expect(strings.endsWith('A String Example', 'pl', 15)).to.be.equal(true);
    });

    it('should match strings endings - if no existing endsWith with method', () => {
      var string = 'A String Example';
      var fakeString = {
        substring: string.substring.bind(string),
        length: string.length
      };

      expect(strings.endsWith(fakeString, 'ple')).to.be.equal(true);
      expect(strings.endsWith(fakeString, 'pl')).to.be.equal(false);
      expect(strings.endsWith(fakeString, 'ple', 15)).to.be.equal(false);
      expect(strings.endsWith(fakeString, 'pl', 15)).to.be.equal(true);
    });
  });

  describe('startsWith', () => {
    it('should match strings beginnings', () => {
      expect(strings.startsWith('A String Example', 'A Strin')).to.be.equal(true);
      expect(strings.startsWith('A String Example', 'Strin')).to.be.equal(false);
      expect(strings.startsWith('A String Example', 'A Strin', 2)).to.be.equal(false);
      expect(strings.startsWith('A String Example', 'Strin', 2)).to.be.equal(true);
    });

    it('should match strings endings - if no existing endsWith with method', () => {
      var string = 'A String Example';
      var fakeString = {
        substring: string.substring.bind(string),
        length: string.length
      };

      expect(strings.startsWith(fakeString, 'A Strin')).to.be.equal(true);
      expect(strings.startsWith(fakeString, 'Strin')).to.be.equal(false);
      expect(strings.startsWith(fakeString, 'A Strin', 2)).to.be.equal(false);
      expect(strings.startsWith(fakeString, 'Strin', 2)).to.be.equal(true);
    });
  });
});
