import chai from 'chai';
import spies from 'chai-spies';

import Beacon, {DELAY, RETRIES} from '../beacon.js';

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
    global.window = { addEventListener: () => null , navigator: { sendBeacon: () => false } };
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
      const firstState = 9 + RETRIES - 1
      expect(spy).to.have.been.called(firstState);

      beacon.emit('error', '{msg', true)
      beacon.emit('error', '{msg', true)
      beacon.emit('error', '{msg', true)
      beacon.emit('error', '{msg', true)

      setTimeout(() => {
        const secondState = firstState + 4 + RETRIES - 1
        expect(spy).to.have.been.called(secondState);
        beacon.clearMessages();
        done()
      }, 500)
    }, 500)
  });

  describe('test batching', () => {
    let fakedEventTime1 = 1695166791533;
    let fakedEventTime2 = fakedEventTime1 + DELAY + 50;
    let sendBeacon;
    let originalDateNow;

    beforeEach(() => {
      originalDateNow = Date.now;

      const dateNowSpy = chai.spy(() => fakedEventTime1);
      Date.now = dateNowSpy;

      sendBeacon = chai.spy(() => true);
    });

    afterEach(() => {
      Date.now = originalDateNow;
    });

    it('should fire each message individual with flush true, sending all messages', () => {
      global.window = {addEventListener: () => null, navigator: {sendBeacon: sendBeacon}};
      const beacon = new Beacon(endpointV2, {uid: ''}, '');

      const numberOfCalls = 3;
      for (let i = 0; i < numberOfCalls; i++) {
        beacon.emit('test', {
          test: 'test' + i
        }, true);
      }

      expect(sendBeacon).to.have.been.called(numberOfCalls);
      expect(sendBeacon).to.have.been.called.with(endpointV2, JSON.stringify({
        "uid":"",
        "client":"javascript-sdk",
        "messages":[{
          "type":"test","payload":{"test":"test0"},
          "timestamp":fakedEventTime1
        }]
      }));

      expect(sendBeacon).to.have.been.called.with(endpointV2, JSON.stringify({
        "uid":"",
        "client":"javascript-sdk",
        "messages":[{
          "type":"test","payload":{"test":"test1"},
          "timestamp":fakedEventTime1
        }]
      }));

      expect(sendBeacon).to.have.been.called.with(endpointV2, JSON.stringify({
        "uid":"",
        "client":"javascript-sdk",
        "messages":[{
          "type":"test","payload":{"test":"test2"},
          "timestamp":fakedEventTime1
        }]
      }));
    });

    it('should batch the messages with flush false, sending all messages', async() => {
      global.window = {addEventListener: () => null, navigator: {sendBeacon: sendBeacon}};
      const beacon = new Beacon(endpointV2, {uid: ''}, '');

      const numberOfCalls = 3
      for (let i = 0; i < numberOfCalls; i++) {
        beacon.emit('test', {
          test: 'test' + i
        }, false);
      }

      await new Promise(resolve => setTimeout(resolve, DELAY + 100));

      expect(sendBeacon).to.have.been.called(1);
      expect(sendBeacon).to.have.been.called.with(endpointV2, JSON.stringify({
        "uid":"",
        "client":"javascript-sdk",
        "messages":[{
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
        }]
      }));
    });

    it('should batch the messages into 2 blocks with flush false, sending all messages', async() => {
      global.window = {addEventListener: () => null, navigator: {sendBeacon: sendBeacon}};
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

      expect(sendBeacon).to.have.been.called(2);
      expect(sendBeacon).to.have.been.called.with(endpointV2, JSON.stringify({
        "uid":"",
        "client":"javascript-sdk",
        "messages":[{
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
        }]
      }));

      expect(sendBeacon).to.have.been.called.with(endpointV2, JSON.stringify({
        "uid":"",
        "client":"javascript-sdk",
        "messages":[{
          "type": "test",
          "payload":{
            "test": "test2"
          },
          "timestamp":fakedEventTime2
        }, {
          "type": "test",
          "payload":{
            "test": "test3"
          },
          "timestamp":fakedEventTime2
        }]
      }));
    });
  });
});
