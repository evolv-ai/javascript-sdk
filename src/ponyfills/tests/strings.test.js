import chai from 'chai';
import * as strings from '../strings.js';

const { expect } = chai;

describe('strings', () => {
	describe('endsWith', () => {
		it('should match strings endings', () => {
			expect(strings.endsWith('A String Example', 'ple')).to.be.equal(true);
			expect(strings.endsWith('A String Example', 'pl')).to.be.equal(false);
			expect(strings.endsWith('A String Example', 'ple', 15)).to.be.equal(false);
			expect(strings.endsWith('A String Example', 'pl', 15)).to.be.equal(true);
		});

		it('should match strings endings - if no existing endsWith with method', () => {
			var string = 'A String Example';
			var fakeString = {
				substring: string.substring.bind(string),
				length: string.length
			};

			expect(strings.endsWith(fakeString, 'ple')).to.be.equal(true);
			expect(strings.endsWith(fakeString, 'pl')).to.be.equal(false);
			expect(strings.endsWith(fakeString, 'ple', 15)).to.be.equal(false);
			expect(strings.endsWith(fakeString, 'pl', 15)).to.be.equal(true);
		});
	});

	describe('startsWith', () => {
		it('should match strings beginnings', () => {
			expect(strings.startsWith('A String Example', 'A Strin')).to.be.equal(true);
			expect(strings.startsWith('A String Example', 'Strin')).to.be.equal(false);
			expect(strings.startsWith('A String Example', 'A Strin', 2)).to.be.equal(false);
			expect(strings.startsWith('A String Example', 'Strin', 2)).to.be.equal(true);
		});

		it('should match strings endings - if no existing endsWith with method', () => {
			var string = 'A String Example';
			var fakeString = {
				substring: string.substring.bind(string),
				length: string.length
			};

			expect(strings.startsWith(fakeString, 'A Strin')).to.be.equal(true);
			expect(strings.startsWith(fakeString, 'Strin')).to.be.equal(false);
			expect(strings.startsWith(fakeString, 'A Strin', 2)).to.be.equal(false);
			expect(strings.startsWith(fakeString, 'Strin', 2)).to.be.equal(true);
		});
	});
});
