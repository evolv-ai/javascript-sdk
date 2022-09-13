import chai from 'chai';
import spies from 'chai-spies';

import Beacon, { RETRIES } from '../beacon.js';

chai.use(spies);
const expect = chai.expect;
describe('beacon', () => {
	const endpointV2 = 'https://participants-frazer.evolv.ai/v2';
	beforeEach(() => {
		global.windowRef = global.window
	})
	afterEach(() => {
		global.window = global.windowRef
	})

	it('emit without infinite loop', (done) => {
		console.log('test start')
		global.window = { addEventListener: () => null, navigator: { sendBeacon: () => false } };
		const beacon = new Beacon(endpointV2, { uid: '' }, '');
		let spy = chai.spy.on(console, 'error')

		beacon.emit('error', '{msg', true)
		beacon.emit('error', '{msg', true)
		beacon.emit('error', '{msg', true)
		beacon.emit('error', '{msg', true)
		beacon.emit('error', '{msg', true)
		beacon.emit('error', '{msg', true)
		beacon.emit('error', '{msg', true)
		beacon.emit('error', '{msg', true)
		beacon.emit('error', '{msg', true)

		setTimeout(() => {
			const firstState = 9 + RETRIES - 1
			expect(spy).to.have.been.called(firstState);

			beacon.emit('error', '{msg', true)
			beacon.emit('error', '{msg', true)
			beacon.emit('error', '{msg', true)
			beacon.emit('error', '{msg', true)

			setTimeout(() => {
				const secondState = firstState + 4 + RETRIES - 1
				expect(spy).to.have.been.called(secondState);
				done()
			}, 500)
		}, 500)

	});
});
