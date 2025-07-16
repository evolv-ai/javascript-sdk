import chai from 'chai';
import Context, { CONTEXT_VALUE_ADDED, CONTEXT_VALUE_CHANGED, STORAGE_TYPE_USER, STORAGE_TYPE_SESSION, STORAGE_TYPE_NONE } from '../context.js';
import Store from '../store.js';
import { waitFor } from '../waitforit.js';

const { expect } = chai;

describe('context', () => {
  describe('pushToArray', () => {
    let context;
    beforeEach(() => {
      context = new Context();
      context.initialize('test', {}, {});
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

  describe('persistence', () => {
    let context;
    beforeEach(() => {
      context = new Context();
      context.initialize('test-persistence', {}, {});
      // Clear any existing stored data
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    });

    it('should configure persistence for a key', () => {
      expect(() => context.setPersistence('user.preference', STORAGE_TYPE_USER)).to.not.throw();
      expect(() => context.setPersistence('session.data', STORAGE_TYPE_SESSION)).to.not.throw();
      expect(() => context.setPersistence('temp.data', STORAGE_TYPE_NONE)).to.not.throw();
    });

    it('should throw error for invalid key', () => {
      expect(() => context.setPersistence('', STORAGE_TYPE_USER)).to.throw('Evolv: Key must be a non-empty string');
      expect(() => context.setPersistence(null, STORAGE_TYPE_USER)).to.throw('Evolv: Key must be a non-empty string');
    });

    it('should throw error for invalid storage type', () => {
      expect(() => context.setPersistence('test.key', 'invalid')).to.throw('Evolv: Storage type must be "user", "session", or "none"');
    });

    it('should save and retrieve data with persistence disabled by default', () => {
      context.set('test.key', 'test-value');
      expect(context.get('test.key')).to.equal('test-value');

      // Create new context instance to simulate page reload
      const newContext = new Context();
      newContext.initialize('test-persistence', {}, {});
      expect(newContext.get('test.key')).to.be.undefined;
    });

    // Note: These tests would work in a browser environment with localStorage/sessionStorage
    // In Node.js test environment, they will just verify the API works without throwing errors
    it('should handle storage operations gracefully in non-browser environment', () => {
      expect(() => {
        context.setPersistence('user.data', STORAGE_TYPE_USER);
        context.set('user.data', { id: 123, name: 'Test User' });
      }).to.not.throw();

      expect(() => {
        context.setPersistence('session.data', STORAGE_TYPE_SESSION);
        context.set('session.data', [1, 2, 3]);
      }).to.not.throw();
    });

    it('should remove persistence configuration when set to none', () => {
      context.setPersistence('test.key', STORAGE_TYPE_USER);
      context.set('test.key', 'value');

      // Remove persistence
      context.setPersistence('test.key', STORAGE_TYPE_NONE);

      // This should work without throwing errors
      expect(context.get('test.key')).to.equal('value');
    });

        it('should persist local context values and restore them to local context', () => {
      context.setPersistence('local.key', STORAGE_TYPE_USER);
      context.set('local.key', 'local-value', true); // Set as local

      expect(context.get('local.key')).to.equal('local-value');

      // Verify the value was persisted and can be restored to local context
      // In a browser environment, this would actually work with localStorage
      // In Node.js, we just verify the API works without throwing errors
             expect(() => {
         const newContext = new Context();
         newContext.setPersistence('local.key', STORAGE_TYPE_USER);
         newContext.initialize('test-persistence', {}, {});
       }).to.not.throw();
     });

     it('should restore local and remote values to correct contexts with mock storage', () => {
       // Mock localStorage for this test
       const mockStorage = {};
       const originalLocalStorage = global.localStorage;

       global.localStorage = {
         setItem: (key, value) => { mockStorage[key] = value; },
         getItem: (key) => mockStorage[key] || null,
         removeItem: (key) => { delete mockStorage[key]; },
         clear: () => { for (let key in mockStorage) delete mockStorage[key]; }
       };

       try {
         const ctx1 = new Context();
         ctx1.initialize('test-user', {}, {});

         // Configure persistence for both local and remote values
         ctx1.setPersistence('remote.value', STORAGE_TYPE_USER);
         ctx1.setPersistence('local.value', STORAGE_TYPE_USER);

                           // Set values in different contexts
         ctx1.set('remote.value', 'remote-data', false); // remote context
         ctx1.set('local.value', 'local-data', true);    // local context

         // Create new context to simulate page reload
         const ctx2 = new Context();
         ctx2.setPersistence('remote.value', STORAGE_TYPE_USER);
         ctx2.setPersistence('local.value', STORAGE_TYPE_USER);
         ctx2.initialize('test-user', {}, {});

         // Verify values are restored to correct contexts
         expect(ctx2.get('remote.value')).to.equal('remote-data');
         expect(ctx2.get('local.value')).to.equal('local-data');

                  // Verify they're in the correct underlying contexts
         expect(ctx2.remoteContext.remote.value).to.equal('remote-data');
         expect(ctx2.localContext.local.value).to.equal('local-data');

         // Local value should not be in remote context and vice versa
         expect(ctx2.remoteContext.local).to.be.undefined;
         expect(ctx2.localContext.remote).to.be.undefined;

       } finally {
         // Restore original localStorage
         global.localStorage = originalLocalStorage;
       }
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
      context.initialize('test', {}, {});
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

    it('should emit CONTEXT_VALUE_ADDED when key is added to context', (done) => {
      waitFor(context, CONTEXT_VALUE_ADDED, (type, key, value, local) => {
        try {
          expect(type).to.be.equal(CONTEXT_VALUE_ADDED);
          expect(key).to.be.equal('test');
          expect(value).to.be.equal(true);
          done();
        } catch (err) {
          done(err);
        }
      });

      context.update({ test: true })
    });

    it('should emit CONTEXT_VALUE_ADDED when nested key is added to context', (done) => {
      waitFor(context, CONTEXT_VALUE_ADDED, (type, key, value, local) => {
        try {
          expect(type).to.be.equal(CONTEXT_VALUE_ADDED);
          expect(key).to.be.equal('test.boolean');
          expect(value).to.be.equal(true);
          done();
        } catch (err) {
          done(err);
        }
      });

      context.update(
        {
          test: {
            boolean: true
          }
        }
      )
    });

    it('should emit CONTEXT_VALUE_CHANGED when key is updated in context', (done) => {
      context.set('test', true);

      waitFor(context, CONTEXT_VALUE_CHANGED, (type, key, value, local) => {
        try {
          expect(type).to.be.equal(CONTEXT_VALUE_CHANGED);
          expect(key).to.be.equal('test');
          expect(value).to.be.equal(false);
          done();
        } catch (err) {
          done(err);
        }
      });

      context.update({ test: false })
    });
  });
});
