import chai from 'chai';
import Context, { CONTEXT_VALUE_ADDED, CONTEXT_VALUE_CHANGED } from '../context.js';
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
