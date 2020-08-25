import chai from 'chai';
import Context from '../context.js';
import Store from '../store.js';

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

  describe('update', () => {
    const options = {
      version: 1,
      environment: 'test',
      endpoint: 'https://participants.test.evolv.ai/'
    }
    let store;
    let context;
    beforeEach(() => {
      store = new Store(options);
      context = new Context(store);
      context.initialize('test', 'test', {}, {});
    });

    it('should call clearActiveKeys if object is empty', () => {
      // this functionality will be deprecated when that happens remove me
      let clearActiveKeysCalled = false;
      store.clearActiveKeys = (activeKeys, prefix) => {
        clearActiveKeysCalled = true;
      }

      context.update({});

      expect(clearActiveKeysCalled).to.be.true;
    });

    it('should not call clearActiveKeys if object is not empty', () => {
      // this functionality will be deprecated when that happens remove me
      let clearActiveKeysCalled = false;
      store.clearActiveKeys = (activeKeys, prefix) => {
        clearActiveKeysCalled = true;
      }

      context.update({ test: true });

      expect(clearActiveKeysCalled).to.be.false;
    });
  });
});
