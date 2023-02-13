import chai from 'chai';
import spies from 'chai-spies';
import _xhrMock from 'xhr-mock';
import { Crypto }  from "@peculiar/webcrypto";
import Evolv from '../index.js';
import Store, { EFFECTIVE_GENOME_UPDATED } from '../store.js';
import Context, { CONTEXT_INITIALIZED, CONTEXT_CHANGED } from '../context.js';
import { waitFor, emit } from '../waitforit.js';
import base64 from '../ponyfills/base64.js';
import { buildOptions } from '../build-options.js';

chai.use(spies);
const expect = chai.expect;
const Assertion = chai.Assertion;
const xhrMock = _xhrMock.default;


Assertion.addMethod('message', function(type, key, value) {
  const message = this._obj;

  expect(message.type).to.equal(type);
  expect(message.payload.key).to.equal(key);
  expect(message.payload.value).to.eql(value);
});

Assertion.addMethod('messageWithLength', function(type, key, value) {
  const message = this._obj;

  expect(message.type).to.equal(type);
  expect(message.payload.key).to.equal(key);
  expect(message.payload.value.length).to.equal(value);
});

const SIGNATURE_PATTERN = /keyId="([^"]+)",algorithm="([^"]+)",signature="([^"]+)"/;

async function validateSignature(keys, signature, body) {
  const signatureParts = SIGNATURE_PATTERN.exec(signature);
  expect(signatureParts).not.to.be.undefined;
  const id = signatureParts[1];
  const algorithm = {name: 'HMAC', hash: 'SHA-384'};

  expect(signatureParts[2]).to.equal('hmac-sha384');

  const cryptoKey = await crypto.subtle.importKey(
    'raw', (new TextEncoder()).encode(keys[id]).buffer, algorithm, true, ['sign', 'verify']);
  let textEncoder = new TextEncoder();
  let signatureData = base64.decodeToArrayBuffer(signatureParts[3]);
  return await crypto.subtle.verify(algorithm, cryptoKey, signatureData, textEncoder.encode(body).buffer);
}

