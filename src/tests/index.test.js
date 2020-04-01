import chai from 'chai';
import spies from 'chai-spies';
import Evolv from '../index.js';

import xmlhttprequest from 'xmlhttprequest';
import _xhrMock from 'xhr-mock';
import webcrypto from 'webcrypto';
import {CONTEXT_INITIALIZED, CONTEXT_CHANGED} from "../context.js";
import base64 from "../ponyfills/base64.js";

chai.use(spies);
const expect = chai.expect;
const xhrMock = _xhrMock.default;


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

async function validateClient(evolv, options, uid, sid) {
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

    if (req.url().path.endsWith('analytics')) {
      analyticsPayloads.push(data);
    } else if (req.url().path.endsWith('events')) {
      eventPayloads.push(data);
    } else {
      res.status(500);
    }
    return res.status(202);
  };

  xhrMock.post(`${options.endpoint}/${options.environment}/analytics`, beaconHandler);

  xhrMock.post(`${options.endpoint}/${options.environment}/events`, beaconHandler);

  evolv.initialize(uid, sid, {
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
  expect(contextChangedSpy).to.have.been.called(3);

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
  expect((await evolv.getActiveKeys('web')).length).to.equal(0);

  evolv.confirm();

  evolv.context.set('user_attributes.country', 'usa');
  expect(contextChangedSpy).to.have.been.called(4);
  expect(await evolv.isActive('web.ab8numq2j')).to.be.true;
  expect(await evolv.get('web.ab8numq2j.am94yhwo2.id')).to.equal('2fxe5dy5j');
  expect((await evolv.get('web.ab8numq2j.am94yhwo2')).id).to.equal('2fxe5dy5j');
  expect(await evolv.isActive('web.7w3zpgfy9')).to.be.false;
  expect(await evolv.get('web.7w3zpgfy9.azevlvf5g')).to.be.an('undefined');
  expect(await evolv.getActiveKeys('web')).to.have.members([
    "web",
    "web.ab8numq2j",
    "web.ab8numq2j.am94yhwo2",
    "web.ab8numq2j.am94yhwo2.id",
    "web.ab8numq2j.am94yhwo2.type",
    "web.ab8numq2j.am94yhwo2.script",
    "web.ab8numq2j.am94yhwo2.styles"
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
  expect(contextChangedSpy).to.have.been.called(5);
  expect(await evolv.isActive('web.ab8numq2j')).to.be.false;
  expect(await evolv.get('web.ab8numq2j.am94yhwo2')).to.be.an('undefined');
  expect(await evolv.isActive('web.7w3zpgfy9')).to.be.true;
  expect(await evolv.get('web.7w3zpgfy9.azevlvf5g.type')).to.equal('noop');
  expect((await evolv.get('web.7w3zpgfy9.azevlvf5g')).type).to.equal('noop');
  expect(await evolv.getActiveKeys('web')).to.have.members([
    "web",
    "web.7w3zpgfy9",
    "web.7w3zpgfy9.azevlvf5g",
    "web.7w3zpgfy9.azevlvf5g.type",
  ]);

  evolv.confirm();

  evolv.context.remove('web.url');
  expect(contextChangedSpy).to.have.been.called(6);
  expect(await evolv.isActive('web.ab8numq2j')).to.be.false;
  expect(await evolv.get('web.ab8numq2j.am94yhwo2')).to.be.an('undefined');
  expect(await evolv.isActive('web.7w3zpgfy9')).to.be.false;
  expect(await evolv.get('web.7w3zpgfy9.azevlvf5g')).to.be.an('undefined');
  expect((await evolv.getActiveKeys()).length).to.equal(1);

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

describe('Evolv client', () => {
  beforeEach(() => {
    xhrMock.setup();
    // Uncomment to hit Frazer's endpoint
    // global.XMLHttpRequest = xmlhttprequest.XMLHttpRequest;
    global.crypto = webcrypto.crypto;
  });
  afterEach(() => {
    delete global.crypto;
    delete global.XMLHttpRequest;
    xhrMock.teardown();
  });

  describe('API v1', () => {
    it('should load variants and reevaluate context correctly', async () => {
      const uid = 123;
      const sid = 321;
      const environment = '579b106c73';
      const endpoint = 'https://participants-frazer.evolv.ai/';
      const version = 1

      let configSignature = null;
      let allocSignature = null;

      xhrMock.get(`${endpoint}v${version}/${environment}/configuration.json`, (req, res) => {
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

      xhrMock.post(`${endpoint}v${version}/${environment}/allocations`, (req, res) => {
        allocSignature = req.header('Signature');
        if (req.header('Content-Type') !== 'application/x-www-form-urlencoded') {
          return res.status(415);
        }

        if (req.method() !== 'POST') {
          return res.status(405);
        }

        return res.status(200).body(JSON.stringify([
          {
            uid: uid,
            sid: sid,
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

      await validateClient(evolv, options, uid, sid);

      expect(evolv.context.get('web.client.browser')).to.equal('chrome');
      expect(evolv.context.get('platform')).to.equal('windows');

      expect(configSignature).to.equal(null);
      expect(allocSignature).to.equal(null);
    });

    it('should load variants and reevaluate context correctly with authentication', async () => {
      const uid = 123;
      const sid = 321;
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

      xhrMock.get(`${endpoint}v${version}/${environment}/configuration.json`, (req, res) => {
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

      xhrMock.post(`${endpoint}v${version}/${environment}/allocations`, (req, res) => {
        allocSignature = req.header('Signature');
        allocBody = req.body() || '';
        return res.status(200).body(JSON.stringify([
          {
            uid: uid,
            sid: sid,
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

      await validateClient(evolv, options, uid, sid);

      const keys = {};
      keys[id] = secret;
      expect(await validateSignature(keys, configSignature, configBody)).to.be.true;
      expect(await validateSignature(keys, allocSignature, allocBody)).to.be.true;
    });
  });

  describe('API v2', () => {
    it('should load variants and reevaluate context correctly', async () => {
      const uid = 123;
      const sid = 321;
      const environment = '579b106c73';
      const endpoint = 'https://participants-frazer.evolv.ai/';
      const version = 2;

      xhrMock.get(`${endpoint}v${version}/${environment}/configuration.json`, (req, res) => {
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

      xhrMock.post(`${endpoint}v${version}/${environment}/allocations`, (req, res) => {
        return res.status(200).body(JSON.stringify([
          {
            uid: uid,
            sid: sid,
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
      };
      const evolv = new Evolv(options);

      const results = await validateClient(evolv, options, uid, sid);

      expect(results.analyticsPayloads.length).to.equal(6);
      expect(results.analyticsPayloads[5][0]).to.equal('context.value.removed');
      expect(results.eventPayloads.length).to.equal(4);
      expect(results.eventPayloads[0][0]).to.equal('confirmation');
      expect(results.eventPayloads[0][1].uid).to.equal(uid);
      expect(results.eventPayloads[0][1].sid).to.equal(sid);
      expect(results.eventPayloads[0][1].eid).to.equal('0f39849197');
      expect(results.eventPayloads[0][1].cid).to.equal('0cf8ffcedea2:0f39849197');
      expect(results.eventPayloads[1][0]).to.equal('lunch-time');
      expect(results.eventPayloads[1][1].metadata.score).to.equal(33);
      expect(results.eventPayloads[2][0]).to.equal('contamination');
      expect(results.eventPayloads[2][1].uid).to.equal(uid);
      expect(results.eventPayloads[2][1].sid).to.equal(sid);
      expect(results.eventPayloads[2][1].eid).to.equal('0f39849197');
      expect(results.eventPayloads[2][1].cid).to.equal('0cf8ffcedea2:0f39849197');
      expect(results.eventPayloads[3][0]).to.equal('confirmation');
      expect(results.eventPayloads[3][1].uid).to.equal(uid);
      expect(results.eventPayloads[3][1].sid).to.equal(sid);
      expect(results.eventPayloads[3][1].eid).to.equal('0f39849197');
      expect(results.eventPayloads[3][1].cid).to.equal('0cf8ffcedea2:0f39849197');
    });
  });
});
