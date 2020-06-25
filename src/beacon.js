import retrieve from './retrieve.js';

const DELAY = 1;
const ENDPOINT_PATTERN = /\/(v\d+)\/\w+\/([a-z]+)$/i;

function fallbackBeacon(url, data, sync) {
  retrieve({
    method: 'post',
    url: url,
    data: data,
    sync: sync
  })
    .catch(function(err) {
      console.log(err);
    });
  return true;
}

export default function Emitter(endpoint, context) {
  const endpointMatch = endpoint.match(ENDPOINT_PATTERN);
  const v1Events = endpointMatch && endpointMatch[1] === 'v1' && endpointMatch[2] === 'events';

  let messages = [];
  let timer;

  function send(url, data, sync) {
    if (typeof window !== 'undefined' && window.navigator.sendBeacon) {
      // Chrome does not yet support this
      // const encoded = new Blob([data], { type: 'application/json; charset=UTF-8' });
      // return window.navigator.sendBeacon(url, encoded);
      return window.navigator.sendBeacon(url, data);
    } else {
      return fallbackBeacon(url, data, sync);
    }
  }

  function wrapMessages(msgs) {
    return {
      uid: context.uid,
      messages: msgs
    }
  }

  function transmit() {
    let sync = false;
    if (typeof this !== 'undefined') {
      const currentEvent = this.event && this.event.type;
      sync = currentEvent === 'unload' || currentEvent === 'beforeunload';
    }

    if (!messages.length) {
      return;
    }

    const batch = messages;
    messages = [];
    if (timer) {
      clearTimeout(timer);
    }
    timer = undefined;

    if (v1Events) {
      // change needed to support v1 of the participants api
      batch.forEach(function(message) {
        let editedMessage = message;
        editedMessage = message.payload || {};
        editedMessage.type = message.type;

        if (!send(endpoint, JSON.stringify(editedMessage), sync)) {
          messages.push(message);
          console.error('Evolv: Unable to send event beacon');
        }
      });
    } else if (!send(endpoint, JSON.stringify(wrapMessages(batch)), sync)) {
      messages = batch
      console.error('Evolv: Unable to send analytics beacon');
    }

    if (messages.length) {
      timer = setTimeout(transmit, DELAY);
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('unload', transmit);
    window.addEventListener('beforeunload', transmit);
  }

  this.emit = function(type, payload, flush) {
    messages.push({
      type,
      payload,
      sid: context.sid,
      timestamp: new Date().getTime(),
    });

    if (flush) {
      transmit();
      return;
    }

    if (!timer) {
      timer = setTimeout(transmit, DELAY);
    }
  };

  this.flush = transmit;
}
