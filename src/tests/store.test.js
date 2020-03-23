import assert from 'assert';

import base64 from '../ponyfills/base64.js';

import Context from '../context.js';
import Store, { evaluatePredicates } from '../store.js';

describe('store.js', () => {
  describe('evaluatePredicates', () => {
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
});
