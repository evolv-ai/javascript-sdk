import chai from 'chai';
import { copySet } from '../set-utils.js';


const { expect } = chai;

describe('Set Utils', () => {
	let A;
	let B;

	beforeEach(() => {
		A = new Set(['a', 'b', 'c', 'd']);
		B = new Set(['c', 'd', 'e', 'f']);
	});

	describe('setCopy()', () => {
    it('should copy set A into new set', () => {
      // Act
      const copy = copySet(A);

      // Assert
      expect(copy).to.deep.equal(new Set(['a', 'b', 'c', 'd']));
    });

    it('should copy set A into set B', () => {
      // Act
      const copy = copySet(A, B);

      // Assert
      expect(copy).to.deep.equal(new Set(['a', 'b', 'c', 'd', 'e', 'f']));
    });

    it('should array into new set', () => {
      // Act
      const copy = copySet(['a', 'b']);

      // Assert
      expect(copy).to.deep.equal(new Set(['a', 'b']));
    });
  });
});
