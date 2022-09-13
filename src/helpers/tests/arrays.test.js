import chai from 'chai';
import * as arrays from '../arrays.js';

const { expect } = chai;

describe('arrays', () => {
	describe('arraysEqual', () => {
		it('should correctly identify equal arrays', () => {
			const arrA = [1, 2, 3];
			const arrB = [1, 2, 3];

			const result = arrays.arraysEqual(arrA, arrB)

			expect(result).to.be.true;
		});

		it('should correctly identify unequal arrays', () => {
			const arrA = [1, 2, 3];
			const arrB = [4, 5, 6];

			const result = arrays.arraysEqual(arrA, arrB)

			expect(result).to.be.false;
		});
	})
});

