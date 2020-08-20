import assert from 'assert';
import chai from 'chai';

const { expect } = chai;

import Context from '../context.js';
import { evaluatePredicates, setActiveAndEntryKeyStates } from '../store.js';

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

  describe('setActiveAndEntryKeyStates', () => {
    it('frazer test', () => {
      const config = {
        "_published": 1597878596.6255178,
        "_client": {
          "browser": "chrome",
          "device": "desktop",
          "location": "US",
          "platform": "macos"
        },
        "_experiments": [{
          "web": {
            "dependencies": "\n",
            "2nsqubits": {
              "_is_entry_point": true,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL2luZGV4XC5odG1sKD86JHxcP3wjKS9p"
                }]
              }
            },
            "fiddrbo15": {
              "_is_entry_point": false,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL3Byb2R1Y3RcLmh0bWwoPzokfFw/fCMpL2k="
                }]
              }
            },
            "ooycjnptz": {
              "_is_entry_point": false,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL3ByaWNpbmdcLmh0bWwoPzokfFw/fCMpL2k="
                }]
              }
            },
            "nt1g7tbs2": {
              "_is_entry_point": false,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL2NoZWNrb3V0XC5odG1sKD86JHxcP3wjKS9p"
                }]
              }
            }
          },
          "_predicate": {},
          "id": "60f67d8648",
          "_paused": false
        }, {
          "web": {
            "dependencies": "\n",
            "2nshubits": {
              "_is_entry_point": true,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL2luZGV4XC5odG1sKD86JHxcP3wjKS9p"
                }]
              }
            },
            "fidcrbo15": {
              "_is_entry_point": false,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL3Byb2R1Y3RcLmh0bWwoPzokfFw/fCMpL2k="
                }]
              }
            },
            "ooycjpptz": {
              "_is_entry_point": false,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL3ByaWNpbmdcLmh0bWwoPzokfFw/fCMpL2k="
                }]
              }
            },
            "nt1g7tfs2": {
              "_is_entry_point": false,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL2NoZWNrb3V0XC5odG1sKD86JHxcP3wjKS9p"
                }]
              }
            }
          },
          "_predicate": {
            "id": 1,
            "combinator": "and",
            "rules": [{
              "field": "device",
              "operator": "equal",
              "value": "mobile"
            }]
          },
          "id": "64928df20a",
          "_paused": false
        }]
      }
      const context = new Context();
      context.initialize(123, 321, {
        web: {
          url: 'https://test.site.com/index.html'
        }
      });
      const configKeyStates = new Map();
      const genomeConfigKeyStates = { loaded: new Set(["web","web.2nsqubits","web.2nsqubits.p99utjadn","web.2nsqubits.p99utjadn.id","web.2nsqubits.p99utjadn.type","web.2nsqubits.p99utjadn.script","web.2nsqubits.p99utjadn.styles","web.2nsqubits.u4mehfi0j","web.2nsqubits.u4mehfi0j.type","web.fiddrbo15","web.fiddrbo15.ma3mr8iy6","web.fiddrbo15.ma3mr8iy6.type","web.ooycjnptz","web.ooycjnptz.lo7yrjkkg","web.ooycjnptz.lo7yrjkkg.type","web.nt1g7tbs2","web.nt1g7tbs2.vzyq1yz56","web.nt1g7tbs2.vzyq1yz56.type","web.2nshubits","web.2nshubits.p89utjadn","web.2nshubits.p89utjadn.id","web.2nshubits.p89utjadn.type","web.2nshubits.p89utjadn.script","web.2nshubits.p89utjadn.styles","web.2nshubits.u4nehfi0j","web.2nshubits.u4nehfi0j.type","web.fidcrbo15","web.fidcrbo15.ma9mr8iy6","web.fidcrbo15.ma9mr8iy6.type","web.ooycjpptz","web.ooycjpptz.lo7yrjkkg","web.ooycjpptz.lo7yrjkkg.type","web.nt1g7tfs2","web.nt1g7tfs2.vzyq1yz56","web.nt1g7tfs2.vzyq1yz56.type"]) };

      const result = setActiveAndEntryKeyStates(1, context, config, configKeyStates, genomeConfigKeyStates)

      console.log(result);
    });
  });
});