async function validateClient(evolv, opts, uid) {
  const options = buildOptions(opts);
  let initializedSpy = chai.spy();
  evolv.once(Evolv.INITIALIZED, initializedSpy);
  expect(initializedSpy).to.not.have.been.called;

  let contextInitializedSpy = chai.spy();
  evolv.once(CONTEXT_INITIALIZED, contextInitializedSpy);
  expect(contextInitializedSpy).to.not.have.been.called;

  let analyticsPayloads = [];
  let eventPayloads = [];
  const beaconHandler = (req, res) => {
    expect(req.method()).to.equal('POST');
    expect(req.header('Content-Type')).to.equal('application/json; charset=UTF-8');

    const body = req.body();
    const data = JSON.parse(body);

    if (req.url().path.endsWith('data')) {
      analyticsPayloads.push(data);
    } else if (req.url().path.endsWith('events')) {
      eventPayloads.push(data);
    } else {
      res.status(500);
    }
    return res.status(202);
  };

  xhrMock.post(`${options.endpoint}/${options.environment}/data`, beaconHandler);

  xhrMock.post(`${options.endpoint}/${options.environment}/events`, beaconHandler);

  evolv.initialize(uid, {
      remote: true,
      web: {
        url: 'https://www.lunch.com/dev1/index.html'
      }
    },{
      local: true
    }
  );

  expect(initializedSpy).to.have.been.called.once;
  expect(initializedSpy).to.have.been.called.once.with(Evolv.INITIALIZED, options);
  expect(contextInitializedSpy).to.have.been.called.once;

  let contextChangedSpy = chai.spy();
  evolv.on(CONTEXT_CHANGED, contextChangedSpy);
  evolv.preload(['web']);

  expect(contextChangedSpy).to.not.have.been.called;

  const configWebKeySpy = chai.spy();
  const configWebAb8numq2jKeySpy = chai.spy();
  const configWebAb8numq2jAm94yhwo2KeySpy = chai.spy();
  evolv.getConfig('web').listen(configWebKeySpy);
  evolv.getConfig('web.ab8numq2j').listen(configWebAb8numq2jKeySpy);
  evolv.getConfig('web.ab8numq2j.am94yhwo2').listen(configWebAb8numq2jAm94yhwo2KeySpy);

  expect(await evolv.getConfig('not-here')).to.be.an('undefined');
  expect(await evolv.getConfig('web')).to.be.an('undefined');
  expect(await evolv.getConfig('web.ab8numq2j')).to.be.an('undefined');
  expect(await evolv.getConfig('web.ab8numq2j.am94yhwo2')).to.be.an('undefined');
  expect(contextChangedSpy).to.have.been.called;

  const valueWebKeySpy = chai.spy();
  const valueWebAb8numq2jKeySpy = chai.spy();
  const valueWebAb8numq2jAm94yhwo2KeySpy = chai.spy();
  evolv.get('web').listen(valueWebKeySpy);
  evolv.get('web.ab8numq2j').listen(valueWebAb8numq2jKeySpy);
  evolv.get('web.ab8numq2j.am94yhwo2').listen(valueWebAb8numq2jAm94yhwo2KeySpy);

  expect(await evolv.get('web.ab8numq2j')).to.be.an('undefined');
  expect(await evolv.get('web.ab8numq2j.am94yhwo2')).to.be.an('undefined');
  expect(await evolv.get('web.7w3zpgfy9')).to.be.an('undefined');
  expect(await evolv.get('web.7w3zpgfy9.azevlvf5g')).to.be.an('undefined');
  expect((await evolv.getActiveKeys('web')).current.length).to.equal(0);

  evolv.confirm();

  evolv.context.set('user_attributes.country', 'usa');
  expect(contextChangedSpy).to.have.been.called;
  expect(await evolv.isActive('web.ab8numq2j.am94yhwo2')).to.be.true;
  expect((await evolv.get('web.ab8numq2j.am94yhwo2')).id).to.equal('2fxe5dy5j');
  expect(await evolv.isActive('web.7w3zpgfy9.azevlvf5g')).to.be.false;
  expect(await evolv.get('web.7w3zpgfy9.azevlvf5g')).to.be.an('undefined');
  expect((await evolv.getActiveKeys('web')).current).to.have.members([
    "web.ab8numq2j.am94yhwo2",
  ]);


  const isActiveWebKeySpy = chai.spy();
  const isActiveWebAb8numq2jKeySpy = chai.spy();
  const isActiveWebAb8numq2jAm94yhwo2KeySpy = chai.spy();
  evolv.isActive('web').listen(isActiveWebKeySpy);
  evolv.isActive('web.ab8numq2j').listen(isActiveWebAb8numq2jKeySpy);
  evolv.isActive('web.ab8numq2j.am94yhwo2').listen(isActiveWebAb8numq2jAm94yhwo2KeySpy);

  evolv.confirm();
  evolv.emit('lunch-time', {score:33});
  evolv.contaminate();

  const allKeysSpy = chai.spy();
  const webKeysSpy = chai.spy();
  const noKeysSpy = chai.spy();
  evolv.getActiveKeys().listen(allKeysSpy);
  evolv.getActiveKeys('web').listen(webKeysSpy);
  evolv.getActiveKeys('nope').listen(noKeysSpy);

  evolv.context.set('web.url', 'https://www.lunch.com/dev1/features.html');
  expect(contextChangedSpy).to.have.been.called;
  expect(await evolv.isActive('web.ab8numq2j.am94yhwo2')).to.be.false;
  expect(await evolv.get('web.ab8numq2j.am94yhwo2')).to.be.an('undefined');
  expect(await evolv.isActive('web.7w3zpgfy9.azevlvf5g')).to.be.true;
  expect((await evolv.get('web.7w3zpgfy9.azevlvf5g')).type).to.equal('noop');
  expect((await evolv.getActiveKeys('web')).current).to.have.members([
    "web.7w3zpgfy9.azevlvf5g",
  ]);

  evolv.confirm();

  evolv.context.remove('web.url');
  expect(contextChangedSpy).to.have.been.called;
  expect(await evolv.isActive('web.ab8numq2j')).to.be.false;
  expect(await evolv.get('web.ab8numq2j.am94yhwo2')).to.be.an('undefined');
  expect(await evolv.isActive('web.7w3zpgfy9')).to.be.false;
  expect(await evolv.get('web.7w3zpgfy9.azevlvf5g')).to.be.an('undefined');
  expect((await evolv.getActiveKeys()).current.length).to.equal(0);

  expect(initializedSpy).to.have.been.called.once;
  expect(contextInitializedSpy).to.have.been.called.once;

  evolv.flush();

  expect(configWebKeySpy).to.have.been.called;
  expect(configWebAb8numq2jKeySpy).to.have.been.called;
  expect(configWebAb8numq2jAm94yhwo2KeySpy).to.have.been.called;
  expect(valueWebKeySpy).to.have.been.called;
  expect(valueWebAb8numq2jKeySpy).to.have.been.called;
  expect(valueWebAb8numq2jAm94yhwo2KeySpy).to.have.been.called;
  expect(isActiveWebKeySpy).to.have.been.called;
  expect(isActiveWebAb8numq2jKeySpy).to.have.been.called;
  expect(isActiveWebAb8numq2jAm94yhwo2KeySpy).to.have.been.called;
  expect(allKeysSpy).to.have.been.called;
  expect(webKeysSpy).to.have.been.called;
  expect(noKeysSpy).to.have.been.called;

  return new Promise((resolve, reject) => {
    setTimeout(function() {
      try {
        resolve({analyticsPayloads, eventPayloads});
      } catch (ex) {
        reject(ex);
      }
    });
  });
}

