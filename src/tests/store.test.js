import assert from 'assert';
import chai from 'chai';
import _xhrMock from 'xhr-mock';

const { expect } = chai;
const xhrMock = _xhrMock.default;

import Context from '../context.js';
import Store, { expKeyStatesHas, evaluatePredicates, setActiveAndEntryKeyStates, generateEffectiveGenome, setConfigLoadedKeys } from '../store.js';


describe('store.js', () => {
  describe('get()', () => {
    function mockParticipantApi(genome, excludeGenome) {
      const experiment = {
        web: {},
        _predicate: {},
        id: '49afccc9bc',
        _paused: false,
        _optimization_metric: 'VISITOR',
        _include_eid_in_hash: true
      };

      xhrMock.get(/configuration\.json$/, (req, res) => {
        const data = {
          _experiments: [
            Object.entries(genome)
              .reduce((acc, [key]) => {
                acc[key] = {
                  _is_entry_point: false,
                  _predicate: null,
                  _values: true,
                  _initializers: true
                };

                return acc;
              }, experiment)
          ]
        };

        return res.status(200).body(JSON.stringify(data));
      });

      xhrMock.get(/allocations$/, (req, res) => {
        return res.status(200).body(JSON.stringify([
          {
            uid: '1',
            eid: '49afccc9bc',
            cid: 'dfe1a698c486:49afccc9bc',
            genome: excludeGenome ? {} : genome,
            audience_query: {},
            ordinal: 0,
            group_id: '89e674e7-9c2f-4a7d-b2d2-8c5b3e158c73',
            excluded: false
          }
        ]));
      });
    }

    beforeEach(() => {
      xhrMock.setup();
    });

    afterEach(() => {
      xhrMock.teardown();
    });

    it('should return undefined for a key active in config but not present in genome', async () => {
      // Arrange
      mockParticipantApi({ var1: true }, true);

      const context = new Context();
      context.initialize('uid', {});

      // Act
      const store = new Store({ environment: 'env' });
      store.initialize(context);

      // Assert
      // Resolve the delayed promises
      let result = await store.get('var1');
      expect(result).to.be.undefined;

      // Resolve the immediate promises
      result = await store.get('var1');
      expect(result).to.be.undefined;
    });

    it('should return true for true boolean values in genome', async () => {
      // Arrange
      mockParticipantApi({ var1: true });

      const context = new Context();
      context.initialize('uid', {});

      // Act
      const store = new Store({ environment: 'env' });
      store.initialize(context);

      // Assert
      // Resolve the delayed promises
      let result = await store.get('var1');
      expect(result).to.be.true;

      // Resolve the immediate promises
      result = await store.get('var1');
      expect(result).to.be.true;
    });

    it('should not return undefined for false boolean values in genome', async () => {
      // Arrange
      mockParticipantApi({ var1: false });

      const context = new Context();
      context.initialize('uid', {});

      // Act
      const store = new Store({ environment: 'env' });
      store.initialize(context);

      // Assert
      // Resolve the delayed promises
      let result = await store.get('var1');
      expect(result).to.not.undefined;
      expect(result).to.be.false;

      // Resolve the immediate promises
      result = await store.get('var1');
      expect(result).to.not.undefined;
      expect(result).to.be.false;
    });
  });

  describe('expKeyStatesHas', () => {
    let keyStates;
    beforeEach(() =>{
      keyStates = { experiments: new Map([['123', new Map([['loaded', new Set(['jim.horn', 'bob.boe', 'joe.tom'])]])]])}
    });

    it('should properly identify key in key state', () => {
      const result = expKeyStatesHas(keyStates, 'loaded', 'bob.boe');

      expect(result).to.be.true;
    });

    it('should properly identify key not in key state', () => {
      const result = expKeyStatesHas(keyStates, 'loaded', 'billy.bob');

      expect(result).to.be.false;
    });

    it('should properly identify prefix in key state', () => {
      const result = expKeyStatesHas(keyStates, 'loaded', 'jim', true);

      expect(result).to.be.true;
    });

    it('should properly identify prefix not in key state', () => {
      const result = expKeyStatesHas(keyStates, 'loaded', 'julie', true);

      expect(result).to.be.false;
    });
  });

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
      assert.ok(rejected.get('0f39849197').disabled[0] === '', 'all keys should have been rejected');
      assert.ok(!rejected.get('0f39849197').entry.length, 'No entry keys should have been found');
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
      assert.ok(rejected.get('0f39849197').disabled[0] === 'web.ab8numq2j', 'web.ab8numq2j should have been rejected');
      assert.ok(rejected.get('0f39849197').disabled[1] === 'web.7w3zpgfy9', 'web.7w3zpgfy9 should have been rejected');
      assert.ok(!rejected.get('0f39849197').entry.length, 'No entry keys should have been found');
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
      assert.ok(rejected.get('0f39849197').disabled[0] === 'web.ab8numq2j', 'web.ab8numq2j should have been rejected');
      assert.ok(!rejected.get('0f39849197').entry.length, 'No entry keys should have been found');
    });
  });

  describe('setActiveAndEntryKeyStates', () => {
    it('should produce the correct active and entry keys per experiment', () => {
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
              },
              "_initializers": true,
              "p99utjadn": {
                "_values": true
              },
              "u4mehfi0j": {
                "_values": true
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
              },
              "ma3mr8iy6": {
                "_values": true
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
              },
              "lo7yrjkkg": {
                "_values": true
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
              },
              "vzyq1yz56": {
                "_values": true
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
              },
              "p89utjadn": {
                "_values": true
              },
              "u4nehfi0j": {
                "_values": true
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
              },
              "ma9mr8iy6": {
                "_values": true
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
              },
              "lo7yrjkkg": {
                "_values": true
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
              },
              "vzyq1yz56": {
                "_values": true
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
      context = new Context();
      context.initialize(123, 321, {
        web: {
          url: 'https://test.site.com/index.html'
        }
      });

      let allocations;

      const configKeyStates = { experiments: new Map([]) };

      config._experiments.forEach(function(exp) {
        setConfigLoadedKeys(configKeyStates, exp)
      });

      setActiveAndEntryKeyStates(1, context, config, allocations, configKeyStates);
      const result = configKeyStates.experiments;

      expect(result.size).to.be.equal(2);
      expect(result.has('60f67d8648')).to.be.true;
      expect(result.get('60f67d8648').has('active')).to.be.true;
      expect(Array.from(result.get('60f67d8648').get('active'))).to.be.eql(["web.2nsqubits", "web.2nsqubits.p99utjadn","web.2nsqubits.u4mehfi0j"]); // should include context level keys and variant level keys
      expect(result.get('60f67d8648').has('entry')).to.be.true;
      expect(Array.from(result.get('60f67d8648').get('entry'))).to.be.eql(["web.2nsqubits", "web.2nsqubits.p99utjadn", "web.2nsqubits.u4mehfi0j"]); // should include context level keys and variant level keys
      expect(result.has('64928df20a')).to.be.true;
      expect(result.get('64928df20a').has('active')).to.be.true;
      expect(Array.from(result.get('64928df20a').get('active'))).to.be.eql([]);
      expect(result.get('64928df20a').has('entry')).to.be.true;
      expect(Array.from(result.get('64928df20a').get('entry'))).to.be.eql([]);
    });

    it('should produce active keys that are in the config but not in genome', () => {
      const config = {
        "_published": 1598994807.0831175,
        "_client": {
          "browser": "chrome",
          "device": "desktop",
          "location": "US",
          "platform": "macos"
        },
        "_experiments": [{
          "web": {
            "dependencies": "\n",
            "47b7t1xuc": {
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
            "bszvsce8f": {
              "_is_entry_point": true,
              "_predicate": {
                "combinator": "and",
                "rules": [{
                  "field": "web.url",
                  "operator": "regex64_match",
                  "value": "L2h0dHBzPzpcL1wvW14vXStcL3Byb2R1Y3RcLmh0bWwoPzokfFw/fCMpL2k="
                }]
              }
            }
          },
          "_predicate": {},
          "id": "913f49193b",
          "_paused": false
        }]
      }
      const context = new Context();
      context.initialize(123, 321, {
        web: {
          url: 'https://test.site.com/index.html'
        }
      });
      let allocations;
      const configKeyStates = { experiments: new Map([['913f49193b', new Map([['loaded', new Set(["web","web.47b7t1xuc","web.47b7t1xuc.7coo4n5jr","web.47b7t1xuc.7coo4n5jr.id","web.47b7t1xuc.7coo4n5jr.type","web.47b7t1xuc.7coo4n5jr.script","web.47b7t1xuc.7coo4n5jr.styles","web.dependencies","web.bszvsce8f"])]])]]) };

      setActiveAndEntryKeyStates(1, context, config, allocations, configKeyStates);
      const result = configKeyStates.experiments;

      expect(result.size).to.be.equal(1);
      expect(result.has('913f49193b')).to.be.true;
      expect(result.get('913f49193b').has('active')).to.be.true;
      expect(Array.from(result.get('913f49193b').get('active'))).to.be.eql(["web","web.47b7t1xuc","web.47b7t1xuc.7coo4n5jr","web.47b7t1xuc.7coo4n5jr.id","web.47b7t1xuc.7coo4n5jr.type","web.47b7t1xuc.7coo4n5jr.script","web.47b7t1xuc.7coo4n5jr.styles","web.dependencies"]);
      expect(result.get('913f49193b').has('entry')).to.be.true;
      expect(Array.from(result.get('913f49193b').get('entry'))).to.be.eql(["web.47b7t1xuc","web.47b7t1xuc.7coo4n5jr","web.47b7t1xuc.7coo4n5jr.id","web.47b7t1xuc.7coo4n5jr.type","web.47b7t1xuc.7coo4n5jr.script","web.47b7t1xuc.7coo4n5jr.styles"]);
    });
  });

  describe('generateEffectiveGenome', () => {
    let config;
    let genomes;
    let context;
    let configKeyStates;
    let allocations;
    beforeEach(() => {
      config = {
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
              },
              "p99utjadn": {
                "_values": true
              },
              "u4mehfi0j": {
                "_values": true
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
              },
              "ma3mr8iy6": {
                "_values": true
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
              },
              "lo7yrjkkg": {
                "_values": true
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
              },
              "vzyq1yz56": {
                "_values": true
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
              },
              "p89utjadn": {
                "_values": true
              },
              "u4nehfi0j": {
                "_values": true
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
              },
              "ma9mr8iy6": {
                "_values": true
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
              },
              "lo7yrjkkg": {
                "_values": true
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
              },
              "vzyq1yz56": {
                "_values": true
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
        },
          {
            "web": {
              "jo41drmyb": {
                "_is_entry_point": true,
                "_predicate": {
                  "combinator": "and",
                  "rules": [
                    {
                      "field": "web.url",
                      "operator": "regex64_match",
                      "value": "L2h0dHBzPzpcL1wvbmUyY3QuY3NiLmFwcFwvXC8/KD86JHxcP3wjKS9p"
                    }
                  ]
                },
                "_initializers": true
              },
              "zl0f2e2e7": {
                "_is_entry_point": false,
                "_predicate": {
                  "combinator": "and",
                  "rules": [
                    {
                      "field": "web.url",
                      "operator": "regex64_match",
                      "value": "L2h0dHBzPzpcL1wvbmUyY3QuY3NiLmFwcFwvcGFnZTFcLmh0bWxcLz8oPzokfFw/fCMpL2k="
                    }
                  ]
                },
                "7ulgknqr5": {
                  "_values": true
                },
                "_initializers": true
              }
            },
            "_predicate": {},
            "id": "c4154ac833",
            "_paused": false,
            "_optimization_metric": "SESSION",
            "_include_eid_in_hash": true
          }]
      }
      genomes = {
        "60f67d8648": {
          "web": {
            "2nsqubits": {
              "p99utjadn": {
                "id": "tifv3fu1g",
                "type": "compound",
                "script": "",
                "styles": "a#learn.btn.btn-primary.btn-lg {\n  background-color: yellow\n}"
              },
              "u4mehfi0j": {
                "type": "noop"
              }
            },
            "fiddrbo15": {
              "ma3mr8iy6": {
                "type": "noop"
              }
            },
            "ooycjnptz": {
              "lo7yrjkkg": {
                "type": "noop"
              }
            },
            "nt1g7tbs2": {
              "vzyq1yz56": {
                "type": "noop"
              }
            }
          }
        },
        "64928df20a": {
          "web": {
            "2nshubits": {
              "p89utjadn": {
                "id": "tift3fu1g",
                "type": "compound",
                "script": "",
                "styles": "a#learn.btn.btn-primary.btn-lg {\n  background-color: yellow\n}"
              },
              "u4nehfi0j": {
                "type": "noop"
              }
            },
            "fidcrbo15": {
              "ma9mr8iy6": {
                "type": "noop"
              }
            },
            "ooycjpptz": {
              "lo7yrjkkg": {
                "type": "noop"
              }
            },
            "nt1g7tfs2": {
              "vzyq1yz56": {
                "type": "noop"
              }
            }
          }
        }
      }
      context = new Context();
      configKeyStates = { experiments: new Map([]) };

      config._experiments.forEach(function(exp) {
        setConfigLoadedKeys(configKeyStates, exp)
      });
    });

    it('should generate genome for one experiment of two in same environment', () => {
      context.initialize(123, 321, {
        web: {
          url: 'https://test.site.com/index.html'
        }
      });
      setActiveAndEntryKeyStates(1, context, config, allocations, configKeyStates);

      const result = generateEffectiveGenome(configKeyStates.experiments, genomes);

      expect(result.effectiveGenome).to.be.eql({
        "web": {
          "2nsqubits": {
            "p99utjadn": {
              "id": "tifv3fu1g",
              "type": "compound",
              "script": "",
              "styles": "a#learn.btn.btn-primary.btn-lg {\n  background-color: yellow\n}"
            },
            "u4mehfi0j": {
              "type": "noop"
            }
          }
        }
      });
    });

    it('should generate genome for two experiments of two in same environment', () => {
      context.initialize(123, 321, {
        web: {
          url: 'https://test.site.com/index.html'
        },
        device: 'mobile'
      });
      setActiveAndEntryKeyStates(1, context, config, allocations, configKeyStates);

      const result = generateEffectiveGenome(configKeyStates.experiments, genomes);

      expect(result.effectiveGenome).to.be.eql({
        "web": {
          "2nsqubits": {
            "p99utjadn": {
              "id": "tifv3fu1g",
              "type": "compound",
              "script": "",
              "styles": "a#learn.btn.btn-primary.btn-lg {\n  background-color: yellow\n}"
            },
            "u4mehfi0j": {
              "type": "noop"
            }
          },
          "2nshubits": {
            "p89utjadn": {
              "id": "tift3fu1g",
              "type": "compound",
              "script": "",
              "styles": "a#learn.btn.btn-primary.btn-lg {\n  background-color: yellow\n}"
            },
            "u4nehfi0j": {
              "type": "noop"
            }
          }
        }
      });
    });

    it('should include eid in activeEids even if there is no genome for it', () => {
      context.initialize(123, 321, {
        web: {
          url: 'https://test.site.com/index.html'
        }
      });
      setActiveAndEntryKeyStates(1, context, config, allocations, configKeyStates);

      const result = generateEffectiveGenome(configKeyStates.experiments, genomes);

      expect(Array.from(result.activeEids)).to.be.eql(["60f67d8648", "64928df20a", "c4154ac833"]);
    });
  });

  describe('isInternalUser', () => {
    const url = 'http://localhost';

    function mockConfigurationJson(options = {}) {
      xhrMock.get(/configuration\.json$/, (req, res) => {
        const data = {
          ...options,
          _experiments: [
            {
              web: {},
              _predicate: {},
              id: '49afccc9bc',
              _paused: false,
              _optimization_metric: 'VISITOR',
              _include_eid_in_hash: true,
              var1: {
                _is_entry_point: false,
                _predicate: null,
                _values: true,
                _initializers: true
              }
            }
          ],
        };

        return res.status(200).body(JSON.stringify(data));
      });
    }

    beforeEach(() => {
      xhrMock.setup();

      xhrMock.get(/allocations$/, (req, res) => {
        return res.status(200).body(JSON.stringify([
          {
            uid: '1',
            eid: '49afccc9bc',
            cid: 'dfe1a698c486:49afccc9bc',
            genome: {},
            audience_query: {},
            ordinal: 0,
            group_id: '89e674e7-9c2f-4a7d-b2d2-8c5b3e158c73',
            excluded: false
          }
        ]));
      });
    });

    afterEach(() => {
      xhrMock.teardown();
    });

    it('should mark users as internal if "_internal_user" is true', (done) => {
      mockConfigurationJson({ _internal_user: true });

      const context = new Context();
      context.initialize('uid', { web: { url }});

      const store = new Store({ environment: 'env' });
      store.initialize(context);

      setImmediate(() => {
        expect(store.isInternalUser()).to.be.true;
        done();
      });
    });

    it('should not mark users as internal if "_internal_user" is false', (done) => {
      mockConfigurationJson({ _internal_user: false });

      const context = new Context();
      context.initialize('uid', { web: { url }});

      const store = new Store({ environment: 'env' });
      store.initialize(context);

      setImmediate(() => {
        expect(store.isInternalUser()).to.be.false;
        done();
      });
    });

    it('should not mark users as internal by default', (done) => {
      mockConfigurationJson({});

      const context = new Context();
      context.initialize('uid', { web: { url }});

      const store = new Store({ environment: 'env' });
      store.initialize(context);

      setImmediate(() => {
        expect(store.isInternalUser()).to.be.false;
        done();
      });
    });
  });

  describe('Views', () => {
    const url = 'http://localhost';

    function mockConfigurationJson(views) {
      xhrMock.get(/configuration\.json$/, (req, res) => {
        const data = {
          _experiments: [],
          ...(views ? { _views: views } : {})
        };

        return res.status(200).body(JSON.stringify(data));
      });
    }

    beforeEach(() => {
      xhrMock.setup();

      xhrMock.get(/allocations$/, (req, res) => {
        return res.status(200).body(JSON.stringify([]));
      });
    });

    afterEach(() => {
      xhrMock.teardown();
    });

    describe('when "_views" from /configuration.json is empty', () => {
      it('should set "view" in context to null', (done) => {
        // Arrange
       mockConfigurationJson([]);

        const context = new Context();
        context.initialize('uid', { web: { url }});

        // Act
        const store = new Store({ environment: 'env' });
        store.initialize(context);

        // Assert
        setImmediate(() => {
          expect(context.get('view')).to.equal(null);
          done();
        });
      });
    });

    describe('when "_views" from /configuration.json is undefined', () => {
      it('should set "view" in context to null', (done) => {
        // Arrange
       mockConfigurationJson();

        const context = new Context();
        context.initialize('uid', { web: { url }});

        // Act
        const store = new Store({ environment: 'env' });
        store.initialize(context);

        // Assert
        setImmediate(() => {
          expect(context.get('view')).to.equal(null);
          done();
        });
      });
    });

    it('should set "view" in context to key of view with matching predicate', (done) => {
      // Arrange
      const url = 'http://localhost';

      mockConfigurationJson([
        {
          key: 'homepage',
          display_name: 'Homepage',
          predicate: {
            combinator: 'and',
            rules: [
              { field: 'web.url', operator: 'equal', value: url }
            ]
          }
        }
      ]);

      const context = new Context();
      context.initialize('uid', { web: { url }});

      // Act
      const store = new Store({ environment: 'env' });
      store.initialize(context);

      // Assert
      setImmediate(() => {
        expect(context.get('view')).to.equal('homepage');
        done();
      });
    });

    it('should set "view" in context to key of first view with matching predicate', (done) => {
      // Arrange
      const url = 'http://localhost';

      mockConfigurationJson([
        {
          key: 'first',
          display_name: 'First',
          predicate: {
            combinator: 'and',
            rules: [
              { field: 'web.url', operator: 'equal', value: url }
            ]
          }
        },
        {
          key: 'second',
          display_name: 'Second',
          predicate: {
            combinator: 'and',
            rules: [
              { field: 'web.url', operator: 'equal', value: url }
            ]
          }
        }
      ]);

      const context = new Context();
      context.initialize('uid', { web: { url }});

      // Act
      const store = new Store({ environment: 'env' });
      store.initialize(context);

      // Assert
      setImmediate(() => {
        expect(context.get('view')).to.equal('first');
        done();
      });
    });

    describe('when no predicate from views matches', () => {
      it('should set "view" in context to null', (done) => {
        // Arrange
        mockConfigurationJson([
          {
            key: 'homepage',
            display_name: 'Homepage',
            predicate: {
              combinator: 'and',
              rules: [
                { field: 'web.url', operator: 'not_equal', value: url }
              ]
            }
          }
        ]);

        const context = new Context();
        context.initialize('uid', { web: { url }});

        // Act
        const store = new Store({ environment: 'env' });
        store.initialize(context);

        // Assert
        setImmediate(() => {
          expect(context.get('view')).to.equal(null);
          done();
        });
      });
    });
  });
});
