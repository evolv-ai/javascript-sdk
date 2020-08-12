import chai from 'chai';
import * as arrays from '../arrays.js';

const { expect } = chai;

describe('arrays', () => {
  describe('from', () => {
    it('Should turn a set object to an array', () => {
      const set = new Set([1,2,3,3,4,5]);

      const result = arrays.from(set);

      expect(result).to.eql([1,2,3,4,5]);
    });
  });
});
