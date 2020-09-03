import assert from 'assert';
import chai from 'chai';

const { expect } = chai;

import Context from '../context.js';
import { expKeyStatesHas, evaluatePredicates, setActiveAndEntryKeyStates, generateEffectiveGenome } from '../store.js';
import * as objects from '../ponyfills/objects.js';
import * as strings from '../ponyfills/strings.js';


describe('store.js', () => {
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
      const genomes = {
        "60f67d8648": {
          "web": {
            "2nsqubits": {
              "p99utjadn": {
                "id": "tifv3fu1g",
                "type": "compound",
                "_metadata": {},
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
                "_metadata": {},
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
      context.initialize(123, 321, {
        web: {
          url: 'https://test.site.com/index.html'
        }
      });

      const configKeyStates = { experiments: new Map([]) };
      const genomeConfigKeyStates = { experiments: new Map() };

      config._experiments.forEach(function(exp) {
        const clean = objects.assign({}, exp);
        delete clean.id;
        const expLoaded = new Set();
        const expMap = new Map();
        expMap.set('loaded', expLoaded)
        configKeyStates.experiments.set(exp.id, expMap);
        objects.flattenKeys(clean, function(key) {
          return !strings.startsWith(key, '_');
        }).forEach(expLoaded.add.bind(expLoaded));
      });

      const expLoaded1 = new Set();
      const expMap1 = new Map([['loaded', expLoaded1]])
      genomeConfigKeyStates.experiments.set('60f67d8648', expMap1)
      objects.flattenKeys(genomes['60f67d8648'], function(key) {
        return !strings.startsWith(key, '_');
      }).forEach(expLoaded1.add.bind(expLoaded1));

      const expLoaded2 = new Set();
      const expMap2 = new Map([['loaded', expLoaded2]])
      genomeConfigKeyStates.experiments.set('64928df20a', expMap2)
      objects.flattenKeys(genomes['64928df20a'], function(key) {
        return !strings.startsWith(key, '_');
      }).forEach(expLoaded2.add.bind(expLoaded2));

      setActiveAndEntryKeyStates(1, context, config, configKeyStates, genomeConfigKeyStates);
      const result = configKeyStates.experiments;

      expect(result.size).to.be.equal(2);
      expect(result.has('60f67d8648')).to.be.true;
      expect(result.get('60f67d8648').has('active')).to.be.true;
      expect(Array.from(result.get('60f67d8648').get('active'))).to.be.eql(["web","web.dependencies","web.2nsqubits","web.2nsqubits.p99utjadn","web.2nsqubits.p99utjadn.id","web.2nsqubits.p99utjadn.type","web.2nsqubits.p99utjadn.script","web.2nsqubits.p99utjadn.styles","web.2nsqubits.u4mehfi0j","web.2nsqubits.u4mehfi0j.type"]);
      expect(result.get('60f67d8648').has('entry')).to.be.true;
      expect(Array.from(result.get('60f67d8648').get('entry'))).to.be.eql(["web.2nsqubits", "web.2nsqubits.p99utjadn", "web.2nsqubits.p99utjadn.id", "web.2nsqubits.p99utjadn.type", "web.2nsqubits.p99utjadn.script", "web.2nsqubits.p99utjadn.styles", "web.2nsqubits.u4mehfi0j", "web.2nsqubits.u4mehfi0j.type"]);
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
      const configKeyStates = { experiments: new Map([['913f49193b', new Map([['loaded', new Set(["web","web.47b7t1xuc","web.47b7t1xuc.7coo4n5jr","web.47b7t1xuc.7coo4n5jr.id","web.47b7t1xuc.7coo4n5jr.type","web.47b7t1xuc.7coo4n5jr.script","web.47b7t1xuc.7coo4n5jr.styles","web.dependencies","web.bszvsce8f"])]])]]) };
      const genomeKeyStates = { experiments: new Map([['913f49193b', new Map([['loaded', new Set()]])]]) };

      setActiveAndEntryKeyStates(1, context, config, configKeyStates, genomeKeyStates);
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
    let genomeConfigKeyStates;
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
      genomes = {
        "60f67d8648": {
          "web": {
            "2nsqubits": {
              "p99utjadn": {
                "id": "tifv3fu1g",
                "type": "compound",
                "_metadata": {},
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
                "_metadata": {},
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
      genomeConfigKeyStates = { experiments: new Map() };

      config._experiments.forEach(function(exp) {
        const clean = objects.assign({}, exp);
        delete clean.id;
        const expLoaded = new Set();
        const expMap = new Map();
        expMap.set('loaded', expLoaded)
        configKeyStates.experiments.set(exp.id, expMap);
        objects.flattenKeys(clean, function(key) {
          return !strings.startsWith(key, '_');
        }).forEach(expLoaded.add.bind(expLoaded));
      });

      const expLoaded1 = new Set();
      const expMap1 = new Map([['loaded', expLoaded1]])
      genomeConfigKeyStates.experiments.set('60f67d8648', expMap1)
      objects.flattenKeys(genomes['60f67d8648'], function(key) {
        return !strings.startsWith(key, '_');
      }).forEach(expLoaded1.add.bind(expLoaded1));

      const expLoaded2 = new Set();
      const expMap2 = new Map([['loaded', expLoaded2]])
      genomeConfigKeyStates.experiments.set('64928df20a', expMap2)
      objects.flattenKeys(genomes['64928df20a'], function(key) {
        return !strings.startsWith(key, '_');
      }).forEach(expLoaded2.add.bind(expLoaded2));
    });

    it('should generate genome for one experiment of two in same environment', () => {
      context.initialize(123, 321, {
        web: {
          url: 'https://test.site.com/index.html'
        }
      });
      setActiveAndEntryKeyStates(1, context, config, configKeyStates, genomeConfigKeyStates);

      const result = generateEffectiveGenome(configKeyStates.experiments, genomes);

      expect(Array.from(result.activeEids)).to.be.eql(["60f67d8648"]);
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
      setActiveAndEntryKeyStates(1, context, config, configKeyStates, genomeConfigKeyStates);

      const result = generateEffectiveGenome(configKeyStates.experiments, genomes);

      expect(Array.from(result.activeEids)).to.be.eql(["60f67d8648", "64928df20a"]);
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
  });
});