describe('Evolv client integration tests', () => {
  beforeEach(() => {
    xhrMock.setup();
    // Uncomment to hit Frazer's endpoint
    // global.XMLHttpRequest = xmlhttprequest.XMLHttpRequest;
    global.crypto = new Crypto();
  });
  afterEach(() => {
    delete global.crypto;
    delete global.XMLHttpRequest;
    xhrMock.teardown();
  });

  describe('API v1', () => {
    it('should load variants and reevaluate context correctly', async () => {
      const uid = 123;
      const environment = '579b106c73';
      const endpoint = 'https://participants-frazer.evolv.ai/';
      const version = 1

      let configSignature = null;
      let allocSignature = null;

      xhrMock.get(`${endpoint}v${version}/${environment}/${uid}/configuration.json`, (req, res) => {
        configSignature = req.header('Signature');
        if (req.header('Content-Type') && req.header('Content-Type') !== 'text/plain; charset=UTF-8') {
          return res.status(415);
        }

        if (req.method() !== 'GET') {
          return res.status(405);
        }

        return res.status(200).body(JSON.stringify({
          _published: 1584475383.3865728,
          _client: {
            browser: 'chrome',
            platform: 'windows'
          },
          _experiments: [
            {
              web: {
                "ab8numq2j": {
                  _is_entry_point: true,
                  _predicate: {
                    combinator: "and",
                    rules: [
                      {
                        field: "web.url",
                        operator: "regex64_match",
                        value: "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2luZGV4XC5odG1sKD86JHxcP3wjKS9p"
                      }
                    ]
                  },
                  am94yhwo2: {
                    _values: true
                  }
                },
                "7w3zpgfy9": {
                  _is_entry_point: false,
                    _predicate: {
                    combinator: "and",
                      rules: [
                      {
                        field: "web.url",
                        operator: "regex64_match",
                        value: "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2ZlYXR1cmVzXC5odG1sKD86JHxcP3wjKS9p"
                      }
                    ]
                  },
                  azevlvf5g: {
                    _values: true
                  }
                }
              },
                id: "0f39849197",
                _predicate: {
                  combinator: "and",
                    rules: [
                    {
                      field: "user_attributes",
                      operator: "kv_equal",
                      value: [
                        "country",
                        "usa"
                      ]
                    }
                  ]
                }
              }
            ]
          }));
      });

      xhrMock.get(`${endpoint}v${version}/${environment}/${uid}/allocations`, (req, res) => {
        allocSignature = req.header('Signature');

        if (req.method() !== 'GET') {
          return res.status(405);
        }

        return res.status(200).body(JSON.stringify([
          {
            uid: uid,
            eid: "0f39849197",
            cid: "0cf8ffcedea2:0f39849197",
            genome: {
              web: {
                "ab8numq2j": {
                  am94yhwo2: {
                    id: "2fxe5dy5j",
                    type: "compound",
                    _metadata: { },
                    script: "console.log('62px');",
                    styles: "#ReactLogo { font-size: 62px; }"
                  }
                },
                "7w3zpgfy9": {
                  azevlvf5g: {
                    type: "noop"
                  }
                }
              }
            },
            audience_query: {
              id: 1,
                name: "USA Users",
                combinator: "and",
                rules: [
                {
                  field: "user_attributes",
                  operator: "kv_equal",
                  value: [
                    "country",
                    "usa"
                  ]
                }
              ]
            },
            excluded: false
          }
        ]));
      });

      const options = {
        environment,
        endpoint,
        version
      };
      const evolv = new Evolv(options);

      await validateClient(evolv, options, uid);

      expect(evolv.context.get('web.client.browser')).to.equal('chrome');
      expect(evolv.context.get('platform')).to.equal('windows');

      expect(configSignature).to.equal(null);
      expect(allocSignature).to.equal(null);
    });

    it('should load variants and reevaluate context correctly with authentication', async () => {
      const uid = 123;
      const environment = '579b106c73';
      const endpoint = 'https://participants-frazer.evolv.ai/';
      const id = 'mine';
      const secret = 'yep, lunch';
      const algorithm = { name: 'HMAC', hash: 'SHA-384' };
      const version = 1;

      let configSignature = undefined;
      let configBody = undefined;
      let allocSignature = undefined;
      let allocBody = undefined;

      xhrMock.get(`${endpoint}v${version}/${environment}/${uid}/configuration.json`, (req, res) => {
        configSignature = req.header('Signature');
        configBody = req.body() || '';
        return res.status(200).body(JSON.stringify({
          _published: 1584475383.3865728,
          _client: {},
          _experiments: [
            {
              web: {
                "ab8numq2j": {
                  _is_entry_point: true,
                  _predicate: {
                    combinator: "and",
                    rules: [
                      {
                        field: "web.url",
                        operator: "regex64_match",
                        value: "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2luZGV4XC5odG1sKD86JHxcP3wjKS9p"
                      }
                    ]
                  },
                  am94yhwo2: {
                    _values: true
                  }
                },
                "7w3zpgfy9": {
                  _is_entry_point: false,
                  _predicate: {
                    combinator: "and",
                    rules: [
                      {
                        field: "web.url",
                        operator: "regex64_match",
                        value: "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2ZlYXR1cmVzXC5odG1sKD86JHxcP3wjKS9p"
                      }
                    ]
                  },
                  azevlvf5g: {
                    _values: true
                  }
                }
              },
              id: "0f39849197",
              _predicate: {
                combinator: "and",
                rules: [
                  {
                    field: "user_attributes",
                    operator: "kv_equal",
                    value: [
                      "country",
                      "usa"
                    ]
                  }
                ]
              }
            }
          ]
        }));
      });

      xhrMock.get(`${endpoint}v${version}/${environment}/${uid}/allocations`, (req, res) => {
        allocSignature = req.header('Signature');
        allocBody = req.body() || '';
        return res.status(200).body(JSON.stringify([
          {
            uid: uid,
            eid: "0f39849197",
            cid: "0cf8ffcedea2:0f39849197",
            genome: {
              web: {
                "ab8numq2j": {
                  am94yhwo2: {
                    id: "2fxe5dy5j",
                    type: "compound",
                    _metadata: { },
                    script: "console.log('62px');",
                    styles: "#ReactLogo { font-size: 62px; }"
                  }
                },
                "7w3zpgfy9": {
                  azevlvf5g: {
                    type: "noop"
                  }
                }
              }
            },
            audience_query: {
              id: 1,
              name: "USA Users",
              combinator: "and",
              rules: [
                {
                  field: "user_attributes",
                  operator: "kv_equal",
                  value: [
                    "country",
                    "usa"
                  ]
                }
              ]
            },
            excluded: false
          }
        ]));
      });

      const options = {
        environment,
        endpoint,
        version,
        auth: {
          id,
          secret
        }
      };
      const evolv = new Evolv(options);

      await validateClient(evolv, options, uid);

      const keys = {};
      keys[id] = secret;
      expect(await validateSignature(keys, configSignature, configBody)).to.be.true;
      expect(await validateSignature(keys, allocSignature, allocBody)).to.be.true;
    });
  });

  describe('API v2', () => {
    it('should load variants and reevaluate context correctly', async () => {
      const uid = 123;
      const environment = '579b106c73';
      const endpoint = 'https://participants-frazer.evolv.ai/';
      const version = 2;
      const analytics = true;

      xhrMock.get(`${endpoint}v${version}/${environment}/${uid}/configuration.json`, (req, res) => {
        return res.status(200).body(JSON.stringify({
          _published: 1584475383.3865728,
          _client: {},
          _experiments: [
            {
              web: {
                "ab8numq2j": {
                  _is_entry_point: true,
                  _predicate: {
                    combinator: "and",
                    rules: [
                      {
                        field: "web.url",
                        operator: "regex64_match",
                        value: "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2luZGV4XC5odG1sKD86JHxcP3wjKS9p"
                      }
                    ]
                  },
                  am94yhwo2: {
                    _values: true
                  }
                },
                "7w3zpgfy9": {
                  _is_entry_point: false,
                  _predicate: {
                    combinator: "and",
                    rules: [
                      {
                        field: "web.url",
                        operator: "regex64_match",
                        value: "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2ZlYXR1cmVzXC5odG1sKD86JHxcP3wjKS9p"
                      }
                    ]
                  },
                  azevlvf5g: {
                    _values: true
                  }
                }
              },
              id: "0f39849197",
              _predicate: {
                combinator: "and",
                rules: [
                  {
                    field: "user_attributes",
                    operator: "kv_equal",
                    value: [
                      "country",
                      "usa"
                    ]
                  }
                ]
              }
            }
          ]
        }));
      });

      xhrMock.get(`${endpoint}v${version}/${environment}/${uid}/allocations`, (req, res) => {
        return res.status(200).body(JSON.stringify([
          {
            uid: uid,
            eid: "0f39849197",
            cid: "0cf8ffcedea2:0f39849197",
            genome: {
              web: {
                "ab8numq2j": {
                  am94yhwo2: {
                    id: "2fxe5dy5j",
                    type: "compound",
                    _metadata: { },
                    script: "console.log('62px');",
                    styles: "#ReactLogo { font-size: 62px; }"
                  }
                },
                "7w3zpgfy9": {
                  azevlvf5g: {
                    type: "noop"
                  }
                }
              }
            },
            audience_query: {
              id: 1,
              name: "USA Users",
              combinator: "and",
              rules: [
                {
                  field: "user_attributes",
                  operator: "kv_equal",
                  value: [
                    "country",
                    "usa"
                  ]
                }
              ]
            },
            excluded: false
          }
        ]));
      });

      const options = {
        environment,
        endpoint,
        version,
        analytics
      };
      const evolv = new Evolv(options);

      const results = await validateClient(evolv, options, uid);

      expect(results.eventPayloads.length).to.equal(2)
      expect(results.eventPayloads[0].messages[0].type).to.equal("confirmation")
      expect(results.eventPayloads[0].messages[0].payload.eid).to.equal("0f39849197")
      expect(results.eventPayloads[1].messages[0].type).to.equal("lunch-time")

      expect(results.analyticsPayloads.length).to.equal(1);
      expect(results.analyticsPayloads[0].uid).to.equal(uid);

      const messages = results.analyticsPayloads[0].messages;

      expect(messages.length).to.equal(20)

      expect(messages[0].type).to.equal("context.initialized")
      expect(messages[0].payload).to.eql( {
        "remote": true,
        "web": {
          "url": "https://www.lunch.com/dev1/index.html"
        }
      })
      expect(messages[1]).to.be.a.message("context.value.added", "keys.active", []);
      expect(messages[2]).to.be.a.message("context.value.added", "variants.active", []);
      expect(messages[3]).to.be.a.message("context.value.added", "view", null);
      expect(messages[4]).to.be.a.message("context.value.added", "experiments.allocations", [{
        "cid": "0cf8ffcedea2:0f39849197",
        "eid": "0f39849197",
        "excluded": false,
        "uid": 123
      }]);
      expect(messages[5]).to.be.a.message("context.value.added", "experiments.exclusions", []);
      expect(messages[6]).to.be.a.message("context.value.added", "user_attributes.country", "usa");
      expect(messages[7]).to.be.a.message("context.value.changed", "keys.active", ["web.ab8numq2j.am94yhwo2"]);
      expect(messages[8]).to.be.a.message("context.value.changed", "variants.active", ["web.ab8numq2j.am94yhwo2:1486101989"]);
      expect(messages[9]).to.be.a.messageWithLength("context.value.added", "confirmations", 1);
      expect(messages[9].payload.value[0].cid).to.equal("0cf8ffcedea2:0f39849197")
      expect(messages[10]).to.be.a.messageWithLength("context.value.added", "experiments.confirmations", 1);
      expect(messages[10].payload.value[0].cid).to.equal("0cf8ffcedea2:0f39849197")
      expect(messages[11]).to.be.a.messageWithLength("context.value.added", "events", 1);
      expect(messages[11].payload.value[0].type).to.equal("lunch-time")
      expect(messages[12]).to.be.a.messageWithLength("context.value.added", "contaminations", 1);
      expect(messages[12].payload.value[0].cid).to.equal("0cf8ffcedea2:0f39849197")
      expect(messages[13]).to.be.a.messageWithLength("context.value.added", "experiments.contaminations", 1);
      expect(messages[13].payload.value[0].cid).to.equal("0cf8ffcedea2:0f39849197")
      expect(messages[14]).to.be.a.message("context.value.changed", "web.url", "https://www.lunch.com/dev1/features.html");
      expect(messages[15]).to.be.a.message("context.value.changed", "keys.active", ["web.7w3zpgfy9.azevlvf5g"]);
      expect(messages[16]).to.be.a.message("context.value.changed", "variants.active", ["web.7w3zpgfy9.azevlvf5g:1777529126"]);
      expect(messages[17].type).to.equal("context.value.removed")
      expect(messages[17].payload.key).to.equal("web.url")
      expect(messages[18]).to.be.a.message("context.value.changed", "keys.active", []);
      expect(messages[19]).to.be.a.message("context.value.changed", "variants.active", []);
    });

    // TODO AP-2318 bring back when confirmations killed again
    xit('should not fire confirmation if session based', async () => {
      const uid = 123;
      const environment = '579b106c73';
      const endpoint = 'https://participants-frazer.evolv.ai/';
      const version = 2;
      const analytics = true;

      xhrMock.get(`${endpoint}v${version}/${environment}/${uid}/configuration.json`, (req, res) => {
        return res.status(200).body(JSON.stringify({
          _published: 1584475383.3865728,
          _client: {},
          _experiments: [
            {
              _optimization_metric: "SESSION",
              web: {
                "ab8numq2j": {
                  _is_entry_point: true,
                  _predicate: {
                    combinator: "and",
                    rules: [
                      {
                        field: "web.url",
                        operator: "regex64_match",
                        value: "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2luZGV4XC5odG1sKD86JHxcP3wjKS9p"
                      }
                    ]
                  },
                  am94yhwo2: {
                    _values: true
                  }
                },
                "7w3zpgfy9": {
                  _is_entry_point: false,
                  _predicate: {
                    combinator: "and",
                    rules: [
                      {
                        field: "web.url",
                        operator: "regex64_match",
                        value: "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2ZlYXR1cmVzXC5odG1sKD86JHxcP3wjKS9p"
                      }
                    ]
                  },
                  azevlvf5g: {
                    _values: true
                  }
                }
              },
              id: "0f39849197",
              _predicate: {
                combinator: "and",
                rules: [
                  {
                    field: "user_attributes",
                    operator: "kv_equal",
                    value: [
                      "country",
                      "usa"
                    ]
                  }
                ]
              }
            }
          ]
        }));
      });

      xhrMock.get(`${endpoint}v${version}/${environment}/${uid}/allocations`, (req, res) => {
        return res.status(200).body(JSON.stringify([
          {
            uid: uid,
            eid: "0f39849197",
            cid: "0cf8ffcedea2:0f39849197",
            genome: {
              web: {
                "ab8numq2j": {
                  am94yhwo2: {
                    id: "2fxe5dy5j",
                    type: "compound",
                    _metadata: { },
                    script: "console.log('62px');",
                    styles: "#ReactLogo { font-size: 62px; }"
                  }
                },
                "7w3zpgfy9": {
                  azevlvf5g: {
                    type: "noop"
                  }
                }
              }
            },
            audience_query: {
              id: 1,
              name: "USA Users",
              combinator: "and",
              rules: [
                {
                  field: "user_attributes",
                  operator: "kv_equal",
                  value: [
                    "country",
                    "usa"
                  ]
                }
              ]
            },
            excluded: false
          }
        ]));
      });

      const options = {
        environment,
        endpoint,
        version,
        analytics
      };
      const evolv = new Evolv(options);

      const results = await validateClient(evolv, options, uid);

      expect(results.eventPayloads.length).to.equal(1)
      expect(results.eventPayloads[0].messages[0].type).to.equal("lunch-time")

      expect(results.analyticsPayloads.length).to.equal(1);
      expect(results.analyticsPayloads[0].uid).to.equal(uid);

      const messages = results.analyticsPayloads[0].messages;
      expect(messages.length).to.equal(20)

      expect(messages[9]).to.be.a.messageWithLength("context.value.added", "confirmations", 1);
      expect(messages[9].payload.value[0].cid).to.equal("0cf8ffcedea2:0f39849197")
      expect(messages[10]).to.be.a.messageWithLength("context.value.added", "experiments.confirmations", 1);
      expect(messages[10].payload.value[0].cid).to.equal("0cf8ffcedea2:0f39849197")
      expect(messages[11]).to.be.a.messageWithLength("context.value.added", "events", 1);
      expect(messages[11].payload.value[0].type).to.equal("lunch-time")
      expect(messages[12]).to.be.a.messageWithLength("context.value.added", "contaminations", 1);
      expect(messages[12].payload.value[0].cid).to.equal("0cf8ffcedea2:0f39849197")
      expect(messages[13]).to.be.a.messageWithLength("context.value.added", "experiments.contaminations", 1);
      expect(messages[13].payload.value[0].cid).to.equal("0cf8ffcedea2:0f39849197")
      expect(messages[14].type).to.equal("context.value.changed")
    });
  });

  describe('prevent beacon', () => {
    it('should block beacon calls', async () => {
      const uid = 123;
      const environment = '579b106c73';
      const endpoint = 'https://participants-frazer.evolv.ai/';
      const version = 2;
      const analytics = true;

      xhrMock.get(`${endpoint}v${version}/${environment}/${uid}/configuration.json`, (req, res) => {
        return res.status(200).body(JSON.stringify({
          _published: 1584475383.3865728,
          _client: {},
          _experiments: [
            {
              web: {
                "ab8numq2j": {
                  _is_entry_point: true,
                  _predicate: {
                    combinator: "and",
                    rules: [
                      {
                        field: "web.url",
                        operator: "regex64_match",
                        value: "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2luZGV4XC5odG1sKD86JHxcP3wjKS9p"
                      }
                    ]
                  },
                  am94yhwo2: {
                    _values: true
                  }
                },
                "7w3zpgfy9": {
                  _is_entry_point: false,
                  _predicate: {
                    combinator: "and",
                    rules: [
                      {
                        field: "web.url",
                        operator: "regex64_match",
                        value: "L2h0dHBzPzpcL1wvW14vXStcL2RldjFcL2ZlYXR1cmVzXC5odG1sKD86JHxcP3wjKS9p"
                      }
                    ]
                  },
                  azevlvf5g: {
                    _values: true
                  }
                }
              },
              id: "0f39849197",
              _predicate: {
                combinator: "and",
                rules: [
                  {
                    field: "user_attributes",
                    operator: "kv_equal",
                    value: [
                      "country",
                      "usa"
                    ]
                  }
                ]
              }
            }
          ]
        }));
      });

      xhrMock.get(`${endpoint}v${version}/${environment}/${uid}/allocations`, (req, res) => {
        return res.status(200).body(JSON.stringify([
          {
            uid: uid,
            eid: "0f39849197",
            cid: "0cf8ffcedea2:0f39849197",
            genome: {
              web: {
                "ab8numq2j": {
                  am94yhwo2: {
                    id: "2fxe5dy5j",
                    type: "compound",
                    _metadata: { },
                    script: "console.log('62px');",
                    styles: "#ReactLogo { font-size: 62px; }"
                  }
                },
                "7w3zpgfy9": {
                  azevlvf5g: {
                    type: "noop"
                  }
                }
              }
            },
            audience_query: {
              id: 1,
              name: "USA Users",
              combinator: "and",
              rules: [
                {
                  field: "user_attributes",
                  operator: "kv_equal",
                  value: [
                    "country",
                    "usa"
                  ]
                }
              ]
            },
            excluded: false
          }
        ]));
      });

      const options = {
        environment,
        endpoint,
        version,
        analytics,
        bufferEvents: true
      };
      const evolv = new Evolv(options);

      const results = await validateClient(evolv, options, uid);

      expect(results.analyticsPayloads.length).to.equal(0);
      expect(results.eventPayloads.length).to.equal(0);

      evolv.allowEvents();

      await new Promise(resolve => setTimeout(resolve, 1));

      expect(results.analyticsPayloads.length).to.equal(1);
      expect(results.analyticsPayloads[0].uid).to.equal(uid);

      const messages = results.analyticsPayloads[0].messages;
      expect(messages.length).to.equal(20);
      expect(messages[0].type).to.equal("context.initialized");
      expect(messages[0].payload).to.eql( {
        "remote": true,
        "web": {
          "url": "https://www.lunch.com/dev1/index.html"
        }
      });

      expect(results.eventPayloads.length).to.equal(1);
      const eventsMessages = results.eventPayloads[0].messages;
      expect(eventsMessages.length).to.equal(3);
      expect(eventsMessages[0].type).to.equal("confirmation");
    });
  });
});

