import chai from 'chai';
import * as objects from '../objects.js';

const { expect } = chai;

describe('objects', () => {
  describe('isObject', () => {
    it('Should correctly identify objects and not hit false positives', () => {
      expect(objects.isObject(1)).to.be.false;
      expect(objects.isObject(0)).to.be.false;
      expect(objects.isObject(null)).to.be.false;
      expect(objects.isObject(undefined)).to.be.false;
      expect(objects.isObject('object')).to.be.false;
      expect(objects.isObject([])).to.be.false;
      expect(objects.isObject(true)).to.be.false;
      expect(objects.isObject(false)).to.be.false;

      expect(objects.isObject({})).to.be.true;
      expect(objects.isObject({testing: true})).to.be.true;
    });
  });

  describe('flatten', () => {
    it('Should correctly flatten the object', () => {
      let testValue = {
        level1: {
          level2: {
            level3: {
              value0: false,
            },
            value1: 1,
          }
        },
        value2: 'value2'
      };

      let result = objects.flatten(testValue);

      expect(Object.keys(result)).to.have.lengthOf(3);
      expect(result['level1.level2.level3.value0']).to.equal(false);
      expect(result['level1.level2.value1']).to.equal(1);
      expect(result['value2']).to.equal('value2');
    });
  });

  describe('expand', () => {
    it('Should correctly expand a flattened object', () => {
      let testValue = {
        'level1.level2.level3.value0': false,
        'level1.level2.value1': 1,
        'value2': 'value2'
      };

      let result = objects.expand(testValue);

      expect(Object.keys(result)).to.have.lengthOf(2);
      expect(result.level1.level2.level3.value0).to.equal(false);
      expect(result.level1.level2.value1).to.equal(1);
      expect(result.value2).to.equal('value2');
    });
  });

  describe('prune', () => {
    const obj = {
      gods: {
        zeus: {
          strength: 123
        },
        apollo: {
          powers: {
            flight: true
          }
        }
      },
      goddesses: {
        athena: {
          strength: 456
        }
      }
    }
    it('should produce keys and values from object', () => {
      const result = objects.prune(obj, ['gods.zeus', 'gods.apollo', 'goddesses.athena'])

      expect(result).to.be.eql(
        {
          'gods.zeus': {
            strength: 123
          },
          'gods.apollo': {
            powers: {
              flight: true
            }
          },
          'goddesses.athena': {
            strength: 456
          }
        }
      )
    });

    it('should not produce keys and values from object if they dont exist', () => {
      const result = objects.prune(obj, ['titans.cronus'])

      expect(result).to.be.eql({});
    });

    it('should produce some keys and values from object if some dont exist and some do', () => {
      const result = objects.prune(obj, ['titans.cronus', 'goddesses.athena'])

      expect(result).to.be.eql(
        {
          'goddesses.athena': {
            strength: 456
          }
        }
      );
    });
  });

  describe('filter', () => {
    const obj = {
      gods: {
        zeus: {
          strength: 123
        },
        apollo: {
          powers: {
            flight: true
          }
        }
      },
      goddesses: {
        athena: {
          strength: 456
        }
      }
    }

    it('should produce filtered object based upon keys', () => {
      const result = objects.filter(obj, ['gods.zeus', 'goddesses.athena'])

      expect(result).to.be.eql(
        {
          gods: {
            zeus: {
              strength: 123
            }
          },
          goddesses: {
            athena: {
              strength: 456
            }
          }
        }
      );
    });
  })
});
