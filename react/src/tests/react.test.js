import {useVariable, useIsActive, useConfigVariable} from '../index.js';
import {act, renderHook} from '@testing-library/react-hooks';

import chai from 'chai';
import spies from 'chai-spies';

chai.use(spies);
const expect = chai.expect;

const createCancellableListen = function () {
  const cancellableListener = (listener) => {
    cancellableListener.listener = listener;

    return function() {
      cancellableListener.cancelled = true;
    };
  };
  return {
    listen: cancellableListener
  };
};

let cancellableListeners = [];

const mockClient = {
  get: (key) => {
    const result = createCancellableListen();
    cancellableListeners.push({key, result});
    return result;
  },
  getConfig: (key) => {
    const result = createCancellableListen();
    cancellableListeners.push({key, result});
    return result;
  },
  isActive: (key) => {
    const result = createCancellableListen();
    cancellableListeners.push({key, result});
    return result;
  },
};

describe('Evolv React Wrapper', () => {
  before(() => {
    if (!global.evolv) {
      global.evolv = {};
    }

    global.evolv.client = mockClient;
  });

  beforeEach(() => {
    cancellableListeners = [];
  });

  describe('useVariable', () => {
    it('should return the value of the variable', (done) => {
      const key = 'test';
      const firstValue = 'first';
      const secondValue = 'second';
      const {result} = renderHook(() => useVariable(key, firstValue));
      expect(result.current).to.equal(firstValue);
      setTimeout(() => {
        expect(cancellableListeners[0].key).to.equal(key);
        act(() => {
          cancellableListeners[0].result.listen.listener(secondValue);
        });
        expect(result.current).to.equal(secondValue);

        done();
      }, 0);
    });
  });

  describe('useIsActive', () => {
    it('should state of the key', (done) => {
      const key = 'test';
      const firstValue = true;
      const secondValue = false;
      const {result} = renderHook(() => useIsActive(key, firstValue));
      expect(result.current).to.equal(firstValue);
      setTimeout(() => {
        expect(cancellableListeners[0].key).to.equal(key);
        act(() => {
          cancellableListeners[0].result.listen.listener(secondValue);
        });
        expect(result.current).to.equal(secondValue);

        done();
      }, 0);
    });
  });

  describe('useConfigVariable', () => {
    it('should return the value of the config variable', (done) => {
      const key = 'test';
      const firstValue = 'first';
      const secondValue = 'second';
      const {result} = renderHook(() => useConfigVariable(key, firstValue));
      expect(result.current).to.equal(firstValue);
      setTimeout(() => {
        expect(cancellableListeners[0].key).to.equal(key);
        act(() => {
          cancellableListeners[0].result.listen.listener(secondValue);
        });
        expect(result.current).to.equal(secondValue);

        done();
      }, 0);
    });
  });
});