describe('Evolv client unit tests', () => {
  var options;
  var context;
  var store;

  beforeEach(() => {
    options = {
      environment: '579b106c73',
      endpoint: 'https://participants-test.evolv.ai/',
      version: 1,
      autoConfirm: false
    };
    store = new Store(options);
    context = new Context(store);
  });

  describe('initialize()', () => {
    const uid = '123456';

    beforeEach(() => {
      xhrMock.setup();

      xhrMock.get(/configuration\.json$/, (req, res) => {
        const data = {
          _published: 1584475383.3865728,
          _client: {
            browser: 'chrome',
            platform: 'windows',
            device: 'desktop'
          },
          _experiments: [],
          _display_names: {
            experiments: {
              "0f39849197": "Project A"
            }
          }
        };

        return res.status(200).body(JSON.stringify(data));
      });

      xhrMock.get(/allocations$/, (req, res) => {
        const data = [
          {
            uid,
            eid: "0f39849197",
            cid: "0cf8ffcedea2:0f39849197",
            genome: {
              web: {
                ctx: ''
              }
            }
          }
        ];

        return res.status(200).body(JSON.stringify(data));
      });
    });

    afterEach(() => {
      xhrMock.teardown();
    });

    it('should keep client context values when "clientType" option is omitted', async () => {
      // Arrange
      const client = new Evolv(options);

      // Act
      client.initialize(uid);

      await client.getConfig(''); // Wait until configuration has been loaded

      // Assert
      expect(client.context.remoteContext).to.have.property('device');
      expect(client.context.remoteContext).to.have.property('platform');
    });

    it('should keep client context values when "clientType" option is "direct"', async () => {
      // Arrange
      const client = new Evolv({
        ...options,
        clientType: 'direct'
      });

      // Act
      client.initialize(uid);

      await client.getConfig(''); // Wait until configuration has been loaded

      // Assert
      expect(client.context.remoteContext).to.have.property('device');
      expect(client.context.remoteContext).to.have.property('platform');
    });

    it('should omit client context values when "clientType" option is "proxied"', async () => {
      // Arrange
      const client = new Evolv({
        ...options,
        clientType: 'proxied'
      });

      // Act
      client.initialize(uid);

      await client.getConfig(''); // Wait until configuration has been loaded

      // Assert
      expect(client.context.remoteContext).not.to.have.property('device');
      expect(client.context.remoteContext).not.to.have.property('platform');
    });

    it('should include the display names', async () => {
      // Arrange
      const client = new Evolv(options);

      // Act
      client.initialize(uid);

      let experiment = await client.getDisplayName('experiments', '0f39849197');

      // Assert
      expect(experiment).to.be.equal('Project A');
    });
  });

  describe('confirm()', () => {
    it('should properly confirm into allocated experiment once genome is updated', (done) => {
      store.activeEntryPoints = () => new Promise((resolve, reject) => { resolve(['1234']) });
      Object.defineProperty(store, 'configuration', { get: function() { return { foo: 'bar' }; }, });
      Object.defineProperty(store, 'activeEids', { get: function() { return new Set(['1234']); } });
      options.store = store;

      context.initialize();
      context.set("experiments.allocations", [{eid: '1234', cid: '5678'}]);
      options.context = context;

      waitFor(context, Evolv.CONFIRMED, () => {
        try {
          const confirmations = context.get('confirmations');
          expect(confirmations.length).to.be.equal(1);
          expect(confirmations[0].cid).to.be.equal('5678');
          done();
        } catch (err) {
          done(err);
        }
      });

      const client = new Evolv(options);
      client.confirm();
      emit(context, EFFECTIVE_GENOME_UPDATED, {});
    });

    it('should properly confirm into allocated experiment once genome is updated and entry point is true', (done) => {
      store.activeEntryPoints = () => new Promise((resolve, reject) => { resolve(['1234']) });
      Object.defineProperty(store, 'configuration', { get: function() { return { foo: 'bar' }; }, });
      Object.defineProperty(store, 'activeEids', { get: function() { return new Set(['1234','6666']); } });
      options.store = store;

      context.initialize();
      context.set("experiments.allocations", [{eid: '1234', cid: '5678'},{eid: '6666', cid: '7777'}]);
      options.context = context;

      waitFor(context, Evolv.CONFIRMED, () => {
        try {
          const confirmations = context.get('confirmations');
          expect(confirmations.length).to.be.equal(1);
          expect(confirmations[0].cid).to.be.equal('5678');
          done();
        } catch (err) {
          done(err);
        }
      });

      const client = new Evolv(options);
      client.confirm();
      emit(context, EFFECTIVE_GENOME_UPDATED, {});
    });
  });

  describe('contaminate()', () => {
    it('should contaminate once', () => {
      store.activeEntryPoints = () => new Promise((resolve, reject) => { resolve(['1234']) });
      Object.defineProperty(store, 'configuration', { get: function() { return { foo: 'bar' }; }, });
      Object.defineProperty(store, 'activeEids', { get: function() { return new Set(['1234']); } });
      options.store = store;

      context.initialize();
      context.set("experiments.allocations", [{eid: '1234', cid: '5678'}, {eid: '12345', cid: '678910'}]);
      options.context = context;

      const client = new Evolv(options);
      client.contaminate();

      expect(context.remoteContext.contaminations).to.be.lengthOf(1);
      expect(context.remoteContext.contaminations[0].cid).to.be.equal('5678');
    });

    it('should error if details, but no reason are included in the contamination', () => {
      store.activeEntryPoints = () => new Promise((resolve, reject) => { resolve(['1234']) });
      Object.defineProperty(store, 'configuration', { get: function() { return { foo: 'bar' }; }, });
      Object.defineProperty(store, 'activeEids', { get: function() { return new Set(['1234']); } });
      options.store = store;

      context.initialize();
      context.set("experiments.allocations", [{eid: '1234', cid: '5678'}]);
      options.context = context;

      const client = new Evolv(options);
      let correctlyErrored = false;
      try {
        client.contaminate({});
      } catch(err) {
        correctlyErrored = true;
      }

      expect(correctlyErrored).to.be.equal(true);
    });

    it('should should send the contamination details to the events endpoint', (done) => {
      store.activeEntryPoints = () => new Promise((resolve, reject) => { resolve(['1234']) });
      Object.defineProperty(store, 'configuration', { get: function() { return { foo: 'bar' }; }, });
      Object.defineProperty(store, 'activeEids', { get: function() { return new Set(['1234']); } });
      options.store = store;

      let contaminationDetails = {
        reason: 'broken',
        details: 'mistake'
      };

      context.initialize();
      context.set("experiments.allocations", [{eid: '1234', cid: '5678'}]);
      options.context = context;
      options.beacon = {
        emit: function(type, details) {
          expect(details.contaminationReason).to.equal(contaminationDetails);
          done();
        }
      };

      const client = new Evolv(options);

      client.contaminate(contaminationDetails);

      expect(context.remoteContext.contaminations).to.be.lengthOf(1);
      expect(context.remoteContext.contaminations[0].cid).to.be.equal('5678');
    });

    it('should not confirm into allocated experiments that have been contaminated', (done) => {
      store.activeEntryPoints = () => new Promise((resolve, reject) => { resolve(['1234']) });
      Object.defineProperty(store, 'configuration', { get: function() { return { foo: 'bar' }; }, });
      Object.defineProperty(store, 'activeEids', { get: function() { return new Set(['1234']); } });
      options.store = store;

      context.initialize();
      context.set("experiments.allocations", [{eid: '1234', cid: '5678'}, {eid: '12345', cid: '678910'}]);
      options.context = context;
      options.beacon = {
        emit: function(type, details) {
        },
        flush: function() {}
      };

      const client = new Evolv(options);
      client.contaminate();

      expect(context.remoteContext.experiments.contaminations).to.be.lengthOf(1);
      expect(context.remoteContext.experiments.contaminations[0].cid).to.be.equal('5678');

      client.confirm();

      waitFor(context, EFFECTIVE_GENOME_UPDATED, () => {
        setTimeout(() => { // Ensure we evaluate after the code waiting on EFFECTIVE_GENOME_UPDATE
          try {
            expect(context.remoteContext.experiments.contaminations).to.be.lengthOf(1);
            expect(context.remoteContext.experiments.contaminations[0].cid).to.be.equal('5678');
            expect(context.remoteContext.experiments.confirmations).to.be.undefined;
            done();
          } catch (err) {
            done(err);
          }
        }, 10);
      });

      client.confirm();
      emit(context, EFFECTIVE_GENOME_UPDATED, {});
    });

    it('should confirm into allocated experiments that have been contaminated after another contamination', (done) => {
      var activeEntryPoint = '1234';
      store.activeEntryPoints = () => new Promise((resolve, reject) => { resolve([activeEntryPoint]) });
      Object.defineProperty(store, 'configuration', { get: function() { return { foo: 'bar' }; }, });
      Object.defineProperty(store, 'activeEids', { get: function() { return new Set([activeEntryPoint]); } });
      options.store = store;

      context.initialize();
      context.set("experiments.allocations", [{eid: '1234', cid: '5678'}, {eid: '12345', cid: '678910'}]);
      options.context = context;
      options.beacon = {
        emit: function(type, details) {
        },
        flush: function() {}
      };

      const client = new Evolv(options);
      client.contaminate();

      expect(context.remoteContext.experiments.contaminations).to.be.lengthOf(1);
      expect(context.remoteContext.experiments.contaminations[0].cid).to.be.equal('5678');

      // Confirm into non contaminated cid
      waitFor(context, Evolv.CONFIRMED, () => {
        try {
          expect(context.remoteContext.experiments.contaminations).to.be.lengthOf(1);
          expect(context.remoteContext.experiments.contaminations[0].cid).to.be.equal('5678');
          expect(context.remoteContext.experiments.confirmations).to.be.lengthOf(1);
          expect(context.remoteContext.experiments.confirmations[0].cid).to.be.equal('678910');
          done();
        } catch (err) {
          done(err);
        }
      });

      activeEntryPoint = '12345';
      client.confirm();
      emit(context, EFFECTIVE_GENOME_UPDATED, {});
    });
  });

  it('should contaminate inactive eids when allExperiments is set to true', () => {
    store.activeEntryPoints = () => new Promise((resolve, reject) => { resolve(['1234']) });
    Object.defineProperty(store, 'configuration', { get: function() { return { foo: 'bar' }; }, });
    Object.defineProperty(store, 'activeEids', { get: function() { return new Set(['1234']); } });
    options.store = store;

    let contaminationDetails = {
      reason: 'broken',
      details: 'mistake'
    };

    context.initialize();
    context.set("experiments.allocations", [{eid: '1234', cid: '5678'}, {eid: '12345', cid: '678910'}])
    options.context = context;

    const client = new Evolv(options);
    client.contaminate(contaminationDetails, true);

    expect(context.remoteContext.contaminations).to.be.lengthOf(2);
    expect(context.remoteContext.contaminations[0].cid).to.be.equal('5678');
    expect(context.remoteContext.contaminations[1].cid).to.be.equal('678910');
  });

  describe('off()', () => {
    it('should remove listener from topic', async () => {
      // Arrange
      context.initialize('1234', { value: 0 });
      const client = new Evolv({ ...options, context, store });

      const spy1 = chai.spy();
      const spy2 = chai.spy();

      client.on('context.value.changed', spy1);
      client.on('context.value.changed', spy2);

      // Preconditions
      expect(spy1).to.have.been.called.exactly(0);
      expect(spy2).to.have.been.called.exactly(0);

      context.set('value', 1);
      expect(spy1).to.have.been.called.exactly(1);
      expect(spy2).to.have.been.called.exactly(1);

      // Act
      client.off('context.value.changed', spy2);
      context.set('value', 2);

      // Assert
      expect(spy1).to.have.been.called.exactly(2);
      expect(spy2).to.have.been.called.exactly(1);
    });
  });
});
