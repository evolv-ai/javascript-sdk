import chai from 'chai';
import Context from '../context.js';

const { expect } = chai;

describe('context', () => {
  describe('pushToArray', () => {
    let context;
    beforeEach(() => {
      context = new Context();
      context.initialize('test', 'test', {}, {});
    });

    it('Should create an array if none', () => {
      expect(context.get('my.values')).to.be.undefined;

      context.pushToArray('my.values', 1);

      expect(context.get('my.values')).to.eql([1]);
    });

    it('Should respect limit and act as a FIFO queue', () => {
      expect(context.get('my.values')).to.be.undefined;
      const limit = 2;

      context.pushToArray('my.values', 1, false, limit);
      context.pushToArray('my.values', 2, false, limit);
      context.pushToArray('my.values', 3, false, limit);

      const result = context.get('my.values');
      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.be.equal(2);
      expect(result[1]).to.be.equal(3);
    });
  });
});
