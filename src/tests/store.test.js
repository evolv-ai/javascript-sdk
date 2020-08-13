import assert from 'assert';
import chai from 'chai';

const { expect } = chai;

import base64 from '../ponyfills/base64.js';

import Context from '../context.js';
import Store, { evaluatePredicates, getActiveAndEntryConfigKeyStates } from '../store.js';

describe('store.js', () => {
  describe('evaluatePredicates', () => {
  	it('should not throw error when properties are not objects', () => {
  	  // Arrange
      const config = {
        _published: 1584475383.3865728,
        _experiments: [{
          id: '0f39849197',
          web: {
            dependencies: 'function() {}',
            count: 1,
            choice: true,
            none: null
          }
        }]
      };

      // Act
      const context = new Context();
      context.initialize(123, 321, {});

      assert.doesNotThrow(() => {
        evaluatePredicates(2, context, config);
      });
    });

    it('should reject all keys if the context doesn\'t satisfy the experiment level predicate', () => {
      const config = {
        "_published": 1584475383.3865728,
        "_experiments": [{
          "web": {
            "ab8numq2j": {
              "_is_entry_point": true,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2luZGV4XC5odG1sKD86JHxcP3wjKS9p"
                }]
              }
            },
            "7w3zpgfy9": {
              "_is_entry_point": false,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2ZlYXR1cmVzXC5odG1sKD86JHxcP3wjKS9p"
                }]
              }
            }
          },
          "id": "0f39849197",
          "_predicate": {
            "combinator": "and",
            "rules": [{
              "field": "location.country",
              "operator": "equal",
              "value": "usa"
            }]
          }
        }]
      };

      const remoteContext = {
        web: {
          url: 'http://happy/'
        },
        location: {
          country: 'uk'
        }
      };
      const context = new Context();
      context.initialize(123, 321, remoteContext);
      let rejected = evaluatePredicates(2, context, config);
      assert.ok(rejected['0f39849197'].disabled[0] === '', 'all keys should have been rejected');
      assert.ok(!rejected['0f39849197'].entry.length, 'No entry keys should have been found');
    });

    it('should reject all keys if the context fails to meet the predicates', () => {
      const config = {
        "_published": 1584475383.3865728,
        "_experiments": [{
          "web": {
            "ab8numq2j": {
              "_is_entry_point": true,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2luZGV4XC5odG1sKD86JHxcP3wjKS9p"
                }]
              }
            },
            "7w3zpgfy9": {
              "_is_entry_point": false,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2ZlYXR1cmVzXC5odG1sKD86JHxcP3wjKS9p"
                }]
              }
            }
          },
          "id": "0f39849197",
          "_predicate": {
            "combinator": "and",
            "rules": [{
              "field": "location.country",
              "operator": "equal",
              "value": "usa"
            }]
          }
        }]
      };

      const remoteContext = {
        web: {
          url: 'http://happy/'
        },
        location: {
          country: 'usa'
        }
      };
      const context = new Context();
      context.initialize(123, 321, remoteContext);
      let rejected = evaluatePredicates(2, context, config);
      assert.ok(rejected['0f39849197'].disabled[0] === 'web.ab8numq2j', 'web.ab8numq2j should have been rejected');
      assert.ok(rejected['0f39849197'].disabled[1] === 'web.7w3zpgfy9', 'web.7w3zpgfy9 should have been rejected');
      assert.ok(!rejected['0f39849197'].entry.length, 'No entry keys should have been found');
    });

    it('should only disable the keys where the context doesn\'t satisfy the predicate', () => {
      const config = {
        "_published": 1584475383.3865728,
        "_experiments": [{
          "web": {
            "ab8numq2j": {
              "_is_entry_point": true,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2luZGV4XC5odG1sKD86JHxcP3wjKS9p"
                }]
              }
            },
            "7w3zpgfy9": {
              "_is_entry_point": false,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2ZlYXR1cmVzXC5odG1sKD86JHxcP3wjKS9p"
                }]
              }
            }
          },
          "id": "0f39849197",
          "_predicate": {
            "combinator": "and",
            "rules": [{
              "field": "location.country",
              "operator": "equal",
              "value": "usa"
            }]
          }
        }]
      };

      const remoteContext = {
        web: {
          url: 'http://happy/dev1/features.html'
        },
        location: {
          country: 'usa'
        }
      };
      const context = new Context();
      context.initialize(123, 321, remoteContext);
      let rejected = evaluatePredicates(2, context, config);
      assert.ok(rejected['0f39849197'].disabled[0] === 'web.ab8numq2j', 'web.ab8numq2j should have been rejected');
      assert.ok(!rejected['0f39849197'].entry.length, 'No entry keys should have been found');
    });
  });

  describe('getActiveAndEntryConfigKeyStates', () => {
    it('should not add key if the key starts with strings in disabled array', () => {

      const loadedKeyStates = new Set([
        "web", 
        "web.cwj1t5d3r", 
        "web.cwj1t5d3r.3niwqixti", 
        "web.cwj1t5d3r.3niwqixti.id", 
        "web.cwj1t5d3r.3niwqixti.type",
        "web.cwj1t5d3r.3niwqixti.script",
        "web.cwj1t5d3r.3niwqixti.styles",
        "web.20o82m2i2",
        "web.20o82m2i2.i5vha3r5s",
        "web.20o82m2i2.i5vha3r5s.id",
        "web.20o82m2i2.i5vha3r5s.type",
        "web.20o82m2i2.i5vha3r5s.script",
        "web.20o82m2i2.i5vha3r5s.styles",
        "web.234234gdfg.sdfsdf"
      ])

      const results = {
        '10179f895b': {
          disabled: ['web.cwj1t5d3r'],
          entry: []
        }, 
        'e33daae52a': {
          disabled: [
            'web.20o82m2i2'
          ],
          entry: []
        },
        'whdjksjd': {
          disabled: [
            'web.234234gdfg'
          ],
          entry: []
        }
      };

      const keys = getActiveAndEntryConfigKeyStates(results, loadedKeyStates);
      expect(keys).to.deep.equal({ active: ['web'], entry: [] });
    })
  })
});
