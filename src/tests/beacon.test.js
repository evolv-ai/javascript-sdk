import chai from 'chai';
import spies from 'chai-spies';

import Beacon, {DELAY} from '../beacon.js';
import sinon from "sinon";

chai.use(spies);
const expect = chai.expect;
describe('beacon', () => {
  const endpointV2 = 'https://participants-frazer.evolv.ai/v2';
  beforeEach(() => {
    global.windowRef = global.window
  })
  afterEach(() => {
    global.window = global.windowRef
  })

  it('emit without infinite loop', (done) => {
    console.log('test start')
    const fetch = chai.spy(() => new Promise( resolve => resolve( { ok: false })));
    global.window = { addEventListener: () => null , fetch: fetch };
    const beacon = new Beacon(endpointV2, { uid: '' }, '');
    let spy = chai.spy.on(console, 'error')

    beacon.emit('error', '{msg', true)
    beacon.emit('error', '{msg', true)
    beacon.emit('error', '{msg', true)
    beacon.emit('error', '{msg', true)
    beacon.emit('error', '{msg', true)
    beacon.emit('error', '{msg', true)
    beacon.emit('error', '{msg', true)
    beacon.emit('error', '{msg', true)
    beacon.emit('error', '{msg', true)

    setTimeout(() => {
      const firstState = 9;
      expect(spy).to.have.been.called(firstState);

      beacon.emit('error', '{msg', true)
      beacon.emit('error', '{msg', true)
      beacon.emit('error', '{msg', true)
      beacon.emit('error', '{msg', true)

      setTimeout(() => {
        const secondState = firstState + 4;
        expect(spy).to.have.been.called(secondState);
        beacon.clearMessages();
        done()
      }, 500)
    }, 500)
  });

  describe('test batching', () => {
    let fakedEventTime1 = 1695166791533;
    let fakedEventTime2 = fakedEventTime1 + DELAY + 50;
    let fetch;
    let originalDateNow;

    const requestParams = {
      cache: 'no-cache',
      keepalive: true,
      method: 'GET'
    };

    function getMockParams(messages) {
      return new URLSearchParams(({
        "uid": "",
        "client": "javascript-sdk",
        "messages": JSON.stringify(messages)
      })).toString();
    }

    beforeEach(() => {
      originalDateNow = Date.now;

      const dateNowSpy = chai.spy(() => fakedEventTime1);
      Date.now = dateNowSpy;

      fetch = chai.spy(() => new Promise(resolve => resolve({ ok: true })));
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    it('should fire each message individual with flush true, sending all messages', () => {
      global.window = {addEventListener: () => null, fetch: fetch};
      const beacon = new Beacon(endpointV2, {uid: ''}, '');

      const numberOfCalls = 3;
      for (let i = 0; i < numberOfCalls; i++) {
        beacon.emit('test', {
          test: 'test' + i
        }, true);
      }

      expect(fetch).to.have.been.called(numberOfCalls);

      expect(fetch).to.have.been.called.with(endpointV2 + '?' + getMockParams([{
        type: 'test', payload: {test: 'test0'},
        timestamp: fakedEventTime1
      }]), requestParams);
      expect(fetch).to.have.been.called.with(endpointV2 + '?' + getMockParams([{
        type: 'test', payload: {test: 'test1'},
        timestamp: fakedEventTime1
      }]), requestParams);
      expect(fetch).to.have.been.called.with(endpointV2 + '?' + getMockParams([{
        type: 'test', payload: {test: 'test2'},
        timestamp: fakedEventTime1
      }]), requestParams);
    });

    it('should batch the messages with flush false, sending all messages', async() => {
      global.window = {addEventListener: () => null, fetch: fetch};
      const beacon = new Beacon(endpointV2, {uid: ''}, '');

      const numberOfCalls = 3
      for (let i = 0; i < numberOfCalls; i++) {
        beacon.emit('test', {
          test: 'test' + i
        }, false);
      }

      await new Promise(resolve => setTimeout(resolve, DELAY + 100));

      expect(fetch).to.have.been.called(1);
      expect(fetch).to.have.been.called.with(endpointV2 + '?' + getMockParams([{
        "type": "test",
        "payload": {
          "test": "test0"
        },
        "timestamp":fakedEventTime1
      }, {
        "type":"test",
        "payload":{
          "test": "test1"
        },
        "timestamp":fakedEventTime1
      }, {
        "type": "test",
        "payload":{
          "test": "test2"
        },
        "timestamp":fakedEventTime1
      }]), requestParams);
    });

    it('should batch the messages into 2 blocks with flush false, sending all messages - because of time', async() => {
      global.window = {addEventListener: () => null, fetch: fetch};
      const beacon = new Beacon(endpointV2, {uid: ''}, '');

      const numberOfCalls = 2
      let i;
      for (i = 0; i < numberOfCalls; i++) {
        beacon.emit('test', {
          test: 'test' + i
        }, false);
      }

      await new Promise(resolve => setTimeout(resolve, DELAY + 100));

      const dateNowSpy = chai.spy(() => fakedEventTime2);
      Date.now = dateNowSpy;

      for (let j = 0; j < numberOfCalls; j++) {
        beacon.emit('test', {
          test: 'test' + (j + i)
        }, false);
      }

      await new Promise(resolve => setTimeout(resolve, DELAY + 100));

      expect(fetch).to.have.been.called(2);

      expect(fetch).to.have.been.called.with(endpointV2 + '?' + getMockParams([{
        "type": "test",
        "payload": {
          "test": "test0"
        },
        "timestamp": fakedEventTime1
      }, {
        "type": "test",
        "payload": {
          "test": "test1"
        },
        "timestamp": fakedEventTime1
      }]), requestParams);

      expect(fetch).to.have.been.called.with(endpointV2 + '?' + getMockParams([{
        "type": "test",
        "payload": {
          "test": "test2"
        },
        "timestamp": fakedEventTime2
      }, {
        "type": "test",
        "payload": {
          "test": "test3"
        },
        "timestamp": fakedEventTime2
      }]), requestParams);
    });

    it('should batch the messages into 2 blocks with flush false, sending all messages - because of message size', async() => {
      global.window = {addEventListener: () => null, fetch: fetch};
      const beacon = new Beacon(endpointV2, {uid: ''}, '');

      const numberOfCalls = 50;
      let i;
      for (i = 0; i < numberOfCalls; i++) {
        beacon.emit('test', {
          test: 'test' + i
        }, false);
      }

      await new Promise(resolve => setTimeout(resolve, DELAY + 100));

      expect(fetch).to.have.been.called(4);

      const firstCall = [];
      const secondCall = [];
      const thirdCall = [];
      const fourthCall = [];
      let j, k, l, m;
      for (j = 0; j < 16; j++) {
        firstCall.push({
            "type": "test",
            "payload": {
            "test": "test" + j
          },
          "timestamp": fakedEventTime1
        });
      }

      for (k = 0; k < 16; k++) {
        secondCall.push({
          "type": "test",
          "payload": {
            "test": "test" + (j + k)
          },
          "timestamp": fakedEventTime1
        });
      }

      for (l = 0; l < 16; l++) {
        thirdCall.push({
          "type": "test",
          "payload": {
            "test": "test" + (j + k + l)
          },
          "timestamp": fakedEventTime1
        });
      }

      for (m = 0; m < 2; m++) {
        fourthCall.push({
          "type": "test",
          "payload": {
            "test": "test" + (j + k + l + m)
          },
          "timestamp": fakedEventTime1
        });
      }

      expect(fetch).to.have.been.called.with(endpointV2 + '?' + getMockParams(firstCall), requestParams);
      expect(fetch).to.have.been.called.with(endpointV2 + '?' + getMockParams(secondCall), requestParams);
      expect(fetch).to.have.been.called.with(endpointV2 + '?' + getMockParams(thirdCall), requestParams);
      expect(fetch).to.have.been.called.with(endpointV2 + '?' + getMockParams(fourthCall), requestParams);

      expect(numberOfCalls).to.equal(j + k + l + m);
    });
  });

  describe('test failover for unsuccessful fetch', () => {
    let xhrRequests;
    beforeEach(() => {
      global.XMLHttpRequest = sinon.useFakeXMLHttpRequest();
      xhrRequests = [];

      global.XMLHttpRequest.onCreate = function (xhr) {
        xhrRequests.push(xhr);
      };
    });

    afterEach(() => {
      global.XMLHttpRequest.restore();
    });

    it('should not failover to XHRPost if the fetch request returns ok', async() => {
      const fetch = chai.spy(() => new Promise( resolve => resolve( { ok: true })));
      global.window = {addEventListener: () => null, fetch: fetch};
      const beacon = new Beacon(endpointV2, {uid: ''}, '');

      beacon.emit('test', {
        test: 'test'
      }, true);

      expect(fetch).to.have.been.called(1);
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(xhrRequests.length).to.equal(0);
    });

    it('should failover to XHRPost if the fetch request returns not ok', async() => {
      const fetch = chai.spy(() => new Promise( resolve => resolve( { ok: false })));
      global.window = {addEventListener: () => null, fetch: fetch};
      const beacon = new Beacon(endpointV2, {uid: ''}, '');

      beacon.emit('test', {
        test: 'test'
      }, true);

      expect(fetch).to.have.been.called(1);
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(xhrRequests.length).to.equal(1);
      expect(JSON.parse(xhrRequests[0].requestBody).messages.length).to.equal(1);
    });

    it('should failover to XHRPost if the fetch request rejects', async() => {
      const fetch = chai.spy(() => new Promise( reject => reject()));
      global.window = {addEventListener: () => null, fetch: fetch};
      const beacon = new Beacon(endpointV2, {uid: ''}, '');

      beacon.emit('test', {
        test: 'test'
      }, true);

      expect(fetch).to.have.been.called(1);
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(xhrRequests.length).to.equal(1);
      expect(JSON.parse(xhrRequests[0].requestBody).messages.length).to.equal(1);
    });
  });

  describe('test individual too large message', () => {
    // TODO -- worth trying to test ahead of time?
  });
});
