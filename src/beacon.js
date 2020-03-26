import retrieve from './retrieve.js';

const DELAY = 1;

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

export default function Emitter(endpoint) {
  let messages = [];
  let timer;

  function send(url, data, sync) {
    if (typeof window !== 'undefined' && window.navigator.sendBeacon) {
      return window.navigator.sendBeacon(url, data);
    } else {
      return fallbackBeacon(url, data, sync);
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

    batch.forEach(function(message) {
      const endpointMatch = endpoint.match(new RegExp('\\/(v\\d+)\\/\\w+\\/([a-z]+)$'));
      if (endpointMatch[2] === 'analytics' && endpointMatch[1] === 'v1') {
        return;
      }

      let editedMessage = message;
      if (endpointMatch[1] === 'v1') {
        // change needed to support v1 of the participants api
        editedMessage = message[1] || {};
        editedMessage.type = message[0];
      }

      if (!send(endpoint, JSON.stringify(editedMessage), sync)) {
        messages.push(message);
        console.error('Evolv: Unable to send beacon');
      }
    });

    if (messages.length) {
      timer = setTimeout(transmit, DELAY);
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('unload', transmit);
    window.addEventListener('beforeunload', transmit);
  }

  this.emit = function(type, data, flush) {
    messages.push([type, data]);
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
