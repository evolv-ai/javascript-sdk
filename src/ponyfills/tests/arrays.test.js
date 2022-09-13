import chai from 'chai';
import { fromArray } from '../arrays.js';


const { expect } = chai;

describe('fromArray()', () => {
	it('should pass through an array', () => {
		// Arrange
		const items = [1, 2, 3];

		// Act
		const arr = fromArray(items);

		// Assert
		expect(arr).to.be.a.instanceOf(Array);
		expect(arr).to.eql(items);
	});

	it('should convert a Map to an array', () => {
		// Arrange
		const map = new Map([['a', 1], ['b', 2], ['c', 3]]);

		// Act
		const arr = fromArray(map);

		// Assert
		expect(arr).to.be.a.instanceOf(Array);
		expect(arr).to.eql([['a', 1], ['b', 2], ['c', 3]]);
	});

	it('should convert a Set to an array', () => {
		// Arrange
		const map = new Set([1, 2, 3]);

		// Act
		const arr = fromArray(map);

		// Assert
		expect(arr).to.be.a.instanceOf(Array);
		expect(arr).to.eql([1, 2, 3]);
	});
});
